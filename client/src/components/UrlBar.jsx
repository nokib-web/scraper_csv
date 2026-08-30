import React, { useState, useEffect } from 'react';
import { ArrowRight, Loader2, X, ClipboardPaste, Sparkles, Lock } from 'lucide-react';
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
  onClear,
  userPlan = { id: 'free', name: 'Starter Free', maxLimit: 20 },
  onOpenPricing,
  onUpgradeClick
}) {
  const triggerPricing = onUpgradeClick || onOpenPricing;

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

  const handleClearUrl = () => {
    if (onClear) {
      onClear();
    } else {
      setUrl('');
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) onSubmit();
  };

  const handleLimitChange = (e) => {
    const chosenVal = Number(e.target.value);
    const userMax = userPlan?.maxLimit || 20;

    if (chosenVal > userMax) {
      // Prompt user to upgrade/activate 7-day free trial on Pricing tab
      if (triggerPricing) {
        triggerPricing();
      }
      return;
    }
    setLimit(chosenVal);
  };

  return (
    <div className="w-full space-y-4">
      
      {/* Hero Headline & Instructions */}
      <div className="text-center space-y-3 py-3 sm:py-5 max-w-3xl mx-auto animate-in fade-in duration-300">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F1FF0A]/20 border border-[#F1FF0A]/40 text-neutral-950 dark:text-[#F1FF0A] text-xs sm:text-sm font-semibold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-[#8b9900] dark:bg-[#F1FF0A] animate-pulse"></span>
          <span>Universal E-Commerce Catalog Exporter</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-title font-semibold text-neutral-950 dark:text-white tracking-tight leading-tight">
          Export Any Store Catalog to CSV
        </h1>

        <p className="text-base sm:text-lg text-neutral-700 dark:text-neutral-300 max-w-2xl mx-auto leading-relaxed font-normal">
          Paste any store URL below (Shopify, WooCommerce, Daraz, etc.) to extract products, images, variants & prices in 1-click.
        </p>
      </div>

      {/* Main Form: Clean Search Bar + Aligned Options Toolbar Below */}
      <form onSubmit={handleFormSubmit} className="relative max-w-3xl mx-auto space-y-3">
        
        {/* Main Clean Search Bar */}
        <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-white dark:bg-[#121216] border-2 border-[#F1FF0A]/70 dark:border-[#F1FF0A]/40 hover:border-[#F1FF0A] focus-within:border-[#F1FF0A] focus-within:ring-4 focus-within:ring-[#F1FF0A]/25 dark:focus-within:ring-[#F1FF0A]/15 shadow-xl shadow-[#F1FF0A]/10 dark:shadow-black/70 transition-all">
          
          {/* Link Icon */}
          <div className="w-10 h-10 rounded-xl bg-[#F1FF0A] flex items-center justify-center flex-shrink-0 text-black shadow-md ml-1">
            <FaLink className="w-4 h-4" />
          </div>

          {/* Main URL Input */}
          <input
            type="text"
            id="store-url-input"
            aria-label="Store URL to extract products"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={placeholderText || 'Paste store URL (e.g. https://store.com)...'}
            disabled={isLoading}
            className="flex-1 bg-transparent text-sm sm:text-base font-medium text-neutral-950 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 outline-none px-2"
          />

          {/* Clear or Paste Button */}
          {url ? (
            <button
              type="button"
              onClick={handleClearUrl}
              disabled={isLoading}
              aria-label="Clear store URL input"
              className="p-2 rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex-shrink-0 cursor-pointer"
              title="Clear input"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePaste}
              aria-label="Paste store URL from clipboard"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-[#F1FF0A] hover:text-black dark:hover:bg-[#F1FF0A] dark:hover:text-black text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm font-semibold transition-all border border-neutral-300 dark:border-neutral-800 hover:border-[#F1FF0A] flex-shrink-0 cursor-pointer shadow-sm"
              title="Paste URL from clipboard"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Paste</span>
            </button>
          )}

          {/* Main Extract Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            aria-label="Extract products from store URL"
            className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 rounded-xl bg-[#F1FF0A] hover:bg-[#D4FF00] active:scale-[0.98] text-black text-xs sm:text-sm font-bold tracking-wide uppercase shadow-lg shadow-[#F1FF0A]/20 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer whitespace-nowrap"
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

        {/* Smart & Compact Single-Line Options Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          
          {/* Left: Product Limit Dropdown with Plan Tier Locks */}
          <div className="flex items-center gap-2">
            <label htmlFor="limit-select" className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-medium whitespace-nowrap">
              Product Limit:
            </label>
            <div className="relative">
              <select
                id="limit-select"
                aria-label="Select maximum product limit to extract"
                value={limit}
                onChange={handleLimitChange}
                disabled={isLoading}
                className="appearance-none bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 hover:border-[#F1FF0A]/70 text-neutral-900 dark:text-neutral-200 text-xs sm:text-sm font-semibold rounded-xl pl-3 pr-7 py-1.5 outline-none focus:border-[#F1FF0A] cursor-pointer shadow-xs transition-colors"
              >
                <option value={20}>20 Products (Free)</option>
                <option value={50}>
                  {userPlan.maxLimit >= 500 ? '50 Products' : '🔒 50 Products (Popular)'}
                </option>
                <option value={100}>
                  {userPlan.maxLimit >= 500 ? '100 Products' : '🔒 100 Products (Popular)'}
                </option>
                <option value={200}>
                  {userPlan.maxLimit >= 500 ? '200 Products' : '🔒 200 Products (Popular)'}
                </option>
                <option value={500}>
                  {userPlan.maxLimit >= 500 ? '500 Products (Popular)' : '🔒 500 Products (Popular)'}
                </option>
                <option value={1000}>
                  {userPlan.maxLimit >= 1000 ? '1,000 Products (Plus)' : '🔒 1,000 Products (Plus)'}
                </option>
                <option value={5000}>
                  {userPlan.maxLimit >= 5000 ? 'Unlimited (Advance)' : '🔒 Unlimited (Advance)'}
                </option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500 dark:text-neutral-400 text-[10px]">
                ▼
              </div>
            </div>
          </div>

          {/* Right: Engine Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="engine-select" className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-medium whitespace-nowrap">
              Scraper Engine:
            </label>
            <div className="relative">
              <select
                id="engine-select"
                aria-label="Select scraper engine"
                value={engine}
                onChange={(e) => setEngine(e.target.value)}
                disabled={isLoading}
                className="appearance-none bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 hover:border-[#F1FF0A]/70 text-neutral-900 dark:text-neutral-200 text-xs sm:text-sm font-semibold rounded-xl pl-3 pr-7 py-1.5 outline-none focus:border-[#F1FF0A] cursor-pointer shadow-xs transition-colors"
              >
                <option value="auto">Auto Detect</option>
                <option value="shopify">Shopify</option>
                <option value="woocommerce">WooCommerce</option>
                <option value="daraz">Daraz</option>
                <option value="zatiq">Zatiq</option>
                <option value="generic">Universal / HTML</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500 dark:text-neutral-400 text-[10px]">
                ▼
              </div>
            </div>
          </div>

        </div>

      </form>

    </div>
  );
}
