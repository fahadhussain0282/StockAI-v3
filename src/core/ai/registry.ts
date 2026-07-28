import { BaseAiProvider } from './providers/base-provider';
import { GoogleProvider } from './providers/google';
import { GroqProvider } from './providers/groq';
import { XAiProvider } from './providers/xai';

class Registry {
  private providers: Map<string, BaseAiProvider> = new Map();

  constructor() {
    this.register(new GoogleProvider());
    this.register(new GroqProvider());
    this.register(new XAiProvider());
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
}

export const AiRegistry = new Registry();
