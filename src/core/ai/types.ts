export interface AiCapabilities {
  vision: boolean;
  streaming: boolean;
  json: boolean;
}

export interface AiModelDefinition {
  id: string;
  name: string;
  capabilities: AiCapabilities;
}

export interface AiProviderHealth {
  status: 'online' | 'offline' | 'degraded';
  latency: number;
  lastSuccess: string | null;
  lastFailure: string | null;
  failureCount: number;
  successRate: number;
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
}
