import { BaseAiProvider } from './base-provider';
import { AiModelDefinition, GenerateVisionOptions, NormalizedAiResponse } from '../types';
import { XAI_MODELS, XAI_VISION_FALLBACK_CHAIN, XAI_TEXT_FALLBACK_CHAIN, XAI_DEFAULT_VISION_MODEL, XAI_DEFAULT_TEXT_MODEL } from '../models/xai-models';

const XAI_API_BASE = 'https://api.x.ai/v1';

export class XAiProvider extends BaseAiProvider {
  readonly id = 'xai';
  readonly name = 'xAI (Grok)';

  isEnabled(): boolean {
    const key = process.env.XAI_API_KEY;
    return !!key && key.trim().length > 0;
  }

  getDefaultModel(): string {
    return XAI_DEFAULT_TEXT_MODEL;
  }

  getVisionModel(): string {
    return XAI_DEFAULT_VISION_MODEL;
  }

  listModels(): AiModelDefinition[] {
    return XAI_MODELS;
  }

  getVisionFallbackChain(): string[] {
    return XAI_VISION_FALLBACK_CHAIN;
  }

  getTextFallbackChain(): string[] {
    return XAI_TEXT_FALLBACK_CHAIN;
  }

  async generateVisionAnalysis(options: GenerateVisionOptions): Promise<NormalizedAiResponse> {
    const key = (options.customApiKey && options.customApiKey.trim().length > 0)
      ? options.customApiKey.trim()
      : process.env.XAI_API_KEY;

    if (!key || key.trim().length === 0) {
      throw new Error('AUTH_ERROR: XAI_API_KEY is not configured or invalid.');
    }

    const modelToUse = options.model || this.getVisionModel();
    if (!this.supportsVision(modelToUse) && options.base64Image) {
      throw new Error(`Model ${modelToUse} does not support vision capabilities.`);
    }

    const start = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    let parsed: any;
    let rawStr = '';

    try {
      const messages: any[] = [
        { role: 'system', content: options.systemInstruction }
      ];

      if (options.base64Image) {
        const cleanBase64 = options.base64Image.replace(/^data:[^;]+;base64,/, '');
        const mime = options.mimeType || 'image/jpeg';
        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: options.userPrompt },
            { type: 'image_url', image_url: { url: `data:${mime};base64,${cleanBase64}` } }
          ]
        });
      } else {
        messages.push({ role: 'user', content: options.userPrompt });
      }

      const res = await fetch(`${XAI_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'User-Agent': 'stockai-gateway/3.0'
        },
        body: JSON.stringify({
          model: modelToUse,
          messages,
          response_format: { type: 'json_object' }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.status === 401 || res.status === 403) {
        throw new Error('AUTH_ERROR: xAI API key is invalid or unauthorized.');
      }
      if (res.status === 429) {
        const errText = await res.text();
        if (errText.toLowerCase().includes('quota') || errText.toLowerCase().includes('billing') || errText.toLowerCase().includes('exceeded')) {
          throw new Error('QUOTA_EXHAUSTED: xAI quota exceeded or billing issue.');
        }
        throw new Error('RATE_LIMIT: xAI rate limit reached. Please retry shortly.');
      }
      if (!res.ok) {
        const errStr = await res.text();
        throw new Error(`xAI API Error: ${res.status} ${errStr.slice(0, 200)}`);
      }

      const data = await res.json();
      rawStr = JSON.stringify(data, null, 2);
      const content = data.choices?.[0]?.message?.content || '{}';

      try {
        parsed = JSON.parse(content);
      } catch {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try { parsed = JSON.parse(jsonMatch[0]); } catch { parsed = {}; }
        } else {
          throw new Error('Failed to parse xAI response as JSON.');
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
        finishReason: data.choices?.[0]?.finish_reason || 'unknown',
        rawResponse: rawStr,
        parsedResponse: parsed
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') throw new Error(`TIMEOUT: xAI API request timed out after 25s.`);
      if (err.message?.startsWith('AUTH_ERROR:') || err.message?.startsWith('RATE_LIMIT:') || err.message?.startsWith('QUOTA_EXHAUSTED:')) throw err;
      throw new Error(`xAI API Failed: ${err.message}`);
    }
  }

  /**
   * Validates an xAI API key by calling the models endpoint.
   */
  async validateKey(apiKey: string): Promise<{ valid: boolean; message: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${XAI_API_BASE}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': 'stockai-gateway/3.0'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        return { valid: true, message: 'xAI (Grok) Connected — models available' };
      }
      if (res.status === 401 || res.status === 403) return { valid: false, message: 'Invalid xAI API key.' };
      return { valid: false, message: `xAI API returned HTTP ${res.status}` };
    } catch (err: any) {
      if (err.name === 'AbortError') return { valid: false, message: 'xAI connection timed out.' };
      return { valid: false, message: `Network error: ${err.message}` };
    }
  }
}
