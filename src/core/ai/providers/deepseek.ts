import { BaseAiProvider } from './base-provider';
import { AiModelDefinition, GenerateVisionOptions, NormalizedAiResponse } from '../types';
import {
  DEEPSEEK_MODELS,
  DEEPSEEK_VISION_FALLBACK_CHAIN,
  DEEPSEEK_TEXT_FALLBACK_CHAIN,
  DEEPSEEK_DEFAULT_VISION_MODEL,
  DEEPSEEK_DEFAULT_TEXT_MODEL
} from '../models/deepseek-models';

const DEEPSEEK_API_BASE = 'https://api.deepseek.com/v1';
const REQUEST_TIMEOUT_MS = 30000;

export class DeepSeekProvider extends BaseAiProvider {
  readonly id = 'deepseek';
  readonly name = 'DeepSeek AI';

  isEnabled(): boolean {
    const key = process.env.DEEPSEEK_API_KEY;
    return !!key && key.trim().length > 0;
  }

  getDefaultModel(): string {
    return DEEPSEEK_DEFAULT_TEXT_MODEL;
  }

  getVisionModel(): string {
    return DEEPSEEK_DEFAULT_VISION_MODEL;
  }

  listModels(): AiModelDefinition[] {
    return DEEPSEEK_MODELS;
  }

  getVisionFallbackChain(): string[] {
    return DEEPSEEK_VISION_FALLBACK_CHAIN;
  }

  getTextFallbackChain(): string[] {
    return DEEPSEEK_TEXT_FALLBACK_CHAIN;
  }

  async generateVisionAnalysis(options: GenerateVisionOptions): Promise<NormalizedAiResponse> {
    const key = (options.customApiKey && options.customApiKey.trim().length > 0)
      ? options.customApiKey.trim()
      : process.env.DEEPSEEK_API_KEY;

    if (!key || key.trim().length === 0) {
      throw new Error('AUTH_ERROR: DEEPSEEK_API_KEY is not configured or invalid.');
    }

    // DeepSeek is text-only; if vision is requested, we process text description only
    const modelToUse = options.model || this.getDefaultModel();

    const start = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      // DeepSeek uses OpenAI-compatible API (text only)
      let promptText = options.userPrompt;
      if (options.base64Image) {
        // If image was provided but DeepSeek can't process it, note this in prompt
        promptText = `[Note: Image analysis requested but DeepSeek text model is being used. Please generate metadata based on the text description provided.]\n\n${options.userPrompt}`;
      }

      const messages: any[] = [
        { role: 'system', content: options.systemInstruction },
        { role: 'user', content: promptText }
      ];

      const body: any = {
        model: modelToUse,
        messages,
        response_format: { type: 'json_object' },
        max_tokens: 4096,
        temperature: 0.3
      };

      const res = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
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
        throw new Error('AUTH_ERROR: DeepSeek API key is invalid or unauthorized.');
      }
      if (res.status === 429) {
        const errText = await res.text();
        if (errText.toLowerCase().includes('quota') || errText.toLowerCase().includes('balance') || errText.toLowerCase().includes('insufficient')) {
          throw new Error('QUOTA_EXHAUSTED: DeepSeek account balance insufficient or quota exceeded.');
        }
        throw new Error('RATE_LIMIT: DeepSeek rate limit reached. Please retry shortly.');
      }
      if (!res.ok) {
        const errStr = await res.text();
        throw new Error(`DeepSeek API Error ${res.status}: ${errStr.slice(0, 300)}`);
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
            throw new Error('Failed to parse DeepSeek response as JSON.');
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
        throw new Error('TIMEOUT: DeepSeek API request timed out after 30 seconds.');
      }
      if (err.message?.startsWith('AUTH_ERROR:') || err.message?.startsWith('QUOTA_EXHAUSTED:') || err.message?.startsWith('RATE_LIMIT:') || err.message?.startsWith('TIMEOUT:')) {
        throw err;
      }
      throw new Error(`DeepSeek API Failed: ${err.message}`);
    }
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; message: string; models?: string[] }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${DEEPSEEK_API_BASE}/models`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = (await res.json()) as any;
        const modelIds = (data.data || []).map((m: any) => m.id).slice(0, 10);
        return { valid: true, message: `DeepSeek AI Connected — ${modelIds.length} models available`, models: modelIds };
      }
      if (res.status === 401) return { valid: false, message: 'Invalid DeepSeek API key.' };
      return { valid: false, message: `DeepSeek API returned HTTP ${res.status}` };
    } catch (err: any) {
      if (err.name === 'AbortError') return { valid: false, message: 'DeepSeek connection timed out.' };
      return { valid: false, message: `Network error: ${err.message}` };
    }
  }
}
