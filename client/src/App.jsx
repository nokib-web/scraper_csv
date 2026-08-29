import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import UrlBar from './components/UrlBar';
import StatsBar from './components/StatsBar';
import ProgressConsole from './components/ProgressConsole';
import ProductTable from './components/ProductTable';
import ProductGrid from './components/ProductGrid';
import ExportDrawer from './components/ExportDrawer';
import FormatPreviewModal from './components/FormatPreviewModal';
import PricingPage from './components/PricingPage';
import AboutPage from './components/AboutPage';
import ContactPage from './components/ContactPage';
import AdSlot from './components/AdSlot';
import BrandSlider from './components/BrandSlider';
import Footer from './components/Footer';
import { Table, LayoutGrid, Eye, Search, RotateCcw } from 'lucide-react';
import { saveCatalogData, loadCatalogData, clearCatalogData } from './utils/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState('app'); // 'app' | 'about' | 'pricing' | 'contact'
  const [url, setUrl] = useState('');
  const [engine, setEngine] = useState('auto');
  const [limit, setLimit] = useState(5000); // Default to All Products
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [products, setProducts] = useState([]);
  const [detection, setDetection] = useState(null);
  const [status, setStatus] = useState('idle');
  const [isConsoleCollapsed, setIsConsoleCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Preview Modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewFormat, setPreviewFormat] = useState('shopify');

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

  // Statistics calculation
  const stats = useMemo(() => {
    if (products.length === 0) return null;
    const prices = products.map(p => Number(p.price || 0)).filter(p => p > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const totalVariants = products.reduce((acc, p) => acc + (p.variants?.length || 1), 0);
    const totalImages = products.reduce((acc, p) => acc + (p.images?.length || 0), 0);
    const currency = products[0]?.currency || 'USD';
    const currencySymbol = currency === 'BDT' ? '৳' : (currency === 'EUR' ? '€' : (currency === 'GBP' ? '£' : '$'));

    return {
      totalProducts: products.length,
      totalVariants,
      totalImages,
      minPrice: minPrice.toLocaleString(),
      maxPrice: maxPrice.toLocaleString(),
      currency,
      currencySymbol,
      engineSource: detection?.platform || products[0]?.source || 'Universal'
    };
  }, [products, detection]);

  // Filtered products based on search bar
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(p =>
      p.title?.toLowerCase().includes(q) ||
      p.vendor?.toLowerCase().includes(q) ||
      p.product_type?.toLowerCase().includes(q) ||
      p.handle?.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  // Scrape Submission via Server-Sent Events (SSE)
  const handleScrape = async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    setStatus('loading');
    setLogs([]);
    setProducts([]);
    setDetection(null);
    setIsConsoleCollapsed(false);

    try {
      const sseUrl = `/api/scrape-stream?url=${encodeURIComponent(url.trim())}&engine=${engine}&limit=${limit}`;
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
          console.error('SSE JSON error:', e);
        }
      };

      eventSource.onerror = async () => {
        eventSource.close();
        // Fallback to standard POST scrape if SSE drops
        try {
          setLogs(prev => [...prev, 'Switching to standard REST extraction pipeline...']);
          const res = await fetch('/api/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url.trim(), engine, limit })
          });
          const json = await res.json();
          if (json.success && json.products) {
            setProducts(json.products);
            setDetection(json.detection);
            setStatus('done');
            setLogs(prev => [...prev, `Successfully extracted ${json.total} products!`]);
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
  const handleExport = async (format) => {
    if (products.length === 0) return;
    try {
      const formatMap = {
        shopify: 'shopify_csv',
        woocommerce: 'woocommerce_csv',
        wix: 'wix_csv',
        universal: 'universal_csv',
        json: 'json'
      };
      const normalizedFormat = formatMap[format] || format;

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products,
          format: normalizedFormat,
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
      const cleanHost = url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0].replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `${cleanHost}_${format}_products.${ext}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (e) {
      alert(`Export failed: ${e.message}`);
    }
  };

  const handleOpenPreview = (format) => {
    setPreviewFormat(format || 'shopify');
    setPreviewModalOpen(true);
  };

  const handleUpdateProduct = (id, updatedFields) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updatedFields } : p));
  };

  const handleDeleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleClear = () => {
    setUrl('');
    setProducts([]);
    setLogs([]);
    setStatus('idle');
    setDetection(null);
  };

  return (
    <div className="h-screen w-screen flex flex-col justify-between overflow-hidden bg-[#F5F5F7] dark:bg-[#09090b] text-neutral-950 dark:text-neutral-100 selection:bg-[#F1FF0A] selection:text-black">
      
      {/* Top Header with Navigation Tabs */}
      <Header
        productsCount={products.length}
        isLoading={isLoading}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Middle Scrollable Main View Area */}
      <main className="flex-1 overflow-y-auto py-5">
        {activeTab === 'pricing' && (
          <PricingPage onGoToApp={() => setActiveTab('app')} />
        )}

        {activeTab === 'about' && (
          <AboutPage onGoToApp={() => setActiveTab('app')} />
        )}

        {activeTab === 'contact' && (
          <ContactPage />
        )}

        {activeTab === 'app' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 pb-8">
            
            {/* Main Scraper Input Bar */}
            <UrlBar
              url={url}
              setUrl={setUrl}
              engine={engine}
              setEngine={setEngine}
              limit={limit}
              setLimit={setLimit}
              onSubmit={handleScrape}
              isLoading={isLoading}
              detection={detection}
              onClear={handleClear}
            />

            {/* Empty State / Monetization Ad Slot & Brand Marquee Slider */}
            {products.length === 0 && !isLoading && logs.length === 0 && (
              <div className="space-y-5 pt-1 animate-in fade-in duration-300">
                <AdSlot slotType="affiliate" />
                <BrandSlider />
              </div>
            )}

            {/* Real-time Streaming Logs Console */}
            <ProgressConsole
              logs={logs}
              status={status}
              isCollapsed={isConsoleCollapsed}
              onToggleCollapse={() => setIsConsoleCollapsed(!isConsoleCollapsed)}
            />

            {/* Stats Bar */}
            <StatsBar stats={stats} detection={detection} />

            {/* Compact 1-Click Platform Exporter with Preview Buttons */}
            {products.length > 0 && (
              <ExportDrawer
                products={products}
                onExport={handleExport}
                onOpenPreview={handleOpenPreview}
                stats={stats}
              />
            )}

            {/* Extracted Catalog Toolbar & Table / Grid View */}
            {products.length > 0 && (
              <div className="space-y-3 pt-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                {/* Filter & View Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-xl bg-white dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-neutral-400 dark:text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search extracted products..."
                      className="w-full pl-9 pr-3 py-1.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-lg text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 outline-none focus:border-[#F1FF0A]"
                    />
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={handleClearData}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-950/40 hover:bg-red-200 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-900/50 text-xs font-semibold text-red-700 dark:text-red-300 transition-colors cursor-pointer"
                      title="Clear extracted data and cache"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Clear Data</span>
                    </button>

                    <button
                      onClick={() => handleOpenPreview('shopify')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-300 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#8b9900] dark:text-[#F1FF0A]" />
                      <span>Live Preview CSV</span>
                    </button>

                    <div className="flex items-center p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800">
                      <button
                        onClick={() => setViewMode('table')}
                        className={`p-1.5 rounded-md transition-colors ${
                          viewMode === 'table' ? 'bg-[#F1FF0A] text-black font-bold' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                        title="Spreadsheet Table View"
                      >
                        <Table className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-md transition-colors ${
                          viewMode === 'grid' ? 'bg-[#F1FF0A] text-black font-bold' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                        title="Product Cards Grid View"
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Data View */}
                {viewMode === 'table' ? (
                  <ProductTable
                    products={filteredProducts}
                    onUpdateProduct={handleUpdateProduct}
                    onDeleteProduct={handleDeleteProduct}
                    currencySymbol={stats?.currencySymbol || '$'}
                  />
                ) : (
                  <ProductGrid
                    products={filteredProducts}
                    onDeleteProduct={handleDeleteProduct}
                    currencySymbol={stats?.currencySymbol || '$'}
                  />
                )}
              </div>
            )}

          </div>
        )}
      </main>

      {/* Live Format Preview Modal */}
      <FormatPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        products={products}
        defaultFormat={previewFormat}
        onExport={handleExport}
        storeName={url.replace(/^https?:\/\//, '').split('/')[0] || 'store'}
      />

      {/* Fixed Bottom Docked Footer */}
      <Footer />

    </div>
  );
}
