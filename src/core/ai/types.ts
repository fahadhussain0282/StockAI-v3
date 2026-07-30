export interface AiCapabilities {
  vision: boolean;
  streaming: boolean;
  json: boolean;
}

export interface AiModelDefinition {
  id: string;
  name: string;
  capabilities: AiCapabilities;
  contextWindow?: number;
  maxOutputTokens?: number;
  freeTier?: boolean;
  deprecated?: boolean;
  tier?: 'free' | 'paid' | 'deprecated';
  /** Whether this model is enabled for use (admin-configurable) */
  isEnabled?: boolean;
  /** Whether this model is the admin-selected default */
  isDefault?: boolean;
}

export type ProviderStatusType = 'online' | 'offline' | 'degraded' | 'rate_limited' | 'quota_exhausted' | 'no_key' | 'disabled';

export interface AiProviderHealth {
  status: ProviderStatusType;
  latency: number;
  lastSuccess: string | null;
  lastFailure: string | null;
  failureCount: number;
  successRate: number;
  totalRequests?: number;
  fallbackCount?: number;
  recentFailures?: string[];
  lastHealthCheck?: string;
}

export interface NormalizedAiResponse {
  success: boolean;
  provider: string;
  model: string;
  latency: number;
  tokens: { prompt: number; completion: number; total: number };
  finishReason: string;
  rawResponse: string;
  parsedResponse?: any;
  error?: string;
  fallbackTriggered?: boolean;
  retries?: number;
}

export interface AiDiagnosticsData {
  requestStart: number;
  requestEnd: number;
  latency: number;
  payloadSize: number;
  imageSize: number;
  promptSize: number;
  modelUsed: string;
  providerUsed: string;
  responseSize: number;
  tokenUsage: { prompt: number; completion: number; total: number };
  finishReason: string;
  success: boolean;
  error?: string;
  fallbackTriggered?: boolean;
  retries?: number;
  finalProvider?: string;
  finalModel?: string;
  keyLabel?: string;
}

export interface GenerateVisionOptions {
  provider: string;
  model?: string;
  systemInstruction: string;
  userPrompt: string;
  base64Image?: string;
  mimeType?: string;
  responseSchema?: any;
  customApiKey?: string;
  developerMode?: boolean;
  fallbackChain?: string[];
  maxRetries?: number;
  retryDelayMs?: number;
}

export interface FallbackResult {
  provider: string;
  model: string;
  success: boolean;
  response?: NormalizedAiResponse;
  error?: string;
  retries: number;
}

/** Quota and rate-limit status for individual API keys */
export type KeyQuotaStatus = 'ok' | 'exhausted' | 'unknown';
export type KeyRateLimitStatus = 'ok' | 'limited' | 'unknown';

/** Result of a key validation check */
export interface KeyValidationResult {
  valid: boolean;
  message: string;
  latencyMs?: number;
  rateLimited?: boolean;
  quotaExhausted?: boolean;
}

/** In-memory model management state (per provider, per model) */
export interface ModelManagementState {
  [providerId: string]: {
    [modelId: string]: {
      isEnabled: boolean;
      isDefault: boolean;
      lastRefreshed?: string;
    };
  };
}

/** Provider overview for admin dashboard — combines pool, health, circuit and model info */
export interface ProviderOverview {
  id: string;
  name: string;
  isEnvConfigured: boolean;
  pool: {
    totalKeys: number;
    enabledKeys: number;
    healthyKeys: number;
    rateLimitedKeys: number;
    disabledKeys: number;
    failedKeys: number;
    availableKeys: number;
    strategy: string;
    rotationIndex: number;
    avgSuccessRate: number;
    avgLatencyMs: number;
  };
  health: AiProviderHealth;
  circuit: {
    state: string;
    consecutiveFailures: number;
    lastOpenedAt: string | null;
    lastStateChange: string;
    cooldownRemainingMs: number;
  };
  models: (AiModelDefinition & { isEnabled: boolean; isDefault: boolean })[];
  lastHealthCheck: string | null;
}
