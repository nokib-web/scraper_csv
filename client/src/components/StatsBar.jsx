import React from 'react';
import { Package, Layers, DollarSign, Image, Cpu } from 'lucide-react';

export default function StatsBar({ stats, detection }) {
  if (!stats || stats.totalProducts === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Total Products */}
      <div className="p-4 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center gap-3.5 shadow-sm">
        <div className="p-2.5 rounded-lg bg-[#F1FF0A]/10 border border-[#F1FF0A]/20 text-[#8b9900] dark:text-[#F1FF0A]">
          <Package className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            {stats.totalProducts}
          </div>
          <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Total Products</div>
        </div>
      </div>

      {/* Total Variants */}
      <div className="p-4 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center gap-3.5 shadow-sm">
        <div className="p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            {stats.totalVariants}
          </div>
          <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Total Variants</div>
        </div>
      </div>

      {/* Price Range */}
      <div className="p-4 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center gap-3.5 shadow-sm">
        <div className="p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300">
          <DollarSign className="w-5 h-5" />
        </div>
        <div>
          <div className="text-sm font-bold text-neutral-900 dark:text-white tracking-tight truncate max-w-[130px]">
            {stats.currencySymbol || '$'}{stats.minPrice} - {stats.currencySymbol || '$'}{stats.maxPrice}
          </div>
          <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Price Range</div>
        </div>
      </div>

      {/* Images Found */}
      <div className="p-4 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center gap-3.5 shadow-sm">
        <div className="p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300">
          <Image className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            {stats.totalImages}
          </div>
          <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Photos Extracted</div>
        </div>
      </div>

      {/* Detected Platform */}
      <div className="p-4 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 col-span-2 sm:col-span-1 flex items-center gap-3.5 shadow-sm">
        <div className="p-2.5 rounded-lg bg-[#F1FF0A]/10 border border-[#F1FF0A]/20 text-[#8b9900] dark:text-[#F1FF0A]">
          <Cpu className="w-5 h-5" />
        </div>
        <div>
          <div className="text-sm font-bold text-[#8b9900] dark:text-[#F1FF0A] uppercase tracking-wide truncate">
            {detection?.platform || stats.engineSource || 'Auto'}
          </div>
          <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Engine Source</div>
        </div>
      </div>

    </div>
  );
}
