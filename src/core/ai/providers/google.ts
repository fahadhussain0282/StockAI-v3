import { BaseAiProvider } from './base-provider';
import { AiModelDefinition, GenerateVisionOptions, NormalizedAiResponse } from '../types';
import { GOOGLE_MODELS, GOOGLE_VISION_FALLBACK_CHAIN, GOOGLE_DEFAULT_VISION_MODEL, GOOGLE_DEFAULT_TEXT_MODEL } from '../models/google-models';
import { GoogleGenAI } from '@google/genai';

export class GoogleProvider extends BaseAiProvider {
  readonly id = 'google-gemini';
  readonly name = 'Google Gemini';

  /**
   * isEnabled: returns true if any key source is available.
   * Priority: pool keys (checked by Gateway) OR ENV variable.
   * NOTE: The Gateway also checks ApiKeyManager.hasAvailableKey() before calling this.
   * This method is used as a final fallback guard when no pool keys exist.
   */
  isEnabled(): boolean {
    const key = process.env.GEMINI_API_KEY;
    return !!key && key.trim().length > 0;
  }

  getDefaultModel(): string {
    return GOOGLE_DEFAULT_TEXT_MODEL;
  }

  getVisionModel(): string {
    return GOOGLE_DEFAULT_VISION_MODEL;
  }

  listModels(): AiModelDefinition[] {
    return GOOGLE_MODELS;
  }

  getVisionFallbackChain(): string[] {
    return GOOGLE_VISION_FALLBACK_CHAIN;
  }

  getTextFallbackChain(): string[] {
    return [GOOGLE_DEFAULT_TEXT_MODEL, ...GOOGLE_VISION_FALLBACK_CHAIN];
  }

  async generateMetadata(options: GenerateVisionOptions): Promise<NormalizedAiResponse> {
    const key = (options.customApiKey && options.customApiKey.trim().length > 0)
      ? options.customApiKey.trim()
      : process.env.GEMINI_API_KEY;

    if (!key || key.trim().length === 0) {
      throw new Error('AUTH_ERROR: GEMINI_API_KEY is not configured or invalid.');
    }

    const ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: { headers: { 'User-Agent': 'stockai-gateway/3.0' } }
    });

    const REQUEST_TIMEOUT_MS = 25000;

    const modelToUse = options.model || this.getVisionModel();
    if (!this.supportsVision(modelToUse) && options.base64Image) {
      throw new Error(`Model ${modelToUse} does not support vision capabilities.`);
    }

    const start = Date.now();
    let responseText = '';
    let parsed: any;
    let rawStr = '';
    let tokens = { prompt: 0, completion: 0, total: 0 };
    let finishReason = 'unknown';

    try {
      const config: any = {
        systemInstruction: options.systemInstruction,
        responseMimeType: 'application/json',
      };

      if (options.responseSchema) {
        config.responseSchema = options.responseSchema;
      }

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      let response;
      try {
        if (options.base64Image) {
          const cleanBase64 = options.base64Image.replace(/^data:[^;]+;base64,/, '');
          response = await ai.models.generateContent({
            model: modelToUse,
            contents: {
              parts: [
                { inlineData: { mimeType: options.mimeType || 'image/jpeg', data: cleanBase64 } },
                { text: options.userPrompt }
              ]
            },
            config
          });
        } else {
          response = await ai.models.generateContent({
            model: modelToUse,
            contents: options.userPrompt,
            config
          });
        }
      } finally {
        clearTimeout(timeoutId);
      }

      responseText = response.text || '';
      rawStr = JSON.stringify(response, null, 2);

      if (response.usageMetadata) {
        tokens = {
          prompt: response.usageMetadata.promptTokenCount || 0,
          completion: response.usageMetadata.candidatesTokenCount || 0,
          total: response.usageMetadata.totalTokenCount || 0
        };
      }
      if (response.candidates && response.candidates.length > 0) {
        finishReason = response.candidates[0].finishReason || 'unknown';
      }

      try {
        parsed = JSON.parse(responseText.trim() || '{}');
      } catch (e) {
        // Try extracting JSON from the response text
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try { parsed = JSON.parse(jsonMatch[0]); } catch { parsed = {}; }
        } else {
          throw new Error('Failed to parse AI response as JSON.');
        }
      }

    } catch (err: any) {
      const errMsg: string = err.message || 'Unknown error';
      if (err.name === 'AbortError' || errMsg.includes('aborted')) {
        throw new Error(`TIMEOUT: Google Gemini request timed out after ${REQUEST_TIMEOUT_MS / 1000}s.`);
      }
      if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('INVALID_ARGUMENT') || errMsg.includes('401') || errMsg.includes('403') || errMsg.includes('permission')) {
        throw new Error(`AUTH_ERROR: Google Gemini API key is invalid or unauthorized. ${errMsg}`);
      }
      if (errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('429') || errMsg.includes('rate') || errMsg.includes('quota')) {
        if (errMsg.toLowerCase().includes('daily') || errMsg.toLowerCase().includes('monthly') || errMsg.toLowerCase().includes('billing')) {
          throw new Error(`QUOTA_EXHAUSTED: Google Gemini quota exceeded. ${errMsg}`);
        }
        throw new Error(`RATE_LIMIT: Google Gemini rate limit reached. ${errMsg}`);
      }
      throw new Error(`Google API Failed: ${errMsg}`);
    }

    return {
      success: true,
      provider: this.id,
      model: modelToUse,
      latency: Date.now() - start,
      tokens,
      finishReason,
      rawResponse: rawStr,
      parsedResponse: parsed
    };
  }

  /**
   * Validates a Google Gemini API key by sending a minimal generation request.
   */
  async validateKey(apiKey: string): Promise<{ valid: boolean; message: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'stockai-gateway/3.0' } }
      });
      try {
        const r = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: 'Reply with only: OK'
        });
        clearTimeout(timeoutId);
        if (r && r.text) {
          return { valid: true, message: 'Google Gemini Connected — gemini-2.5-flash' };
        }
        return { valid: false, message: 'Gemini returned empty response.' };
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return { valid: false, message: 'Google Gemini connection timed out.' };
      const msg = err.message || '';
      if (msg.includes('API_KEY_INVALID') || msg.includes('401') || msg.includes('403')) {
        return { valid: false, message: 'Invalid Google Gemini API key.' };
      }
      if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
        return { valid: true, message: 'Key valid — currently rate limited.' };
      }
      return { valid: false, message: `Gemini error: ${msg.slice(0, 100)}` };
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
