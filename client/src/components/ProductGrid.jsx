import React from 'react';
import { ExternalLink, Trash2, CheckSquare, Square } from 'lucide-react';
import ProductImage from './ProductImage';

export default function ProductGrid({ 
  products, 
  onDeleteProduct, 
  selectedProductIds = [], 
  onToggleSelect, 
  currencySymbol = '$' 
}) {
  if (!products || products.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((prod, idx) => {
        const mainImg = prod.images?.[0]?.src;
        const isSelected = selectedProductIds.includes(prod.id);
        const tagsList = Array.isArray(prod.tags) ? prod.tags : (typeof prod.tags === 'string' ? prod.tags.split(',').map(t => t.trim()).filter(Boolean) : []);

        return (
          <div
            key={prod.id || idx}
            className={`rounded-2xl bg-white dark:bg-neutral-950 border overflow-hidden transition-all group flex flex-col justify-between shadow-md dark:shadow-lg ${
              isSelected 
                ? 'border-[#F1FF0A] ring-1 ring-[#F1FF0A] bg-[#F1FF0A]/5' 
                : 'border-neutral-200 dark:border-neutral-800 hover:border-[#F1FF0A]/60'
            }`}
          >
            <div>
              {/* Product Image */}
              <div className="relative w-full aspect-square bg-neutral-100 dark:bg-neutral-900 overflow-hidden flex items-center justify-center">
                <ProductImage
                  src={mainImg}
                  alt={prod.title}
                  size="lg"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Top Left Selection Checkbox & Index Badge */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                  <button
                    type="button"
                    onClick={() => onToggleSelect && onToggleSelect(prod.id)}
                    className="p-1 rounded-md bg-black/80 hover:bg-black text-white border border-white/20 transition-all cursor-pointer"
                    title={isSelected ? "Deselect" : "Select"}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#F1FF0A]" />
                    ) : (
                      <Square className="w-4 h-4 text-neutral-300" />
                    )}
                  </button>

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
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-md bg-black/80 hover:bg-red-500/80 text-neutral-400 hover:text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-10"
                  title="Delete item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Product Info */}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                  <span className="truncate max-w-[120px] font-medium">{prod.vendor || 'General'}</span>
                  <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[10px] text-neutral-700 dark:text-neutral-300">
                    {prod.product_type || 'Item'}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-[#8b9900] dark:group-hover:text-[#F1FF0A] transition-colors line-clamp-2 leading-relaxed">
                  {prod.title}
                </h4>

                {/* Tags preview */}
                {tagsList.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {tagsList.slice(0, 3).map((t, i) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800">
                        #{t}
                      </span>
                    ))}
                    {tagsList.length > 3 && (
                      <span className="text-[9px] text-neutral-400 font-mono self-center">
                        +{tagsList.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Price & Link */}
            <div className="p-4 pt-0 flex items-center justify-between border-t border-neutral-200 dark:border-neutral-900 mt-2">
              <div className="pt-3">
                <div className="text-sm font-extrabold text-neutral-900 dark:text-[#F1FF0A]">
                  {currencySymbol}{Number(prod.price || 0).toLocaleString()}
                </div>
                {prod.regular_price > prod.price && (
                  <div className="text-[10px] text-neutral-400 dark:text-neutral-500 line-through">
                    {currencySymbol}{Number(prod.regular_price).toLocaleString()}
                  </div>
                )}
              </div>

              {prod.url && (
                <a
                  href={prod.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer mt-3"
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
