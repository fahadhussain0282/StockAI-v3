import { AiModelDefinition } from '../types';

/**
 * xAI (Grok) — Centralized Model Registry
 * Source: https://docs.x.ai/docs/models
 * Updated: 2025-07
 */
export const XAI_MODELS: AiModelDefinition[] = [
  {
    id: 'grok-2-vision-1212',
    name: 'Grok 2 Vision (1212)',
    capabilities: { vision: true, streaming: true, json: true },
    contextWindow: 32768,
    maxOutputTokens: 8192,
    freeTier: false,
    deprecated: false,
    tier: 'paid'
  },
  {
    id: 'grok-2-1212',
    name: 'Grok 2 (1212)',
    capabilities: { vision: false, streaming: true, json: true },
    contextWindow: 131072,
    maxOutputTokens: 8192,
    freeTier: false,
    deprecated: false,
    tier: 'paid'
  },
  // ─── Legacy / Dynamic Aliases ─────────────────────────────────────────────
  {
    id: 'grok-2-vision-latest',
    name: 'Grok 2 Vision Latest (Alias)',
    capabilities: { vision: true, streaming: true, json: true },
    contextWindow: 32768,
    maxOutputTokens: 8192,
    freeTier: false,
    deprecated: false,
    tier: 'paid'
  },
  {
    id: 'grok-2-latest',
    name: 'Grok 2 Latest (Alias)',
    capabilities: { vision: false, streaming: true, json: true },
    contextWindow: 131072,
    maxOutputTokens: 8192,
    freeTier: false,
    deprecated: false,
    tier: 'paid'
  }
];

export const XAI_VISION_FALLBACK_CHAIN = [
  'grok-2-vision-1212',
  'grok-2-vision-latest'
];

export const XAI_TEXT_FALLBACK_CHAIN = [
  'grok-2-1212',
  'grok-2-latest'
];

export const XAI_DEFAULT_VISION_MODEL = 'grok-2-vision-1212';
export const XAI_DEFAULT_TEXT_MODEL = 'grok-2-1212';
