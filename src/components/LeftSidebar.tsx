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
  PhoneCall,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { UserCredits, AuthUser, UserSubscription } from '../types';

export type ThemeMode = 'dark' | 'light' | 'system';

interface LeftSidebarProps {
  activeTab: 'generator' | 'tools' | 'how-to-use' | 'pricing' | 'discord';
  setActiveTab: (tab: 'generator' | 'tools' | 'how-to-use' | 'pricing' | 'discord') => void;
  credits: UserCredits;
  currentUser: AuthUser | null;
  subscription?: UserSubscription;
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
  subscription,
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
    if (theme === 'dark') return <Moon className="w-3.5 h-3.5" />;
    if (theme === 'light') return <Sun className="w-3.5 h-3.5" />;
    return <Laptop className="w-3.5 h-3.5" />;
  };

  const getThemeLabel = () => {
    if (theme === 'dark') return 'Dark Mode';
    if (theme === 'light') return 'Light Mode';
    return 'System Theme';
  };

  // Subscription status badge
  const isAdmin = currentUser?.role === 'admin';
  const subStatus = subscription || currentUser?.subscription;
  const isSubActive = subStatus?.isActive && !subStatus?.isExpired;
  
  const getDaysRemaining = (): number | null => {
    if (!subStatus?.expiresAt) return null;
    const diff = new Date(subStatus.expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
  };
  const daysLeft = getDaysRemaining();

  const navBtnClass = (tab: string) =>
    `w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
      activeTab === tab
        ? 'bg-zinc-800/80 text-white shadow-sm border border-zinc-700/60'
        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/30 hover:translate-x-0.5'
    }`;

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
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 flex items-center justify-between hover:border-zinc-700 transition-all duration-200 cursor-pointer group hover:bg-zinc-900/70">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-zinc-200">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-zinc-200">Get Extension</div>
              <div className="text-[10px] text-zinc-500">Chrome Web Store</div>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors duration-200" />
        </div>

        {/* Menu Navigation */}
        <nav className="space-y-1">
          <div className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase px-3 mb-2">
            Menu
          </div>

          <button onClick={() => setActiveTab('generator')} className={navBtnClass('generator')}>
            <Wand2 className="w-4 h-4 text-zinc-300 shrink-0" />
            Generator
          </button>

          <button onClick={() => setActiveTab('tools')} className={navBtnClass('tools')}>
            <Grid2X2 className="w-4 h-4 text-zinc-400 shrink-0" />
            All Tools
          </button>

          <button onClick={() => setActiveTab('how-to-use')} className={navBtnClass('how-to-use')}>
            <HelpCircle className="w-4 h-4 text-zinc-400 shrink-0" />
            How to Use
          </button>

          <button
            onClick={() => {
              setActiveTab('pricing');
              onOpenPricing();
            }}
            className={navBtnClass('pricing')}
          >
            <CreditCard className="w-4 h-4 text-zinc-400 shrink-0" />
            Pricing
          </button>

          <button onClick={() => setActiveTab('discord')} className={navBtnClass('discord')}>
            <MessageSquare className="w-4 h-4 text-zinc-400 shrink-0" />
            Discord
          </button>
        </nav>

        {/* Subscription Status Card — Hidden for Admins */}
        {currentUser && !isAdmin && (
          <div className={`rounded-lg p-2.5 text-xs border ${
            isSubActive
              ? 'bg-emerald-950/30 border-emerald-900/50'
              : 'bg-amber-950/30 border-amber-900/50'
          }`}>
            <div className="flex items-center gap-1.5">
              {isSubActive ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              )}
              <span className={`font-semibold text-[11px] ${isSubActive ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isSubActive ? 'License Active' : 'Activation Required'}
              </span>
            </div>
            {isSubActive && daysLeft !== null && (
              <div className="flex items-center gap-1 mt-1 pl-5">
                <Clock className="w-3 h-3 text-zinc-500 shrink-0" />
                <span className="text-[10px] text-zinc-400">{daysLeft} days remaining</span>
              </div>
            )}
            {!isSubActive && (
              <button
                onClick={onOpenPricing}
                className="mt-1.5 w-full py-1 text-[10px] font-semibold text-amber-300 bg-amber-950/40 hover:bg-amber-900/40 rounded border border-amber-900/60 transition-colors duration-150"
              >
                Activate Plan →
              </button>
            )}
          </div>
        )}

        {/* Admin Badge — Shown instead of subscription card for admins */}
        {currentUser && isAdmin && (
          <div className="rounded-lg p-2.5 text-xs border bg-violet-950/30 border-violet-900/50">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 shrink-0" />
              <span className="font-semibold text-[11px] text-violet-300">Administrator</span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5 pl-5">Full system access</div>
          </div>
        )}
      </div>

      {/* Bottom Profile & Controls */}
      <div className="p-4 space-y-3 border-t border-zinc-800">
        {/* WhatsApp Support — Professional Labels */}
        <div className="bg-emerald-950/40 border border-emerald-900/60 rounded-lg p-2.5 space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-400">
            <span className="flex items-center gap-1">
              <PhoneCall className="w-3.5 h-3.5" />
              WhatsApp Support
            </span>
          </div>
          <div className="flex flex-col gap-1 pt-0.5">
            <a
              href="https://wa.me/923413516882?text=Hello%20StockAI%20Support,%20I%20need%20help%20with%20Account%20Activation%20and%20License%20Management."
              target="_blank"
              rel="noreferrer"
              className="py-1 bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-300 font-medium text-[10px] rounded text-center transition-all duration-150 hover:shadow-sm"
            >
              Account Activation
            </a>
            <a
              href="https://wa.me/923394377311?text=Hello%20StockAI%20Premium%20Support,%20I%20need%20technical%20assistance."
              target="_blank"
              rel="noreferrer"
              className="py-1 bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-300 font-medium text-[10px] rounded text-center transition-all duration-150 hover:shadow-sm"
            >
              Premium Support
            </a>
          </div>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={cycleTheme}
          className="w-full bg-zinc-900/50 hover:bg-zinc-800/60 border border-zinc-800 rounded-lg p-2 flex items-center justify-between text-xs text-zinc-300 transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <span className="text-zinc-300 group-hover:text-white transition-colors duration-150">
              {getThemeIcon()}
            </span>
            <span className="font-medium text-xs">{getThemeLabel()}</span>
          </div>
          <span className="text-[10px] text-zinc-500 capitalize font-mono">{theme}</span>
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
                  <div className={`text-[10px] font-mono capitalize ${
                    isAdmin ? 'text-violet-400' : (isSubActive ? 'text-emerald-400' : 'text-amber-400')
                  }`}>
                    {isAdmin ? 'Administrator' : (isSubActive ? currentUser.subscription?.planName || 'Active' : 'Pending Activation')}
                  </div>
                </div>
              </div>
              <button 
                onClick={onLogout}
                title="Log out" 
                className="text-zinc-500 hover:text-zinc-200 p-1 rounded hover:bg-zinc-800 transition-all duration-150 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="w-full py-2 bg-white text-black font-semibold text-xs rounded hover:bg-zinc-200 transition-colors duration-150 cursor-pointer"
            >
              Sign In / Register
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
