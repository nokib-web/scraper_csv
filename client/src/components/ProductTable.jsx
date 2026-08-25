import React, { useState } from 'react';
import { ExternalLink, Edit2, Check, X, Image as ImageIcon, Trash2 } from 'lucide-react';

export default function ProductTable({ products, onUpdateProduct, onDeleteProduct, currencySymbol = '$' }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const startEdit = (prod) => {
    setEditingId(prod.id);
    setEditForm({
      title: prod.title,
      price: prod.price,
      vendor: prod.vendor,
      product_type: prod.product_type
    });
  };

  const saveEdit = (id) => {
    onUpdateProduct(id, editForm);
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  if (!products || products.length === 0) return null;

  return (
    <div className="rounded-2xl bg-neutral-950 border border-neutral-800 overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-900/90 text-neutral-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4 w-16">Image</th>
              <th className="py-3 px-4">Title & Handle</th>
              <th className="py-3 px-4 w-32">Price</th>
              <th className="py-3 px-4 w-32">Vendor</th>
              <th className="py-3 px-4 w-28">Category</th>
              <th className="py-3 px-4 w-20 text-center">Variants</th>
              <th className="py-3 px-4 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60 font-medium">
            {products.map((prod, idx) => {
              const isEditing = editingId === prod.id;
              const mainImg = prod.images?.[0]?.src;

              return (
                <tr
                  key={prod.id || idx}
                  className="hover:bg-neutral-900/60 transition-colors group"
                >
                  {/* Row # */}
                  <td className="py-3 px-4 text-center text-neutral-500 font-mono text-[11px]">
                    {idx + 1}
                  </td>

                  {/* Image */}
                  <td className="py-3 px-4">
                    <div className="w-11 h-11 rounded-lg bg-neutral-900 dark:bg-neutral-900 light:bg-neutral-100 border border-neutral-800 dark:border-neutral-800 light:border-neutral-300 overflow-hidden flex items-center justify-center flex-shrink-0 text-center font-bold text-xs text-neutral-400">
                      {mainImg ? (
                        <img
                          src={mainImg}
                          alt={prod.title}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `<span class="text-xs font-bold text-[#F1FF0A]">${(prod.title || 'P').charAt(0)}</span>`;
                          }}
                        />
                      ) : (
                        <span className="text-xs font-bold text-[#F1FF0A]">
                          {(prod.title || 'P').charAt(0)}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Title & Handle */}
                  <td className="py-3 px-4 max-w-xs sm:max-w-md">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full px-2 py-1 bg-neutral-900 border border-[#F1FF0A] rounded text-white text-xs font-semibold outline-none"
                      />
                    ) : (
                      <div>
                        <div className="font-semibold text-white group-hover:text-[#F1FF0A] transition-colors line-clamp-1">
                          {prod.title}
                        </div>
                        <div className="text-[10px] font-mono text-neutral-500 truncate mt-0.5">
                          {prod.handle || prod.url}
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Price */}
                  <td className="py-3 px-4">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.price}
                        onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                        className="w-24 px-2 py-1 bg-neutral-900 border border-[#F1FF0A] rounded text-white text-xs font-semibold outline-none"
                      />
                    ) : (
                      <div className="font-bold text-[#F1FF0A]">
                        {currencySymbol}
                        {Number(prod.price || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        {prod.regular_price > prod.price && (
                          <span className="text-[10px] text-neutral-500 line-through ml-1.5 font-normal">
                            {currencySymbol}{Number(prod.regular_price).toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Vendor */}
                  <td className="py-3 px-4 text-neutral-300 truncate max-w-[120px]">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.vendor}
                        onChange={(e) => setEditForm({ ...editForm, vendor: e.target.value })}
                        className="w-full px-2 py-1 bg-neutral-900 border border-[#F1FF0A] rounded text-white text-xs outline-none"
                      />
                    ) : (
                      <span>{prod.vendor || '-'}</span>
                    )}
                  </td>

                  {/* Category */}
                  <td className="py-3 px-4 text-neutral-400">
                    <span className="inline-block px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-300 truncate max-w-[100px]">
                      {prod.product_type || 'General'}
                    </span>
                  </td>

                  {/* Variants Count */}
                  <td className="py-3 px-4 text-center">
                    <span className="font-mono text-neutral-400 text-xs">
                      {prod.variants?.length || 1}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => saveEdit(prod.id)}
                            className="p-1 rounded bg-[#F1FF0A] text-black hover:bg-[#D4FF00] transition-colors"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1 rounded bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(prod)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-[#F1FF0A] hover:bg-neutral-900 transition-colors"
                            title="Quick Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {prod.url && (
                            <a
                              href={prod.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
                              title="Open original link"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => onDeleteProduct(prod.id)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-900 transition-colors"
                            title="Delete item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
