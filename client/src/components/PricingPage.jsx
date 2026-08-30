import React, { useState } from 'react';
import { Check, Zap, Shield, ArrowRight, Sparkles, Lock, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PricingPage({ onGoToApp, userPlan, onSelectPlan }) {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [activatedSuccess, setActivatedSuccess] = useState(null);

  const plans = [
    {
      id: 'free',
      name: 'Starter Free',
      maxLimit: 20,
      description: 'Free forever for quick test runs and small stores.',
      priceMonthly: 0,
      priceYearly: 0,
      badge: null,
      highlight: false,
      trial: false,
      buttonText: 'Current Free Plan',
      features: [
        'Up to 20 products per extraction',
        'Shopify, WooCommerce, Wix & Daraz',
        'Standard CSV & Raw JSON export',
        'Automatic platform & catalog detection',
        'Standard Extraction Speed',
        'Community Support'
      ]
    },
    {
      id: 'popular',
      name: 'Popular',
      maxLimit: 200,
      description: 'Ideal for growing stores, dropshippers & competitor analysis.',
      priceMonthly: 9,
      priceYearly: 7,
      badge: 'Most Popular',
      highlight: true,
      trial: true,
      buttonText: 'Start 7-Day Free Trial',
      features: [
        'Up to 200 products per extraction',
        'All Export Formats (Shopify, Woo, Wix, Universal, JSON)',
        'Full HD Image Downloader & CDN Links',
        'Automated SKU & Inventory Mapping',
        'Live Real-time Streaming Logs (SSE)',
        'High-Speed Multi-Threaded Engine',
        'Standard Email Support'
      ]
    },
    {
      id: 'plus',
      name: 'Plus Exporter',
      maxLimit: 1000,
      description: 'Designed for large catalogs, brand managers & inventory teams.',
      priceMonthly: 19,
      priceYearly: 15,
      badge: 'High Capacity',
      highlight: false,
      trial: true,
      buttonText: 'Start 7-Day Free Trial',
      features: [
        'Up to 1,000 products per extraction',
        'High-speed batch processing engine',
        'Daraz, Zatiq & Custom HTML support',
        'Live real-time streaming logs (SSE)',
        '1-Click direct store export',
        'Full Variant & Image Extraction',
        'Priority Technical Support'
      ]
    },
    {
      id: 'advance',
      name: 'Advance Unlimited',
      maxLimit: 5000,
      description: 'For agencies, data aggregators & unlimited multi-store pipelines.',
      priceMonthly: 39,
      priceYearly: 29,
      badge: 'Unlimited Power',
      highlight: false,
      trial: true,
      buttonText: 'Start 7-Day Free Trial',
      features: [
        'Unlimited products per catalog extraction',
        'Unrestricted batch URL queue',
        'Bot protection bypass engine',
        'Direct API Access & Webhook Integrations',
        'Custom CSV Column Mapping & Templating',
        'Dedicated Scraping Proxies & Node IPs',
        '1-on-1 Dedicated Technical Assistance'
      ]
    }
  ];

  const handleActivate = (plan) => {
    if (plan.id === userPlan?.id && !userPlan?.isTrial) {
      onGoToApp();
      return;
    }

    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    setActivatedSuccess(plan.name);

    if (onSelectPlan) {
      onSelectPlan(plan);
    }

    setTimeout(() => {
      onGoToApp();
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-12 animate-in fade-in duration-300">
      
      {/* Success Activation Banner */}
      {activatedSuccess && (
        <div className="p-4 rounded-2xl bg-[#F1FF0A] text-black font-semibold text-center text-sm shadow-xl flex items-center justify-center gap-2 animate-in zoom-in-95 duration-200">
          <Sparkles className="w-5 h-5 fill-current text-black" />
          <span>Congratulations! Your 7-Day Free Trial for <strong>{activatedSuccess}</strong> is now active. Unlocked full scraping capacity!</span>
        </div>
      )}

      {/* Header Section */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-[#F1FF0A]/20 border border-[#F1FF0A]/40 text-neutral-950 dark:text-[#F1FF0A] text-xs font-semibold uppercase tracking-wider">
          <Gift className="w-3.5 h-3.5" />
          <span>7-Day Free Trial on All Paid Plans</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-title font-semibold text-neutral-950 dark:text-white tracking-tight">
          Flexible Plans for Any Scale
        </h2>
        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">
          Start with our Free tier (20 products) or activate a <strong>7-Day Free Trial</strong> on Popular (200), Plus (1,000), or Advance (Unlimited) with 1-click.
        </p>

        {/* Monthly / Yearly Toggle */}
        <div className="pt-4 flex items-center justify-center gap-3">
          <div className="flex items-center p-1 rounded-xl bg-neutral-200 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                billingCycle === 'yearly'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
              }`}
            >
              <span>Yearly</span>
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-[#F1FF0A] text-black">
                Save 25%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
        {plans.map((plan) => {
          const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
          const isCurrentPlan = userPlan?.id === plan.id;

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl flex flex-col justify-between p-5 sm:p-6 transition-all ${
                plan.highlight
                  ? 'bg-white dark:bg-neutral-900/90 border-2 border-[#F1FF0A] shadow-2xl shadow-[#F1FF0A]/10 scale-[1.02] z-10'
                  : 'bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-md hover:border-neutral-300 dark:hover:border-neutral-700'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#F1FF0A] text-black text-xs font-semibold uppercase tracking-wider shadow-md whitespace-nowrap">
                  {plan.badge}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-title font-semibold text-neutral-950 dark:text-white">
                      {plan.name}
                    </h3>
                    {isCurrentPlan && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700">
                        {userPlan?.isTrial ? 'Trial Active' : 'Current'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 min-h-[32px] font-normal leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                {/* Capacity Highlight Pill */}
                <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800/80 flex items-center justify-between">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Scrape Capacity:</span>
                  <span className="text-xs font-bold text-neutral-950 dark:text-white bg-white dark:bg-black px-2 py-0.5 rounded-md border border-neutral-200 dark:border-neutral-800 shadow-xs">
                    {plan.id === 'advance' ? 'Unlimited' : `Up to ${plan.maxLimit}`}
                  </span>
                </div>

                {/* Price Display */}
                <div className="pt-1 pb-3 border-b border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-title font-semibold text-neutral-950 dark:text-white">
                      ${price}
                    </span>
                    <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      / month
                    </span>
                  </div>
                  {plan.trial && (
                    <span className="text-xs text-emerald-600 dark:text-[#F1FF0A] font-semibold block mt-1">
                      7-Day Free Trial Included
                    </span>
                  )}
                </div>

                {/* Features List */}
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-200 uppercase tracking-wider block">
                    What's Included:
                  </span>
                  <ul className="space-y-2 text-xs text-neutral-700 dark:text-neutral-300 font-normal">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
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
              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => handleActivate(plan)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold tracking-wide uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isCurrentPlan
                      ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-200 cursor-default'
                      : plan.highlight
                      ? 'bg-[#F1FF0A] hover:bg-[#D4FF00] text-black shadow-lg shadow-[#F1FF0A]/20 active:scale-[0.98]'
                      : 'bg-neutral-950 dark:bg-neutral-900 text-white hover:bg-neutral-800 dark:hover:bg-neutral-800 border border-neutral-950 dark:border-neutral-700'
                  }`}
                >
                  <span>{isCurrentPlan ? 'Current Active Plan' : plan.trial ? 'Start 7-Day Free Trial' : 'Select Starter'}</span>
                  {!isCurrentPlan && <ArrowRight className="w-3.5 h-3.5" />}
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
              Instant 7-Day Free Trial — Zero Obligation
            </h4>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Select any plan to instantly unlock 200, 1,000, or Unlimited scraping capacity on your device.
            </p>
          </div>
        </div>

        <button
          onClick={onGoToApp}
          className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-neutral-800 text-xs font-semibold text-neutral-950 dark:text-white transition-colors flex-shrink-0 cursor-pointer"
        >
          Return to Extractor
        </button>
      </div>

    </div>
  );
}
