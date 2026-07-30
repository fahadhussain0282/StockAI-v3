/**
 * StockAI Enterprise API Key Pool Manager
 *
 * Provides:
 *  - Unlimited API keys per provider (no hard cap)
 *  - Modular selection strategies: round-robin, LRU, health-based
 *  - Per-key health tracking (success/failure/latency/rateLimit/consecutiveFailures)
 *  - Automatic rotation on failure without user intervention
 *  - AES-256-GCM encryption for keys at rest in memory (when secret configured)
 *  - Fast failover: skip a bad key, don't retry it
 *  - Cooldown period for failed keys with automatic restore
 *  - Quota & rate-limit status tracking per key
 *  - Safe key exposure: raw key NEVER appears in logs, API responses, or UI
 */

import crypto from 'crypto';
import { getDb, isDbAvailable } from '../db/client';

// ─── Encryption Layer ─────────────────────────────────────────────────────────

const ENCRYPTION_ALGO = 'aes-256-gcm';
const ENCRYPTION_SECRET = process.env.STOCKAI_KEY_ENCRYPTION_SECRET;
const ENCRYPTION_ENABLED = !!(ENCRYPTION_SECRET && ENCRYPTION_SECRET.trim().length >= 32);

function encryptKey(plaintext: string): string {
  if (!ENCRYPTION_ENABLED || !ENCRYPTION_SECRET) return plaintext;
  try {
    const keyBuf = crypto.scryptSync(ENCRYPTION_SECRET.trim(), 'stockai-salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGO, keyBuf, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `enc:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
  } catch {
    return plaintext; // Fallback to plaintext if encryption fails
  }
}

function decryptKey(stored: string): string {
  if (!ENCRYPTION_ENABLED || !ENCRYPTION_SECRET || !stored.startsWith('enc:')) return stored;
  try {
    const parts = stored.split(':');
    if (parts.length !== 4) return stored;
    const [, ivHex, tagHex, encHex] = parts;
    const keyBuf = crypto.scryptSync(ENCRYPTION_SECRET.trim(), 'stockai-salt', 32);
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const encrypted = Buffer.from(encHex, 'hex');
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGO, keyBuf, iv);
    decipher.setAuthTag(tag);
    return decipher.update(encrypted) + decipher.final('utf8');
  } catch {
    return stored; // If decryption fails, return as-is (likely plaintext legacy key)
  }
}

// ─── Data Model ───────────────────────────────────────────────────────────────

export type KeySelectionStrategy = 'round-robin' | 'lru' | 'health-based';
export type KeyQuotaStatus = 'ok' | 'exhausted' | 'unknown';
export type KeyRateLimitStatus = 'ok' | 'limited' | 'unknown';

export interface PooledApiKey {
  id: string;
  provider: string;
  label: string;
  /** Stored as plaintext or encrypted (AES-256-GCM) — never log this */
  key: string;
  isEnabled: boolean;
  /** false after auth failure or manual disable */
  isHealthy: boolean;
  addedAt: string;
  lastUsedAt: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  /** Epoch ms when rate-limit cooldown expires (0 = not rate-limited) */
  rateLimitUntil: number;
  /** Epoch ms when auto-cooldown expires (0 = not in cooldown) */
  cooldownUntil: number;
  successCount: number;
  failureCount: number;
  totalRequests: number;
  avgLatencyMs: number;
  /** Number of consecutive failures without a success */
  consecutiveFailures: number;
  lastErrorMessage?: string;
  /** Quota status (billing) */
  quotaStatus: KeyQuotaStatus;
  /** Rate limit status */
  rateLimitStatus: KeyRateLimitStatus;
  /** Timeout failure count */
  timeoutCount: number;
  /** Rate limit hit count */
  rateLimitCount: number;
}

export interface KeyPoolStats {
  provider: string;
  totalKeys: number;
  enabledKeys: number;
  healthyKeys: number;
  rateLimitedKeys: number;
  disabledKeys: number;
  failedKeys: number;
  availableKeys: number;
  strategy: KeySelectionStrategy;
  rotationIndex: number;
  avgSuccessRate: number;
  avgLatencyMs: number;
}

// ─── In-Memory Key Store ──────────────────────────────────────────────────────

const keyStore = new Map<string, PooledApiKey[]>(); // provider -> keys[]
const rotationIndex = new Map<string, number>();     // provider -> round-robin index
const providerStrategy = new Map<string, KeySelectionStrategy>();

// ─── Constants ───────────────────────────────────────────────────────────────

/** After this many consecutive failures, put the key in cooldown */
const CONSECUTIVE_FAILURE_THRESHOLD = 3;
/** Duration of automatic cooldown in ms (2 minutes) */
const AUTO_COOLDOWN_MS = 120_000;
/** Rate limit cooldown (1 minute default) */
const RATE_LIMIT_COOLDOWN_MS = 60_000;

// ─── Key Pool Manager ─────────────────────────────────────────────────────────

export class ApiKeyManager {

  // ── Encryption status ────────────────────────────────────────────────────

  static isEncryptionEnabled(): boolean {
    return ENCRYPTION_ENABLED;
  }

  // ── Strategy Management ──────────────────────────────────────────────────

  static setStrategy(provider: string, strategy: KeySelectionStrategy): void {
    providerStrategy.set(provider, strategy);
  }

  static getStrategy(provider: string): KeySelectionStrategy {
    return providerStrategy.get(provider) || 'health-based';
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────

  static addKey(provider: string, key: string, label?: string): PooledApiKey {
    if (!keyStore.has(provider)) keyStore.set(provider, []);
    const pool = keyStore.get(provider)!;

    // Prevent duplicate keys (compare raw keys)
    if (pool.some(k => decryptKey(k.key) === key.trim())) {
      throw new Error(`API key already exists for provider ${provider}.`);
    }

    const storedKey = encryptKey(key.trim());

    const newKey: PooledApiKey = {
      id: `key_${provider}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      provider,
      label: label || this.maskKey(key),
      key: storedKey,
      isEnabled: true,
      isHealthy: true,
      addedAt: new Date().toISOString(),
      lastUsedAt: null,
      lastSuccessAt: null,
      lastFailureAt: null,
      rateLimitUntil: 0,
      cooldownUntil: 0,
      successCount: 0,
      failureCount: 0,
      totalRequests: 0,
      avgLatencyMs: 0,
      consecutiveFailures: 0,
      quotaStatus: 'unknown',
      rateLimitStatus: 'unknown',
      timeoutCount: 0,
      rateLimitCount: 0
    };

    pool.push(newKey);
    console.log(`[KeyPool] Added key "${newKey.label}" for provider "${provider}" (pool size: ${pool.length}, encrypted: ${ENCRYPTION_ENABLED})`);
    return newKey;
  }

  static editKey(keyId: string, updates: { label?: string; key?: string; isEnabled?: boolean }): PooledApiKey | null {
    for (const [, pool] of keyStore) {
      const key = pool.find(k => k.id === keyId);
      if (key) {
        if (updates.label !== undefined) key.label = updates.label;
        if (updates.key !== undefined) {
          key.key = encryptKey(updates.key.trim());
          // Reset health on key change
          key.isHealthy = true;
          key.rateLimitUntil = 0;
          key.failureCount = 0;
          key.consecutiveFailures = 0;
          key.cooldownUntil = 0;
          key.lastErrorMessage = undefined;
          key.quotaStatus = 'unknown';
          key.rateLimitStatus = 'unknown';
          key.timeoutCount = 0;
          key.rateLimitCount = 0;
        }
        if (updates.isEnabled !== undefined) {
          key.isEnabled = updates.isEnabled;
          if (updates.isEnabled) {
            // Re-enable resets health
            key.isHealthy = true;
            key.consecutiveFailures = 0;
            key.cooldownUntil = 0;
          }
        }
        return key;
      }
    }
    return null;
  }

  static deleteKey(keyId: string): boolean {
    for (const [provider, pool] of keyStore) {
      const idx = pool.findIndex(k => k.id === keyId);
      if (idx !== -1) {
        pool.splice(idx, 1);
        console.log(`[KeyPool] Deleted key ${keyId} from provider ${provider}`);
        return true;
      }
    }
    return false;
  }

  static enableKey(keyId: string): void {
    const key = this.findKeyById(keyId);
    if (key) {
      key.isEnabled = true;
      key.isHealthy = true;
      key.rateLimitUntil = 0;
      key.consecutiveFailures = 0;
      key.cooldownUntil = 0;
    }
  }

  static disableKey(keyId: string): void {
    const key = this.findKeyById(keyId);
    if (key) key.isEnabled = false;
  }

  /** Reset a single failed key back to healthy (admin override) */
  static resetKey(keyId: string): boolean {
    const key = this.findKeyById(keyId);
    if (!key) return false;
    key.isHealthy = true;
    key.consecutiveFailures = 0;
    key.cooldownUntil = 0;
    key.rateLimitUntil = 0;
    key.lastErrorMessage = undefined;
    key.quotaStatus = 'unknown';
    key.rateLimitStatus = 'unknown';
    console.log(`[KeyPool] Key "${key.label}" (${key.provider}) manually reset to HEALTHY`);
    return true;
  }

  /** Reset all failed/unhealthy keys for a provider (admin bulk restore) */
  static resetFailedKeys(provider: string): number {
    const pool = keyStore.get(provider) || [];
    let count = 0;
    for (const key of pool) {
      if (key.isEnabled && (!key.isHealthy || key.cooldownUntil > 0 || key.rateLimitUntil > 0)) {
        key.isHealthy = true;
        key.consecutiveFailures = 0;
        key.cooldownUntil = 0;
        key.rateLimitUntil = 0;
        key.lastErrorMessage = undefined;
        key.quotaStatus = 'unknown';
        key.rateLimitStatus = 'unknown';
        count++;
      }
    }
    if (count > 0) {
      console.log(`[KeyPool] Bulk-reset ${count} failed/cooldown keys for provider "${provider}"`);
    }
    return count;
  }

  static listKeys(provider: string): PooledApiKey[] {
    return keyStore.get(provider) || [];
  }

  static listAllKeys(): Map<string, PooledApiKey[]> {
    return keyStore;
  }

  // ── Key Selection (Rotation) ──────────────────────────────────────────────

  /**
   * Returns true if a key is available for requests right now.
   * A key is available if: enabled + healthy + not rate-limited + not in cooldown.
   */
  private static isKeyAvailable(k: PooledApiKey, now: number): boolean {
    return k.isEnabled && k.isHealthy && k.rateLimitUntil < now && k.cooldownUntil < now;
  }

  /**
   * Returns the next available API key for a provider using the configured strategy.
   * Skips disabled, unhealthy, rate-limited, and cooldown keys.
   * Returns null if no healthy key is available.
   */
  static getNextKey(provider: string, excludeKeyIds: Set<string> = new Set()): PooledApiKey | null {
    const pool = keyStore.get(provider) || [];
    const now = Date.now();

    // Filter to available keys
    const available = pool.filter(k =>
      this.isKeyAvailable(k, now) && !excludeKeyIds.has(k.id)
    );

    if (available.length === 0) return null;

    const strategy = this.getStrategy(provider);

    if (strategy === 'round-robin') {
      const idx = (rotationIndex.get(provider) || 0) % available.length;
      rotationIndex.set(provider, idx + 1);
      return available[idx];
    }

    if (strategy === 'lru') {
      // Least Recently Used: pick the key with the oldest lastUsedAt
      return available.sort((a, b) => {
        const aT = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
        const bT = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
        return aT - bT;
      })[0];
    }

    // health-based (default): highest success rate + lowest consecutive failures
    return available.sort((a, b) => {
      const aScore = this.computeKeyHealthScore(a);
      const bScore = this.computeKeyHealthScore(b);
      if (Math.abs(aScore - bScore) > 5) return bScore - aScore;
      // Tie-break: LRU
      const aT = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
      const bT = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
      return aT - bT;
    })[0];
  }

  /**
   * Returns an ordered iterator of all available keys for a provider
   * to allow exhaustive fast-failover within the provider.
   * Ordered by health score (best first).
   * Returns RAW (decrypted) key values for use in provider calls.
   */
  static getKeyIterator(provider: string): PooledApiKey[] {
    const pool = keyStore.get(provider) || [];
    const now = Date.now();
    const strategy = this.getStrategy(provider);

    const available = pool.filter(k => this.isKeyAvailable(k, now));

    if (strategy === 'round-robin') {
      // Round-robin from current rotation position
      const startIdx = (rotationIndex.get(provider) || 0) % Math.max(available.length, 1);
      return [
        ...available.slice(startIdx),
        ...available.slice(0, startIdx)
      ].map(k => ({ ...k, key: decryptKey(k.key) }));
    }

    if (strategy === 'lru') {
      return [...available].sort((a, b) => {
        const aT = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
        const bT = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
        return aT - bT;
      }).map(k => ({ ...k, key: decryptKey(k.key) }));
    }

    // health-based: best score first
    return [...available].sort((a, b) =>
      this.computeKeyHealthScore(b) - this.computeKeyHealthScore(a)
    ).map(k => ({ ...k, key: decryptKey(k.key) }));
  }

  // ── Health Score ──────────────────────────────────────────────────────────

  /**
   * Compute a 0–100 health score for an individual API key.
   * Higher = healthier = preferred for routing.
   */
  static computeKeyHealthScore(key: PooledApiKey): number {
    if (!key.isEnabled) return -100;
    if (!key.isHealthy) return -50;
    if (key.quotaStatus === 'exhausted') return -60;
    const now = Date.now();
    if (key.rateLimitUntil >= now) return -10;
    if (key.cooldownUntil >= now) return -20;

    // Base score from success rate
    const successRate = key.totalRequests > 0
      ? (key.successCount / key.totalRequests) * 100
      : 100; // New keys assumed healthy

    // Penalize for consecutive failures
    const failurePenalty = Math.min(40, key.consecutiveFailures * 10);

    // Penalize for high latency (>3000ms = -20 points max)
    const latencyPenalty = Math.min(20, (key.avgLatencyMs || 0) / 150);

    // Penalize for timeouts
    const timeoutPenalty = Math.min(15, (key.timeoutCount || 0) * 3);

    return Math.max(0, Math.round(successRate - failurePenalty - latencyPenalty - timeoutPenalty));
  }

  // ── Health Reporting ──────────────────────────────────────────────────────

  static recordKeySuccess(keyId: string, latencyMs: number): void {
    const key = this.findKeyById(keyId);
    if (!key) return;
    key.successCount++;
    key.totalRequests++;
    key.lastSuccessAt = new Date().toISOString();
    key.lastUsedAt = new Date().toISOString();
    key.isHealthy = true;
    key.rateLimitUntil = 0;
    key.cooldownUntil = 0;
    key.consecutiveFailures = 0; // Reset on success
    key.quotaStatus = 'ok';
    key.rateLimitStatus = 'ok';
    // Exponential moving average for latency
    key.avgLatencyMs = key.avgLatencyMs === 0
      ? latencyMs
      : Math.round(key.avgLatencyMs * 0.8 + latencyMs * 0.2);
  }

  static recordKeyFailure(
    keyId: string,
    errorType: 'auth_error' | 'rate_limit' | 'quota_exhausted' | 'transient' | 'timeout' | 'connection',
    errorMessage?: string,
    rateLimitCooldownMs = RATE_LIMIT_COOLDOWN_MS
  ): void {
    const key = this.findKeyById(keyId);
    if (!key) return;
    key.failureCount++;
    key.totalRequests++;
    key.lastFailureAt = new Date().toISOString();
    key.lastUsedAt = new Date().toISOString();
    key.consecutiveFailures++;
    key.lastErrorMessage = errorMessage ? this.sanitizeKeyFromMessage(errorMessage) : undefined;

    if (errorType === 'auth_error') {
      // Permanent failure — mark unhealthy until admin re-enables
      key.isHealthy = false;
      console.warn(`[KeyPool] Key "${key.label}" (${key.provider}) marked UNHEALTHY: auth_error`);
    } else if (errorType === 'quota_exhausted') {
      // Quota exhausted — mark unhealthy + track quota status
      key.isHealthy = false;
      key.quotaStatus = 'exhausted';
      console.warn(`[KeyPool] Key "${key.label}" (${key.provider}) marked UNHEALTHY: quota_exhausted`);
    } else if (errorType === 'rate_limit') {
      // Temporary — cool down for 60s
      key.rateLimitUntil = Date.now() + rateLimitCooldownMs;
      key.rateLimitStatus = 'limited';
      key.rateLimitCount = (key.rateLimitCount || 0) + 1;
      console.warn(`[KeyPool] Key "${key.label}" (${key.provider}) rate-limited for ${rateLimitCooldownMs / 1000}s`);
    } else if (errorType === 'timeout') {
      // Timeout — count and apply backoff
      key.timeoutCount = (key.timeoutCount || 0) + 1;
      if (key.consecutiveFailures >= CONSECUTIVE_FAILURE_THRESHOLD) {
        key.cooldownUntil = Date.now() + AUTO_COOLDOWN_MS;
        console.warn(
          `[KeyPool] Key "${key.label}" (${key.provider}) auto-cooldown after ${key.consecutiveFailures} consecutive timeouts`
        );
      }
    } else {
      // Transient / connection — count failure; if consecutive threshold hit, auto-cooldown
      if (key.consecutiveFailures >= CONSECUTIVE_FAILURE_THRESHOLD) {
        key.cooldownUntil = Date.now() + AUTO_COOLDOWN_MS;
        console.warn(
          `[KeyPool] Key "${key.label}" (${key.provider}) auto-cooldown for ${AUTO_COOLDOWN_MS / 1000}s ` +
          `(${key.consecutiveFailures} consecutive failures)`
        );
      }
    }
  }

  static getPoolStats(provider: string): KeyPoolStats {
    const pool = keyStore.get(provider) || [];
    const now = Date.now();

    const enabledPool = pool.filter(k => k.isEnabled);
    const successRates = enabledPool.filter(k => k.totalRequests > 0)
      .map(k => Math.round((k.successCount / k.totalRequests) * 100));
    const avgSuccessRate = successRates.length > 0
      ? Math.round(successRates.reduce((a, b) => a + b, 0) / successRates.length)
      : 100;

    const latencies = enabledPool.filter(k => k.avgLatencyMs > 0).map(k => k.avgLatencyMs);
    const avgLatencyMs = latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : 0;

    return {
      provider,
      totalKeys: pool.length,
      enabledKeys: pool.filter(k => k.isEnabled).length,
      healthyKeys: pool.filter(k => this.isKeyAvailable(k, now)).length,
      rateLimitedKeys: pool.filter(k => k.isEnabled && k.rateLimitUntil >= now).length,
      disabledKeys: pool.filter(k => !k.isEnabled).length,
      failedKeys: pool.filter(k => k.isEnabled && (!k.isHealthy || k.cooldownUntil >= now)).length,
      availableKeys: pool.filter(k => this.isKeyAvailable(k, now)).length,
      strategy: this.getStrategy(provider),
      rotationIndex: rotationIndex.get(provider) || 0,
      avgSuccessRate,
      avgLatencyMs
    };
  }

  static getAllPoolStats(): KeyPoolStats[] {
    const providers = ['google-gemini', 'openai', 'anthropic', 'groq', 'xai', 'openrouter'];
    return providers.map(p => this.getPoolStats(p));
  }

  // ── Seed from environment variables ──────────────────────────────────────

  /**
   * On server startup, seed the key pool with any keys that are
   * already configured via environment variables. These act as the
   * default "slot 0" keys for each provider.
   */
  static seedFromEnvironment(): void {
    const envMap: Record<string, string[]> = {
      'google-gemini': ['GEMINI_API_KEY'],
      'openai': ['OPENAI_API_KEY'],
      'anthropic': ['ANTHROPIC_API_KEY'],
      'groq': ['GROQ_API_KEY'],
      'xai': ['XAI_API_KEY'],
      'openrouter': ['OPENROUTER_API_KEY']
    };

    let seededTotal = 0;
    for (const [provider, envVars] of Object.entries(envMap)) {
      for (const envVar of envVars) {
        const val = process.env[envVar];
        if (val && val.trim().length > 0) {
          const pool = keyStore.get(provider) || [];
          // Compare against decrypted stored keys to prevent duplicates
          if (!pool.some(k => decryptKey(k.key) === val.trim())) {
            this.addKey(provider, val.trim(), `${envVar} (env)`);
            seededTotal++;
          }
        }
      }
    }
    console.log(`[KeyPool] Seeded ${seededTotal} keys from environment variables.`);
    if (ENCRYPTION_ENABLED) {
      console.log(`[KeyPool] AES-256-GCM encryption ENABLED for all stored keys.`);
    } else {
      console.warn(`[KeyPool] Key encryption DISABLED. Set STOCKAI_KEY_ENCRYPTION_SECRET (min 32 chars) to enable.`);
    }
  }

  // ── Utilities ────────────────────────────────────────────────────────────

  static maskKey(key: string): string {
    if (!key || key.length < 8) return '****';
    return `${key.substring(0, 6)}...${key.substring(key.length - 4)}`;
  }

  static sanitizeKeyFromMessage(msg: string): string {
    // Remove any API key patterns from error messages for security
    return msg
      .replace(/sk-[A-Za-z0-9_-]{10,}/g, '[REDACTED]')
      .replace(/AIzaSy[A-Za-z0-9_-]{10,}/g, '[REDACTED]')
      .replace(/Bearer [A-Za-z0-9_-]{10,}/g, 'Bearer [REDACTED]')
      .replace(/gsk_[A-Za-z0-9]{10,}/g, '[REDACTED]')
      .replace(/xai-[A-Za-z0-9]{10,}/g, '[REDACTED]')
      .replace(/sk-or-[A-Za-z0-9_-]{10,}/g, '[REDACTED]')
      .replace(/sk-ant-[A-Za-z0-9_-]{10,}/g, '[REDACTED]');
  }

  /** Get safe representation for admin UI (never expose raw key) */
  static getSafeKeys(provider: string): (Omit<PooledApiKey, 'key'> & {
    maskedKey: string;
    healthScore: number;
    cooldownRemainingMs: number;
    rateLimitRemainingMs: number;
    encryptionEnabled: boolean;
  })[] {
    const now = Date.now();
    return (keyStore.get(provider) || []).map(({ key: rawKey, ...safe }) => ({
      ...safe,
      maskedKey: this.maskKey(decryptKey(rawKey)),
      healthScore: this.computeKeyHealthScore({ key: rawKey, ...safe }),
      cooldownRemainingMs: safe.cooldownUntil > now ? safe.cooldownUntil - now : 0,
      rateLimitRemainingMs: safe.rateLimitUntil > now ? safe.rateLimitUntil - now : 0,
      encryptionEnabled: ENCRYPTION_ENABLED
    }));
  }

  private static findKeyById(keyId: string): PooledApiKey | null {
    for (const pool of keyStore.values()) {
      const found = pool.find(k => k.id === keyId);
      if (found) return found;
    }
    return null;
  }

  /** Check if provider has any usable keys in pool */
  static hasAvailableKey(provider: string): boolean {
    const pool = keyStore.get(provider) || [];
    const now = Date.now();
    return pool.some(k => this.isKeyAvailable(k, now));
  }

  /** Check if provider has any usable keys in pool OR in ENV (legacy fallback) */
  static hasAnyKey(provider: string, envFallback?: string): boolean {
    const hasPoolKey = this.hasAvailableKey(provider);
    const hasEnvKey = !!(envFallback && envFallback.trim().length > 0);
    return hasPoolKey || hasEnvKey;
  }

  /** Get the raw decrypted key value by ID (used internally for validation tests — never expose to client) */
  static getRawKey(keyId: string): string | null {
    const key = this.findKeyById(keyId);
    return key ? decryptKey(key.key) : null;
  }

  /** Get provider for a key ID */
  static getKeyProvider(keyId: string): string | null {
    const key = this.findKeyById(keyId);
    return key ? key.provider : null;
  }

  /** Get startup summary for logging */
  static getStartupSummary(): string {
    const providers = ['google-gemini', 'openai', 'anthropic', 'groq', 'xai', 'openrouter'];
    const lines = providers.map(p => {
      const pool = keyStore.get(p) || [];
      return `  ${p}: ${pool.length} key(s)`;
    });
    return lines.join('\n');
  }

  // ── Database Persistence Layer ────────────────────────────────────────────

  /**
   * Load all keys from PostgreSQL into the in-memory store on startup.
   * Called once after DB connection is established.
   */
  static async loadFromDb(): Promise<void> {
    if (!isDbAvailable()) return;
    const db = getDb()!;
    try {
      const rows = await db.systemApiKey.findMany();
      let loaded = 0;
      for (const row of rows) {
        if (!keyStore.has(row.provider)) keyStore.set(row.provider, []);
        const pool = keyStore.get(row.provider)!;
        // Skip if already in pool (e.g. seeded from ENV)
        if (pool.some(k => k.id === row.id)) continue;
        pool.push({
          id: row.id,
          provider: row.provider,
          label: row.label,
          key: row.encryptedKey,
          isEnabled: row.isEnabled,
          isHealthy: row.isHealthy,
          addedAt: row.addedAt.toISOString(),
          lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
          lastSuccessAt: row.lastSuccessAt?.toISOString() ?? null,
          lastFailureAt: row.lastFailureAt?.toISOString() ?? null,
          rateLimitUntil: Number(row.rateLimitUntil),
          cooldownUntil: Number(row.cooldownUntil),
          successCount: row.successCount,
          failureCount: row.failureCount,
          totalRequests: row.totalRequests,
          avgLatencyMs: row.avgLatencyMs,
          consecutiveFailures: row.consecutiveFails,
          quotaStatus: (row.quotaStatus as any) || 'unknown',
          rateLimitStatus: (row.rateLimitStatus as any) || 'unknown',
          timeoutCount: row.timeoutCount,
          rateLimitCount: row.rateLimitCount,
          lastErrorMessage: row.lastErrorMessage ?? undefined,
        });
        loaded++;
      }
      if (loaded > 0) console.log(`[KeyPool] Loaded ${loaded} key(s) from database`);
    } catch (e: any) {
      console.error('[KeyPool] loadFromDb error:', e?.message);
    }
  }

  /**
   * Persist a single PooledApiKey to the database (upsert by ID).
   */
  static async persistKeyToDb(key: PooledApiKey): Promise<void> {
    if (!isDbAvailable()) return;
    const db = getDb()!;
    try {
      await db.systemApiKey.upsert({
        where: { id: key.id },
        update: {
          label: key.label,
          encryptedKey: key.key,
          isEnabled: key.isEnabled,
          isHealthy: key.isHealthy,
          lastUsedAt: key.lastUsedAt ? new Date(key.lastUsedAt) : null,
          lastSuccessAt: key.lastSuccessAt ? new Date(key.lastSuccessAt) : null,
          lastFailureAt: key.lastFailureAt ? new Date(key.lastFailureAt) : null,
          successCount: key.successCount,
          failureCount: key.failureCount,
          totalRequests: key.totalRequests,
          avgLatencyMs: key.avgLatencyMs,
          consecutiveFails: key.consecutiveFailures,
          cooldownUntil: BigInt(key.cooldownUntil),
          rateLimitUntil: BigInt(key.rateLimitUntil),
          quotaStatus: key.quotaStatus,
          rateLimitStatus: key.rateLimitStatus,
          timeoutCount: key.timeoutCount,
          rateLimitCount: key.rateLimitCount,
          lastErrorMessage: key.lastErrorMessage ?? null,
          healthScore: this.computeKeyHealthScore(key),
        },
        create: {
          id: key.id,
          provider: key.provider,
          label: key.label,
          encryptedKey: key.key,
          isEnabled: key.isEnabled,
          isHealthy: key.isHealthy,
          addedAt: new Date(key.addedAt),
          successCount: key.successCount,
          failureCount: key.failureCount,
          totalRequests: key.totalRequests,
          avgLatencyMs: key.avgLatencyMs,
          consecutiveFails: key.consecutiveFailures,
          cooldownUntil: BigInt(key.cooldownUntil),
          rateLimitUntil: BigInt(key.rateLimitUntil),
          quotaStatus: key.quotaStatus,
          rateLimitStatus: key.rateLimitStatus,
          timeoutCount: key.timeoutCount,
          rateLimitCount: key.rateLimitCount,
          lastErrorMessage: key.lastErrorMessage ?? null,
          healthScore: this.computeKeyHealthScore(key),
        }
      });
    } catch (e: any) {
      console.error('[KeyPool] persistKeyToDb error:', e?.message);
    }
  }

  /**
   * Delete a key from the database.
   */
  static async deleteKeyFromDb(keyId: string): Promise<void> {
    if (!isDbAvailable()) return;
    const db = getDb()!;
    try {
      await db.systemApiKey.delete({ where: { id: keyId } });
    } catch (e: any) {
      if (!e?.message?.includes('Record to delete does not exist')) {
        console.error('[KeyPool] deleteKeyFromDb error:', e?.message);
      }
    }
  }
}
