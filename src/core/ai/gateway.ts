import { AiRegistry } from './registry';
import { AiHealth } from './health';
import { AiDiagnostics } from './diagnostics';
import { GenerateVisionOptions, NormalizedAiResponse, ModelManagementState } from './types';
import { RetryService } from './retry-service';
import { PROVIDER_FALLBACK_ORDER, buildProviderChain } from './fallback-chain';
import { BaseAiProvider } from './providers/base-provider';
import { CircuitBreakerService } from './circuit-breaker';
import { ApiKeyManager, decryptKey } from './api-key-manager';
import { JSONRepair } from './json-repair.js';
import { getDb, isDbAvailable } from '../db/client';

export interface DiagnosticTraceEntry {
  provider: string;
  model: string;
  keyType: string;
  keyLabel: string;
  status: number | string;
  message: string;
  latencyMs: number;
}

const modelManagementState: ModelManagementState = {};

export class Gateway {
  
  async generateMetadata(options: GenerateVisionOptions): Promise<NormalizedAiResponse> {
    const requestStart = Date.now();
    const isVision = !!(options.base64Image && options.base64Image.length > 0);
    const trace: DiagnosticTraceEntry[] = [];

    const primaryProvider = (options.provider && options.provider.trim().length > 0)
      ? options.provider
      : 'google-gemini';

    const STRICT_FALLBACK_CHAIN = [
      'google-gemini',
      'groq',
      'openrouter',
      'together',
      'mistral',
      'openai',
      'anthropic',
      'xai'
    ];
    
    // Build chain: Primary provider first, then strict order (omitting primary to avoid duplicate)
    const providersToTry = [
      primaryProvider,
      ...STRICT_FALLBACK_CHAIN.filter(p => p !== primaryProvider)
    ];
    
    let totalRetries = 0;
    let lastErrorObj: any = null;

    for (const providerId of providersToTry) {
      if (!CircuitBreakerService.isAllowed(providerId)) {
        trace.push({ provider: providerId, model: 'auto', keyType: 'none', keyLabel: 'N/A', status: 'SKIPPED', message: 'Circuit breaker open', latencyMs: 0 });
        continue;
      }

      let providerImpl: BaseAiProvider;
      try {
        providerImpl = AiRegistry.getProvider(providerId);
      } catch {
        continue;
      }

      let targetModel = options.model;
      if (targetModel && this.isModelDisabled(providerId, targetModel)) {
        targetModel = undefined;
      }
      if (!targetModel) {
        const adminDefault = this.getAdminDefaultModel(providerId);
        if (adminDefault && providerImpl.validateModel(adminDefault)) targetModel = adminDefault;
      }
      if (!targetModel || !providerImpl.validateModel(targetModel)) {
        targetModel = isVision ? providerImpl.getVisionModel() : providerImpl.getDefaultModel();
      }
      if (isVision && !providerImpl.supportsVision(targetModel)) {
        const visionChain = providerImpl.getVisionFallbackChain();
        const fallbackVision = visionChain.find(m => providerImpl.validateModel(m) && providerImpl.supportsVision(m));
        if (fallbackVision) {
          targetModel = fallbackVision;
        } else {
          trace.push({ provider: providerId, model: targetModel, keyType: 'none', keyLabel: 'N/A', status: 'SKIPPED', message: 'No vision model available', latencyMs: 0 });
          continue;
        }
      }

      let keyIterator: Array<{ id: string; key: string; label: string; type: 'user' | 'admin' | 'custom' | 'env' }> = [];

      if (options.customApiKey && options.customApiKey.trim().length > 0) {
        keyIterator = [{ id: 'custom', key: options.customApiKey.trim(), label: 'custom-key', type: 'custom' }];
      } else if (options.userId && isDbAvailable()) {
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const db = getDb();
            const userKeys = await db!.userApiKey.findMany({ where: { userId: options.userId, provider: providerId, isEnabled: true } });
            if (userKeys.length > 0) {
              keyIterator = userKeys.sort(() => Math.random() - 0.5).map(k => ({
                id: k.id, key: decryptKey(k.encryptedKey) || '', label: k.label, type: 'user' as const
              }));
            }
            break; // Success, exit retry loop
          } catch (err: any) {
            console.error(`[gateway] Attempt ${attempt} failed to fetch user keys:`, err?.message || err);
            if (attempt === 1) await new Promise(r => setTimeout(r, 200)); // wait and retry
          }
        }
      }
      
      if (keyIterator.length === 0) {
        const poolKeys = ApiKeyManager.getKeyIterator(providerId);
        if (poolKeys.length > 0) {
          keyIterator = poolKeys.map(k => ({ id: k.id, key: k.key, label: k.label, type: 'admin' as const }));
        } else if (providerImpl.isEnabled()) {
          keyIterator = [{ id: 'env', key: '', label: 'env-key', type: 'env' as const }];
        } else {
          trace.push({ provider: providerId, model: targetModel, keyType: 'none', keyLabel: 'N/A', status: 'SKIPPED', message: 'No API keys configured', latencyMs: 0 });
          continue;
        }
      }

      for (const { id: keyId, key: keyValue, label: keyLabel, type: keyType } of keyIterator) {
        const keyStart = Date.now();
        const mimeTypeToPass = isVision ? (options.mimeType || 'image/jpeg') : undefined;

        try {
          const response = await Promise.race([
            providerImpl.generateMetadata({
              ...options,
              model: targetModel,
              provider: providerId,
              customApiKey: (keyValue && keyValue.trim().length > 0) ? keyValue.trim() : undefined,
              mimeType: mimeTypeToPass
            }),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error(`TIMEOUT: Key "${keyLabel}" on ${providerId} timed out after 28s.`)), 28000)
            )
          ]);

          const keyLatency = Date.now() - keyStart;
          if (keyType === 'user' && isDbAvailable()) {
            try {
              getDb()!.userApiKey.update({
                where: { id: keyId },
                data: { lastSuccessAt: new Date(), lastUsedAt: new Date(), successCount: { increment: 1 }, totalRequests: { increment: 1 }, consecutiveFails: 0, isHealthy: true }
              }).catch(() => {});
            } catch {}
          } else if (keyType === 'admin') {
            ApiKeyManager.recordKeySuccess(keyId, keyLatency);
          }
          CircuitBreakerService.recordSuccess(providerId);
          AiHealth.recordSuccess(providerId, targetModel, response.latency);

          trace.push({ provider: providerId, model: targetModel, keyType, keyLabel, status: 'SUCCESS', message: 'OK', latencyMs: keyLatency });

          if (response.rawResponse) {
            response.parsedResponse = JSONRepair.parse(response.rawResponse, response.parsedResponse);
          }
          response.parsedResponse = JSONRepair.normalizeMetadata(response.parsedResponse);

          return { ...response, fallbackTriggered: providerId !== primaryProvider, retries: totalRetries, keySource: keyType, keyLabel, trace };

        } catch (err: any) {
          totalRetries++;
          const errMsg = err?.message || 'Unknown error';
          const latency = Date.now() - keyStart;
          
          trace.push({ provider: providerId, model: targetModel, keyType, keyLabel, status: 'FAILED', message: errMsg, latencyMs: latency });

          if (errMsg.includes('AUTH_ERROR')) {
            if (keyType === 'user' && isDbAvailable()) {
              try { getDb()!.userApiKey.update({ where: { id: keyId }, data: { isHealthy: false, isEnabled: false, lastErrorMessage: 'Auth Failed' } }).catch(() => {}); } catch {}
            } else if (keyType === 'admin') {
              ApiKeyManager.recordKeyFailure(keyId, 'auth_error', errMsg);
            }
            continue;
          } else if (errMsg.includes('QUOTA_EXHAUSTED') || RetryService.isQuotaExhausted(errMsg)) {
            if (keyType === 'user' && isDbAvailable()) {
              try { getDb()!.userApiKey.update({ where: { id: keyId }, data: { lastFailureAt: new Date(), failureCount: { increment: 1 }, consecutiveFails: { increment: 1 }, lastErrorMessage: 'Quota Exceeded' } }).catch(() => {}); } catch {}
            } else if (keyType === 'admin') {
              ApiKeyManager.recordKeyFailure(keyId, 'quota_exhausted', errMsg);
            }
            continue;
          } else if (errMsg.includes('RATE_LIMIT') || RetryService.isRateLimit(errMsg)) {
            if (keyType === 'user' && isDbAvailable()) {
              try { getDb()!.userApiKey.update({ where: { id: keyId }, data: { lastFailureAt: new Date(), failureCount: { increment: 1 }, rateLimitStatus: 'limited', lastErrorMessage: 'Rate Limited' } }).catch(() => {}); } catch {}
            } else if (keyType === 'admin') {
              ApiKeyManager.recordKeyFailure(keyId, 'rate_limit', errMsg, 60000);
            }
            continue;
          } else {
            if (keyType === 'admin') ApiKeyManager.recordKeyFailure(keyId, 'transient', errMsg);
            continue;
          }
        }
      }
      CircuitBreakerService.recordFailure(providerId);
    }

    // Include the diagnostic trace in the thrown error so ai-routes can parse it
    throw new Error(JSON.stringify({
      code: 'NO_FREE_PROVIDER_CONFIGURED',
      message: 'No active FREE AI provider found. Supported providers: Gemini, Groq, OpenRouter, Together, Mistral',
      trace
    }));
  }

  getHealth() { return AiHealth.getAllStats(); }
  getDiagnostics() { return AiDiagnostics.getLogs(); }
  getCircuitStatus() { return CircuitBreakerService.getAllCircuits(); }
  resetCircuit(providerId: string): void { CircuitBreakerService.reset(providerId); }
  getKeyPoolStats() { return ApiKeyManager.getAllPoolStats(); }
  
  getProviderOverview() {
    const allProviders = AiRegistry.getAllProviders();
    const healthStats = AiHealth.getAllStats();
    const circuits = CircuitBreakerService.getAllCircuits();
    const poolStats = ApiKeyManager.getAllPoolStats();

    return allProviders.map(p => {
      const pool = poolStats.find(s => s.provider === p.id) || ApiKeyManager.getPoolStats(p.id);
      const health = (healthStats as Record<string, any>)[p.id] || { status: 'online', latency: 0, successRate: 100, failureCount: 0, lastSuccess: null, lastFailure: null, lastHealthCheck: null };
      const circuit = circuits[p.id] || { state: 'closed', consecutiveFailures: 0, lastOpenedAt: null, lastStateChange: new Date().toISOString(), cooldownRemainingMs: 0 };
      const models = p.listModels().map(m => ({
        id: m.id, name: m.name, capabilities: m.capabilities, contextWindow: m.contextWindow,
        tier: m.tier || 'paid', deprecated: m.deprecated || false,
        isEnabled: !this.isModelDisabled(p.id, m.id), isDefault: this.getAdminDefaultModel(p.id) === m.id
      }));

      return { id: p.id, name: p.name, isEnvConfigured: p.isEnabled(), pool, health, circuit, models, lastHealthCheck: health.lastHealthCheck || null };
    });
  }

  isModelDisabled(providerId: string, modelId: string): boolean {
    const state = modelManagementState[providerId]?.[modelId];
    return state ? !state.isEnabled : false;
  }

  getAdminDefaultModel(providerId: string): string | null {
    const providerState = modelManagementState[providerId];
    if (!providerState) return null;
    const defaultEntry = Object.entries(providerState).find(([, state]) => state.isDefault);
    return defaultEntry ? defaultEntry[0] : null;
  }

  setModelEnabled(providerId: string, modelId: string, isEnabled: boolean): void {
    if (!modelManagementState[providerId]) modelManagementState[providerId] = {};
    if (!modelManagementState[providerId][modelId]) modelManagementState[providerId][modelId] = { isEnabled: true, isDefault: false };
    modelManagementState[providerId][modelId].isEnabled = isEnabled;
  }

  setDefaultModel(providerId: string, modelId: string): void {
    if (!modelManagementState[providerId]) modelManagementState[providerId] = {};
    for (const mId of Object.keys(modelManagementState[providerId])) modelManagementState[providerId][mId].isDefault = false;
    if (!modelManagementState[providerId][modelId]) {
      modelManagementState[providerId][modelId] = { isEnabled: true, isDefault: true };
    } else {
      modelManagementState[providerId][modelId].isDefault = true;
      modelManagementState[providerId][modelId].isEnabled = true;
    }
  }

  async validatePoolKey(keyId: string): Promise<{ valid: boolean; message: string; latencyMs?: number }> {
    const rawKey = ApiKeyManager.getRawKey(keyId);
    const providerId = ApiKeyManager.getKeyProvider(keyId);
    if (!rawKey || !providerId) return { valid: false, message: 'Key not found in pool.' };

    let providerImpl: BaseAiProvider;
    try { providerImpl = AiRegistry.getProvider(providerId); } catch { return { valid: false, message: `Provider ${providerId} not available.` }; }

    const start = Date.now();
    try {
      const result = await providerImpl.healthCheck();
      const latencyMs = Date.now() - start;

      if (result.isHealthy) {
        ApiKeyManager.recordKeySuccess(keyId, latencyMs);
      } else {
        const msgLower = result.message.toLowerCase();
        if (msgLower.includes('rate limit')) ApiKeyManager.recordKeyFailure(keyId, 'rate_limit', result.message);
        else if (msgLower.includes('quota') || msgLower.includes('billing')) ApiKeyManager.recordKeyFailure(keyId, 'quota_exhausted', result.message);
        else ApiKeyManager.recordKeyFailure(keyId, 'auth_error', result.message);
      }
      return { valid: result.isHealthy, message: result.message, latencyMs };
    } catch (err: any) {
      const errMsg = err?.message || 'Validation failed';
      ApiKeyManager.recordKeyFailure(keyId, 'transient', errMsg);
      return { valid: false, message: ApiKeyManager.sanitizeKeyFromMessage(errMsg), latencyMs: Date.now() - start };
    }
  }
}

export const AiGateway = new Gateway();
