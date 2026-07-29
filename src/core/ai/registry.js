import { GoogleProvider } from './providers/google';
import { GroqProvider } from './providers/groq';
import { XAiProvider } from './providers/xai';
var Registry = /** @class */ (function () {
    function Registry() {
        this.providers = new Map();
        this.register(new GoogleProvider());
        this.register(new GroqProvider());
        this.register(new XAiProvider());
    }
    Registry.prototype.register = function (provider) {
        this.providers.set(provider.id, provider);
    };
    Registry.prototype.getProvider = function (id) {
        var provider = this.providers.get(id);
        if (!provider) {
            throw new Error("AI Provider '".concat(id, "' not found in registry."));
        }
        return provider;
    };
    Registry.prototype.listProviders = function () {
        return Array.from(this.providers.keys());
    };
    return Registry;
}());
export var AiRegistry = new Registry();
