import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Download, Eye, Table as TableIcon, FileText } from 'lucide-react';
import { SiShopify, SiWoocommerce, SiWix } from 'react-icons/si';
import { FaFileCsv } from 'react-icons/fa';
import { VscJson } from 'react-icons/vsc';

export default function FormatPreviewModal({ isOpen, onClose, products, defaultFormat = 'shopify', onExport, storeName = 'store' }) {
  const [activeTab, setActiveTab] = useState(defaultFormat);
  const [previewContent, setPreviewContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (defaultFormat) setActiveTab(defaultFormat);
  }, [defaultFormat]);

  useEffect(() => {
    if (!isOpen || !products || products.length === 0) return;
    
    setIsLoading(true);
    fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products, format: activeTab, storeName, proxyBase: window.location.origin })
    })
      .then(res => res.text())
      .then(text => {
        setPreviewContent(text);
        setIsLoading(false);
      })
      .catch(e => {
        setPreviewContent(`Error generating preview: ${e.message}`);
        setIsLoading(false);
      });
  }, [isOpen, activeTab, products, storeName]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(previewContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  };

  const tabs = [
    { id: 'shopify', label: 'Shopify CSV', icon: <SiShopify className="w-3.5 h-3.5 text-[#95BF47]" /> },
    { id: 'woocommerce', label: 'WooCommerce CSV', icon: <SiWoocommerce className="w-3.5 h-3.5 text-[#96588A]" /> },
    { id: 'wix', label: 'Wix CSV', icon: <SiWix className="w-3.5 h-3.5 text-neutral-300" /> },
    { id: 'universal', label: 'Clean CSV', icon: <FaFileCsv className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: 'json', label: 'Raw JSON', icon: <VscJson className="w-3.5 h-3.5 text-[#F1FF0A]" /> }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-5xl h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-[#121216] border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/80">
          <div className="flex items-center gap-2.5">
            <Eye className="w-4 h-4 text-[#8b9900] dark:text-[#F1FF0A]" />
            <span className="text-sm font-extrabold text-neutral-900 dark:text-white">
              Export Format Live Preview
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 text-neutral-700 dark:text-neutral-400">
              {products?.length || 0} Products
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#8b9900] dark:text-[#F1FF0A]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>

            <button
              onClick={() => onExport(activeTab)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F1FF0A] hover:bg-[#D4FF00] text-black text-xs font-extrabold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Download File</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1 px-4 py-2 bg-neutral-100 dark:bg-neutral-900/90 border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-300 dark:border-[#F1FF0A]/40 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800/50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Preview Code Box */}
        <div className="flex-1 p-4 bg-[#F8F9FB] dark:bg-neutral-950 overflow-auto font-mono text-xs text-neutral-800 dark:text-neutral-300 select-text leading-relaxed border-t border-neutral-200 dark:border-neutral-800">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-neutral-500 gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F1FF0A] animate-ping"></span>
              Generating formatted preview...
            </div>
          ) : (
            <pre className="whitespace-pre">{previewContent}</pre>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
          <span>Format: <strong className="text-neutral-800 dark:text-neutral-300 uppercase">{activeTab}</strong></span>
          <span>Line count: {previewContent.split('\n').length} lines</span>
        </div>

      </div>
    </div>
  );
}
