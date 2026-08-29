import React, { useState } from 'react';
import { Check, Zap, Shield, ArrowRight, HelpCircle } from 'lucide-react';

export default function PricingPage({ onGoToApp }) {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'

  const plans = [
    {
      id: 'free',
      name: 'Starter',
      description: 'Perfect for quick testing & individual small stores.',
      priceMonthly: 0,
      priceYearly: 0,
      badge: null,
      highlight: false,
      buttonText: 'Start Free',
      features: [
        'Up to 100 products per extraction',
        'Shopify & WooCommerce CSV Export',
        'Clean Standard CSV & JSON Export',
        'Automatic Platform Detection',
        'Standard Extraction Speed',
        'Community Support'
      ]
    },
    {
      id: 'pro',
      name: 'Pro Exporter',
      description: 'Ideal for e-commerce owners, dropshippers & marketers.',
      priceMonthly: 19,
      priceYearly: 15,
      badge: 'Most Popular',
      highlight: true,
      buttonText: 'Get Pro Access',
      features: [
        'Unlimited Products per catalog',
        'All Export Formats (Shopify, Woo, Wix, Universal, JSON)',
        'Full HD Image Downloader & Proxy CDN Links',
        'Automated SKU & Inventory Mapping',
        'Live Real-time Streaming Logs (SSE)',
        'High-Speed Multi-Threaded Engine',
        'Priority 24/7 Support'
      ]
    },
    {
      id: 'agency',
      name: 'Agency / Enterprise',
      description: 'For agencies, custom scraping workflows & multi-store pipelines.',
      priceMonthly: 49,
      priceYearly: 39,
      badge: 'Full Power',
      highlight: false,
      buttonText: 'Contact Enterprise',
      features: [
        'Everything in Pro Plan',
        'Custom Scraping Engine & Bot Bypass',
        'Bulk URL Batch Extraction Queue',
        'Direct API Access & Webhook Integrations',
        'Custom CSV Column Mapping & Templating',
        'Dedicated Scraping Proxies & Node IPs',
        '1-on-1 Dedicated Technical Assistance'
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-12 animate-in fade-in duration-300">
      
      {/* Header Section */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-[#F1FF0A]/20 border border-[#F1FF0A]/40 text-neutral-900 dark:text-[#F1FF0A]">
          Flexible & Transparent Pricing
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-neutral-950 dark:text-white tracking-tight">
          Simple Plans for Any Scale
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Extract full product catalogs with descriptions, images, variants, and prices in one click. Upgrade anytime as your store grows.
        </p>

        {/* Monthly / Yearly Toggle */}
        <div className="pt-4 flex items-center justify-center gap-3">
          <div className="flex items-center p-1 rounded-xl bg-neutral-200 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
              }`}
            >
              <span>Yearly</span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-[#F1FF0A] text-black">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {plans.map((plan) => {
          const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl flex flex-col justify-between p-6 sm:p-7 transition-all ${
                plan.highlight
                  ? 'bg-white dark:bg-neutral-900/90 border-2 border-[#F1FF0A] shadow-2xl shadow-[#F1FF0A]/10 scale-[1.02] z-10'
                  : 'bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-md hover:border-neutral-300 dark:hover:border-neutral-700'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#F1FF0A] text-black text-[11px] font-black uppercase tracking-wider shadow-md">
                  {plan.badge}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-extrabold text-neutral-950 dark:text-white">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 min-h-[32px]">
                    {plan.description}
                  </p>
                </div>

                {/* Price Display */}
                <div className="pt-2 pb-4 border-b border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-neutral-950 dark:text-white">
                      ${price}
                    </span>
                    <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                      / month
                    </span>
                  </div>
                  {billingCycle === 'yearly' && plan.priceMonthly > 0 && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                      Billed annually (${price * 12}/yr)
                    </span>
                  )}
                </div>

                {/* Features List */}
                <div className="space-y-2.5 pt-2">
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-200 uppercase tracking-wider block">
                    What's Included:
                  </span>
                  <ul className="space-y-2.5 text-xs text-neutral-700 dark:text-neutral-300">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <div className="w-4 h-4 rounded-full bg-[#F1FF0A]/20 dark:bg-[#F1FF0A]/10 border border-[#F1FF0A]/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 text-neutral-950 dark:text-[#F1FF0A] stroke-[3]" />
                        </div>
                        <span className="leading-tight">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-8">
                <button
                  type="button"
                  onClick={onGoToApp}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-extrabold tracking-wide uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    plan.highlight
                      ? 'bg-[#F1FF0A] hover:bg-[#D4FF00] text-black shadow-lg shadow-[#F1FF0A]/20 active:scale-[0.98]'
                      : 'bg-neutral-950 dark:bg-neutral-900 text-white hover:bg-neutral-800 dark:hover:bg-neutral-800 border border-neutral-950 dark:border-neutral-700'
                  }`}
                >
                  <span>{plan.buttonText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust & Guarantee Box */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F1FF0A]/20 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-neutral-950 dark:text-[#F1FF0A]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-neutral-950 dark:text-white">
              Enterprise Grade Safety & Fast Extraction
            </h4>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              No store credentials needed. Zero lock-in. Export instantly to any platform.
            </p>
          </div>
        </div>

        <button
          onClick={onGoToApp}
          className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-neutral-800 text-xs font-bold text-neutral-950 dark:text-white transition-colors flex-shrink-0 cursor-pointer"
        >
          Try Free Live Demo
        </button>
      </div>

    </div>
  );
}
