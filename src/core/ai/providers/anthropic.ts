import { BaseAiProvider } from './base-provider';
import { AiModelDefinition, GenerateVisionOptions, NormalizedAiResponse } from '../types';
import {
  ANTHROPIC_MODELS,
  ANTHROPIC_VISION_FALLBACK_CHAIN,
  ANTHROPIC_TEXT_FALLBACK_CHAIN,
  ANTHROPIC_DEFAULT_VISION_MODEL,
  ANTHROPIC_DEFAULT_TEXT_MODEL
} from '../models/anthropic-models';

const ANTHROPIC_API_BASE = 'https://api.anthropic.com/v1';
const ANTHROPIC_API_VERSION = '2023-06-01';
const REQUEST_TIMEOUT_MS = 30000;

export class AnthropicProvider extends BaseAiProvider {
  readonly id = 'anthropic';
  readonly name = 'Anthropic Claude';

  isEnabled(): boolean {
    const key = process.env.ANTHROPIC_API_KEY;
    return !!key && key.trim().length > 0;
  }

  getDefaultModel(): string {
    return ANTHROPIC_DEFAULT_TEXT_MODEL;
  }

  getVisionModel(): string {
    return ANTHROPIC_DEFAULT_VISION_MODEL;
  }

  listModels(): AiModelDefinition[] {
    return ANTHROPIC_MODELS;
  }

  getVisionFallbackChain(): string[] {
    return ANTHROPIC_VISION_FALLBACK_CHAIN;
  }

  getTextFallbackChain(): string[] {
    return ANTHROPIC_TEXT_FALLBACK_CHAIN;
  }

  async generateMetadata(options: GenerateVisionOptions): Promise<NormalizedAiResponse> {
    const key = (options.customApiKey && options.customApiKey.trim().length > 0)
      ? options.customApiKey.trim()
      : process.env.ANTHROPIC_API_KEY;

    if (!key || key.trim().length === 0) {
      throw new Error('AUTH_ERROR: ANTHROPIC_API_KEY is not configured or invalid.');
    }

    const modelToUse = options.model || (options.base64Image ? this.getVisionModel() : this.getDefaultModel());

    if (options.base64Image && !this.supportsVision(modelToUse)) {
      throw new Error(`Model ${modelToUse} does not support vision capabilities.`);
    }

    const start = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      // Build Anthropic message format
      const userContent: any[] = [];

      if (options.base64Image) {
        const cleanBase64 = options.base64Image.replace(/^data:[^;]+;base64,/, '');
        const mime = (options.mimeType || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
        userContent.push({
          type: 'image',
          source: { type: 'base64', media_type: mime, data: cleanBase64 }
        });
      }

      // Embed JSON format instruction into user message for Claude
      userContent.push({
        type: 'text',
        text: `${options.userPrompt}\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown code blocks, no explanation. Pure JSON object only.`
      });

      const body: any = {
        model: modelToUse,
        max_tokens: 4096,
        system: options.systemInstruction,
        messages: [{ role: 'user', content: userContent }]
      };

      const res = await fetch(`${ANTHROPIC_API_BASE}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': key,
          'anthropic-version': ANTHROPIC_API_VERSION,
          'Content-Type': 'application/json',
          'User-Agent': 'stockai-gateway/3.0'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.status === 401) {
        throw new Error('AUTH_ERROR: Anthropic API key is invalid or unauthorized.');
      }
      if (res.status === 403) {
        throw new Error('AUTH_ERROR: Anthropic API access forbidden. Check your API key permissions.');
      }
      if (res.status === 429) {
        const errText = await res.text();
        if (errText.toLowerCase().includes('credit') || errText.toLowerCase().includes('quota')) {
          throw new Error('QUOTA_EXHAUSTED: Anthropic credits exhausted or quota exceeded.');
        }
        throw new Error('RATE_LIMIT: Anthropic rate limit reached. Please retry shortly.');
      }
      if (res.status === 529) {
        throw new Error('Anthropic API overloaded. Please retry shortly.');
      }
      if (!res.ok) {
        const errStr = await res.text();
        throw new Error(`Anthropic API Error ${res.status}: ${errStr.slice(0, 300)}`);
      }

      const data = (await res.json()) as any;
      const rawStr = JSON.stringify(data, null, 2);

      // Claude returns content as an array of blocks
      const textBlock = (data.content || []).find((b: any) => b.type === 'text');
      const rawText = textBlock?.text || '{}';

      let parsed: any;
      try {
        // First try direct parse
        parsed = JSON.parse(rawText.trim());
      } catch {
        // Strip any markdown code fences Claude may emit
        const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          try { parsed = JSON.parse(jsonMatch[1].trim()); } catch { parsed = {}; }
        } else {
          // Try extracting first { ... } block
          const braceMatch = rawText.match(/\{[\s\S]*\}/);
          if (braceMatch) {
            try { parsed = JSON.parse(braceMatch[0]); } catch { parsed = {}; }
          } else {
            throw new Error('Failed to parse Anthropic Claude response as JSON.');
          }
        }
      }

      return {
        success: true,
        provider: this.id,
        model: modelToUse,
        latency: Date.now() - start,
        tokens: {
          prompt: data.usage?.input_tokens || 0,
          completion: data.usage?.output_tokens || 0,
          total: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
        },
        finishReason: data.stop_reason || 'end_turn',
        rawResponse: rawStr,
        parsedResponse: parsed
      };

    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Anthropic API request timed out after 30 seconds.');
      }
      // Re-throw classified errors as-is
      if (err.message?.startsWith('AUTH_ERROR:') || err.message?.startsWith('QUOTA_EXHAUSTED:') || err.message?.startsWith('RATE_LIMIT:')) {
        throw err;
      }
      throw new Error(`Anthropic API Failed: ${err.message}`);
    }
  }

  /**
   * Validates an Anthropic API key by sending a minimal test message.
   */
  async validateKey(apiKey: string): Promise<{ valid: boolean; message: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(`${ANTHROPIC_API_BASE}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': ANTHROPIC_API_VERSION,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 5,
          messages: [{ role: 'user', content: 'Hi' }]
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) return { valid: true, message: `Anthropic Claude Connected — claude-3-haiku-20240307` };
      if (res.status === 401) return { valid: false, message: 'Invalid Anthropic API key.' };
      if (res.status === 403) return { valid: false, message: 'Anthropic API access forbidden. Check key permissions.' };
      return { valid: false, message: `Anthropic API returned HTTP ${res.status}` };
    } catch (err: any) {
      if (err.name === 'AbortError') return { valid: false, message: 'Anthropic connection timed out.' };
      return { valid: false, message: `Network error: ${err.message}` };
    }
  }

  async generateKeywords(options: GenerateVisionOptions): Promise<string[]> {
    const meta = await this.generateMetadata(options);
    return meta.parsedResponse?.keywords || [];
  }


  async healthCheck(): Promise<{ isHealthy: boolean; message: string; latency: number }> {
    const start = Date.now();
    try {
      const key = process.env[this.id.toUpperCase() + '_API_KEY'] || '';
      const res = await this.validateKey(key);
      return { isHealthy: res.valid, message: res.message, latency: Date.now() - start };
    } catch (e: any) {
      return { isHealthy: false, message: e.message, latency: Date.now() - start };
    }
  }

}
