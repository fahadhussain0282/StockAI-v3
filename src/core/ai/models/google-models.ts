import { AiModelDefinition } from '../types';

/**
 * Google Gemini — Centralized Model Registry
 * Source: https://ai.google.dev/gemini-api/docs/models
 * Updated: 2025-07 — Verified available on free tier
 */
export const GOOGLE_MODELS: AiModelDefinition[] = [
  // ─── Primary Free-Tier Models ─────────────────────────────────────────────
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    capabilities: { vision: true, streaming: true, json: true },
    contextWindow: 1048576,
    maxOutputTokens: 8192,
    freeTier: true,
    deprecated: false,
    tier: 'free'
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    capabilities: { vision: true, streaming: true, json: true },
    contextWindow: 1048576,
    maxOutputTokens: 65536,
    freeTier: true,
    deprecated: false,
    tier: 'free'
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    capabilities: { vision: true, streaming: true, json: true },
    contextWindow: 1048576,
    maxOutputTokens: 65536,
    freeTier: true,
    deprecated: false,
    tier: 'free'
  },
  // ─── Pro Models (Paid) ────────────────────────────────────────────────────
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    capabilities: { vision: true, streaming: true, json: true },
    contextWindow: 1048576,
    maxOutputTokens: 65536,
    freeTier: false,
    deprecated: false,
    tier: 'paid'
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    capabilities: { vision: true, streaming: true, json: true },
    contextWindow: 1048576,
    maxOutputTokens: 8192,
    freeTier: true,
    deprecated: false,
    tier: 'free'
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    capabilities: { vision: true, streaming: true, json: true },
    contextWindow: 2097152,
    maxOutputTokens: 8192,
    freeTier: false,
    deprecated: false,
    tier: 'paid'
  },
  // ─── Legacy (kept for backward compat, deprecated) ────────────────────────
  {
    id: 'gemini-1.0-pro',
    name: 'Gemini 1.0 Pro (Legacy)',
    capabilities: { vision: false, streaming: true, json: true },
    contextWindow: 32760,
    maxOutputTokens: 2048,
    freeTier: false,
    deprecated: true,
    tier: 'paid'
  }
];

/**
 * Ordered vision fallback chain — best to worst for vision tasks on free tier.
 * Gateway uses this list when the requested model is unavailable.
 */
export const GOOGLE_VISION_FALLBACK_CHAIN = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.5-flash-lite',
  'gemini-1.5-flash'
];

/** Default model for all Google vision tasks */
export const GOOGLE_DEFAULT_VISION_MODEL = 'gemini-2.5-flash';
export const GOOGLE_DEFAULT_TEXT_MODEL = 'gemini-2.0-flash';
