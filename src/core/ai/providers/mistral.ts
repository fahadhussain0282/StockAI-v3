import { BaseAiProvider } from './base-provider';
import { AiModelDefinition, GenerateVisionOptions, NormalizedAiResponse } from '../types';
import {
  MISTRAL_MODELS,
  MISTRAL_VISION_FALLBACK_CHAIN,
  MISTRAL_TEXT_FALLBACK_CHAIN,
  MISTRAL_DEFAULT_VISION_MODEL,
  MISTRAL_DEFAULT_TEXT_MODEL
} from '../models/mistral-models';

const MISTRAL_API_BASE = 'https://api.mistral.ai/v1';
const REQUEST_TIMEOUT_MS = 30000;

export class MistralProvider extends BaseAiProvider {
  readonly id = 'mistral';
  readonly name = 'Mistral AI';

  isEnabled(): boolean {
    const key = process.env.MISTRAL_API_KEY;
    return !!key && key.trim().length > 0;
  }

  getDefaultModel(): string {
    return MISTRAL_DEFAULT_TEXT_MODEL;
  }

  getVisionModel(): string {
    return MISTRAL_DEFAULT_VISION_MODEL;
  }

  listModels(): AiModelDefinition[] {
    return MISTRAL_MODELS;
  }

  getVisionFallbackChain(): string[] {
    return MISTRAL_VISION_FALLBACK_CHAIN;
  }

  getTextFallbackChain(): string[] {
    return MISTRAL_TEXT_FALLBACK_CHAIN;
  }

  async generateVisionAnalysis(options: GenerateVisionOptions): Promise<NormalizedAiResponse> {
    const key = (options.customApiKey && options.customApiKey.trim().length > 0)
      ? options.customApiKey.trim()
      : process.env.MISTRAL_API_KEY;

    if (!key || key.trim().length === 0) {
      throw new Error('AUTH_ERROR: MISTRAL_API_KEY is not configured or invalid.');
    }

    const isVision = !!(options.base64Image && options.base64Image.length > 0);
    const modelToUse = options.model || (isVision ? this.getVisionModel() : this.getDefaultModel());

    if (isVision && !this.supportsVision(modelToUse)) {
      // Fall back to a vision-capable model
      const visionModel = MISTRAL_VISION_FALLBACK_CHAIN[0];
      if (!visionModel) {
        throw new Error('Mistral: No vision-capable model available for image analysis.');
      }
    }

    const start = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      // Build message content for Mistral (OpenAI-compatible format)
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
        { role: 'user', content: userContent.length === 1 ? userContent[0].text : userContent }
      ];

      const body: any = {
        model: isVision ? (this.supportsVision(modelToUse) ? modelToUse : MISTRAL_VISION_FALLBACK_CHAIN[0]) : modelToUse,
        messages,
        response_format: { type: 'json_object' },
        max_tokens: 4096,
        temperature: 0.3
      };

      const res = await fetch(`${MISTRAL_API_BASE}/chat/completions`, {
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
        throw new Error('AUTH_ERROR: Mistral API key is invalid or unauthorized.');
      }
      if (res.status === 429) {
        const errText = await res.text();
        if (errText.toLowerCase().includes('quota') || errText.toLowerCase().includes('billing')) {
          throw new Error('QUOTA_EXHAUSTED: Mistral quota exceeded or billing issue.');
        }
        throw new Error('RATE_LIMIT: Mistral rate limit reached. Please retry shortly.');
      }
      if (!res.ok) {
        const errStr = await res.text();
        throw new Error(`Mistral API Error ${res.status}: ${errStr.slice(0, 300)}`);
      }

      const data = await res.json();
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
            throw new Error('Failed to parse Mistral response as JSON.');
          }
        }
      }

      return {
        success: true,
        provider: this.id,
        model: body.model,
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
        throw new Error('TIMEOUT: Mistral API request timed out after 30 seconds.');
      }
      if (err.message?.startsWith('AUTH_ERROR:') || err.message?.startsWith('QUOTA_EXHAUSTED:') || err.message?.startsWith('RATE_LIMIT:') || err.message?.startsWith('TIMEOUT:')) {
        throw err;
      }
      throw new Error(`Mistral API Failed: ${err.message}`);
    }
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; message: string; models?: string[] }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${MISTRAL_API_BASE}/models`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const modelIds = (data.data || []).map((m: any) => m.id).slice(0, 10);
        return { valid: true, message: `Mistral AI Connected — ${modelIds.length} models available`, models: modelIds };
      }
      if (res.status === 401) return { valid: false, message: 'Invalid Mistral API key.' };
      return { valid: false, message: `Mistral API returned HTTP ${res.status}` };
    } catch (err: any) {
      if (err.name === 'AbortError') return { valid: false, message: 'Mistral connection timed out.' };
      return { valid: false, message: `Network error: ${err.message}` };
    }
  }
}
