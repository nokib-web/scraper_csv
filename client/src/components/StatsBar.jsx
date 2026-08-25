import React from 'react';
import { Package, Layers, DollarSign, Image as ImageIcon, Cpu, CheckCircle } from 'lucide-react';

export default function StatsBar({ products = [], platform = 'auto' }) {
  if (!products || products.length === 0) return null;

  const totalProducts = products.length;
  const totalVariants = products.reduce((acc, p) => acc + (p.variants?.length || 1), 0);
  const totalImages = products.reduce((acc, p) => acc + (p.images?.length || 0), 0);

  const prices = products.map(p => p.price).filter(p => typeof p === 'number' && !isNaN(p) && p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const avgPrice = prices.length > 0 ? (prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
  const currency = products[0]?.currency || 'USD';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {/* Total Products */}
      <div className="glass-panel p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
          <Package className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Products
          </span>
          <span className="text-xl font-extrabold text-white">
            {totalProducts}
          </span>
        </div>
      </div>

      {/* Total Variants */}
      <div className="glass-panel p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
          <Layers className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Variants
          </span>
          <span className="text-xl font-extrabold text-white">
            {totalVariants}
          </span>
        </div>
      </div>

      {/* Price Range */}
      <div className="glass-panel p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
          <DollarSign className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Avg / Range
          </span>
          <span className="text-sm font-bold text-emerald-400">
            ${minPrice.toFixed(0)} - ${maxPrice.toFixed(0)}
          </span>
          <span className="text-[10px] text-slate-400 block">Avg: ${avgPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* Total Images */}
      <div className="glass-panel p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
          <ImageIcon className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Product Images
          </span>
          <span className="text-xl font-extrabold text-white">
            {totalImages}
          </span>
        </div>
      </div>

      {/* Engine Platform */}
      <div className="glass-panel p-4 flex items-center gap-3 col-span-2 sm:col-span-3 lg:col-span-1">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
          <Cpu className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Engine Source
          </span>
          <span className="text-sm font-extrabold text-amber-300 capitalize">
            {platform || 'Detected'}
          </span>
        </div>
      </div>
    </div>
  );
}
