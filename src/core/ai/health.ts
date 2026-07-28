import { AiProviderHealth } from './types';

class HealthTracker {
  private stats: Map<string, AiProviderHealth> = new Map();

  recordSuccess(providerId: string, latency: number) {
    const current = this.getStats(providerId);
    current.status = 'online';
    current.latency = latency;
    current.lastSuccess = new Date().toISOString();
    current.successRate = ((current.successRate * current.failureCount) + 100) / (current.failureCount + 1); // Simple running avg
    this.stats.set(providerId, current);
  }

  recordFailure(providerId: string) {
    const current = this.getStats(providerId);
    current.status = current.failureCount > 3 ? 'offline' : 'degraded';
    current.lastFailure = new Date().toISOString();
    current.failureCount++;
    current.successRate = ((current.successRate * (current.failureCount - 1))) / current.failureCount;
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
        successRate: 100
      });
    }
    return this.stats.get(providerId)!;
  }

  getAllStats(): Record<string, AiProviderHealth> {
    const result: Record<string, AiProviderHealth> = {};
    for (const [key, val] of this.stats.entries()) {
      result[key] = val;
    }
    return result;
  }
}

export const AiHealth = new HealthTracker();
