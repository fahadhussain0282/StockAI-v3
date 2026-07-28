import React, { useState, memo, useCallback } from 'react';
import { 
  Image as ImageIcon, 
  Copy, 
  Check, 
  Plus, 
  X, 
  Tag, 
  Type, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles, 
  Maximize2,
  AlertTriangle
} from 'lucide-react';
import { UploadedFile, MarketplaceId } from '../types';
import { MARKETPLACE_REGISTRY } from '../registries/marketplaces';

interface ResultsWorkspaceProps {
  files: UploadedFile[];
  onUpdateTitle: (fileId: string, newTitle: string) => void;
  onUpdateDescription: (fileId: string, newDesc: string) => void;
  onAddKeyword: (fileId: string, keyword: string) => void;
  onRemoveKeyword: (fileId: string, keyword: string) => void;
  onUpdateCategory: (fileId: string, primary: string, secondary: string) => void;
  targetMarketplace: MarketplaceId;
  onOpenZoom: (url: string, name: string) => void;
}

const KeywordChip = memo(({ kw, fileId, onRemoveKeyword }: { kw: string; fileId: string; onRemoveKeyword: (fileId: string, kw: string) => void }) => (
  <span className="inline-flex items-center gap-1 bg-zinc-800 text-zinc-200 text-[11px] font-mono px-2 py-1 rounded border border-zinc-700 transition-colors group">
    <span>{kw}</span>
    <button
      onClick={() => onRemoveKeyword(fileId, kw)}
      className="text-zinc-500 hover:text-white transition-colors ml-0.5 cursor-pointer"
    >
      <X className="w-3 h-3" />
    </button>
  </span>
));

KeywordChip.displayName = 'KeywordChip';

export const ResultsWorkspace: React.FC<ResultsWorkspaceProps> = ({
  files,
  onUpdateTitle,
  onUpdateDescription,
  onAddKeyword,
  onRemoveKeyword,
  onUpdateCategory,
  targetMarketplace,
  onOpenZoom
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState<Record<string, string>>({});
  const [keywordFilter, setKeywordFilter] = useState<Record<string, string>>({});

  const rule = MARKETPLACE_REGISTRY[targetMarketplace] || MARKETPLACE_REGISTRY.general;

  const handleCopyText = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleAddTagSubmit = (fileId: string) => {
    const val = newTagInput[fileId]?.trim();
    if (val) {
      onAddKeyword(fileId, val);
      setNewTagInput({ ...newTagInput, [fileId]: '' });
    }
  };

  const filesWithMetadata = files.filter(f => f.metadata);

  if (filesWithMetadata.length === 0) {
    return (
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-lg p-16 flex flex-col items-center justify-center text-center gap-3 font-sans">
        <div className="w-16 h-16 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 shadow-sm">
          <ImageIcon className="w-8 h-8 text-zinc-400" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="text-sm font-semibold text-zinc-200">Your generated results will appear here.</h3>
          <p className="text-xs text-zinc-500">
            Upload some files and click <span className="font-semibold text-white">"Generate All"</span> to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-zinc-400" />
          Generated Metadata Workspace ({filesWithMetadata.length} items)
        </span>
        <span className="text-zinc-500 font-normal text-[11px] bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800">
          Optimized for <strong className="text-zinc-200 font-semibold">{rule.name}</strong>
        </span>
      </div>

      <div className="space-y-6">
        {filesWithMetadata.map(f => {
          const meta = f.metadata!;
          const scores = meta.scores;
          const currentFilter = keywordFilter[f.id] || 'all';

          const filteredKeywords = meta.keywords.filter(kw => {
            if (currentFilter === 'all') return true;
            const bucket = meta.keywordBuckets?.find(b => b.tag.toLowerCase() === kw.toLowerCase());
            return bucket?.category === currentFilter;
          });

          return (
            <div
              key={f.id}
              className="bg-[#0c0c0e] border border-zinc-800 hover:border-zinc-700 rounded-lg p-5 space-y-5 transition-colors shadow-sm"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-white truncate max-w-xs">{f.name}</span>
                  <span className="text-[10px] uppercase font-mono font-bold text-zinc-300 bg-white/10 px-2 py-0.5 rounded border border-white/10">
                    {f.fileType}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 justify-end">
                  {meta.aiStatus && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded text-green-400 border border-green-900 bg-green-950">
                      {meta.aiStatus}
                    </span>
                  )}
                  {meta.provider && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono uppercase">
                      {meta.provider}
                    </span>
                  )}
                  {meta.model && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">
                      {meta.model}
                    </span>
                  )}
                  {meta.latency && (
                    <span className="text-[10px] text-zinc-500 font-mono" title="Latency">
                      {meta.latency}ms
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-500 font-mono" title="Request ID">
                    {meta.id}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono" title="Generation Time">
                    {new Date(meta.generatedAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Grid: Preview | Metadata Controls | Quality Dashboard */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Thumbnail Preview */}
                <div className="lg:col-span-3 space-y-2">
                  <div className="w-full h-48 bg-zinc-950 rounded overflow-hidden border border-zinc-800 relative group flex items-center justify-center">
                    <img
                      src={f.previewUrl}
                      alt={f.name}
                      loading="lazy"
                      className="w-full h-full object-contain"
                    />
                    <button
                      onClick={() => onOpenZoom(f.previewUrl, f.name)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold gap-1.5 transition-opacity cursor-pointer"
                    >
                      <Maximize2 className="w-4 h-4 text-white" /> Zoom Preview
                    </button>
                  </div>

                  <div className="bg-zinc-900/50 border border-zinc-800 rounded p-2.5 space-y-1.5 text-[11px] text-zinc-300">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">File Type:</span>
                      <span className="font-semibold uppercase text-zinc-200 font-mono">{f.fileType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Primary Subject:</span>
                      <span className="font-semibold text-zinc-200 truncate max-w-[120px]">
                        {meta.visionAnalysis?.primarySubject || 'Commercial Subject'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Middle: Title, Description, Keyword Manager, Categories */}
                <div className="lg:col-span-6 space-y-4">
                  {/* Title */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-zinc-200 flex items-center gap-1.5">
                        <Type className="w-3.5 h-3.5 text-zinc-400" /> Title
                      </label>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono ${meta.title.length > rule.titleMaxLength ? 'text-red-400 font-bold' : 'text-zinc-500'}`}>
                          {meta.title.length}/{rule.titleMaxLength} chars
                        </span>
                        <button
                          onClick={() => handleCopyText(meta.title, `title_${f.id}`)}
                          className="text-[10px] text-zinc-400 hover:text-white font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === `title_${f.id}` ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                          {copiedId === `title_${f.id}` ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={meta.title}
                      onChange={e => onUpdateTitle(f.id, e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded px-3 py-2 text-xs text-white font-medium focus:outline-none"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-zinc-200">Description</label>
                      <button
                        onClick={() => handleCopyText(meta.description, `desc_${f.id}`)}
                        className="text-[10px] text-zinc-400 hover:text-white font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === `desc_${f.id}` ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                        {copiedId === `desc_${f.id}` ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={meta.description}
                      onChange={e => onUpdateDescription(f.id, e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded p-2.5 text-xs text-zinc-300 focus:outline-none resize-none"
                    />
                  </div>

                  {/* Keyword Manager */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-zinc-200 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-zinc-400" /> Keywords ({meta.keywords.length}/{rule.keywordMaxCount})
                      </label>
                      <button
                        onClick={() => handleCopyText(meta.keywords.join(', '), `kw_${f.id}`)}
                        className="text-[10px] text-zinc-400 hover:text-white font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === `kw_${f.id}` ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                        {copiedId === `kw_${f.id}` ? 'Copied All' : 'Copy Keywords'}
                      </button>
                    </div>

                    {/* Filter Category Buckets */}
                    <div className="flex flex-wrap gap-1 text-[10px]">
                      {['all', 'subject', 'commercial', 'style', 'color', 'action'].map(cat => (
                        <button
                          key={cat}
                          onClick={() => setKeywordFilter({ ...keywordFilter, [f.id]: cat })}
                          className={`px-2 py-0.5 rounded capitalize font-medium transition-colors cursor-pointer ${
                            currentFilter === cat
                              ? 'bg-white text-black font-bold'
                              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Keywords List */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded p-3 flex flex-wrap gap-1.5 max-h-40 overflow-y-auto scrollbar-thin">
                      {filteredKeywords.map((kw, idx) => (
                        <KeywordChip key={idx} kw={kw} fileId={f.id} onRemoveKeyword={onRemoveKeyword} />
                      ))}
                    </div>

                    {/* Add Keyword Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add new keyword..."
                        value={newTagInput[f.id] || ''}
                        onChange={e => setNewTagInput({ ...newTagInput, [f.id]: e.target.value })}
                        onKeyDown={e => e.key === 'Enter' && handleAddTagSubmit(f.id)}
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-zinc-600"
                      />
                      <button
                        onClick={() => handleAddTagSubmit(f.id)}
                        className="px-3 py-1 bg-white text-black hover:bg-zinc-200 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-black" /> Add
                      </button>
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Primary Category</label>
                      <select
                        value={meta.primaryCategory}
                        onChange={e => onUpdateCategory(f.id, e.target.value, meta.secondaryCategory)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-600 cursor-pointer"
                      >
                        {rule.categories.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Secondary Category</label>
                      <select
                        value={meta.secondaryCategory}
                        onChange={e => onUpdateCategory(f.id, meta.primaryCategory, e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-600 cursor-pointer"
                      >
                        {rule.categories.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Right: SEO & Quality Health Dashboard */}
                <div className="lg:col-span-3 space-y-3 bg-zinc-900/60 border border-zinc-800 rounded-lg p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-zinc-300" />
                      SEO Health
                    </span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-white border border-zinc-700">
                      {scores.confidenceScore}/100
                    </span>
                  </div>

                  {/* Progress Metrics */}
                  <div className="space-y-2 text-[11px]">
                    <div>
                      <div className="flex justify-between text-zinc-400 mb-0.5">
                        <span>SEO Quality</span>
                        <span className="font-semibold text-zinc-200 font-mono">{scores.seoScore}%</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                        <div className="bg-white h-full rounded-full" style={{ width: `${scores.seoScore}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-zinc-400 mb-0.5">
                        <span>Commercial Intent</span>
                        <span className="font-semibold text-zinc-200 font-mono">{scores.commercialScore}%</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                        <div className="bg-white/80 h-full rounded-full" style={{ width: `${scores.commercialScore}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-zinc-400 mb-0.5">
                        <span>Agency Compliance</span>
                        <span className="font-semibold text-zinc-200 font-mono">{scores.complianceScore}%</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                        <div className="bg-white/60 h-full rounded-full" style={{ width: `${scores.complianceScore}%` }} />
                      </div>
                    </div>
                  </div>

                  <hr className="border-zinc-800" />

                  {/* Feedback Notes */}
                  <div className="space-y-1.5 text-[10px]">
                    <div className="font-semibold text-zinc-300 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-zinc-400" />
                      Audit Notes
                    </div>
                    <ul className="space-y-1 text-zinc-400 list-disc list-inside">
                      {scores.explanations.seo.slice(0, 2).map((note, i) => (
                        <li key={i} className="truncate">{note}</li>
                      ))}
                    </ul>
                  </div>

                  {scores.explanations.suggestions.length > 0 && (
                    <div className="bg-zinc-800/80 border border-zinc-700 rounded p-2 text-[10px] text-zinc-300 space-y-1">
                      <div className="font-bold flex items-center gap-1 text-white">
                        <AlertTriangle className="w-3 h-3 shrink-0 text-amber-400" /> Suggestion
                      </div>
                      <p>{scores.explanations.suggestions[0]}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

