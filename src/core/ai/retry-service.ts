/**
 * Centralized retry and error classification service for the AI Gateway.
 * Handles exponential backoff and determines if an error is transient (retryable)
 * or fatal (abort and fallback immediately).
 */

export class RetryService {
  /**
   * Evaluates an error message to determine if it is a rate limit or quota issue.
   */
  static isRateLimit(errorMsg: string): boolean {
    const msg = errorMsg.toLowerCase();
    return msg.includes('429') || 
           msg.includes('rate limit') || 
           msg.includes('too many requests') ||
           msg.includes('resource_exhausted');
  }

  /**
   * Evaluates if the error is a hard authentication/authorization failure.
   */
  static isAuthError(errorMsg: string): boolean {
    const msg = errorMsg.toLowerCase();
    return msg.includes('401') || 
           msg.includes('403') || 
           msg.includes('unauthorized') || 
           msg.includes('invalid api key') ||
           msg.includes('api_key_invalid');
  }

  /**
   * Evaluates if the error is related to quota exhaustion (billing).
   */
  static isQuotaExhausted(errorMsg: string): boolean {
    const msg = errorMsg.toLowerCase();
    return msg.includes('quota exceeded') || 
           msg.includes('insufficient_quota') || 
           msg.includes('billing');
  }

  /**
   * Evaluates if the error is a temporary server issue.
   */
  static isTransientError(errorMsg: string): boolean {
    const msg = errorMsg.toLowerCase();
    return msg.includes('503') || 
           msg.includes('502') || 
           msg.includes('500') || 
           msg.includes('timeout') || 
           msg.includes('fetch_error') ||
           msg.includes('enotfound');
  }

  /**
   * Should we retry this error on the SAME provider?
   */
  static shouldRetry(errorMsg: string): boolean {
    if (this.isAuthError(errorMsg)) return false; // Never retry auth
    if (this.isQuotaExhausted(errorMsg)) return false; // Quota requires human intervention or fallback
    
    // We retry rate limits and transient errors
    return this.isRateLimit(errorMsg) || this.isTransientError(errorMsg);
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
   */
  static getBackoffDelay(attempt: number, baseDelayMs: number = 1000): number {
    return baseDelayMs * Math.pow(2, attempt - 1);
  }
}
