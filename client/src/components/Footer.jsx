import React from 'react';
import { Globe, ExternalLink, Package } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800/80 bg-white/95 dark:bg-black/90 backdrop-blur-xl py-3 flex-shrink-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-700 dark:text-neutral-400 font-medium">
        
        {/* Left: Brand */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2 text-center sm:text-left">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-[#F1FF0A] flex items-center justify-center shadow-sm">
              <Package className="w-2.5 h-2.5 text-black stroke-[3]" />
            </div>
            <span className="font-black text-neutral-950 dark:text-white">
              get<span className="text-[#687500] dark:text-[#F1FF0A]">Products</span>
            </span>
          </div>
          <span className="hidden sm:inline text-neutral-400 dark:text-neutral-600">•</span>
          <span className="text-neutral-700 dark:text-neutral-400 font-semibold text-[11px] sm:text-xs">
            Universal E-Commerce Catalog Exporter
          </span>
        </div>

        {/* Right: Developed By Nokib */}
        <div className="flex items-center gap-3">
          <span className="text-neutral-800 dark:text-neutral-400 font-medium">
            Developed by <span className="font-extrabold text-neutral-950 dark:text-white">Nokib</span>
          </span>

          <div className="flex items-center gap-2">
            <a
              href="https://nokib.vercel.app/developer"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-300 font-bold transition-all text-[11px] shadow-sm"
            >
              <Globe className="w-3 h-3 text-neutral-700 dark:text-neutral-300" />
              <span>Portfolio</span>
              <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-70" />
            </a>

            <a
              href="https://github.com/nokib-web"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-300 font-bold transition-all text-[11px] shadow-sm"
            >
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              <span>GitHub</span>
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
