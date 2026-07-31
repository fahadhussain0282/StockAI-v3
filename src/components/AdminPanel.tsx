import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  CreditCard, 
  Smartphone, 
  BarChart3, 
  Lock, 
  CheckCircle, 
  XCircle, 
  X,
  FileText,
  AlertTriangle,
  History,
  PhoneCall,
  Search,
  UserPlus,
  Settings,
  RefreshCw,
  Clock,
  Layers,
  Zap,
  DollarSign,
  Activity,
  Globe,
  Sliders,
  ChevronRight,
  Filter,
  Check,
  Power,
  Key,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  FlaskConical,
  ToggleLeft,
  ToggleRight,
  Shield,
  AlertCircle,
  Cpu,
  ArrowRight,
  Download
} from 'lucide-react';
import { UserSubscription, AdminUserRecord, AuditLogEntry, AuthUser } from '../types';

// ─── Enterprise API Key Pool Panel ────────────────────────────────────────────

const PROVIDERS_LIST = [
  { id: 'google-gemini', name: 'Google Gemini', icon: '✦' },
  { id: 'openai',        name: 'OpenAI GPT',    icon: '⬡' },
  { id: 'anthropic',     name: 'Claude',        icon: '◈' },
  { id: 'groq',          name: 'Groq Cloud',    icon: '⚡' },
  { id: 'xai',           name: 'xAI (Grok)',    icon: '𝕏' },
  { id: 'openrouter',    name: 'OpenRouter',    icon: '⊕' },
  { id: 'mistral',       name: 'Mistral AI',    icon: '🌊' },
  { id: 'deepseek',      name: 'DeepSeek AI',   icon: '🔍' },
  { id: 'together',      name: 'Together AI',   icon: '🤝' },
];

interface SafePoolKey {
  id: string; provider: string; label: string;
  isEnabled: boolean; isHealthy: boolean;
  addedAt: string; lastUsedAt: string | null;
  lastSuccessAt: string | null; lastFailureAt: string | null;
  rateLimitUntil: number; cooldownUntil: number;
  successCount: number; failureCount: number;
  totalRequests: number; avgLatencyMs: number;
  consecutiveFailures: number; lastErrorMessage?: string;
  maskedKey: string; healthScore: number;
  cooldownRemainingMs: number; rateLimitRemainingMs: number;
  quotaStatus: string; rateLimitStatus: string;
  timeoutCount: number; rateLimitCount: number;
  encryptionEnabled: boolean;
}

interface PoolStat {
  provider: string; totalKeys: number; enabledKeys: number;
  healthyKeys: number; rateLimitedKeys: number; disabledKeys: number;
  failedKeys: number; availableKeys: number; strategy: string;
  rotationIndex: number; avgSuccessRate: number; avgLatencyMs: number;
}

// Live countdown (seconds remaining)
function useLiveCountdown(targetMs: number): number {
  const [remaining, setRemaining] = React.useState(() => Math.max(0, targetMs - Date.now()));
  React.useEffect(() => {
    if (targetMs <= Date.now()) return;
    const iv = setInterval(() => {
      const r = Math.max(0, targetMs - Date.now());
      setRemaining(r);
      if (r === 0) clearInterval(iv);
    }, 1000);
    return () => clearInterval(iv);
  }, [targetMs]);
  return remaining;
}

// Health score badge — 0-100 color-coded
const HealthBadge: React.FC<{ score: number }> = ({ score }) => {
  const cls = score >= 80 ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60'
    : score >= 50 ? 'text-amber-400 bg-amber-950/40 border-amber-800/60'
    : score >= 0  ? 'text-red-400 bg-red-950/40 border-red-800/60'
    : 'text-zinc-500 bg-zinc-900/40 border-zinc-800';
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[9px] font-bold font-mono ${cls}`}>
      ⬡ {score < 0 ? 'N/A' : score}
    </span>
  );
};

// Latency badge — green/amber/red thresholds
const LatencyBadge: React.FC<{ ms: number }> = ({ ms }) => {
  if (!ms) return null;
  const cls = ms < 1000 ? 'text-emerald-400' : ms < 3000 ? 'text-amber-400' : 'text-red-400';
  return <span className={`text-[9px] font-mono ${cls}`}>{ms}ms</span>;
};

// Live cooldown display for a single key card
const KeyCooldownDisplay: React.FC<{ cooldownUntil: number; rateLimitUntil: number }> = ({ cooldownUntil, rateLimitUntil }) => {
  const cooldown = useLiveCountdown(cooldownUntil);
  const rateLimit = useLiveCountdown(rateLimitUntil);
  if (rateLimit > 0) return (
    <span className="text-[9px] text-amber-400 font-mono bg-amber-950/30 px-1 rounded">
      ⏱ Rate limit: {Math.ceil(rateLimit / 1000)}s
    </span>
  );
  if (cooldown > 0) return (
    <span className="text-[9px] text-orange-400 font-mono bg-orange-950/30 px-1 rounded">
      ❄ Cooldown: {Math.ceil(cooldown / 1000)}s
    </span>
  );
  return null;
};

const ApiKeyPoolPanel: React.FC<{ authToken: string }> = ({ authToken }) => {
  const [selProvider, setSelProvider] = React.useState('google-gemini');
  const [keys, setKeys] = React.useState<SafePoolKey[]>([]);
  const [stats, setStats] = React.useState<PoolStat | null>(null);
  const [allStats, setAllStats] = React.useState<PoolStat[]>([]);
  const [circuits, setCircuits] = React.useState<Record<string, any>>({});
  const [encryptionEnabled, setEncryptionEnabled] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showAdd, setShowAdd] = React.useState(false);
  const [addKey, setAddKey] = React.useState('');
  const [addLabel, setAddLabel] = React.useState('');
  const [addErr, setAddErr] = React.useState('');
  const [isAdding, setIsAdding] = React.useState(false);
  const [testRes, setTestRes] = React.useState<Record<string, { status: string; message: string; latencyMs?: number }>>({});
  const [bulkResetting, setBulkResetting] = React.useState(false);
  const [bulkResetResult, setBulkResetResult] = React.useState<{ count: number; provider: string } | null>(null);
  const [autoRefresh, setAutoRefresh] = React.useState(false);

  const hdrs = { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' };

  const load = async (prov: string) => {
    setIsLoading(true);
    try {
      const [kr, sr] = await Promise.all([
        fetch(`/api/admin/key-pool/${prov}`, { headers: hdrs }),
        fetch(`/api/admin/key-pool/stats`, { headers: hdrs })
      ]);
      if (kr.ok) { const d = await kr.json(); setKeys(d.keys || []); setStats(d.stats || null); }
      if (sr.ok) {
        const d = await sr.json();
        setAllStats(d.poolStats || []);
        setCircuits(d.circuitStatus || {});
        setEncryptionEnabled(d.encryptionEnabled || false);
      }
    } catch (e) {}
    setIsLoading(false);
  };

  React.useEffect(() => { load(selProvider); }, [selProvider]);

  // Auto-refresh every 30s
  React.useEffect(() => {
    if (!autoRefresh) return;
    const iv = setInterval(() => load(selProvider), 30000);
    return () => clearInterval(iv);
  }, [autoRefresh, selProvider]);

  const doAdd = async () => {
    if (!addKey.trim()) { setAddErr('API key is required.'); return; }
    setIsAdding(true); setAddErr('');
    try {
      const res = await fetch(`/api/admin/key-pool/${selProvider}`, {
        method: 'POST', headers: hdrs,
        body: JSON.stringify({ key: addKey.trim(), label: addLabel.trim() || undefined })
      });
      const d = await res.json();
      if (!res.ok) setAddErr(d.error || 'Failed to add key.');
      else { setAddKey(''); setAddLabel(''); setShowAdd(false); load(selProvider); }
    } catch { setAddErr('Network error while adding key.'); }
    setIsAdding(false);
  };

  const doDelete = async (id: string) => {
    if (!confirm('Delete this API key? This cannot be undone.')) return;
    await fetch(`/api/admin/key-pool/key/${id}`, { method: 'DELETE', headers: hdrs });
    load(selProvider);
  };

  const doToggle = async (k: SafePoolKey) => {
    await fetch(`/api/admin/key-pool/key/${k.id}/${k.isEnabled ? 'disable' : 'enable'}`, { method: 'POST', headers: hdrs });
    load(selProvider);
  };

  const doTest = async (k: SafePoolKey) => {
    setTestRes(p => ({ ...p, [k.id]: { status: 'testing', message: 'Running full test...' } }));
    try {
      const res = await fetch(`/api/admin/key-pool/key/${k.id}/test`, { method: 'POST', headers: hdrs });
      const d = await res.json();
      setTestRes(p => ({ ...p, [k.id]: { status: d.status, message: d.message || d.status, latencyMs: d.latencyMs } }));
    } catch {
      setTestRes(p => ({ ...p, [k.id]: { status: 'error', message: 'Network error during test' } }));
    }
    load(selProvider);
  };

  const doValidate = async (k: SafePoolKey) => {
    setTestRes(p => ({ ...p, [k.id]: { status: 'testing', message: 'Validating auth...' } }));
    try {
      const res = await fetch(`/api/admin/key-pool/key/${k.id}/validate`, { method: 'POST', headers: hdrs });
      const d = await res.json();
      setTestRes(p => ({ ...p, [k.id]: { status: d.valid ? 'ok' : 'error', message: d.message, latencyMs: d.latencyMs } }));
    } catch {
      setTestRes(p => ({ ...p, [k.id]: { status: 'error', message: 'Network error during validation' } }));
    }
    load(selProvider);
  };

  const doReset = async (k: SafePoolKey) => {
    await fetch(`/api/admin/key-pool/key/${k.id}/reset`, { method: 'POST', headers: hdrs });
    load(selProvider);
  };

  const doSetStrategy = async (s: string) => {
    await fetch(`/api/admin/key-pool/${selProvider}/strategy`, {
      method: 'POST', headers: hdrs, body: JSON.stringify({ strategy: s })
    });
    load(selProvider);
  };

  const doResetCircuit = async () => {
    await fetch(`/api/admin/circuit/reset/${selProvider}`, { method: 'POST', headers: hdrs });
    load(selProvider);
  };

  const doBulkReset = async () => {
    setBulkResetting(true); setBulkResetResult(null);
    try {
      const res = await fetch(`/api/admin/key-pool/${selProvider}/reset-failed`, { method: 'POST', headers: hdrs });
      const d = await res.json();
      if (res.ok) setBulkResetResult({ count: d.resetCount, provider: selProvider });
    } catch {}
    setBulkResetting(false);
    load(selProvider);
  };

  const currProvider = PROVIDERS_LIST.find(p => p.id === selProvider)!;
  const circ = circuits[selProvider];
  const provStat = allStats.find(s => s.provider === selProvider);
  const hasAnyFailed = keys.some(k => k.isEnabled && (!k.isHealthy || k.cooldownUntil > Date.now() || k.rateLimitUntil > Date.now()));

  const keyStatus = (k: SafePoolKey) => {
    const now = Date.now();
    if (!k.isEnabled) return { label: 'Disabled', cls: 'text-zinc-500', dot: 'bg-zinc-600' };
    if (!k.isHealthy) return { label: 'Unhealthy', cls: 'text-red-400', dot: 'bg-red-500' };
    if (k.quotaStatus === 'exhausted') return { label: 'Quota Exhausted', cls: 'text-red-400', dot: 'bg-red-500' };
    if (k.rateLimitUntil > now || k.rateLimitStatus === 'limited') return { label: 'Rate Limited', cls: 'text-amber-400', dot: 'bg-amber-400' };
    if (k.cooldownUntil > now) return { label: 'Cooling Down', cls: 'text-orange-400', dot: 'bg-orange-400' };
    return { label: 'Healthy', cls: 'text-emerald-400', dot: 'bg-emerald-400 animate-pulse' };
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-400" /> Enterprise API Key Pool
            {encryptionEnabled && (
              <span className="text-[9px] bg-emerald-950/50 border border-emerald-800/60 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
                🔒 AES-256-GCM
              </span>
            )}
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">Unlimited keys per provider. Health-based smart rotation with instant failover.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(v => !v)}
            title={autoRefresh ? 'Auto-refresh ON (30s)' : 'Enable auto-refresh'}
            className={`p-2 rounded border text-[10px] font-mono transition-colors cursor-pointer ${autoRefresh ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
          >
            ⟳ {autoRefresh ? '30s' : 'Auto'}
          </button>
          <button onClick={() => load(selProvider)} className="p-2 bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800 transition-colors cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Provider pills */}
      <div className="flex flex-wrap gap-2">
        {PROVIDERS_LIST.map(p => {
          const s = allStats.find(st => st.provider === p.id);
          const c = circuits[p.id];
          const isSel = p.id === selProvider;
          const isHealthy = s && s.availableKeys > 0;
          return (
            <button key={p.id} onClick={() => setSelProvider(p.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
                isSel ? 'bg-zinc-800 border-zinc-600 text-white shadow-sm' : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}>
              <span>{p.icon}</span>
              <span>{p.name}</span>
              <span className={`font-mono font-bold text-[10px] ${isHealthy ? 'text-emerald-400' : s && s.totalKeys > 0 ? 'text-amber-400' : 'text-zinc-600'}`}>
                {s ? `${s.availableKeys}/${s.totalKeys}` : '0'}
              </span>
              {s && s.avgSuccessRate < 100 && s.totalKeys > 0 && (
                <span className="text-[9px] text-zinc-500">{s.avgSuccessRate}%</span>
              )}
              {c && c.state !== 'closed' && <span className="text-[9px] text-red-400 font-bold">{c.state.toUpperCase()}</span>}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: stats + controls */}
        <div className="space-y-3">
          {/* Pool stats card */}
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-2">
            <div className="text-[11px] font-bold text-zinc-300 mb-2">{currProvider.icon} {currProvider.name} — Pool Stats</div>
            {[
              ['Total Keys',       provStat?.totalKeys ?? 0,       'text-white'],
              ['Available',        provStat?.availableKeys ?? 0,   'text-emerald-400'],
              ['Disabled',         provStat?.disabledKeys ?? 0,    'text-zinc-500'],
              ['Rate Limited',     provStat?.rateLimitedKeys ?? 0, 'text-amber-400'],
              ['Failed/Cooldown',  provStat?.failedKeys ?? 0,      'text-red-400'],
            ].map(([label, val, cls]) => (
              <div key={label as string} className="flex justify-between text-[11px]">
                <span className="text-zinc-400">{label}</span>
                <span className={`font-bold font-mono ${cls}`}>{String(val)}</span>
              </div>
            ))}
            {provStat && provStat.totalKeys > 0 && (
              <>
                <div className="border-t border-zinc-800/60 pt-2 mt-1 flex justify-between text-[11px]">
                  <span className="text-zinc-400">Avg Success Rate</span>
                  <span className={`font-bold font-mono ${(provStat.avgSuccessRate ?? 100) >= 90 ? 'text-emerald-400' : (provStat.avgSuccessRate ?? 100) >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                    {provStat.avgSuccessRate ?? 100}%
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400">Avg Latency</span>
                  <LatencyBadge ms={provStat.avgLatencyMs || 0} />
                </div>
              </>
            )}
          </div>

          {/* Rotation strategy */}
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-2">
            <div className="text-[11px] font-bold text-zinc-300">Rotation Strategy</div>
            {(['health-based', 'round-robin', 'lru'] as const).map(s => (
              <button key={s} onClick={() => doSetStrategy(s)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  (stats?.strategy || 'health-based') === s
                    ? 'bg-amber-600/20 border border-amber-600/50 text-amber-300'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
                }`}>
                {(stats?.strategy || 'health-based') === s && <Check className="w-3 h-3" />}
                <span className="capitalize">{s.replace('-', ' ')}</span>
              </button>
            ))}
            {provStat && (
              <div className="text-[10px] text-zinc-600 pt-1">Rotation index: {provStat.rotationIndex}</div>
            )}
          </div>

          {/* Bulk Reset Failed */}
          {hasAnyFailed && (
            <div className="p-3 bg-orange-950/20 border border-orange-900/40 rounded-lg space-y-2">
              <div className="text-[11px] font-bold text-orange-300">⚡ Failed Keys Detected</div>
              <p className="text-[10px] text-zinc-400">
                {provStat?.failedKeys || 0} key(s) in cooldown or unhealthy state.
              </p>
              {bulkResetResult && bulkResetResult.provider === selProvider && (
                <div className="text-[10px] text-emerald-400">✓ Reset {bulkResetResult.count} key(s)</div>
              )}
              <button onClick={doBulkReset} disabled={bulkResetting}
                className="w-full py-1.5 bg-orange-900/40 border border-orange-800/60 text-orange-300 text-[11px] font-semibold rounded hover:bg-orange-900/60 transition-colors cursor-pointer disabled:opacity-50">
                {bulkResetting ? 'Resetting...' : `Bulk Reset Failed Keys`}
              </button>
            </div>
          )}

          {/* Circuit Breaker */}
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-2">
            <div className="text-[11px] font-bold text-zinc-300 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-blue-400" /> Circuit Breaker
            </div>
            {circ ? (
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-400">State</span>
                  <span className={`font-bold ${circ.state === 'closed' ? 'text-emerald-400' : circ.state === 'open' ? 'text-red-400' : 'text-amber-400'}`}>
                    {circ.state.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Failures</span>
                  <span className="font-mono text-white">{circ.consecutiveFailures}</span>
                </div>
                {circ.cooldownRemainingMs > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Cooldown</span>
                    <span className="text-amber-400 font-mono">{Math.round(circ.cooldownRemainingMs / 1000)}s</span>
                  </div>
                )}
              </div>
            ) : <div className="text-[11px] text-zinc-500">No failures recorded.</div>}
            {circ && circ.state !== 'closed' && (
              <button onClick={doResetCircuit}
                className="w-full py-1.5 bg-red-950/40 border border-red-900/50 text-red-400 text-[11px] font-semibold rounded hover:bg-red-950/60 transition-colors cursor-pointer">
                Reset Circuit Breaker
              </button>
            )}
          </div>
        </div>

        {/* Right: key list */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold text-zinc-300">API Keys — {currProvider.name} ({keys.length})</div>
            <button onClick={() => { setShowAdd(v => !v); setAddErr(''); }}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-semibold rounded transition-colors cursor-pointer">
              <Plus className="w-3 h-3" /> Add Key
            </button>
          </div>

          {showAdd && (
            <div className="p-4 bg-zinc-900/60 border border-emerald-900/50 rounded-lg space-y-2.5">
              <div className="text-[11px] font-bold text-emerald-300">Add New Key — {currProvider.name}</div>
              <input type="password" value={addKey} onChange={e => setAddKey(e.target.value)}
                placeholder="Paste API key (stored encrypted in server memory — never logged)"
                className="w-full bg-zinc-950 border border-zinc-700 rounded p-2.5 text-xs text-white placeholder-zinc-600 focus:border-emerald-700 focus:outline-none font-mono" />
              <input type="text" value={addLabel} onChange={e => setAddLabel(e.target.value)}
                placeholder="Label (optional) e.g. Key #2 — Production"
                className="w-full bg-zinc-950 border border-zinc-700 rounded p-2.5 text-xs text-zinc-300 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none" />
              {addErr && <div className="text-[11px] text-red-400">{addErr}</div>}
              <div className="flex gap-2">
                <button onClick={doAdd} disabled={isAdding}
                  className="flex-1 py-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-[11px] font-semibold rounded cursor-pointer transition-colors">
                  {isAdding ? 'Adding...' : 'Add to Pool'}
                </button>
                <button onClick={() => { setShowAdd(false); setAddErr(''); }}
                  className="px-3 py-1.5 bg-zinc-800 text-zinc-400 text-[11px] rounded hover:bg-zinc-700 cursor-pointer transition-colors">Cancel</button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-xs text-zinc-500">Loading key pool...</div>
          ) : keys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
              <Key className="w-8 h-8 text-zinc-700" />
              <div className="text-xs text-zinc-500">No keys configured for {currProvider.name}.</div>
              <div className="text-[11px] text-zinc-600">Keys in your <span className="font-mono">.env</span> are loaded automatically on server start.</div>
            </div>
          ) : (
            <div className="space-y-2">
              {keys.map((k, idx) => {
                const ks = keyStatus(k);
                const tr = testRes[k.id];
                const rate = k.totalRequests > 0 ? Math.round((k.successCount / k.totalRequests) * 100) : null;
                const isFailed = k.isEnabled && (!k.isHealthy || k.cooldownUntil > Date.now() || k.rateLimitUntil > Date.now());
                return (
                  <div key={k.id} className={`p-3 rounded-lg border transition-all ${
                    !k.isEnabled ? 'bg-zinc-950/40 border-zinc-800/50 opacity-60'
                    : !k.isHealthy || k.quotaStatus === 'exhausted' ? 'bg-red-950/10 border-red-900/30'
                    : k.cooldownUntil > Date.now() || k.rateLimitUntil > Date.now() ? 'bg-amber-950/10 border-amber-900/30'
                    : 'bg-zinc-900/60 border-zinc-800'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                          <div className={`w-2 h-2 rounded-full ${ks.dot}`} />
                          <span className="text-[9px] font-mono text-zinc-600">#{idx + 1}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          {/* Label + status + health score + latency */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-semibold text-zinc-200 truncate">{k.label}</span>
                            <span className={`text-[9px] font-bold ${ks.cls}`}>{ks.label}</span>
                            <HealthBadge score={k.healthScore} />
                            {k.avgLatencyMs > 0 && <LatencyBadge ms={k.avgLatencyMs} />}
                          </div>

                          {/* Masked key + request stats */}
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-500 font-mono flex-wrap">
                            <span className="opacity-40">{k.maskedKey}</span>
                            {k.lastUsedAt && <span>⏱ {new Date(k.lastUsedAt).toLocaleString()}</span>}
                            {rate !== null && (
                              <span className={rate >= 90 ? 'text-emerald-500' : rate >= 70 ? 'text-amber-500' : 'text-red-500'}>✓ {rate}%</span>
                            )}
                            {k.totalRequests > 0 && <span>{k.totalRequests} req</span>}
                            {k.consecutiveFailures > 0 && <span className="text-red-400">{k.consecutiveFailures} consec. fail</span>}
                            {k.timeoutCount > 0 && <span className="text-amber-500">{k.timeoutCount} timeouts</span>}
                            {k.rateLimitCount > 0 && <span className="text-amber-400">{k.rateLimitCount} rate limits</span>}
                          </div>

                          {/* Cooldown live countdown */}
                          <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                            <KeyCooldownDisplay cooldownUntil={k.cooldownUntil || 0} rateLimitUntil={k.rateLimitUntil || 0} />
                            {k.quotaStatus === 'exhausted' && (
                              <span className="text-[9px] text-red-400 bg-red-950/30 px-1 rounded">⊗ Quota Exhausted</span>
                            )}
                          </div>

                          {k.lastErrorMessage && (
                            <div className="text-[10px] text-red-400 mt-0.5 truncate">✗ {k.lastErrorMessage}</div>
                          )}

                          {/* Timestamps */}
                          {(k.lastSuccessAt || k.lastFailureAt) && (
                            <div className="flex gap-2 mt-0.5 text-[9px] font-mono text-zinc-600 flex-wrap">
                              {k.lastSuccessAt && <span>✓ {new Date(k.lastSuccessAt).toLocaleTimeString()}</span>}
                              {k.lastFailureAt && <span className="text-red-600">✗ {new Date(k.lastFailureAt).toLocaleTimeString()}</span>}
                            </div>
                          )}

                          {/* Test/validate result */}
                          {tr && (
                            <div className={`text-[10px] mt-0.5 font-semibold flex items-center gap-1 ${tr.status === 'ok' ? 'text-emerald-400' : tr.status === 'testing' ? 'text-zinc-400 animate-pulse' : 'text-red-400'}`}>
                              {tr.status === 'testing' ? '⏳ Testing...'
                                : tr.status === 'ok' ? `✓ ${tr.message}${tr.latencyMs ? ` (${tr.latencyMs}ms)` : ''}`
                                : `✗ ${tr.message}`}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        {/* Validate — lightweight auth check (⚡) */}
                        <button onClick={() => doValidate(k)} disabled={tr?.status === 'testing'} title="Validate key (auth check only — fast)"
                          className="p-1.5 rounded text-zinc-500 hover:text-blue-400 hover:bg-blue-950/30 transition-colors cursor-pointer">
                          <Zap className="w-3.5 h-3.5" />
                        </button>
                        {/* Test — full generation test */}
                        <button onClick={() => doTest(k)} disabled={tr?.status === 'testing'} title="Full test (generation check)"
                          className="p-1.5 rounded text-zinc-500 hover:text-amber-400 hover:bg-amber-950/30 transition-colors cursor-pointer">
                          <FlaskConical className="w-3.5 h-3.5" />
                        </button>
                        {/* Reset from cooldown (only shown when key is failed/cooling) */}
                        {isFailed && (
                          <button onClick={() => doReset(k)} title="Reset from cooldown / restore key"
                            className="p-1.5 rounded text-zinc-500 hover:text-orange-400 hover:bg-orange-950/30 transition-colors cursor-pointer">
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {/* Enable / Disable toggle */}
                        <button onClick={() => doToggle(k)} title={k.isEnabled ? 'Disable key' : 'Enable key'}
                          className={`p-1.5 rounded transition-colors cursor-pointer ${k.isEnabled ? 'text-emerald-400 hover:text-amber-400 hover:bg-amber-950/20' : 'text-zinc-600 hover:text-emerald-400 hover:bg-emerald-950/20'}`}>
                          {k.isEnabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        {/* Delete */}
                        <button onClick={() => doDelete(k.id)} title="Delete key permanently"
                          className="p-1.5 rounded text-zinc-600 hover:text-red-400 hover:bg-red-950/20 transition-colors cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-lg flex items-start gap-2">
            <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-zinc-400">
              <span className="font-semibold text-amber-400">Security:</span> Raw keys are never sent to the frontend.{' '}
              {encryptionEnabled
                ? 'Keys are AES-256-GCM encrypted at rest in server memory.'
                : 'Set STOCKAI_KEY_ENCRYPTION_SECRET (≥32 chars) to enable at-rest encryption.'}
              {' '}All rotation and failover happen server-side.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Model Management Panel ────────────────────────────────────────────────────

const ModelManagementPanel: React.FC<{ authToken: string }> = ({ authToken }) => {
  const [providerOverview, setProviderOverview] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selProvider, setSelProvider] = React.useState('google-gemini');
  const [togglingModel, setTogglingModel] = React.useState<string | null>(null);
  const [settingDefault, setSettingDefault] = React.useState<string | null>(null);

  const hdrs = { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' };

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/provider-overview', { headers: hdrs });
      if (res.ok) { const d = await res.json(); setProviderOverview(d.providers || []); }
    } catch {}
    setIsLoading(false);
  };

  React.useEffect(() => { load(); }, []);

  const doToggleModel = async (providerId: string, modelId: string, isEnabled: boolean) => {
    const k = `${providerId}:${modelId}`;
    setTogglingModel(k);
    try {
      await fetch(`/api/admin/provider/${providerId}/models/${encodeURIComponent(modelId)}/toggle`, {
        method: 'POST', headers: hdrs, body: JSON.stringify({ isEnabled })
      });
      await load();
    } catch {}
    setTogglingModel(null);
  };

  const doSetDefault = async (providerId: string, modelId: string) => {
    const k = `${providerId}:${modelId}`;
    setSettingDefault(k);
    try {
      await fetch(`/api/admin/provider/${providerId}/models/${encodeURIComponent(modelId)}/set-default`, {
        method: 'POST', headers: hdrs
      });
      await load();
    } catch {}
    setSettingDefault(null);
  };

  const selPd = providerOverview.find(p => p.id === selProvider);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" /> Model Management
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">Enable/disable models and set the default model per provider.</p>
        </div>
        <button onClick={load} className="p-2 bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800 transition-colors cursor-pointer">
          <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
        </button>
      </div>

      {/* Provider selector */}
      <div className="flex flex-wrap gap-2">
        {PROVIDERS_LIST.map(p => {
          const pd = providerOverview.find(x => x.id === p.id);
          const enabledCount = pd ? (pd.models || []).filter((m: any) => m.isEnabled !== false).length : 0;
          const totalCount = pd ? (pd.models || []).length : 0;
          return (
            <button key={p.id} onClick={() => setSelProvider(p.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
                selProvider === p.id ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}>
              <span>{p.icon}</span>
              <span>{p.name}</span>
              {totalCount > 0 && (
                <span className="text-[9px] text-zinc-500">{enabledCount}/{totalCount}</span>
              )}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="py-10 text-center text-xs text-zinc-500">Loading provider models...</div>
      ) : !selPd ? (
        <div className="py-10 text-center text-xs text-zinc-500">Provider data not available. Click refresh.</div>
      ) : (
        <div className="space-y-2">
          {(selPd.models || []).map((model: any) => {
            const k = `${selProvider}:${model.id}`;
            const isToggling = togglingModel === k;
            const isSettingDef = settingDefault === k;
            const isEnabled = model.isEnabled !== false;
            return (
              <div key={model.id} className={`p-3 rounded-lg border transition-all ${
                !isEnabled ? 'bg-zinc-950/40 border-zinc-800/50 opacity-60'
                : model.deprecated ? 'bg-zinc-950/20 border-zinc-800/30'
                : 'bg-zinc-900/60 border-zinc-800'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-zinc-200 font-mono truncate">{model.id}</span>
                      {model.isDefault && (
                        <span className="text-[9px] bg-amber-950/50 border border-amber-800/60 text-amber-400 px-1.5 py-0.5 rounded font-bold">DEFAULT</span>
                      )}
                      {model.deprecated && (
                        <span className="text-[9px] bg-red-950/50 border border-red-800/60 text-red-400 px-1.5 py-0.5 rounded">DEPRECATED</span>
                      )}
                      {model.tier === 'free' && (
                        <span className="text-[9px] bg-emerald-950/50 border border-emerald-800/60 text-emerald-400 px-1.5 py-0.5 rounded">FREE</span>
                      )}
                    </div>
                    <div className="flex gap-3 mt-0.5 text-[10px] text-zinc-500">
                      {model.capabilities?.vision && <span>👁 Vision</span>}
                      {model.capabilities?.json && <span>{'{}'} JSON</span>}
                      {model.capabilities?.streaming && <span>⚡ Stream</span>}
                      {model.contextWindow && <span>{(model.contextWindow / 1000).toFixed(0)}k ctx</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isEnabled && !model.isDefault && (
                      <button onClick={() => doSetDefault(selProvider, model.id)} disabled={isSettingDef}
                        title="Set as default model for this provider"
                        className="px-2 py-1 text-[9px] font-semibold text-zinc-400 border border-zinc-700 rounded hover:border-amber-600 hover:text-amber-400 transition-colors cursor-pointer disabled:opacity-50">
                        {isSettingDef ? '...' : 'Set Default'}
                      </button>
                    )}
                    <button
                      onClick={() => doToggleModel(selProvider, model.id, !isEnabled)}
                      disabled={isToggling || model.isDefault}
                      title={model.isDefault ? 'Default model cannot be disabled' : (isEnabled ? 'Disable this model' : 'Enable this model')}
                      className={`px-2.5 py-1 text-[10px] font-semibold rounded border transition-colors cursor-pointer disabled:opacity-40 ${
                        isEnabled
                          ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400 hover:bg-red-950/40 hover:border-red-800/60 hover:text-red-400'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:border-emerald-700 hover:text-emerald-400'
                      }`}>
                      {isToggling ? '...' : isEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};









// Whitelist of permanent immutable administrator emails (Section 3 & Section 20)
const IMMUTABLE_ADMIN_EMAILS = [
  'adobeicon99@gmail.com',
  'fahadhussain0282@gmail.com'
];


interface AdminPanelProps {
  currentUser: AuthUser | null;
  subscription: UserSubscription;
  onUpdateSubscription: (updated: UserSubscription) => void;
  onExitAdmin: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  subscription,
  onUpdateSubscription,
  onExitAdmin
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'add-member' | 'subscriptions' | 'devices' | 'analytics' | 'audit' | 'settings' | 'support' | 'api-management' | 'plans' | 'system-health' | 'licenses' | 'plan-history'>('overview');
  const [apiSubTab, setApiSubTab] = useState<'key-pool' | 'models'>('key-pool');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Metrics & Stats
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    expiredUsers: 0,
    pendingUsers: 0,
    suspendedUsers: 0,
    todaysSignups: 0,
    todaysGenerations: 42,
    totalMetadataGenerated: 1280,
    totalPromptGenerations: 340,
    totalCsvExports: 215,
    totalRevenue: 0,
    monthlyRevenue: 0,
    activeDevices: 0,
    apiStatus: 'Operational',
    csvnestVersion: 'v2.0 StockAI Title Intelligence',
    providerStatus: 'Google Gemini 3.6 Flash Active'
  });

  const [csvnestStats, setCsvnestStats] = useState({
    titlesGenerated: 1280,
    descriptionsGenerated: 1280,
    keywordsGenerated: 64000,
    avgSeoScore: 96.4,
    transparentPngUsage: 184,
    marketplaceDistribution: {
      'Adobe Stock': 45,
      'Shutterstock': 30,
      'Freepik': 15,
      'Vecteezy': 10
    }
  });

  const [providerAnalytics, setProviderAnalytics] = useState({
    geminiUsage: '88%',
    grokUsage: '8%',
    groqUsage: '4%',
    avgResponseTimeMs: 1240,
    apiErrors: 0,
    successRate: '99.8%'
  });

  // User Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'pending_activation' | 'suspended' | 'blocked'>('all');

  // Pagination
  const [userPage, setUserPage] = useState(1);
  const USER_PAGE_SIZE = 20;

  // Dynamic Plans from API
  const [dynamicPlans, setDynamicPlans] = useState<any[]>([]);

  // Live System Health
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // Licenses & Plan History
  const [licenses, setLicenses] = useState<any[]>([]);
  const [planHistory, setPlanHistory] = useState<any[]>([]);

  // New Plan Form
  const [isNewPlanOpen, setIsNewPlanOpen] = useState(false);
  const [newPlanForm, setNewPlanForm] = useState({
    name: '',
    price: 0,
    currency: 'PKR',
    durationDays: 30,
    features: '',
    visibility: 'public'
  });

  // Add Member Modal State
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({
    fullName: '',
    email: '',
    planName: '1 Month Plan' as '1 Month Plan' | '6 Months Plan' | 'Enterprise Custom',
    durationDays: 30,
    activationDate: new Date().toISOString().slice(0, 10),
    status: 'active' as 'active' | 'pending' | 'suspended'
  });

  // Edit User Drawer State
  const [editingUser, setEditingUser] = useState<AdminUserRecord | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    status: 'active',
    planName: '1 Month Plan',
    extendDays: 0,
    customExpiryDate: '',
    resetDevice: false
  });

  // Admin System Settings
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    systemNotification: 'Welcome to StockAI Enterprise Generator v1.2',
    defaultProvider: 'Google Gemini 3.6 Flash',
    singleDeviceLockEnabled: true
  });

  // Check authorization
  const isAuthorizedAdmin = currentUser && IMMUTABLE_ADMIN_EMAILS.includes(currentUser.email.toLowerCase().trim());

  useEffect(() => {
    if (isAuthorizedAdmin) {
      fetchAdminData();
    }
  }, [isAuthorizedAdmin]);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('stockai_auth_token') || '';
      const headers = {
        'Authorization': `Bearer ${token}`,
        'X-Device-Id': currentUser?.activeDeviceId || ''
      };

      const [usersRes, metricsRes, plansRes, settingsRes] = await Promise.all([
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/metrics', { headers }),
        fetch('/api/admin/plans', { headers }),
        fetch('/api/admin/system-settings', { headers })
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
        setAuditLogs(data.auditLogs || []);
      }

      if (metricsRes.ok) {
        const mData = await metricsRes.json();
        if (mData.metrics) setMetrics(prev => ({ ...prev, ...mData.metrics }));
        if (mData.stockAiStats || mData.csvnestStats) setCsvnestStats(mData.stockAiStats || mData.csvnestStats);
        if (mData.providerAnalytics) setProviderAnalytics(mData.providerAnalytics);
      }

      if (plansRes.ok) {
        const pData = await plansRes.json();
        setDynamicPlans(pData.plans || []);
      }

      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        if (sData.settings) {
          setSystemSettings(prev => ({
            ...prev,
            maintenanceMode: sData.settings.maintenanceMode ?? prev.maintenanceMode,
            systemNotification: sData.settings.systemAnnouncement || prev.systemNotification,
            defaultProvider: sData.settings.defaultProvider || prev.defaultProvider
          }));
        }
      }

      // Load licenses and plan history in parallel
      const [licRes, histRes] = await Promise.all([
        fetch('/api/admin/licenses', { headers }),
        fetch('/api/admin/plan-history', { headers })
      ]);
      if (licRes.ok) { const d = await licRes.json(); setLicenses(d.licenses || []); }
      if (histRes.ok) { const d = await histRes.json(); setPlanHistory(d.history || []); }

    } catch (e) {
      console.error('Failed to fetch admin data', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivatePlan = async (userId: string, targetEmail: string, planName: '1 Month Plan' | '6 Months Plan', days: number) => {
    try {
      const token = localStorage.getItem('stockai_auth_token') || '';
      const price = planName === '1 Month Plan' ? 300 : 2000;
      const res = await fetch('/api/admin/activate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          planName,
          durationDays: days,
          price
        })
      });

      if (res.ok) {
        if (targetEmail.toLowerCase() === currentUser?.email.toLowerCase()) {
          const now = new Date();
          const expiry = new Date(now.getTime() + days * 86400000).toISOString();
          onUpdateSubscription({
            ...subscription,
            planName,
            price,
            durationDays: days,
            activatedAt: now.toISOString(),
            expiresAt: expiry,
            isActive: true,
            isExpired: false
          });
        }
        fetchAdminData();
      }
    } catch (e) {
      console.error('Activation failed', e);
    }
  };

  const handleExpirePlan = async (userId: string, targetEmail: string) => {
    try {
      const token = localStorage.getItem('stockai_auth_token') || '';
      const res = await fetch('/api/admin/expire-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });

      if (res.ok) {
        if (targetEmail.toLowerCase() === currentUser?.email.toLowerCase()) {
          onUpdateSubscription({
            ...subscription,
            isActive: false,
            isExpired: true,
            expiresAt: new Date().toISOString()
          });
        }
        fetchAdminData();
      }
    } catch (e) {}
  };

  const handleToggleSuspend = async (userId: string, currentStatus: string) => {
    try {
      const token = localStorage.getItem('stockai_auth_token') || '';
      const suspend = currentStatus !== 'suspended';
      await fetch('/api/admin/toggle-suspend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, suspend })
      });
      fetchAdminData();
    } catch (e) {}
  };

  const handleRevokeDevice = async (userId: string) => {
    try {
      const token = localStorage.getItem('stockai_auth_token') || '';
      await fetch('/api/admin/revoke-device', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });
      fetchAdminData();
    } catch (e) {}
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberForm.email) return;

    try {
      const token = localStorage.getItem('stockai_auth_token') || '';
      const res = await fetch('/api/admin/add-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: newMemberForm.fullName,
          email: newMemberForm.email,
          planName: newMemberForm.planName,
          durationDays: newMemberForm.durationDays,
          activationDate: newMemberForm.activationDate,
          status: newMemberForm.status
        })
      });

      if (res.ok) {
        setIsAddMemberOpen(false);
        setNewMemberForm({
          fullName: '',
          email: '',
          planName: '1 Month Plan',
          durationDays: 30,
          activationDate: new Date().toISOString().slice(0, 10),
          status: 'active'
        });
        fetchAdminData();
      }
    } catch (e) {
      console.error('Add member failed', e);
    }
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const token = localStorage.getItem('stockai_auth_token') || '';
      const res = await fetch('/api/admin/edit-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: editingUser.id,
          fullName: editForm.fullName,
          email: editForm.email,
          status: editForm.status,
          planName: editForm.planName,
          extendDays: editForm.extendDays,
          customExpiryDate: editForm.customExpiryDate,
          resetDevice: editForm.resetDevice
        })
      });

      if (res.ok) {
        setEditingUser(null);
        fetchAdminData();
      }
    } catch (e) {
      console.error('Edit user failed', e);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!window.confirm(`PERMANENTLY DELETE this account?\n\n${userEmail}\n\nThis action CANNOT be undone. All sessions will be terminated.`)) return;
    try {
      const token = localStorage.getItem('stockai_auth_token') || '';
      await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchAdminData();
    } catch (e) { console.error('Delete user failed', e); }
  };

  const handleChangeRole = async (userId: string, userEmail: string, newRole: 'admin' | 'contributor') => {
    if (!window.confirm(`Change role for ${userEmail} to ${newRole}?`)) return;
    try {
      const token = localStorage.getItem('stockai_auth_token') || '';
      await fetch('/api/admin/change-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId, role: newRole })
      });
      fetchAdminData();
    } catch (e) { console.error('Change role failed', e); }
  };

  const handleResetPassword = async (userId: string, userEmail: string) => {
    const newPassword = window.prompt(`Set new password for ${userEmail}:\n(minimum 6 characters)`);
    if (!newPassword || newPassword.length < 6) return;
    try {
      const token = localStorage.getItem('stockai_auth_token') || '';
      const res = await fetch('/api/admin/reset-user-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId, newPassword })
      });
      if (res.ok) alert(`Password reset successfully for ${userEmail}. All active sessions have been terminated.`);
      else { const d = await res.json(); alert(`Error: ${d.error}`); }
    } catch (e) { console.error('Reset password failed', e); }
  };

  const handleForceLogout = async (userId: string, userEmail: string) => {
    if (!window.confirm(`Force logout all sessions for ${userEmail}?`)) return;
    try {
      const token = localStorage.getItem('stockai_auth_token') || '';
      await fetch('/api/admin/force-logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId })
      });
      fetchAdminData();
    } catch (e) { console.error('Force logout failed', e); }
  };

  const handleBlockUser = async (userId: string, userEmail: string) => {
    if (!window.confirm(`BLOCK account for ${userEmail}?\n\nThis will immediately terminate all sessions and prevent login.`)) return;
    try {
      const token = localStorage.getItem('stockai_auth_token') || '';
      const res = await fetch('/api/admin/block-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId })
      });
      if (!res.ok) {
        const d = await res.json();
        alert(`Error: ${d.error}`);
      } else {
        fetchAdminData();
      }
    } catch (e) { console.error('Block user failed', e); }
  };

  const handleUnblockUser = async (userId: string, userEmail: string) => {
    if (!window.confirm(`UNBLOCK account for ${userEmail}?`)) return;
    try {
      const token = localStorage.getItem('stockai_auth_token') || '';
      await fetch('/api/admin/unblock-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId })
      });
      fetchAdminData();
    } catch (e) { console.error('Unblock user failed', e); }
  };

  const handleExportUsers = () => {
    const token = localStorage.getItem('stockai_auth_token') || '';
    const url = '/api/admin/export-users';
    const a = document.createElement('a');
    a.href = url;
    // Add auth token via a short-lived link
    fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        a.href = blobUrl;
        a.download = `stockai-users-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      })
      .catch(() => alert('Export failed. Please try again.'));
  };

  const handleOpenWhatsApp = (channel: 'sales' | 'support' | 'general') => {
    const numbers = {
      sales: '03413516882',
      support: '03394377311',
      general: '03413516882'
    };
    const targetNum = numbers[channel];
    const cleanNum = targetNum.replace(/^0/, '92');
    window.open(`https://wa.me/${cleanNum}?text=StockAI%20Administrator%20Inquiry`, '_blank');
  };

  // Filtered & Paginated Users
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && (u.planStatus === statusFilter || (u as any).status === statusFilter);
  });
  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / USER_PAGE_SIZE));
  const paginatedUsers = filteredUsers.slice((userPage - 1) * USER_PAGE_SIZE, userPage * USER_PAGE_SIZE);

  const fetchSystemHealth = async () => {
    setHealthLoading(true);
    try {
      const token = localStorage.getItem('stockai_auth_token') || '';
      const res = await fetch('/api/admin/system-health', {
        headers: { 'Authorization': `Bearer ${token}`, 'X-Device-Id': currentUser?.activeDeviceId || '' }
      });
      if (res.ok) {
        const data = await res.json();
        setSystemHealth(data);
      }
    } catch (e) { console.error('Health fetch failed', e); }
    finally { setHealthLoading(false); }
  };

  const handleSaveSettings = async () => {
    try {
      const token = localStorage.getItem('stockai_auth_token') || '';
      const res = await fetch('/api/admin/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          maintenanceMode: systemSettings.maintenanceMode,
          systemAnnouncement: systemSettings.systemNotification,
          defaultProvider: systemSettings.defaultProvider
        })
      });
      if (res.ok) {
        alert('System settings saved successfully.');
      } else {
        alert('Failed to save settings. Please try again.');
      }
    } catch (e) { alert('Network error while saving settings.'); }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('stockai_auth_token') || '';
      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: newPlanForm.name,
          price: Number(newPlanForm.price),
          currency: newPlanForm.currency,
          durationDays: Number(newPlanForm.durationDays),
          features: newPlanForm.features.split(',').map(f => f.trim()).filter(Boolean),
          visibility: newPlanForm.visibility,
          status: 'active'
        })
      });
      if (res.ok) {
        setIsNewPlanOpen(false);
        setNewPlanForm({ name: '', price: 0, currency: 'PKR', durationDays: 30, features: '', visibility: 'public' });
        fetchAdminData();
      } else {
        const d = await res.json();
        alert(`Error: ${d.error}`);
      }
    } catch (e) { alert('Failed to create plan.'); }
  };

  // Section 3: If not authorized admin, return 403 Forbidden Access Denied
  if (!isAuthorizedAdmin) {
    return (
      <div className="fixed inset-0 z-50 bg-[#09090b] flex flex-col items-center justify-center p-6 text-center text-zinc-200 font-sans">
        <div className="max-w-md w-full bg-zinc-900/80 border border-red-900/50 rounded-lg p-8 space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-red-950/80 border border-red-800 flex items-center justify-center mx-auto text-red-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-red-400">403 FORBIDDEN</div>
            <h1 className="text-2xl font-bold text-white">Access Denied</h1>
            <p className="text-xs text-zinc-400 leading-relaxed pt-1">
              You do not have permission to access the StockAI Administrator Portal. Only whitelisted system administrators are authorized.
            </p>
          </div>
          <button
            onClick={onExitAdmin}
            className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs rounded transition-colors cursor-pointer border border-zinc-700"
          >
            Return To Main Workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 md:p-6 font-sans text-zinc-200">
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-lg max-w-7xl w-full h-[95vh] flex flex-col shadow-2xl relative overflow-hidden">
        
        {/* Admin Header (Section 3) */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-white text-black flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                StockAI Enterprise Administrator Portal
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                  ROUTE /ADMIN
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">Internal Management System • Secure Whitelisted Credentials</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={fetchAdminData}
              className="p-1.5 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded border border-zinc-800 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <div className="hidden sm:block text-right">
              <div className="text-xs text-zinc-300 font-semibold">{currentUser?.fullName}</div>
              <div className="text-[10px] font-mono text-zinc-500">{currentUser?.email}</div>
            </div>

            <button
              onClick={onExitAdmin}
              className="px-3.5 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded text-xs transition-colors cursor-pointer font-medium"
            >
              Exit Portal
            </button>
          </div>
        </div>

        {/* Main Workspace Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Admin Sidebar Navigation */}
          <div className="w-full md:w-64 bg-zinc-950 border-r border-zinc-800 p-3 space-y-1 shrink-0 overflow-y-auto">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-2 mb-2">
              Management Modules
            </div>

            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                activeTab === 'overview' ? 'bg-zinc-800 text-white font-semibold shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-zinc-400" />
              Overview Dashboard
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                activeTab === 'users' ? 'bg-zinc-800 text-white font-semibold shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Users className="w-4 h-4 text-zinc-400" />
              User Accounts ({metrics.totalUsers})
            </button>

            <button
              onClick={() => setIsAddMemberOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium text-emerald-400 hover:bg-emerald-950/40 border border-emerald-900/40 transition-colors"
            >
              <UserPlus className="w-4 h-4 text-emerald-400" />
              Add Member (Section 8)
            </button>

            {/* ─── Subscriptions Group ─── */}
            <div className="pt-2 pb-1 px-2"><div className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">Subscriptions</div></div>

            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                activeTab === 'subscriptions' ? 'bg-zinc-800 text-white font-semibold shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <CreditCard className="w-4 h-4 text-zinc-400" />
              Subscription Management
            </button>

            <button
              onClick={() => { setActiveTab('licenses'); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                activeTab === 'licenses' ? 'bg-zinc-800 text-white font-semibold shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <FileText className="w-4 h-4 text-amber-400" />
              Licenses & Alerts
              {licenses.filter(l => l.daysRemaining <= 7).length > 0 && (
                <span className="ml-auto bg-amber-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  {licenses.filter(l => l.daysRemaining <= 7).length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('plan-history')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                activeTab === 'plan-history' ? 'bg-zinc-800 text-white font-semibold shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <History className="w-4 h-4 text-zinc-400" />
              Plan History
            </button>

            <button
              onClick={() => setActiveTab('plans')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                activeTab === 'plans' ? 'bg-zinc-800 text-white font-semibold shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Layers className="w-4 h-4 text-blue-400" />
              Custom Plans
            </button>

            {/* ─── System Group ─── */}
            <div className="pt-2 pb-1 px-2"><div className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">System</div></div>

            <button
              onClick={() => setActiveTab('devices')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                activeTab === 'devices' ? 'bg-zinc-800 text-white font-semibold shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Smartphone className="w-4 h-4 text-zinc-400" />
              Device Management
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                activeTab === 'analytics' ? 'bg-zinc-800 text-white font-semibold shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Activity className="w-4 h-4 text-zinc-400" />
              Analytics
            </button>

            <button
              onClick={() => setActiveTab('api-management')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                activeTab === 'api-management' ? 'bg-zinc-800 text-white font-semibold shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-400" />
              API Management
            </button>

            <button
              onClick={() => { setActiveTab('system-health'); fetchSystemHealth(); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                activeTab === 'system-health' ? 'bg-zinc-800 text-white font-semibold shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Activity className="w-4 h-4 text-purple-400" />
              System Health
            </button>

            {/* ─── Admin Group ─── */}
            <div className="pt-2 pb-1 px-2"><div className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">Admin</div></div>

            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                activeTab === 'audit' ? 'bg-zinc-800 text-white font-semibold shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <History className="w-4 h-4 text-zinc-400" />
              Security Audit Log
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                activeTab === 'settings' ? 'bg-zinc-800 text-white font-semibold shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Settings className="w-4 h-4 text-zinc-400" />
              System Settings
            </button>

            <button
              onClick={() => setActiveTab('support')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                activeTab === 'support' ? 'bg-zinc-800 text-white font-semibold shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              WhatsApp Support
            </button>

            <div className="pt-6 border-t border-zinc-800/80 mt-4 px-2 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Immutable Administrators</div>
              {IMMUTABLE_ADMIN_EMAILS.map(e => (
                <div key={e} className="text-[10px] text-zinc-400 font-mono truncate">{e}</div>
              ))}
            </div>
          </div>

          {/* Module Content Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-[#0c0c0e]">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-xs text-zinc-500 font-mono">
                Loading administrator data records...
              </div>
            ) : (
              <>
                {/* Overview Dashboard (Section 4) */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white">System Executive Dashboard</h3>
                        <p className="text-xs text-zinc-400">Real-time statistics synchronized with the central server store.</p>
                      </div>
                      <button
                        onClick={() => setIsAddMemberOpen(true)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded shadow-lg transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" /> Add Member
                      </button>
                    </div>

                    {/* Stats Grid 1: Users & Revenue */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-1">
                        <div className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Total Contributor Accounts</div>
                        <div className="text-2xl font-bold font-mono text-white">{metrics.totalUsers}</div>
                        <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> {metrics.activeUsers} Active
                        </div>
                      </div>

                      <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-1">
                        <div className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Expired / Suspended</div>
                        <div className="text-2xl font-bold font-mono text-red-400">{metrics.expiredUsers + metrics.suspendedUsers}</div>
                        <div className="text-[11px] text-zinc-400">{metrics.suspendedUsers} Suspended Accounts</div>
                      </div>

                      <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-1">
                        <div className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Monthly Revenue</div>
                        <div className="text-2xl font-bold font-mono text-emerald-400">PKR {metrics.monthlyRevenue}</div>
                        <div className="text-[11px] text-zinc-400">Lifetime PKR {metrics.totalRevenue}</div>
                      </div>

                      <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-1">
                        <div className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Today's Signups</div>
                        <div className="text-2xl font-bold font-mono text-amber-400">{metrics.todaysSignups}</div>
                        <div className="text-[11px] text-zinc-400">Single Device Lock Active</div>
                      </div>
                    </div>

                    {/* Stats Grid 2: Generation Engine */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-1">
                        <div className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Total Metadata Output</div>
                        <div className="text-xl font-bold font-mono text-white">{metrics.totalMetadataGenerated}</div>
                        <div className="text-[11px] text-zinc-400">Titles, Descriptions & Tags</div>
                      </div>

                      <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-1">
                        <div className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Prompt Generations</div>
                        <div className="text-xl font-bold font-mono text-white">{metrics.totalPromptGenerations}</div>
                        <div className="text-[11px] text-zinc-400">Midjourney, DALL-E 3, Flux</div>
                      </div>

                      <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-1">
                        <div className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">CSV Exports</div>
                        <div className="text-xl font-bold font-mono text-white">{metrics.totalCsvExports}</div>
                        <div className="text-[11px] text-zinc-400">Multi-Marketplace Packages</div>
                      </div>

                      <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-1">
                        <div className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Active Devices</div>
                        <div className="text-xl font-bold font-mono text-white">{metrics.activeDevices}</div>
                        <div className="text-[11px] text-emerald-400">1 Device per Contributor</div>
                      </div>
                    </div>

                    {/* System Status Cards */}
                    <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Engine & Service Health</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded border border-zinc-800">
                          <Zap className="w-5 h-5 text-emerald-400" />
                          <div>
                            <div className="text-xs font-bold text-white">API Engine Status</div>
                            <div className="text-[11px] text-emerald-400 font-mono">{metrics.apiStatus}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded border border-zinc-800">
                          <Layers className="w-5 h-5 text-indigo-400" />
                          <div>
                            <div className="text-xs font-bold text-white">StockAI Engine Version</div>
                            <div className="text-[11px] text-indigo-300 font-mono">{metrics.csvnestVersion}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded border border-zinc-800">
                          <Activity className="w-5 h-5 text-amber-400" />
                          <div>
                            <div className="text-xs font-bold text-white">Active AI Provider</div>
                            <div className="text-[11px] text-amber-300 font-mono">{metrics.providerStatus}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* User Management Tab (Section 6, 7, 17) */}
                {activeTab === 'users' && (
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-white">Contributor User Accounts</h3>
                        <p className="text-xs text-zinc-400">Manage user status, plan activation, device locks, and access permissions.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleExportUsers}
                          className="px-3.5 py-2 bg-blue-900/60 hover:bg-blue-800/60 text-blue-300 border border-blue-800 font-semibold text-xs rounded shadow transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" /> Export CSV
                        </button>
                        <button
                          onClick={() => setIsAddMemberOpen(true)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded shadow transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <UserPlus className="w-4 h-4" /> Add Member
                        </button>
                      </div>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                      <div className="relative flex-1 w-full">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder="Search users by name or email address..."
                          className="w-full bg-zinc-900 border border-zinc-800 rounded pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 w-full sm:w-auto flex-wrap">
                        <Filter className="w-3.5 h-3.5 text-zinc-500 ml-1" />
                        <span className="text-xs text-zinc-400 font-medium mr-1">Filter:</span>
                        {([
                          { value: 'all', label: 'All' },
                          { value: 'active', label: 'Active' },
                          { value: 'expired', label: 'Expired' },
                          { value: 'pending_activation', label: 'Pending' },
                          { value: 'suspended', label: 'Suspended' },
                          { value: 'blocked', label: 'Blocked' }
                        ] as const).map(f => (
                          <button
                            key={f.value}
                            onClick={() => { setStatusFilter(f.value); setUserPage(1); }}
                            className={`px-2.5 py-1 rounded text-[11px] font-medium capitalize transition-colors ${
                              statusFilter === f.value ? 'bg-zinc-800 text-white font-bold border border-zinc-700' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Users Table */}
                    <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/40">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-950 text-zinc-400 font-mono text-[10px] uppercase border-b border-zinc-800">
                          <tr>
                            <th className="p-3">User & Email</th>
                            <th className="p-3">Role</th>
                            <th className="p-3">Plan</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Expires</th>
                            <th className="p-3">Gens</th>
                            <th className="p-3">Joined</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60">
                          {paginatedUsers.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="p-6 text-center text-zinc-500">
                                No contributor accounts match your query.
                              </td>
                            </tr>
                          ) : (
                            paginatedUsers.map(u => (
                              <tr key={u.id} className="hover:bg-zinc-800/30">
                                <td className="p-3">
                                  <div className="font-semibold text-white">{u.fullName || 'Contributor'}</div>
                                  <div className="text-[11px] font-mono text-zinc-400">{u.email}</div>
                                </td>
                                <td className="p-3 font-mono text-[11px] capitalize">{u.role}</td>
                                <td className="p-3 font-medium text-zinc-200">{u.planName}</td>
                                <td className="p-3">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                    u.planStatus === 'active' 
                                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800' 
                                      : u.planStatus === 'suspended'
                                      ? 'bg-amber-950 text-amber-400 border-amber-800'
                                      : u.planStatus === 'blocked' || (u as any).status === 'blocked'
                                      ? 'bg-red-950 text-red-400 border-red-800'
                                      : u.planStatus === 'pending_activation'
                                      ? 'bg-blue-950 text-blue-400 border-blue-800'
                                      : 'bg-red-950 text-red-400 border-red-800'
                                  }`}>
                                    {u.planStatus === 'active' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                    {u.planStatus === 'pending_activation' ? 'PENDING' : 
                                     u.planStatus === 'blocked' || (u as any).status === 'blocked' ? '🚫 BLOCKED' :
                                     u.planStatus.toUpperCase()}
                                  </span>
                                </td>
                                <td className="p-3 font-mono text-[11px] text-zinc-400">
                                  {new Date(u.expiresAt).toLocaleDateString()}
                                </td>
                                <td className="p-3 font-mono text-[11px] text-center text-zinc-300">
                                  {u.totalGenerations || 0}
                                </td>
                                <td className="p-3 font-mono text-[11px] text-zinc-500">
                                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-1 flex-wrap">
                                    <button
                                      onClick={() => {
                                        setEditingUser(u);
                                        setEditForm({
                                          fullName: u.fullName,
                                          email: u.email,
                                          status: u.planStatus,
                                          planName: u.planName,
                                          extendDays: 0,
                                          customExpiryDate: u.expiresAt.slice(0, 10),
                                          resetDevice: false
                                        });
                                      }}
                                      className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-[10px] font-medium transition-colors"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleActivatePlan(u.id, u.email, '1 Month Plan', 30)}
                                      className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 rounded text-[10px] font-medium transition-colors"
                                    >
                                      Activate
                                    </button>
                                    <button
                                      onClick={() => handleToggleSuspend(u.id, u.planStatus)}
                                      className={`px-2 py-1 rounded text-[10px] font-medium transition-colors border ${
                                        u.planStatus === 'suspended'
                                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800 hover:bg-emerald-900'
                                          : 'bg-amber-950 text-amber-400 border-amber-800 hover:bg-amber-900'
                                      }`}
                                    >
                                      {u.planStatus === 'suspended' ? 'Unsuspend' : 'Suspend'}
                                    </button>
                                    <button
                                      onClick={() => handleExpirePlan(u.id, u.email)}
                                      className="px-2 py-1 bg-orange-950 hover:bg-orange-900 text-orange-400 border border-orange-800 rounded text-[10px] font-medium transition-colors"
                                    >
                                      Expire
                                    </button>
                                    <button
                                      onClick={() => handleForceLogout(u.id, u.email)}
                                      className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 rounded text-[10px] font-medium transition-colors"
                                    >
                                      Logout
                                    </button>
                                    <button
                                      onClick={() => handleResetPassword(u.id, u.email)}
                                      className="px-2 py-1 bg-blue-950 hover:bg-blue-900 text-blue-400 border border-blue-800 rounded text-[10px] font-medium transition-colors"
                                    >
                                      Reset PW
                                    </button>
                                    {u.role !== 'admin' ? (
                                      <button
                                        onClick={() => handleChangeRole(u.id, u.email, 'admin')}
                                        className="px-2 py-1 bg-purple-950 hover:bg-purple-900 text-purple-400 border border-purple-800 rounded text-[10px] font-medium transition-colors"
                                      >
                                        → Admin
                                      </button>
                                    ) : (
                                      !IMMUTABLE_ADMIN_EMAILS.includes(u.email.toLowerCase()) && (
                                        <button
                                          onClick={() => handleChangeRole(u.id, u.email, 'contributor')}
                                          className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-700 rounded text-[10px] font-medium transition-colors"
                                        >
                                          → Contrib
                                        </button>
                                      )
                                    )}
                                    {!IMMUTABLE_ADMIN_EMAILS.includes(u.email.toLowerCase()) && (
                                      <>
                                        {/* Block/Unblock */}
                                        {u.planStatus === 'blocked' || (u as any).status === 'blocked' ? (
                                          <button
                                            onClick={() => handleUnblockUser(u.id, u.email)}
                                            className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 rounded text-[10px] font-medium transition-colors"
                                          >
                                            Unblock
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => handleBlockUser(u.id, u.email)}
                                            className="px-2 py-1 bg-red-950/60 hover:bg-red-900 text-red-400 border border-red-800 rounded text-[10px] font-medium transition-colors"
                                          >
                                            Block
                                          </button>
                                        )}
                                        <button
                                          onClick={() => handleDeleteUser(u.id, u.email)}
                                          className="px-2 py-1 bg-red-950 hover:bg-red-900 text-red-400 border border-red-800 rounded text-[10px] font-bold transition-colors"
                                        >
                                          Delete
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {totalUserPages > 1 && (
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-zinc-500 font-mono">
                          Showing {(userPage - 1) * USER_PAGE_SIZE + 1}&ndash;{Math.min(userPage * USER_PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length} users
                        </span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage === 1} className="px-2.5 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] disabled:opacity-40 hover:bg-zinc-700 transition-colors cursor-pointer">&#8592; Prev</button>
                          <span className="text-xs text-zinc-400 px-2">Page {userPage} / {totalUserPages}</span>
                          <button onClick={() => setUserPage(p => Math.min(totalUserPages, p + 1))} disabled={userPage === totalUserPages} className="px-2.5 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] disabled:opacity-40 hover:bg-zinc-700 transition-colors cursor-pointer">Next &#8594;</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Subscriptions Tab (Section 9, 10, 11) */}
                {activeTab === 'subscriptions' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-bold text-white">Subscription & Expiry Engine</h3>
                      <p className="text-xs text-zinc-400">Configure plans, duration parameters, auto-expiration, and manual extensions.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* 1 Month Plan */}
                      <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-white">1 Month Plan</span>
                          <span className="text-xs font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">PKR 300</span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">Standard 30-day plan offering full StockAI Title Intelligence & Vision Generator access.</p>
                        <div className="text-[11px] font-mono text-zinc-500">Duration: 30 Days • Auto Expiry Active</div>
                      </div>

                      {/* 6 Months Plan */}
                      <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-white">6 Months Plan</span>
                          <span className="text-xs font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">PKR 2000</span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">Extended 180-day studio plan providing long-term studio capacity.</p>
                        <div className="text-[11px] font-mono text-zinc-500">Duration: 180 Days • Auto Expiry Active</div>
                      </div>

                      {/* Enterprise Custom */}
                      <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-white">Enterprise Custom</span>
                          <span className="text-xs font-mono font-bold bg-indigo-950 text-indigo-400 border border-indigo-800 px-2 py-0.5 rounded">Custom</span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">Tailored plan for multi-user agencies or specific custom durations.</p>
                        <div className="text-[11px] font-mono text-zinc-500">Duration: Variable • Admin Custom Override</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Device Management Tab (Section 12, 13) */}
                {activeTab === 'devices' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-white">Single-Device Active Sessions</h3>
                      <p className="text-xs text-zinc-400">Strictly enforcing 1 active device per contributor account. Second login logs out previous session.</p>
                    </div>

                    <div className="space-y-3">
                      {users.map(u => (
                        <div key={u.id} className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              {u.fullName} ({u.email})
                              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                                SINGLE DEVICE LOCK
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-zinc-500">
                              Active Fingerprint ID: <span className="text-zinc-300">{u.activeDeviceId || 'None'}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRevokeDevice(u.id)}
                              className="px-3 py-1.5 bg-red-950 text-red-400 border border-red-800 rounded text-xs font-semibold hover:bg-red-900 transition-colors cursor-pointer"
                            >
                              Revoke & Logout Session
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* StockAI & Provider Analytics (Section 15, 16) */}
                {activeTab === 'analytics' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-bold text-white">StockAI & Provider Performance Analytics</h3>
                      <p className="text-xs text-zinc-400">Detailed title engine metrics, marketplace distribution, and AI response times.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* StockAI Engine Stats */}
                      <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">StockAI Engine Output</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-zinc-950 rounded border border-zinc-800">
                            <div className="text-[10px] text-zinc-500 font-bold uppercase">Titles Generated</div>
                            <div className="text-xl font-bold font-mono text-white">{csvnestStats.titlesGenerated}</div>
                          </div>
                          <div className="p-3 bg-zinc-950 rounded border border-zinc-800">
                            <div className="text-[10px] text-zinc-500 font-bold uppercase">Average SEO Score</div>
                            <div className="text-xl font-bold font-mono text-emerald-400">{csvnestStats.avgSeoScore} / 100</div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-xs font-bold text-white">Marketplace Distribution</div>
                          {Object.entries(csvnestStats.marketplaceDistribution).map(([mp, pct]) => (
                            <div key={mp} className="flex items-center justify-between text-xs py-1 border-b border-zinc-800/40">
                              <span className="text-zinc-400">{mp}</span>
                              <span className="font-mono text-white font-semibold">{pct}%</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Provider Performance */}
                      <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">AI Provider Reliability</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-zinc-950 rounded border border-zinc-800">
                            <div className="text-[10px] text-zinc-500 font-bold uppercase">Response Time</div>
                            <div className="text-xl font-bold font-mono text-white">{providerAnalytics.avgResponseTimeMs} ms</div>
                          </div>
                          <div className="p-3 bg-zinc-950 rounded border border-zinc-800">
                            <div className="text-[10px] text-zinc-500 font-bold uppercase">Success Rate</div>
                            <div className="text-xl font-bold font-mono text-emerald-400">{providerAnalytics.successRate}</div>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between py-1 border-b border-zinc-800/40">
                            <span className="text-zinc-400">Google Gemini Flash Usage</span>
                            <span className="font-mono text-white font-semibold">{providerAnalytics.geminiUsage}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-zinc-800/40">
                            <span className="text-zinc-400">Grok Vision Usage</span>
                            <span className="font-mono text-white font-semibold">{providerAnalytics.grokUsage}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-zinc-800/40">
                            <span className="text-zinc-400">Groq Fast LLaMA Usage</span>
                            <span className="font-mono text-white font-semibold">{providerAnalytics.groqUsage}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Audit Logs Tab (Section 18) */}
                {activeTab === 'audit' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-white">Security & Administrative Audit Logs</h3>
                      <p className="text-xs text-zinc-400">Immutable chronological record of administrator actions.</p>
                    </div>

                    <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/40">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-950 text-zinc-400 font-mono text-[10px] uppercase border-b border-zinc-800">
                          <tr>
                            <th className="p-3">Timestamp</th>
                            <th className="p-3">Administrator</th>
                            <th className="p-3">Action Type</th>
                            <th className="p-3">Target Account</th>
                            <th className="p-3">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                          {auditLogs.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-6 text-center text-zinc-500">
                                No security audit entries recorded yet.
                              </td>
                            </tr>
                          ) : (
                            auditLogs.map(a => (
                              <tr key={a.id} className="hover:bg-zinc-800/30">
                                <td className="p-3 text-zinc-400">{new Date(a.timestamp).toLocaleString()}</td>
                                <td className="p-3 text-white font-semibold">{a.adminEmail}</td>
                                <td className="p-3 text-amber-400 font-bold">{a.action}</td>
                                <td className="p-3 text-zinc-300">{a.targetUser}</td>
                                <td className="p-3 text-zinc-400">{a.details}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* System Settings Tab (Section 21) */}
                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-bold text-white">System Global Settings</h3>
                      <p className="text-xs text-zinc-400">Configure global application parameters, provider defaults, and system notifications.</p>
                    </div>

                    <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-4 max-w-2xl">
                      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                        <div>
                          <div className="text-xs font-bold text-white">Maintenance Mode</div>
                          <div className="text-[11px] text-zinc-400">Lock non-admin generator access for scheduled maintenance.</div>
                        </div>
                        <button
                          onClick={() => setSystemSettings(s => ({ ...s, maintenanceMode: !s.maintenanceMode }))}
                          className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                            systemSettings.maintenanceMode ? 'bg-amber-600' : 'bg-zinc-800'
                          }`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                            systemSettings.maintenanceMode ? 'left-7' : 'left-1'
                          }`} />
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-white">Global Announcement Banner</label>
                        <input
                          type="text"
                          value={systemSettings.systemNotification}
                          onChange={e => setSystemSettings(s => ({ ...s, systemNotification: e.target.value }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-white">Default AI Engine Provider</label>
                        <select
                          value={systemSettings.defaultProvider}
                          onChange={e => setSystemSettings(s => ({ ...s, defaultProvider: e.target.value }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white"
                        >
                          <option value="Google Gemini 3.6 Flash">Google Gemini 3.6 Flash (Recommended)</option>
                          <option value="Grok Vision AI">Grok Vision AI</option>
                          <option value="Groq LLaMA 3.3">Groq LLaMA 3.3 Fast</option>
                        </select>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={handleSaveSettings}
                          className="px-4 py-2 bg-white text-black text-xs font-bold rounded hover:bg-zinc-200 transition-colors cursor-pointer"
                        >
                          Save Global Configuration
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* WhatsApp Support Tab (Section 19) */}
                {activeTab === 'support' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-bold text-white">Administrator WhatsApp Support Mapping</h3>
                      <p className="text-xs text-zinc-400">Direct instant messaging routing. Numbers are masked in UI per Section 19 security policy.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-3">
                        <div className="w-10 h-10 rounded bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                          <PhoneCall className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-bold text-white">Sales & Activation</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">Direct activation desk for manual subscriber onboarding & payment verification.</p>
                        <button
                          onClick={() => handleOpenWhatsApp('sales')}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                          <PhoneCall className="w-3.5 h-3.5" /> Open Sales WhatsApp Desk
                        </button>
                      </div>

                      <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-3">
                        <div className="w-10 h-10 rounded bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
                          <PhoneCall className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-bold text-white">Technical Support</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">Direct channel for engine issues, provider timeouts, or device reset help.</p>
                        <button
                          onClick={() => handleOpenWhatsApp('support')}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                          <PhoneCall className="w-3.5 h-3.5" /> Open Tech Support Desk
                        </button>
                      </div>

                      <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-3">
                        <div className="w-10 h-10 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
                          <PhoneCall className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-bold text-white">General Inquiry</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">System administrator inquiries, partnership questions, or custom requests.</p>
                        <button
                          onClick={() => handleOpenWhatsApp('general')}
                          className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs rounded transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                          <PhoneCall className="w-3.5 h-3.5" /> Open General Inquiry Desk
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* API Management Tab — Enterprise Key Pool + Model Management */}
                {activeTab === 'api-management' && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-1 p-1 bg-zinc-900/60 border border-zinc-800 rounded-lg w-fit">
                      <button
                        onClick={() => setApiSubTab('key-pool')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${apiSubTab === 'key-pool' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
                      >
                        <Key className="w-3.5 h-3.5 text-amber-400" /> Key Pool
                      </button>
                      <button
                        onClick={() => setApiSubTab('models')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${apiSubTab === 'models' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
                      >
                        <Cpu className="w-3.5 h-3.5 text-blue-400" /> Model Management
                      </button>
                    </div>
                    {apiSubTab === 'key-pool' && <ApiKeyPoolPanel authToken={localStorage.getItem('stockai_auth_token') || ''} />}
                    {apiSubTab === 'models' && <ModelManagementPanel authToken={localStorage.getItem('stockai_auth_token') || ''} />}
                  </div>
                )}


                {activeTab === 'plans' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-white">Plan Builder &amp; Manager</h3>
                        <p className="text-xs text-zinc-400">Create and manage subscription plans. All plans are stored live and can be assigned to users.</p>
                      </div>
                      <button
                        onClick={() => setIsNewPlanOpen(v => !v)}
                        className="px-3.5 py-2 bg-blue-700 hover:bg-blue-600 text-white font-semibold text-xs rounded shadow transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <Layers className="w-4 h-4" /> {isNewPlanOpen ? 'Cancel' : 'Create Plan'}
                      </button>
                    </div>

                    {isNewPlanOpen && (
                      <form onSubmit={handleCreatePlan} className="p-5 bg-zinc-900/60 border border-blue-800/40 rounded-lg space-y-3">
                        <h4 className="text-sm font-bold text-white">New Custom Plan</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-300">Plan Name</label>
                            <input required value={newPlanForm.name} onChange={e => setNewPlanForm({...newPlanForm, name: e.target.value})}
                              placeholder="e.g. 3 Month Plan" className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-xs text-white" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-300">Price (PKR)</label>
                            <input required type="number" min={0} value={newPlanForm.price} onChange={e => setNewPlanForm({...newPlanForm, price: Number(e.target.value)})}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-xs text-white" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-300">Duration (Days)</label>
                            <input required type="number" min={1} value={newPlanForm.durationDays} onChange={e => setNewPlanForm({...newPlanForm, durationDays: Number(e.target.value)})}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-xs text-white" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-300">Visibility</label>
                            <select value={newPlanForm.visibility} onChange={e => setNewPlanForm({...newPlanForm, visibility: e.target.value})}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-xs text-white">
                              <option value="public">Public</option>
                              <option value="private">Private</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-zinc-300">Features (comma-separated)</label>
                          <input value={newPlanForm.features} onChange={e => setNewPlanForm({...newPlanForm, features: e.target.value})}
                            placeholder="e.g. Unlimited Generations, AI Prompts, CSV Export" className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-xs text-white" />
                        </div>
                        <button type="submit" className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white font-semibold text-xs rounded transition-colors cursor-pointer">Create Plan</button>
                      </form>
                    )}

                    {/* Built-in Plans */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { id: 'plan_1m', name: '1 Month Plan', price: 300, currency: 'PKR', days: 30, badge: 'Standard', color: 'emerald', isBuiltIn: true },
                        { id: 'plan_6m', name: '6 Months Plan', price: 2000, currency: 'PKR', days: 180, badge: 'Popular', color: 'blue', isBuiltIn: true },
                      ].map(plan => (
                        <div key={plan.id} className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-white">{plan.name}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              plan.color === 'emerald' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-blue-950 text-blue-400 border-blue-800'
                            }`}>{plan.badge}</span>
                          </div>
                          <div className="space-y-1 text-[11px] text-zinc-400 font-mono">
                            <div>Price: {plan.currency} {plan.price}</div>
                            <div>Duration: {plan.days} days</div>
                          </div>
                          <div className="text-[10px] text-zinc-500 bg-zinc-950/60 border border-zinc-800/60 rounded px-2 py-1">🔒 Built-in plan</div>
                        </div>
                      ))}

                      {/* Dynamic plans from API */}
                      {dynamicPlans.filter(p => !['plan_1m', 'plan_6m'].includes(p.id)).map((plan: any) => (
                        <div key={plan.id} className="p-5 bg-zinc-900/60 border border-purple-800/40 rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-white">{plan.name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-purple-950 text-purple-400 border-purple-800">Custom</span>
                          </div>
                          <div className="space-y-1 text-[11px] text-zinc-400 font-mono">
                            <div>Price: {plan.currency || 'PKR'} {plan.price || 'Custom'}</div>
                            <div>Duration: {plan.durationDays} days</div>
                            <div>Status: <span className={plan.status === 'active' ? 'text-emerald-400' : 'text-red-400'}>{plan.status}</span></div>
                          </div>
                          {Array.isArray(plan.features) && plan.features.length > 0 && (
                            <div className="text-[10px] text-zinc-500">{plan.features.join(' • ')}</div>
                          )}
                          <button
                            onClick={async () => {
                              if (!window.confirm(`Delete plan "${plan.name}"?`)) return;
                              const token = localStorage.getItem('stockai_auth_token') || '';
                              await fetch(`/api/admin/plans/${plan.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                              fetchAdminData();
                            }}
                            className="w-full py-1.5 bg-red-950 hover:bg-red-900 text-red-400 border border-red-800 text-[11px] font-semibold rounded transition-colors cursor-pointer"
                          >
                            Delete Plan
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* System Health Tab - Live Data */}
                {activeTab === 'system-health' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-white">System Health Monitor</h3>
                        <p className="text-xs text-zinc-400">Live server and infrastructure status from the API.</p>
                      </div>
                      <button onClick={fetchSystemHealth} disabled={healthLoading}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50">
                        <RefreshCw className={`w-3.5 h-3.5 ${healthLoading ? 'animate-spin' : ''}`} /> {healthLoading ? 'Loading...' : 'Refresh'}
                      </button>
                    </div>

                    {!systemHealth ? (
                      <div className="text-center py-12 text-zinc-500 text-xs font-mono">
                        Click Refresh to load live system health data.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full animate-pulse ${systemHealth.server?.status === 'operational' ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                            <h4 className="text-sm font-bold text-white">Server</h4>
                          </div>
                          <div className="space-y-2 text-[11px] font-mono">
                            <div className="flex justify-between"><span className="text-zinc-500">Status</span><span className="text-emerald-400 capitalize">{systemHealth.server?.status || 'unknown'}</span></div>
                            <div className="flex justify-between"><span className="text-zinc-500">Uptime</span><span className="text-zinc-300">{Math.round((systemHealth.server?.uptime || 0) / 60)} min</span></div>
                            <div className="flex justify-between"><span className="text-zinc-500">Node.js</span><span className="text-zinc-300">{systemHealth.server?.nodeVersion || 'N/A'}</span></div>
                            <div className="flex justify-between"><span className="text-zinc-500">Heap Memory</span><span className="text-zinc-300">{systemHealth.server?.memoryUsageMB || 0} MB</span></div>
                          </div>
                        </div>

                        <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full animate-pulse ${systemHealth.database?.status === 'operational' ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                            <h4 className="text-sm font-bold text-white">Database</h4>
                          </div>
                          <div className="space-y-2 text-[11px] font-mono">
                            <div className="flex justify-between"><span className="text-zinc-500">Status</span><span className="text-emerald-400 capitalize">{systemHealth.database?.status || 'unknown'}</span></div>
                            <div className="flex justify-between"><span className="text-zinc-500">Type</span><span className="text-zinc-300">{systemHealth.database?.type || 'in-memory'}</span></div>
                            <div className="flex justify-between"><span className="text-zinc-500">User Records</span><span className="text-zinc-300">{systemHealth.database?.userCount || 0}</span></div>
                            <div className="flex justify-between"><span className="text-zinc-500">Audit Logs</span><span className="text-zinc-300">{auditLogs.length} entries</span></div>
                          </div>
                        </div>

                        {systemHealth.ai && Object.entries(systemHealth.ai).map(([provider, stats]: [string, any]) => (
                          <div key={provider} className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full animate-pulse ${stats.successRate >= 90 ? 'bg-blue-400' : 'bg-amber-400'}`}></div>
                              <h4 className="text-sm font-bold text-white capitalize">{provider}</h4>
                            </div>
                            <div className="space-y-2 text-[11px] font-mono">
                              <div className="flex justify-between"><span className="text-zinc-500">Requests</span><span className="text-zinc-300">{stats.totalRequests || 0}</span></div>
                              <div className="flex justify-between"><span className="text-zinc-500">Success Rate</span><span className="text-emerald-400">{stats.successRate || 100}%</span></div>
                              <div className="flex justify-between"><span className="text-zinc-500">Avg Latency</span><span className="text-zinc-300">{stats.latency || 0}ms</span></div>
                              <div className="flex justify-between"><span className="text-zinc-500">Failures</span><span className={stats.failureCount > 0 ? 'text-red-400' : 'text-zinc-500'}>{stats.failureCount || 0}</span></div>
                            </div>
                          </div>
                        ))}

                        <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
                            <h4 className="text-sm font-bold text-white">Generation Engine</h4>
                          </div>
                          <div className="space-y-2 text-[11px] font-mono">
                            <div className="flex justify-between"><span className="text-zinc-500">Total Metadata</span><span className="text-zinc-300">{metrics.totalMetadataGenerated}</span></div>
                            <div className="flex justify-between"><span className="text-zinc-500">Total Prompts</span><span className="text-zinc-300">{metrics.totalPromptGenerations}</span></div>
                            <div className="flex justify-between"><span className="text-zinc-500">CSV Exports</span><span className="text-zinc-300">{metrics.totalCsvExports}</span></div>
                            <div className="flex justify-between"><span className="text-zinc-500">Timestamp</span><span className="text-zinc-500">{new Date(systemHealth.timestamp).toLocaleTimeString()}</span></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Licenses Tab */}
                {activeTab === 'licenses' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-bold text-white">License Tracker</h3>
                      <p className="text-xs text-zinc-400">Track expiring and active user licenses. Licenses expiring in 7 days are highlighted.</p>
                    </div>
                    {licenses.length === 0 ? (
                      <div className="text-center py-12 text-zinc-500 text-xs font-mono border border-zinc-800 rounded-lg">
                        No license records available. License data populates as users are added.
                      </div>
                    ) : (
                      <div className="border border-zinc-800 rounded-lg overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-zinc-950 text-zinc-400 font-mono text-[10px] uppercase border-b border-zinc-800">
                            <tr>
                              <th className="p-3 text-left">User</th>
                              <th className="p-3 text-left">Plan</th>
                              <th className="p-3 text-left">Expires</th>
                              <th className="p-3 text-left">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/60">
                            {licenses.map((lic: any, i: number) => (
                              <tr key={i} className={`hover:bg-zinc-800/30 ${lic.daysRemaining <= 7 ? 'bg-amber-950/20' : ''}`}>
                                <td className="p-3 font-mono text-[11px] text-zinc-300">{lic.email || lic.userId}</td>
                                <td className="p-3 text-zinc-400">{lic.planName}</td>
                                <td className="p-3 font-mono text-[11px] text-zinc-400">{lic.expiresAt ? new Date(lic.expiresAt).toLocaleDateString() : '—'}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    lic.daysRemaining <= 0 ? 'bg-red-950 text-red-400 border-red-800' :
                                    lic.daysRemaining <= 7 ? 'bg-amber-950 text-amber-400 border-amber-800' :
                                    'bg-emerald-950 text-emerald-400 border-emerald-800'
                                  }`}>
                                    {lic.daysRemaining <= 0 ? 'Expired' : lic.daysRemaining <= 7 ? `Expires in ${lic.daysRemaining}d` : 'Active'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {/* Fallback: compute from users */}
                    {licenses.length === 0 && users.length > 0 && (
                      <div className="border border-zinc-800 rounded-lg overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-zinc-950 text-zinc-400 font-mono text-[10px] uppercase border-b border-zinc-800">
                            <tr>
                              <th className="p-3 text-left">User</th>
                              <th className="p-3 text-left">Plan</th>
                              <th className="p-3 text-left">Expires</th>
                              <th className="p-3 text-left">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/60">
                            {users.map(u => {
                              const daysLeft = Math.ceil((new Date(u.expiresAt).getTime() - Date.now()) / 86400000);
                              return (
                                <tr key={u.id} className={`hover:bg-zinc-800/30 ${daysLeft <= 7 && daysLeft > 0 ? 'bg-amber-950/20' : ''}`}>
                                  <td className="p-3"><div className="text-zinc-200 font-semibold">{u.fullName}</div><div className="text-zinc-500 font-mono text-[10px]">{u.email}</div></td>
                                  <td className="p-3 text-zinc-400">{u.planName}</td>
                                  <td className="p-3 font-mono text-[11px] text-zinc-400">{new Date(u.expiresAt).toLocaleDateString()}</td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                      daysLeft <= 0 ? 'bg-red-950 text-red-400 border-red-800' :
                                      daysLeft <= 7 ? 'bg-amber-950 text-amber-400 border-amber-800' :
                                      'bg-emerald-950 text-emerald-400 border-emerald-800'
                                    }`}>
                                      {daysLeft <= 0 ? 'Expired' : daysLeft <= 7 ? `${daysLeft}d left` : 'Active'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Plan History Tab */}
                {activeTab === 'plan-history' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-bold text-white">Plan History</h3>
                      <p className="text-xs text-zinc-400">Full history of plan activations, renewals, and expirations.</p>
                    </div>
                    {planHistory.length === 0 ? (
                      <div className="text-center py-12 text-zinc-500 text-xs font-mono border border-zinc-800 rounded-lg">
                        No plan history records found. History populates as plans are assigned.
                      </div>
                    ) : (
                      <div className="border border-zinc-800 rounded-lg overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-zinc-950 text-zinc-400 font-mono text-[10px] uppercase border-b border-zinc-800">
                            <tr>
                              <th className="p-3 text-left">User</th>
                              <th className="p-3 text-left">Plan</th>
                              <th className="p-3 text-left">Action</th>
                              <th className="p-3 text-left">Date</th>
                              <th className="p-3 text-left">Admin</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/60">
                            {planHistory.map((h: any, i: number) => (
                              <tr key={i} className="hover:bg-zinc-800/30">
                                <td className="p-3 font-mono text-[11px] text-zinc-300">{h.email || h.userId}</td>
                                <td className="p-3 text-zinc-400">{h.planName}</td>
                                <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-400 border border-blue-800">{h.action}</span></td>
                                <td className="p-3 font-mono text-[11px] text-zinc-500">{h.createdAt ? new Date(h.createdAt).toLocaleDateString() : '—'}</td>
                                <td className="p-3 font-mono text-[10px] text-zinc-600">{h.adminEmail || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

              </>
            )}
          </div>
        </div>
      </div>

      {/* Add Member Modal (Section 8) */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-zinc-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsAddMemberOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                Add / Update Contributor Member
              </h3>
              <p className="text-xs text-zinc-400">Existing emails will be updated; new emails will create a contributor account.</p>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Full Name</label>
                <input
                  type="text"
                  required
                  value={newMemberForm.fullName}
                  onChange={e => setNewMemberForm({ ...newMemberForm, fullName: e.target.value })}
                  placeholder="e.g. Fahad Hussain"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Email Address</label>
                <input
                  type="email"
                  required
                  value={newMemberForm.email}
                  onChange={e => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                  placeholder="e.g. contributor@example.com"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Plan</label>
                  <select
                    value={newMemberForm.planName}
                    onChange={e => {
                      const pName = e.target.value as any;
                      setNewMemberForm({
                        ...newMemberForm,
                        planName: pName,
                        durationDays: pName === '6 Months Plan' ? 180 : 30
                      });
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white"
                  >
                    <option value="1 Month Plan">1 Month Plan (300 PKR)</option>
                    <option value="6 Months Plan">6 Months Plan (2000 PKR)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Duration (Days)</label>
                  <input
                    type="number"
                    value={newMemberForm.durationDays}
                    onChange={e => setNewMemberForm({ ...newMemberForm, durationDays: Number(e.target.value) })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Activation Date</label>
                <input
                  type="date"
                  value={newMemberForm.activationDate}
                  onChange={e => setNewMemberForm({ ...newMemberForm, activationDate: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold cursor-pointer"
                >
                  Save Contributor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-zinc-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Edit User Profile: {editingUser.email}</h3>
              <p className="text-xs text-zinc-400">Update account details, status, extension days, or reset session locks.</p>
            </div>

            <form onSubmit={handleEditUserSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Full Name</label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Status</label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="expired">Expired</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Extend Plan (+Days)</label>
                  <input
                    type="number"
                    value={editForm.extendDays}
                    onChange={e => setEditForm({ ...editForm, extendDays: Number(e.target.value) })}
                    placeholder="e.g. 7, 30"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="resetDeviceCheck"
                  checked={editForm.resetDevice}
                  onChange={e => setEditForm({ ...editForm, resetDevice: e.target.checked })}
                  className="rounded border-zinc-800 text-emerald-500 focus:ring-0"
                />
                <label htmlFor="resetDeviceCheck" className="text-xs text-zinc-300 font-medium">
                  Reset Active Single-Device Session Token
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-white text-black hover:bg-zinc-200 rounded text-xs font-bold cursor-pointer"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
