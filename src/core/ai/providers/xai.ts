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

  async generateMetadata(options: GenerateVisionOptions): Promise<NormalizedAiResponse> {
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

      const hasImage = !!(options.base64Image && options.base64Image.length > 0);

      if (hasImage) {
        const cleanBase64 = options.base64Image!.replace(/^data:[^;]+;base64,/, '');
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

      // CRITICAL FIX: xAI grok-2-vision-* does NOT support response_format: json_object
      // when images are included in the request. This causes HTTP 400 Bad Request.
      // For vision requests: omit response_format and parse JSON from text response.
      // For text-only requests: use json_object mode safely.
      const requestBody: any = {
        model: modelToUse,
        messages,
        max_tokens: 4096,
        temperature: 0.3
      };
      if (!hasImage) {
        requestBody.response_format = { type: 'json_object' };
      }

      console.log(`[xAI Provider] Sending request: model=${modelToUse} hasImage=${hasImage} response_format=${!hasImage ? 'json_object' : 'OMITTED (vision)' }`);

      const res = await fetch(`${XAI_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'User-Agent': 'stockai-gateway/3.0'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Always capture body for error logging
      const responseBodyText = await res.text();
      console.log(`[xAI Provider] Response: HTTP ${res.status}`);
      if (!res.ok) {
        console.error(`[xAI Provider] ERROR BODY:\n  Status : ${res.status}\n  Headers: content-type=${res.headers.get('content-type')}\n  Body   : ${responseBodyText.slice(0, 500)}`);
      }

      if (res.status === 401 || res.status === 403) {
        throw new Error('AUTH_ERROR: xAI API key is invalid or unauthorized.');
      }
      if (res.status === 429) {
        if (responseBodyText.toLowerCase().includes('quota') || responseBodyText.toLowerCase().includes('billing') || responseBodyText.toLowerCase().includes('exceeded')) {
          throw new Error('QUOTA_EXHAUSTED: xAI quota exceeded or billing issue.');
        }
        throw new Error('RATE_LIMIT: xAI rate limit reached. Please retry shortly.');
      }
      if (!res.ok) {
        // Expose full provider error to logs (sanitized before client)
        let providerError = responseBodyText.slice(0, 400);
        try {
          const parsed = JSON.parse(responseBodyText);
          providerError = parsed?.error?.message || parsed?.detail || providerError;
        } catch {}
        throw new Error(`xAI API Error ${res.status}: ${providerError}`);
      }

      const data = JSON.parse(responseBodyText);
      rawStr = JSON.stringify(data, null, 2);
      const content = data.choices?.[0]?.message?.content || '{}';

      try {
        parsed = JSON.parse(content);
      } catch {
        // Try extracting JSON object from the response (model may wrap in markdown)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try { parsed = JSON.parse(jsonMatch[0]); } catch { parsed = {}; }
        } else {
          // Also try extracting from full text in case there's no JSON braces
          console.warn('[xAI Provider] Failed to parse response as JSON, raw content:', content.slice(0, 300));
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
