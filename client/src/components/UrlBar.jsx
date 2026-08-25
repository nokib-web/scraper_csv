import React, { useState } from 'react';
import { Search, Globe, Play, Loader2, Sparkles, Filter, Link as LinkIcon, RefreshCw, X } from 'lucide-react';

export default function UrlBar({
  url,
  setUrl,
  limit,
  setLimit,
  engine,
  setEngine,
  onScrape,
  isLoading,
  presets = []
}) {
  const [isFocused, setIsFocused] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch (e) {
      console.warn('Clipboard read permission denied');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isLoading && url.trim()) {
      onScrape();
    }
  };

  return (
    <div className="w-full glass-panel p-5 mb-6 relative overflow-hidden">
      {/* Background ambient accent */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col gap-4">
        {/* Main Input Controls Row */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* URL Input Box */}
          <div
            className={`flex-1 flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-200 ${
              isFocused
                ? 'bg-slate-900/90 border-indigo-500 shadow-lg shadow-indigo-500/15'
                : 'bg-slate-950/60 border-white/10 hover:border-white/20'
            }`}
          >
            <Globe className={`w-5 h-5 ${isFocused ? 'text-indigo-400' : 'text-slate-400'}`} />
            <input
              type="url"
              placeholder="Paste any Store URL or Product link (e.g., https://store.com/products/..., https://brand.com)..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="w-full bg-transparent border-none outline-none text-white text-sm placeholder:text-slate-500"
            />
            {url && (
              <button
                type="button"
                onClick={() => setUrl('')}
                className="p-1 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handlePaste}
              title="Paste from clipboard"
              className="px-2.5 py-1 text-xs font-semibold text-slate-400 hover:text-indigo-300 hover:bg-indigo-950/50 rounded-lg border border-white/10 transition flex items-center gap-1"
            >
              <LinkIcon className="w-3 h-3" />
              Paste
            </button>
          </div>

          {/* Engine Selector */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={engine}
                onChange={(e) => setEngine(e.target.value)}
                disabled={isLoading}
                className="appearance-none bg-slate-950/80 border border-white/10 hover:border-white/20 text-slate-200 text-xs font-medium rounded-xl px-4 py-3.5 pr-8 outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="auto">✨ Auto Detect Engine</option>
                <option value="shopify">🛍️ Shopify Engine</option>
                <option value="woocommerce">🌐 WooCommerce Engine</option>
                <option value="wix">⚡ Wix eCommerce</option>
                <option value="generic">📄 Generic / HTML5 JSON-LD</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>

            {/* Scrape Limit Selector */}
            <div className="relative">
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                disabled={isLoading}
                className="appearance-none bg-slate-950/80 border border-white/10 hover:border-white/20 text-slate-200 text-xs font-medium rounded-xl px-4 py-3.5 pr-8 outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value={5000}>⚡ All Products (No Limit)</option>
                <option value={1000}>Max 1000 Items</option>
                <option value={500}>Max 500 Items</option>
                <option value={250}>Max 250 Items</option>
                <option value={100}>Max 100 Items</option>
                <option value={50}>Max 50 Items</option>
                <option value={25}>Max 25 Items</option>
                <option value={10}>Max 10 Items</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>

            {/* Action Trigger Button */}
            <button
              type="button"
              onClick={onScrape}
              disabled={isLoading || !url.trim()}
              className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg ${
                isLoading
                  ? 'bg-indigo-700/60 text-indigo-200 cursor-not-allowed'
                  : !url.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                  : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Extracting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>Scrape & Extract</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Demo Preset Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
            ⚡ Quick Test Demos:
          </span>
          {presets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setUrl(preset.url);
                setEngine(preset.type || 'auto');
              }}
              disabled={isLoading}
              className="px-3 py-1 text-xs rounded-lg bg-slate-900/80 border border-slate-700/60 hover:border-indigo-500/60 text-slate-300 hover:text-white transition flex items-center gap-1.5 group"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 group-hover:scale-125 transition-transform"></span>
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
