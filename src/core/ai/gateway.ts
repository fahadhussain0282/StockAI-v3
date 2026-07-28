import { AiRegistry } from './registry';
import { AiHealth } from './health';
import { AiDiagnostics } from './diagnostics';
import { GenerateVisionOptions, NormalizedAiResponse } from './types';

export class Gateway {
  async generateVisionAnalysis(options: GenerateVisionOptions): Promise<NormalizedAiResponse> {
    const requestStart = Date.now();
    const providerImpl = AiRegistry.getProvider(options.provider);
    const modelToUse = options.model || providerImpl.getVisionModel();

    // 1. Validate Provider & Model
    if (!providerImpl.validateModel(modelToUse)) {
      throw new Error(`Model ${modelToUse} is not valid for provider ${options.provider}.`);
    }

    // 2. Validate Capabilities
    if (options.base64Image && !providerImpl.supportsVision(modelToUse)) {
      throw new Error(`Model ${modelToUse} does not support vision capabilities.`);
    }

    let success = false;
    let response: NormalizedAiResponse | null = null;
    let errorMsg = '';

    try {
      response = await providerImpl.generateVisionAnalysis({
        ...options,
        model: modelToUse
      });
      
      success = true;
      AiHealth.recordSuccess(options.provider, response.latency);
      return response;

    } catch (err: any) {
      success = false;
      errorMsg = err.message || 'Unknown error';
      AiHealth.recordFailure(options.provider);
      throw new Error(`Gateway Error: ${errorMsg}`);
    } finally {
      const requestEnd = Date.now();
      const payloadSize = (options.base64Image?.length || 0) + (options.userPrompt?.length || 0);
      
      AiDiagnostics.record({
        requestStart,
        requestEnd,
        latency: requestEnd - requestStart,
        payloadSize,
        imageSize: options.base64Image?.length || 0,
        promptSize: options.userPrompt?.length || 0,
        modelUsed: modelToUse,
        providerUsed: options.provider,
        responseSize: response?.rawResponse?.length || 0,
        tokenUsage: response?.tokens || { prompt: 0, completion: 0, total: 0 },
        finishReason: response?.finishReason || 'error',
        success,
        error: success ? undefined : errorMsg
      });
    }
  }

  getHealth() {
    return AiHealth.getAllStats();
  }

  getDiagnostics() {
    return AiDiagnostics.getLogs();
  }
}

export const AiGateway = new Gateway();
