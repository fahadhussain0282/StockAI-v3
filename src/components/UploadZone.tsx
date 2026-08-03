import React, { useRef, memo } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Video, 
  FileCode2, 
  File, 
  Trash2, 
  Wand2, 
  Download, 
  AlertCircle, 
  RefreshCw,
  X
} from 'lucide-react';
import { UploadedFile } from '../types';

interface UploadZoneProps {
  files: UploadedFile[];
  onUpload: (files: FileList) => void;
  onRemoveFile: (id: string) => void;
  onClearAll: () => void;
  onGenerateAll: () => void;
  onExportCSV: () => void;
  isGenerating: boolean;
  onOpenPricing: () => void;
  onOpenApiKeys: () => void;
  hasCreditsOrKey: boolean;
  onViewTrace?: (trace: any[]) => void;
}

interface QueueCardProps {
  f: UploadedFile;
  onRemove: (id: string) => void;
  onViewTrace?: (trace: any[]) => void;
}

const QueueCard: React.FC<QueueCardProps> = React.memo(({ f, onRemove, onViewTrace }) => (
  <div
    key={f.id}
    className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-2 relative group flex flex-col gap-1.5 transition-opacity"
  >
    <button
      onClick={() => onRemove(f.id)}
      className="absolute top-1 right-1 w-5 h-5 rounded bg-zinc-950 text-zinc-400 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
    >
      <X className="w-3 h-3" />
    </button>

    <div className="w-full h-20 bg-zinc-950 rounded overflow-hidden flex items-center justify-center relative border border-zinc-800">
      {f.fileType === 'image' || f.fileType === 'svg' ? (
        <img src={f.previewUrl} alt={f.name} loading="lazy" className="w-full h-full object-cover" />
      ) : f.fileType === 'video' ? (
        <div className="flex flex-col items-center justify-center text-zinc-300 gap-1">
          <Video className="w-6 h-6 text-zinc-400" />
          <span className="text-[9px] uppercase font-bold text-zinc-500">Video</span>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-zinc-300 gap-1">
          <FileCode2 className="w-6 h-6 text-zinc-400" />
          <span className="text-[9px] uppercase font-bold text-zinc-500">Vector</span>
        </div>
      )}
      {f.status === 'analyzing' || f.status === 'generating' ? (
        <div className="absolute inset-0 bg-zinc-950/80 flex items-center justify-center text-[10px] text-zinc-300 font-semibold p-1 text-center">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
        </div>
      ) : f.status === 'completed' ? (
        <div className="absolute top-1 left-1 bg-white text-black text-[8px] font-extrabold px-1.5 py-0.5 rounded shadow-sm">
          READY
        </div>
      ) : f.status === 'error' ? (
        <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center text-[10px] text-red-200 font-semibold p-1.5 text-center z-20">
          <AlertCircle className="w-3.5 h-3.5 mb-1 shrink-0" />
          <span className="leading-tight line-clamp-1" title={f.error}>{f.error || 'Failed'}</span>
          {f.trace && f.trace.length > 0 && onViewTrace && (
            <button 
              onClick={() => onViewTrace(f.trace!)}
              className="mt-1 text-[8px] bg-red-900/50 hover:bg-red-800 border border-red-700/50 text-red-100 px-1 py-0.5 rounded transition-colors"
            >
              View Trace
            </button>
          )}
        </div>
      ) : null}
    </div>

    <div className="truncate text-[10px] font-medium text-zinc-300">
      {f.name}
    </div>
  </div>
));

QueueCard.displayName = 'QueueCard';

export const UploadZone: React.FC<UploadZoneProps> = ({
  files,
  onUpload,
  onRemoveFile,
  onClearAll,
  onGenerateAll,
  onExportCSV,
  isGenerating,
  onOpenPricing,
  onOpenApiKeys,
  hasCreditsOrKey,
  onViewTrace
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Top Subscription Banner hidden per Master Prompt Section 2 & 3 */}
      {false && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
          {/* Subscription Banner Hidden */}
        </div>
      )}

      {/* Upload Zone Card */}
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2 text-zinc-200 text-xs font-semibold">
          <Upload className="w-4 h-4 text-zinc-400" />
          <span className="uppercase tracking-wider text-[11px] font-bold text-zinc-400">Upload Files</span>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border border-dashed border-zinc-800 hover:border-zinc-600 bg-zinc-900/30 rounded-lg p-8 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer group"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={e => e.target.files && onUpload(e.target.files)}
            multiple
            accept="image/*,video/*,.svg,.eps"
            className="hidden"
          />

          <div className="w-12 h-12 rounded-lg bg-zinc-800/80 flex items-center justify-center text-zinc-300 group-hover:text-white group-hover:bg-zinc-800 border border-zinc-700 transition-all">
            <Upload className="w-6 h-6" />
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-zinc-900 text-zinc-300 text-[10px] font-mono px-2.5 py-1 rounded border border-zinc-800">
              <ImageIcon className="w-3 h-3 text-zinc-400" /> Images
            </span>
            <span className="inline-flex items-center gap-1 bg-zinc-900 text-zinc-300 text-[10px] font-mono px-2.5 py-1 rounded border border-zinc-800">
              <Video className="w-3 h-3 text-zinc-400" /> Videos
            </span>
            <span className="inline-flex items-center gap-1 bg-zinc-900 text-zinc-300 text-[10px] font-mono px-2.5 py-1 rounded border border-zinc-800">
              <FileCode2 className="w-3 h-3 text-zinc-400" /> SVG
            </span>
            <span className="inline-flex items-center gap-1 bg-zinc-900 text-zinc-300 text-[10px] font-mono px-2.5 py-1 rounded border border-zinc-800">
              <File className="w-3 h-3 text-zinc-400" /> EPS
            </span>
          </div>

          <div className="text-center space-y-1">
            <p className="text-xs text-zinc-300">
              Drag & drop files here, or <span className="text-white font-semibold underline">browse</span>
            </p>
            <p className="text-[10px] text-zinc-500">
              Supports image, video, SVG & EPS · High Capacity Batch Support
            </p>
          </div>
        </div>

        {/* Uploaded Files Queue */}
        {files.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center justify-between">
              <span>Uploaded Queue ({files.length} items)</span>
              <button
                onClick={onClearAll}
                className="text-zinc-400 hover:text-white text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" /> Clear Queue
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-56 overflow-y-auto p-1 scrollbar-thin">
              {files.map(f => (
                <QueueCard key={f.id} f={f} onRemove={onRemoveFile} onViewTrace={onViewTrace} />
              ))}
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          <span className="text-[11px] text-zinc-500">
            {files.length === 0
              ? 'Ready for StockAI metadata processing.'
              : `${files.length} file(s) in queue ready for metadata generation.`}
          </span>

          <div className="flex items-center gap-2">
            {files.length > 0 && (
              <button
                onClick={onClearAll}
                disabled={isGenerating}
                className="px-3.5 py-2 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All
              </button>
            )}

            <button
              onClick={onGenerateAll}
              disabled={files.length === 0 || isGenerating}
              className="px-5 py-2 rounded bg-white text-black hover:bg-zinc-200 text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 text-black" />
                  Generate All
                </>
              )}
            </button>

            <button
              onClick={onExportCSV}
              disabled={files.filter(f => f.metadata).length === 0}
              className="px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5 text-zinc-300" />
              Export CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

