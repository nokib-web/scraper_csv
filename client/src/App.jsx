import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import Header from './components/Header';
import UrlBar from './components/UrlBar';
import ProgressConsole from './components/ProgressConsole';
import StatsBar from './components/StatsBar';
import ProductGrid from './components/ProductGrid';
import ProductTable from './components/ProductTable';
import ExportDrawer from './components/ExportDrawer';
import RawPreviewModal from './components/RawPreviewModal';
import { LayoutGrid, Table, Search, Trash2, Filter, Sparkles, Download, CheckSquare, Square, RefreshCw } from 'lucide-react';

export default function App() {
  const [url, setUrl] = useState('');
  const [limit, setLimit] = useState(50);
  const [engine, setEngine] = useState('auto');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);

  const [products, setProducts] = useState([]);
  const [platform, setPlatform] = useState('auto');
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [presets, setPresets] = useState([]);
  const [rawModal, setRawModal] = useState({
    isOpen: false,
    content: '',
    formatName: '',
    filename: 'products'
  });

  // Fetch quick demo presets
  useEffect(() => {
    fetch('/api/presets')
      .then(res => res.json())
      .then(data => setPresets(data))
      .catch(() => {});
  }, []);

  // Live SSE Scraping Handler
  const handleScrape = () => {
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);
    setLogs([]);
    setIsConsoleOpen(true);
    setSelectedIds([]);

    const encodedUrl = encodeURIComponent(url.trim());
    const eventSource = new EventSource(`/api/scrape-stream?url=${encodedUrl}&limit=${limit}&engine=${engine}`);

    eventSource.addEventListener('start', (e) => {
      setLogs([{ message: `Connected to extraction stream for ${url}...`, timestamp: new Date().toLocaleTimeString() }]);
    });

    eventSource.addEventListener('log', (e) => {
      try {
        const data = JSON.parse(e.data);
        setLogs((prev) => [...prev, data]);
      } catch {
        setLogs((prev) => [...prev, { message: e.data, timestamp: new Date().toLocaleTimeString() }]);
      }
    });

    eventSource.addEventListener('complete', (e) => {
      try {
        const result = JSON.parse(e.data);
        if (result.success && Array.isArray(result.products)) {
          setProducts(result.products);
          setPlatform(result.platform);
          setSelectedIds(result.products.map(p => p.id));
          
          // Trigger confetti on success
          if (result.products.length > 0) {
            confetti({
              particleCount: 70,
              spread: 60,
              origin: { y: 0.6 }
            });
          }
        }
      } catch (err) {
        setError('Failed to parse final payload.');
      }
      setIsLoading(false);
      eventSource.close();
    });

    eventSource.addEventListener('error', (e) => {
      // If error payload is provided
      try {
        if (e.data) {
          const errData = JSON.parse(e.data);
          setError(errData.message || 'Scraping failed.');
        } else {
          setError('Connection closed or site blocked direct requests. Please check the URL.');
        }
      } catch {
        setError('Failed to extract products from target URL.');
      }
      setIsLoading(false);
      eventSource.close();
    });
  };

  // Export File Downloader
  const handleExport = async (format) => {
    if (products.length === 0) return;

    // Export only selected products if any selected, otherwise all
    const exportList = selectedIds.length > 0
      ? products.filter(p => selectedIds.includes(p.id))
      : products;

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: exportList,
          format,
          filename: 'extracted_products'
        })
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition');
      let filename = `products_${format}.csv`;
      if (disposition && disposition.includes('filename=')) {
        filename = disposition.split('filename=')[1].replace(/"/g, '');
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert(`Export error: ${err.message}`);
    }
  };

  // Inspect Raw Code Modal
  const handleInspectRaw = async (format, formatName) => {
    const exportList = selectedIds.length > 0
      ? products.filter(p => selectedIds.includes(p.id))
      : products;

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: exportList,
          format,
          filename: 'preview'
        })
      });
      const text = await response.text();
      setRawModal({
        isOpen: true,
        content: text,
        formatName,
        filename: `products_${format}`
      });
    } catch (err) {
      alert('Could not generate preview');
    }
  };

  // Deletions & Selections
  const handleDeleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    setSelectedIds(prev => prev.filter(item => item !== id));
  };

  const handleUpdateProduct = (id, updatedFields) => {
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, ...updatedFields } : p)));
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map(p => p.id));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    setProducts(prev => prev.filter(p => !selectedIds.includes(p.id)));
    setSelectedIds([]);
  };

  // Unique categories for filter
  const categories = Array.from(
    new Set(products.map(p => p.product_type || 'General').filter(Boolean))
  );

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesSearch = searchQuery === '' ||
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.handle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.vendor?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || p.product_type === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto flex flex-col justify-between">
      <div>
        {/* Header Bar */}
        <Header />

        {/* Smart URL Input & Trigger Bar */}
        <UrlBar
          url={url}
          setUrl={setUrl}
          limit={limit}
          setLimit={setLimit}
          engine={engine}
          setEngine={setEngine}
          onScrape={handleScrape}
          isLoading={isLoading}
          presets={presets}
        />

        {/* Live Extraction Stream Console */}
        <ProgressConsole
          logs={logs}
          isLoading={isLoading}
          error={error}
          isOpen={isConsoleOpen}
          setIsOpen={setIsConsoleOpen}
        />

        {/* Stats & Counters */}
        <StatsBar products={products} platform={platform} />

        {/* Export Center */}
        {products.length > 0 && (
          <ExportDrawer
            products={products}
            onExport={handleExport}
            onInspectRaw={handleInspectRaw}
            isExporting={isLoading}
          />
        )}

        {/* Products Management & Preview Section */}
        {products.length > 0 && (
          <div className="space-y-4 mb-8">
            {/* Toolbar: Search, Filter, View Mode Toggle, Bulk Actions */}
            <div className="glass-panel p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Left: Search & Filter */}
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search in extracted items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:border-indigo-500"
                  />
                </div>

                {categories.length > 1 && (
                  <div className="relative">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="appearance-none bg-slate-950/80 border border-white/10 text-slate-300 text-xs rounded-xl px-3 py-2 pr-7 outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="all">All Categories ({products.length})</option>
                      {categories.map((c, i) => (
                        <option key={i} value={c}>{c}</option>
                      ))}
                    </select>
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                      ▼
                    </div>
                  </div>
                )}

                {selectedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-semibold rounded-xl transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Selected ({selectedIds.length})</span>
                  </button>
                )}
              </div>

              {/* Right: View Toggle (Grid / Table) */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-xs text-slate-400 font-medium mr-1">
                  Showing {filteredProducts.length} of {products.length}
                </span>

                <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
                      viewMode === 'table'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Spreadsheet Table View"
                  >
                    <Table className="w-4 h-4" />
                    <span className="hidden sm:inline">Table</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
                      viewMode === 'grid'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Card Gallery Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span className="hidden sm:inline">Cards</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Product Views */}
            {viewMode === 'table' ? (
              <ProductTable
                products={filteredProducts}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onSelectAll={handleSelectAll}
                onDeleteProduct={handleDeleteProduct}
                onUpdateProduct={handleUpdateProduct}
              />
            ) : (
              <ProductGrid
                products={filteredProducts}
                onDeleteProduct={handleDeleteProduct}
                onEditProduct={handleUpdateProduct}
              />
            )}
          </div>
        )}

        {/* Empty State when no products scraped yet */}
        {!isLoading && products.length === 0 && (
          <div className="glass-panel p-12 text-center flex flex-col items-center justify-center max-w-2xl mx-auto my-8 border-dashed border-white/10">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400 animate-pulse-glow">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Ready to Scrape & Convert Any Store
            </h3>
            <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
              Paste any store link above or click one of the quick test demo buttons (Gymshark, Allbirds, Decathlon, WooCommerce) to immediately extract the product catalog and download formatted CSVs.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-indigo-400 font-bold text-xs block mb-1">1. Paste Link</span>
                <span className="text-[11px] text-slate-400">Supports Shopify, WooCommerce, Wix & Custom HTML stores.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-purple-400 font-bold text-xs block mb-1">2. Auto Extract</span>
                <span className="text-[11px] text-slate-400">Pulls titles, handles, high-res images, prices, variants, SKUs.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-cyan-400 font-bold text-xs block mb-1">3. Instant Import</span>
                <span className="text-[11px] text-slate-400">1-click download Shopify CSV, WooCommerce CSV, Wix CSV, JSON.</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="w-full pt-6 pb-2 text-center text-xs text-slate-500 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Pixelora OmniScrape Pro &copy; {new Date().getFullYear()} - Universal E-Commerce Scraper & Formatter</span>
        <span className="text-slate-400 font-mono text-[11px]">Strict RFC4180 Standard &bull; Direct Platform Ready</span>
      </footer>

      {/* Raw Output Preview Modal */}
      <RawPreviewModal
        isOpen={rawModal.isOpen}
        onClose={() => setRawModal({ ...rawModal, isOpen: false })}
        content={rawModal.content}
        formatName={rawModal.formatName}
        filename={rawModal.filename}
        onDownload={() => {
          setRawModal({ ...rawModal, isOpen: false });
          handleExport(rawModal.filename.replace('products_', ''));
        }}
      />
    </div>
  );
}
