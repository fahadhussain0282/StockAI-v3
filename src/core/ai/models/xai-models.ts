import { AiModelDefinition } from '../types';

export const XAI_MODELS: AiModelDefinition[] = [
  {
    id: 'grok-2-vision-latest',
    name: 'Grok 2 Vision Latest',
    capabilities: { vision: true, streaming: true, json: true }
  },
  {
    id: 'grok-2-latest',
    name: 'Grok 2 Latest',
    capabilities: { vision: false, streaming: true, json: true }
  }
];
