import { AIProviderConfig } from '../types';

export interface ExtendedProviderConfig extends AIProviderConfig {
  visionSupport: boolean;
  defaultModel: string;
  description: string;
  isAvailable: boolean;
  features: string[];
  icon: string;
  apiKeyPlaceholder: string;
  apiKeyHint: string;
  envVar: string;
}

// PROVIDER_REGISTRY as array (used in ApiKeysModal dropdown)
export const PROVIDER_REGISTRY: ExtendedProviderConfig[] = [
  {
    id: 'google-gemini',
    name: 'Google Gemini',
    description: 'Enterprise reasoning engine optimized for complex metadata structuring and visual classification.',
    isAvailable: true,
    hasApiKey: false,
    availableModels: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-pro', 'gemini-1.5-flash', 'gemini-1.5-pro'],
    currentModel: 'gemini-2.5-flash',
    features: ['Deep Vision', 'SEO Optimization', 'Free Tier Available'],
    icon: '✦',
    visionSupport: true,
    defaultModel: 'gemini-2.5-flash',
    status: 'active',
    apiKeyPlaceholder: 'AIzaSy...',
    apiKeyHint: 'Optional. If empty, the environment default key is used.',
    envVar: 'GEMINI_API_KEY'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o with advanced vision and reasoning. Excellent for high-quality metadata and image understanding.',
    isAvailable: true,
    hasApiKey: false,
    availableModels: ['gpt-4o', 'gpt-4o-mini', 'gpt-4o-2024-11-20'],
    currentModel: 'gpt-4o',
    features: ['Vision Support', 'High Quality', 'JSON Mode'],
    icon: '⬡',
    visionSupport: true,
    defaultModel: 'gpt-4o',
    status: 'active',
    apiKeyPlaceholder: 'sk-...',
    apiKeyHint: 'Enter your OpenAI API key. Get one at platform.openai.com.',
    envVar: 'OPENAI_API_KEY'
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Claude 3.5 Sonnet with advanced reasoning and vision. Excellent for long-form descriptions and analysis.',
    isAvailable: true,
    hasApiKey: false,
    availableModels: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
    currentModel: 'claude-3-5-sonnet-20241022',
    features: ['Vision Support', 'Long Context', 'Deep Analysis'],
    icon: '◈',
    visionSupport: true,
    defaultModel: 'claude-3-5-sonnet-20241022',
    status: 'active',
    apiKeyPlaceholder: 'sk-ant-...',
    apiKeyHint: 'Enter your Anthropic API key. Get one at console.anthropic.com.',
    envVar: 'ANTHROPIC_API_KEY'
  },
  {
    id: 'xai',
    name: 'xAI (Grok)',
    description: 'Advanced reasoning model with unfiltered processing for unique creative descriptions.',
    isAvailable: true,
    hasApiKey: false,
    availableModels: ['grok-2-vision-1212', 'grok-2-1212'],
    currentModel: 'grok-2-vision-1212',
    features: ['Creative Variation', 'Vision Support'],
    icon: '𝕏',
    visionSupport: true,
    defaultModel: 'grok-2-vision-1212',
    status: 'configured',
    apiKeyPlaceholder: 'xai-...',
    apiKeyHint: 'Enter your xAI API key. Get one at console.x.ai.',
    envVar: 'XAI_API_KEY'
  },
  {
    id: 'groq',
    name: 'Groq Cloud',
    description: 'Ultra-low latency LPU engine for instantaneous bulk processing and rapid ideation.',
    isAvailable: true,
    hasApiKey: false,
    availableModels: [
      'meta-llama/llama-4-maverick-17b-128e-instruct',
      'llama-3.2-11b-vision-preview',
      'llama-3.3-70b-versatile',
      'meta-llama/llama-4-scout-17b-16e-instruct'
    ],
    currentModel: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    features: ['Instant Response', 'Free Tier Available'],
    icon: '⚡',
    visionSupport: true,
    defaultModel: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    status: 'configured',
    apiKeyPlaceholder: 'gsk_...',
    apiKeyHint: 'Enter your Groq API key. Free tier available at console.groq.com.',
    envVar: 'GROQ_API_KEY'
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Unified API gateway for 200+ models including GPT-4o, Claude, and Llama. Best for flexibility and cost optimization.',
    isAvailable: true,
    hasApiKey: false,
    availableModels: ['openai/gpt-4o', 'anthropic/claude-3-5-sonnet', 'meta-llama/llama-3.2-90b-vision-instruct'],
    currentModel: 'openai/gpt-4o',
    features: ['200+ Models', 'Cost Optimization', 'Vision Support'],
    icon: '⊕',
    visionSupport: true,
    defaultModel: 'openai/gpt-4o',
    status: 'configured',
    apiKeyPlaceholder: 'sk-or-...',
    apiKeyHint: 'Enter your OpenRouter API key. Get one at openrouter.ai.',
    envVar: 'OPENROUTER_API_KEY'
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    description: 'European AI with Pixtral vision models. Excellent for multilingual metadata and vision analysis.',
    isAvailable: true,
    hasApiKey: false,
    availableModels: ['pixtral-large-2411', 'pixtral-12b-2409', 'mistral-large-latest', 'mistral-small-latest'],
    currentModel: 'pixtral-large-2411',
    features: ['Vision Support', 'Multilingual', 'European Data'],
    icon: '🌊',
    visionSupport: true,
    defaultModel: 'pixtral-large-2411',
    status: 'configured',
    apiKeyPlaceholder: '...',
    apiKeyHint: 'Enter your Mistral API key. Get one at console.mistral.ai.',
    envVar: 'MISTRAL_API_KEY'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek AI',
    description: 'High-performance Chinese AI with exceptional reasoning capabilities at competitive pricing.',
    isAvailable: true,
    hasApiKey: false,
    availableModels: ['deepseek-chat', 'deepseek-reasoner'],
    currentModel: 'deepseek-chat',
    features: ['Deep Reasoning', 'Cost Efficient', 'Long Context'],
    icon: '🔍',
    visionSupport: false,
    defaultModel: 'deepseek-chat',
    status: 'configured',
    apiKeyPlaceholder: 'sk-...',
    apiKeyHint: 'Enter your DeepSeek API key. Get one at platform.deepseek.com.',
    envVar: 'DEEPSEEK_API_KEY'
  },
  {
    id: 'together',
    name: 'Together AI',
    description: 'Access to 200+ open-source models including Llama Vision for image analysis at scale.',
    isAvailable: true,
    hasApiKey: false,
    availableModels: [
      'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo',
      'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo',
      'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo'
    ],
    currentModel: 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo',
    features: ['200+ Models', 'Vision Support', 'Open Source'],
    icon: '🤝',
    visionSupport: true,
    defaultModel: 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo',
    status: 'configured',
    apiKeyPlaceholder: '...',
    apiKeyHint: 'Enter your Together AI API key. Get one at api.together.ai.',
    envVar: 'TOGETHER_API_KEY'
  }
];

// PROVIDER_MAP as object (used in App.tsx for quick lookup by id)
export const PROVIDER_MAP: Record<string, ExtendedProviderConfig> = Object.fromEntries(
  PROVIDER_REGISTRY.map(p => [p.id, p])
);
