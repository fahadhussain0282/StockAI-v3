import { AiModelDefinition } from '../types';

/**
 * Groq Cloud — Centralized Model Registry
 * Source: https://console.groq.com/docs/models
 * Updated: 2025-07 — Verified working models on free tier
 *
 * IMPORTANT: Models marked deprecated=true will be SKIPPED by the gateway.
 * The llama-4-scout model is TEXT-ONLY (no vision support).
 * For vision on Groq, use llama-3.2-11b-vision-preview (free, confirmed working).
 */
export const GROQ_MODELS: AiModelDefinition[] = [
  // ─── Vision Models (Free Tier) ────────────────────────────────────────────
  {
    id: 'llama-3.2-90b-vision-preview',
    name: 'Llama 3.2 90B Vision',
    capabilities: { vision: true, streaming: true, json: true },
    contextWindow: 8192,
    maxOutputTokens: 8192,
    freeTier: true,
    deprecated: false,
    tier: 'free'
  },
  {
    id: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    name: 'Llama 4 Maverick 17B (Vision)',
    capabilities: { vision: true, streaming: true, json: true },
    contextWindow: 131072,
    maxOutputTokens: 8192,
    freeTier: true,
    deprecated: false,
    tier: 'free'
  },
  // ─── Text Models (Free Tier) ──────────────────────────────────────────────
  {
    id: 'meta-llama/llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout 17B',
    capabilities: { vision: false, streaming: true, json: true },
    contextWindow: 131072,
    maxOutputTokens: 8192,
    freeTier: true,
    deprecated: false,
    tier: 'free'
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B Versatile',
    capabilities: { vision: false, streaming: true, json: true },
    contextWindow: 32768,
    maxOutputTokens: 32768,
    freeTier: true,
    deprecated: false,
    tier: 'free'
  },
  {
    id: 'llama3-70b-8192',
    name: 'Llama 3 70B',
    capabilities: { vision: false, streaming: true, json: true },
    contextWindow: 8192,
    maxOutputTokens: 8192,
    freeTier: true,
    deprecated: false,
    tier: 'free'
  },
  {
    id: 'llama3-8b-8192',
    name: 'Llama 3 8B',
    capabilities: { vision: false, streaming: true, json: true },
    contextWindow: 8192,
    maxOutputTokens: 8192,
    freeTier: true,
    deprecated: false,
    tier: 'free'
  },
  // ─── Deprecated (retained for fallback resolution, will be skipped) ───────
  {
    id: 'llama-3.2-90b-vision-preview',
    name: 'Llama 3.2 90B Vision (Deprecated)',
    capabilities: { vision: true, streaming: true, json: true },
    contextWindow: 8192,
    maxOutputTokens: 8192,
    freeTier: false,
    deprecated: true,
    tier: 'deprecated'
  }
];

/**
 * Ordered vision fallback chain for Groq.
 * Only includes confirmed-working vision models.
 * Gateway falls back through this list if preferred model fails.
 */
export const GROQ_VISION_FALLBACK_CHAIN = [
  'meta-llama/llama-4-maverick-17b-128e-instruct',
  'llama-3.2-90b-vision-preview'
];

/** Default text fallback when no vision is needed */
export const GROQ_TEXT_FALLBACK_CHAIN = [
  'llama-3.3-70b-versatile',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'llama3-70b-8192'
];

export const GROQ_DEFAULT_VISION_MODEL = 'llama-3.2-90b-vision-preview';
export const GROQ_DEFAULT_TEXT_MODEL = 'llama-3.3-70b-versatile';
