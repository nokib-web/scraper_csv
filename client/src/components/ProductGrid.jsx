import React from 'react';
import { ExternalLink, Image as ImageIcon, Trash2 } from 'lucide-react';

export default function ProductGrid({ products, onDeleteProduct, currencySymbol = '$' }) {
  if (!products || products.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((prod, idx) => {
        const mainImg = prod.images?.[0]?.src;
        return (
          <div
            key={prod.id || idx}
            className="rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-[#F1FF0A]/40 overflow-hidden transition-all group flex flex-col justify-between shadow-lg"
          >
            <div>
              {/* Product Image */}
              <div className="relative w-full aspect-square bg-neutral-900 overflow-hidden flex items-center justify-center">
                {mainImg ? (
                  <img
                    src={mainImg}
                    alt={prod.title}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `<span class="text-3xl font-extrabold text-[#F1FF0A]">${(prod.title || 'P').charAt(0)}</span>`;
                    }}
                  />
                ) : (
                  <span className="text-3xl font-extrabold text-[#F1FF0A]">
                    {(prod.title || 'P').charAt(0)}
                  </span>
                )}

                {/* Top badges */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white">
                    #{idx + 1}
                  </span>
                  {prod.variants?.length > 1 && (
                    <span className="px-2 py-0.5 rounded-md bg-[#F1FF0A] text-[10px] font-bold text-black">
                      {prod.variants.length} Variants
                    </span>
                  )}
                </div>

                {/* Delete button */}
                <button
                  onClick={() => onDeleteProduct(prod.id)}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-md bg-black/80 hover:bg-red-500/80 text-neutral-400 hover:text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  title="Delete item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Product Info */}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="truncate max-w-[120px] font-medium">{prod.vendor || 'General'}</span>
                  <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-300">
                    {prod.product_type || 'Item'}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-white group-hover:text-[#F1FF0A] transition-colors line-clamp-2 leading-relaxed">
                  {prod.title}
                </h4>
              </div>
            </div>

            {/* Bottom Price & Link */}
            <div className="p-4 pt-0 flex items-center justify-between border-t border-neutral-900 mt-2">
              <div className="pt-3">
                <div className="text-sm font-extrabold text-[#F1FF0A]">
                  {currencySymbol}{Number(prod.price || 0).toLocaleString()}
                </div>
                {prod.regular_price > prod.price && (
                  <div className="text-[10px] text-neutral-500 line-through">
                    {currencySymbol}{Number(prod.regular_price).toLocaleString()}
                  </div>
                )}
              </div>

              {prod.url && (
                <a
                  href={prod.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer mt-3"
                  title="View original"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
