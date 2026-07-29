import { BaseAiProvider } from './base-provider';
import { AiModelDefinition, GenerateVisionOptions, NormalizedAiResponse } from '../types';
import { GROQ_MODELS, GROQ_VISION_FALLBACK_CHAIN, GROQ_TEXT_FALLBACK_CHAIN, GROQ_DEFAULT_VISION_MODEL, GROQ_DEFAULT_TEXT_MODEL } from '../models/groq-models';

export class GroqProvider extends BaseAiProvider {
  readonly id = 'groq';
  readonly name = 'Groq Cloud';

  isEnabled(): boolean {
    const key = process.env.GROQ_API_KEY;
    return !!key && key.trim().length > 0;
  }

  getDefaultModel(): string {
    return GROQ_DEFAULT_TEXT_MODEL;
  }

  getVisionModel(): string {
    return GROQ_DEFAULT_VISION_MODEL;
  }

  listModels(): AiModelDefinition[] {
    return GROQ_MODELS;
  }

  getVisionFallbackChain(): string[] {
    return GROQ_VISION_FALLBACK_CHAIN;
  }

  getTextFallbackChain(): string[] {
    return GROQ_TEXT_FALLBACK_CHAIN;
  }

  async generateVisionAnalysis(options: GenerateVisionOptions): Promise<NormalizedAiResponse> {
    const key = (options.customApiKey && options.customApiKey.trim().length > 0) 
      ? options.customApiKey.trim() 
      : process.env.GROQ_API_KEY;
      
    if (!key || key.trim().length === 0) {
      throw new Error('AUTH_ERROR: GROQ_API_KEY is not configured or invalid.');
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

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
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
        throw new Error('AUTH_ERROR: Groq API key is invalid or unauthorized.');
      }
      if (res.status === 429) {
        throw new Error('RATE_LIMIT: Groq rate limit reached. Please retry shortly.');
      }
      if (!res.ok) {
        const errStr = await res.text();
        throw new Error(`Groq API Error: ${res.status} ${errStr}`);
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
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') throw new Error('Groq API request timed out after 25 seconds.');
      if (err.message?.startsWith('AUTH_ERROR:') || err.message?.startsWith('RATE_LIMIT:')) throw err;
      throw new Error(`Groq API Failed: ${err.message}`);
    }
  }
}
