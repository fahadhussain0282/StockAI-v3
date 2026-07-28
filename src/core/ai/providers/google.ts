import { BaseAiProvider } from './base-provider';
import { AiModelDefinition, GenerateVisionOptions, NormalizedAiResponse } from '../types';
import { GOOGLE_MODELS } from '../models/google-models';
import { GoogleGenAI, Type } from '@google/genai';

export class GoogleProvider extends BaseAiProvider {
  readonly id = 'google-gemini';
  readonly name = 'Google Gemini';

  getDefaultModel(): string {
    return 'gemini-2.5-flash';
  }

  getVisionModel(): string {
    return 'gemini-2.5-flash';
  }

  listModels(): AiModelDefinition[] {
    return GOOGLE_MODELS;
  }

  async generateVisionAnalysis(options: GenerateVisionOptions): Promise<NormalizedAiResponse> {
    const key = (options.customApiKey && options.customApiKey.trim().length > 0) 
      ? options.customApiKey.trim() 
      : process.env.GEMINI_API_KEY;
      
    if (!key || key.trim().length === 0) {
      throw new Error('GEMINI_API_KEY is not configured or invalid.');
    }

    const ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: { headers: { 'User-Agent': 'stockai-gateway' } }
    });

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
      throw new Error(`Google API Failed: ${err.message}`);
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
