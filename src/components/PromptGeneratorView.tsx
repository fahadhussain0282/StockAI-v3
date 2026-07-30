import React, { useState } from 'react';
import { Sparkles, Copy, Check, Wand2, RefreshCw, AlertCircle } from 'lucide-react';

interface PromptGeneratorViewProps {
  customApiKey?: string;
  isSubscriptionActive?: boolean;
  onOpenLocked?: () => void;
  authToken?: string;
}

export const PromptGeneratorView: React.FC<PromptGeneratorViewProps> = ({
  customApiKey,
  isSubscriptionActive = false,
  onOpenLocked,
  authToken
}) => {
  const [topic, setTopic] = useState('Minimalist abstract 3D glass background with vibrant gradients');
  const [style, setStyle] = useState('Photorealistic studio lighting, cinematic 8k');
  const [mood, setMood] = useState('Corporate tech, clean minimal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePrompt = async () => {
    // Check subscription/admin access before making the request
    if (!isSubscriptionActive && onOpenLocked) {
      onOpenLocked();
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const token = authToken || localStorage.getItem('stockai_auth_token') || '';
      const deviceId = localStorage.getItem('stockai_device_id') || '';
      const res = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Device-Id': deviceId
        },
        body: JSON.stringify({ topic, style, mood, customApiKey })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || `Request failed (${res.status})`);
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to generate prompt. Please try again.');
      console.error('Failed to generate prompt:', err);
    } finally {
      setIsGenerating(false);
    }
  };


  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="bg-[#0c0c0e] border border-zinc-800 rounded-lg p-6 space-y-6 font-sans">
      <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
        <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
          <Sparkles className="w-5 h-5 text-zinc-300" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white">Stock Asset AI Prompt Generator</h2>
          <p className="text-xs text-zinc-400">
            Generate high-converting Midjourney v6, DALL-E 3 & Flux prompts to create stock photos and 3D assets.
          </p>
        </div>
      </div>

      {/* Input Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-300">Topic or Concept</label>
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-600"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-300">Aesthetic & Lighting Style</label>
          <input
            type="text"
            value={style}
            onChange={e => setStyle(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-600"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-300">Mood / Industry Tone</label>
          <input
            type="text"
            value={mood}
            onChange={e => setMood(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-600"
          />
        </div>
      </div>

      <button
        onClick={handleGeneratePrompt}
        disabled={isGenerating}
        className="px-6 py-2.5 bg-white text-black font-semibold text-xs rounded shadow-sm hover:bg-zinc-200 flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
      >
        {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin text-black" /> : <Wand2 className="w-4 h-4 text-black" />}
        {isGenerating ? 'Engineering Prompts...' : 'Generate AI Prompts'}
      </button>

      {/* Error Display */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-950/40 border border-red-900/60 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {/* Prompts Output */}
      {result && (
        <div className="space-y-4 pt-4 border-t border-zinc-800">
          {/* Midjourney */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-200">
              <span>Midjourney v6 Prompt</span>
              <button
                onClick={() => handleCopy(result.promptMidjourney, 'mj')}
                className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'mj' ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                {copiedKey === 'mj' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-zinc-200 font-mono bg-zinc-950 p-2.5 rounded border border-zinc-800 select-all">
              {result.promptMidjourney}
            </p>
          </div>

          {/* DALL-E 3 */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-200">
              <span>DALL-E 3 Prompt</span>
              <button
                onClick={() => handleCopy(result.promptDalle, 'dalle')}
                className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'dalle' ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                {copiedKey === 'dalle' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-zinc-200 font-mono bg-zinc-950 p-2.5 rounded border border-zinc-800 select-all">
              {result.promptDalle}
            </p>
          </div>

          {/* Flux */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-200">
              <span>Flux.1 Prompt</span>
              <button
                onClick={() => handleCopy(result.promptFlux, 'flux')}
                className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'flux' ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                {copiedKey === 'flux' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-zinc-200 font-mono bg-zinc-950 p-2.5 rounded border border-zinc-800 select-all">
              {result.promptFlux}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
