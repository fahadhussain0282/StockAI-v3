import { AiModelDefinition } from '../types';

/**
 * DeepSeek AI — Centralized Model Registry
 * Source: https://platform.deepseek.com/docs
 * Updated: 2025-07
 */
export const DEEPSEEK_MODELS: AiModelDefinition[] = [
  // ─── DeepSeek-V3 — Flagship Text ──────────────────────────────────────────
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat (V3)',
    capabilities: { vision: false, streaming: true, json: true },
    contextWindow: 131072,
    maxOutputTokens: 8192,
    freeTier: false,
    deprecated: false,
    tier: 'paid'
  },
  // ─── DeepSeek-R1 — Reasoning ──────────────────────────────────────────────
  {
    id: 'deepseek-reasoner',
    name: 'DeepSeek Reasoner (R1)',
    capabilities: { vision: false, streaming: true, json: true },
    contextWindow: 131072,
    maxOutputTokens: 32768,
    freeTier: false,
    deprecated: false,
    tier: 'paid'
  }
];

export const DEEPSEEK_VISION_FALLBACK_CHAIN: string[] = [];

export const DEEPSEEK_TEXT_FALLBACK_CHAIN = [
  'deepseek-chat',
  'deepseek-reasoner'
];

export const DEEPSEEK_DEFAULT_VISION_MODEL = 'deepseek-chat';
export const DEEPSEEK_DEFAULT_TEXT_MODEL = 'deepseek-chat';
