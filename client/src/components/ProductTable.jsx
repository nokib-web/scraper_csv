import React, { useState } from 'react';
import { Trash2, ExternalLink, Edit2, Check, X, Image as ImageIcon, Layers } from 'lucide-react';

export default function ProductTable({
  products = [],
  selectedIds = [],
  onToggleSelect,
  onSelectAll,
  onDeleteProduct,
  onUpdateProduct
}) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', price: '', vendor: '', product_type: '' });

  const startEdit = (product) => {
    setEditingId(product.id);
    setEditForm({
      title: product.title,
      price: product.price,
      vendor: product.vendor || '',
      product_type: product.product_type || ''
    });
  };

  const saveEdit = (id) => {
    onUpdateProduct(id, {
      title: editForm.title,
      price: parseFloat(editForm.price) || 0,
      vendor: editForm.vendor,
      product_type: editForm.product_type
    });
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const isAllSelected = products.length > 0 && selectedIds.length === products.length;

  return (
    <div className="w-full glass-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 border-b border-white/10 uppercase tracking-wider text-[11px] font-bold text-slate-400">
            <tr>
              <th className="p-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onSelectAll}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </th>
              <th className="p-3 w-16">Image</th>
              <th className="p-3">Product Title & Handle</th>
              <th className="p-3 w-28">Price</th>
              <th className="p-3 w-32">Vendor / Brand</th>
              <th className="p-3 w-32">Category</th>
              <th className="p-3 w-24 text-center">Variants</th>
              <th className="p-3 w-20 text-center">Images</th>
              <th className="p-3 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {products.map((p, idx) => {
              const isSelected = selectedIds.includes(p.id);
              const isEditing = editingId === p.id;
              const mainImg = p.images?.[0]?.src;
              const variantCount = p.variants?.length || 1;
              const imageCount = p.images?.length || 0;

              return (
                <tr
                  key={p.id || idx}
                  className={`hover:bg-slate-900/60 transition-colors ${
                    isSelected ? 'bg-indigo-950/20' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(p.id)}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>

                  {/* Thumbnail */}
                  <td className="p-3">
                    <div className="w-12 h-12 rounded-lg bg-slate-950 border border-white/10 overflow-hidden flex items-center justify-center relative group">
                      {mainImg ? (
                        <img
                          src={mainImg}
                          alt=""
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://placehold.co/100x100/111827/94a3b8?text=No+Img';
                          }}
                        />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-slate-600" />
                      )}
                    </div>
                  </td>

                  {/* Title & Handle */}
                  <td className="p-3 max-w-xs">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full px-2 py-1 bg-slate-950 border border-indigo-500 rounded text-xs text-white"
                      />
                    ) : (
                      <div>
                        <div className="font-semibold text-slate-100 line-clamp-1">
                          {p.title}
                        </div>
                        <div className="font-mono text-[10px] text-slate-500 truncate">
                          {p.handle || p.variants?.[0]?.sku}
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Price */}
                  <td className="p-3">
                    {isEditing ? (
                      <div className="flex items-center">
                        <span className="text-slate-400 mr-1">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.price}
                          onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                          className="w-20 px-2 py-1 bg-slate-950 border border-indigo-500 rounded text-xs text-white"
                        />
                      </div>
                    ) : (
                      <div className="font-bold text-emerald-400">
                        ${typeof p.price === 'number' ? p.price.toFixed(2) : p.price}
                        {p.regular_price > p.price && (
                          <span className="ml-1 text-[10px] text-slate-500 line-through">
                            ${p.regular_price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Vendor */}
                  <td className="p-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.vendor}
                        onChange={(e) => setEditForm({ ...editForm, vendor: e.target.value })}
                        className="w-full px-2 py-1 bg-slate-950 border border-indigo-500 rounded text-xs text-white"
                      />
                    ) : (
                      <span className="text-slate-300 truncate block max-w-[120px]">
                        {p.vendor || 'N/A'}
                      </span>
                    )}
                  </td>

                  {/* Category */}
                  <td className="p-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.product_type}
                        onChange={(e) => setEditForm({ ...editForm, product_type: e.target.value })}
                        className="w-full px-2 py-1 bg-slate-950 border border-indigo-500 rounded text-xs text-white"
                      />
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 border border-white/5 text-slate-300 inline-block">
                        {p.product_type || 'General'}
                      </span>
                    )}
                  </td>

                  {/* Variants */}
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-950/60 border border-purple-500/30 text-purple-300 font-semibold inline-flex items-center gap-1">
                      <Layers className="w-2.5 h-2.5" />
                      {variantCount}
                    </span>
                  </td>

                  {/* Images */}
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-semibold inline-flex items-center gap-1">
                      <ImageIcon className="w-2.5 h-2.5" />
                      {imageCount}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => saveEdit(p.id)}
                            className="p-1 rounded bg-emerald-950 text-emerald-300 hover:bg-emerald-900"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="p-1 rounded bg-slate-800 text-slate-400 hover:bg-slate-700"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(p)}
                            className="p-1 rounded text-slate-400 hover:text-indigo-300 hover:bg-indigo-950/50"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {p.url && (
                            <a
                              href={p.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/50"
                              title="Open original link"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => onDeleteProduct(p.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/50"
                            title="Delete"
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
