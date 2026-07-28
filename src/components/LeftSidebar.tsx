import React from 'react';
import { 
  Wand2, 
  Grid2X2, 
  HelpCircle, 
  CreditCard, 
  MessageSquare, 
  Sun, 
  Moon, 
  Laptop,
  LogOut, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  PhoneCall
} from 'lucide-react';
import { UserCredits, AuthUser } from '../types';

export type ThemeMode = 'dark' | 'light' | 'system';

interface LeftSidebarProps {
  activeTab: 'generator' | 'tools' | 'how-to-use' | 'pricing' | 'discord';
  setActiveTab: (tab: 'generator' | 'tools' | 'how-to-use' | 'pricing' | 'discord') => void;
  credits: UserCredits;
  currentUser: AuthUser | null;
  onOpenPricing: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeTab,
  setActiveTab,
  credits,
  currentUser,
  onOpenPricing,
  onOpenAuth,
  onLogout,
  theme,
  setTheme
}) => {
  const cycleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  const getThemeIcon = () => {
    if (theme === 'dark') return <Moon className="w-3.5 h-3.5 text-zinc-300" />;
    if (theme === 'light') return <Sun className="w-3.5 h-3.5 text-zinc-300" />;
    return <Laptop className="w-3.5 h-3.5 text-zinc-300" />;
  };

  const getThemeLabel = () => {
    if (theme === 'dark') return 'Dark Mode';
    if (theme === 'light') return 'Light Mode';
    return 'System Theme';
  };

  return (
    <aside className="w-60 bg-[#0c0c0e] border-r border-zinc-800 flex flex-col justify-between shrink-0 h-screen select-none text-zinc-300 font-sans">
      {/* Top Branding & Nav */}
      <div className="p-4 space-y-5">
        {/* Logo */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-white rounded flex items-center justify-center text-black font-bold shadow-sm">
              <div className="w-3.5 h-3.5 bg-black rounded-sm" />
            </div>
            <span className="font-bold text-base text-white tracking-tight">
              StockAI <span className="text-[10px] font-medium text-zinc-400 bg-white/10 px-1.5 py-0.5 rounded border border-white/5 ml-0.5">PRO</span>
            </span>
          </div>
        </div>

        {/* Extension Banner */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 flex items-center justify-between hover:border-zinc-700 transition-all cursor-pointer group">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-zinc-200">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-zinc-200">Get Extension</div>
              <div className="text-[10px] text-zinc-500">Chrome Web Store</div>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
        </div>

        {/* Menu Navigation */}
        <nav className="space-y-1">
          <div className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase px-3 mb-2">
            Menu
          </div>

          <button
            onClick={() => setActiveTab('generator')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'generator'
                ? 'bg-zinc-800/80 text-white shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/30'
            }`}
          >
            <Wand2 className="w-4 h-4 text-zinc-300" />
            Generator
          </button>

          <button
            onClick={() => setActiveTab('tools')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'tools'
                ? 'bg-zinc-800/80 text-white shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/30'
            }`}
          >
            <Grid2X2 className="w-4 h-4 text-zinc-400" />
            All Tools
          </button>

          <button
            onClick={() => setActiveTab('how-to-use')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'how-to-use'
                ? 'bg-zinc-800/80 text-white shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/30'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-zinc-400" />
            How to Use
          </button>

          <button
            onClick={() => {
              setActiveTab('pricing');
              onOpenPricing();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'pricing'
                ? 'bg-zinc-800/80 text-white shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/30'
            }`}
          >
            <CreditCard className="w-4 h-4 text-zinc-400" />
            Pricing
          </button>

          <button
            onClick={() => setActiveTab('discord')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'discord'
                ? 'bg-zinc-800/80 text-white shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/30'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-zinc-400" />
            Discord
          </button>
        </nav>
      </div>

      {/* Bottom Profile & Theme Status */}
      <div className="p-4 space-y-3 border-t border-zinc-800">
        {/* Credits Card (Hidden per Section 2 & 3 rules) */}
        {false && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Credits Used</span>
              <span className="font-semibold text-white text-xs font-mono">{credits.creditsRemaining} / {credits.creditsMax}</span>
            </div>
            <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
              <div 
                className="bg-white h-full rounded-full transition-all duration-300"
                style={{ width: `${(credits.creditsRemaining / Math.max(1, credits.creditsMax)) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* WhatsApp Support Links (Section 15: Hide phone numbers from text) */}
        <div className="bg-emerald-950/40 border border-emerald-900/60 rounded-lg p-2.5 space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-400">
            <span className="flex items-center gap-1">
              <PhoneCall className="w-3.5 h-3.5" />
              WhatsApp Support
            </span>
          </div>
          <div className="flex flex-col gap-1 pt-0.5">
            <a
              href="https://wa.me/923413516882?text=Hello%20StockAI%20Support,%20I%20need%20Sales%20%26%20Activation%20help."
              target="_blank"
              rel="noreferrer"
              className="py-1 bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-300 font-medium text-[10px] rounded text-center transition-colors"
            >
              Sales & Activation
            </a>
            <a
              href="https://wa.me/923394377311?text=Hello%20StockAI%20Support,%20I%20need%20Technical%20Support."
              target="_blank"
              rel="noreferrer"
              className="py-1 bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-300 font-medium text-[10px] rounded text-center transition-colors"
            >
              Technical Support
            </a>
          </div>
        </div>

        {/* Mode Toggle Button (Cycle Dark -> Light -> System) */}
        <button
          onClick={cycleTheme}
          className="w-full bg-zinc-900/50 hover:bg-zinc-800/50 border border-zinc-800 rounded-lg p-2 flex items-center justify-between text-xs text-zinc-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            {getThemeIcon()}
            <span className="font-medium text-xs">{getThemeLabel()}</span>
          </div>
          <span className="text-[10px] text-zinc-500 capitalize">{theme}</span>
        </button>

        {/* User Account / Auth Status */}
        <div className="flex items-center justify-between pt-1 px-1">
          {currentUser ? (
            <>
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="truncate">
                  <div className="text-xs font-medium text-zinc-200 truncate">{currentUser.fullName || currentUser.email}</div>
                  <div className="text-[10px] text-emerald-400 font-mono capitalize">{currentUser.subscription.planName}</div>
                </div>
              </div>
              <button 
                onClick={onLogout}
                title="Log out" 
                className="text-zinc-500 hover:text-zinc-200 p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="w-full py-2 bg-white text-black font-semibold text-xs rounded hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              Sign In / Register
            </button>
          )}
        </div>

      </div>
    </aside>
  );
};

