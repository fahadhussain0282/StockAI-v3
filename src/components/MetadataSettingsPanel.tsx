import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Sliders, 
  Tag, 
  Type, 
  FileText, 
  Globe, 
  Info, 
  Check
} from 'lucide-react';
import { MetadataSettings, MarketplaceId } from '../types';
import { MARKETPLACE_REGISTRY } from '../registries/marketplaces';

interface MetadataSettingsPanelProps {
  settings: MetadataSettings;
  setSettings: React.Dispatch<React.SetStateAction<MetadataSettings>>;
}

export const MetadataSettingsPanel: React.FC<MetadataSettingsPanelProps> = ({
  settings,
  setSettings
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const platforms: { id: MarketplaceId; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'adobe-stock', label: 'Adobe Stock' },
    { id: 'shutterstock', label: 'Shutterstock' },
    { id: 'freepik', label: 'FreePik' },
    { id: 'vecteezy', label: 'Vecteezy' },
    { id: 'pond5', label: 'Pond5' }
  ];

  const handlePlatformSelect = (platformId: MarketplaceId) => {
    const rule = MARKETPLACE_REGISTRY[platformId] || MARKETPLACE_REGISTRY.general;
    setSettings(prev => ({
      ...prev,
      targetPlatform: platformId,
      titleLength: Math.min(prev.titleLength, rule.titleMaxLength)
    }));
  };

  return (
    <div className="w-72 bg-[#0c0c0e] border-r border-zinc-800 h-full flex flex-col shrink-0 overflow-y-auto select-none text-zinc-300 font-sans">
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="p-4 border-b border-zinc-800 flex items-center justify-between hover:bg-zinc-900/40 transition-colors cursor-pointer w-full text-left"
      >
        <div className="flex items-center gap-2.5">
          <Sliders className="w-4 h-4 text-zinc-400" />
          <span className="font-semibold text-xs text-white uppercase tracking-wider">Metadata Settings</span>
        </div>
        {isCollapsed ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronUp className="w-4 h-4 text-zinc-500" />}
      </button>

      {!isCollapsed && (
        <div className="p-4 space-y-6 text-xs">
          {/* Export Platform */}
          <div className="space-y-2.5">
            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">
              EXPORT PLATFORM
            </label>
            <div className="grid grid-cols-2 gap-2">
              {platforms.map(p => {
                const isSelected = settings.targetPlatform === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handlePlatformSelect(p.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded text-[11px] font-semibold text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-white text-black shadow-sm'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{p.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-black shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-zinc-800" />

          {/* Title Length Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-zinc-400" />
                <span>TITLE LENGTH</span>
              </label>
              <span className="text-[11px] font-mono text-white">
                {settings.titleLength} <span className="text-[10px] text-zinc-500">chars</span>
              </span>
            </div>
            <input
              type="range"
              min={20}
              max={200}
              step={5}
              value={settings.titleLength}
              onChange={e => setSettings({ ...settings, titleLength: Number(e.target.value) })}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>

          {/* Description Fixed Indicator */}
          <div className="bg-zinc-900/50 border border-zinc-800 p-2.5 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-400">
              <FileText className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">DESCRIPTION</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded">
              150 chars
            </span>
          </div>

          {/* Keywords Count Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-zinc-400" />
                <span>KEYWORDS COUNT</span>
              </label>
              <span className="text-[11px] font-mono text-white">
                {settings.keywordsCount}
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={75}
              step={1}
              value={settings.keywordsCount}
              onChange={e => setSettings({ ...settings, keywordsCount: Number(e.target.value) })}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>

          <hr className="border-zinc-800" />

          {/* Options Toggles */}
          <div className="space-y-3">
            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">
              OPTIONS
            </label>

            {/* Transparent PNG Toggle */}
            <div className="space-y-1.5 p-2 bg-zinc-900/60 border border-zinc-800 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white block">Transparent PNG</span>
                  <span className="text-[10px] text-zinc-400">Auto-add isolated & cutout tags</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoTransparentPngTag}
                    onChange={e => setSettings({ ...settings, autoTransparentPngTag: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-zinc-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-white peer-checked:after:bg-black"></div>
                </label>
              </div>
            </div>

            {/* Prefix */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-300">Prefix</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enablePrefix}
                    onChange={e => setSettings({ ...settings, enablePrefix: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-zinc-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-white peer-checked:after:bg-black"></div>
                </label>
              </div>
              {settings.enablePrefix && (
                <input
                  type="text"
                  placeholder="e.g. Premium vector of"
                  value={settings.prefix}
                  onChange={e => setSettings({ ...settings, prefix: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-600"
                />
              )}
            </div>

            {/* Suffix */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-300">Suffix</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableSuffix}
                    onChange={e => setSettings({ ...settings, enableSuffix: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-zinc-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-white peer-checked:after:bg-black"></div>
                </label>
              </div>
              {settings.enableSuffix && (
                <input
                  type="text"
                  placeholder="e.g. for advertising copy space"
                  value={settings.suffix}
                  onChange={e => setSettings({ ...settings, suffix: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-600"
                />
              )}
            </div>

            {/* Negative Title Words */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-300">Negative Title Words</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableNegativeTitleWords}
                    onChange={e => setSettings({ ...settings, enableNegativeTitleWords: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-zinc-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-white peer-checked:after:bg-black"></div>
                </label>
              </div>
              {settings.enableNegativeTitleWords && (
                <input
                  type="text"
                  placeholder="Words to filter out (comma separated)"
                  value={settings.negativeTitleWords}
                  onChange={e => setSettings({ ...settings, negativeTitleWords: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-600"
                />
              )}
            </div>

            {/* Negative Keywords */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-300">Negative Keywords</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableNegativeKeywords}
                    onChange={e => setSettings({ ...settings, enableNegativeKeywords: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-zinc-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-white peer-checked:after:bg-black"></div>
                </label>
              </div>
              {settings.enableNegativeKeywords && (
                <input
                  type="text"
                  placeholder="Keywords to exclude (comma separated)"
                  value={settings.negativeKeywords}
                  onChange={e => setSettings({ ...settings, negativeKeywords: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-600"
                />
              )}
            </div>
          </div>

          <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg flex items-start gap-2 text-[10px] leading-relaxed text-zinc-500">
            <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
            <span>StockAI Engine will automatically normalize keywords to match Adobe Stock taxonomy requirements.</span>
          </div>
        </div>
      )}
    </div>
  );
};
