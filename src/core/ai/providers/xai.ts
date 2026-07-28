import { BaseAiProvider } from './base-provider';
import { AiModelDefinition, GenerateVisionOptions, NormalizedAiResponse } from '../types';
import { XAI_MODELS } from '../models/xai-models';

export class XAiProvider extends BaseAiProvider {
  readonly id = 'xai';
  readonly name = 'xAI';

  getDefaultModel(): string {
    return 'grok-2-latest';
  }

  getVisionModel(): string {
    return 'grok-2-vision-latest';
  }

  listModels(): AiModelDefinition[] {
    return XAI_MODELS;
  }

  async generateVisionAnalysis(options: GenerateVisionOptions): Promise<NormalizedAiResponse> {
    const key = (options.customApiKey && options.customApiKey.trim().length > 0) 
      ? options.customApiKey.trim() 
      : process.env.XAI_API_KEY;
      
    if (!key || key.trim().length === 0) {
      throw new Error('XAI_API_KEY is not configured or invalid.');
    }

    const modelToUse = options.model || this.getVisionModel();
    if (!this.supportsVision(modelToUse) && options.base64Image) {
      throw new Error(`Model ${modelToUse} does not support vision capabilities.`);
    }

    const start = Date.now();
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

      const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelToUse,
          messages,
          response_format: { type: 'json_object' }
        })
      });

      if (!res.ok) {
        const errStr = await res.text();
        throw new Error(`xAI API Error: ${res.status} ${errStr}`);
      }

      const data = await res.json();
      rawStr = JSON.stringify(data, null, 2);
      const content = data.choices?.[0]?.message?.content || '{}';

      try {
        parsed = JSON.parse(content);
      } catch (e) {
        throw new Error('Failed to parse AI response as JSON.');
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
      throw new Error(`xAI API Failed: ${err.message}`);
    }
  }
}
