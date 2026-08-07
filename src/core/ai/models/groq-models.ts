import { AiModelDefinition } from '../types';

/**
 * Groq Cloud — Centralized Model Registry
 * Source: https://console.groq.com/docs/models
 * Updated: 2025-08 — Verified working models on free tier
 *
 * IMPORTANT: Models marked deprecated=true will be SKIPPED by the gateway.
 *
 * Vision models confirmed working on Groq free tier as of 2025-08:
 *   - llama-3.2-11b-vision-preview  (free, vision)
 *   - llama-3.2-90b-vision-preview  (free, vision — high quality)
 *   - meta-llama/llama-4-maverick-17b-128e-instruct (text + vision capable)
 *
 * Text-only models (no vision):
 *   - llama-3.3-70b-versatile
 *   - meta-llama/llama-4-scout-17b-16e-instruct
 *   - gpt-oss-20b
 */
export const GROQ_MODELS: AiModelDefinition[] = [
  // ─── Vision Models (Free Tier) ────────────────────────────────────────────
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
    id: 'llama-3.2-11b-vision-preview',
    name: 'Llama 3.2 11B Vision',
    capabilities: { vision: true, streaming: true, json: true },
    contextWindow: 8192,
    maxOutputTokens: 8192,
    freeTier: true,
    deprecated: false,
    tier: 'free'
  },
  // ─── Text-Only Models (Free Tier) ─────────────────────────────────────────
  {
    id: 'meta-llama/llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout 17B (Text)',
    capabilities: { vision: false, streaming: true, json: true },
    contextWindow: 131072,
    maxOutputTokens: 8192,
    freeTier: true,
    deprecated: false,
    tier: 'free'
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B Versatile (Text)',
    capabilities: { vision: false, streaming: true, json: true },
    contextWindow: 32768,
    maxOutputTokens: 32768,
    freeTier: true,
    deprecated: false,
    tier: 'free'
  },
  {
    id: 'gpt-oss-20b',
    name: 'GPT-OSS-20B (Text)',
    capabilities: { vision: false, streaming: true, json: true },
    contextWindow: 32768,
    maxOutputTokens: 8192,
    freeTier: true,
    deprecated: false,
    tier: 'free'
  },
  {
    id: 'llama3-70b-8192',
    name: 'Llama 3 70B (Text)',
    capabilities: { vision: false, streaming: true, json: true },
    contextWindow: 8192,
    maxOutputTokens: 8192,
    freeTier: true,
    deprecated: false,
    tier: 'free'
  }
];

/**
 * Ordered vision fallback chain for Groq.
 * ONLY includes models confirmed to be in GROQ_MODELS with vision=true.
 * Gateway falls back through this list if preferred model fails.
 */
export const GROQ_VISION_FALLBACK_CHAIN = [
  'meta-llama/llama-4-maverick-17b-128e-instruct',
  'llama-3.2-90b-vision-preview',
  'llama-3.2-11b-vision-preview'
];

/** Default text fallback chain for text-only tasks */
export const GROQ_TEXT_FALLBACK_CHAIN = [
  'llama-3.3-70b-versatile',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'llama3-70b-8192'
];

// Default vision model — first in fallback chain, confirmed in registry
export const GROQ_DEFAULT_VISION_MODEL = 'meta-llama/llama-4-maverick-17b-128e-instruct';

// Default text model — for non-vision tasks
export const GROQ_DEFAULT_TEXT_MODEL = 'llama-3.3-70b-versatile';
