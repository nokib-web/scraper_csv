import React, { useState, useRef, useEffect } from 'react';
import { 
  ExternalLink, Edit2, Check, X, Trash2, Tag, Download, CheckSquare, 
  Square, ChevronDown, ChevronRight, Eye, Layers, Barcode, Hash, Sparkles,
  SlidersHorizontal, CheckCircle2, ChevronLeft, Maximize2, Minimize2, ArrowRightLeft,
  DollarSign, Package, Store, FolderTree
} from 'lucide-react';
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
  const [expandedProductIds, setExpandedProductIds] = useState([]);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [isMaxHeightExpanded, setIsMaxHeightExpanded] = useState(false);
  const [activeScrollSection, setActiveScrollSection] = useState('info');

  const exportDropdownRef = useRef(null);
  const tableContainerRef = useRef(null);

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
      icon: <SiWix className="w-4 h-4 text-neutral-300" />
    },
    {
      id: 'universal',
      title: 'Clean CSV',
      desc: 'Excel & Google Sheets ready',
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

  const toggleExpand = (id) => {
    setExpandedProductIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const startEdit = (prod) => {
    setEditingId(prod.id);
    const tagsStr = Array.isArray(prod.tags) ? prod.tags.join(', ') : (prod.tags || '');
    const currentStock = prod.variants?.[0]?.inventory_quantity !== undefined 
      ? prod.variants[0].inventory_quantity 
      : activeDefaultStock;
    const currentSku = prod.variants?.[0]?.sku || '';
    const currentBarcode = prod.variants?.[0]?.barcode || '';
    const currentComparePrice = prod.regular_price > prod.price ? prod.regular_price : '';

    setEditForm({
      title: prod.title,
      price: prod.price,
      regular_price: currentComparePrice,
      vendor: prod.vendor,
      product_type: prod.product_type || prod.category || 'General',
      type: prod.type || prod.product_type || prod.category || '',
      template_suffix: prod.template_suffix || prod.template || '',
      tags: tagsStr,
      stock: currentStock,
      sku: currentSku,
      barcode: currentBarcode,
      status: prod.status || 'active'
    });
  };

  const saveEdit = (id) => {
    const updated = { ...editForm };
    if (typeof updated.tags === 'string') {
      updated.tags = updated.tags.split(',').map(t => t.trim()).filter(Boolean);
    }
    const currentProd = products.find(p => p.id === id);
    const stockNum = Math.max(0, parseInt(updated.stock, 10) || 0);
    const priceNum = parseFloat(updated.price) || 0;
    const compareNum = parseFloat(updated.regular_price) || 0;

    let updatedVariants = [];
    if (currentProd && currentProd.variants && currentProd.variants.length > 0) {
      updatedVariants = currentProd.variants.map((v, idx) => ({
        ...v,
        price: priceNum || v.price,
        compare_at_price: (compareNum > priceNum) ? compareNum : (v.compare_at_price || null),
        inventory_quantity: stockNum,
        sku: idx === 0 && updated.sku ? updated.sku : v.sku,
        barcode: idx === 0 && updated.barcode ? updated.barcode : v.barcode,
        _customStock: true
      }));
    } else {
      updatedVariants = [{
        id: '1',
        title: 'Default Title',
        price: priceNum,
        compare_at_price: (compareNum > priceNum) ? compareNum : null,
        sku: updated.sku || `SKU-${id}`,
        barcode: updated.barcode || '',
        inventory_quantity: stockNum,
        _customStock: true
      }];
    }

    onUpdateProduct(id, {
      ...updated,
      price: priceNum,
      regular_price: (compareNum > priceNum) ? compareNum : priceNum,
      variants: updatedVariants
    });
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdateVariantField = (prodId, varIdx, field, val) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod || !prod.variants) return;

    const newVariants = [...prod.variants];
    const targetVar = { ...newVariants[varIdx] };

    if (field === 'price') targetVar.price = parseFloat(val) || 0;
    else if (field === 'compare_at_price') targetVar.compare_at_price = parseFloat(val) || null;
    else if (field === 'inventory_quantity') targetVar.inventory_quantity = Math.max(0, parseInt(val, 10) || 0);
    else if (field === 'sku') targetVar.sku = val;
    else if (field === 'barcode') targetVar.barcode = val;

    newVariants[varIdx] = targetVar;

    onUpdateProduct(prodId, {
      variants: newVariants,
      price: varIdx === 0 ? targetVar.price : prod.price
    });
  };

  // Horizontal Scroll Helpers
  const scrollHorizontally = (offset) => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const scrollToColumn = (columnKey) => {
    if (!tableContainerRef.current) return;
    setActiveScrollSection(columnKey);
    const scrollMap = {
      info: 0,
      pricing: 180,
      inventory: 420,
      sku: 620,
      vendor: 820,
      taxonomy: 1040,
      tags: 1300
    };
    tableContainerRef.current.scrollTo({
      left: scrollMap[columnKey] || 0,
      behavior: 'smooth'
    });
  };

  if (!products || products.length === 0) return null;

  return (
    <div className="space-y-2.5">
      
      {/* Floating Bulk Selection Action Bar */}
      {selectedProductIds.length > 0 && (
        <div className="sticky top-2 z-40 p-2.5 rounded-xl bg-neutral-900 text-white dark:bg-black/95 dark:text-white border border-[#F1FF0A]/60 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#F1FF0A] text-black font-extrabold text-[10px]">
              {selectedProductIds.length}
            </span>
            <span className="text-xs font-bold">
              {selectedProductIds.length} of {products.length} Products Selected
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* Bulk Inventory Editor Button */}
            <button
              type="button"
              onClick={onOpenBulkTags}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[#F1FF0A] font-bold border border-neutral-700 hover:border-[#F1FF0A]/40 transition-all cursor-pointer shadow-sm"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Shopify Bulk Editor ({selectedProductIds.length})</span>
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

      {/* Modern Spreadsheet Control & Column Quick-Jump Navigator */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-[#111115] border border-neutral-200 dark:border-neutral-800 shadow-sm text-xs">
        
        {/* Left: Quick Column Jump Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
          <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1 mr-1">
            <ArrowRightLeft className="w-3 h-3 text-[#8b9900] dark:text-[#F1FF0A]" />
            <span className="hidden sm:inline">Jump:</span>
          </span>

          <button
            type="button"
            onClick={() => scrollToColumn('info')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeScrollSection === 'info'
                ? 'bg-neutral-900 text-white dark:bg-[#F1FF0A] dark:text-black shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            📋 Product Info
          </button>

          <button
            type="button"
            onClick={() => scrollToColumn('pricing')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeScrollSection === 'pricing'
                ? 'bg-neutral-900 text-white dark:bg-[#F1FF0A] dark:text-black shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            💰 Pricing
          </button>

          <button
            type="button"
            onClick={() => scrollToColumn('inventory')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeScrollSection === 'inventory'
                ? 'bg-neutral-900 text-white dark:bg-[#F1FF0A] dark:text-black shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            📦 Stock & Qty
          </button>

          <button
            type="button"
            onClick={() => scrollToColumn('sku')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeScrollSection === 'sku'
                ? 'bg-neutral-900 text-white dark:bg-[#F1FF0A] dark:text-black shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            🏷️ SKU & Barcode
          </button>

          <button
            type="button"
            onClick={() => scrollToColumn('vendor')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeScrollSection === 'vendor'
                ? 'bg-neutral-900 text-white dark:bg-[#F1FF0A] dark:text-black shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            🏪 Vendor
          </button>

          <button
            type="button"
            onClick={() => scrollToColumn('taxonomy')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeScrollSection === 'taxonomy'
                ? 'bg-neutral-900 text-white dark:bg-[#F1FF0A] dark:text-black shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            📂 Category & Template
          </button>

          <button
            type="button"
            onClick={() => scrollToColumn('tags')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeScrollSection === 'tags'
                ? 'bg-neutral-900 text-white dark:bg-[#F1FF0A] dark:text-black shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            🏷️ Tags
          </button>
        </div>

        {/* Right: Scroll Step Buttons & Height Toggle */}
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <button
              type="button"
              onClick={() => scrollHorizontally(-280)}
              className="p-1 rounded text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
              title="Scroll Left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollHorizontally(280)}
              className="p-1 rounded text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
              title="Scroll Right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsMaxHeightExpanded(prev => !prev)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 text-[11px] font-bold transition-colors cursor-pointer"
            title={isMaxHeightExpanded ? "Switch to Scrollable View" : "Expand Full View"}
          >
            {isMaxHeightExpanded ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Compact View</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Expanded View</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Main Viewport-Aware Scrollable Table Container */}
      <div className="rounded-2xl bg-white dark:bg-[#0e0e12] border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden relative">
        <div 
          ref={tableContainerRef}
          className={`overflow-auto scrollbar-thin scrollbar-thumb-neutral-400 dark:scrollbar-thumb-neutral-700 ${
            isMaxHeightExpanded ? 'max-h-none' : 'max-h-[68vh] min-h-[400px]'
          }`}
        >
          <table className="w-full text-left border-collapse text-xs min-w-[1550px]">
            {/* Sticky Table Header */}
            <thead className="sticky top-0 z-30 bg-neutral-100/95 dark:bg-[#15151a]/95 backdrop-blur-md shadow-xs">
              <tr className="border-b-2 border-neutral-300 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold uppercase tracking-wider text-[11px]">
                
                {/* 1. Master Checkbox + # (Sticky Left) */}
                <th className="py-3 px-2 w-14 text-center sticky left-0 z-40 bg-neutral-100 dark:bg-[#15151a] border-r border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center justify-center gap-1">
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
                    <span className="font-mono text-[10px] text-neutral-400">#</span>
                  </div>
                </th>

                {/* 2. Image (Sticky Left) */}
                <th className="py-3 px-2 w-14 text-center sticky left-[56px] z-40 bg-neutral-100 dark:bg-[#15151a] border-r border-neutral-200 dark:border-neutral-800">
                  Image
                </th>

                {/* 3. Title & Handle (Sticky Left with separating shadow) */}
                <th className="py-3 px-4 min-w-[260px] max-w-[320px] sticky left-[112px] z-40 bg-neutral-100 dark:bg-[#15151a] border-r-2 border-neutral-300 dark:border-neutral-700 shadow-[4px_0_10px_rgba(0,0,0,0.06)] dark:shadow-[4px_0_10px_rgba(0,0,0,0.4)]">
                  Product Title & Handle
                </th>

                {/* 4. Regular Scrollable Columns */}
                <th className="py-3 px-3 w-24 text-center">Status</th>
                <th className="py-3 px-4 w-28">Price</th>
                <th className="py-3 px-4 w-28">Compare At</th>
                <th className="py-3 px-3 w-24 text-center">Stock</th>
                <th className="py-3 px-3 w-32 font-mono">SKU</th>
                <th className="py-3 px-4 w-36">Vendor</th>
                <th className="py-3 px-4 w-36">Category</th>
                <th className="py-3 px-4 w-32">Type</th>
                <th className="py-3 px-4 w-32">Template</th>
                <th className="py-3 px-4 w-40">Tags</th>
                <th className="py-3 px-3 w-24 text-center">Variants</th>

                {/* 5. Actions (Sticky Right) */}
                <th className="py-3 px-4 w-24 text-right sticky right-0 z-40 bg-neutral-100 dark:bg-[#15151a] border-l border-neutral-200 dark:border-neutral-800 shadow-[-4px_0_10px_rgba(0,0,0,0.04)]">
                  Actions
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800/70 font-medium">
              {products.map((prod, idx) => {
                const isEditing = editingId === prod.id;
                const isSelected = selectedProductIds.includes(prod.id);
                const isExpanded = expandedProductIds.includes(prod.id);
                const mainImg = prod.images?.[0]?.src;
                const tagsList = Array.isArray(prod.tags) ? prod.tags : (typeof prod.tags === 'string' ? prod.tags.split(',').map(t => t.trim()).filter(Boolean) : []);
                const currentStock = prod.variants?.[0]?.inventory_quantity !== undefined ? prod.variants[0].inventory_quantity : activeDefaultStock;
                const currentSku = prod.variants?.[0]?.sku || '-';
                const displayType = prod.type || prod.product_type || prod.category || 'General';
                const displayTemplate = prod.template_suffix || prod.template || '';
                const rowCurrencySymbol = prod.currency ? getCurrencySymbol(prod.currency) : (currencySymbol || '$');
                const prodStatus = (prod.status || 'active').toLowerCase();

                // Sticky cell background styling for normal, selected, and hover
                const stickyBgClass = isSelected
                  ? 'bg-[#F4F9CE] dark:bg-[#1a1c12]'
                  : 'bg-white dark:bg-[#0e0e12] group-hover:bg-neutral-50 dark:group-hover:bg-[#151519]';

                return (
                  <React.Fragment key={prod.id || idx}>
                    <tr
                      className={`transition-colors group ${
                        isSelected
                          ? 'bg-[#F4F9CE]/60 dark:bg-[#1a1c12]/70'
                          : 'hover:bg-neutral-50 dark:hover:bg-[#151519]'
                      }`}
                    >
                      {/* 1. Checkbox + # (Sticky Left) */}
                      <td className={`py-3 px-2 text-center sticky left-0 z-20 border-r border-neutral-200 dark:border-neutral-800 transition-colors ${stickyBgClass}`}>
                        <div className="flex items-center justify-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleSelect && onToggleSelect(prod.id)}
                            className="rounded border-neutral-300 dark:border-neutral-700 text-[#F1FF0A] focus:ring-[#F1FF0A] cursor-pointer"
                          />
                          <span className="text-neutral-400 dark:text-neutral-500 font-mono text-[10px]">
                            {idx + 1}
                          </span>
                        </div>
                      </td>

                      {/* 2. Image (Sticky Left) */}
                      <td className={`py-3 px-2 text-center sticky left-[56px] z-20 border-r border-neutral-200 dark:border-neutral-800 transition-colors ${stickyBgClass}`}>
                        <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden flex items-center justify-center mx-auto flex-shrink-0 shadow-xs">
                          <ProductImage
                            src={mainImg}
                            alt={prod.title}
                            size="sm"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      </td>

                      {/* 3. Title & Handle (Sticky Left with right shadow) */}
                      <td className={`py-3 px-4 min-w-[260px] max-w-[320px] sticky left-[112px] z-20 border-r-2 border-neutral-300 dark:border-neutral-700 shadow-[4px_0_10px_rgba(0,0,0,0.06)] dark:shadow-[4px_0_10px_rgba(0,0,0,0.4)] transition-colors ${stickyBgClass}`}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            className="w-full px-2 py-1 bg-neutral-100 dark:bg-neutral-900 border border-[#F1FF0A] rounded text-neutral-900 dark:text-white text-xs font-semibold outline-none"
                          />
                        ) : (
                          <div className="space-y-0.5">
                            <div className="font-semibold text-neutral-900 dark:text-white group-hover:text-[#8b9900] dark:group-hover:text-[#F1FF0A] transition-colors line-clamp-2 text-xs leading-snug" title={prod.title}>
                              {prod.title}
                            </div>
                            <div className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 truncate" title={prod.handle || prod.url}>
                              {prod.handle || prod.url || 'no-handle'}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 4. Status */}
                      <td className="py-3 px-3 text-center">
                        {isEditing ? (
                          <select
                            value={editForm.status || 'active'}
                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                            className="px-1.5 py-1 bg-neutral-100 dark:bg-neutral-900 border border-[#F1FF0A] rounded text-[10px] font-bold outline-none uppercase"
                          >
                            <option value="active">Active</option>
                            <option value="draft">Draft</option>
                            <option value="archived">Archived</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                            prodStatus === 'draft'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : prodStatus === 'archived'
                              ? 'bg-neutral-500/10 text-neutral-500 border border-neutral-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              prodStatus === 'draft' ? 'bg-amber-400' : (prodStatus === 'archived' ? 'bg-neutral-400' : 'bg-emerald-400')
                            }`}></span>
                            <span>{prodStatus}</span>
                          </span>
                        )}
                      </td>

                      {/* 5. Price */}
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.price}
                            onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                            className="w-20 px-2 py-1 bg-neutral-100 dark:bg-neutral-900 border border-[#F1FF0A] rounded text-neutral-900 dark:text-white text-xs font-semibold outline-none"
                          />
                        ) : (
                          <div className="font-extrabold text-neutral-950 dark:text-[#F1FF0A] text-xs">
                            {rowCurrencySymbol}
                            {Number(prod.price || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                          </div>
                        )}
                      </td>

                      {/* 6. Compare At Price */}
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Compare At"
                            value={editForm.regular_price}
                            onChange={(e) => setEditForm({ ...editForm, regular_price: parseFloat(e.target.value) || 0 })}
                            className="w-20 px-2 py-1 bg-neutral-100 dark:bg-neutral-900 border border-[#F1FF0A] rounded text-neutral-900 dark:text-white text-xs font-semibold outline-none"
                          />
                        ) : (
                          prod.regular_price > prod.price ? (
                            <span className="text-[11px] text-neutral-400 dark:text-neutral-500 line-through">
                              {rowCurrencySymbol}{Number(prod.regular_price).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-neutral-400 dark:text-neutral-600 text-[11px]">-</span>
                          )
                        )}
                      </td>

                      {/* 7. Stock */}
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
                          <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            currentStock > 0
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                          }`}>
                            {currentStock}
                          </span>
                        )}
                      </td>

                      {/* 8. SKU */}
                      <td className="py-3 px-3 font-mono text-[11px] text-neutral-700 dark:text-neutral-300">
                        {isEditing ? (
                          <input
                            type="text"
                            placeholder="SKU"
                            value={editForm.sku}
                            onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                            className="w-full px-1.5 py-1 bg-neutral-100 dark:bg-neutral-900 border border-[#F1FF0A] rounded text-xs font-mono outline-none"
                          />
                        ) : (
                          <span className="truncate block max-w-[130px]" title={currentSku}>{currentSku}</span>
                        )}
                      </td>

                      {/* 9. Vendor */}
                      <td className="py-3 px-4 text-neutral-700 dark:text-neutral-300">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.vendor}
                            onChange={(e) => setEditForm({ ...editForm, vendor: e.target.value })}
                            className="w-full px-2 py-1 bg-neutral-100 dark:bg-neutral-900 border border-[#F1FF0A] rounded text-neutral-900 dark:text-white text-xs outline-none"
                          />
                        ) : (
                          <span className="truncate block max-w-[150px] font-medium" title={prod.vendor || '-'}>
                            {prod.vendor || '-'}
                          </span>
                        )}
                      </td>

                      {/* 10. Category */}
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <input
                            type="text"
                            placeholder="Category"
                            value={editForm.product_type}
                            onChange={(e) => setEditForm({ ...editForm, product_type: e.target.value })}
                            className="w-full px-2 py-1 bg-neutral-100 dark:bg-neutral-900 border border-[#F1FF0A] rounded text-neutral-900 dark:text-white text-xs font-semibold outline-none"
                          />
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-[150px]" title={prod.product_type || prod.category || 'General'}>
                            {prod.product_type || prod.category || 'General'}
                          </span>
                        )}
                      </td>

                      {/* 11. Type */}
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <input
                            type="text"
                            placeholder="Type"
                            value={editForm.type}
                            onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                            className="w-full px-2 py-1 bg-neutral-100 dark:bg-neutral-900 border border-[#F1FF0A] rounded text-neutral-900 dark:text-white text-xs font-semibold outline-none"
                          />
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-bold truncate max-w-[130px]" title={displayType}>
                            {displayType}
                          </span>
                        )}
                      </td>

                      {/* 12. Template */}
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <input
                            type="text"
                            placeholder="Suffix"
                            value={editForm.template_suffix}
                            onChange={(e) => setEditForm({ ...editForm, template_suffix: e.target.value })}
                            className="w-full px-2 py-1 bg-neutral-100 dark:bg-neutral-900 border border-[#F1FF0A] rounded text-neutral-900 dark:text-white text-xs font-mono outline-none"
                          />
                        ) : (
                          displayTemplate ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-mono font-bold truncate max-w-[130px]" title={`product.${displayTemplate}`}>
                              {displayTemplate}
                            </span>
                          ) : (
                            <span className="text-neutral-400 dark:text-neutral-600 text-[11px] font-mono">default</span>
                          )
                        )}
                      </td>

                      {/* 13. Tags */}
                      <td className="py-3 px-4">
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
                            <div className="flex flex-wrap items-center gap-1 max-w-[160px]">
                              {tagsList.slice(0, 2).map((t, i) => (
                                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 truncate max-w-[90px]" title={t}>
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

                      {/* 14. Variants Count */}
                      <td className="py-3 px-3 text-center">
                        {prod.variants && prod.variants.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => toggleExpand(prod.id)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-extrabold transition-all cursor-pointer ${
                              isExpanded
                                ? 'bg-[#F1FF0A] text-black shadow-sm'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-[#F1FF0A] border border-neutral-300 dark:border-neutral-700'
                            }`}
                            title="Expand / Collapse individual variant rows"
                          >
                            <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            <span>{prod.variants.length}</span>
                          </button>
                        ) : (
                          <span className="font-mono text-neutral-400 text-xs">1</span>
                        )}
                      </td>

                      {/* 15. Actions (Sticky Right) */}
                      <td className={`py-3 px-4 text-right sticky right-0 z-20 border-l border-neutral-200 dark:border-neutral-800 shadow-[-4px_0_10px_rgba(0,0,0,0.04)] transition-colors ${stickyBgClass}`}>
                        <div className="flex items-center justify-end gap-1">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => saveEdit(prod.id)}
                                className="p-1 rounded bg-[#F1FF0A] text-black hover:bg-[#D4FF00] transition-colors cursor-pointer"
                                title="Save changes"
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
                                title="Quick Edit Product & Inventory"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {prod.url && (
                                <a
                                  href={prod.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
                                  title="Open original store URL"
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

                    {/* Expandable Child Variants Sub-Table */}
                    {isExpanded && prod.variants && prod.variants.length > 1 && (
                      <tr className="bg-neutral-100/70 dark:bg-neutral-900/50 border-y border-neutral-200 dark:border-neutral-800">
                        <td colSpan={16} className="p-3 pl-14 pr-6">
                          <div className="p-3 rounded-xl bg-white dark:bg-[#121216] border border-neutral-200 dark:border-neutral-800 shadow-inner space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-neutral-500 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                              <span className="flex items-center gap-1.5 text-neutral-900 dark:text-white">
                                <Layers className="w-3.5 h-3.5 text-[#8b9900] dark:text-[#F1FF0A]" />
                                <span>Individual Variants for "{prod.title}"</span>
                              </span>
                              <span className="text-[10px] text-neutral-400 font-normal">
                                Edit variant price, stock, SKU, and barcode directly
                              </span>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="text-[10px] text-neutral-400 font-semibold uppercase border-b border-neutral-100 dark:border-neutral-800">
                                    <th className="py-1.5 px-2">#</th>
                                    <th className="py-1.5 px-2">Variant Option / Title</th>
                                    <th className="py-1.5 px-2">Price</th>
                                    <th className="py-1.5 px-2">Compare At</th>
                                    <th className="py-1.5 px-2 text-center">Stock</th>
                                    <th className="py-1.5 px-2 font-mono">SKU</th>
                                    <th className="py-1.5 px-2 font-mono">Barcode</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-medium">
                                  {prod.variants.map((v, vIdx) => (
                                    <tr key={v.id || vIdx} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40">
                                      <td className="py-1.5 px-2 text-neutral-400 font-mono text-[10px]">
                                        {vIdx + 1}
                                      </td>
                                      <td className="py-1.5 px-2 font-semibold text-neutral-800 dark:text-neutral-200">
                                        {v.title || 'Default Title'}
                                      </td>
                                      <td className="py-1.5 px-2">
                                        <div className="flex items-center gap-1">
                                          <span className="text-neutral-400 text-[10px]">{rowCurrencySymbol}</span>
                                          <input
                                            type="number"
                                            step="0.01"
                                            defaultValue={v.price}
                                            onBlur={(e) => handleUpdateVariantField(prod.id, vIdx, 'price', e.target.value)}
                                            className="w-16 px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded text-xs outline-none focus:border-[#F1FF0A]"
                                          />
                                        </div>
                                      </td>
                                      <td className="py-1.5 px-2">
                                        <div className="flex items-center gap-1">
                                          <span className="text-neutral-400 text-[10px]">{rowCurrencySymbol}</span>
                                          <input
                                            type="number"
                                            step="0.01"
                                            placeholder="-"
                                            defaultValue={v.compare_at_price || ''}
                                            onBlur={(e) => handleUpdateVariantField(prod.id, vIdx, 'compare_at_price', e.target.value)}
                                            className="w-16 px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded text-xs outline-none focus:border-[#F1FF0A]"
                                          />
                                        </div>
                                      </td>
                                      <td className="py-1.5 px-2 text-center">
                                        <input
                                          type="number"
                                          min="0"
                                          defaultValue={v.inventory_quantity !== undefined ? v.inventory_quantity : activeDefaultStock}
                                          onBlur={(e) => handleUpdateVariantField(prod.id, vIdx, 'inventory_quantity', e.target.value)}
                                          className="w-14 px-1.5 py-0.5 text-center bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded text-xs font-bold outline-none focus:border-[#F1FF0A]"
                                        />
                                      </td>
                                      <td className="py-1.5 px-2 font-mono">
                                        <input
                                          type="text"
                                          placeholder="SKU"
                                          defaultValue={v.sku || ''}
                                          onBlur={(e) => handleUpdateVariantField(prod.id, vIdx, 'sku', e.target.value)}
                                          className="w-24 px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded text-[11px] font-mono outline-none focus:border-[#F1FF0A]"
                                        />
                                      </td>
                                      <td className="py-1.5 px-2 font-mono">
                                        <input
                                          type="text"
                                          placeholder="Barcode"
                                          defaultValue={v.barcode || ''}
                                          onBlur={(e) => handleUpdateVariantField(prod.id, vIdx, 'barcode', e.target.value)}
                                          className="w-24 px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded text-[11px] font-mono outline-none focus:border-[#F1FF0A]"
                                        />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

