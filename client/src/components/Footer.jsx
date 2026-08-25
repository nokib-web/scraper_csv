import React from 'react';
import { Globe, ExternalLink, Package } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-neutral-800/80 bg-black/80 backdrop-blur-xl mt-16 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
        
        {/* Left: Brand & Copyright */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-[#F1FF0A] flex items-center justify-center">
            <Package className="w-3 h-3 text-black stroke-[3]" />
          </div>
          <span className="font-extrabold text-white">get<span className="text-[#F1FF0A]">Products</span></span>
          <span className="text-neutral-600">•</span>
          <span>Universal E-Commerce Catalog Exporter</span>
        </div>

        {/* Right: Developed By Nokib */}
        <div className="flex items-center gap-4">
          <span className="text-neutral-400">
            Developed by <span className="font-bold text-white">Nokib</span>
          </span>

          <div className="flex items-center gap-2">
            <a
              href="https://nokib.vercel.app/developer"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-[#F1FF0A]/10 border border-neutral-800 hover:border-[#F1FF0A]/30 text-neutral-300 hover:text-[#F1FF0A] transition-all font-medium"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Portfolio</span>
              <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
            </a>

            <a
              href="https://github.com/nokib-web"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition-all font-medium"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
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
