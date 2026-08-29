import React from 'react';
import { 
  SiShopify, 
  SiWoocommerce, 
  SiWordpress, 
  SiWix, 
  SiVercel, 
  SiGithub, 
  SiCloudflare, 
  SiStripe
} from 'react-icons/si';
import { FaAmazon } from 'react-icons/fa';

export default function BrandSlider() {
  const brands = [
    { name: 'Shopify', icon: <SiShopify className="w-8 h-8 sm:w-9 sm:h-9 text-[#95BF47]" />, tag: 'Direct CSV Export' },
    { name: 'WooCommerce', icon: <SiWoocommerce className="w-9 h-9 sm:w-10 sm:h-10 text-[#96588A]" />, tag: 'Native Import' },
    { name: 'WordPress', icon: <SiWordpress className="w-8 h-8 sm:w-9 sm:h-9 text-[#21759B]" />, tag: 'Catalog Sync' },
    { name: 'Wix eCommerce', icon: <SiWix className="w-8 h-8 sm:w-9 sm:h-9 text-neutral-900 dark:text-white" />, tag: 'Ready CSV' },
    { 
      name: 'Google', 
      icon: (
        <svg className="w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
      ), 
      tag: 'Merchant Feed' 
    },
    { name: 'Vercel', icon: <SiVercel className="w-7 h-7 sm:w-8 sm:h-8 text-black dark:text-white" />, tag: 'Cloud Deployed' },
    { name: 'GitHub', icon: <SiGithub className="w-8 h-8 sm:w-9 sm:h-9 text-black dark:text-white" />, tag: 'Open Ecosystem' },
    { name: 'Cloudflare', icon: <SiCloudflare className="w-8 h-8 sm:w-9 sm:h-9 text-[#F38020]" />, tag: 'Ultra-Fast CDN' },
    { name: 'Stripe', icon: <SiStripe className="w-8 h-8 sm:w-9 sm:h-9 text-[#635BFF]" />, tag: 'Payment Ready' },
    { name: 'Amazon', icon: <FaAmazon className="w-8 h-8 sm:w-9 sm:h-9 text-[#FF9900]" />, tag: 'Catalog Schema' }
  ];

  const renderTrack = (trackId) => (
    <div 
      key={trackId} 
      className="flex shrink-0 items-center gap-4 animate-infinite-scroll group-hover:[animation-play-state:paused] pr-4"
    >
      {brands.map((b, idx) => (
        <div
          key={`${trackId}-${idx}`}
          className="flex items-center gap-4 px-6 sm:px-7 py-4.5 sm:py-5 rounded-xl bg-white/90 dark:bg-neutral-900/70 backdrop-blur-sm shadow-sm hover:shadow-md dark:shadow-black/50 opacity-90 hover:opacity-100 hover:scale-[1.02] transition-all select-none min-h-[76px] sm:min-h-[82px]"
        >
          <div className="flex-shrink-0 flex items-center justify-center">{b.icon}</div>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-neutral-100 leading-tight">
              {b.name}
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold">
              {b.tag}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full space-y-3 pt-2">
      
      {/* Header text */}
      <div className="text-center space-y-1">
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
          Seamless Compatibility & Integrations
        </span>
        <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">
          Works Flawlessly With Major E-Commerce & Web Platforms
        </h3>
      </div>

      {/* Marquee Slider Container */}
      <div className="relative w-full overflow-hidden py-2 group">
        
        {/* Left & Right subtle edge fade gradient */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-28 bg-gradient-to-r from-[#F5F5F7] dark:from-[#09090b] to-transparent z-10"></div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-28 bg-gradient-to-l from-[#F5F5F7] dark:from-[#09090b] to-transparent z-10"></div>

        {/* Infinite Multi-Track Container */}
        <div className="flex overflow-x-hidden py-2 select-none">
          {renderTrack('t1')}
          {renderTrack('t2')}
          {renderTrack('t3')}
          {renderTrack('t4')}
        </div>

      </div>

    </div>
  );
}
