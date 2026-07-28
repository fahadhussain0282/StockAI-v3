import { AiModelDefinition } from '../types';

export const GOOGLE_MODELS: AiModelDefinition[] = [
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    capabilities: { vision: true, streaming: true, json: true }
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    capabilities: { vision: true, streaming: true, json: true }
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    capabilities: { vision: true, streaming: true, json: true }
  }
];
