/**
 * StockAI Enterprise — Dynamic Provider Fallback Configuration
 *
 * Priority order: Google Gemini → OpenAI → Anthropic → Groq → xAI → OpenRouter
 *
 * This order can be overridden dynamically by admin settings.
 * Never hardcode provider selection in application logic.
 */

export const PROVIDER_FALLBACK_ORDER = [
  'google-gemini',
  'openai',
  'anthropic',
  'groq',
  'xai',
  'openrouter'
];

/** All supported provider IDs for validation */
export const ALL_PROVIDER_IDS = new Set(PROVIDER_FALLBACK_ORDER);

/**
 * Validates if the provider ID is known to the fallback system.
 */
export function isValidProvider(providerId: string): boolean {
  return ALL_PROVIDER_IDS.has(providerId);
}

/**
 * Gets the full ordered provider list starting from a given provider.
 * The primary provider is always first; all others follow in priority order.
 */
export function getFallbackProviders(primaryProvider: string): string[] {
  const currentIndex = PROVIDER_FALLBACK_ORDER.indexOf(primaryProvider);
  if (currentIndex === -1) {
    return PROVIDER_FALLBACK_ORDER; // Try all if unknown
  }
  // Return remaining providers after the primary
  return PROVIDER_FALLBACK_ORDER.slice(currentIndex + 1);
}

/**
 * Builds the full provider attempt list for a request.
 * Primary provider is first; fallbacks follow in order, de-duplicated.
 */
export function buildProviderChain(primaryProvider: string): string[] {
  const fallbacks = getFallbackProviders(primaryProvider).filter(p => p !== primaryProvider);
  return [primaryProvider, ...fallbacks];
}
