import { BaseAiProvider } from './base-provider';
import { AiModelDefinition, GenerateVisionOptions, NormalizedAiResponse } from '../types';
import {
  OPENROUTER_MODELS,
  OPENROUTER_VISION_FALLBACK_CHAIN,
  OPENROUTER_TEXT_FALLBACK_CHAIN,
  OPENROUTER_DEFAULT_VISION_MODEL,
  OPENROUTER_DEFAULT_TEXT_MODEL,
  OPENROUTER_API_BASE,
  OPENROUTER_SITE_URL,
  OPENROUTER_APP_NAME
} from '../models/openrouter-models';

const REQUEST_TIMEOUT_MS = 30000;

/**
 * OpenRouter Provider
 *
 * OpenRouter is a unified AI gateway that provides access to 100+ models
 * from various providers (Google, OpenAI, Anthropic, Meta, Mistral, etc.)
 * via a single OpenAI-compatible API endpoint.
 *
 * Key features:
 * - OpenAI-compatible API format (messages[], json_object response_format)
 * - Single API key unlocks all configured models
 * - Free tier models available (marked with :free suffix)
 * - Automatic model fallback within OpenRouter's infrastructure
 * - HTTP-Referer and X-Title headers required for proper attribution
 */
export class OpenRouterProvider extends BaseAiProvider {
  readonly id = 'openrouter';
  readonly name = 'OpenRouter';

  isEnabled(): boolean {
    const key = process.env.OPENROUTER_API_KEY;
    return !!key && key.trim().length > 0;
  }

  getDefaultModel(): string {
    return OPENROUTER_DEFAULT_TEXT_MODEL;
  }

  getVisionModel(): string {
    return OPENROUTER_DEFAULT_VISION_MODEL;
  }

  listModels(): AiModelDefinition[] {
    return OPENROUTER_MODELS;
  }

  getVisionFallbackChain(): string[] {
    return OPENROUTER_VISION_FALLBACK_CHAIN;
  }

  getTextFallbackChain(): string[] {
    return OPENROUTER_TEXT_FALLBACK_CHAIN;
  }

  async generateVisionAnalysis(options: GenerateVisionOptions): Promise<NormalizedAiResponse> {
    const key = (options.customApiKey && options.customApiKey.trim().length > 0)
      ? options.customApiKey.trim()
      : process.env.OPENROUTER_API_KEY;

    if (!key || key.trim().length === 0) {
      throw new Error('AUTH_ERROR: OPENROUTER_API_KEY is not configured or invalid.');
    }

    const modelToUse = options.model || (options.base64Image ? this.getVisionModel() : this.getDefaultModel());

    // Validate model exists in our list and supports vision if needed
    const modelDef = this.listModels().find(m => m.id === modelToUse);
    if (options.base64Image && modelDef && !modelDef.capabilities.vision) {
      throw new Error(`OpenRouter model ${modelToUse} does not support vision capabilities.`);
    }

    const start = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      // Build OpenAI-compatible message content
      const userContent: any[] = [];

      if (options.base64Image) {
        const cleanBase64 = options.base64Image.replace(/^data:[^;]+;base64,/, '');
        const mime = options.mimeType || 'image/jpeg';
        userContent.push({
          type: 'image_url',
          image_url: {
            url: `data:${mime};base64,${cleanBase64}`,
            detail: 'high'
          }
        });
      }

      userContent.push({
        type: 'text',
        text: `${options.userPrompt}\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown code blocks, no explanation. Pure JSON object only.`
      });

      const messages: any[] = [
        { role: 'system', content: options.systemInstruction },
        { role: 'user', content: userContent.length === 1 ? userContent[0].text : userContent }
      ];

      const body: any = {
        model: modelToUse,
        messages,
        max_tokens: 4096,
        temperature: 0.3
      };

      // Only add json_object format for models that support it
      if (modelDef?.capabilities.json !== false) {
        body.response_format = { type: 'json_object' };
      }

      const res = await fetch(`${OPENROUTER_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': OPENROUTER_SITE_URL,
          'X-Title': OPENROUTER_APP_NAME,
          'User-Agent': 'stockai-gateway/3.0'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.status === 401 || res.status === 403) {
        throw new Error('AUTH_ERROR: OpenRouter API key is invalid or unauthorized.');
      }
      if (res.status === 429) {
        const errText = await res.text();
        if (errText.toLowerCase().includes('credit') || errText.toLowerCase().includes('quota') || errText.toLowerCase().includes('billing')) {
          throw new Error('QUOTA_EXHAUSTED: OpenRouter credits exhausted or quota exceeded.');
        }
        throw new Error('RATE_LIMIT: OpenRouter rate limit reached. Please retry shortly.');
      }
      if (res.status === 402) {
        throw new Error('QUOTA_EXHAUSTED: OpenRouter credits insufficient. Please top up your account.');
      }
      if (!res.ok) {
        const errStr = await res.text();
        throw new Error(`OpenRouter API Error ${res.status}: ${errStr.slice(0, 300)}`);
      }

      const data = (await res.json()) as any;
      const rawStr = JSON.stringify(data, null, 2);
      const content = data.choices?.[0]?.message?.content || '{}';

      let parsed: any;
      try {
        parsed = JSON.parse(content.trim());
      } catch {
        // Strip markdown code fences
        const codeMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeMatch) {
          try { parsed = JSON.parse(codeMatch[1].trim()); } catch { parsed = {}; }
        } else {
          // Try extracting first JSON object
          const braceMatch = content.match(/\{[\s\S]*\}/);
          if (braceMatch) {
            try { parsed = JSON.parse(braceMatch[0]); } catch { parsed = {}; }
          } else {
            throw new Error('Failed to parse OpenRouter response as JSON.');
          }
        }
      }

      // Extract model actually used (OpenRouter may route to different model)
      const actualModel = data.model || modelToUse;

      return {
        success: true,
        provider: this.id,
        model: actualModel,
        latency: Date.now() - start,
        tokens: {
          prompt: data.usage?.prompt_tokens || 0,
          completion: data.usage?.completion_tokens || 0,
          total: data.usage?.total_tokens || 0
        },
        finishReason: data.choices?.[0]?.finish_reason || 'stop',
        rawResponse: rawStr,
        parsedResponse: parsed
      };

    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(`TIMEOUT: OpenRouter API request timed out after ${REQUEST_TIMEOUT_MS / 1000}s.`);
      }
      if (
        err.message?.startsWith('AUTH_ERROR:') ||
        err.message?.startsWith('RATE_LIMIT:') ||
        err.message?.startsWith('QUOTA_EXHAUSTED:') ||
        err.message?.startsWith('TIMEOUT:')
      ) {
        throw err;
      }
      throw new Error(`OpenRouter API Failed: ${err.message}`);
    }
  }

  /**
   * Validates an OpenRouter API key by calling the models endpoint.
   */
  async validateKey(apiKey: string): Promise<{ valid: boolean; message: string; models?: string[] }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${OPENROUTER_API_BASE}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': OPENROUTER_SITE_URL,
          'X-Title': OPENROUTER_APP_NAME,
          'User-Agent': 'stockai-gateway/3.0'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = (await res.json()) as any;
        const modelCount = data?.data?.length || 0;
        const freeModels = (data?.data || [])
          .filter((m: any) => m.id.includes(':free'))
          .slice(0, 5)
          .map((m: any) => m.id);
        return {
          valid: true,
          message: `OpenRouter Connected — ${modelCount} models available (${freeModels.length} free)`,
          models: freeModels
        };
      }
      if (res.status === 401 || res.status === 403) return { valid: false, message: 'Invalid OpenRouter API key.' };
      return { valid: false, message: `OpenRouter API returned HTTP ${res.status}` };
    } catch (err: any) {
      if (err.name === 'AbortError') return { valid: false, message: 'OpenRouter connection timed out.' };
      return { valid: false, message: `Network error: ${err.message}` };
    }
  }
}
