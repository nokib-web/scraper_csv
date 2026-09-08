import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import UrlBar from './components/UrlBar';
import StatsBar from './components/StatsBar';
import ProgressConsole from './components/ProgressConsole';
import ProductTable from './components/ProductTable';
import ProductGrid from './components/ProductGrid';
import ExportDrawer from './components/ExportDrawer';
import FormatPreviewModal from './components/FormatPreviewModal';
import FindReplaceModal from './components/FindReplaceModal';
import BulkTagModal from './components/BulkTagModal';
import PricingPage from './components/PricingPage';
import AboutPage from './components/AboutPage';
import ContactPage from './components/ContactPage';
import AdSlot from './components/AdSlot';
import BrandSlider from './components/BrandSlider';
import Footer from './components/Footer';
import AccessibilityWidget from './components/AccessibilityWidget';
import { Table, LayoutGrid, Eye, Search, RotateCcw } from 'lucide-react';
import { saveCatalogData, loadCatalogData, clearCatalogData } from './utils/storage';
import { getApiBaseUrl } from './utils/api';
import { getCurrencySymbol } from './utils/currency';

export default function App() {
  const [activeTab, setActiveTab] = useState('app'); // 'app' | 'about' | 'pricing' | 'contact'
  const [url, setUrl] = useState('');
  const [engine, setEngine] = useState('auto');

  // User Plan State (Free 20 by default, or trial plan from localStorage)
  const [userPlan, setUserPlan] = useState(() => {
    try {
      const saved = localStorage.getItem('getproducts_user_plan');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.id === 'popular') parsed.maxLimit = 500;
        if (parsed.id === 'plus') parsed.maxLimit = 1000;
        if (parsed.id === 'advance') parsed.maxLimit = 5000;
        return parsed;
      }
    } catch (e) {}
    return { id: 'free', name: 'Starter Free', maxLimit: 20, isTrial: false };
  });

  const [limit, setLimit] = useState(() => {
    try {
      const saved = localStorage.getItem('getproducts_user_plan');
      if (saved) {
        const p = JSON.parse(saved);
        if (p.id === 'popular') return 500;
        if (p.id === 'plus') return 1000;
        if (p.id === 'advance') return 5000;
        return p.maxLimit || 20;
      }
    } catch (e) {}
    return 20; // Default to 20 for free users
  });

  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [products, setProducts] = useState([]);
  const [detection, setDetection] = useState(null);
  const [status, setStatus] = useState('idle');
  const [isConsoleCollapsed, setIsConsoleCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection State for Bulk Operations
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  // Modals
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewFormat, setPreviewFormat] = useState('shopify');
  const [findReplaceModalOpen, setFindReplaceModalOpen] = useState(false);
  const [bulkTagModalOpen, setBulkTagModalOpen] = useState(false);

  // Customizable Default Inventory / Stock Quantity (default: 99)
  const [defaultStock, setDefaultStock] = useState(() => {
    try {
      const saved = localStorage.getItem('getproducts_default_stock');
      if (saved !== null && saved !== '') return Number(saved);
    } catch (e) {}
    return 99;
  });

  // Inventory Stock Policy: 'continue' (Active & buyable) | 'deny' | 'untracked'
  const [inventoryPolicy, setInventoryPolicy] = useState(() => {
    try {
      const saved = localStorage.getItem('getproducts_inventory_policy');
      if (saved) return saved;
    } catch (e) {}
    return 'continue';
  });

  // Customizable Vendor / Brand (Optional override, default: '')
  const [customVendor, setCustomVendor] = useState(() => {
    try {
      const saved = localStorage.getItem('getproducts_custom_vendor');
      if (saved !== null && saved !== undefined) return saved;
    } catch (e) {}
    return '';
  });

  // Customizable Category (Optional override, default: '')
  const [customCategory, setCustomCategory] = useState(() => {
    try {
      const saved = localStorage.getItem('getproducts_custom_category');
      if (saved !== null && saved !== undefined) return saved;
    } catch (e) {}
    return '';
  });

  // Customizable Product Type (Optional override, default: '')
  const [customType, setCustomType] = useState(() => {
    try {
      const saved = localStorage.getItem('getproducts_custom_type');
      if (saved !== null && saved !== undefined) return saved;
    } catch (e) {}
    return '';
  });

  // Customizable Theme Template Suffix (Optional override, default: '')
  const [customTemplate, setCustomTemplate] = useState(() => {
    try {
      const saved = localStorage.getItem('getproducts_custom_template');
      if (saved !== null && saved !== undefined) return saved;
    } catch (e) {}
    return '';
  });

  // Price Markup / Profit Margin (None, +%, +$)
  const [priceMarkup, setPriceMarkup] = useState(() => {
    try {
      const saved = localStorage.getItem('getproducts_price_markup');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { type: 'none', value: 0 };
  });

  // Max Images Limit per Product (0 = All)
  const [maxImages, setMaxImages] = useState(() => {
    try {
      const saved = localStorage.getItem('getproducts_max_images');
      if (saved !== null && saved !== undefined) return Number(saved);
    } catch (e) {}
    return 0;
  });

  const handleSetDefaultStock = (val) => {
    if (val === '' || val === null) {
      setDefaultStock('');
      return;
    }
    const cleanVal = String(val).replace(/^0+(?=\d)/, '');
    const num = Math.max(0, parseInt(cleanVal, 10) || 0);
    setDefaultStock(num);
    try {
      localStorage.setItem('getproducts_default_stock', String(num));
    } catch (e) {}
  };

  const handleSetInventoryPolicy = (val) => {
    setInventoryPolicy(val);
    try {
      localStorage.setItem('getproducts_inventory_policy', val);
    } catch (e) {}
  };

  const handleSetCustomVendor = (val) => {
    setCustomVendor(val);
    try {
      localStorage.setItem('getproducts_custom_vendor', val);
    } catch (e) {}
  };

  const handleSetCustomCategory = (val) => {
    setCustomCategory(val);
    try {
      localStorage.setItem('getproducts_custom_category', val);
    } catch (e) {}
  };

  const handleSetCustomType = (val) => {
    setCustomType(val);
    try {
      localStorage.setItem('getproducts_custom_type', val);
    } catch (e) {}
  };

  const handleSetCustomTemplate = (val) => {
    setCustomTemplate(val);
    try {
      localStorage.setItem('getproducts_custom_template', val);
    } catch (e) {}
  };

  const handleSetPriceMarkup = (markup) => {
    setPriceMarkup(markup);
    try {
      localStorage.setItem('getproducts_price_markup', JSON.stringify(markup));
    } catch (e) {}
  };

  const handleSetMaxImages = (count) => {
    const num = Math.max(0, parseInt(count, 10) || 0);
    setMaxImages(num);
    try {
      localStorage.setItem('getproducts_max_images', String(num));
    } catch (e) {}
  };

  const handleSelectPlan = (plan) => {
    const updatedPlan = {
      id: plan.id,
      name: plan.name,
      maxLimit: plan.maxLimit,
      isTrial: plan.trial,
      trialDaysRemaining: 7,
      activatedAt: new Date().toISOString()
    };
    setUserPlan(updatedPlan);
    localStorage.setItem('getproducts_user_plan', JSON.stringify(updatedPlan));
    setLimit(plan.maxLimit);
  };

  // Load saved catalog from IndexedDB on initial mount
  useEffect(() => {
    async function restoreSession() {
      try {
        const savedProds = await loadCatalogData('getproducts_saved_products', []);
        const savedDetection = await loadCatalogData('getproducts_saved_detection', null);
        const savedUrl = await loadCatalogData('getproducts_last_url', '');
        const savedLogs = await loadCatalogData('getproducts_saved_logs', []);

        if (savedProds && savedProds.length > 0) {
          setProducts(savedProds);
          setDetection(savedDetection);
          setUrl(savedUrl || '');
          setLogs(savedLogs || []);
          setStatus('done');
        }
      } catch (e) {
        console.warn('Session restore error:', e);
      }
    }
    restoreSession();
  }, []);

  // Auto-detect active browser tab URL if running as Chrome / Edge Extension
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome?.tabs?.query) {
      try {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs[0]?.url) {
            const currentTabUrl = tabs[0].url;
            if (currentTabUrl.startsWith('http://') || currentTabUrl.startsWith('https://')) {
              setUrl(currentTabUrl);
            }
          }
        });
      } catch (e) {
        console.warn('Chrome extension active tab query info:', e);
      }
    }
  }, []);

  // Sync state to IndexedDB asynchronously on update
  useEffect(() => {
    if (products.length > 0) {
      saveCatalogData('getproducts_saved_products', products);
      saveCatalogData('getproducts_saved_detection', detection);
      saveCatalogData('getproducts_last_url', url);
      saveCatalogData('getproducts_saved_logs', logs);
    }
  }, [products, detection, url, logs]);

  const handleClearData = async () => {
    setProducts([]);
    setDetection(null);
    setLogs([]);
    setSelectedProductIds([]);
    setStatus('idle');
    setUrl('');
    await clearCatalogData();
  };

  // Theme Management (Dark by default, Cream Light option)
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  // Helper for applying price markup dynamically
  const applyMarkupMath = (val) => {
    if (val === undefined || val === null || val === '' || isNaN(Number(val))) return val;
    const num = Number(val);
    if (!priceMarkup || priceMarkup.type === 'none' || !priceMarkup.value) return num;
    if (priceMarkup.type === 'percent') {
      return Number((num * (1 + Number(priceMarkup.value) / 100)).toFixed(2));
    }
    if (priceMarkup.type === 'fixed') {
      return Number((num + Number(priceMarkup.value)).toFixed(2));
    }
    return num;
  };

  // Effective products list reflecting active custom vendor override, category override, type, template, price markup, and stock
  const effectiveProducts = useMemo(() => {
    const activeStock = (defaultStock !== '' && !isNaN(Number(defaultStock))) ? Number(defaultStock) : 99;

    return products.map(p => {
      const vName = customVendor && customVendor.trim() ? customVendor.trim() : p.vendor;
      const catName = customCategory && customCategory.trim() ? customCategory.trim() : (p.product_type || p.category || 'General');
      const typeName = customType && customType.trim() ? customType.trim() : (p.type || p.product_type || p.category || 'General');
      const templateSuffix = customTemplate && customTemplate.trim() ? customTemplate.trim() : (p.template_suffix || p.template || '');
      const markedPrice = applyMarkupMath(p.price || 0);
      const markedRegPrice = p.regular_price ? applyMarkupMath(p.regular_price) : 0;
      
      let imgs = p.images || (p.image ? [p.image] : []);
      if (maxImages > 0 && imgs.length > maxImages) {
        imgs = imgs.slice(0, maxImages);
      }

      const rawVariants = p.variants && p.variants.length > 0 ? p.variants : [{
        id: '1',
        title: 'Default Title',
        price: markedPrice,
        inventory_quantity: activeStock
      }];

      const variants = rawVariants.map(v => ({
        ...v,
        inventory_quantity: (v._customStock && v.inventory_quantity !== undefined && v.inventory_quantity !== null && v.inventory_quantity !== '')
          ? Number(v.inventory_quantity)
          : activeStock
      }));

      // Preserve or auto-resolve accurate currency
      const isBdSite = Boolean(
        url.includes('.bd') ||
        url.includes('maktabatulas') ||
        url.includes('rokomari') ||
        url.includes('wafilife') ||
        (p.title && /[\u0980-\u09FF]/.test(p.title))
      );
      const itemCurrency = (p.currency && p.currency !== 'USD')
        ? p.currency
        : (isBdSite ? 'BDT' : (p.currency || 'USD'));

      return {
        ...p,
        vendor: vName,
        product_type: catName,
        category: catName,
        type: typeName,
        template_suffix: templateSuffix,
        template: templateSuffix,
        price: markedPrice,
        regular_price: markedRegPrice > markedPrice ? markedRegPrice : (p.regular_price || 0),
        currency: itemCurrency,
        images: imgs,
        variants
      };
    });
  }, [products, url, customVendor, customCategory, customType, customTemplate, priceMarkup, maxImages, defaultStock]);

  // Filtered products based on search bar
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return effectiveProducts;
    const q = searchQuery.toLowerCase();
    return effectiveProducts.filter(p =>
      p.title?.toLowerCase().includes(q) ||
      p.vendor?.toLowerCase().includes(q) ||
      p.product_type?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.type?.toLowerCase().includes(q) ||
      p.template_suffix?.toLowerCase().includes(q) ||
      p.handle?.toLowerCase().includes(q) ||
      (Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(q)))
    );
  }, [effectiveProducts, searchQuery]);

  // Selected products subset
  const selectedProducts = useMemo(() => {
    if (selectedProductIds.length === 0) return [];
    const set = new Set(selectedProductIds);
    return effectiveProducts.filter(p => set.has(p.id));
  }, [effectiveProducts, selectedProductIds]);

  // Statistics calculation
  const stats = useMemo(() => {
    if (effectiveProducts.length === 0) return null;
    const prices = effectiveProducts.map(p => Number(p.price || 0)).filter(p => p > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const totalVariants = effectiveProducts.reduce((acc, p) => acc + (p.variants?.length || 1), 0);
    const totalImages = effectiveProducts.reduce((acc, p) => acc + (p.images?.length || 0), 0);
    const currency = effectiveProducts[0]?.currency || 'USD';
    const currencySymbol = getCurrencySymbol(currency);

    return {
      totalProducts: effectiveProducts.length,
      totalVariants,
      totalImages,
      minPrice: minPrice.toLocaleString(),
      maxPrice: maxPrice.toLocaleString(),
      currency,
      currencySymbol,
      engineSource: detection?.platform || products[0]?.source || 'Universal'
    };
  }, [effectiveProducts, detection, products]);

  // Selection Handlers
  const handleToggleSelect = (id) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = (selectAll) => {
    if (selectAll) {
      setSelectedProductIds(filteredProducts.map(p => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  // Bulk Category & Tag Operations
  const handleBulkSetCategory = (targetIds, newCategory) => {
    const targetSet = new Set(targetIds);
    setProducts(prev => prev.map(p => {
      if (!targetSet.has(p.id)) return p;
      return {
        ...p,
        product_type: newCategory,
        category: newCategory
      };
    }));
  };

  const handleBulkSetType = (targetIds, newType) => {
    const targetSet = new Set(targetIds);
    setProducts(prev => prev.map(p => {
      if (!targetSet.has(p.id)) return p;
      return {
        ...p,
        type: newType
      };
    }));
  };

  const handleBulkSetTemplate = (targetIds, newTemplate) => {
    const targetSet = new Set(targetIds);
    setProducts(prev => prev.map(p => {
      if (!targetSet.has(p.id)) return p;
      return {
        ...p,
        template_suffix: newTemplate,
        template: newTemplate
      };
    }));
  };

  const handleBulkAddTags = (targetIds, newTagsList) => {
    const targetSet = new Set(targetIds);
    setProducts(prev => prev.map(p => {
      if (!targetSet.has(p.id)) return p;
      const currentTags = Array.isArray(p.tags) ? [...p.tags] : (typeof p.tags === 'string' ? p.tags.split(',').map(t => t.trim()).filter(Boolean) : []);
      const mergedSet = new Set([...currentTags, ...newTagsList]);
      return {
        ...p,
        tags: Array.from(mergedSet)
      };
    }));
  };

  const handleBulkRemoveTag = (targetIds, tagToRemove) => {
    const targetSet = new Set(targetIds);
    setProducts(prev => prev.map(p => {
      if (!targetSet.has(p.id)) return p;
      const currentTags = Array.isArray(p.tags) ? [...p.tags] : (typeof p.tags === 'string' ? p.tags.split(',').map(t => t.trim()).filter(Boolean) : []);
      const filtered = currentTags.filter(t => t !== tagToRemove);
      return {
        ...p,
        tags: filtered
      };
    }));
  };

  // Find & Replace Handler
  const handleFindReplace = ({ findText, replaceText, matchTitle, matchDescription, matchVendor, matchCategory, caseSensitive }) => {
    if (!findText.trim()) return;

    const flags = caseSensitive ? 'g' : 'gi';
    const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, flags);

    setProducts(prev => prev.map(p => {
      let updatedTitle = p.title;
      let updatedDesc = p.description;
      let updatedVendor = p.vendor;
      let updatedProductType = p.product_type;
      let updatedCategory = p.category;
      let updatedType = p.type;

      if (matchTitle && p.title) {
        updatedTitle = p.title.replace(regex, replaceText);
      }
      if (matchDescription && p.description) {
        updatedDesc = p.description.replace(regex, replaceText);
      }
      if (matchVendor && p.vendor) {
        updatedVendor = p.vendor.replace(regex, replaceText);
      }
      if (matchCategory && (p.product_type || p.category || p.type)) {
        const catStr = p.product_type || p.category || '';
        updatedProductType = catStr.replace(regex, replaceText);
        updatedCategory = updatedProductType;
        if (p.type) {
          updatedType = p.type.replace(regex, replaceText);
        }
      }

      return {
        ...p,
        title: updatedTitle,
        description: updatedDesc,
        vendor: updatedVendor,
        product_type: updatedProductType,
        category: updatedCategory,
        type: updatedType
      };
    }));
  };

  // Bulk Delete Handler
  const handleBulkDelete = (targetIds) => {
    const targetSet = new Set(targetIds);
    setProducts(prev => prev.filter(p => !targetSet.has(p.id)));
    setSelectedProductIds(prev => prev.filter(id => !targetSet.has(id)));
  };

  // Scrape Submission via Server-Sent Events (SSE)
  const handleScrape = async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    setStatus('loading');
    setLogs([]);
    setProducts([]);
    setSelectedProductIds([]);
    setDetection(null);
    setIsConsoleCollapsed(false);

    try {
      const apiBase = getApiBaseUrl();
      const sseUrl = `${apiBase}/api/scrape-stream?url=${encodeURIComponent(url.trim())}&engine=${engine}&limit=${limit}`;
      const eventSource = new EventSource(sseUrl);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'log') {
            setLogs(prev => [...prev, data.message]);
          } else if (data.type === 'detected') {
            setDetection(data.detection);
          } else if (data.type === 'complete') {
            setProducts(data.products || []);
            setDetection(data.detection);
            setStatus('done');
            setIsLoading(false);
            eventSource.close();
          } else if (data.type === 'error') {
            setLogs(prev => [...prev, `[ERROR] ${data.error}`]);
            setStatus('error');
            setIsLoading(false);
            eventSource.close();
          }
        } catch (e) {
          console.error('SSE JSON parse error:', e);
        }
      };

      eventSource.onerror = async () => {
        eventSource.close();
        setLogs(prev => [...prev, '[INFO] Falling back to standard JSON scrape endpoint...']);

        try {
          const res = await fetch(`${apiBase}/api/scrape`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url.trim(), engine, limit })
          });
          const json = await res.json();

          if (res.ok && json.products) {
            setProducts(json.products);
            setDetection(json.detection);
            setStatus('done');
            setLogs(prev => [...prev, `[SUCCESS] Extracted ${json.products.length} products.`]);
          } else {
            setStatus('error');
            setLogs(prev => [...prev, `[ERROR] ${json.error || 'Failed to scrape'}`]);
          }
        } catch (err) {
          setStatus('error');
          setLogs(prev => [...prev, `[ERROR] ${err.message}`]);
        } finally {
          setIsLoading(false);
        }
      };
    } catch (err) {
      setStatus('error');
      setIsLoading(false);
      setLogs(prev => [...prev, `[ERROR] ${err.message}`]);
    }
  };

  // Export Trigger
  const handleExport = async (format, customStock, overrideVendor, overrideCategory, overrideType, overrideTemplate) => {
    // Export selected items if any are checked, otherwise all effective products
    const exportItems = selectedProducts.length > 0 ? selectedProducts : effectiveProducts;
    if (exportItems.length === 0) return;

    try {
      const formatMap = {
        shopify: 'shopify_csv',
        shopify_inventory: 'shopify_inventory_csv',
        woocommerce: 'woocommerce_csv',
        wix: 'wix_csv',
        universal: 'universal_csv',
        json: 'json'
      };
      const normalizedFormat = formatMap[format] || format;
      const effectiveStock = (customStock !== undefined && customStock !== '') 
        ? Number(customStock) 
        : (defaultStock !== '' ? Number(defaultStock) : 99);
      const effectiveVendor = overrideVendor !== undefined ? overrideVendor : customVendor;
      const effectiveCategory = overrideCategory !== undefined ? overrideCategory : customCategory;
      const effectiveType = overrideType !== undefined ? overrideType : customType;
      const effectiveTemplate = overrideTemplate !== undefined ? overrideTemplate : customTemplate;
      const apiBase = getApiBaseUrl();

      const response = await fetch(`${apiBase}/api/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: exportItems,
          format: normalizedFormat,
          defaultStock: effectiveStock,
          inventoryPolicy,
          customVendor: effectiveVendor,
          customCategory: effectiveCategory,
          customType: effectiveType,
          customTemplate: effectiveTemplate,
          priceMarkup,
          maxImages,
          proxyBase: window.location.origin,
          storeName: url.replace(/^https?:\/\//, '').split('/')[0] || 'store'
        })
      });

      if (!response.ok) throw new Error('Export download failed');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;

      const ext = format === 'json' ? 'json' : 'csv';
      const cleanHost = url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0].replace(/[^a-zA-Z0-9_-]/g, '_') || 'catalog';
      const selectionSuffix = selectedProducts.length > 0 ? `_selected_${selectedProducts.length}` : '';
      a.download = `${cleanHost}_${format}_products${selectionSuffix}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert(`Export error: ${err.message}`);
    }
  };

  const handleUpdateProduct = (id, updatedFields) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updatedFields } : p));
  };

  const handleDeleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    setSelectedProductIds(prev => prev.filter(itemId => itemId !== id));
  };

  const handleOpenPreview = (format = 'shopify') => {
    setPreviewFormat(format);
    setPreviewModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0A0C] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-300 antialiased">
      
      {/* Top Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userPlan={userPlan}
        isDark={isDark}
        toggleTheme={toggleTheme}
        productsCount={products.length}
      />

      {/* Main App Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        
        {/* Route Page Tabs */}
        {activeTab === 'pricing' && <PricingPage userPlan={userPlan} onSelectPlan={handleSelectPlan} />}
        {activeTab === 'about' && <AboutPage />}
        {activeTab === 'contact' && <ContactPage />}

        {activeTab === 'app' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            
            {/* Scraper URL & Control Bar */}
            <UrlBar
              url={url}
              setUrl={setUrl}
              engine={engine}
              setEngine={setEngine}
              limit={limit}
              setLimit={setLimit}
              userPlan={userPlan}
              isLoading={isLoading}
              onSubmit={handleScrape}
              onClear={() => setUrl('')}
              onUpgradeClick={() => setActiveTab('pricing')}
            />

            {/* Extraction Live Terminal Console */}
            {(logs.length > 0 || isLoading) && (
              <ProgressConsole
                logs={logs}
                status={status}
                detection={detection}
                productsCount={products.length}
                isCollapsed={isConsoleCollapsed}
                setIsCollapsed={setIsConsoleCollapsed}
              />
            )}

            {/* Catalog Overview Statistics */}
            {stats && (
              <StatsBar stats={stats} />
            )}

            {/* Export Toolbar & Quick Download Cards */}
            {effectiveProducts.length > 0 && (
              <ExportDrawer
                products={effectiveProducts}
                onExport={handleExport}
                onOpenPreview={handleOpenPreview}
                stats={stats}
                defaultStock={defaultStock}
                onDefaultStockChange={handleSetDefaultStock}
                inventoryPolicy={inventoryPolicy}
                onInventoryPolicyChange={handleSetInventoryPolicy}
                customVendor={customVendor}
                onCustomVendorChange={handleSetCustomVendor}
                customCategory={customCategory}
                onCustomCategoryChange={handleSetCustomCategory}
                customType={customType}
                onCustomTypeChange={handleSetCustomType}
                customTemplate={customTemplate}
                onCustomTemplateChange={handleSetCustomTemplate}
                priceMarkup={priceMarkup}
                onPriceMarkupChange={handleSetPriceMarkup}
                maxImages={maxImages}
                onMaxImagesChange={handleSetMaxImages}
                onOpenFindReplace={() => setFindReplaceModalOpen(true)}
                selectedCount={selectedProductIds.length}
                onSelectAll={() => handleToggleSelectAll(true)}
                onClearSelection={() => handleToggleSelectAll(false)}
              />
            )}

            {/* Search Bar & View Mode Switcher */}
            {effectiveProducts.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  
                  {/* Search filter input */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      aria-label="Search extracted products by title, vendor, or tags"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search extracted products by title, vendor, category, type, tags..."
                      className="w-full pl-9 pr-4 py-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 outline-none focus:border-[#F1FF0A] transition-colors shadow-sm"
                    />
                  </div>

                  {/* Actions & View Mode Toggle */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={handleClearData}
                      aria-label="Clear all extracted catalog data"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/20 text-xs font-semibold transition-colors cursor-pointer"
                      title="Clear Extracted Catalog Data"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Clear Data</span>
                    </button>

                    <button
                      onClick={() => handleOpenPreview('shopify')}
                      aria-label="Open live CSV preview modal"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-300 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#8b9900] dark:text-[#F1FF0A]" />
                      <span>Live Preview CSV</span>
                    </button>

                    <div className="flex items-center p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800">
                      <button
                        onClick={() => setViewMode('table')}
                        aria-label="Switch to spreadsheet table view"
                        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                          viewMode === 'table' ? 'bg-[#F1FF0A] text-black font-bold' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                        title="Spreadsheet Table View"
                      >
                        <Table className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('grid')}
                        aria-label="Switch to product grid view"
                        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                          viewMode === 'grid' ? 'bg-[#F1FF0A] text-black font-bold' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                        title="Card Grid View"
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Catalog View: Table or Grid */}
                {viewMode === 'table' ? (
                  <ProductTable
                    products={filteredProducts}
                    onUpdateProduct={handleUpdateProduct}
                    onDeleteProduct={handleDeleteProduct}
                    selectedProductIds={selectedProductIds}
                    onToggleSelect={handleToggleSelect}
                    onToggleSelectAll={handleToggleSelectAll}
                    onOpenBulkTags={() => setBulkTagModalOpen(true)}
                    onBulkDelete={() => handleBulkDelete(selectedProductIds)}
                    onBulkExport={(format) => handleExport(format || 'shopify')}
                    onOpenPreview={(format) => handleOpenPreview(format || 'shopify')}
                    currencySymbol={stats?.currencySymbol || '$'}
                    defaultStock={defaultStock}
                  />
                ) : (
                  <ProductGrid
                    products={filteredProducts}
                    onDeleteProduct={handleDeleteProduct}
                    selectedProductIds={selectedProductIds}
                    onToggleSelect={handleToggleSelect}
                    currencySymbol={stats?.currencySymbol || '$'}
                    defaultStock={defaultStock}
                  />
                )}
              </div>
            )}

            {/* Brand Logo Showcase */}
            <BrandSlider />

            {/* Native Responsive Ad Banner */}
            <AdSlot />

          </div>
        )}
      </main>

      {/* Live Format Preview Modal */}
      <FormatPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        products={selectedProducts.length > 0 ? selectedProducts : effectiveProducts}
        defaultFormat={previewFormat}
        onExport={handleExport}
        defaultStock={defaultStock}
        onDefaultStockChange={handleSetDefaultStock}
        inventoryPolicy={inventoryPolicy}
        customVendor={customVendor}
        onCustomVendorChange={handleSetCustomVendor}
        customCategory={customCategory}
        onCustomCategoryChange={handleSetCustomCategory}
        customType={customType}
        onCustomTypeChange={handleSetCustomType}
        customTemplate={customTemplate}
        onCustomTemplateChange={handleSetCustomTemplate}
        priceMarkup={priceMarkup}
        onPriceMarkupChange={handleSetPriceMarkup}
        maxImages={maxImages}
        onMaxImagesChange={handleSetMaxImages}
        storeName={url.replace(/^https?:\/\//, '').split('/')[0] || 'store'}
      />

      {/* Find & Replace Modal */}
      <FindReplaceModal
        isOpen={findReplaceModalOpen}
        onClose={() => setFindReplaceModalOpen(false)}
        products={products}
        onApplyReplace={handleFindReplace}
      />

      {/* Bulk Tag, Category, Type & Template Modal for Selected Products */}
      <BulkTagModal
        isOpen={bulkTagModalOpen}
        onClose={() => setBulkTagModalOpen(false)}
        selectedProductIds={selectedProductIds}
        products={products}
        onApplyAddTags={handleBulkAddTags}
        onApplyRemoveTag={handleBulkRemoveTag}
        onApplySetCategory={handleBulkSetCategory}
        onApplySetType={handleBulkSetType}
        onApplySetTemplate={handleBulkSetTemplate}
      />

      {/* Fixed Bottom Docked Footer */}
      <Footer />

      {/* ADA & WCAG Accessibility Drawer & Floating Trigger */}
      <AccessibilityWidget />

    </div>
  );
}
