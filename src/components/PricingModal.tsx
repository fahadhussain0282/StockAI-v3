import React, { useState } from 'react';
import { Check, X, Sparkles, Zap, ShieldCheck } from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (planName: string, credits: number, durationDays: number, price: number) => void;
}

type Currency = 'PKR' | 'USD';

const PRICING_CONFIG = {
  PKR: {
    symbol: 'PKR',
    oneMonth: {
      originalPrice: '500',
      discountedPrice: '300',
      saveText: 'Save 40%',
      badge: 'Limited Time Offer',
      waText: 'PKR 300'
    },
    sixMonths: {
      originalPrice: '3,000',
      discountedPrice: '2,000',
      saveText: 'Save 33%',
      badge: 'Limited Time Offer',
      waText: 'PKR 2000'
    }
  },
  USD: {
    symbol: '$',
    oneMonth: {
      originalPrice: '8',
      discountedPrice: '5',
      saveText: 'Save 38%',
      badge: 'Limited Time Offer',
      waText: 'USD $5'
    },
    sixMonths: {
      originalPrice: '49',
      discountedPrice: '39',
      saveText: 'Save 20%',
      badge: 'Limited Time Offer',
      waText: 'USD $39'
    }
  }
};

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, onSelectPlan }) => {
  const [currency, setCurrency] = useState<Currency>(() => {
    try {
      const saved = localStorage.getItem('stockai_currency') as Currency | null;
      return saved === 'USD' ? 'USD' : 'PKR';
    } catch {
      return 'PKR';
    }
  });

  const handleCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    try {
      localStorage.setItem('stockai_currency', newCurrency);
    } catch {}
  };

  if (!isOpen) return null;

  const currentPricing = PRICING_CONFIG[currency];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans text-zinc-200">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in" onClick={onClose} />
      <div className="bg-[#0c0c0e]/95 border border-zinc-800/80 rounded-2xl max-w-4xl w-full p-8 relative shadow-modal animate-scale-in max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors cursor-pointer bg-zinc-900/50 hover:bg-zinc-800 p-1.5 rounded-md"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center gap-2 bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest shadow-sm">
            <Zap className="w-3.5 h-3.5" />
            StockAI Enterprise SaaS
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Unlock AI Metadata Generation</h2>
          <p className="text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
            Stop wasting hours on keywording. Automate your microstock metadata with the industry's most advanced SEO vision models.
          </p>
        </div>

        {/* Currency Switcher */}
        <div className="flex justify-center mb-10">
          <div className="bg-[#121214] p-1 rounded-lg border border-zinc-800/80 inline-flex items-center gap-1">
            <button
              onClick={() => handleCurrencyChange('PKR')}
              className={`px-8 py-2 rounded-md text-sm font-bold transition-all duration-300 ${
                currency === 'PKR' 
                  ? 'bg-zinc-800 text-white shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              PKR
            </button>
            <button
              onClick={() => handleCurrencyChange('USD')}
              className={`px-8 py-2 rounded-md text-sm font-bold transition-all duration-300 ${
                currency === 'USD' 
                  ? 'bg-zinc-800 text-white shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              USD
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Plan 1: 1 Month */}
          <div className="bg-[#121214] border border-zinc-800 rounded-xl p-6 flex flex-col hover:border-zinc-700 transition-colors duration-300 relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-white">1 Month Plan</h3>
            </div>
            
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-bold text-white transition-all duration-300">
                {currentPricing.symbol} {currentPricing.oneMonth.discountedPrice}
              </span>
              <span className="text-sm text-zinc-500 font-medium">/ 1 month</span>
            </div>
            
            <div className="flex items-center gap-2 mb-2 transition-all duration-300">
              <div className="text-xs text-zinc-500 font-medium line-through">
                {currentPricing.symbol} {currentPricing.oneMonth.originalPrice}
              </div>
              <div className="text-xs text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/50">
                {currentPricing.oneMonth.saveText}
              </div>
            </div>
            
            <div className="text-xs font-bold text-amber-400/90 mb-6 uppercase tracking-wider flex items-center gap-1 transition-all duration-300">
              <Sparkles className="w-3 h-3" />
              {currentPricing.oneMonth.badge}
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-start gap-2.5 text-sm text-zinc-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Unlimited Metadata Generation</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-zinc-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Google Gemini 2.5 Flash / Pro</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-zinc-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Llama 4 Scout (Groq) Support</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-zinc-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>12+ Marketplace CSV Exports</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-zinc-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>15+ Contributor SEO Tools</span>
              </li>
            </ul>

            <a
              href={`https://wa.me/923413516882?text=Hello%20StockAI,%20I%20want%20to%20purchase%20the%201%20Month%20Plan%20(${currentPricing.oneMonth.waText})`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-semibold text-sm transition-colors text-center shadow-sm relative z-10"
            >
              Contact Sales to Buy
            </a>
          </div>

          {/* Plan 2: 6 Months (Most Popular) */}
          <div className="bg-[#121214] rounded-xl p-6 flex flex-col relative group overflow-hidden gradient-border-emerald transform md:-translate-y-2 shadow-2xl">
            <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            <div className="absolute top-4 right-4 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              <Sparkles className="w-3 h-3" /> Most Popular
            </div>

            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <h3 className="text-xl font-bold text-white mb-2">6 Months Plan</h3>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-bold text-white transition-all duration-300">
                {currentPricing.symbol} {currentPricing.sixMonths.discountedPrice}
              </span>
              <span className="text-sm text-zinc-500 font-medium">/ 6 months</span>
            </div>
            
            <div className="flex items-center gap-2 mb-2 transition-all duration-300">
              <div className="text-xs text-zinc-500 font-medium line-through">
                {currentPricing.symbol} {currentPricing.sixMonths.originalPrice}
              </div>
              <div className="text-xs text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/50">
                {currentPricing.sixMonths.saveText}
              </div>
            </div>

            <div className="text-xs font-bold text-amber-400/90 mb-6 uppercase tracking-wider flex items-center gap-1 transition-all duration-300">
              <Sparkles className="w-3 h-3" />
              {currentPricing.sixMonths.badge}
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-start gap-2.5 text-sm text-zinc-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="font-medium text-white">Everything in 1 Month, plus:</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-zinc-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Priority Generation Queue</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-zinc-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Grok (xAI) Vision Models</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-zinc-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Premium Technical Support</span>
              </li>
            </ul>

            <a
              href={`https://wa.me/923413516882?text=Hello%20StockAI,%20I%20want%20to%20purchase%20the%206%20Months%20PRO%20Plan%20(${currentPricing.sixMonths.waText})`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 bg-white hover:bg-zinc-200 text-black rounded-lg font-bold text-sm transition-all text-center shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] relative z-10 flex items-center justify-center gap-2"
            >
              Contact Sales to Buy
            </a>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-zinc-400" />
            <span>Secure Encryption</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-zinc-400" />
            <span>Instant Setup</span>
          </div>
        </div>
      </div>
    </div>
  );
};
