import { BaseAiProvider } from './base-provider';
import { AiModelDefinition, GenerateVisionOptions, NormalizedAiResponse } from '../types';
import {
  OPENAI_MODELS,
  OPENAI_VISION_FALLBACK_CHAIN,
  OPENAI_TEXT_FALLBACK_CHAIN,
  OPENAI_DEFAULT_VISION_MODEL,
  OPENAI_DEFAULT_TEXT_MODEL
} from '../models/openai-models';

const OPENAI_API_BASE = 'https://api.openai.com/v1';
const REQUEST_TIMEOUT_MS = 30000;

export class OpenAiProvider extends BaseAiProvider {
  readonly id = 'openai';
  readonly name = 'OpenAI';

  isEnabled(): boolean {
    const key = process.env.OPENAI_API_KEY;
    return !!key && key.trim().length > 0;
  }

  getDefaultModel(): string {
    return OPENAI_DEFAULT_TEXT_MODEL;
  }

  getVisionModel(): string {
    return OPENAI_DEFAULT_VISION_MODEL;
  }

  listModels(): AiModelDefinition[] {
    return OPENAI_MODELS;
  }

  getVisionFallbackChain(): string[] {
    return OPENAI_VISION_FALLBACK_CHAIN;
  }

  getTextFallbackChain(): string[] {
    return OPENAI_TEXT_FALLBACK_CHAIN;
  }

  async generateVisionAnalysis(options: GenerateVisionOptions): Promise<NormalizedAiResponse> {
    const key = (options.customApiKey && options.customApiKey.trim().length > 0)
      ? options.customApiKey.trim()
      : process.env.OPENAI_API_KEY;

    if (!key || key.trim().length === 0) {
      throw new Error('AUTH_ERROR: OPENAI_API_KEY is not configured or invalid.');
    }

    const modelToUse = options.model || (options.base64Image ? this.getVisionModel() : this.getDefaultModel());

    if (options.base64Image && !this.supportsVision(modelToUse)) {
      throw new Error(`Model ${modelToUse} does not support vision capabilities.`);
    }

    const start = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      // Build message content
      const userContent: any[] = [];
      if (options.base64Image) {
        const cleanBase64 = options.base64Image.replace(/^data:[^;]+;base64,/, '');
        const mime = options.mimeType || 'image/jpeg';
        userContent.push({
          type: 'image_url',
          image_url: { url: `data:${mime};base64,${cleanBase64}`, detail: 'high' }
        });
      }
      userContent.push({ type: 'text', text: options.userPrompt });

      const messages: any[] = [
        { role: 'system', content: options.systemInstruction },
        { role: 'user', content: userContent }
      ];

      const body: any = {
        model: modelToUse,
        messages,
        response_format: { type: 'json_object' },
        max_tokens: 4096,
        temperature: 0.3
      };

      const res = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
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
        throw new Error('AUTH_ERROR: OpenAI API key is invalid or unauthorized.');
      }
      if (res.status === 429) {
        const errText = await res.text();
        if (errText.toLowerCase().includes('quota') || errText.toLowerCase().includes('billing') || errText.toLowerCase().includes('exceeded')) {
          throw new Error('QUOTA_EXHAUSTED: OpenAI quota exceeded or billing issue. RAW RESPONSE: ' + errText);
        }
        throw new Error('RATE_LIMIT: OpenAI rate limit reached. Please retry shortly. RAW RESPONSE: ' + errText);
      }
      if (!res.ok) {
        const errStr = await res.text();
        throw new Error(`OpenAI API Error ${res.status}: ${errStr.slice(0, 300)}`);
      }

      const data = (await res.json()) as any;
      const rawStr = JSON.stringify(data, null, 2);
      const content = data.choices?.[0]?.message?.content || '{}';

      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch {
        // Try extracting JSON from markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          try { parsed = JSON.parse(jsonMatch[1]); } catch { parsed = {}; }
        } else {
          throw new Error('Failed to parse OpenAI response as JSON.');
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
        throw new Error('OpenAI API request timed out after 30 seconds.');
      }
      // Re-throw classified errors as-is
      if (err.message?.startsWith('AUTH_ERROR:') || err.message?.startsWith('QUOTA_EXHAUSTED:') || err.message?.startsWith('RATE_LIMIT:')) {
        throw err;
      }
      throw new Error(`OpenAI API Failed: ${err.message}`);
    }
  }

  /**
   * Validates an OpenAI API key by calling the models endpoint.
   * Returns structured result for Admin API management.
   */
  async validateKey(apiKey: string): Promise<{ valid: boolean; message: string; models?: string[] }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${OPENAI_API_BASE}/models`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = (await res.json()) as any;
        const gptModels = (data.data || [])
          .filter((m: any) => m.id.startsWith('gpt-') || m.id.startsWith('o4'))
          .map((m: any) => m.id)
          .slice(0, 20);
        return { valid: true, message: `OpenAI Connected — ${gptModels.length} models available`, models: gptModels };
      }
      if (res.status === 401) return { valid: false, message: 'Invalid OpenAI API key.' };
      return { valid: false, message: `OpenAI API returned HTTP ${res.status}` };
    } catch (err: any) {
      if (err.name === 'AbortError') return { valid: false, message: 'OpenAI connection timed out.' };
      return { valid: false, message: `Network error: ${err.message}` };
    }
  }
}
