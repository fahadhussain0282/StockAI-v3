import { BaseAiProvider } from './base-provider';
import { AiModelDefinition, GenerateVisionOptions, NormalizedAiResponse } from '../types';
import {
  TOGETHER_MODELS,
  TOGETHER_VISION_FALLBACK_CHAIN,
  TOGETHER_TEXT_FALLBACK_CHAIN,
  TOGETHER_DEFAULT_VISION_MODEL,
  TOGETHER_DEFAULT_TEXT_MODEL
} from '../models/together-models';

const TOGETHER_API_BASE = 'https://api.together.xyz/v1';
const REQUEST_TIMEOUT_MS = 30000;

export class TogetherProvider extends BaseAiProvider {
  readonly id = 'together';
  readonly name = 'Together AI';

  isEnabled(): boolean {
    const key = process.env.TOGETHER_API_KEY;
    return !!key && key.trim().length > 0;
  }

  getDefaultModel(): string {
    return TOGETHER_DEFAULT_TEXT_MODEL;
  }

  getVisionModel(): string {
    return TOGETHER_DEFAULT_VISION_MODEL;
  }

  listModels(): AiModelDefinition[] {
    return TOGETHER_MODELS;
  }

  getVisionFallbackChain(): string[] {
    return TOGETHER_VISION_FALLBACK_CHAIN;
  }

  getTextFallbackChain(): string[] {
    return TOGETHER_TEXT_FALLBACK_CHAIN;
  }

  async generateMetadata(options: GenerateVisionOptions): Promise<NormalizedAiResponse> {
    const key = (options.customApiKey && options.customApiKey.trim().length > 0)
      ? options.customApiKey.trim()
      : process.env.TOGETHER_API_KEY;

    if (!key || key.trim().length === 0) {
      throw new Error('AUTH_ERROR: TOGETHER_API_KEY is not configured or invalid.');
    }

    const isVision = !!(options.base64Image && options.base64Image.length > 0);
    const modelToUse = options.model || (isVision ? this.getVisionModel() : this.getDefaultModel());

    const start = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      // Together AI uses OpenAI-compatible API
      const userContent: any[] = [];

      if (isVision && options.base64Image) {
        const cleanBase64 = options.base64Image.replace(/^data:[^;]+;base64,/, '');
        const mime = options.mimeType || 'image/jpeg';
        userContent.push({
          type: 'image_url',
          image_url: { url: `data:${mime};base64,${cleanBase64}` }
        });
      }

      userContent.push({ type: 'text', text: options.userPrompt });

      const messages: any[] = [
        { role: 'system', content: options.systemInstruction },
        {
          role: 'user',
          content: (isVision && options.base64Image) ? userContent : options.userPrompt
        }
      ];

      const body: any = {
        model: modelToUse,
        messages,
        max_tokens: 4096,
        temperature: 0.3,
        // Together AI supports response_format for some models
        ...(this.supportsJson(modelToUse) ? { response_format: { type: 'json_object' } } : {})
      };

      const res = await fetch(`${TOGETHER_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'User-Agent': 'stockai-gateway/3.0'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.status === 401 || res.status === 403) {
        throw new Error('AUTH_ERROR: Together AI API key is invalid or unauthorized.');
      }
      if (res.status === 429) {
        const errText = await res.text();
        if (errText.toLowerCase().includes('quota') || errText.toLowerCase().includes('credit')) {
          throw new Error('QUOTA_EXHAUSTED: Together AI credits exhausted or quota exceeded.');
        }
        throw new Error('RATE_LIMIT: Together AI rate limit reached. Please retry shortly.');
      }
      if (!res.ok) {
        const errStr = await res.text();
        throw new Error(`Together AI API Error ${res.status}: ${errStr.slice(0, 300)}`);
      }

      const data = (await res.json()) as any;
      const rawStr = JSON.stringify(data, null, 2);
      const content = data.choices?.[0]?.message?.content || '{}';

      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch {
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          try { parsed = JSON.parse(jsonMatch[1]); } catch { parsed = {}; }
        } else {
          const braceMatch = content.match(/\{[\s\S]*\}/);
          if (braceMatch) {
            try { parsed = JSON.parse(braceMatch[0]); } catch { parsed = {}; }
          } else {
            throw new Error('Failed to parse Together AI response as JSON.');
          }
        }
      }

      return {
        success: true,
        provider: this.id,
        model: modelToUse,
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
        throw new Error('TIMEOUT: Together AI request timed out after 30 seconds.');
      }
      if (err.message?.startsWith('AUTH_ERROR:') || err.message?.startsWith('QUOTA_EXHAUSTED:') || err.message?.startsWith('RATE_LIMIT:') || err.message?.startsWith('TIMEOUT:')) {
        throw err;
      }
      throw new Error(`Together AI Failed: ${err.message}`);
    }
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; message: string; models?: string[] }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${TOGETHER_API_BASE}/models`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = (await res.json()) as any;
        const modelIds = Array.isArray(data) ? data.map((m: any) => m.id).slice(0, 10) : [];
        return { valid: true, message: `Together AI Connected — ${modelIds.length}+ models available`, models: modelIds };
      }
      if (res.status === 401) return { valid: false, message: 'Invalid Together AI API key.' };
      return { valid: false, message: `Together AI returned HTTP ${res.status}` };
    } catch (err: any) {
      if (err.name === 'AbortError') return { valid: false, message: 'Together AI connection timed out.' };
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
