import React, { useState, useEffect } from 'react';
import { ArrowRight, Loader2, X, SlidersHorizontal, ClipboardPaste } from 'lucide-react';
import { FaLink } from 'react-icons/fa';

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

  // Typewriter Animation Phrases
  const phrases = [
    'Paste Shopify store URL (e.g. https://officialdrpen.com)...',
    'Paste WooCommerce store URL (e.g. https://batabd.com)...',
    'Paste Daraz store URL (e.g. https://www.daraz.com.bd)...',
    'Paste Ryans Computer URL (e.g. https://ryans.com)...',
    'Paste any store URL to download CSV catalog...'
  ];

  const [placeholderText, setPlaceholderText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];
    let typingSpeed = isDeleting ? 20 : 50;

    if (!isDeleting && charIndex === currentPhrase.length) {
      typingSpeed = 1600; // Pause when word is fully typed
      const timeout = setTimeout(() => setIsDeleting(true), typingSpeed);
      return () => clearTimeout(timeout);
    } else if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
      typingSpeed = 350;
    }

    const timeout = setTimeout(() => {
      const nextCharIndex = charIndex + (isDeleting ? -1 : 1);
      setCharIndex(nextCharIndex);
      setPlaceholderText(currentPhrase.substring(0, nextCharIndex));
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, phraseIndex]);

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
      
      {/* Hero Headline & Instructions */}
      <div className="text-center space-y-2 py-1 sm:py-3 max-w-2xl mx-auto animate-in fade-in duration-300">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#F1FF0A]/20 border border-[#F1FF0A]/40 text-neutral-950 dark:text-[#F1FF0A] text-[11px] font-extrabold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8b9900] dark:bg-[#F1FF0A] animate-pulse"></span>
          <span>Universal E-Commerce Catalog Exporter</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-neutral-950 dark:text-white tracking-tight leading-tight">
          Export Any Store Catalog to CSV
        </h1>

        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto leading-relaxed">
          Paste any store URL below (Shopify, WooCommerce, Daraz, etc.) to extract products, images, variants & prices in 1-click.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleFormSubmit} className="relative max-w-3xl mx-auto">
        <div className="flex flex-col md:flex-row items-stretch gap-2 p-2 rounded-2xl bg-white dark:bg-[#121216] border-2 border-[#F1FF0A]/70 dark:border-[#F1FF0A]/40 hover:border-[#F1FF0A] focus-within:border-[#F1FF0A] focus-within:ring-4 focus-within:ring-[#F1FF0A]/25 dark:focus-within:ring-[#F1FF0A]/15 shadow-xl shadow-[#F1FF0A]/10 dark:shadow-black/70 transition-all">
          
          {/* Main URL Input with Typewriter Placeholder */}
          <div className="flex-1 flex items-center gap-2.5 px-2.5 min-h-[44px] sm:min-h-[48px]">
            <div className="w-8 h-8 rounded-xl bg-[#F1FF0A] flex items-center justify-center flex-shrink-0 text-black shadow-md">
              <FaLink className="w-3.5 h-3.5 stroke-[1.5]" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={placeholderText || 'Paste store URL...'}
              disabled={isLoading}
              className="w-full bg-transparent text-xs sm:text-sm font-semibold text-neutral-950 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 outline-none"
            />
            {url && (
              <button
                type="button"
                onClick={onClear}
                disabled={isLoading}
                className="p-1 rounded-md text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex-shrink-0 cursor-pointer"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {!url && (
              <button
                type="button"
                onClick={handlePaste}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 hover:bg-[#F1FF0A] hover:text-black dark:hover:bg-[#F1FF0A] dark:hover:text-black text-neutral-800 dark:text-neutral-200 text-xs font-extrabold transition-all border border-neutral-300 dark:border-neutral-800 hover:border-[#F1FF0A] flex-shrink-0 cursor-pointer shadow-sm"
                title="Paste URL from clipboard"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Paste</span>
              </button>
            )}
          </div>

          {/* Controls: Limit Selector & Action Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 pt-1.5 md:pt-0 border-t md:border-t-0 border-neutral-100 dark:border-neutral-900">
            
            {/* Scrape Limit Selector */}
            <div className="relative flex-1 md:flex-initial">
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                disabled={isLoading}
                className="w-full md:w-auto appearance-none bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 hover:border-[#F1FF0A]/60 text-neutral-900 dark:text-neutral-200 text-xs font-semibold rounded-xl px-3 py-2.5 sm:py-3 pr-7 outline-none focus:border-[#F1FF0A] cursor-pointer"
              >
                <option value={5000}>All Products</option>
                <option value={1000}>Max 1,000</option>
                <option value={500}>Max 500</option>
                <option value={250}>Max 250</option>
                <option value={100}>Max 100</option>
                <option value={50}>Max 50</option>
                <option value={20}>Max 20</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500 dark:text-neutral-400 text-[10px]">
                ▼
              </div>
            </div>

            {/* Optional Engine Switcher Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`p-2.5 sm:p-3 rounded-xl border text-xs font-medium transition-colors flex-shrink-0 ${
                showAdvanced || engine !== 'auto'
                  ? 'bg-[#F1FF0A] border-[#F1FF0A] text-black font-bold shadow-sm'
                  : 'bg-neutral-100 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:border-[#F1FF0A]/50'
              }`}
              title="Advanced engine options"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Main Submit Button - High Contrast Neon Yellow */}
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-[#F1FF0A] hover:bg-[#D4FF00] active:scale-[0.98] text-black text-xs font-black tracking-wide uppercase shadow-lg shadow-[#F1FF0A]/20 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer whitespace-nowrap"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Extracting...</span>
                </>
              ) : (
                <>
                  <span>Extract</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Advanced Engine Selector (Collapsible) */}
      {showAdvanced && (
        <div className="max-w-3xl mx-auto flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800 text-xs animate-in fade-in slide-in-from-top-1 shadow-sm">
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
