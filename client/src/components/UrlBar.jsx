import React, { useState, useEffect } from 'react';
import { Search, ArrowRight, Loader2, X, Globe, SlidersHorizontal } from 'lucide-react';

export default function UrlBar({
  url,
  setUrl,
  engine,
  setEngine,
  limit,
  setLimit,
  onSubmit,
  isLoading,
  detection,
  onClear
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch (e) {}
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) onSubmit();
  };

  return (
    <div className="w-full space-y-4">
      {/* Search Input Box */}
      <form onSubmit={handleFormSubmit} className="relative">
        <div className="flex flex-col md:flex-row items-stretch gap-2.5 p-2 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 focus-within:border-[#F1FF0A]/60 shadow-xl dark:shadow-2xl transition-all">
          
          {/* Main URL Input */}
          <div className="flex-1 flex items-center gap-3 px-3 min-h-[48px]">
            <Globe className="w-5 h-5 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste any store URL (e.g. https://www.daraz.com.bd, https://batabd.com, https://ryans.com)..."
              disabled={isLoading}
              className="w-full bg-transparent text-sm font-medium text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 outline-none"
            />
            {url && (
              <button
                type="button"
                onClick={onClear}
                disabled={isLoading}
                className="p-1 rounded-md text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {!url && (
              <button
                type="button"
                onClick={handlePaste}
                className="hidden sm:inline-flex text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors"
              >
                Paste
              </button>
            )}
          </div>

          {/* Controls: Limit Selector & Action Button */}
          <div className="flex items-center gap-2">
            
            {/* Scrape Limit Selector */}
            <div className="relative">
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                disabled={isLoading}
                className="appearance-none bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700 text-neutral-900 dark:text-neutral-200 text-xs font-semibold rounded-xl px-3.5 py-3 pr-8 outline-none focus:border-[#F1FF0A] cursor-pointer"
              >
                <option value={5000}>All Products (No Limit)</option>
                <option value={1000}>Max 1,000</option>
                <option value={500}>Max 500</option>
                <option value={250}>Max 250</option>
                <option value={100}>Max 100</option>
                <option value={50}>Max 50</option>
                <option value={20}>Max 20</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500 dark:text-neutral-400 text-[10px]">
                ▼
              </div>
            </div>

            {/* Optional Engine Switcher Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`p-3 rounded-xl border text-xs font-medium transition-colors ${
                showAdvanced || engine !== 'auto'
                  ? 'bg-[#F1FF0A]/20 border-[#F1FF0A]/60 text-black dark:text-[#F1FF0A]'
                  : 'bg-neutral-100 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title="Advanced engine options"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Main Submit Button - High Contrast Neon Yellow */}
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#F1FF0A] hover:bg-[#D4FF00] active:scale-[0.98] text-black text-xs font-extrabold tracking-wide uppercase shadow-lg shadow-[#F1FF0A]/15 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Extracting...</span>
                </>
              ) : (
                <>
                  <span>Extract Products</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Advanced Engine Selector (Collapsible) */}
      {showAdvanced && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800 text-xs animate-in fade-in slide-in-from-top-1 shadow-sm">
          <span className="text-neutral-600 dark:text-neutral-400 font-medium">Scraper Engine:</span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'auto', label: 'Auto Detect' },
              { id: 'shopify', label: 'Shopify' },
              { id: 'woocommerce', label: 'WooCommerce' },
              { id: 'daraz', label: 'Daraz' },
              { id: 'zatiq', label: 'Zatiq' },
              { id: 'generic', label: 'Generic / HTML' }
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setEngine(item.id)}
                className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-all ${
                  engine === item.id
                    ? 'bg-[#F1FF0A] text-black border-[#F1FF0A]'
                    : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
