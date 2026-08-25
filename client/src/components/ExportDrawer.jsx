import React, { useState } from 'react';
import { Download, Eye, Check } from 'lucide-react';
import { SiShopify, SiWoocommerce, SiWix } from 'react-icons/si';
import { FaFileCsv } from 'react-icons/fa';
import { VscJson } from 'react-icons/vsc';

export default function ExportDrawer({ products, onExport, onOpenPreview, stats }) {
  const [downloadingFormat, setDownloadingFormat] = useState(null);

  const handleDownload = async (format) => {
    setDownloadingFormat(format);
    await onExport(format);
    setTimeout(() => setDownloadingFormat(null), 1200);
  };

  const platforms = [
    {
      id: 'shopify',
      title: 'Shopify CSV',
      badge: 'Official',
      icon: <SiShopify className="w-4 h-4 text-[#95BF47]" />
    },
    {
      id: 'woocommerce',
      title: 'WooCommerce',
      badge: 'WP Ready',
      icon: <SiWoocommerce className="w-4 h-4 text-[#96588A]" />
    },
    {
      id: 'wix',
      title: 'Wix Store',
      badge: 'Wix CSV',
      icon: <SiWix className="w-4 h-4 text-white dark:text-white light:text-black" />
    },
    {
      id: 'universal',
      title: 'Clean CSV',
      badge: 'Excel / Sheets',
      icon: <FaFileCsv className="w-4 h-4 text-emerald-400" />
    },
    {
      id: 'json',
      title: 'Structured JSON',
      badge: 'API / Raw',
      icon: <VscJson className="w-4 h-4 text-[#F1FF0A]" />
    }
  ];

  if (!products || products.length === 0) return null;

  return (
    <div className="p-3 rounded-xl bg-neutral-950/90 dark:bg-neutral-950/90 light:bg-white border border-neutral-800 dark:border-neutral-800 light:border-neutral-200 shadow-lg space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white dark:text-white light:text-neutral-900 tracking-wide uppercase">
            Export Platform Format
          </span>
          <span className="text-[10px] font-extrabold text-[#F1FF0A] bg-[#F1FF0A]/10 border border-[#F1FF0A]/20 px-2 py-0.5 rounded-full">
            {products.length} Ready
          </span>
        </div>
      </div>

      {/* Compact Grid of Streamlined Export Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {platforms.map((p) => {
          const isDownloading = downloadingFormat === p.id;
          return (
            <div
              key={p.id}
              className="p-2.5 rounded-xl bg-neutral-900/80 dark:bg-neutral-900/80 light:bg-neutral-50 border border-neutral-800 dark:border-neutral-800 light:border-neutral-200 hover:border-[#F1FF0A]/50 transition-all flex flex-col justify-between gap-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-black dark:bg-black light:bg-white border border-neutral-800 dark:border-neutral-800 light:border-neutral-200 flex-shrink-0">
                    {p.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white dark:text-white light:text-neutral-900 truncate">
                      {p.title}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Preview & Download */}
              <div className="flex items-center gap-1.5 pt-1 border-t border-neutral-800/60 dark:border-neutral-800/60 light:border-neutral-200">
                <button
                  type="button"
                  onClick={() => onOpenPreview(p.id)}
                  className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-neutral-800 dark:bg-neutral-800 light:bg-neutral-200 hover:bg-neutral-700 text-[11px] font-semibold text-neutral-300 dark:text-neutral-300 light:text-neutral-800 transition-colors cursor-pointer"
                  title={`Preview ${p.title}`}
                >
                  <Eye className="w-3 h-3" />
                  <span>Preview</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload(p.id)}
                  disabled={Boolean(downloadingFormat)}
                  className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-[#F1FF0A] hover:bg-[#D4FF00] text-black text-[11px] font-extrabold transition-all active:scale-[0.98] cursor-pointer"
                  title={`Download ${p.title}`}
                >
                  {isDownloading ? (
                    <Check className="w-3 h-3 stroke-[3]" />
                  ) : (
                    <Download className="w-3 h-3 stroke-[2.5]" />
                  )}
                  <span>Export</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
