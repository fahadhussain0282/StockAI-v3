import { AIProviderConfig } from '../types';

export interface ExtendedProviderConfig extends AIProviderConfig {
  visionSupport: boolean;
  defaultModel: string;
  description: string;
}

export const PROVIDER_REGISTRY: ExtendedProviderConfig[] = [
  {
    id: 'google-gemini',
    name: 'Google Gemini',
    currentModel: 'gemini-3.6-flash',
    availableModels: ['gemini-3.6-flash', 'gemini-3.1-pro-preview', 'gemini-3.1-flash-lite'],
    hasApiKey: true,
    status: 'active',
    visionSupport: true,
    defaultModel: 'gemini-3.6-flash',
    description: 'Fastest multimodal vision, deepest commercial SEO analysis'
  },
  {
    id: 'grok',
    name: 'Grok (xAI)',
    currentModel: 'grok-2-vision-1212',
    availableModels: ['grok-2-vision-1212', 'grok-2-1212', 'grok-beta'],
    hasApiKey: false,
    status: 'configured',
    visionSupport: true,
    defaultModel: 'grok-2-vision-1212',
    description: 'xAI Grok vision models for fast microstock metadata tagging'
  },
  {
    id: 'groq',
    name: 'Groq',
    currentModel: 'llama-3.2-11b-vision-preview',
    availableModels: ['llama-3.2-11b-vision-preview', 'llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
    hasApiKey: false,
    status: 'configured',
    visionSupport: true,
    defaultModel: 'llama-3.2-11b-vision-preview',
    description: 'Ultra-low latency inference via Groq LPU acceleration'
  }
];

