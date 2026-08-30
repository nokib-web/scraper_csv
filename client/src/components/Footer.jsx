import React from 'react';
import { 
  FaShieldHalved, 
  FaChartLine, 
  FaBan, 
  FaScaleBalanced, 
  FaTriangleExclamation, 
  FaBoxOpen, 
  FaGlobe, 
  FaGithub, 
  FaArrowUpRightFromSquare,
  FaCircleCheck
} from 'react-icons/fa6';

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800/80 bg-white/95 dark:bg-black/90 backdrop-blur-xl transition-colors">
      
      {/* Full-width Disclaimer & Fair Use Warning Box */}
      <div className="border-b border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-neutral-950/60 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl border border-[#F1FF0A]/30 dark:border-[#F1FF0A]/20 bg-white dark:bg-neutral-900/50 p-5 sm:p-6 shadow-sm">
            
            {/* Ambient Brand Accent Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#F1FF0A]/5 dark:bg-[#F1FF0A]/5 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24" />

            {/* Header / Badge */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#F1FF0A] text-black flex items-center justify-center flex-shrink-0 shadow-sm">
                  <FaShieldHalved className="w-3.5 h-3.5" />
                </div>
                <h4 className="font-title text-sm sm:text-base font-semibold uppercase tracking-wider text-neutral-950 dark:text-white flex items-center gap-2">
                  <span>Disclaimer & Fair Use Notice</span>
                </h4>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1FF0A]/15 dark:bg-[#F1FF0A]/10 border border-[#F1FF0A]/40 text-xs font-medium text-neutral-900 dark:text-[#F1FF0A]">
                <FaTriangleExclamation className="w-3 h-3 text-[#7b8a00] dark:text-[#F1FF0A]" />
                Development & Research Purpose Only
              </span>
            </div>

            {/* 3 Grid Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-neutral-600 dark:text-neutral-300">
              
              {/* 1. Purpose */}
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800/80 space-y-2">
                <div className="flex items-center gap-2 text-neutral-950 dark:text-white font-title font-semibold text-sm">
                  <FaChartLine className="w-3.5 h-3.5 text-[#7b8a00] dark:text-[#F1FF0A]" />
                  <span>Market & Competitor Analysis</span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">
                  This tool is developed strictly for <strong className="font-semibold text-neutral-900 dark:text-neutral-200">software development testing, market research, price comparison, and catalog structure analysis</strong>.
                </p>
              </div>

              {/* 2. No Direct Copying / Piracy */}
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800/80 space-y-2">
                <div className="flex items-center gap-2 text-neutral-950 dark:text-white font-title font-semibold text-sm">
                  <FaBan className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                  <span>Not For Product Cloning</span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">
                  This service is <strong className="font-semibold text-neutral-900 dark:text-neutral-200">never intended for unauthorized product copying</strong>, counterfeit listing generation, or scraping copyrighted assets without consent.
                </p>
              </div>

              {/* 3. Liability Disclaimer */}
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800/80 space-y-2">
                <div className="flex items-center gap-2 text-neutral-950 dark:text-white font-title font-semibold text-sm">
                  <FaScaleBalanced className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />
                  <span>Limitation of Liability</span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">
                  The developer holds <strong className="font-semibold text-neutral-900 dark:text-neutral-200">no responsibility or legal liability</strong> for any unlawful misuse, ToS violations, or data misuse conducted by end-users.
                </p>
              </div>

            </div>

            {/* Bottom Note */}
            <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <div className="flex items-center gap-1.5">
                <FaCircleCheck className="w-3.5 h-3.5 text-[#7b8a00] dark:text-[#F1FF0A] flex-shrink-0" />
                <span>Users must ensure full compliance with target platforms' Terms of Service and local digital rights laws.</span>
              </div>
              <span className="font-medium text-neutral-800 dark:text-neutral-300 shrink-0">
                User Discretion Strictly Required
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom Main Footer Bar */}
      <div className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-neutral-700 dark:text-neutral-400 font-normal">
          
          {/* Left: Brand */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-center sm:text-left">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded bg-[#F1FF0A] flex items-center justify-center shadow-sm">
                <FaBoxOpen className="w-3 h-3 text-black" />
              </div>
              <span className="font-title font-semibold text-sm sm:text-base text-neutral-950 dark:text-white">
                get<span className="text-[#687500] dark:text-[#F1FF0A]">Products</span>
              </span>
            </div>
            <span className="hidden sm:inline text-neutral-400 dark:text-neutral-600">•</span>
            <span className="text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm">
              Universal E-Commerce Catalog Exporter
            </span>
          </div>

          {/* Right: Developed By Nokib */}
          <div className="flex items-center gap-3">
            <span className="text-neutral-700 dark:text-neutral-400 text-xs sm:text-sm">
              Developed by <span className="font-title font-semibold text-neutral-950 dark:text-white">Nazmul Hasan Nokib</span>
            </span>

            <div className="flex items-center gap-2">
              <a
                href="https://nokib.vercel.app/developer"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-300 font-medium transition-all text-xs shadow-sm"
              >
                <FaGlobe className="w-3 h-3 text-neutral-700 dark:text-neutral-400" />
                <span>Portfolio</span>
                <FaArrowUpRightFromSquare className="w-2.5 h-2.5 ml-0.5 opacity-70" />
              </a>

              <a
                href="https://github.com/nokib-web"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-300 font-medium transition-all text-xs shadow-sm"
              >
                <FaGithub className="w-3 h-3 text-neutral-700 dark:text-neutral-400" />
                <span>GitHub</span>
              </a>
            </div>
          </div>

        </div>
      </div>

    </footer>
  );
}
