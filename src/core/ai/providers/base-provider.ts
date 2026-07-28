import { AiModelDefinition, GenerateVisionOptions, NormalizedAiResponse } from '../types';

export abstract class BaseAiProvider {
  abstract readonly id: string;
  abstract readonly name: string;
  
  abstract getDefaultModel(): string;
  abstract getVisionModel(): string;
  abstract listModels(): AiModelDefinition[];
  
  validateModel(modelId: string): boolean {
    return this.listModels().some(m => m.id === modelId);
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
