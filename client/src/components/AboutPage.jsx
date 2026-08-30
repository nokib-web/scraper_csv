import React from 'react';
import { Package, Zap, Cpu, ShieldCheck, ArrowRight, Layers, FileSpreadsheet, Globe } from 'lucide-react';
import { SiShopify, SiWoocommerce, SiWix } from 'react-icons/si';
import { FaFileCsv, FaFileCode } from 'react-icons/fa6';

export default function AboutPage({ onGoToApp }) {
  const highlights = [
    {
      icon: <Zap className="w-5 h-5 text-neutral-950 dark:text-[#F1FF0A]" />,
      title: 'Lightning Fast Multi-Engine',
      description: 'Powered by specialized crawlers for Shopify, WooCommerce, Daraz, Zatiq, and standard HTML meta catalogs.'
    },
    {
      icon: <FileSpreadsheet className="w-5 h-5 text-neutral-950 dark:text-[#F1FF0A]" />,
      title: '1-Click Direct Store Exporter',
      description: 'Pre-formatted templates for Shopify (RFC-4180 validated), WooCommerce, Wix, Universal Clean CSV, and JSON.'
    },
    {
      icon: <Layers className="w-5 h-5 text-neutral-950 dark:text-[#F1FF0A]" />,
      title: 'Full Variant & Image Extraction',
      description: 'Captures sizes, pin types, weights, SKUs, inventory status, and high-resolution CDN images automatically.'
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-neutral-950 dark:text-[#F1FF0A]" />,
      title: 'Zero Account Credentials Needed',
      description: 'Completely client-side powered with local caching in IndexedDB. Your exported data stays secure with you.'
    }
  ];

  const platforms = [
    { name: 'Shopify', icon: <SiShopify className="w-5 h-5 text-[#95BF47]" />, desc: 'Native handles, options & image positions' },
    { name: 'WooCommerce', icon: <SiWoocommerce className="w-5 h-5 text-[#96588A]" />, desc: 'Standard WP product attributes & prices' },
    { name: 'Wix eCommerce', icon: <SiWix className="w-5 h-5 text-neutral-900 dark:text-white" />, desc: 'Clean CSV ready for Wix catalog import' },
    { name: 'Universal CSV', icon: <FaFileCsv className="w-5 h-5 text-emerald-500" />, desc: 'Compatible with Excel, Sheets & Airtable' },
    { name: 'Raw JSON', icon: <FaFileCode className="w-5 h-5 text-[#8b9900] dark:text-[#F1FF0A]" />, desc: 'Structured schema for APIs & custom DBs' }
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-12 animate-in fade-in duration-300">
      
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-[#F1FF0A]/20 border border-[#F1FF0A]/40 text-neutral-950 dark:text-[#F1FF0A] text-xs font-semibold">
          <span>About getProducts</span>
        </div>
        
        <h1 className="text-3xl sm:text-5xl font-title font-semibold text-neutral-950 dark:text-white tracking-tight leading-tight">
          The Universal Product Extractor for Modern E-Commerce
        </h1>
        
        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-2xl mx-auto font-normal">
          <strong className="text-neutral-950 dark:text-white font-semibold">getProducts</strong> solves the headache of manual catalog migration. Paste any store URL, extract all products in real-time, and download store-ready CSV files in seconds.
        </p>

        <div className="pt-2">
          <button
            onClick={onGoToApp}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F1FF0A] hover:bg-[#D4FF00] text-black text-xs sm:text-sm font-semibold tracking-wide uppercase shadow-lg shadow-[#F1FF0A]/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>Launch Extractor</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {highlights.map((item, idx) => (
          <div
            key={idx}
            className="p-6 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F1FF0A]/20 border border-[#F1FF0A]/40 flex items-center justify-center flex-shrink-0">
              {item.icon}
            </div>
            <h3 className="text-base sm:text-lg font-title font-semibold text-neutral-950 dark:text-white">
              {item.title}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">
              {item.description}
            </p>
          </div>
        ))}
      </div>

      {/* Supported Platforms Section */}
      <div className="p-7 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">
        <div className="text-center space-y-1">
          <h3 className="text-xl font-title font-semibold text-neutral-950 dark:text-white">
            Supported Export Ecosystems
          </h3>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-normal">
            Validated against official platform schemas for 100% successful imports.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {platforms.map((p, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2 flex flex-col justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                  {p.icon}
                </div>
                <span className="text-sm font-semibold text-neutral-950 dark:text-white">
                  {p.name}
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-normal font-normal">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Developer Story Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-neutral-100 to-white dark:from-neutral-950 dark:to-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-sm">
        <div className="space-y-1 text-center sm:text-left">
          <div className="text-xs font-semibold text-[#687500] dark:text-[#F1FF0A] uppercase tracking-wider">
            Created with Passion
          </div>
          <h4 className="text-base sm:text-lg font-title font-semibold text-neutral-950 dark:text-white">
            Built by Nazmul Hasan Nokib
          </h4>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-lg font-normal">
            Web Developer & Business Researcher and Analyst. Focused on building high-performance e-commerce utilities, scraper architectures, and data analysis systems.
          </p>
        </div>

        <a
          href="https://nokib.vercel.app/developer"
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 rounded-xl bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-[#F1FF0A] dark:text-black dark:hover:bg-[#D4FF00] text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shadow-md flex-shrink-0"
        >
          <span>Developer Portfolio</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>

    </div>
  );
}
