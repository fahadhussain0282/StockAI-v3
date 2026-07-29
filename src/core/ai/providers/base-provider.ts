import { AiModelDefinition, GenerateVisionOptions, NormalizedAiResponse } from '../types';

export abstract class BaseAiProvider {
  abstract readonly id: string;
  abstract readonly name: string;
  
  abstract getDefaultModel(): string;
  abstract getVisionModel(): string;
  abstract listModels(): AiModelDefinition[];
  
  /** Fallback chain for vision tasks within this provider */
  abstract getVisionFallbackChain(): string[];
  
  /** Fallback chain for text tasks within this provider */
  abstract getTextFallbackChain(): string[];

  /**
   * Checks if the provider is enabled (has API key configured in ENV).
   */
  abstract isEnabled(): boolean;

  /**
   * Validates if we have credentials (custom or env).
   */
  hasApiKey(customApiKey?: string): boolean {
    if (customApiKey && customApiKey.trim().length > 0) return true;
    return this.isEnabled();
  }
  
  validateModel(modelId: string): boolean {
    // Only return true if the model is in our list AND not deprecated
    return this.listModels().some(m => m.id === modelId && !m.deprecated);
  }
  
  supportsVision(modelId: string): boolean {
    const model = this.listModels().find(m => m.id === modelId);
    return model ? model.capabilities.vision : false;
  }
  
  supportsStreaming(modelId: string): boolean {
    const model = this.listModels().find(m => m.id === modelId);
    return model ? model.capabilities.streaming : false;
  }
  
  supportsJson(modelId: string): boolean {
    const model = this.listModels().find(m => m.id === modelId);
    return model ? model.capabilities.json : false;
  }
  
  getCapabilities(modelId: string) {
    const model = this.listModels().find(m => m.id === modelId);
    if (!model) throw new Error(`Model ${modelId} not found in provider ${this.id}`);
    return model.capabilities;
  }

  abstract generateVisionAnalysis(options: GenerateVisionOptions): Promise<NormalizedAiResponse>;
}
