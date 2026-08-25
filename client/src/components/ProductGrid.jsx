import React from 'react';
import { Trash2, ExternalLink, Tag, Layers, Image as ImageIcon, Edit2 } from 'lucide-react';

export default function ProductGrid({
  products = [],
  onDeleteProduct,
  onEditProduct
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product, idx) => {
        const mainImage = product.images?.[0]?.src || '';
        const imageCount = product.images?.length || 0;
        const variantCount = product.variants?.length || 1;

        return (
          <div
            key={product.id || idx}
            className="glass-panel group overflow-hidden flex flex-col hover:border-indigo-500/40 hover:-translate-y-1 transition-all duration-300 relative"
          >
            {/* Thumbnail Header */}
            <div className="relative w-full h-48 bg-slate-950/80 overflow-hidden flex items-center justify-center border-b border-white/5">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={product.title}
                  loading="lazy"
                  className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/400x400/111827/94a3b8?text=No+Image';
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-600">
                  <ImageIcon className="w-8 h-8 mb-1" />
                  <span className="text-xs">No image available</span>
                </div>
              )}

              {/* Badges on Image */}
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {product.product_type && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-900/90 text-indigo-300 border border-indigo-500/30 rounded-md backdrop-blur-md">
                    {product.product_type}
                  </span>
                )}
              </div>

              <div className="absolute top-2 right-2 flex items-center gap-1">
                {imageCount > 1 && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-950/80 text-cyan-300 rounded-md border border-cyan-500/30 flex items-center gap-1 backdrop-blur-md">
                    <ImageIcon className="w-3 h-3" />
                    {imageCount}
                  </span>
                )}
                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => onDeleteProduct(product.id)}
                  title="Remove from export"
                  className="w-7 h-7 rounded-md bg-slate-900/80 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 flex items-center justify-center transition backdrop-blur-md"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Price Pill */}
              <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-indigo-950/90 border border-indigo-500/40 text-white font-extrabold text-sm backdrop-blur-md shadow-lg shadow-indigo-950/60">
                ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
                {product.regular_price > product.price && (
                  <span className="ml-1.5 text-xs text-slate-400 line-through font-normal">
                    ${product.regular_price.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Content Body */}
            <div className="p-4 flex-1 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1 font-medium">
                  <span className="truncate max-w-[150px]">{product.vendor || 'Brand'}</span>
                  {variantCount > 1 && (
                    <span className="flex items-center gap-1 text-purple-400">
                      <Layers className="w-3 h-3" />
                      {variantCount} variants
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-100 line-clamp-2 leading-snug group-hover:text-indigo-300 transition-colors">
                  {product.title}
                </h3>
              </div>

              {/* Footer */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-slate-500 truncate max-w-[120px]">
                  {product.variants?.[0]?.sku || product.handle}
                </span>

                {product.url && (
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors text-[11px]"
                  >
                    <span>View Page</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
