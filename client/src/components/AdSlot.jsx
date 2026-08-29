import React, { useEffect } from 'react';
import { SiShopify, SiWoocommerce, SiWordpress, SiCloudflare } from 'react-icons/si';
import { FaGoogle, FaServer, FaExternalLinkAlt, FaRocket, FaShieldAlt } from 'react-icons/fa';

/**
 * High-Converting & User-Friendly E-Commerce Monetization Banner
 * Uses real brand icons (Shopify, WooCommerce, Cloudflare, Google)
 * Works seamlessly in both Light & Dark themes
 */
export default function AdSlot({ 
  slotType = 'affiliate', // 'adsense' | 'affiliate' | 'custom'
  adClient = '',
  adSlot = '',
  className = ''
}) {

  // Auto-init Google AdSense script if adsense slot is active
  useEffect(() => {
    if (slotType === 'adsense' && window.adsbygoogle) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.warn('AdSense push error:', e);
      }
    }
  }, [slotType]);

  // If using Google AdSense live script
  if (slotType === 'adsense' && adClient && adSlot) {
    return (
      <div className={`w-full text-center my-4 overflow-hidden rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-3 shadow-sm ${className}`}>
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2 px-2">
          <span className="flex items-center gap-1">
            <FaGoogle className="w-2.5 h-2.5" />
            <span>Google Advertisement</span>
          </span>
          <span>Ad</span>
        </div>
        <ins
          className="adsbygoogle"
          style={{ display: 'block', minHeight: '90px' }}
          data-ad-client={adClient}
          data-ad-slot={adSlot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        ></ins>
      </div>
    );
  }

  // Premium User-Friendly Sponsored Recommendations with Real Brand Icons
  return (
    <div className={`w-full space-y-3.5 ${className}`}>
      
      {/* Top Header Label */}
      <div className="flex items-center justify-between px-1 text-xs">
        <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-300 font-bold">
          <FaRocket className="w-3.5 h-3.5 text-[#687500] dark:text-[#F1FF0A]" />
          <span>Recommended E-Commerce Tools & Deals</span>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-neutral-200/80 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400">
          Sponsored
        </span>
      </div>

      {/* 3 Real Brand Sponsored Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        
        {/* Card 1: Official Shopify Deal */}
        <a
          href="https://www.shopify.com"
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="p-4 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center flex-shrink-0 text-[#95BF47]">
                  <SiShopify className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-950 dark:text-white">
                    Shopify Official
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    $1/Month Special Promo
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                Verified
              </span>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">
              Import your scraped product CSV directly into Shopify. 3-day free trial + $1/month plan available.
            </p>
          </div>

          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-900 flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
            <span>Claim $1 Shopify Deal</span>
            <FaExternalLinkAlt className="w-2.5 h-2.5 opacity-70" />
          </div>
        </a>

        {/* Card 2: WooCommerce & WordPress Cloud */}
        <a
          href="https://woocommerce.com"
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="p-4 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 hover:border-purple-500/60 dark:hover:border-purple-500/60 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex items-center justify-center flex-shrink-0 text-[#96588A]">
                  <SiWoocommerce className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-950 dark:text-white">
                    WooCommerce
                  </h4>
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                    WordPress Store Suite
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 border border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300">
                WP Ready
              </span>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">
              Self-host your store with complete freedom. Upload your WooCommerce CSV with attributes & variations.
            </p>
          </div>

          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-900 flex items-center justify-between text-xs font-bold text-purple-700 dark:text-purple-400 group-hover:translate-x-0.5 transition-transform">
            <span>Explore WooCommerce</span>
            <FaExternalLinkAlt className="w-2.5 h-2.5 opacity-70" />
          </div>
        </a>

        {/* Card 3: Cloud & CDN Store Hosting */}
        <a
          href="https://www.hostinger.com"
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="p-4 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 hover:border-[#F1FF0A]/60 dark:hover:border-[#F1FF0A]/60 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center flex-shrink-0 text-amber-600 dark:text-amber-400">
                  <FaServer className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-950 dark:text-white">
                    Cloud Server & SSL
                  </h4>
                  <span className="text-[10px] font-bold text-[#687500] dark:text-[#F1FF0A]">
                    75% Off Cloud Plans
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#F1FF0A]/20 dark:bg-[#F1FF0A]/10 border border-[#F1FF0A]/40 text-neutral-900 dark:text-[#F1FF0A]">
                Fast Speed
              </span>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">
              High-speed NVMe servers with automatic CSV import optimization, free domain, and DDoS protection.
            </p>
          </div>

          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-900 flex items-center justify-between text-xs font-bold text-neutral-900 dark:text-[#F1FF0A] group-hover:translate-x-0.5 transition-transform">
            <span>Get 75% Hosting Discount</span>
            <FaExternalLinkAlt className="w-2.5 h-2.5 opacity-70" />
          </div>
        </a>

      </div>

      {/* Sleek Minimalist Ad Banner Space (728x90 Leaderboard) */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-extrabold text-neutral-900 dark:text-white">
              Google AdSense / High-CPM Display Network
            </div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
              Responsive 728x90 Leaderboard / Display Ad Slot ready for code injection
            </div>
          </div>
        </div>

        <div className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 flex-shrink-0">
          Ad Slot Ready
        </div>
      </div>

    </div>
  );
}
