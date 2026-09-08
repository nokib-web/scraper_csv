import React, { useState, useMemo } from 'react';
import { 
  X, Tag, FolderTree, Layers, LayoutTemplate, Plus, Check, Sparkles, 
  DollarSign, Package, Barcode, ShieldCheck, ArrowRight, Percent, RefreshCw,
  Hash, Truck, CheckCircle2
} from 'lucide-react';

export default function BulkTagModal({ 
  isOpen, 
  onClose, 
  selectedProductIds = [], 
  products = [], 
  onApplyAddTags, 
  onApplyRemoveTag,
  onApplySetCategory,
  onApplySetType,
  onApplySetTemplate,
  onApplySetPrice,
  onApplySetStock,
  onApplySetSku,
  onApplySetStatus,
  onApplySetVendor
}) {
  // Tabs: 'category' | 'type' | 'template' | 'price' | 'inventory' | 'sku' | 'status' | 'tags'
  const [activeTab, setActiveTab] = useState('category');
  
  // Tab Inputs
  const [newTagInput, setNewTagInput] = useState('');
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [newTypeInput, setNewTypeInput] = useState('');
  const [newTemplateInput, setNewTemplateInput] = useState('');
  const [newVendorInput, setNewVendorInput] = useState('');
  
  // Pricing state
  const [priceAction, setPriceAction] = useState('percent_increase'); // 'percent_increase' | 'percent_decrease' | 'fixed_increase' | 'fixed_decrease' | 'set_price' | 'set_compare'
  const [priceAmount, setPriceAmount] = useState('');
  
  // Inventory state
  const [stockAction, setStockAction] = useState('set'); // 'set' | 'add' | 'subtract'
  const [stockAmount, setStockAmount] = useState('99');
  const [inventoryPolicy, setInventoryPolicy] = useState('continue'); // 'continue' | 'deny'
  
  // SKU & Barcode state
  const [skuPrefix, setSkuPrefix] = useState('SKU-');
  const [skuStartNum, setSkuStartNum] = useState(1);
  const [skuSuffix, setSkuSuffix] = useState('');

  // Status & Visibility state
  const [productStatus, setProductStatus] = useState('active');

  const [feedback, setFeedback] = useState('');

  // Selected products list
  const selectedProducts = useMemo(() => {
    const set = new Set(selectedProductIds);
    return products.filter(p => set.has(p.id));
  }, [selectedProductIds, products]);

  // Aggregate all unique tags currently existing across selected products
  const currentTagsSummary = useMemo(() => {
    const tagCountMap = new Map();
    for (const prod of selectedProducts) {
      const tagsList = Array.isArray(prod.tags) ? prod.tags : (typeof prod.tags === 'string' ? prod.tags.split(',').map(t => t.trim()).filter(Boolean) : []);
      for (const t of tagsList) {
        tagCountMap.set(t, (tagCountMap.get(t) || 0) + 1);
      }
    }
    return Array.from(tagCountMap.entries()).map(([tag, count]) => ({ tag, count }));
  }, [selectedProducts]);

  const quickTagPresets = [
    'Summer-Sale', 'Trending', 'Best-Seller', 'New-Arrival', 'Featured', 'Hot-Deal', 'Discount', 'Limited-Edition'
  ];

  const quickCategoryPresets = [
    'Electronics', 'Fashion & Clothing', 'Shoes & Footwear', 'Home & Living', 'Beauty & Cosmetics', 'Books & Stationery', 'Sports & Outdoors', 'Groceries & Food', 'Jewelry & Watches', 'Health & Wellness'
  ];

  const quickTypePresets = [
    'T-Shirt', 'Sneakers', 'Hoodie', 'Dress', 'Smart Watch', 'Headphones', 'Bag & Backpack', 'Accessories', 'Beauty Product', 'Home Decor'
  ];

  const quickTemplatePresets = [
    { label: 'book (product.book)', val: 'book' },
    { label: 'food (product.food)', val: 'food' },
    { label: 'pre-order', val: 'pre-order' },
    { label: 'custom-layout', val: 'custom-layout' },
    { label: 'gift-card', val: 'gift-card' },
    { label: 'bundle', val: 'bundle' },
    { label: 'coming-soon', val: 'coming-soon' },
    { label: 'special-deal', val: 'special-deal' },
    { label: 'Default (product)', val: '' }
  ];

  if (!isOpen || selectedProducts.length === 0) return null;

  const showFeedbackMsg = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 2500);
  };

  // Handlers
  const handleSetCategorySubmit = (e) => {
    if (e) e.preventDefault();
    if (!newCategoryInput.trim() || !onApplySetCategory) return;
    onApplySetCategory(selectedProductIds, newCategoryInput.trim());
    showFeedbackMsg(`Updated category to "${newCategoryInput.trim()}" for ${selectedProducts.length} product(s)!`);
    setNewCategoryInput('');
  };

  const handleApplyPresetCategory = (cat) => {
    if (!onApplySetCategory) return;
    onApplySetCategory(selectedProductIds, cat);
    showFeedbackMsg(`Updated category to "${cat}" for ${selectedProducts.length} product(s)!`);
  };

  const handleSetTypeSubmit = (e) => {
    if (e) e.preventDefault();
    if (!newTypeInput.trim() || !onApplySetType) return;
    onApplySetType(selectedProductIds, newTypeInput.trim());
    showFeedbackMsg(`Updated product type to "${newTypeInput.trim()}" for ${selectedProducts.length} product(s)!`);
    setNewTypeInput('');
  };

  const handleApplyPresetType = (typeVal) => {
    if (!onApplySetType) return;
    onApplySetType(selectedProductIds, typeVal);
    showFeedbackMsg(`Updated product type to "${typeVal}" for ${selectedProducts.length} product(s)!`);
  };

  const handleSetTemplateSubmit = (e) => {
    if (e) e.preventDefault();
    if (!onApplySetTemplate) return;
    const cleanTemplate = newTemplateInput.trim().replace(/^product\./i, '');
    onApplySetTemplate(selectedProductIds, cleanTemplate);
    showFeedbackMsg(`Set template suffix to "${cleanTemplate || 'default'}" for ${selectedProducts.length} product(s)!`);
    setNewTemplateInput('');
  };

  const handleApplyPresetTemplate = (tmplVal) => {
    if (!onApplySetTemplate) return;
    const clean = tmplVal.replace(/^product\./i, '');
    onApplySetTemplate(selectedProductIds, clean);
    showFeedbackMsg(`Set template suffix to "${clean || 'default'}" for ${selectedProducts.length} product(s)!`);
  };

  const handleSetVendorSubmit = (e) => {
    if (e) e.preventDefault();
    if (!newVendorInput.trim() || !onApplySetVendor) return;
    onApplySetVendor(selectedProductIds, newVendorInput.trim());
    showFeedbackMsg(`Updated vendor to "${newVendorInput.trim()}" for ${selectedProducts.length} product(s)!`);
    setNewVendorInput('');
  };

  const handleApplyPriceSubmit = (e) => {
    if (e) e.preventDefault();
    if (!priceAmount || isNaN(Number(priceAmount)) || !onApplySetPrice) return;
    onApplySetPrice(selectedProductIds, { action: priceAction, amount: Number(priceAmount) });
    showFeedbackMsg(`Applied price adjustment for ${selectedProducts.length} product(s)!`);
  };

  const handleApplyStockSubmit = (e) => {
    if (e) e.preventDefault();
    if (!onApplySetStock) return;
    onApplySetStock(selectedProductIds, { action: stockAction, amount: Number(stockAmount) || 0, policy: inventoryPolicy });
    showFeedbackMsg(`Updated inventory stock for ${selectedProducts.length} product(s)!`);
  };

  const handleApplySkuSubmit = (e) => {
    if (e) e.preventDefault();
    if (!onApplySetSku) return;
    onApplySetSku(selectedProductIds, { prefix: skuPrefix, startNum: parseInt(skuStartNum, 10) || 1, suffix: skuSuffix });
    showFeedbackMsg(`Generated sequential SKUs for ${selectedProducts.length} product(s)!`);
  };

  const handleApplyStatusSubmit = (statusVal) => {
    if (!onApplySetStatus) return;
    setProductStatus(statusVal);
    onApplySetStatus(selectedProductIds, statusVal);
    showFeedbackMsg(`Set status to "${statusVal.toUpperCase()}" for ${selectedProducts.length} product(s)!`);
  };

  const handleAddTagSubmit = (e) => {
    if (e) e.preventDefault();
    if (!newTagInput.trim() || !onApplyAddTags) return;
    const parsedTags = newTagInput.split(',').map(t => t.trim()).filter(Boolean);
    if (parsedTags.length === 0) return;
    onApplyAddTags(selectedProductIds, parsedTags);
    showFeedbackMsg(`Added tag(s) to ${selectedProducts.length} product(s)!`);
    setNewTagInput('');
  };

  const handleApplyPresetTag = (tag) => {
    if (!onApplyAddTags) return;
    onApplyAddTags(selectedProductIds, [tag]);
    showFeedbackMsg(`Added tag "#${tag}" to ${selectedProducts.length} product(s)!`);
  };

  const handleRemoveTag = (tag) => {
    if (!onApplyRemoveTag) return;
    onApplyRemoveTag(selectedProductIds, tag);
    showFeedbackMsg(`Removed tag "#${tag}" from selected products!`);
  };

  const navTabs = [
    { id: 'category', label: 'Category & Type', icon: <FolderTree className="w-3.5 h-3.5" /> },
    { id: 'price', label: 'Pricing & Markup', icon: <DollarSign className="w-3.5 h-3.5" /> },
    { id: 'inventory', label: 'Stock & Inventory', icon: <Package className="w-3.5 h-3.5" /> },
    { id: 'sku', label: 'SKU & Barcodes', icon: <Barcode className="w-3.5 h-3.5" /> },
    { id: 'status', label: 'Status & Vendor', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: 'tags', label: 'Tags Manager', icon: <Tag className="w-3.5 h-3.5" /> }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#111114] border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#F1FF0A]/10 border border-[#F1FF0A]/20 text-[#8b9900] dark:text-[#F1FF0A]">
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                <span>Shopify Inventory Bulk Editor</span>
                <span className="px-2 py-0.5 rounded-full bg-[#F1FF0A] text-black text-[10px] font-black uppercase tracking-wider">
                  {selectedProducts.length} Selected
                </span>
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Bulk modify categories, types, template suffixes, prices, stocks, and SKUs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher Bar */}
        <div className="flex items-center gap-1 px-5 pt-3 pb-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/40 overflow-x-auto scrollbar-none">
          {navTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === t.id
                  ? 'bg-neutral-900 text-white dark:bg-[#F1FF0A] dark:text-black shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Feedback message banner */}
          {feedback && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4" />
              <span>{feedback}</span>
            </div>
          )}

          {/* TAB 1: CATEGORY & TYPE */}
          {activeTab === 'category' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Category */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center justify-between">
                  <span>Set Product Category (Taxonomy)</span>
                  <span className="text-[10px] text-neutral-400">Maps to Product Category column</span>
                </label>
                <form onSubmit={handleSetCategorySubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    placeholder="e.g. Fashion & Clothing, Electronics..."
                    className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white outline-none focus:border-[#F1FF0A]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#F1FF0A] hover:bg-[#D4FF00] text-black font-extrabold text-xs cursor-pointer"
                  >
                    Apply Category
                  </button>
                </form>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {quickCategoryPresets.slice(0, 6).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleApplyPresetCategory(cat)}
                      className="px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 hover:border-[#F1FF0A] transition-colors cursor-pointer"
                    >
                      + {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Type */}
              <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center justify-between">
                  <span>Set Custom Product Type</span>
                  <span className="text-[10px] text-neutral-400">Maps to Type column in Shopify CSV</span>
                </label>
                <form onSubmit={handleSetTypeSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={newTypeInput}
                    onChange={(e) => setNewTypeInput(e.target.value)}
                    placeholder="e.g. T-Shirt, Sneaker, Smart Watch..."
                    className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white outline-none focus:border-[#F1FF0A]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs cursor-pointer"
                  >
                    Apply Type
                  </button>
                </form>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {quickTypePresets.slice(0, 6).map((tp) => (
                    <button
                      key={tp}
                      type="button"
                      onClick={() => handleApplyPresetType(tp)}
                      className="px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 hover:border-blue-500 transition-colors cursor-pointer"
                    >
                      + {tp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Suffix */}
              <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center justify-between">
                  <span>Set Shopify Theme Template Suffix</span>
                  <span className="text-[10px] text-neutral-400">e.g. "book" -&gt; product.book</span>
                </label>
                <form onSubmit={handleSetTemplateSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={newTemplateInput}
                    onChange={(e) => setNewTemplateInput(e.target.value)}
                    placeholder="e.g. pre-order, custom-layout, book..."
                    className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white font-mono outline-none focus:border-[#F1FF0A]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs cursor-pointer"
                  >
                    Apply Suffix
                  </button>
                </form>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {quickTemplatePresets.map((tmpl) => (
                    <button
                      key={tmpl.label}
                      type="button"
                      onClick={() => handleApplyPresetTemplate(tmpl.val)}
                      className="px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[11px] font-mono font-semibold text-neutral-700 dark:text-neutral-300 hover:border-amber-500 transition-colors cursor-pointer"
                    >
                      {tmpl.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRICING & MARKUP */}
          {activeTab === 'price' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-3">
                <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Bulk Price Adjustment for {selectedProducts.length} Product(s)
                </label>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPriceAction('percent_increase')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      priceAction === 'percent_increase'
                        ? 'bg-[#F1FF0A] text-black font-extrabold border-[#F1FF0A]'
                        : 'bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <div className="font-bold">+ Increase by %</div>
                    <div className="text-[10px] opacity-80">e.g. +15% profit markup</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPriceAction('percent_decrease')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      priceAction === 'percent_decrease'
                        ? 'bg-[#F1FF0A] text-black font-extrabold border-[#F1FF0A]'
                        : 'bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <div className="font-bold">- Discount by %</div>
                    <div className="text-[10px] opacity-80">e.g. -20% seasonal sale</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPriceAction('fixed_increase')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      priceAction === 'fixed_increase'
                        ? 'bg-[#F1FF0A] text-black font-extrabold border-[#F1FF0A]'
                        : 'bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <div className="font-bold">+ Fixed Amount</div>
                    <div className="text-[10px] opacity-80">e.g. Add +$10 to all items</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPriceAction('set_price')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      priceAction === 'set_price'
                        ? 'bg-[#F1FF0A] text-black font-extrabold border-[#F1FF0A]'
                        : 'bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <div className="font-bold">Set Exact Price</div>
                    <div className="text-[10px] opacity-80">Set all prices to fixed value</div>
                  </button>
                </div>

                <form onSubmit={handleApplyPriceSubmit} className="flex gap-2 pt-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.01"
                      value={priceAmount}
                      onChange={(e) => setPriceAmount(e.target.value)}
                      placeholder={priceAction.includes('percent') ? "Enter percentage (e.g. 15)" : "Enter amount (e.g. 10.00)"}
                      className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white outline-none focus:border-[#F1FF0A]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 font-bold">
                      {priceAction.includes('percent') ? '%' : '$'}
                    </span>
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#F1FF0A] hover:bg-[#D4FF00] text-black font-extrabold text-xs cursor-pointer shadow-sm"
                  >
                    Apply Price Change
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: STOCK & INVENTORY */}
          {activeTab === 'inventory' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-3">
                <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Manage Inventory Quantity for {selectedProducts.length} Product(s)
                </label>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setStockAction('set')}
                    className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                      stockAction === 'set'
                        ? 'bg-[#F1FF0A] text-black font-extrabold border-[#F1FF0A]'
                        : 'bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <div className="font-bold">Set Quantity</div>
                    <div className="text-[10px] opacity-80">e.g. 100 in stock</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStockAction('add')}
                    className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                      stockAction === 'add'
                        ? 'bg-[#F1FF0A] text-black font-extrabold border-[#F1FF0A]'
                        : 'bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <div className="font-bold">+ Add Stock</div>
                    <div className="text-[10px] opacity-80">Add to existing quantity</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStockAction('subtract')}
                    className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                      stockAction === 'subtract'
                        ? 'bg-[#F1FF0A] text-black font-extrabold border-[#F1FF0A]'
                        : 'bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <div className="font-bold">- Deduct Stock</div>
                    <div className="text-[10px] opacity-80">Subtract from existing</div>
                  </button>
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="number"
                    min="0"
                    value={stockAmount}
                    onChange={(e) => setStockAmount(e.target.value)}
                    placeholder="Enter stock quantity (e.g. 99)"
                    className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white outline-none focus:border-[#F1FF0A]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyStockSubmit}
                    className="px-5 py-2 rounded-xl bg-[#F1FF0A] hover:bg-[#D4FF00] text-black font-extrabold text-xs cursor-pointer shadow-sm"
                  >
                    Apply Stock
                  </button>
                </div>

                {/* Inventory Policy */}
                <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 space-y-2 mt-3">
                  <div className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
                    When Out of Stock (Inventory Policy):
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setInventoryPolicy('continue')}
                      className={`p-2 rounded-lg border font-bold cursor-pointer transition-all ${
                        inventoryPolicy === 'continue'
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-800'
                      }`}
                    >
                      Continue Selling
                    </button>
                    <button
                      type="button"
                      onClick={() => setInventoryPolicy('deny')}
                      className={`p-2 rounded-lg border font-bold cursor-pointer transition-all ${
                        inventoryPolicy === 'deny'
                          ? 'bg-red-500 text-white border-red-500'
                          : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-800'
                      }`}
                    >
                      Stop Selling (Deny)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SKU & BARCODES */}
          {activeTab === 'sku' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-3">
                <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Auto-Generate Sequential SKUs for {selectedProducts.length} Product(s)
                </label>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 block mb-1">Prefix</label>
                    <input
                      type="text"
                      value={skuPrefix}
                      onChange={(e) => setSkuPrefix(e.target.value)}
                      placeholder="e.g. STORE-"
                      className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white font-mono outline-none focus:border-[#F1FF0A]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 block mb-1">Start Number</label>
                    <input
                      type="number"
                      min="1"
                      value={skuStartNum}
                      onChange={(e) => setSkuStartNum(e.target.value)}
                      placeholder="1"
                      className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white font-mono outline-none focus:border-[#F1FF0A]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 block mb-1">Suffix (Optional)</label>
                    <input
                      type="text"
                      value={skuSuffix}
                      onChange={(e) => setSkuSuffix(e.target.value)}
                      placeholder="e.g. -2026"
                      className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white font-mono outline-none focus:border-[#F1FF0A]"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs flex items-center justify-between">
                  <span className="text-neutral-500">Preview First SKU:</span>
                  <span className="font-mono font-bold text-[#8b9900] dark:text-[#F1FF0A]">
                    {skuPrefix}{String(skuStartNum).padStart(3, '0')}{skuSuffix}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleApplySkuSubmit}
                  className="w-full py-2.5 rounded-xl bg-[#F1FF0A] hover:bg-[#D4FF00] text-black font-extrabold text-xs cursor-pointer shadow-sm"
                >
                  Generate Sequential SKUs Across All Selected Items
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: STATUS & VENDOR */}
          {activeTab === 'status' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Product Status */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Set Product Status (Shopify / E-Commerce Status)
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleApplyStatusSubmit('active')}
                    className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-center transition-all cursor-pointer"
                  >
                    <div className="text-sm font-black">ACTIVE</div>
                    <div className="text-[10px] opacity-80 mt-0.5">Live on storefront</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyStatusSubmit('draft')}
                    className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold text-center transition-all cursor-pointer"
                  >
                    <div className="text-sm font-black">DRAFT</div>
                    <div className="text-[10px] opacity-80 mt-0.5">Hidden from store</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyStatusSubmit('archived')}
                    className="p-3 rounded-xl border border-neutral-500/30 bg-neutral-500/10 hover:bg-neutral-500/20 text-neutral-600 dark:text-neutral-400 font-extrabold text-center transition-all cursor-pointer"
                  >
                    <div className="text-sm font-black">ARCHIVED</div>
                    <div className="text-[10px] opacity-80 mt-0.5">Archived catalog</div>
                  </button>
                </div>
              </div>

              {/* Vendor Override */}
              <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Bulk Set Vendor / Brand Name
                </label>
                <form onSubmit={handleSetVendorSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={newVendorInput}
                    onChange={(e) => setNewVendorInput(e.target.value)}
                    placeholder="Enter Brand / Vendor Name..."
                    className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white outline-none focus:border-[#F1FF0A]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#F1FF0A] hover:bg-[#D4FF00] text-black font-extrabold text-xs cursor-pointer"
                  >
                    Set Vendor
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 6: TAGS MANAGER */}
          {activeTab === 'tags' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Add Tags Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Add Tags to Selected Products (Comma-separated)
                </label>
                <form onSubmit={handleAddTagSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    placeholder="e.g. Summer-Sale, Featured, Bestseller..."
                    className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:border-[#F1FF0A] transition-colors"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F1FF0A] hover:bg-[#D4FF00] text-black font-extrabold text-xs transition-all shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Add Tags</span>
                  </button>
                </form>
              </div>

              {/* Quick Preset Tags */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Quick Preset Tags
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {quickTagPresets.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleApplyPresetTag(tag)}
                      className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-[#F1FF0A]/60 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-[#F1FF0A] transition-colors cursor-pointer"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Currently Shared Tags with Removal */}
              <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <div className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                  <span>Current Tags on Selected Products</span>
                  <span className="text-neutral-400 font-normal">Click &times; to remove from all selected</span>
                </div>

                {currentTagsSummary.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800">
                    {currentTagsSummary.map(({ tag, count }) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 shadow-sm group"
                      >
                        <span>#{tag}</span>
                        <span className="px-1 py-0.2 rounded bg-neutral-200 dark:bg-neutral-800 text-[9px] font-mono text-neutral-500">
                          {count}/{selectedProducts.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-neutral-400 hover:text-red-500 transition-colors cursor-pointer p-0.5"
                          title={`Remove #${tag} from all selected items`}
                        >
                          <X className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-neutral-500 italic p-3 text-center bg-neutral-50 dark:bg-neutral-900/30 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">
                    No tags currently assigned to these selected items.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/80">
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            Selected: <span className="font-bold text-neutral-900 dark:text-white">{selectedProducts.length} items</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-[#F1FF0A] dark:text-black font-extrabold text-xs transition-all shadow-sm cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
