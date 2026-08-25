import React from 'react';
import { Sparkles, Layers, Download, Database, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export default function Header() {
  return (
    <header className="w-full flex flex-col md:flex-row items-center justify-between gap-4 py-4 px-6 border-b border-white/10 glass-panel mb-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-300">
              OmniScrape <span className="text-indigo-400">Pro</span>
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
              v1.0 Ready
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Universal E-Commerce Product Extractor & Direct Platform Exporter
          </p>
        </div>
      </div>

      {/* Supported Platform Badges */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Shopify Ready</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-950/40 border border-purple-500/30 text-purple-300">
          <span className="w-2 h-2 rounded-full bg-purple-400"></span>
          <span>WooCommerce</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-950/40 border border-blue-500/30 text-blue-300">
          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
          <span>Wix Store</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span>JSON / Clean CSV</span>
        </div>
      </div>
    </header>
  );
}
