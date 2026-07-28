import { AiModelDefinition } from '../types';

export const GROQ_MODELS: AiModelDefinition[] = [
  {
    id: 'llama-3.2-90b-vision-preview',
    name: 'Llama 3.2 90B Vision',
    capabilities: { vision: true, streaming: true, json: true }
  },
  {
    id: 'llama-3.2-11b-vision-preview',
    name: 'Llama 3.2 11B Vision',
    capabilities: { vision: true, streaming: true, json: true }
  },
  {
    id: 'llama3-70b-8192',
    name: 'Llama 3 70B',
    capabilities: { vision: false, streaming: true, json: true }
  }
];
