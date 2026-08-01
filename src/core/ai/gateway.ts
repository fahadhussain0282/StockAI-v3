import { AiRegistry } from './registry';
import { AiHealth } from './health';
import { AiDiagnostics } from './diagnostics';
import { GenerateVisionOptions, NormalizedAiResponse, ModelManagementState } from './types';
import { RetryService } from './retry-service';
import { PROVIDER_FALLBACK_ORDER, buildProviderChain } from './fallback-chain';
import { BaseAiProvider } from './providers/base-provider';
import { CircuitBreakerService } from './circuit-breaker';
import { ApiKeyManager, decryptKey } from './api-key-manager';
import { getDb, isDbAvailable } from '../db/client';

/**
 * StockAI Enterprise AI Gateway
 *
 * Architecture:
 *   For each provider in the fallback chain:
 *     Check circuit breaker (skip if open)
 *     For each healthy API key in the provider's key pool:
 *       → Try the request
 *       → On key failure: classify error, mark key, move to next key immediately
 *       → Never retry the same failing key
 *     → Only move to next provider when ALL keys for this provider exhausted
 *
 * Bug Fixes in this version:
 *   1. mimeType is no longer passed as 'image/jpeg' for text-only (no-image) requests
 *   2. options.provider defaults safely even if undefined
 *   3. Error message is always sanitized before throwing to client
 *   4. Timeout errors recorded as 'timeout' error type (not 'transient')
 */

// ─── In-memory model management state ────────────────────────────────────────
const modelManagementState: ModelManagementState = {};

export class Gateway {

  async generateVisionAnalysis(options: GenerateVisionOptions): Promise<NormalizedAiResponse> {
    const requestStart = Date.now();
    const isVision = !!(options.base64Image && options.base64Image.length > 0);

    // Build the ordered provider chain (primary first, then fallbacks)
    const primaryProvider = (options.provider && options.provider.trim().length > 0)
      ? options.provider
      : PROVIDER_FALLBACK_ORDER[0];
    // Load User Provider Settings if userId is present
    let rawChain = buildProviderChain(primaryProvider);
    if (options.userId && isDbAvailable()) {
      try {
        const db = getDb();
        if (db) {
          const settings = await db.userProviderSettings.findUnique({ where: { userId: options.userId } });
          if (settings && settings.fallbackOrder) {
            const userChain = JSON.parse(settings.fallbackOrder);
            if (Array.isArray(userChain) && userChain.length > 0) {
              // Reorder the fallback chain based on user preferences
              // Ensure primaryProvider is first if it's in the user's chain
              rawChain = [...new Set([primaryProvider, ...userChain, ...rawChain])];
            }
          }
        }
      } catch (err) {
        console.warn('[AI Gateway] Failed to load user provider settings', err);
      }
    }

    // Sort fallbacks by health score (primary stays first; fallbacks re-ordered by health)
    const [first, ...rest] = rawChain;
    const sortedFallbacks = rest.sort((a, b) => AiHealth.getHealthScore(b) - AiHealth.getHealthScore(a));
    const providersToTry = [first, ...sortedFallbacks];

    let lastErrorMsg = 'No providers attempted.';
    let totalRetries = 0;

    for (const providerId of providersToTry) {
      // ── Circuit Breaker check ──────────────────────────────────────────────
      if (!CircuitBreakerService.isAllowed(providerId)) {
        console.warn(`[AI Gateway] Skipping ${providerId} — circuit OPEN`);
        continue;
      }

      // ── Provider lookup ────────────────────────────────────────────────────
      let providerImpl: BaseAiProvider;
      try {
        providerImpl = AiRegistry.getProvider(providerId);
      } catch {
        console.warn(`[AI Gateway] Provider ${providerId} not in registry, skipping.`);
        continue;
      }

      // ── Model selection ────────────────────────────────────────────────────
      let targetModel = options.model;

      // If the requested model is admin-disabled, clear it so we auto-select
      if (targetModel && this.isModelDisabled(providerId, targetModel)) {
        console.warn(`[AI Gateway] Model "${targetModel}" is admin-disabled for ${providerId}. Auto-selecting.`);
        targetModel = undefined;
      }

      // Get admin-selected default model if exists
      if (!targetModel) {
        const adminDefault = this.getAdminDefaultModel(providerId);
        if (adminDefault && providerImpl.validateModel(adminDefault)) {
          targetModel = adminDefault;
        }
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
          console.warn(`[AI Gateway] Skipping ${providerId} — no vision model available`);
          continue;
        }
      }

      // ── Build API Key Iterator for this provider ───────────────────────────
      // CRITICAL: Check pool keys FIRST, then fall back to ENV.
      let keyIterator: Array<{ id: string; key: string; label: string; type: 'user' | 'admin' | 'custom' | 'env' }>;

      if (options.customApiKey && options.customApiKey.trim().length > 0) {
        // Single custom key — explicit user-provided key, treated as pool of 1
        keyIterator = [{ id: 'custom', key: options.customApiKey.trim(), label: 'custom-key', type: 'custom' }];
      } else if (options.userId && isDbAvailable()) {
        try {
          const db = getDb();
          const userKeys = await db!.userApiKey.findMany({
            where: { userId: options.userId, provider: providerId, isEnabled: true }
          });
          
          if (userKeys.length > 0) {
            // Apply simple random load balancing for now
            keyIterator = userKeys
              .sort(() => Math.random() - 0.5)
              .map(k => ({ id: k.id, key: decryptKey(k.encryptedKey), label: k.label, type: 'user' }));
          } else {
            console.log(`[AI Gateway] No User API keys found for ${providerId}, falling back to admin pool`);
            keyIterator = [];
          }
        } catch (err) {
          console.warn('[AI Gateway] Failed to fetch user keys, falling back to admin pool', err);
          keyIterator = [];
        }
      } 
      
      if (!keyIterator || keyIterator.length === 0) {
        // Fallback to enterprise key pool (Admin keys)
        const poolKeys = ApiKeyManager.getKeyIterator(providerId);
        if (poolKeys.length > 0) {
          // Use pool keys — all simultaneously active, ordered by health score
          keyIterator = poolKeys.map(k => ({ id: k.id, key: k.key, label: k.label, type: 'admin' }));
        } else if (providerImpl.isEnabled()) {
          // No pool keys, but ENV key exists — use it as implicit pool of 1
          keyIterator = [{ id: 'env', key: '', label: 'env-key', type: 'env' }];
        } else {
          // No pool keys and no ENV key — skip this provider
          console.warn(`[AI Gateway] Skipping ${providerId} — no API keys in pool and no ENV key`);
          continue;
        }
      }

      console.log(`[AI Gateway] Provider "${providerId}" — ${keyIterator.length} key(s) to try, model: ${targetModel}, vision: ${isVision}`);

      // ── Per-Key Failover Loop ──────────────────────────────────────────────
      for (const { id: keyId, key: keyValue, label: keyLabel, type: keyType } of keyIterator) {
        // Per-key timeout: 28 seconds to stay under server's 30s limit
        const keyStart = Date.now();

        // CRITICAL FIX: Only pass mimeType when there is actually an image
        // Previously this was always passed, confusing text-only providers
        const mimeTypeToPass = isVision ? (options.mimeType || 'image/jpeg') : undefined;

        try {
          const response = await Promise.race([
            providerImpl.generateVisionAnalysis({
              ...options,
              model: targetModel,
              provider: providerId,
              customApiKey: keyValue || undefined,
              mimeType: mimeTypeToPass
            }),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error(`TIMEOUT: Key "${keyLabel}" on ${providerId} timed out after 28s.`)), 28000)
            )
          ]);

          // ── KEY SUCCESS ────────────────────────────────────────────────────
          const keyLatency = Date.now() - keyStart;
          if (keyType === 'user') {
            try {
              getDb()!.userApiKey.update({
                where: { id: keyId },
                data: {
                  lastSuccessAt: new Date(),
                  lastUsedAt: new Date(),
                  successCount: { increment: 1 },
                  totalRequests: { increment: 1 },
                  consecutiveFails: 0,
                  isHealthy: true
                }
              }).catch(() => {});
            } catch {}
          } else if (keyType === 'admin') {
            ApiKeyManager.recordKeySuccess(keyId, keyLatency);
          }
          CircuitBreakerService.recordSuccess(providerId);

          const finalResponse: NormalizedAiResponse = {
            ...response,
            fallbackTriggered: providerId !== primaryProvider,
            retries: totalRetries
          };

          AiHealth.recordSuccess(providerId, targetModel, response.latency);
          this.logDiagnostics({
            ...options,
            requestStart,
            success: true,
            providerUsed: primaryProvider,
            modelUsed: options.model || 'auto',
            finalProvider: providerId,
            finalModel: targetModel,
            keyLabel: keyId !== 'env' ? keyLabel : 'env-key',
            response,
            retries: totalRetries,
            fallbackTriggered: providerId !== primaryProvider
          });

          return finalResponse;

        } catch (err: any) {
          const errMsg: string = (err instanceof Error ? err.message : String(err)) || 'Unknown provider error';
          lastErrorMsg = ApiKeyManager.sanitizeKeyFromMessage(errMsg);
          totalRetries++;

          console.warn(`[AI Gateway] Key "${keyLabel}" on ${providerId} failed: ${lastErrorMsg.substring(0, 200)}`);

          // ── Classify the error for this key ───────────────────────────────
          if (errMsg.includes('TIMEOUT') || RetryService.isTimeout(errMsg)) {
            if (keyType === 'user') {
              getDb()!.userApiKey.update({
                where: { id: keyId },
                data: { lastFailureAt: new Date(), failureCount: { increment: 1 }, consecutiveFails: { increment: 1 }, timeoutCount: { increment: 1 }, lastErrorMessage: 'Timeout' }
              }).catch(() => {});
            } else if (keyType === 'admin') {
              ApiKeyManager.recordKeyFailure(keyId, 'timeout', errMsg);
            }
            AiHealth.recordFailure(providerId, targetModel, 'error');
            console.warn(`[AI Gateway] TIMEOUT on key "${keyLabel}" — rotating to next key immediately.`);
            continue; // Next key — instant failover

          } else if (errMsg.includes('AUTH_ERROR') || RetryService.isAuthError(errMsg)) {
            // Auth failure → key is dead, mark unhealthy, skip to next key immediately
            if (keyType === 'user') {
              getDb()!.userApiKey.update({
                where: { id: keyId },
                data: { isHealthy: false, lastFailureAt: new Date(), failureCount: { increment: 1 }, lastErrorMessage: 'Auth Failed (Invalid Key)' }
              }).catch(() => {});
            } else if (keyType === 'admin') {
              ApiKeyManager.recordKeyFailure(keyId, 'auth_error', errMsg);
            }
            AiHealth.recordFailure(providerId, targetModel, 'auth_failure');
            console.warn(`[AI Gateway] AUTH_ERROR on key "${keyLabel}" — skipping to next key.`);
            continue; // Next key — instant failover

          } else if (errMsg.includes('QUOTA_EXHAUSTED') || RetryService.isQuotaExhausted(errMsg)) {
            // Quota exhausted → key is dead until billing reset
            if (keyType === 'user') {
              getDb()!.userApiKey.update({
                where: { id: keyId },
                data: { lastFailureAt: new Date(), failureCount: { increment: 1 }, consecutiveFails: { increment: 1 }, lastErrorMessage: 'Quota Exceeded' }
              }).catch(() => {});
            } else if (keyType === 'admin') {
              ApiKeyManager.recordKeyFailure(keyId, 'quota_exhausted', errMsg);
            }
            AiHealth.recordFailure(providerId, targetModel, 'quota_exhausted');
            console.warn(`[AI Gateway] QUOTA_EXHAUSTED on key "${keyLabel}" — skipping to next key.`);
            continue; // Next key — instant failover

          } else if (errMsg.includes('RATE_LIMIT') || RetryService.isRateLimit(errMsg)) {
            // Rate limit → key needs cooldown, skip to next key NOW (no wait)
            if (keyType === 'user') {
              getDb()!.userApiKey.update({
                where: { id: keyId },
                data: { lastFailureAt: new Date(), failureCount: { increment: 1 }, rateLimitStatus: 'limited', lastErrorMessage: 'Rate Limited' }
              }).catch(() => {});
            } else if (keyType === 'admin') {
              ApiKeyManager.recordKeyFailure(keyId, 'rate_limit', errMsg, 60000);
            }
            AiHealth.recordFailure(providerId, targetModel, 'rate_limited');
            console.warn(`[AI Gateway] RATE_LIMIT on key "${keyLabel}" — rotating to next key immediately.`);
            continue; // Next key — NO delay, instant failover

          } else if (RetryService.isConnectionError(errMsg)) {
            // Network / connection error — mark transient, try next key
            if (keyType === 'user') {
              getDb()!.userApiKey.update({
                where: { id: keyId },
                data: { lastFailureAt: new Date(), failureCount: { increment: 1 }, consecutiveFails: { increment: 1 }, lastErrorMessage: 'Server Error' }
              }).catch(() => {});
            } else if (keyType === 'admin') {
              ApiKeyManager.recordKeyFailure(keyId, 'connection', errMsg);
            }
            AiHealth.recordFailure(providerId, targetModel, 'error');
            console.warn(`[AI Gateway] CONNECTION_ERROR on key "${keyLabel}" — rotating to next key.`);
            continue; // Next key

          } else {
            // Transient error — record failure, try next key
            if (keyType === 'user') {
              getDb()!.userApiKey.update({
                where: { id: keyId },
                data: { lastFailureAt: new Date(), failureCount: { increment: 1 }, consecutiveFails: { increment: 1 }, lastErrorMessage: 'Server Error' }
              }).catch(() => {});
            } else if (keyType === 'admin') {
              ApiKeyManager.recordKeyFailure(keyId, 'transient', errMsg);
            }
            AiHealth.recordFailure(providerId, targetModel, 'error');
            console.warn(`[AI Gateway] TRANSIENT_ERROR on key "${keyLabel}" — rotating to next key.`);
            continue; // Next key — instant failover
          }
        }
      }

      // All keys for this provider exhausted — trip circuit if needed
      console.warn(`[AI Gateway] All keys exhausted for provider "${providerId}". Moving to next provider.`);
      CircuitBreakerService.recordFailure(providerId);
    }

    // ── ALL PROVIDERS FAILED ───────────────────────────────────────────────
    this.logDiagnostics({
      ...options,
      requestStart,
      success: false,
      providerUsed: primaryProvider,
      modelUsed: options.model || 'auto',
      error: lastErrorMsg,
      retries: totalRetries
    });

    // Always throw a structured error with a helpful message
    throw new Error(
      `StockAI Enterprise Gateway: All configured providers and API keys failed after ${totalRetries} attempt(s). ` +
      `Last error: ${lastErrorMsg}. ` +
      `Please verify your API keys in Settings > API Management or try again later.`
    );
  }

  // ── Health & Admin Methods ───────────────────────────────────────────────

  getHealth() {
    return AiHealth.getAllStats();
  }

  getDiagnostics() {
    return AiDiagnostics.getLogs();
  }

  getCircuitStatus() {
    return CircuitBreakerService.getAllCircuits();
  }

  resetCircuit(providerId: string): void {
    CircuitBreakerService.reset(providerId);
    console.log(`[AI Gateway] Circuit manually reset for ${providerId}`);
  }

  /** Returns per-provider key pool stats for the Admin dashboard */
  getKeyPoolStats() {
    return ApiKeyManager.getAllPoolStats();
  }

  /**
   * Returns a unified provider overview for the Admin dashboard.
   * Includes pool stats + circuit state + health stats + model management for all 6 providers.
   */
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
        id: m.id,
        name: m.name,
        capabilities: m.capabilities,
        contextWindow: m.contextWindow,
        tier: m.tier || 'paid',
        deprecated: m.deprecated || false,
        isEnabled: !this.isModelDisabled(p.id, m.id),
        isDefault: this.getAdminDefaultModel(p.id) === m.id
      }));

      return {
        id: p.id,
        name: p.name,
        isEnvConfigured: p.isEnabled(),
        pool,
        health,
        circuit,
        models,
        lastHealthCheck: health.lastHealthCheck || null
      };
    });
  }

  // ── Model Management ─────────────────────────────────────────────────────

  /** Check if a model is admin-disabled */
  isModelDisabled(providerId: string, modelId: string): boolean {
    const state = modelManagementState[providerId]?.[modelId];
    if (!state) return false; // Default: enabled
    return !state.isEnabled;
  }

  /** Get admin-selected default model for a provider (null = use provider default) */
  getAdminDefaultModel(providerId: string): string | null {
    const providerState = modelManagementState[providerId];
    if (!providerState) return null;
    const defaultEntry = Object.entries(providerState).find(([, state]) => state.isDefault);
    return defaultEntry ? defaultEntry[0] : null;
  }

  /** Toggle a model's enabled state */
  setModelEnabled(providerId: string, modelId: string, isEnabled: boolean): void {
    if (!modelManagementState[providerId]) {
      modelManagementState[providerId] = {};
    }
    if (!modelManagementState[providerId][modelId]) {
      modelManagementState[providerId][modelId] = { isEnabled: true, isDefault: false };
    }
    modelManagementState[providerId][modelId].isEnabled = isEnabled;
    console.log(`[AI Gateway] Model "${modelId}" for provider "${providerId}" set to ${isEnabled ? 'ENABLED' : 'DISABLED'}`);
  }

  /** Set the admin default model for a provider */
  setDefaultModel(providerId: string, modelId: string): void {
    if (!modelManagementState[providerId]) {
      modelManagementState[providerId] = {};
    }
    // Clear current default
    for (const mId of Object.keys(modelManagementState[providerId])) {
      modelManagementState[providerId][mId].isDefault = false;
    }
    // Set new default
    if (!modelManagementState[providerId][modelId]) {
      modelManagementState[providerId][modelId] = { isEnabled: true, isDefault: true };
    } else {
      modelManagementState[providerId][modelId].isDefault = true;
      modelManagementState[providerId][modelId].isEnabled = true; // Default must be enabled
    }
    console.log(`[AI Gateway] Default model for "${providerId}" set to "${modelId}"`);
  }

  /**
   * Validate a single API key in the pool by ID.
   * Uses the provider's validateKey() method — lightweight auth check.
   * Returns result without exposing the raw key.
   */
  async validatePoolKey(keyId: string): Promise<{ valid: boolean; message: string; latencyMs?: number }> {
    const rawKey = ApiKeyManager.getRawKey(keyId);
    const providerId = ApiKeyManager.getKeyProvider(keyId);

    if (!rawKey || !providerId) {
      return { valid: false, message: 'Key not found in pool.' };
    }

    let providerImpl: BaseAiProvider;
    try {
      providerImpl = AiRegistry.getProvider(providerId);
    } catch {
      return { valid: false, message: `Provider ${providerId} not available.` };
    }

    const start = Date.now();
    try {
      const result = await providerImpl.validateKey(rawKey);
      const latencyMs = Date.now() - start;

      if (result.valid) {
        ApiKeyManager.recordKeySuccess(keyId, latencyMs);
      } else {
        // Determine failure type from message
        const msgLower = result.message.toLowerCase();
        if (msgLower.includes('rate limit') || msgLower.includes('rate limited')) {
          ApiKeyManager.recordKeyFailure(keyId, 'rate_limit', result.message);
        } else if (msgLower.includes('quota') || msgLower.includes('billing')) {
          ApiKeyManager.recordKeyFailure(keyId, 'quota_exhausted', result.message);
        } else {
          ApiKeyManager.recordKeyFailure(keyId, 'auth_error', result.message);
        }
      }

      return { ...result, latencyMs };
    } catch (err: any) {
      const errMsg = err?.message || 'Validation failed';
      ApiKeyManager.recordKeyFailure(keyId, 'transient', errMsg);
      return { valid: false, message: ApiKeyManager.sanitizeKeyFromMessage(errMsg), latencyMs: Date.now() - start };
    }
  }

  private logDiagnostics(params: any) {
    const requestEnd = Date.now();
    const payloadSize = (params.base64Image?.length || 0) + (params.userPrompt?.length || 0);
    AiDiagnostics.record({
      requestStart: params.requestStart,
      requestEnd,
      latency: requestEnd - params.requestStart,
      payloadSize,
      imageSize: params.base64Image?.length || 0,
      promptSize: params.userPrompt?.length || 0,
      modelUsed: params.modelUsed,
      providerUsed: params.providerUsed,
      finalProvider: params.finalProvider,
      finalModel: params.finalModel,
      keyLabel: params.keyLabel,
      responseSize: params.response?.rawResponse?.length || 0,
      tokenUsage: params.response?.tokens || { prompt: 0, completion: 0, total: 0 },
      finishReason: params.response?.finishReason || (params.success ? 'unknown' : 'error'),
      success: params.success,
      error: params.error,
      fallbackTriggered: params.fallbackTriggered,
      retries: params.retries
    });
  }
}

export const AiGateway = new Gateway();
