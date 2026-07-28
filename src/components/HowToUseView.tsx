import React from 'react';
import { HelpCircle, CheckCircle2, ArrowRight, Wand2, Shield, Upload, FileSpreadsheet } from 'lucide-react';

export const HowToUseView: React.FC = () => {
  return (
    <div className="bg-[#0c0c0e] border border-zinc-800 rounded-lg p-6 space-y-6 font-sans">
      <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
        <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
          <HelpCircle className="w-5 h-5 text-zinc-300" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white">StockAI Contributor Workflow Guide</h2>
          <p className="text-xs text-zinc-400">
            How to generate zero-cleanup, agency-compliant metadata for maximum microstock sales.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 space-y-2">
          <div className="w-8 h-8 rounded bg-zinc-800 border border-zinc-700 text-white flex items-center justify-center font-mono font-bold text-sm">
            1
          </div>
          <h3 className="font-semibold text-white flex items-center gap-1.5">
            <Upload className="w-4 h-4 text-zinc-300" /> Upload Files
          </h3>
          <p className="text-zinc-400 text-[11px]">
            Drag & drop up to 100 JPG, PNG, SVG, EPS, or MP4 files. StockAI supports high-res images, vectors, and video clips.
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 space-y-2">
          <div className="w-8 h-8 rounded bg-zinc-800 border border-zinc-700 text-white flex items-center justify-center font-mono font-bold text-sm">
            2
          </div>
          <h3 className="font-semibold text-white flex items-center gap-1.5">
            <Wand2 className="w-4 h-4 text-zinc-300" /> Select Target Platform
          </h3>
          <p className="text-zinc-400 text-[11px]">
            Choose your export agency (Adobe Stock, Shutterstock, Freepik, Vecteezy, Pond5). StockAI automatically tunes keyword limits and title constraints.
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 space-y-2">
          <div className="w-8 h-8 rounded bg-zinc-800 border border-zinc-700 text-white flex items-center justify-center font-mono font-bold text-sm">
            3
          </div>
          <h3 className="font-semibold text-white flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-zinc-300" /> Audit SEO Health
          </h3>
          <p className="text-zinc-400 text-[11px]">
            Review SEO, Commercial Value, and Compliance scores. Check feedback notes for missing industry or commercial tags before submitting.
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 space-y-2">
          <div className="w-8 h-8 rounded bg-zinc-800 border border-zinc-700 text-white flex items-center justify-center font-mono font-bold text-sm">
            4
          </div>
          <h3 className="font-semibold text-white flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-zinc-300" /> Export CSV
          </h3>
          <p className="text-zinc-400 text-[11px]">
            Click "Export CSV". Download ready-to-upload CSV files formatted specifically with agency header column requirements.
          </p>
        </div>
      </div>
    </div>
  );
};
