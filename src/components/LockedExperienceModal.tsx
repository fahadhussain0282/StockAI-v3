import React from 'react';
import { Lock, Sparkles, LogOut, MessageCircle, CreditCard } from 'lucide-react';

interface LockedExperienceModalProps {
  isOpen: boolean;
  userEmail: string;
  onOpenPlans: () => void;
  onLogout: () => void;
}

export const LockedExperienceModal: React.FC<LockedExperienceModalProps> = ({
  isOpen,
  userEmail,
  onOpenPlans,
  onLogout
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 font-sans text-zinc-200">
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-lg max-w-lg w-full p-6 space-y-6 shadow-2xl text-center relative">
        {/* Lock Graphic */}
        <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-white shadow-inner">
          <Lock className="w-7 h-7 text-zinc-300" />
        </div>

        {/* Message Content */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2.5 py-0.5 rounded">
            <Sparkles className="w-3 h-3 text-amber-400" /> Subscription Required
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Unlock StockAI Workspace</h2>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-md mx-auto">
            Your account <span className="text-white font-semibold">{userEmail}</span> has been created successfully. Your subscription has not yet been activated. Choose a plan or contact support to activate your StockAI Title Intelligence & Vision Generator access.
          </p>
        </div>

        {/* Features Preview List */}
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-lg p-3 text-left space-y-2 text-xs">
          <div className="text-[10px] font-mono uppercase font-bold text-zinc-500 tracking-wider">Locked Features</div>
          <div className="grid grid-cols-2 gap-2 text-zinc-300 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>StockAI Title Intelligence</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Metadata Generator</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Prompt Generator</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>12+ Marketplace CSV Export</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-1">
          <button
            onClick={onOpenPlans}
            className="w-full py-2.5 bg-white text-black hover:bg-zinc-200 font-semibold text-xs rounded transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
          >
            <CreditCard className="w-4 h-4" />
            <span>Select & Activate Plan</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <a
              href={`https://wa.me/923413516882?text=${encodeURIComponent(`Hello StockAI Support, please activate my account subscription for ${userEmail}`)}`}
              target="_blank"
              rel="noreferrer"
              className="py-2 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/80 rounded font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sales & Activation</span>
            </a>

            <a
              href={`https://wa.me/923394377311?text=${encodeURIComponent(`Hello StockAI Support, I need technical assistance for account ${userEmail}`)}`}
              target="_blank"
              rel="noreferrer"
              className="py-2 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/80 rounded font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Technical Support</span>
            </a>
          </div>

          <button
            onClick={onLogout}
            className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 rounded font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
