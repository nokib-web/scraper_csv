import React from 'react';
import { Package, ExternalLink, Sun, Moon } from 'lucide-react';

export default function Header({ productsCount, isLoading, isDark, onToggleTheme }) {
  return (
    <header className="border-b border-neutral-800/80 dark:border-neutral-800/80 light:border-neutral-200/80 bg-black/60 dark:bg-black/60 light:bg-[#FDFBF7]/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#F1FF0A] flex items-center justify-center shadow-lg shadow-[#F1FF0A]/10 flex-shrink-0">
            <Package className="w-4 h-4 text-black stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-white dark:text-white light:text-neutral-900">
                get<span className="text-[#F1FF0A]">Products</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-900 dark:bg-neutral-900 light:bg-neutral-200 border border-neutral-800 dark:border-neutral-800 light:border-neutral-300 text-neutral-400 dark:text-neutral-400 light:text-neutral-700">
                Universal Exporter
              </span>
            </div>
          </div>
        </div>

        {/* Right Info & Actions */}
        <div className="flex items-center gap-2.5">
          {productsCount > 0 && (
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-neutral-900 dark:bg-neutral-900 light:bg-neutral-200 border border-neutral-800 dark:border-neutral-800 light:border-neutral-300 text-xs text-neutral-300 dark:text-neutral-300 light:text-neutral-800">
              <span className="w-2 h-2 rounded-full bg-[#F1FF0A] animate-pulse"></span>
              <span className="font-bold text-white dark:text-white light:text-black">{productsCount}</span> Products
            </div>
          )}

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-lg bg-neutral-900 dark:bg-neutral-900 light:bg-neutral-200 hover:bg-neutral-800 dark:hover:bg-neutral-800 light:hover:bg-neutral-300 border border-neutral-800 dark:border-neutral-800 light:border-neutral-300 text-neutral-300 dark:text-neutral-300 light:text-neutral-800 transition-colors cursor-pointer"
            title={isDark ? "Switch to Cream Light Theme" : "Switch to Black Dark Theme"}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-[#F1FF0A]" />
            ) : (
              <Moon className="w-4 h-4 text-neutral-800" />
            )}
          </button>

          {/* GitHub Repo */}
          <a
            href="https://github.com/nokib-web/scraper_csv"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-neutral-900 light:bg-neutral-200 hover:bg-neutral-800 border border-neutral-800 dark:border-neutral-800 light:border-neutral-300 text-xs font-medium text-neutral-300 dark:text-neutral-300 light:text-neutral-800 transition-all"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            <span className="hidden sm:inline">GitHub</span>
          </a>

          {/* Nokib Portfolio */}
          <a
            href="https://nokib.vercel.app/developer"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#F1FF0A]/10 hover:bg-[#F1FF0A]/20 border border-[#F1FF0A]/30 text-xs font-semibold text-[#F1FF0A] transition-all"
          >
            <span>Nokib</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

      </div>
    </header>
  );
}
