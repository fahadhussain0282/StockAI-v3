import React, { useState, useEffect } from 'react';
import { X, Plus, Key, ShieldCheck, AlertCircle, RefreshCw, Trash2, Power, Eye, EyeOff, Info, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { PROVIDER_REGISTRY } from '../registries/providers';

interface ApiKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface KeyConfig {
  id: string;
  provider: string;
  label: string;
  maskedKey: string;
  isEnabled: boolean;
  isHealthy: boolean;
  successCount: number;
  failureCount: number;
  lastUsedAt: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  addedAt: string;
}

export const ApiKeysModal: React.FC<ApiKeysModalProps> = ({ isOpen, onClose }) => {
  const [keys, setKeys] = useState<KeyConfig[]>([]);
  const [fallbackOrder, setFallbackOrder] = useState<string[]>(PROVIDER_REGISTRY.map(p => p.id));
  const [selectedProvider, setSelectedProvider] = useState<string>(PROVIDER_REGISTRY[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [newKeyInput, setNewKeyInput] = useState('');
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const activeProviderConfig = PROVIDER_REGISTRY.find(p => p.id === selectedProvider) || PROVIDER_REGISTRY[0];

  const fetchKeys = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('stockai_auth_token') || sessionStorage.getItem('stockai_auth_token') || '';
      const res = await fetch('/api/user/keys', {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
        if (data.settings?.fallbackOrder) {
          try {
            setFallbackOrder(JSON.parse(data.settings.fallbackOrder));
          } catch {}
        }
      }
    } catch (err) {
      console.error('Failed to fetch keys', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchKeys();
      setNewKeyInput('');
      setNewKeyLabel('');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyInput.trim()) return;
    setIsAdding(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const token = localStorage.getItem('stockai_auth_token') || sessionStorage.getItem('stockai_auth_token') || '';
      const res = await fetch('/api/user/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          provider: selectedProvider,
          keys: [{ key: newKeyInput, label: newKeyLabel || 'My API Key' }]
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add key');

      if (data.results && data.results[0]?.status === 'ok') {
        setSuccessMsg('API Key added and verified successfully.');
        setNewKeyInput('');
        setNewKeyLabel('');
        fetchKeys();
      } else {
        throw new Error(data.results?.[0]?.error || 'Key validation failed');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error adding key');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('stockai_auth_token') || sessionStorage.getItem('stockai_auth_token') || '';
      await fetch(`/api/user/keys/${id}`, {
        method: 'DELETE',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      fetchKeys();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const token = localStorage.getItem('stockai_auth_token') || sessionStorage.getItem('stockai_auth_token') || '';
      await fetch(`/api/user/keys/${id}/toggle`, {
        method: 'PUT',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      fetchKeys();
    } catch (err) {
      console.error(err);
    }
  };

  const moveProvider = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newOrder = [...fallbackOrder];
      const temp = newOrder[index - 1];
      newOrder[index - 1] = newOrder[index];
      newOrder[index] = temp;
      setFallbackOrder(newOrder);
      saveFallbackOrder(newOrder);
    } else if (direction === 'down' && index < fallbackOrder.length - 1) {
      const newOrder = [...fallbackOrder];
      const temp = newOrder[index + 1];
      newOrder[index + 1] = newOrder[index];
      newOrder[index] = temp;
      setFallbackOrder(newOrder);
      saveFallbackOrder(newOrder);
    }
  };

  const saveFallbackOrder = async (order: string[]) => {
    try {
      const token = localStorage.getItem('stockai_auth_token') || sessionStorage.getItem('stockai_auth_token') || '';
      await fetch('/api/user/keys/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ fallbackOrder: order })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const currentProviderKeys = keys.filter(k => k.provider === selectedProvider);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans overflow-hidden">
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-lg max-w-5xl w-full flex overflow-hidden shadow-2xl h-[85vh] max-h-[800px]">
        
        {/* Left Sidebar - Providers */}
        <div className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col h-full shrink-0">
          <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
            <Key className="w-5 h-5 text-zinc-300" />
            <h3 className="text-sm font-semibold text-white">Enterprise Key Pool</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-2 pt-2 pb-1">AI Providers</div>
            {PROVIDER_REGISTRY.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedProvider(p.id)}
                className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 text-sm transition-colors ${
                  selectedProvider === p.id ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <span className="text-base">{p.icon}</span>
                <span className="font-medium">{p.name}</span>
                {keys.filter(k => k.provider === p.id && k.isEnabled).length > 0 && (
                  <span className="ml-auto bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded-full">
                    {keys.filter(k => k.provider === p.id && k.isEnabled).length}
                  </span>
                )}
              </button>
            ))}

            <div className="mt-6 mb-2 border-t border-zinc-800/50"></div>
            <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-2 pt-2 pb-1">Fallback Strategy</div>
            <div className="px-2 pb-2">
              <p className="text-xs text-zinc-500 leading-relaxed mb-3">
                If all keys for a provider fail, StockAI will automatically fallback down this list. Drag or use arrows to reorder.
              </p>
              <div className="space-y-1.5">
                {fallbackOrder.map((providerId, idx) => {
                  const p = PROVIDER_REGISTRY.find(x => x.id === providerId);
                  if (!p) return null;
                  return (
                    <div key={p.id} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded p-1.5 text-xs text-zinc-300">
                      <GripVertical className="w-3.5 h-3.5 text-zinc-600" />
                      <span className="truncate flex-1 flex items-center gap-1.5">{p.icon} {p.name}</span>
                      <div className="flex items-center gap-1">
                        <button disabled={idx === 0} onClick={() => moveProvider(idx, 'up')} className="p-1 hover:text-white disabled:opacity-30">
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button disabled={idx === fallbackOrder.length - 1} onClick={() => moveProvider(idx, 'down')} className="p-1 hover:text-white disabled:opacity-30">
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col h-full bg-[#0c0c0e] overflow-hidden">
          {/* Header */}
          <div className="p-5 flex justify-between items-start border-b border-zinc-800 shrink-0">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {activeProviderConfig.icon} {activeProviderConfig.name} Pool
              </h2>
              <p className="text-sm text-zinc-400 mt-1">
                Add multiple API keys to create an unlimited generation pool. StockAI automatically load-balances and rotates out failing keys.
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Add Key Form */}
          <div className="p-5 border-b border-zinc-800 shrink-0 bg-zinc-950/50">
            <form onSubmit={handleAddKey} className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">New {activeProviderConfig.name} Key</label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 w-4 h-4 text-zinc-600" />
                  <input
                    type="text"
                    required
                    value={newKeyInput}
                    onChange={(e) => setNewKeyInput(e.target.value)}
                    placeholder={activeProviderConfig.apiKeyPlaceholder}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 pl-9 text-sm text-white focus:outline-none focus:border-zinc-500 font-mono"
                  />
                </div>
              </div>
              <div className="w-48">
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Label (Optional)</label>
                <input
                  type="text"
                  value={newKeyLabel}
                  onChange={(e) => setNewKeyLabel(e.target.value)}
                  placeholder="e.g. Project Alpha Key"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
                />
              </div>
              <button
                type="submit"
                disabled={isAdding || !newKeyInput.trim()}
                className="px-4 py-2 rounded bg-white text-black font-semibold text-sm flex items-center gap-2 cursor-pointer hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-[38px]"
              >
                {isAdding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Key
              </button>
            </form>
            
            {errorMsg && (
              <div className="mt-3 text-xs text-red-400 flex items-center gap-1.5 bg-red-400/10 p-2 rounded border border-red-400/20">
                <AlertCircle className="w-3.5 h-3.5" /> {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="mt-3 text-xs text-emerald-400 flex items-center gap-1.5 bg-emerald-400/10 p-2 rounded border border-emerald-400/20">
                <ShieldCheck className="w-3.5 h-3.5" /> {successMsg}
              </div>
            )}
          </div>

          {/* Keys Table */}
          <div className="flex-1 overflow-auto p-5">
            {isLoading && currentProviderKeys.length === 0 ? (
              <div className="flex justify-center items-center h-32">
                <RefreshCw className="w-6 h-6 text-zinc-600 animate-spin" />
              </div>
            ) : currentProviderKeys.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-zinc-500 bg-zinc-900/30 rounded-lg border border-dashed border-zinc-800">
                <Key className="w-8 h-8 mb-3 opacity-50" />
                <p className="text-sm">No API keys added for {activeProviderConfig.name} yet.</p>
                <p className="text-xs mt-1 text-zinc-600">Keys are encrypted with AES-256-GCM at rest.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-zinc-800 rounded-lg">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-900/80 border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">
                      <th className="p-3 pl-4">Label</th>
                      <th className="p-3">API Key (Masked)</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Usage</th>
                      <th className="p-3 text-right pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {currentProviderKeys.map(k => (
                      <tr key={k.id} className="hover:bg-zinc-900/30 transition-colors">
                        <td className="p-3 pl-4">
                          <div className="text-sm text-zinc-200 font-medium">{k.label}</div>
                          <div className="text-[10px] text-zinc-500 mt-0.5">Added {new Date(k.addedAt).toLocaleDateString()}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-mono text-xs text-zinc-400 flex items-center gap-2">
                            {k.maskedKey}
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/50" title="AES-256-GCM Encrypted" />
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            {!k.isEnabled ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                                Disabled
                              </span>
                            ) : k.isHealthy ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Healthy
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> Failing
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-emerald-400">{k.successCount} Success</span>
                            <span className="text-[10px] text-red-400/80">{k.failureCount} Failures</span>
                          </div>
                        </td>
                        <td className="p-3 pr-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleToggle(k.id)}
                              className={`p-1.5 rounded transition-colors ${
                                k.isEnabled 
                                  ? 'text-zinc-400 hover:text-amber-400 hover:bg-amber-400/10' 
                                  : 'text-zinc-500 hover:text-emerald-400 hover:bg-emerald-400/10'
                              }`}
                              title={k.isEnabled ? 'Disable Key' : 'Enable Key'}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(k.id)}
                              className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                              title="Delete Key"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
