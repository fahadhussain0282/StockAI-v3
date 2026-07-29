import { BaseAiProvider } from './base-provider';
import { AiModelDefinition, GenerateVisionOptions, NormalizedAiResponse } from '../types';
import { GOOGLE_MODELS, GOOGLE_VISION_FALLBACK_CHAIN, GOOGLE_DEFAULT_VISION_MODEL, GOOGLE_DEFAULT_TEXT_MODEL } from '../models/google-models';
import { GoogleGenAI, Type } from '@google/genai';

export class GoogleProvider extends BaseAiProvider {
  readonly id = 'google-gemini';
  readonly name = 'Google Gemini';

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

  async generateVisionAnalysis(options: GenerateVisionOptions): Promise<NormalizedAiResponse> {
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

      let response;
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
        throw new Error('Failed to parse AI response as JSON.');
      }

    } catch (err: any) {
      const errMsg: string = err.message || 'Unknown error';
      if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('INVALID_ARGUMENT') || errMsg.includes('401') || errMsg.includes('403')) {
        throw new Error(`AUTH_ERROR: Google Gemini API key is invalid or unauthorized. ${errMsg}`);
      }
      if (errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('429')) {
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
}
