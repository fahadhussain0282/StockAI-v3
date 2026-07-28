import React, { useState } from 'react';
import { 
  Grid2X2, 
  RefreshCw, 
  Scissors, 
  Layers, 
  CheckCircle2, 
  FolderTree, 
  FileSpreadsheet, 
  Copy, 
  Check, 
  ArrowRight 
} from 'lucide-react';

export const AllToolsView: React.FC = () => {
  const [activeTool, setActiveTool] = useState<'cleaner' | 'rewriter' | 'compliance'>('cleaner');

  // Tool 1: Keyword Deduplicator & Cleaner
  const [dirtyKeywords, setDirtyKeywords] = useState('business, corporate, business, modern, 4k, hd, best, BEST, office, meeting, business');
  const [cleanedKeywords, setCleanedKeywords] = useState('');

  // Tool 2: Batch Title Rewriter
  const [rawTitle, setRawTitle] = useState('a business guy working on computer in office');
  const [rewrittenTitle, setRewrittenTitle] = useState('');

  const [copied, setCopied] = useState(false);

  const handleCleanKeywords = () => {
    const list: string[] = dirtyKeywords.split(/[,;\n]+/).map(k => k.trim().toLowerCase()).filter(Boolean);
    const spam: string[] = ['4k', 'hd', 'best', 'top', 'cheap', 'download'];
    const unique: string[] = Array.from(new Set<string>(list)).filter((k: string) => !spam.includes(k));
    setCleanedKeywords(unique.join(', '));
  };

  const handleRewriteTitle = () => {
    if (!rawTitle) return;
    const words = rawTitle.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    setRewrittenTitle(words.join(' '));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
            <Grid2X2 className="w-5 h-5 text-zinc-300" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Stock Contributor Utility Suite</h2>
            <p className="text-xs text-zinc-400">
              Dedicated tools to clean, transform, and optimize stock metadata batches.
            </p>
          </div>
        </div>

        {/* Tool Selector Tabs */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800">
          <button
            onClick={() => setActiveTool('cleaner')}
            className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-semibold transition-colors cursor-pointer ${
              activeTool === 'cleaner'
                ? 'bg-white text-black shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            Keyword Deduplicator & Cleaner
          </button>

          <button
            onClick={() => setActiveTool('rewriter')}
            className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-semibold transition-colors cursor-pointer ${
              activeTool === 'rewriter'
                ? 'bg-white text-black shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Title Commercial Rewriter
          </button>

          <button
            onClick={() => setActiveTool('compliance')}
            className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-semibold transition-colors cursor-pointer ${
              activeTool === 'compliance'
                ? 'bg-white text-black shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Marketplace Rules Checker
          </button>
        </div>
      </div>

      {/* Active Tool View */}
      {activeTool === 'cleaner' && (
        <div className="bg-[#0c0c0e] border border-zinc-800 rounded-lg p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Scissors className="w-4 h-4 text-zinc-400" />
            Keyword Cleaner & Anti-Spam Filter
          </h3>
          <p className="text-xs text-zinc-400">
            Removes duplicates, trims whitespace, standardizes case, and strips promotional words like "4k", "hd", "best".
          </p>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-300">Paste Comma-Separated Keywords</label>
            <textarea
              rows={3}
              value={dirtyKeywords}
              onChange={e => setDirtyKeywords(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-white focus:outline-none focus:border-zinc-600"
            />
          </div>

          <button
            onClick={handleCleanKeywords}
            className="px-5 py-2 bg-white text-black text-xs font-semibold rounded hover:bg-zinc-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            Clean & Deduplicate Keywords
          </button>

          {cleanedKeywords && (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-200">
                <span>Cleaned Output ({cleanedKeywords.split(',').length} unique keywords)</span>
                <button
                  onClick={() => handleCopy(cleanedKeywords)}
                  className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-zinc-200 font-mono bg-zinc-950 p-2.5 rounded border border-zinc-800 select-all">
                {cleanedKeywords}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTool === 'rewriter' && (
        <div className="bg-[#0c0c0e] border border-zinc-800 rounded-lg p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-zinc-400" />
            Title Commercial Rewriter
          </h3>
          <p className="text-xs text-zinc-400">
            Transforms basic filenames or informal descriptions into agency-grade titles.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-300">Raw Title or Description</label>
            <input
              type="text"
              value={rawTitle}
              onChange={e => setRawTitle(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-600"
            />
          </div>

          <button
            onClick={handleRewriteTitle}
            className="px-5 py-2 bg-white text-black text-xs font-semibold rounded hover:bg-zinc-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            Rewrite Commercial Title
          </button>

          {rewrittenTitle && (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-200">
                <span>Commercial Title Result ({rewrittenTitle.length} chars)</span>
                <button
                  onClick={() => handleCopy(rewrittenTitle)}
                  className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-zinc-200 font-medium bg-zinc-950 p-2.5 rounded border border-zinc-800 select-all">
                {rewrittenTitle}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTool === 'compliance' && (
        <div className="bg-[#0c0c0e] border border-zinc-800 rounded-lg p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-zinc-400" />
            Marketplace Rules Compliance Standards
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-zinc-900/60 border border-zinc-800 p-3.5 rounded-lg space-y-1.5">
              <div className="font-semibold text-white">Adobe Stock</div>
              <p className="text-zinc-400 text-[11px]">
                Requires first 10 keywords ordered strictly by relevance. Max 50 keywords.
              </p>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 p-3.5 rounded-lg space-y-1.5">
              <div className="font-semibold text-white">Shutterstock</div>
              <p className="text-zinc-400 text-[11px]">
                Description is the primary search title. Minimum 7 keywords, max 50 keywords.
              </p>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 p-3.5 rounded-lg space-y-1.5">
              <div className="font-semibold text-white">Freepik</div>
              <p className="text-zinc-400 text-[11px]">
                Requires concise commercial titles between 10 and 100 characters.
              </p>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 p-3.5 rounded-lg space-y-1.5">
              <div className="font-semibold text-white">Vecteezy</div>
              <p className="text-zinc-400 text-[11px]">
                Explicit vector tags required (EPS10, vector background, isolated).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
