import { AiProviderHealth, ProviderStatusType } from './types';
import { CircuitBreakerService, CircuitState } from './circuit-breaker';

class HealthTracker {
  private stats: Map<string, AiProviderHealth> = new Map();

  recordSuccess(providerId: string, model: string, latency: number) {
    const current = this.getStats(providerId);
    current.lastSuccess = new Date().toISOString();
    current.totalRequests = (current.totalRequests || 0) + 1;

    // Smooth exponential moving average for latency (70% old, 30% new)
    current.latency = current.latency === 0
      ? latency
      : Math.round(current.latency * 0.7 + latency * 0.3);

    // Success rate — weighted by total requests
    const total = current.totalRequests || 1;
    current.successRate = Math.min(100, Math.round(((current.successRate * (total - 1)) + 100) / total));
    current.status = 'online';

    // Inform circuit breaker
    CircuitBreakerService.recordSuccess(providerId);

    this.stats.set(providerId, current);
  }

  recordFailure(providerId: string, model: string, errorType: 'auth_failure' | 'quota_exhausted' | 'rate_limited' | 'error') {
    const current = this.getStats(providerId);

    if (errorType === 'auth_failure') {
      current.status = 'no_key';
    } else if (errorType === 'quota_exhausted') {
      current.status = 'quota_exhausted';
    } else if (errorType === 'rate_limited') {
      current.status = 'rate_limited';
    } else {
      current.status = (current.failureCount || 0) > 3 ? 'offline' : 'degraded';
    }

    current.lastFailure = new Date().toISOString();
    current.failureCount = (current.failureCount || 0) + 1;
    current.totalRequests = (current.totalRequests || 0) + 1;

    if (!current.recentFailures) current.recentFailures = [];
    current.recentFailures.unshift(`[${new Date().toISOString()}] Model: ${model} | Type: ${errorType}`);
    if (current.recentFailures.length > 10) current.recentFailures.pop();

    // Degrade success rate
    const total = current.totalRequests || 1;
    current.successRate = Math.max(0, Math.round((current.successRate * (total - 1)) / total));

    // Inform circuit breaker (only for transient/network errors, not auth/quota)
    if (errorType === 'error' || errorType === 'rate_limited') {
      CircuitBreakerService.recordFailure(providerId);
    }

    this.stats.set(providerId, current);
  }

  getStats(providerId: string): AiProviderHealth {
    if (!this.stats.has(providerId)) {
      this.stats.set(providerId, {
        status: 'online',
        latency: 0,
        lastSuccess: null,
        lastFailure: null,
        failureCount: 0,
        successRate: 100,
        totalRequests: 0,
        fallbackCount: 0,
        recentFailures: []
      });
    }
    return this.stats.get(providerId)!;
  }

  getAllStats(): Record<string, AiProviderHealth & { circuitState?: CircuitState }> {
    const circuits = CircuitBreakerService.getAllCircuits();
    const result: Record<string, AiProviderHealth & { circuitState?: CircuitState }> = {};
    for (const [key, val] of this.stats.entries()) {
      result[key] = {
        ...val,
        circuitState: circuits[key]?.state || 'closed'
      };
    }
    return result;
  }

  /**
   * Scores a provider's health for intelligent request routing.
   * Lower score = worse health = deprioritize.
   */
  getHealthScore(providerId: string): number {
    const circuit = CircuitBreakerService.getState(providerId);
    if (circuit === 'open') return -100; // Never route here
    if (circuit === 'half-open') return 0; // Test only

    const stats = this.getStats(providerId);
    if (stats.status === 'no_key') return -50;
    if (stats.status === 'quota_exhausted') return -80;
    if (stats.status === 'offline') return -60;

    // Score from 0–100 based on success rate, penalised by latency
    const latencyPenalty = Math.min(50, (stats.latency || 0) / 100);
    return (stats.successRate || 100) - latencyPenalty;
  }
}

export const AiHealth = new HealthTracker();
