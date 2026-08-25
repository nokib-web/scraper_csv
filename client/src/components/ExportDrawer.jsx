import React, { useState } from 'react';
import { Download, FileSpreadsheet, Code, Check, FileText } from 'lucide-react';

export default function ExportDrawer({ products, onExport, stats }) {
  const [downloadingFormat, setDownloadingFormat] = useState(null);

  const handleDownload = async (format) => {
    setDownloadingFormat(format);
    await onExport(format);
    setTimeout(() => setDownloadingFormat(null), 1200);
  };

  const platforms = [
    {
      id: 'shopify',
      title: 'Shopify Product CSV',
      badge: 'Official Template',
      desc: 'Handles, multi-row images, variants & tags for Shopify Import',
      icon: (
        <svg className="w-5 h-5 text-[#95BF47]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.34 7.24c-.04-.26-.23-.46-.48-.5-.26-.03-2.6-.2-2.6-.2s-1.72-1.72-1.9-1.9c-.18-.18-.54-.12-.68.02l-.96 8.52 4.14 1.25 2.48-7.19zm-5.7-2.3c-.02 0-.05.02-.07.03L9.75 6.8c-.37.13-.64.44-.71.82L7.26 17.5l6.38 1.9 2.04-14.46zm-5.02 2.37L3.8 8.64c-.45.16-.76.6-.76 1.08v.17l4.38 1.34 1.2-3.92zm6.66 11.2l-6.42-1.92-2.4 2.8c-.28.32-.2.82.16 1.04.14.08.3.13.46.13.19 0 .37-.06.53-.19l7.67-1.86zm4.84-2.12l-2.61-7.58-1.57 9.87 3.73-1.07c.36-.1.6-.44.55-.82-.02-.14-.05-.28-.1-.4z"/>
        </svg>
      )
    },
    {
      id: 'woocommerce',
      title: 'WooCommerce / WP CSV',
      badge: 'WordPress Ready',
      desc: 'Standard schema with SKU, stock, regular & sale price columns',
      icon: (
        <svg className="w-5 h-5 text-[#7F54B3]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.5 6C1.12 6 0 7.12 0 8.5v7C0 16.88 1.12 18 2.5 18h19c1.38 0 2.5-1.12 2.5-2.5v-7C24 7.12 22.88 6 21.5 6h-19zm2.8 3.5h2.1l1.5 4.5 1.5-4.5h2.1l-2.6 6.5h-2l-2.6-6.5zm8.4 0h2.1l1.5 4.5 1.5-4.5h2.1l-2.6 6.5h-2l-2.6-6.5z"/>
        </svg>
      )
    },
    {
      id: 'wix',
      title: 'Wix eCommerce CSV',
      badge: 'Wix Store Ready',
      desc: 'Official Wix multi-row variant structure & image gallery layout',
      icon: (
        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.2 6.5l-2.7 11h-2.9l-1.9-7.7-1.9 7.7H7.9L5.2 6.5h2.8l1.4 7.7 1.9-7.7h2.8l1.9 7.7 1.4-7.7h2.8z"/>
        </svg>
      )
    },
    {
      id: 'universal',
      title: 'Universal Clean CSV',
      badge: 'Excel & Sheets',
      desc: 'Clean, flat spreadsheet format for Google Sheets, Excel & ERP',
      icon: <FileSpreadsheet className="w-5 h-5 text-[#107C41]" />
    },
    {
      id: 'json',
      title: 'Structured JSON Dataset',
      badge: 'API & Devs',
      desc: 'Complete hierarchical product JSON object for custom pipelines',
      icon: <Code className="w-5 h-5 text-[#F1FF0A]" />
    }
  ];

  if (!products || products.length === 0) return null;

  return (
    <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/80 pb-3.5">
        <div>
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-[#F1FF0A]" />
            <span>1-Click Platform Export</span>
          </h3>
          <p className="text-xs text-neutral-400">
            Export {products.length} products formatted specifically for your target e-commerce platform.
          </p>
        </div>
        <div className="text-xs font-semibold text-[#F1FF0A] bg-[#F1FF0A]/10 border border-[#F1FF0A]/20 px-3 py-1 rounded-full self-start sm:self-auto">
          {products.length} Products Ready
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {platforms.map((p) => {
          const isDownloading = downloadingFormat === p.id;
          return (
            <button
              key={p.id}
              onClick={() => handleDownload(p.id)}
              disabled={Boolean(downloadingFormat)}
              className="p-4 rounded-xl bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800 hover:border-[#F1FF0A]/40 text-left transition-all group active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-black border border-neutral-800 group-hover:border-[#F1FF0A]/30 transition-colors">
                  {p.icon}
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 group-hover:text-white transition-colors">
                  {p.badge}
                </span>
              </div>

              <div className="text-xs font-extrabold text-white group-hover:text-[#F1FF0A] transition-colors flex items-center justify-between">
                <span>{p.title}</span>
                {isDownloading ? (
                  <Check className="w-3.5 h-3.5 text-[#F1FF0A] animate-bounce" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-neutral-500 group-hover:text-[#F1FF0A] transition-colors" />
                )}
              </div>

              <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed line-clamp-2">
                {p.desc}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
