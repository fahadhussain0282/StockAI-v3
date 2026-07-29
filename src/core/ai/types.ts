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
