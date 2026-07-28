import React from 'react';
import { X, ZoomIn, Download } from 'lucide-react';

interface ZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
}

export const ZoomModal: React.FC<ZoomModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 font-sans">
      <div className="relative max-w-4xl max-h-[90vh] w-full bg-[#0c0c0e] border border-zinc-800 rounded-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-white truncate max-w-md">{title}</span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Image Display */}
        <div className="p-6 flex-1 flex items-center justify-center overflow-auto bg-zinc-950">
          <img src={imageUrl} alt={title} className="max-w-full max-h-[75vh] object-contain rounded border border-zinc-800" />
        </div>
      </div>
    </div>
  );
};
