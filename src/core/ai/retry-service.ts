/**
 * Centralized retry and error classification service for the AI Gateway.
 * Determines if an error is transient (retryable), a rate limit, quota issue,
 * auth failure, or timeout — enabling the gateway to make smart routing decisions.
 */

export class RetryService {
  /**
   * Evaluates an error message to determine if it is a rate limit issue.
   */
  static isRateLimit(errorMsg: string): boolean {
    const msg = (errorMsg || '').toLowerCase();
    return (
      msg.includes('429') ||
      msg.includes('rate limit') ||
      msg.includes('too many requests') ||
      msg.includes('resource_exhausted') ||
      msg.includes('rate_limit') ||
      msg.includes('ratelimit') ||
      msg.includes('requests per minute') ||
      msg.includes('requests per second') ||
      msg.includes('tokens per minute')
    );
  }

  /**
   * Evaluates if the error is a hard authentication/authorization failure.
   */
  static isAuthError(errorMsg: string): boolean {
    const msg = (errorMsg || '').toLowerCase();
    return (
      msg.includes('401') ||
      msg.includes('403') ||
      msg.includes('unauthorized') ||
      msg.includes('invalid api key') ||
      msg.includes('api_key_invalid') ||
      msg.includes('auth_error') ||
      msg.includes('authentication failed') ||
      msg.includes('permission denied') ||
      msg.includes('access denied')
    );
  }

  /**
   * Evaluates if the error is related to quota exhaustion (billing).
   */
  static isQuotaExhausted(errorMsg: string): boolean {
    const msg = (errorMsg || '').toLowerCase();
    return (
      msg.includes('quota exceeded') ||
      msg.includes('quota_exhausted') ||
      msg.includes('insufficient_quota') ||
      msg.includes('billing') ||
      msg.includes('daily limit') ||
      msg.includes('monthly limit') ||
      msg.includes('credits exhausted') ||
      msg.includes('credit balance') ||
      msg.includes('payment required') ||
      msg.includes('402')
    );
  }

  /**
   * Evaluates if the error is a timeout (gateway or provider level).
   */
  static isTimeout(errorMsg: string): boolean {
    const msg = (errorMsg || '').toLowerCase();
    return (
      msg.includes('timeout') ||
      msg.includes('timed out') ||
      msg.includes('aborted') ||
      msg.includes('abort') ||
      msg.includes('etimedout')
    );
  }

  /**
   * Evaluates if the error is a network/connection issue.
   */
  static isConnectionError(errorMsg: string): boolean {
    const msg = (errorMsg || '').toLowerCase();
    return (
      msg.includes('enotfound') ||
      msg.includes('econnrefused') ||
      msg.includes('econnreset') ||
      msg.includes('network error') ||
      msg.includes('fetch failed') ||
      msg.includes('fetch_error') ||
      msg.includes('failed to fetch') ||
      msg.includes('getaddrinfo')
    );
  }

  /**
   * Evaluates if the error is a temporary server-side issue (5xx).
   */
  static isTransientError(errorMsg: string): boolean {
    const msg = (errorMsg || '').toLowerCase();
    return (
      msg.includes('503') ||
      msg.includes('502') ||
      msg.includes('500') ||
      msg.includes('internal server error') ||
      msg.includes('service unavailable') ||
      msg.includes('bad gateway') ||
      msg.includes('overloaded')
    );
  }

  /**
   * Unified error classifier. Returns the error type for gateway routing.
   */
  static classifyError(errorMsg: string): 'auth_error' | 'rate_limit' | 'quota_exhausted' | 'timeout' | 'connection' | 'transient' | 'unknown' {
    if (this.isAuthError(errorMsg)) return 'auth_error';
    if (this.isQuotaExhausted(errorMsg)) return 'quota_exhausted';
    if (this.isRateLimit(errorMsg)) return 'rate_limit';
    if (this.isTimeout(errorMsg)) return 'timeout';
    if (this.isConnectionError(errorMsg)) return 'connection';
    if (this.isTransientError(errorMsg)) return 'transient';
    return 'unknown';
  }

  /**
   * Should we retry this error on the SAME provider?
   * Auth and quota errors → never retry (key/billing problem).
   * Rate limits, transients, timeouts, network → try next key.
   */
  static shouldRetry(errorMsg: string): boolean {
    if (this.isAuthError(errorMsg)) return false;
    if (this.isQuotaExhausted(errorMsg)) return false;
    return true;
  }

  /**
   * Wait for a given number of milliseconds (Exponential Backoff).
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get exponential backoff delay.
   * e.g., attempt 1 = 1000ms, attempt 2 = 2000ms, attempt 3 = 4000ms
   * Cap at 16s to avoid excessive waits.
   */
  static getBackoffDelay(attempt: number, baseDelayMs: number = 1000): number {
    return Math.min(16000, baseDelayMs * Math.pow(2, attempt - 1));
  }
}
