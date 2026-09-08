import React, { useState, useMemo } from 'react';
import { X, Search, Replace, Check } from 'lucide-react';

export default function FindReplaceModal({ isOpen, onClose, products, onApplyReplace }) {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchTitle, setMatchTitle] = useState(true);
  const [matchDescription, setMatchDescription] = useState(true);
  const [matchVendor, setMatchVendor] = useState(false);
  const [matchCategory, setMatchCategory] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Calculate live match statistics
  const matchStats = useMemo(() => {
    if (!findText.trim() || !products || products.length === 0) {
      return { totalMatches: 0, matchingProductsCount: 0 };
    }

    const flags = caseSensitive ? 'g' : 'gi';
    let regex;
    try {
      const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      regex = new RegExp(escaped, flags);
    } catch (e) {
      return { totalMatches: 0, matchingProductsCount: 0 };
    }

    let totalMatches = 0;
    let matchingProductsCount = 0;

    for (const p of products) {
      let prodMatches = 0;
      if (matchTitle && p.title) {
        const m = p.title.match(regex);
        if (m) prodMatches += m.length;
      }
      if (matchDescription && p.description) {
        const m = p.description.match(regex);
        if (m) prodMatches += m.length;
      }
      if (matchVendor && p.vendor) {
        const m = p.vendor.match(regex);
        if (m) prodMatches += m.length;
      }
      if (matchCategory && (p.product_type || p.category)) {
        const cat = p.product_type || p.category;
        const m = cat.match(regex);
        if (m) prodMatches += m.length;
      }

      if (prodMatches > 0) {
        matchingProductsCount++;
        totalMatches += prodMatches;
      }
    }

    return { totalMatches, matchingProductsCount };
  }, [findText, matchTitle, matchDescription, matchVendor, matchCategory, caseSensitive, products]);

  if (!isOpen) return null;

  const handleExecuteReplace = () => {
    if (!findText.trim()) return;

    onApplyReplace({
      findText,
      replaceText,
      matchTitle,
      matchDescription,
      matchVendor,
      matchCategory,
      caseSensitive
    });

    setSuccessMessage(`Successfully replaced ${matchStats.totalMatches} occurrence(s) in ${matchStats.matchingProductsCount} product(s)!`);
    setTimeout(() => {
      setSuccessMessage('');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#121216] border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#F1FF0A]/10 border border-[#F1FF0A]/30 text-[#8b9900] dark:text-[#F1FF0A]">
              <Replace className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">
                Find & Replace Across Catalog
              </h3>
              <p className="text-[11px] text-neutral-500">
                Replace store names, brands, or text in titles and descriptions
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs">
          
          {/* Find Input */}
          <div className="space-y-1.5">
            <label className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
              <span>Find Text / URL / Store Name:</span>
              {findText.trim() && (
                <span className="text-[11px] font-bold text-[#8b9900] dark:text-[#F1FF0A]">
                  {matchStats.totalMatches} matches in {matchStats.matchingProductsCount} products
                </span>
              )}
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                placeholder="e.g. OldBrand, http://oldlink.com, etc."
                className="w-full pl-9 pr-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none focus:border-[#F1FF0A] font-mono text-xs"
                autoFocus
              />
            </div>
          </div>

          {/* Replace Input */}
          <div className="space-y-1.5">
            <label className="font-bold text-neutral-700 dark:text-neutral-300">
              Replace With:
            </label>
            <div className="relative">
              <Replace className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder="e.g. MyBrandName (leave empty to delete found text)"
                className="w-full pl-9 pr-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none focus:border-[#F1FF0A] font-mono text-xs"
              />
            </div>
          </div>

          {/* Scope Checkboxes */}
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Search Scope & Options:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={matchTitle}
                  onChange={(e) => setMatchTitle(e.target.checked)}
                  className="rounded text-[#F1FF0A] focus:ring-[#F1FF0A]"
                />
                <span>Product Titles</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={matchDescription}
                  onChange={(e) => setMatchDescription(e.target.checked)}
                  className="rounded text-[#F1FF0A] focus:ring-[#F1FF0A]"
                />
                <span>Descriptions</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={matchVendor}
                  onChange={(e) => setMatchVendor(e.target.checked)}
                  className="rounded text-[#F1FF0A] focus:ring-[#F1FF0A]"
                />
                <span>Vendors / Brands</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={matchCategory}
                  onChange={(e) => setMatchCategory(e.target.checked)}
                  className="rounded text-[#F1FF0A] focus:ring-[#F1FF0A]"
                />
                <span>Categories</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none col-span-2 pt-1 border-t border-neutral-200 dark:border-neutral-800/80">
                <input
                  type="checkbox"
                  checked={caseSensitive}
                  onChange={(e) => setCaseSensitive(e.target.checked)}
                  className="rounded text-[#F1FF0A] focus:ring-[#F1FF0A]"
                />
                <span>Case Sensitive Match</span>
              </label>
            </div>
          </div>

          {/* Feedback message */}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2 text-xs">
              <Check className="w-4 h-4" />
              <span>{successMessage}</span>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300 font-semibold hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExecuteReplace}
            disabled={!findText.trim() || matchStats.totalMatches === 0}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#F1FF0A] hover:bg-[#D4FF00] disabled:opacity-40 disabled:hover:bg-[#F1FF0A] text-black font-extrabold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Replace className="w-4 h-4 stroke-[2.5]" />
            <span>Replace All ({matchStats.totalMatches})</span>
          </button>
        </div>

      </div>
    </div>
  );
}
