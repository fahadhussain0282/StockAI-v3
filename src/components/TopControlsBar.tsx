import React from 'react';
import { Key, Sparkles, SlidersHorizontal, FileText } from 'lucide-react';

interface TopControlsBarProps {
  currentProvider: string;
  currentModel: string;
  onOpenApiKeys: () => void;
  activeSubTab: 'metadata' | 'prompt';
  setActiveSubTab: (tab: 'metadata' | 'prompt') => void;
}

export const TopControlsBar: React.FC<TopControlsBarProps> = ({
  currentProvider,
  currentModel,
  onOpenApiKeys,
  activeSubTab,
  setActiveSubTab
}) => {
  return (
    <div className="h-14 bg-[#09090b] border-b border-zinc-800 px-6 flex items-center justify-between font-sans shrink-0">
      {/* Controls Info & Provider Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-zinc-400">
          <SlidersHorizontal className="w-4 h-4 text-zinc-400" />
          <span className="text-xs text-zinc-500 font-medium hidden sm:inline">Controls</span>
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1">
            <span className="text-[11px] text-zinc-500 mr-2">Provider:</span>
            <span className="text-[11px] font-semibold text-zinc-200 flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {currentProvider} ({currentModel})
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenApiKeys}
          className="flex items-center gap-1.5 text-xs font-semibold bg-white text-black px-3.5 py-1.5 rounded hover:bg-zinc-200 transition-colors cursor-pointer shadow-sm"
        >
          <Key className="w-3.5 h-3.5 text-black" />
          <span>API Keys</span>
        </button>
      </div>

      {/* Tabs: Metadata | Prompt */}
      <div className="flex bg-zinc-900 rounded-md p-0.5 border border-zinc-800">
        <button
          type="button"
          onClick={() => setActiveSubTab('metadata')}
          className={`flex items-center gap-2 px-4 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
            activeSubTab === 'metadata'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Metadata
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('prompt')}
          className={`flex items-center gap-2 px-4 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
            activeSubTab === 'prompt'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Prompt
        </button>
      </div>
    </div>
  );
};
