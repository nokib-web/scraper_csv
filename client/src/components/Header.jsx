import React from 'react';
import { Package, ExternalLink, Sun, Moon } from 'lucide-react';

export default function Header({ productsCount, isLoading, isDark, onToggleTheme, activeTab = 'app', onSelectTab }) {
  const navItems = [
    { id: 'app', label: 'Extractor' },
    { id: 'about', label: 'About Us' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'contact', label: 'Contact' }
  ];

  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800/80 bg-white/95 dark:bg-black/70 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        
        {/* Brand */}
        <div 
          onClick={() => onSelectTab && onSelectTab('app')}
          className="flex items-center gap-2.5 cursor-pointer select-none flex-shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-[#F1FF0A] flex items-center justify-center shadow-md flex-shrink-0">
            <Package className="w-4 h-4 text-black stroke-[2.5]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-black tracking-tight text-neutral-950 dark:text-white">
              get<span className="text-[#687500] dark:text-[#F1FF0A]">Products</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-400">
              Universal Exporter
            </span>
          </div>
        </div>

        {/* Center Navigation Links (Single Page Tabs) */}
        <nav className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab && onSelectTab(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-neutral-950 text-white dark:bg-[#F1FF0A] dark:text-black shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-neutral-800/60'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Info & Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          {productsCount > 0 && activeTab === 'app' && (
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 text-xs text-neutral-900 dark:text-neutral-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#F1FF0A] animate-pulse"></span>
              <span className="font-extrabold text-black dark:text-white">{productsCount}</span> Products
            </div>
          )}

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-lg bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-300 transition-colors cursor-pointer shadow-sm"
            title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-[#F1FF0A]" />
            ) : (
              <Moon className="w-4 h-4 text-neutral-900" />
            )}
          </button>

          {/* Nokib Portfolio */}
          <a
            href="https://nokib.vercel.app/developer"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-[#F1FF0A]/10 dark:text-[#F1FF0A] dark:border dark:border-[#F1FF0A]/30 dark:hover:bg-[#F1FF0A]/20 text-xs font-bold transition-all shadow-sm"
          >
            <span>Nokib</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

      </div>
    </header>
  );
}
