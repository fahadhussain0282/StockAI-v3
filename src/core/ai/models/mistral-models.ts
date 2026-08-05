import { AiModelDefinition } from '../types';

/**
 * Mistral AI — Centralized Model Registry
 * Source: https://docs.mistral.ai/getting-started/models/
 * Updated: 2025-07
 */
export const MISTRAL_MODELS: AiModelDefinition[] = [
  // ─── Pixtral — Vision (Flagship) ──────────────────────────────────────────
  {
    id: 'pixtral-large-2411',
    name: 'Pixtral Large (Vision)',
    capabilities: { vision: true, streaming: true, json: true },
    contextWindow: 128000,
    maxOutputTokens: 4096,
    freeTier: true,
    deprecated: false,
    tier: 'paid'
  },
  {
    id: 'pixtral-12b-2409',
    name: 'Pixtral 12B (Vision)',
    capabilities: { vision: true, streaming: true, json: true },
    contextWindow: 128000,
    maxOutputTokens: 4096,
    freeTier: true,
    deprecated: false,
    tier: 'paid'
  },
  // ─── Mistral Large — Text Flagship ────────────────────────────────────────
  {
    id: 'mistral-large-latest',
    name: 'Mistral Large (Latest)',
    capabilities: { vision: false, streaming: true, json: true },
    contextWindow: 131072,
    maxOutputTokens: 4096,
    freeTier: true,
    deprecated: false,
    tier: 'paid'
  },
  // ─── Mistral Small — Efficient ────────────────────────────────────────────
  {
    id: 'mistral-small-latest',
    name: 'Mistral Small (Latest)',
    capabilities: { vision: false, streaming: true, json: true },
    contextWindow: 32768,
    maxOutputTokens: 4096,
    freeTier: true,
    deprecated: false,
    tier: 'paid'
  },
  // ─── Codestral — Code-focused ─────────────────────────────────────────────
  {
    id: 'codestral-latest',
    name: 'Codestral (Latest)',
    capabilities: { vision: false, streaming: true, json: true },
    contextWindow: 32768,
    maxOutputTokens: 4096,
    freeTier: true,
    deprecated: false,
    tier: 'paid'
  }
];

export const MISTRAL_VISION_FALLBACK_CHAIN = [
  'pixtral-large-2411',
  'pixtral-12b-2409'
];

export const MISTRAL_TEXT_FALLBACK_CHAIN = [
  'mistral-large-latest',
  'mistral-small-latest'
];

export const MISTRAL_DEFAULT_VISION_MODEL = 'pixtral-large-2411';
export const MISTRAL_DEFAULT_TEXT_MODEL = 'mistral-large-latest';
