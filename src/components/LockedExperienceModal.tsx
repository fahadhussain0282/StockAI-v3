import React from 'react';
import { Lock, Sparkles, LogOut, MessageCircle, CreditCard, ShieldAlert } from 'lucide-react';

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-sans text-zinc-200">
      {/* Blurred Premium Background */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl animate-fade-in" />
      
      {/* Modal Container */}
      <div className="bg-[#0c0c0e]/90 border border-zinc-800/80 rounded-2xl max-w-lg w-full p-8 space-y-7 shadow-modal relative animate-scale-in glow-sm">
        
        {/* Lock Graphic */}
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse-glow" />
          <div className="relative w-16 h-16 rounded-full bg-zinc-900 border border-zinc-700/80 flex items-center justify-center shadow-inner">
            <Lock className="w-8 h-8 text-amber-400" />
          </div>
        </div>

        {/* Message Content */}
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400 bg-amber-950/40 border border-amber-900/60 px-3 py-1 rounded-full shadow-sm">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> 
            <span>License Required</span>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Unlock StockAI Workspace</h2>
          <p className="text-[13px] text-zinc-400 leading-relaxed max-w-md mx-auto">
            Your account <span className="text-white font-semibold">{userEmail}</span> has been created successfully, but your license is not currently active. Choose a plan or contact support to activate your full Title Intelligence & Vision Generator access.
          </p>
        </div>

        {/* Features Preview List */}
        <div className="bg-black/40 border border-zinc-800/60 rounded-xl p-4 text-left space-y-3 shadow-inner">
          <div className="text-[10px] font-mono uppercase font-bold text-zinc-500 tracking-wider">Enterprise Features Locked</div>
          <div className="grid grid-cols-2 gap-3 text-zinc-300 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="font-medium">Title & Keyword SEO Engine</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="font-medium">Vision Category Detection</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="font-medium">15+ Contributor SEO Tools</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="font-medium">12+ Marketplace CSV Export</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            onClick={onOpenPlans}
            className="w-full py-3 bg-white text-black hover:bg-zinc-200 font-bold text-[13px] rounded-lg transition-all duration-200 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] cursor-pointer flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            <span>Select & Activate Plan</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <a
              href={`https://wa.me/923413516882?text=${encodeURIComponent(`Hello StockAI Support, please help me activate my license for account: ${userEmail}`)}`}
              target="_blank"
              rel="noreferrer"
              className="py-2.5 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-900/60 rounded-lg font-medium text-[11px] flex items-center justify-center gap-1.5 transition-all duration-200 hover:shadow-sm"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Account Activation</span>
            </a>

            <a
              href={`https://wa.me/923394377311?text=${encodeURIComponent(`Hello StockAI Premium Support, I need technical assistance for account: ${userEmail}`)}`}
              target="_blank"
              rel="noreferrer"
              className="py-2.5 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-900/60 rounded-lg font-medium text-[11px] flex items-center justify-center gap-1.5 transition-all duration-200 hover:shadow-sm"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Premium Support</span>
            </a>
          </div>

          <button
            onClick={onLogout}
            className="w-full py-2.5 bg-transparent hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 border border-transparent hover:border-zinc-800 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer mt-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
