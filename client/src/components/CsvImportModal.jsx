import React, { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle, Layers, Image as ImageIcon, Package, ArrowRight, RefreshCw, PlusCircle, Sparkles } from 'lucide-react';
import { SiShopify, SiWoocommerce, SiWix } from 'react-icons/si';
import { FaFileCsv } from 'react-icons/fa';
import { importCsvFile } from '../utils/csvImporter';
import { getCurrencySymbol } from '../utils/currency';

export default function CsvImportModal({
  isOpen,
  onClose,
  onImportProducts,
  currentProductsCount = 0
}) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState(null);
  const [importMode, setImportMode] = useState('replace'); // 'replace' | 'append'
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFile = async (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.txt')) {
      setError('Please upload a valid .csv file.');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setIsLoading(true);

    try {
      const result = await importCsvFile(selectedFile);
      setParsedData(result);
    } catch (err) {
      setError(err.message || 'Failed to parse CSV file.');
      setParsedData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (!parsedData || !parsedData.products || parsedData.products.length === 0) return;
    onImportProducts(parsedData.products, importMode);
    handleClose();
  };

  const handleClose = () => {
    setFile(null);
    setParsedData(null);
    setError(null);
    setIsLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#111114] border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#F1FF0A]/10 border border-[#F1FF0A]/20 text-[#8b9900] dark:text-[#F1FF0A]">
              <Upload className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                <span>Import & Edit Existing CSV</span>
                <span className="px-2 py-0.5 rounded-full bg-[#F1FF0A] text-black text-[10px] font-black uppercase tracking-wider">
                  Bulk Editor
                </span>
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Upload Shopify, WooCommerce, Wix, or Supplier CSV files to edit and re-export
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* File Dropzone */}
          {!parsedData ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? 'border-[#F1FF0A] bg-[#F1FF0A]/10 scale-[0.99]'
                  : 'border-neutral-300 dark:border-neutral-800 hover:border-[#F1FF0A]/60 bg-neutral-50/50 dark:bg-neutral-900/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={(e) => handleFile(e.target.files?.[0])}
                className="hidden"
              />

              <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 group-hover:text-[#F1FF0A] transition-colors">
                <FileText className="w-8 h-8 text-[#8b9900] dark:text-[#F1FF0A]" />
              </div>

              <div>
                <p className="text-xs font-bold text-neutral-900 dark:text-white">
                  {isLoading ? 'Parsing CSV File...' : 'Click to Browse or Drag & Drop CSV File'}
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Supports Shopify Catalog CSV, WooCommerce Export, Wix Store, or Supplier CSV
                </p>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 pt-2 flex-wrap justify-center">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[10px] font-semibold text-neutral-600 dark:text-neutral-300">
                  <SiShopify className="w-3 h-3 text-[#95BF47]" /> Shopify CSV
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[10px] font-semibold text-neutral-600 dark:text-neutral-300">
                  <SiWoocommerce className="w-3 h-3 text-[#96588A]" /> WooCommerce CSV
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[10px] font-semibold text-neutral-600 dark:text-neutral-300">
                  <SiWix className="w-3 h-3 text-neutral-300" /> Wix Store
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[10px] font-semibold text-neutral-600 dark:text-neutral-300">
                  <FaFileCsv className="w-3 h-3 text-emerald-400" /> Excel / Clean CSV
                </span>
              </div>
            </div>
          ) : (
            /* Parsed Success Summary Screen */
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* File details & Detected format */}
              <div className="p-4 rounded-xl bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-white truncate max-w-[280px]">
                      {file?.name}
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                      {(file?.size ? (file.size / 1024).toFixed(1) : '0')} KB • {parsedData.totalRows} Raw CSV Rows
                    </div>
                  </div>
                </div>

                <div className={`px-2.5 py-1 rounded-lg border text-xs font-extrabold flex items-center gap-1.5 ${parsedData.format?.badgeColor}`}>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{parsedData.format?.name}</span>
                </div>
              </div>

              {/* Extraction Metrics Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 text-center">
                  <div className="text-lg font-black text-neutral-900 dark:text-white">
                    {parsedData.totalProducts}
                  </div>
                  <div className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider mt-0.5">
                    Products
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 text-center">
                  <div className="text-lg font-black text-[#8b9900] dark:text-[#F1FF0A]">
                    {parsedData.totalVariants}
                  </div>
                  <div className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider mt-0.5">
                    Variants Grouped
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 text-center">
                  <div className="text-lg font-black text-neutral-900 dark:text-white">
                    {parsedData.totalImages}
                  </div>
                  <div className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider mt-0.5">
                    Photos Linked
                  </div>
                </div>
              </div>

              {/* First 3 Items Preview */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-1">
                  Sample Preview (First {Math.min(3, parsedData.products.length)} items)
                </div>
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-neutral-100 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 text-[10px] font-bold uppercase">
                      <tr>
                        <th className="py-2 px-3">Title</th>
                        <th className="py-2 px-3">Price</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3">Variants</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-medium">
                      {parsedData.products.slice(0, 3).map((p, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40">
                          <td className="py-2 px-3 font-semibold text-neutral-900 dark:text-white truncate max-w-[180px]">
                            {p.title}
                          </td>
                          <td className="py-2 px-3 font-bold text-[#8b9900] dark:text-[#F1FF0A]">
                            ${Number(p.price || 0).toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-neutral-500 dark:text-neutral-400 truncate max-w-[120px]">
                            {p.product_type || p.category || 'General'}
                          </td>
                          <td className="py-2 px-3 text-neutral-400 font-mono">
                            {p.variants?.length || 1}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Import Mode Switcher */}
              {currentProductsCount > 0 && (
                <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 space-y-2">
                  <div className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                    Existing Catalog Detected ({currentProductsCount} products currently loaded):
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setImportMode('replace')}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all text-left cursor-pointer ${
                        importMode === 'replace'
                          ? 'bg-[#F1FF0A] text-black font-extrabold border-[#F1FF0A]'
                          : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-800'
                      }`}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <div>
                        <div className="font-bold leading-tight">Replace Catalog</div>
                        <div className="text-[9px] opacity-80">Start fresh with this CSV</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setImportMode('append')}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all text-left cursor-pointer ${
                        importMode === 'append'
                          ? 'bg-[#F1FF0A] text-black font-extrabold border-[#F1FF0A]'
                          : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-800'
                      }`}
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <div>
                        <div className="font-bold leading-tight">Append / Merge</div>
                        <div className="text-[9px] opacity-80">Combine with current list</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Reset file button */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setParsedData(null);
                    setError(null);
                  }}
                  className="text-[11px] text-neutral-500 hover:text-white underline cursor-pointer"
                >
                  Choose a different CSV file
                </button>
              </div>

            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/80">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {parsedData && (
            <button
              type="button"
              onClick={handleConfirmImport}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#F1FF0A] hover:bg-[#D4FF00] text-black font-extrabold text-xs transition-all shadow-md cursor-pointer"
            >
              <span>Load into Bulk Editor ({parsedData.totalProducts} Products)</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
