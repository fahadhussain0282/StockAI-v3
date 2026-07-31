import { BaseAiProvider } from './providers/base-provider';
import { GoogleProvider } from './providers/google';
import { GroqProvider } from './providers/groq';
import { XAiProvider } from './providers/xai';
import { OpenAiProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import { OpenRouterProvider } from './providers/openrouter';
import { MistralProvider } from './providers/mistral';
import { DeepSeekProvider } from './providers/deepseek';
import { TogetherProvider } from './providers/together';

class Registry {
  private providers: Map<string, BaseAiProvider> = new Map();

  constructor() {
    this.register(new GoogleProvider());
    this.register(new GroqProvider());
    this.register(new XAiProvider());
    this.register(new OpenAiProvider());
    this.register(new AnthropicProvider());
    this.register(new OpenRouterProvider());
    this.register(new MistralProvider());
    this.register(new DeepSeekProvider());
    this.register(new TogetherProvider());
  }

  register(provider: BaseAiProvider) {
    this.providers.set(provider.id, provider);
  }

  getProvider(id: string): BaseAiProvider {
    const provider = this.providers.get(id);
    if (!provider) {
      throw new Error(`AI Provider '${id}' not found in registry.`);
    }
    return provider;
  }

  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /** Returns all providers that have a configured API key in ENV */
  getEnabledProviders(): BaseAiProvider[] {
    return Array.from(this.providers.values()).filter(p => p.isEnabled());
  }

  /** Returns all registered provider instances */
  getAllProviders(): BaseAiProvider[] {
    return Array.from(this.providers.values());
  }
}

export const AiRegistry = new Registry();
