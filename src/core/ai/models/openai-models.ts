import { AiModelDefinition } from '../types';

/**
 * OpenAI — Centralized Model Registry
 * Source: https://platform.openai.com/docs/models
 * Updated: 2025-07
 */
export const OPENAI_MODELS: AiModelDefinition[] = [
  // ─── GPT-4o — Vision + Text (Flagship) ───────────────────────────────────
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    capabilities: { vision: true, streaming: true, json: true },
    contextWindow: 128000,
    maxOutputTokens: 16384,
    freeTier: false,
    deprecated: false,
    tier: 'paid'
  },
  {
    id: 'gpt-4o-2024-11-20',
    name: 'GPT-4o (Nov 2024)',
    capabilities: { vision: true, streaming: true, json: true },
    contextWindow: 128000,
    maxOutputTokens: 16384,
    freeTier: false,
    deprecated: false,
    tier: 'paid'
  },
  // ─── GPT-4o-mini — Affordable Vision + Text ──────────────────────────────
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    capabilities: { vision: true, streaming: true, json: true },
    contextWindow: 128000,
    maxOutputTokens: 16384,
    freeTier: false,
    deprecated: false,
    tier: 'paid'
  },
  // ─── o4-mini — Fast reasoning (text only) ────────────────────────────────
  {
    id: 'o4-mini',
    name: 'o4-mini (Reasoning)',
    capabilities: { vision: false, streaming: false, json: true },
    contextWindow: 200000,
    maxOutputTokens: 100000,
    freeTier: false,
    deprecated: false,
    tier: 'paid'
  },
  // ─── GPT-3.5 Turbo — Legacy / cost efficient ─────────────────────────────
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    capabilities: { vision: false, streaming: true, json: true },
    contextWindow: 16385,
    maxOutputTokens: 4096,
    freeTier: false,
    deprecated: false,
    tier: 'paid'
  }
];

/** Ordered vision fallback chain for OpenAI */
export const OPENAI_VISION_FALLBACK_CHAIN = [
  'gpt-4o',
  'gpt-4o-2024-11-20',
  'gpt-4o-mini'
];

/** Ordered text fallback chain for OpenAI */
export const OPENAI_TEXT_FALLBACK_CHAIN = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-3.5-turbo'
];

export const OPENAI_DEFAULT_VISION_MODEL = 'gpt-4o';
export const OPENAI_DEFAULT_TEXT_MODEL = 'gpt-4o-mini';
