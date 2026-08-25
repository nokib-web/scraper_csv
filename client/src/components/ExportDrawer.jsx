import React, { useState } from 'react';
import { Download, Eye, Check, Copy, ShoppingBag, Globe, Sparkles, FileSpreadsheet, Code2 } from 'lucide-react';

export default function ExportDrawer({
  products = [],
  onExport,
  onInspectRaw,
  isExporting
}) {
  const [copiedFormat, setCopiedFormat] = useState(null);

  if (!products || products.length === 0) return null;

  const handleQuickCopy = async (format) => {
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products, format })
      });
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopiedFormat(format);
      setTimeout(() => setCopiedFormat(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const exportCards = [
    {
      id: 'shopify_csv',
      title: 'Shopify Product CSV',
      subtitle: 'Official Shopify Import Template with Handles, Variants & Images',
      badge: 'Shopify 100% Ready',
      badgeColor: 'bg-lime-950/60 border-lime-500/40 text-lime-300',
      icon: ShoppingBag,
      iconColor: 'text-lime-400',
      borderHover: 'hover:border-lime-500/50',
      gradient: 'from-lime-500/10 to-transparent',
      btnColor: 'bg-lime-600 hover:bg-lime-500 text-white shadow-lime-600/30'
    },
    {
      id: 'woo_csv',
      title: 'WooCommerce / WP CSV',
      subtitle: 'WordPress Standard Import Schema for WooCommerce Stores',
      badge: 'WordPress Compatible',
      badgeColor: 'bg-purple-950/60 border-purple-500/40 text-purple-300',
      icon: Globe,
      iconColor: 'text-purple-400',
      borderHover: 'hover:border-purple-500/50',
      gradient: 'from-purple-500/10 to-transparent',
      btnColor: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
    },
    {
      id: 'wix_csv',
      title: 'Wix eCommerce CSV',
      subtitle: 'Official Wix Store Product Import Multi-Row Layout',
      badge: 'Wix Store Ready',
      badgeColor: 'bg-blue-950/60 border-blue-500/40 text-blue-300',
      icon: Sparkles,
      iconColor: 'text-blue-400',
      borderHover: 'hover:border-blue-500/50',
      gradient: 'from-blue-500/10 to-transparent',
      btnColor: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
    },
    {
      id: 'universal_csv',
      title: 'Universal Clean CSV',
      subtitle: 'Clean Spreadsheet for Excel, Google Sheets, & Custom CMS',
      badge: 'Excel & Sheets',
      badgeColor: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300',
      icon: FileSpreadsheet,
      iconColor: 'text-emerald-400',
      borderHover: 'hover:border-emerald-500/50',
      gradient: 'from-emerald-500/10 to-transparent',
      btnColor: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
    },
    {
      id: 'json',
      title: 'Structured JSON Dataset',
      subtitle: 'Complete Nested JSON Object for Developers, APIs & Automations',
      badge: 'API & Dev Ready',
      badgeColor: 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300',
      icon: Code2,
      iconColor: 'text-cyan-400',
      borderHover: 'hover:border-cyan-500/50',
      gradient: 'from-cyan-500/10 to-transparent',
      btnColor: 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30'
    }
  ];

  return (
    <div className="w-full glass-panel p-6 mb-8 border-indigo-500/20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-6 border-b border-white/10">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-400" />
            <span>1-Click Multi-Platform Export Center</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Download formatted product catalogs ready to import directly into your target store.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-indigo-300 bg-indigo-950/60 px-3 py-1.5 rounded-lg border border-indigo-500/30 font-medium">
            {products.length} Products Ready
          </span>
        </div>
      </div>

      {/* Grid of Platform Exporters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {exportCards.map((card) => {
          const Icon = card.icon;
          const isCopied = copiedFormat === card.id;

          return (
            <div
              key={card.id}
              className={`glass-panel p-4 flex flex-col justify-between gap-4 border-white/10 ${card.borderHover} transition-all duration-300 bg-gradient-to-b ${card.gradient}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${card.iconColor}`} />
                  </div>
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-md border ${card.badgeColor}`}>
                    {card.badge}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mb-1">
                  {card.title}
                </h3>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {card.subtitle}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => onExport(card.id)}
                  disabled={isExporting}
                  className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${card.btnColor}`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickCopy(card.id)}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-white/5 hover:border-white/15 text-[11px] text-slate-300 flex items-center justify-center gap-1 transition"
                    title="Copy payload to clipboard"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onInspectRaw(card.id, card.title)}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-white/5 hover:border-white/15 text-[11px] text-slate-300 flex items-center justify-center gap-1 transition"
                    title="Preview formatted code"
                  >
                    <Eye className="w-3 h-3 text-slate-400" />
                    <span>Preview</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
