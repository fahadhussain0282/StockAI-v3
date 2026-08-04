import { AiModelDefinition } from '../types';

export const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1';
export const OPENROUTER_SITE_URL = 'https://stockai-rose.vercel.app';
export const OPENROUTER_APP_NAME = 'StockAI';

/**
 * Curated list of OpenRouter models with vision support.
 * OpenRouter provides access to 100+ models via a single endpoint.
 * These are the top vision-capable models for metadata generation.
 */
export const OPENROUTER_MODELS: AiModelDefinition[] = [
  {
    id: 'google/gemma-4-31b-it:free',
    name: 'Gemma 4 31B (Free)',
    capabilities: { vision: true, streaming: true, json: true },
    contextWindow: 1048576,
    maxOutputTokens: 8192,
    freeTier: true,
    tier: 'free'
  },
  {
    id: 'google/gemini-flash-1.5',
    name: 'Gemini 1.5 Flash',
    capabilities: { vision: true, streaming: true, json: true },
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    freeTier: false,
    tier: 'paid'
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o (via OpenRouter)',
    capabilities: { vision: true, streaming: true, json: true },
    contextWindow: 128000,
    maxOutputTokens: 16384,
    freeTier: false,
    tier: 'paid'
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini (via OpenRouter)',
    capabilities: { vision: true, streaming: true, json: true },
    contextWindow: 128000,
    maxOutputTokens: 16384,
    freeTier: false,
    tier: 'paid'
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet (via OpenRouter)',
    capabilities: { vision: true, streaming: true, json: true },
    contextWindow: 200000,
    maxOutputTokens: 8192,
    freeTier: false,
    tier: 'paid'
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku (via OpenRouter)',
    capabilities: { vision: true, streaming: true, json: true },
    contextWindow: 200000,
    maxOutputTokens: 4096,
    freeTier: false,
    tier: 'paid'
  },
  {
    id: 'meta-llama/llama-4-maverick:free',
    name: 'Llama 4 Maverick (Free)',
    capabilities: { vision: true, streaming: true, json: true },
    contextWindow: 131072,
    maxOutputTokens: 4096,
    freeTier: true,
    tier: 'free'
  },
  {
    id: 'qwen/qwen2.5-vl-72b-instruct:free',
    name: 'Qwen 2.5 VL 72B (Free)',
    capabilities: { vision: true, streaming: true, json: true },
    contextWindow: 32768,
    maxOutputTokens: 8192,
    freeTier: true,
    tier: 'free'
  },
  {
    id: 'mistralai/mistral-small-3.1-24b-instruct:free',
    name: 'Mistral Small 3.1 (Free)',
    capabilities: { vision: true, streaming: true, json: false },
    contextWindow: 128000,
    maxOutputTokens: 4096,
    freeTier: true,
    tier: 'free'
  },
  {
    id: 'x-ai/grok-2-vision-1212',
    name: 'Grok 2 Vision (via OpenRouter)',
    capabilities: { vision: true, streaming: true, json: true },
    contextWindow: 32768,
    maxOutputTokens: 4096,
    freeTier: false,
    tier: 'paid'
  }
];

export const OPENROUTER_DEFAULT_VISION_MODEL = 'google/gemma-4-31b-it:free';
export const OPENROUTER_DEFAULT_TEXT_MODEL = 'google/gemma-4-31b-it:free';

export const OPENROUTER_VISION_FALLBACK_CHAIN = [
  'google/gemma-4-31b-it:free',
  'google/gemini-flash-1.5',
  'meta-llama/llama-4-maverick:free',
  'qwen/qwen2.5-vl-72b-instruct:free',
  'google/gemini-flash-1.5',
  'openai/gpt-4o-mini'
];

export const OPENROUTER_TEXT_FALLBACK_CHAIN = [
  'google/gemini-2.0-flash-exp:free',
  'meta-llama/llama-4-maverick:free'
];
