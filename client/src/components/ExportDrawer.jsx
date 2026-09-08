import React, { useState } from 'react';
import { Download, Eye, Check, Package, Store, FolderTree, Layers, LayoutTemplate, X, TrendingUp, Image as ImageIcon, Replace, CheckSquare } from 'lucide-react';
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
  onCustomVendorChange,
  customCategory = '',
  onCustomCategoryChange,
  customType = '',
  onCustomTypeChange,
  customTemplate = '',
  onCustomTemplateChange,
  priceMarkup = { type: 'none', value: 0 },
  onPriceMarkupChange,
  maxImages = 0,
  onMaxImagesChange,
  onOpenFindReplace,
  selectedCount = 0,
  onSelectAll,
  onClearSelection
}) {
  const [downloadingFormat, setDownloadingFormat] = useState(null);

  const handleDownload = async (format) => {
    setDownloadingFormat(format);
    await onExport(format, defaultStock, customVendor, customCategory, customType, customTemplate);
    setTimeout(() => setDownloadingFormat(null), 1200);
  };

  const platforms = [
    {
      id: 'shopify',
      title: 'Shopify CSV',
      badge: 'Official',
      icon: <SiShopify className="w-4 h-4 text-[#95BF47]" aria-label="Shopify" aria-hidden="true" />
    },
    {
      id: 'woocommerce',
      title: 'WooCommerce',
      badge: 'WP Ready',
      icon: <SiWoocommerce className="w-4 h-4 text-[#96588A]" aria-label="WooCommerce" aria-hidden="true" />
    },
    {
      id: 'wix',
      title: 'Wix Store',
      badge: 'Wix CSV',
      icon: <SiWix className="w-4 h-4 text-white dark:text-white light:text-black" aria-label="Wix" aria-hidden="true" />
    },
    {
      id: 'universal',
      title: 'Clean CSV',
      badge: 'Excel / Sheets',
      icon: <FaFileCsv className="w-4 h-4 text-emerald-400" aria-label="CSV" aria-hidden="true" />
    },
    {
      id: 'json',
      title: 'Structured JSON',
      badge: 'API / Raw',
      icon: <VscJson className="w-4 h-4 text-[#F1FF0A]" aria-label="JSON" aria-hidden="true" />
    }
  ];

  if (!products || products.length === 0) return null;

  return (
    <div className="p-3 rounded-2xl bg-white/95 dark:bg-neutral-950/95 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-2.5">
      
      {/* Top Header & Selection Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1.5 border-b border-neutral-200/80 dark:border-neutral-800/80">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-neutral-900 dark:text-white tracking-wide uppercase">
            Export Platform Format
          </span>
          
          {selectedCount > 0 ? (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F1FF0A] text-black font-extrabold text-[11px] shadow-sm animate-in fade-in duration-200">
              <CheckSquare className="w-3 h-3 stroke-[2.5]" />
              <span>{selectedCount} Selected for Export</span>
              <button
                type="button"
                onClick={onClearSelection}
                className="hover:bg-black/10 rounded-full p-0.5 ml-0.5 cursor-pointer"
                title="Deselect and export all products"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <span className="text-[10px] font-extrabold text-[#8b9900] dark:text-[#F1FF0A] bg-[#F1FF0A]/10 border border-[#F1FF0A]/30 px-2 py-0.5 rounded-full">
              All {products.length} Ready
            </span>
          )}
        </div>

        {/* Find & Replace Launch Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenFindReplace}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-[#F1FF0A] hover:text-black border border-neutral-300 dark:border-neutral-800 text-xs font-bold text-neutral-800 dark:text-neutral-200 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Search & replace words, brands, links in titles and descriptions"
          >
            <Replace className="w-3.5 h-3.5" />
            <span>Find & Replace</span>
          </button>
        </div>
      </div>

      {/* Ultra-Compact Single-Row Power Tools Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2 pt-0.5">
        
        {/* 1. Vendor Override */}
        <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-900/90 px-2 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 min-h-[38px]">
          <Store className="w-3.5 h-3.5 text-[#8b9900] dark:text-[#F1FF0A] flex-shrink-0" />
          <span className="font-bold text-[11px] text-neutral-600 dark:text-neutral-400 whitespace-nowrap">Vendor:</span>
          <div className="relative flex-1 flex items-center min-w-0">
            <input
              type="text"
              value={customVendor}
              onChange={(e) => onCustomVendorChange && onCustomVendorChange(e.target.value)}
              placeholder="Original"
              className="w-full px-2 py-0.5 text-xs font-semibold rounded-lg bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 outline-none focus:border-[#F1FF0A]"
            />
            {customVendor && (
              <button
                type="button"
                onClick={() => onCustomVendorChange && onCustomVendorChange('')}
                className="absolute right-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white p-0.5 cursor-pointer"
                title="Reset to original vendor"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* 2. Category Override / Default */}
        <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-900/90 px-2 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 min-h-[38px]">
          <FolderTree className="w-3.5 h-3.5 text-[#8b9900] dark:text-[#F1FF0A] flex-shrink-0" />
          <span className="font-bold text-[11px] text-neutral-600 dark:text-neutral-400 whitespace-nowrap">Category:</span>
          <div className="relative flex-1 flex items-center min-w-0">
            <input
              type="text"
              value={customCategory}
              onChange={(e) => onCustomCategoryChange && onCustomCategoryChange(e.target.value)}
              placeholder="Original"
              className="w-full px-2 py-0.5 text-xs font-semibold rounded-lg bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 outline-none focus:border-[#F1FF0A]"
            />
            {customCategory && (
              <button
                type="button"
                onClick={() => onCustomCategoryChange && onCustomCategoryChange('')}
                className="absolute right-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white p-0.5 cursor-pointer"
                title="Reset to original categories"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* 3. Product Type Override */}
        <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-900/90 px-2 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 min-h-[38px]">
          <Layers className="w-3.5 h-3.5 text-[#8b9900] dark:text-[#F1FF0A] flex-shrink-0" />
          <span className="font-bold text-[11px] text-neutral-600 dark:text-neutral-400 whitespace-nowrap">Type:</span>
          <div className="relative flex-1 flex items-center min-w-0">
            <input
              type="text"
              value={customType}
              onChange={(e) => onCustomTypeChange && onCustomTypeChange(e.target.value)}
              placeholder="Original"
              className="w-full px-2 py-0.5 text-xs font-semibold rounded-lg bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 outline-none focus:border-[#F1FF0A]"
            />
            {customType && (
              <button
                type="button"
                onClick={() => onCustomTypeChange && onCustomTypeChange('')}
                className="absolute right-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white p-0.5 cursor-pointer"
                title="Reset to original product type"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* 4. Template Suffix */}
        <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-900/90 px-2 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 min-h-[38px]">
          <LayoutTemplate className="w-3.5 h-3.5 text-[#8b9900] dark:text-[#F1FF0A] flex-shrink-0" />
          <span className="font-bold text-[11px] text-neutral-600 dark:text-neutral-400 whitespace-nowrap">Template:</span>
          <div className="relative flex-1 flex items-center min-w-0">
            <input
              type="text"
              value={customTemplate}
              onChange={(e) => onCustomTemplateChange && onCustomTemplateChange(e.target.value)}
              placeholder="Default"
              className="w-full px-2 py-0.5 text-xs font-semibold font-mono rounded-lg bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 outline-none focus:border-[#F1FF0A]"
            />
            {customTemplate && (
              <button
                type="button"
                onClick={() => onCustomTemplateChange && onCustomTemplateChange('')}
                className="absolute right-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white p-0.5 cursor-pointer"
                title="Reset to default template"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <select
            value={['', 'book', 'food', 'pre-order', 'custom-layout', 'gift-card', 'bundle', 'coming-soon'].includes(customTemplate) ? customTemplate : 'custom'}
            onChange={(e) => {
              if (e.target.value !== 'custom') {
                onCustomTemplateChange && onCustomTemplateChange(e.target.value);
              }
            }}
            className="w-16 px-1 py-0.5 text-[10px] font-semibold font-mono rounded-lg bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 outline-none cursor-pointer truncate"
          >
            <option value="">Default</option>
            <option value="book">book</option>
            <option value="food">food</option>
            <option value="pre-order">pre-order</option>
            <option value="custom-layout">custom</option>
            <option value="gift-card">gift-card</option>
            <option value="bundle">bundle</option>
            <option value="coming-soon">coming-soon</option>
            <option value="custom">Other</option>
          </select>
        </div>

        {/* 3. Default Stock */}
        <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-900/90 px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 min-h-[38px]">
          <Package className="w-3.5 h-3.5 text-[#8b9900] dark:text-[#F1FF0A] flex-shrink-0" />
          <span className="font-bold text-[11px] text-neutral-600 dark:text-neutral-400 whitespace-nowrap">Stock:</span>
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
            className="w-12 px-1 py-0.5 text-center font-bold text-xs rounded-lg bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white outline-none focus:border-[#F1FF0A]"
          />
          <select
            value={[10, 50, 99, 100, 500].includes(Number(defaultStock)) ? Number(defaultStock) : 'custom'}
            onChange={(e) => {
              if (e.target.value !== 'custom') {
                onDefaultStockChange && onDefaultStockChange(Number(e.target.value));
              }
            }}
            className="flex-1 min-w-0 px-1.5 py-0.5 text-[11px] font-semibold rounded-lg bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 outline-none cursor-pointer truncate"
          >
            <option value={99}>Preset: 99</option>
            <option value={10}>Preset: 10</option>
            <option value={50}>Preset: 50</option>
            <option value={100}>Preset: 100</option>
            <option value={500}>Preset: 500</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {/* 4. Price Markup */}
        <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-900/90 px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 min-h-[38px]">
          <TrendingUp className="w-3.5 h-3.5 text-[#8b9900] dark:text-[#F1FF0A] flex-shrink-0" />
          <span className="font-bold text-[11px] text-neutral-600 dark:text-neutral-400 whitespace-nowrap">Markup:</span>
          <input
            type="number"
            min="0"
            step="any"
            value={priceMarkup?.value || ''}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '') {
                onPriceMarkupChange && onPriceMarkupChange({ type: 'none', value: 0 });
              } else {
                onPriceMarkupChange && onPriceMarkupChange({
                  type: priceMarkup?.type === 'fixed' ? 'fixed' : 'percent',
                  value: parseFloat(val) || 0
                });
              }
            }}
            placeholder="0"
            className="w-12 px-1 py-0.5 text-center font-bold text-xs rounded-lg bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white outline-none focus:border-[#F1FF0A]"
          />
          <select
            value={
              priceMarkup?.type === 'none' || !priceMarkup?.value
                ? 'none'
                : (priceMarkup.type === 'percent' ? `pct_${priceMarkup.value}` : `fix_${priceMarkup.value}`)
            }
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'none') {
                onPriceMarkupChange && onPriceMarkupChange({ type: 'none', value: 0 });
              } else if (val.startsWith('pct_')) {
                const num = parseFloat(val.replace('pct_', ''));
                onPriceMarkupChange && onPriceMarkupChange({ type: 'percent', value: num });
              } else if (val.startsWith('fix_')) {
                const num = parseFloat(val.replace('fix_', ''));
                onPriceMarkupChange && onPriceMarkupChange({ type: 'fixed', value: num });
              }
            }}
            className="flex-1 min-w-0 px-1.5 py-0.5 text-[11px] font-semibold rounded-lg bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 outline-none cursor-pointer truncate"
          >
            <option value="none">None (0%)</option>
            <option value="pct_10">+10%</option>
            <option value="pct_20">+20%</option>
            <option value="pct_30">+30%</option>
            <option value="pct_50">+50%</option>
            <option value="pct_100">+100%</option>
            <option value="fix_5">+$5 Fixed</option>
            <option value="fix_10">+$10 Fixed</option>
          </select>
        </div>

        {/* 5. Images Limit */}
        <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-900/90 px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 min-h-[38px]">
          <ImageIcon className="w-3.5 h-3.5 text-[#8b9900] dark:text-[#F1FF0A] flex-shrink-0" />
          <span className="font-bold text-[11px] text-neutral-600 dark:text-neutral-400 whitespace-nowrap">Images:</span>
          <input
            type="number"
            min="0"
            max="100"
            value={maxImages === 0 ? '' : maxImages}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '') {
                onMaxImagesChange && onMaxImagesChange(0);
              } else {
                onMaxImagesChange && onMaxImagesChange(Math.max(0, parseInt(val, 10) || 0));
              }
            }}
            placeholder="All"
            className="w-12 px-1 py-0.5 text-center font-bold text-xs rounded-lg bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white outline-none focus:border-[#F1FF0A]"
          />
          <select
            value={[0, 1, 3, 5, 10].includes(Number(maxImages)) ? Number(maxImages) : 'custom'}
            onChange={(e) => {
              if (e.target.value !== 'custom') {
                onMaxImagesChange && onMaxImagesChange(Number(e.target.value));
              }
            }}
            className="flex-1 min-w-0 px-1.5 py-0.5 text-[11px] font-semibold rounded-lg bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 outline-none cursor-pointer truncate"
          >
            <option value={0}>All Photos</option>
            <option value={1}>1 (Main only)</option>
            <option value={3}>3 Max</option>
            <option value={5}>5 Max</option>
            <option value={10}>10 Max</option>
            <option value="custom">Custom</option>
          </select>
        </div>

      </div>

      {/* Grid of Platform Download Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-0.5">
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
                  title={`Download ${p.title} (${selectedCount > 0 ? `${selectedCount} Selected` : 'All'})`}
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
