import { AiRegistry } from './registry';
import { AiHealth } from './health';
import { AiDiagnostics } from './diagnostics';
import { GenerateVisionOptions, NormalizedAiResponse, FallbackResult } from './types';
import { RetryService } from './retry-service';
import { PROVIDER_FALLBACK_ORDER, buildProviderChain } from './fallback-chain';
import { BaseAiProvider } from './providers/base-provider';
import { CircuitBreakerService } from './circuit-breaker';

export class Gateway {
  /**
   * Main entrypoint for vision metadata + text generation.
   * Features:
   *   - Circuit breaker per provider (open/half-open/closed)
   *   - Health-score-based provider prioritisation
   *   - Pre-flight key + capability validation
   *   - Automatic model fallback within a provider
   *   - Exponential backoff retry for transient errors
   *   - Cross-provider fallback on permanent failure
   */
  async generateVisionAnalysis(options: GenerateVisionOptions): Promise<NormalizedAiResponse> {
    const requestStart = Date.now();
    const isVision = !!options.base64Image;

    // Build the ordered provider chain (primary first, then fallbacks)
    const primaryProvider = options.provider || PROVIDER_FALLBACK_ORDER[0];
    const rawChain = buildProviderChain(primaryProvider);

    // Sort fallbacks by health score (primary stays first; fallbacks re-ordered by health)
    const [first, ...rest] = rawChain;
    const sortedFallbacks = rest.sort((a, b) => AiHealth.getHealthScore(b) - AiHealth.getHealthScore(a));
    const providersToTry = [first, ...sortedFallbacks];

    let lastErrorMsg = '';
    let totalRetries = 0;

    for (const providerId of providersToTry) {
      // ── Circuit Breaker check ──────────────────────────────────────────────
      if (!CircuitBreakerService.isAllowed(providerId)) {
        console.warn(`[AI Gateway] Skipping ${providerId} — circuit is OPEN (provider in cooldown)`);
        continue;
      }

      // ── Provider lookup ────────────────────────────────────────────────────
      let providerImpl: BaseAiProvider;
      try {
        providerImpl = AiRegistry.getProvider(providerId);
      } catch {
        continue; // Provider not in registry
      }

      // ── Pre-flight: API key check ──────────────────────────────────────────
      if (!providerImpl.hasApiKey(options.customApiKey)) {
        console.warn(`[AI Gateway] Skipping ${providerId} — no API key configured`);
        continue;
      }

      // ── Model selection ────────────────────────────────────────────────────
      let targetModel = options.model;
      if (!targetModel || !providerImpl.validateModel(targetModel)) {
        targetModel = isVision ? providerImpl.getVisionModel() : providerImpl.getDefaultModel();
      }

      if (isVision && !providerImpl.supportsVision(targetModel)) {
        const visionChain = providerImpl.getVisionFallbackChain();
        const fallbackVision = visionChain.find(
          m => providerImpl.validateModel(m) && providerImpl.supportsVision(m)
        );
        if (fallbackVision) {
          targetModel = fallbackVision;
        } else {
          console.warn(`[AI Gateway] Skipping ${providerId} — no vision model available`);
          continue;
        }
      }

      // ── Provider-level retry loop ──────────────────────────────────────────
      const maxRetries = options.maxRetries ?? 2;
      const baseDelay = options.retryDelayMs ?? 1000;
      let attempt = 1;

      while (attempt <= maxRetries + 1) {
        try {
          const response = await providerImpl.generateVisionAnalysis({
            ...options,
            model: targetModel,
            provider: providerId
          });

          // ── SUCCESS ────────────────────────────────────────────────────────
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
            response,
            retries: totalRetries,
            fallbackTriggered: providerId !== primaryProvider
          });

          return finalResponse;

        } catch (err: any) {
          const errMsg = err.message || 'Unknown provider error';
          lastErrorMsg = errMsg;

          // ── Auth error → skip to next provider immediately ─────────────────
          if (errMsg.includes('AUTH_ERROR') || RetryService.isAuthError(errMsg)) {
            console.warn(`[AI Gateway] Auth failure on ${providerId}. Skipping to next provider.`);
            AiHealth.recordFailure(providerId, targetModel, 'auth_failure');
            break;
          }

          // ── Quota exhausted → skip to next provider immediately ────────────
          if (errMsg.includes('QUOTA_EXHAUSTED') || RetryService.isQuotaExhausted(errMsg)) {
            console.warn(`[AI Gateway] Quota exhausted on ${providerId}. Skipping to next provider.`);
            AiHealth.recordFailure(providerId, targetModel, 'quota_exhausted');
            break;
          }

          // ── Rate limit → retry with backoff ───────────────────────────────
          if (RetryService.isRateLimit(errMsg) && attempt <= maxRetries) {
            console.warn(`[AI Gateway] Rate limit on ${providerId} (attempt ${attempt}/${maxRetries}). Retrying...`);
            AiHealth.recordFailure(providerId, targetModel, 'rate_limited');
            const delay = RetryService.getBackoffDelay(attempt, baseDelay);
            await RetryService.wait(delay);
            attempt++;
            totalRetries++;
            continue;
          }

          // ── Transient error → retry ────────────────────────────────────────
          if (RetryService.shouldRetry(errMsg) && attempt <= maxRetries) {
            console.warn(`[AI Gateway] Transient error on ${providerId} (attempt ${attempt}/${maxRetries}): ${errMsg}`);
            const delay = RetryService.getBackoffDelay(attempt, baseDelay);
            await RetryService.wait(delay);
            attempt++;
            totalRetries++;
            continue;
          }

          // ── Hard failure or max retries → record + try next provider ───────
          console.warn(`[AI Gateway] Provider ${providerId} failed permanently: ${errMsg}`);
          AiHealth.recordFailure(providerId, targetModel, 'error');
          break;
        }
      }
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

    throw new Error(
      `StockAI Enterprise Gateway: All configured providers failed. ` +
      `Last error: ${lastErrorMsg}. ` +
      `Please verify your API keys in Settings or try again later.`
    );
  }

  /**
   * Returns health stats for all providers including circuit state.
   */
  getHealth() {
    return AiHealth.getAllStats();
  }

  getDiagnostics() {
    return AiDiagnostics.getLogs();
  }

  /**
   * Returns the circuit breaker state for all providers.
   */
  getCircuitStatus() {
    return CircuitBreakerService.getAllCircuits();
  }

  /**
   * Admin: Reset a provider's circuit breaker manually.
   */
  resetCircuit(providerId: string): void {
    CircuitBreakerService.reset(providerId);
    console.log(`[AI Gateway] Circuit manually reset for ${providerId}`);
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
