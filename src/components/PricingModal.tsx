import React from 'react';
import { X, Check, Sparkles, MessageCircle } from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (planName: string, credits: number, durationDays: number, price: number) => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  onSelectPlan
}) => {
  if (!isOpen) return null;

  const plans = [
    {
      id: 'plan_1m',
      name: '1 Month Plan',
      price: '300',
      period: '/ 30 Days',
      durationDays: 30,
      credits: 3000,
      description: 'Full 30-day access to StockAI Title Intelligence & Vision Metadata.',
      features: [
        '30 Days Unlimited Access',
        'StockAI Title Intelligence v2.0',
        'Transparent PNG Auto-Detection',
        'Adobe Stock, Shutterstock & All CSV Exports',
        '1 Active Device Protection'
      ],
      popular: true
    },
    {
      id: 'plan_6m',
      name: '6 Months Plan',
      price: '2000',
      period: '/ 180 Days',
      durationDays: 180,
      credits: 20000,
      description: 'Maximum value for high-volume studio contributors.',
      features: [
        '180 Days Full Access (Save Big)',
        'StockAI Title Intelligence v2.0',
        'Transparent PNG Auto-Detection',
        'Priority Vision Processing Speed',
        'All 12+ Marketplace CSV Mappers',
        '1 Active Device Protection'
      ],
      popular: false
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-lg max-w-3xl w-full p-6 space-y-6 shadow-2xl relative my-8 text-zinc-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 max-w-lg mx-auto">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-300 bg-white/10 px-3 py-1 rounded border border-white/10">
            <Sparkles className="w-3 h-3 text-zinc-300" /> StockAI Subscription Plans
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Select Your Subscription Plan</h2>
          <p className="text-xs text-zinc-400">
            Get instant access to StockAI Title Intelligence v2.0, Transparent PNG Mode, and Marketplace CSV exports.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {plans.map(p => (
            <div
              key={p.id}
              className={`bg-zinc-900/60 border rounded-lg p-6 flex flex-col justify-between space-y-5 relative transition-colors ${
                p.popular
                  ? 'border-zinc-400 shadow-lg ring-1 ring-zinc-500/20'
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black text-[9px] font-mono font-bold uppercase tracking-wider px-3 py-0.5 rounded shadow-sm">
                  Recommended
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">{p.name}</h3>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-extrabold text-white font-mono">{p.price}</span>
                    <span className="text-xs text-zinc-400 font-normal">{p.period}</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-normal">{p.description}</p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded p-2.5 text-xs font-mono text-zinc-300 flex items-center justify-between">
                  <span>Duration</span>
                  <span className="text-white font-bold">{p.durationDays} Days Auto-Expiry</span>
                </div>

                <ul className="space-y-2 text-xs text-zinc-300 pt-1">
                  {p.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    onSelectPlan(p.name, p.credits, p.durationDays, Number(p.price));
                    onClose();
                  }}
                  className={`w-full py-2.5 rounded font-semibold text-xs transition-colors cursor-pointer ${
                    p.popular
                      ? 'bg-white text-black hover:bg-zinc-200 shadow-sm'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                  }`}
                >
                  Activate {p.name}
                </button>

                {/* Direct WhatsApp Activation Link */}
                <a
                  href={`https://wa.me/923413516882?text=${encodeURIComponent(`Hello StockAI Support, I want to activate the ${p.name} (${p.price}). Please guide me.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/60 rounded font-medium text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Buy via WhatsApp (03413516882)</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* WhatsApp Support Footer */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <MessageCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="font-semibold text-white">Need Assistance or Custom Activation?</div>
              <div className="text-[11px] text-zinc-400">Our support team is available 24/7 via WhatsApp.</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://wa.me/923413516882"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] rounded transition-colors"
            >
              03413516882
            </a>
            <a
              href="https://wa.me/923394377311"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] rounded transition-colors"
            >
              03394377311
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

