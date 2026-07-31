import { AiModelDefinition } from '../types';

/**
 * Together AI — Centralized Model Registry
 * Source: https://docs.together.ai/docs/inference-models
 * Updated: 2025-07
 *
 * Together AI provides access to many open-source models via their inference API.
 * Several support vision through their FLUX and Llama Vision models.
 */
export const TOGETHER_MODELS: AiModelDefinition[] = [
  // ─── Llama Vision — Multimodal ────────────────────────────────────────────
  {
    id: 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo',
    name: 'Llama 3.2 90B Vision Turbo',
    capabilities: { vision: true, streaming: true, json: true },
    contextWindow: 131072,
    maxOutputTokens: 4096,
    freeTier: false,
    deprecated: false,
    tier: 'paid'
  },
  {
    id: 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo',
    name: 'Llama 3.2 11B Vision Turbo',
    capabilities: { vision: true, streaming: true, json: true },
    contextWindow: 131072,
    maxOutputTokens: 4096,
    freeTier: false,
    deprecated: false,
    tier: 'paid'
  },
  // ─── Llama Text — Fast & Affordable ──────────────────────────────────────
  {
    id: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
    name: 'Llama 3.1 70B Instruct Turbo',
    capabilities: { vision: false, streaming: true, json: true },
    contextWindow: 131072,
    maxOutputTokens: 8192,
    freeTier: false,
    deprecated: false,
    tier: 'paid'
  },
  {
    id: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
    name: 'Llama 3.1 8B Instruct Turbo',
    capabilities: { vision: false, streaming: true, json: true },
    contextWindow: 131072,
    maxOutputTokens: 8192,
    freeTier: false,
    deprecated: false,
    tier: 'paid'
  },
  // ─── Qwen — Efficient ────────────────────────────────────────────────────
  {
    id: 'Qwen/Qwen2.5-72B-Instruct-Turbo',
    name: 'Qwen 2.5 72B Instruct Turbo',
    capabilities: { vision: false, streaming: true, json: true },
    contextWindow: 32768,
    maxOutputTokens: 4096,
    freeTier: false,
    deprecated: false,
    tier: 'paid'
  }
];

export const TOGETHER_VISION_FALLBACK_CHAIN = [
  'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo',
  'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo'
];

export const TOGETHER_TEXT_FALLBACK_CHAIN = [
  'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
  'Qwen/Qwen2.5-72B-Instruct-Turbo',
  'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo'
];

export const TOGETHER_DEFAULT_VISION_MODEL = 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo';
export const TOGETHER_DEFAULT_TEXT_MODEL = 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo';
