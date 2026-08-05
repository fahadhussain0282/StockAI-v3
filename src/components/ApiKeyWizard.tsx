import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Key, CheckCircle, AlertCircle, Loader2, ArrowRight, ShieldCheck, Zap, Globe, Cpu } from 'lucide-react';

export interface ApiKeyWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  authToken: string;
}

const PROVIDERS = [
  {
    id: 'google-gemini',
    name: 'Google Gemini',
    badge: '⭐ Recommended',
    badgeColor: 'bg-blue-500/20 text-blue-400',
    tier: 'FREE',
    vision: true,
    speed: 'Very Fast (~2s)',
    limits: '15 requests / minute',
    icon: <Cpu className="w-5 h-5 text-blue-400" />,
    url: 'https://aistudio.google.com/app/apikey'
  },
  {
    id: 'groq',
    name: 'Groq Cloud',
    badge: '⭐ Fast',
    badgeColor: 'bg-orange-500/20 text-orange-400',
    tier: 'FREE',
    vision: true, // Llama 3.2 vision supported
    speed: 'Instant (< 1s)',
    limits: '30 requests / minute',
    icon: <Zap className="w-5 h-5 text-orange-400" />,
    url: 'https://console.groq.com/keys'
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    badge: '⭐ Most Compatible',
    badgeColor: 'bg-purple-500/20 text-purple-400',
    tier: 'FREE / PAID',
    vision: true,
    speed: 'Fast (~2s)',
    limits: 'Depends on model',
    icon: <Globe className="w-5 h-5 text-purple-400" />,
    url: 'https://openrouter.ai/keys'
  },
  {
    id: 'together',
    name: 'Together AI',
    badge: '',
    badgeColor: '',
    tier: 'FREE',
    vision: true,
    speed: 'Fast (~2s)',
    limits: 'Rate limited free tier',
    icon: <ShieldCheck className="w-5 h-5 text-green-400" />,
    url: 'https://api.together.xyz/settings/api-keys'
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    badge: '',
    badgeColor: '',
    tier: 'FREE',
    vision: false,
    speed: 'Fast (~2s)',
    limits: 'Rate limited free tier',
    icon: <Cpu className="w-5 h-5 text-teal-400" />,
    url: 'https://console.mistral.ai/api-keys/'
  }
];

export function ApiKeyWizard({ isOpen, onClose, onSuccess, authToken }: ApiKeyWizardProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>('google-gemini');
  const [apiKey, setApiKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey('');
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError('Please enter a valid API key.');
      return;
    }

    setIsTesting(true);
    setError('');

    try {
      const res = await fetch('/api/user/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          provider: selectedProvider,
          keys: [{ key: apiKey.trim(), label: 'Auto Setup Key' }]
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save key.');
      }

      if (data.results && data.results[0]?.status === 'error') {
        throw new Error(data.results[0].error || 'Key validation failed.');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Network error while saving key.');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl overflow-hidden bg-gray-900 border shadow-2xl rounded-2xl border-white/10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
            <div>
              <h2 className="text-xl font-bold text-white">Setup AI Provider</h2>
              <p className="mt-1 text-sm text-gray-400">
                You need a free AI provider to generate metadata. Setup takes &lt; 2 minutes.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 transition-colors rounded-lg hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col md:flex-row">
            {/* Sidebar: Providers List */}
            <div className="w-full p-4 border-r md:w-1/3 border-white/5 bg-gray-900/50">
              <div className="space-y-2">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProvider(p.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      selectedProvider === p.id 
                        ? 'bg-blue-500/10 border-blue-500/50 border shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                        : 'border border-transparent hover:bg-white/5 hover:border-white/10'
                    }`}
                  >
                    {p.icon}
                    <div className="text-left">
                      <div className="text-sm font-semibold text-gray-200">{p.name}</div>
                      {p.badge && (
                        <div className={`text-[10px] font-bold px-1.5 py-0.5 mt-1 rounded ${p.badgeColor} inline-block uppercase tracking-wider`}>
                          {p.badge}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content: Key Input */}
            <div className="w-full p-6 md:w-2/3">
              {PROVIDERS.map((p) => selectedProvider === p.id && (
                <motion.div 
                  key={p.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {/* Provider Info Grid */}
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-gray-800/50 border border-white/5">
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider">Tier</div>
                      <div className="mt-1 font-medium text-green-400">{p.tier}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider">Vision Support</div>
                      <div className="mt-1 font-medium text-gray-200">{p.vision ? '✅ Yes' : '❌ No'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider">Est. Speed</div>
                      <div className="mt-1 font-medium text-gray-200">{p.speed}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider">Free Limits</div>
                      <div className="mt-1 font-medium text-gray-200">{p.limits}</div>
                    </div>
                  </div>

                  {/* API Key Input */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-300">
                      {p.name} API Key
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Key className="w-5 h-5 text-gray-500" />
                      </div>
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Paste your API key here..."
                        className="w-full py-3 pl-10 pr-4 text-white bg-gray-950 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-600"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <a 
                        href={p.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors group"
                      >
                        Get your free key here 
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </a>
                    </div>
                  </div>

                  {/* Status Messages */}
                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-start gap-3 p-4 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl"
                      >
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div className="text-sm leading-relaxed">{error}</div>
                      </motion.div>
                    )}
                    {success && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-3 p-4 text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl"
                      >
                        <CheckCircle className="w-5 h-5 shrink-0" />
                        <div className="text-sm font-medium">Key verified! Resuming generation automatically...</div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Actions */}
                  <div className="pt-4 flex justify-end gap-3">
                    <button
                      onClick={onClose}
                      className="px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isTesting || !apiKey.trim() || success}
                      className="flex items-center justify-center min-w-[140px] px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)]"
                    >
                      {isTesting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Testing Key...
                        </>
                      ) : success ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Saved
                        </>
                      ) : (
                        'Save & Continue'
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
