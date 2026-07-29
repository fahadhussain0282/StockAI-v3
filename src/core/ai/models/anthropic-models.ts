import { AiModelDefinition } from '../types';

/**
 * Anthropic Claude — Centralized Model Registry
 * Source: https://docs.anthropic.com/en/docs/about-claude/models
 * Updated: 2025-07
 */
export const ANTHROPIC_MODELS: AiModelDefinition[] = [
  // ─── Claude 3.5 Sonnet — Best intelligence + vision ──────────────────────
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    capabilities: { vision: true, streaming: true, json: true },
    contextWindow: 200000,
    maxOutputTokens: 8192,
    freeTier: false,
    deprecated: false,
    tier: 'paid'
  },
  // ─── Claude 3.5 Haiku — Fast + vision ────────────────────────────────────
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    capabilities: { vision: true, streaming: true, json: true },
    contextWindow: 200000,
    maxOutputTokens: 8192,
    freeTier: false,
    deprecated: false,
    tier: 'paid'
  },
  // ─── Claude 3 Opus — Most capable text + vision ──────────────────────────
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    capabilities: { vision: true, streaming: true, json: true },
    contextWindow: 200000,
    maxOutputTokens: 4096,
    freeTier: false,
    deprecated: false,
    tier: 'paid'
  },
  // ─── Claude 3 Haiku — Fast, cost-efficient ───────────────────────────────
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    capabilities: { vision: true, streaming: true, json: true },
    contextWindow: 200000,
    maxOutputTokens: 4096,
    freeTier: false,
    deprecated: false,
    tier: 'paid'
  }
];

/** Ordered vision fallback chain for Anthropic */
export const ANTHROPIC_VISION_FALLBACK_CHAIN = [
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  'claude-3-opus-20240229',
  'claude-3-haiku-20240307'
];

/** Ordered text fallback chain for Anthropic */
export const ANTHROPIC_TEXT_FALLBACK_CHAIN = [
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  'claude-3-haiku-20240307'
];

export const ANTHROPIC_DEFAULT_VISION_MODEL = 'claude-3-5-sonnet-20241022';
export const ANTHROPIC_DEFAULT_TEXT_MODEL = 'claude-3-5-haiku-20241022';
