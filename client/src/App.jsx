import React, { useState, useMemo } from 'react';
import Header from './components/Header';
import UrlBar from './components/UrlBar';
import StatsBar from './components/StatsBar';
import ProgressConsole from './components/ProgressConsole';
import ProductTable from './components/ProductTable';
import ProductGrid from './components/ProductGrid';
import ExportDrawer from './components/ExportDrawer';
import RawPreviewModal from './components/RawPreviewModal';
import Footer from './components/Footer';
import { Table, LayoutGrid, Code, Search, Sparkles, AlertCircle } from 'lucide-react';

export default function App() {
  const [url, setUrl] = useState('');
  const [engine, setEngine] = useState('auto');
  const [limit, setLimit] = useState(5000); // Default to All Products
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'done' | 'error'
  const [isConsoleCollapsed, setIsConsoleCollapsed] = useState(false);

  const [products, setProducts] = useState([]);
  const [detection, setDetection] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [searchQuery, setSearchQuery] = useState('');
  const [showRawModal, setShowRawModal] = useState(false);

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
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products,
          format,
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
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col justify-between selection:bg-[#F1FF0A] selection:text-black">
      
      {/* Top Header */}
      <div>
        <Header productsCount={products.length} isLoading={isLoading} />

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          
          {/* Main Scraper Input Bar & Presets */}
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

          {/* Real-time Streaming Logs Console */}
          <ProgressConsole
            logs={logs}
            status={status}
            isCollapsed={isConsoleCollapsed}
            onToggleCollapse={() => setIsConsoleCollapsed(!isConsoleCollapsed)}
          />

          {/* Stats Bar */}
          <StatsBar stats={stats} detection={detection} />

          {/* 1-Click Platform Exporter */}
          {products.length > 0 && (
            <ExportDrawer
              products={products}
              onExport={handleExport}
              stats={stats}
            />
          )}

          {/* Extracted Catalog Toolbar & Table / Grid View */}
          {products.length > 0 && (
            <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* Filter & View Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search extracted products..."
                    className="w-full pl-9 pr-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 outline-none focus:border-[#F1FF0A]"
                  />
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => setShowRawModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>Raw JSON</span>
                  </button>

                  <div className="flex items-center p-0.5 rounded-lg bg-neutral-900 border border-neutral-800">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-1.5 rounded-md transition-colors ${
                        viewMode === 'table' ? 'bg-[#F1FF0A] text-black font-bold' : 'text-neutral-400 hover:text-white'
                      }`}
                      title="Spreadsheet Table View"
                    >
                      <Table className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-md transition-colors ${
                        viewMode === 'grid' ? 'bg-[#F1FF0A] text-black font-bold' : 'text-neutral-400 hover:text-white'
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

        </main>
      </div>

      {/* Raw JSON Code Inspector Modal */}
      <RawPreviewModal
        isOpen={showRawModal}
        onClose={() => setShowRawModal(false)}
        products={products}
      />

      {/* Footer with Developer Info */}
      <Footer />

    </div>
  );
}
