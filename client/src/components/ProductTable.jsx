import React, { useState, useRef, useEffect } from 'react';
import { ExternalLink, Edit2, Check, X, Trash2, Tag, Download, CheckSquare, Square, ChevronDown, Eye } from 'lucide-react';
import { SiShopify, SiWoocommerce, SiWix } from 'react-icons/si';
import { FaFileCsv } from 'react-icons/fa';
import { VscJson } from 'react-icons/vsc';
import ProductImage from './ProductImage';
import { getCurrencySymbol } from '../utils/currency';

export default function ProductTable({ 
  products, 
  onUpdateProduct, 
  onDeleteProduct, 
  selectedProductIds = [], 
  onToggleSelect, 
  onToggleSelectAll, 
  onOpenBulkTags, 
  onBulkDelete, 
  onBulkExport, 
  onOpenPreview,
  currencySymbol = '$',
  defaultStock = 99
}) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target)) {
        setExportDropdownOpen(false);
      }
    }
    if (exportDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [exportDropdownOpen]);

  const isAllSelected = products.length > 0 && products.every(p => selectedProductIds.includes(p.id));
  const isSomeSelected = selectedProductIds.length > 0 && !isAllSelected;

  const activeDefaultStock = (defaultStock !== '' && !isNaN(Number(defaultStock))) ? Number(defaultStock) : 99;

  const exportPlatforms = [
    {
      id: 'shopify',
      title: 'Shopify CSV',
      desc: 'Official template with Type & Suffix',
      icon: <SiShopify className="w-4 h-4 text-[#95BF47]" />
    },
    {
      id: 'woocommerce',
      title: 'WooCommerce CSV',
      desc: 'WordPress WP Ready',
      icon: <SiWoocommerce className="w-4 h-4 text-[#96588A]" />
    },
    {
      id: 'wix',
      title: 'Wix Store CSV',
      desc: 'Wix eCommerce compatible',
      icon: <SiWix className="w-4 h-4 text-white" />
    },
    {
      id: 'universal',
      title: 'Clean CSV',
      desc: 'Excel & Google Sheets',
      icon: <FaFileCsv className="w-4 h-4 text-emerald-400" />
    },
    {
      id: 'json',
      title: 'Structured JSON',
      desc: 'Raw catalog data',
      icon: <VscJson className="w-4 h-4 text-[#F1FF0A]" />
    }
  ];

  const handleExportSelected = (formatId) => {
    setExportDropdownOpen(false);
    if (onBulkExport) {
      onBulkExport(formatId);
    }
  };

  const handlePreviewSelected = (formatId) => {
    setExportDropdownOpen(false);
    if (onOpenPreview) {
      onOpenPreview(formatId);
    }
  };

  const startEdit = (prod) => {
    setEditingId(prod.id);
    const tagsStr = Array.isArray(prod.tags) ? prod.tags.join(', ') : (prod.tags || '');
    const currentStock = prod.variants?.[0]?.inventory_quantity !== undefined 
      ? prod.variants[0].inventory_quantity 
      : activeDefaultStock;
    setEditForm({
      title: prod.title,
      price: prod.price,
      vendor: prod.vendor,
      product_type: prod.product_type || prod.category || 'General',
      type: prod.type || prod.product_type || prod.category || '',
      template_suffix: prod.template_suffix || prod.template || '',
      tags: tagsStr,
      stock: currentStock
    });
  };

  const saveEdit = (id) => {
    const updated = { ...editForm };
    if (typeof updated.tags === 'string') {
      updated.tags = updated.tags.split(',').map(t => t.trim()).filter(Boolean);
    }
    const currentProd = products.find(p => p.id === id);
    const stockNum = Math.max(0, parseInt(updated.stock, 10) || 0);
    if (currentProd && currentProd.variants && currentProd.variants.length > 0) {
      updated.variants = currentProd.variants.map(v => ({
        ...v,
        inventory_quantity: stockNum,
        _customStock: true
      }));
    } else {
      updated.variants = [{
        id: '1',
        title: 'Default Title',
        price: updated.price || 0,
        inventory_quantity: stockNum,
        _customStock: true
      }];
    }
    onUpdateProduct(id, updated);
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  if (!products || products.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* Floating Bulk Selection Action Bar */}
      {selectedProductIds.length > 0 && (
        <div className="sticky top-2 z-30 p-2.5 rounded-xl bg-neutral-900 text-white dark:bg-black/90 dark:text-white border border-[#F1FF0A]/50 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#F1FF0A] text-black font-extrabold text-[10px]">
              {selectedProductIds.length}
            </span>
            <span className="text-xs font-bold">
              {selectedProductIds.length} of {products.length} Products Selected
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* Manage Tags Button */}
            <button
              type="button"
              onClick={onOpenBulkTags}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[#F1FF0A] font-bold border border-neutral-700 hover:border-[#F1FF0A]/40 transition-all cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Manage Tags & Category</span>
            </button>

            {/* Export Selected Dropdown Button & Popover */}
            <div className="relative" ref={exportDropdownRef}>
              <button
                type="button"
                onClick={() => setExportDropdownOpen(prev => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F1FF0A] hover:bg-[#D4FF00] text-black font-extrabold transition-all shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Export Selected</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${exportDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {exportDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-neutral-900 border border-[#F1FF0A]/40 shadow-2xl backdrop-blur-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                  <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 border-b border-neutral-800 flex items-center justify-between">
                    <span>Choose Export Format</span>
                    <span className="text-[#F1FF0A] font-bold">{selectedProductIds.length} selected</span>
                  </div>

                  <div className="space-y-0.5 pt-0.5">
                    {exportPlatforms.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleExportSelected(p.id)}
                        className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left hover:bg-neutral-800 transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-1.5 rounded-md bg-black border border-neutral-800 flex-shrink-0">
                            {p.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white group-hover:text-[#F1FF0A] transition-colors truncate">
                              {p.title}
                            </div>
                            <div className="text-[10px] text-neutral-400 truncate">
                              {p.desc}
                            </div>
                          </div>
                        </div>
                        <Download className="w-3.5 h-3.5 text-neutral-500 group-hover:text-[#F1FF0A] flex-shrink-0" />
                      </button>
                    ))}
                  </div>

                  {onOpenPreview && (
                    <div className="pt-1 border-t border-neutral-800">
                      <button
                        type="button"
                        onClick={() => handlePreviewSelected('shopify')}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 text-[11px] font-semibold text-neutral-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#F1FF0A]" />
                        <span>Live Preview Selected</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Delete Selected Button */}
            {onBulkDelete && (
              <button
                type="button"
                onClick={onBulkDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold border border-red-500/30 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete ({selectedProductIds.length})</span>
              </button>
            )}

            {/* Clear Selection Button */}
            <button
              type="button"
              onClick={() => onToggleSelectAll && onToggleSelectAll(false)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Deselect all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Table Container with Horizontal Scroll */}
      <div className="rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xl dark:shadow-2xl">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-800">
          <table className="w-full text-left border-collapse text-xs min-w-[1350px]">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/90 text-neutral-500 dark:text-neutral-400 font-semibold uppercase tracking-wider text-[11px]">
                {/* Master Checkbox */}
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={(e) => onToggleSelectAll && onToggleSelectAll(e.target.checked)}
                    className="rounded border-neutral-300 dark:border-neutral-700 text-[#F1FF0A] focus:ring-[#F1FF0A] cursor-pointer"
                    title="Select all products"
                  />
                </th>
                <th className="py-3 px-2 w-10 text-center font-mono">#</th>
                <th className="py-3 px-4 w-16">Image</th>
                <th className="py-3 px-4 min-w-[200px]">Title & Handle</th>
                <th className="py-3 px-4 w-28">Price</th>
                <th className="py-3 px-3 w-24 text-center">Stock</th>
                <th className="py-3 px-4 w-28">Vendor</th>
                <th className="py-3 px-4 w-32">Category</th>
                <th className="py-3 px-4 w-28">Type</th>
                <th className="py-3 px-4 w-28">Template</th>
                <th className="py-3 px-4 w-36">Tags</th>
                <th className="py-3 px-4 w-16 text-center">Variants</th>
                <th className="py-3 px-4 w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800/60 font-medium">
              {products.map((prod, idx) => {
                const isEditing = editingId === prod.id;
                const isSelected = selectedProductIds.includes(prod.id);
                const mainImg = prod.images?.[0]?.src;
                const tagsList = Array.isArray(prod.tags) ? prod.tags : (typeof prod.tags === 'string' ? prod.tags.split(',').map(t => t.trim()).filter(Boolean) : []);
                const currentStock = prod.variants?.[0]?.inventory_quantity !== undefined ? prod.variants[0].inventory_quantity : activeDefaultStock;
                const displayType = prod.type || prod.product_type || prod.category || 'General';
                const displayTemplate = prod.template_suffix || prod.template || '';
                const rowCurrencySymbol = prod.currency ? getCurrencySymbol(prod.currency) : (currencySymbol || '$');

                return (
                  <tr
                    key={prod.id || idx}
                    className={`transition-colors group ${
                      isSelected
                        ? 'bg-[#F1FF0A]/10 dark:bg-[#F1FF0A]/5'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/60'
                    }`}
                  >
                    {/* Row Checkbox */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect && onToggleSelect(prod.id)}
                        className="rounded border-neutral-300 dark:border-neutral-700 text-[#F1FF0A] focus:ring-[#F1FF0A] cursor-pointer"
                      />
                    </td>

                    {/* Row # */}
                    <td className="py-3 px-2 text-center text-neutral-400 dark:text-neutral-500 font-mono text-[11px]">
                      {idx + 1}
                    </td>

                    {/* Image */}
                    <td className="py-3 px-4">
                      <div className="w-11 h-11 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden flex items-center justify-center flex-shrink-0">
                        <ProductImage
                          src={mainImg}
                          alt={prod.title}
                          size="sm"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    </td>

                    {/* Title & Handle */}
                    <td className="py-3 px-4 max-w-xs sm:max-w-md">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          className="w-full px-2 py-1 bg-neutral-100 dark:bg-neutral-900 border border-[#F1FF0A] rounded text-neutral-900 dark:text-white text-xs font-semibold outline-none"
                        />
                      ) : (
                        <div>
                          <div className="font-semibold text-neutral-900 dark:text-white group-hover:text-[#8b9900] dark:group-hover:text-[#F1FF0A] transition-colors line-clamp-1">
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
                          className="w-24 px-2 py-1 bg-neutral-100 dark:bg-neutral-900 border border-[#F1FF0A] rounded text-neutral-900 dark:text-white text-xs font-semibold outline-none"
                        />
                      ) : (
                        <div className="font-bold text-neutral-900 dark:text-[#F1FF0A]">
                          {rowCurrencySymbol}
                          {Number(prod.price || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                          {prod.regular_price > prod.price && (
                            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 line-through ml-1.5 font-normal">
                              {rowCurrencySymbol}{Number(prod.regular_price).toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-3 text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={editForm.stock ?? 99}
                          onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                          className="w-16 px-1.5 py-1 text-center bg-neutral-100 dark:bg-neutral-900 border border-[#F1FF0A] rounded text-neutral-900 dark:text-white text-xs font-bold outline-none"
                        />
                      ) : (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          currentStock > 0
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        }`}>
                          {currentStock} in stock
                        </span>
                      )}
                    </td>

                    {/* Vendor */}
                    <td className="py-3 px-4 text-neutral-700 dark:text-neutral-300 truncate max-w-[120px]">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.vendor}
                          onChange={(e) => setEditForm({ ...editForm, vendor: e.target.value })}
                          className="w-full px-2 py-1 bg-neutral-100 dark:bg-neutral-900 border border-[#F1FF0A] rounded text-neutral-900 dark:text-white text-xs outline-none"
                        />
                      ) : (
                        <span>{prod.vendor || '-'}</span>
                      )}
                    </td>

                    {/* Dedicated Category Column */}
                    <td className="py-3 px-4 max-w-[140px]">
                      {isEditing ? (
                        <input
                          type="text"
                          placeholder="Category"
                          value={editForm.product_type}
                          onChange={(e) => setEditForm({ ...editForm, product_type: e.target.value })}
                          className="w-full px-2 py-1 bg-neutral-100 dark:bg-neutral-900 border border-[#F1FF0A] rounded text-neutral-900 dark:text-white text-xs font-semibold outline-none"
                        />
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-full">
                          {prod.product_type || prod.category || 'General'}
                        </span>
                      )}
                    </td>

                    {/* Dedicated Product Type Column */}
                    <td className="py-3 px-4 max-w-[130px]">
                      {isEditing ? (
                        <input
                          type="text"
                          placeholder="Type (e.g. T-Shirt)"
                          value={editForm.type}
                          onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                          className="w-full px-2 py-1 bg-neutral-100 dark:bg-neutral-900 border border-[#F1FF0A] rounded text-neutral-900 dark:text-white text-xs font-semibold outline-none"
                        />
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-bold truncate max-w-full">
                          {displayType}
                        </span>
                      )}
                    </td>

                    {/* Dedicated Template Suffix Column */}
                    <td className="py-3 px-4 max-w-[120px]">
                      {isEditing ? (
                        <input
                          type="text"
                          placeholder="Suffix (e.g. pre-order)"
                          value={editForm.template_suffix}
                          onChange={(e) => setEditForm({ ...editForm, template_suffix: e.target.value })}
                          className="w-full px-2 py-1 bg-neutral-100 dark:bg-neutral-900 border border-[#F1FF0A] rounded text-neutral-900 dark:text-white text-xs font-mono outline-none"
                        />
                      ) : (
                        displayTemplate ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-mono font-bold truncate max-w-full">
                            {displayTemplate}
                          </span>
                        ) : (
                          <span className="text-neutral-400 dark:text-neutral-600 text-[11px] font-mono">default</span>
                        )
                      )}
                    </td>

                    {/* Dedicated Tags Column */}
                    <td className="py-3 px-4 max-w-[180px]">
                      {isEditing ? (
                        <input
                          type="text"
                          placeholder="Tags (comma-separated)"
                          value={editForm.tags}
                          onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                          className="w-full px-2 py-1 bg-neutral-100 dark:bg-neutral-900 border border-[#F1FF0A] rounded text-neutral-900 dark:text-white text-xs outline-none"
                        />
                      ) : (
                        tagsList.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1">
                            {tagsList.slice(0, 2).map((t, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 truncate max-w-[90px]">
                                #{t}
                              </span>
                            ))}
                            {tagsList.length > 2 && (
                              <span className="text-[10px] font-mono text-neutral-400 font-semibold" title={tagsList.slice(2).join(', ')}>
                                +{tagsList.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-neutral-400 dark:text-neutral-600 text-[11px]">-</span>
                        )
                      )}
                    </td>

                    {/* Variants Count */}
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono text-neutral-600 dark:text-neutral-400 text-xs">
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
                              className="p-1 rounded bg-[#F1FF0A] text-black hover:bg-[#D4FF00] transition-colors cursor-pointer"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(prod)}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-[#8b9900] dark:hover:text-[#F1FF0A] hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
                              title="Quick Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {prod.url && (
                              <a
                                href={prod.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
                                title="Open original link"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => onDeleteProduct(prod.id)}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
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
    </div>
  );
}
