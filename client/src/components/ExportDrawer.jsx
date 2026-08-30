import React, { useState } from 'react';
import { Download, Eye, Check, Package, Store, X } from 'lucide-react';
import { SiShopify, SiWoocommerce, SiWix } from 'react-icons/si';
import { FaFileCsv } from 'react-icons/fa';
import { VscJson } from 'react-icons/vsc';

export default function ExportDrawer({ 
  products, 
  onExport, 
  onOpenPreview, 
  stats, 
  defaultStock = 99, 
  onDefaultStockChange,
  customVendor = '',
  onCustomVendorChange
}) {
  const [downloadingFormat, setDownloadingFormat] = useState(null);

  const handleDownload = async (format) => {
    setDownloadingFormat(format);
    await onExport(format, defaultStock, customVendor);
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

  const stockPresets = [10, 50, 99, 100, 500];

  return (
    <div className="p-3 rounded-xl bg-white/90 dark:bg-neutral-950/90 border border-neutral-200 dark:border-neutral-800 shadow-lg space-y-3">
      {/* Header & Export Customization Toolbar (Stock & Vendor) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-1 pb-1 border-b border-neutral-200/80 dark:border-neutral-800/80">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-neutral-900 dark:text-white tracking-wide uppercase">
            Export Platform Format
          </span>
          <span className="text-[10px] font-extrabold text-[#8b9900] dark:text-[#F1FF0A] bg-[#F1FF0A]/10 border border-[#F1FF0A]/30 px-2 py-0.5 rounded-full">
            {products.length} Ready
          </span>
        </div>

        {/* Customization Controls: Vendor & Stock */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          
          {/* Custom Vendor / Brand Override */}
          <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-900 px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <Store className="w-3.5 h-3.5 text-[#8b9900] dark:text-[#F1FF0A] flex-shrink-0" />
            <span className="font-semibold text-[11px] text-neutral-600 dark:text-neutral-400 whitespace-nowrap">Vendor:</span>
            <div className="relative flex items-center">
              <input
                type="text"
                value={customVendor}
                onChange={(e) => onCustomVendorChange && onCustomVendorChange(e.target.value)}
                placeholder="As scraped (Original)"
                className="w-32 sm:w-40 px-1.5 py-0.5 text-xs font-medium rounded bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 outline-none focus:border-[#F1FF0A]"
                title="Type a brand/store name to override Vendor in the exported CSV (or leave empty for original scraped brand)"
              />
              {customVendor && (
                <button
                  type="button"
                  onClick={() => onCustomVendorChange && onCustomVendorChange('')}
                  className="absolute right-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white p-0.5"
                  title="Reset to original vendor"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Default Stock Quantity Customization */}
          <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-900 px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <Package className="w-3.5 h-3.5 text-[#8b9900] dark:text-[#F1FF0A] flex-shrink-0" />
            <span className="font-semibold text-[11px] text-neutral-600 dark:text-neutral-400 whitespace-nowrap">Stock:</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="999999"
                value={defaultStock}
                onChange={(e) => onDefaultStockChange && onDefaultStockChange(e.target.value)}
                onBlur={() => {
                  if (defaultStock === '' || isNaN(Number(defaultStock))) {
                    onDefaultStockChange && onDefaultStockChange(99);
                  }
                }}
                placeholder="99"
                className="w-14 px-1 py-0.5 text-center font-bold text-xs rounded bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white outline-none focus:border-[#F1FF0A]"
                title="Fallback stock quantity for products where scraped site hides exact inventory"
              />

              {/* Quick Presets */}
              <div className="hidden sm:flex items-center gap-1">
                {stockPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onDefaultStockChange && onDefaultStockChange(preset)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                      Number(defaultStock) === preset
                        ? 'bg-[#F1FF0A] text-black shadow-sm'
                        : 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                    title={`Set stock to ${preset}`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Compact Grid of Streamlined Export Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {platforms.map((p) => {
          const isDownloading = downloadingFormat === p.id;
          return (
            <div
              key={p.id}
              className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 hover:border-[#F1FF0A]/50 transition-all flex flex-col justify-between gap-2 group shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 flex-shrink-0">
                    {p.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                      {p.title}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Preview & Download */}
              <div className="flex items-center gap-1.5 pt-1 border-t border-neutral-200 dark:border-neutral-800/60">
                <button
                  type="button"
                  onClick={() => onOpenPreview(p.id)}
                  className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-[11px] font-semibold text-neutral-800 dark:text-neutral-300 transition-colors cursor-pointer"
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
