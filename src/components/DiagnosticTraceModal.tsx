import React from 'react';
import { X, Server, Key, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DiagnosticTraceEntry {
  provider: string;
  model: string;
  keyType: string;
  keyLabel: string;
  status: string;
  message: string;
  latencyMs: number;
}

interface DiagnosticTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  trace: DiagnosticTraceEntry[];
  fileName?: string;
}

export const DiagnosticTraceModal: React.FC<DiagnosticTraceModalProps> = ({ isOpen, onClose, trace, fileName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-lg w-full max-w-3xl flex flex-col max-h-[85vh] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-red-400" /> AI Gateway Diagnostics
            </h2>
            <p className="text-xs text-zinc-400">
              Detailed fallback trace for {fileName ? <span className="text-zinc-200 font-mono">"{fileName}"</span> : 'this file'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-3 text-xs text-red-300">
            <strong>Gateway Exhausted:</strong> All configured AI providers and keys failed to generate a response. Review the fallback trace below to diagnose the issue.
          </div>

          <div className="space-y-3">
            {trace.map((entry, index) => (
              <div key={index} className="bg-zinc-900 border border-zinc-800 rounded p-3 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${entry.status === 'SUCCESS' ? 'bg-green-500' : 'bg-red-500'}`} />
                
                <div className="flex items-center justify-between mb-2 pl-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white capitalize">{entry.provider}</span>
                    <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono border border-zinc-700">
                      {entry.model}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span className={entry.latencyMs > 5000 ? 'text-yellow-400' : 'text-zinc-400'}>
                      {entry.latencyMs}ms
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                  <div className="space-y-1">
                    <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Key Attempted</div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                      <Key className="w-3 h-3 text-zinc-400" />
                      <span className="font-mono">{entry.keyLabel}</span>
                      <span className="text-[9px] bg-zinc-800 px-1 py-0.5 rounded uppercase">{entry.keyType}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Status</div>
                    <div className="flex items-start gap-1.5 text-xs">
                      {entry.status === 'SUCCESS' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      )}
                      <span className={entry.status === 'SUCCESS' ? 'text-green-300' : 'text-red-300'}>
                        {entry.message}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
