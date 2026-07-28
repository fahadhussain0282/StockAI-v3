import React, { useState, useEffect } from 'react';
import { X, Key, Check, ShieldCheck, AlertCircle, RefreshCw, Cpu } from 'lucide-react';
import { PROVIDER_REGISTRY } from '../registries/providers';

interface ApiKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProvider: string;
  setSelectedProvider: (provider: string) => void;
  providerKeys: Record<string, string>;
  setProviderKey: (provider: string, key: string) => void;
  providerModels: Record<string, string>;
  setProviderModel: (provider: string, model: string) => void;
}

export const ApiKeysModal: React.FC<ApiKeysModalProps> = ({
  isOpen,
  onClose,
  selectedProvider,
  setSelectedProvider,
  providerKeys,
  setProviderKey,
  providerModels,
  setProviderModel
}) => {
  const activeProviderConfig = PROVIDER_REGISTRY.find(p => p.id === selectedProvider) || PROVIDER_REGISTRY[0];
  const [currentKeyInput, setCurrentKeyInput] = useState(providerKeys[selectedProvider] || '');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    setCurrentKeyInput(providerKeys[selectedProvider] || '');
    setTestStatus('idle');
    setStatusMessage('');
  }, [selectedProvider]); // Removed providerKeys to prevent resetting state on every keypress or parent re-render

  if (!isOpen) return null;

  const handleProviderChange = (newProvider: string) => {
    setSelectedProvider(newProvider);
  };

  const handleKeyInputChange = (val: string) => {
    setCurrentKeyInput(val);
    setProviderKey(selectedProvider, val);
  };

  const handleModelChange = (model: string) => {
    setProviderModel(selectedProvider, model);
  };

  const handleSaveAndTestKey = async () => {
    setTestStatus('testing');
    setStatusMessage('Testing provider connection...');
    try {
      const activeModel = providerModels[selectedProvider] || activeProviderConfig.defaultModel;
      const res = await fetch('/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: currentKeyInput,
          model: activeModel
        })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setTestStatus('success');
        setStatusMessage(data.message || 'Connection test successful!');
      } else {
        setTestStatus('error');
        setStatusMessage(data.message || 'Connection failed. Please check your API key.');
      }
    } catch {
      setTestStatus('error');
      setStatusMessage('Network error while testing connection.');
    }
  };

  const activeModelValue = providerModels[selectedProvider] || activeProviderConfig.defaultModel;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-lg max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
            <Key className="w-5 h-5 text-zinc-300" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">AI Provider & API Key Manager</h3>
            <p className="text-xs text-zinc-400">Configure keys and models for Google Gemini, Grok (xAI), and Groq.</p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          {/* Provider Selection Dropdown */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-zinc-400" />
              Active Provider
            </label>
            <select
              value={selectedProvider}
              onChange={e => handleProviderChange(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-600 cursor-pointer font-medium"
            >
              {PROVIDER_REGISTRY.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.availableModels.length} models)</option>
              ))}
            </select>
            <p className="text-[10px] text-zinc-500">{activeProviderConfig.description}</p>
          </div>

          {/* Model Selector for Active Provider */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-300">
              Selected Model for {activeProviderConfig.name}
            </label>
            <select
              value={activeModelValue}
              onChange={e => handleModelChange(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-600 cursor-pointer font-mono"
            >
              {activeProviderConfig.availableModels.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Provider-Specific Custom API Key Input */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-300">
              {activeProviderConfig.name} API Key
            </label>
            <input
              type="password"
              placeholder={selectedProvider === 'google-gemini' ? 'AIzaSy...' : selectedProvider === 'grok' ? 'xai-...' : 'gsk_...'}
              value={currentKeyInput}
              onChange={e => handleKeyInputChange(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-600 font-mono"
            />
            <p className="text-[10px] text-zinc-500">
              {selectedProvider === 'google-gemini'
                ? 'Optional custom key. If empty, the environment default key will be used.'
                : `Enter your official ${activeProviderConfig.name} API key for vision metadata generation.`}
            </p>
          </div>

          {testStatus === 'success' && (
            <div className="bg-zinc-900/80 border border-zinc-800 rounded p-3 flex items-center gap-2 text-zinc-200 text-xs">
              <ShieldCheck className="w-4 h-4 shrink-0 text-white" />
              <span>{statusMessage}</span>
            </div>
          )}

          {testStatus === 'error' && (
            <div className="bg-zinc-900/80 border border-zinc-800 rounded p-3 flex items-center gap-2 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{statusMessage}</span>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white font-medium text-xs cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSaveAndTestKey}
              className="px-5 py-2 rounded bg-white text-black font-semibold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-zinc-200 transition-colors"
            >
              {testStatus === 'testing' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
              ) : (
                <Check className="w-3.5 h-3.5 text-black" />
              )}
              Save & Test Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

