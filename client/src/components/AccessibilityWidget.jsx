import React, { useState, useEffect } from 'react';
import { 
  X, 
  RotateCcw, 
  Globe, 
  Type, 
  MousePointer, 
  Link as LinkIcon, 
  AlignJustify, 
  ImageOff, 
  BookOpen, 
  PauseCircle, 
  Contrast, 
  Sun, 
  Droplet, 
  Eye,
  Check,
  ShieldCheck
} from 'lucide-react';
import { FaUniversalAccess } from 'react-icons/fa';

const DEFAULT_SETTINGS = {
  biggerText: 0, // 0: normal, 1: +15%, 2: +30%
  biggerCursor: false,
  highlightLinks: false,
  lineHeight: false,
  hideImages: false,
  readableFont: false,
  dyslexicFont: false,
  stopAnimations: false,
  invertColors: false,
  brightness: 0, // 0: normal, 1: high, 2: low
  contrast: 0,   // 0: normal, 1: high
  saturation: 0, // 0: normal, 1: low (monochrome), 2: high
  colorFilter: 'none' // 'none', 'grayscale', 'colorblind'
};

const STORAGE_KEY = 'getproducts_a11y_settings';

export default function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Apply settings to DOM (HTML root element)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}

    const root = document.documentElement;
    const body = document.body;

    // 1. Bigger Text
    root.classList.remove('a11y-text-1', 'a11y-text-2');
    if (settings.biggerText === 1) root.classList.add('a11y-text-1');
    if (settings.biggerText === 2) root.classList.add('a11y-text-2');

    // 2. Bigger Cursor
    if (settings.biggerCursor) {
      body.classList.add('a11y-bigger-cursor');
    } else {
      body.classList.remove('a11y-bigger-cursor');
    }

    // 3. Highlight Links & Buttons
    if (settings.highlightLinks) {
      root.classList.add('a11y-highlight-links');
    } else {
      root.classList.remove('a11y-highlight-links');
    }

    // 4. Line Height / Spacing
    if (settings.lineHeight) {
      root.classList.add('a11y-line-height');
    } else {
      root.classList.remove('a11y-line-height');
    }

    // 5. Hide Images
    if (settings.hideImages) {
      root.classList.add('a11y-hide-images');
    } else {
      root.classList.remove('a11y-hide-images');
    }

    // 6. Readable Font
    if (settings.readableFont) {
      root.classList.add('a11y-readable-font');
    } else {
      root.classList.remove('a11y-readable-font');
    }

    // 7. Dyslexic Font
    if (settings.dyslexicFont) {
      root.classList.add('a11y-dyslexic-font');
    } else {
      root.classList.remove('a11y-dyslexic-font');
    }

    // 8. Stop Animations
    if (settings.stopAnimations) {
      root.classList.add('a11y-stop-animations');
    } else {
      root.classList.remove('a11y-stop-animations');
    }

    // 9. Invert Colors
    if (settings.invertColors) {
      root.classList.add('a11y-invert-colors');
    } else {
      root.classList.remove('a11y-invert-colors');
    }

    // 10. Brightness
    root.classList.remove('a11y-bright-high', 'a11y-bright-low');
    if (settings.brightness === 1) root.classList.add('a11y-bright-high');
    if (settings.brightness === 2) root.classList.add('a11y-bright-low');

    // 11. Contrast
    if (settings.contrast === 1) {
      root.classList.add('a11y-contrast-high');
    } else {
      root.classList.remove('a11y-contrast-high');
    }

    // 12. Saturation
    root.classList.remove('a11y-sat-low', 'a11y-sat-high');
    if (settings.saturation === 1) root.classList.add('a11y-sat-low');
    if (settings.saturation === 2) root.classList.add('a11y-sat-high');

    // 13. Color Filter
    root.classList.remove('a11y-filter-grayscale', 'a11y-filter-colorblind');
    if (settings.colorFilter === 'grayscale') root.classList.add('a11y-filter-grayscale');
    if (settings.colorFilter === 'colorblind') root.classList.add('a11y-filter-colorblind');

  }, [settings]);

  const drawerRef = React.useRef(null);

  // Handle ESC key and Outside click to close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e) => {
      if (
        isOpen && 
        drawerRef.current && 
        !drawerRef.current.contains(e.target) && 
        !e.target.closest('.a11y-trigger-btn')
      ) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const activeCount = Object.entries(settings).filter(([k, v]) => {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v > 0;
    if (typeof v === 'string') return v !== 'none';
    return false;
  }).length;

  return (
    <div className="a11y-widget-portal font-sans">
      {/* Floating Trigger Button on the Left Edge */}
      <div className="fixed left-0 top-1/2 -translate-y-1/2 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          aria-label="Open Accessibility Options"
          aria-expanded={isOpen}
          title="Accessibility Options"
          className="a11y-trigger-btn group relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-r-2xl bg-[#0047FF] hover:bg-[#0038CC] text-white shadow-2xl border-y border-r border-white/20 transition-all duration-300 hover:w-14 cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#0047FF]/40 active:scale-95"
        >
          <div className="p-1 rounded-full bg-white/10 group-hover:scale-110 transition-transform">
            <FaUniversalAccess className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          {activeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-5 h-5 rounded-full bg-[#D4FF00] text-black font-extrabold text-[11px] shadow-md border-2 border-white dark:border-neutral-900">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Accessibility Side Drawer (Right Sliding Panel) - Clean without background blur */}
      <div 
        ref={drawerRef}
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] max-w-full bg-[#0D1520] text-slate-100 shadow-2xl border-l border-slate-800/80 flex flex-col transform transition-transform duration-300 ease-out overflow-hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="a11y-title"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#080E18] border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#0047FF] text-white shadow-sm">
              <FaUniversalAccess className="w-4 h-4" />
            </div>
            <div>
              <h2 id="a11y-title" className="text-base font-bold text-white tracking-tight leading-none">
                Accessibility Options
              </h2>
              <span className="text-[11px] text-slate-400">ADA & WCAG Compliance Tool</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700">
              <Globe className="w-3 h-3 text-[#00E5FF]" />
              <span>EN</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close Accessibility Options"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Drawer Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 custom-scrollbar">
          
          {/* SECTION 1: CONTENT */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Content
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Text & Visuals</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              
              {/* 1. Bigger Text */}
              <button
                type="button"
                onClick={() => updateSetting('biggerText', (settings.biggerText + 1) % 3)}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer select-none ${
                  settings.biggerText > 0 
                    ? 'bg-[#0047FF]/20 border-[#0047FF] text-white shadow-[0_0_15px_rgba(0,71,255,0.3)]' 
                    : 'bg-[#131D2D] border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <Type className="w-5 h-5 text-[#00E5FF]" />
                <span className="text-xs font-semibold leading-tight">Bigger Text</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${settings.biggerText > 0 ? 'bg-[#0047FF] text-white' : 'text-slate-500'}`}>
                  {settings.biggerText === 0 ? 'Default' : settings.biggerText === 1 ? '+15%' : '+30%'}
                </span>
              </button>

              {/* 2. Bigger Cursor */}
              <button
                type="button"
                onClick={() => updateSetting('biggerCursor', !settings.biggerCursor)}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer select-none ${
                  settings.biggerCursor 
                    ? 'bg-[#0047FF]/20 border-[#0047FF] text-white shadow-[0_0_15px_rgba(0,71,255,0.3)]' 
                    : 'bg-[#131D2D] border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <MousePointer className="w-5 h-5 text-[#00E5FF]" />
                <span className="text-xs font-semibold leading-tight">Bigger Cursor</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${settings.biggerCursor ? 'bg-[#0047FF] text-white' : 'text-slate-500'}`}>
                  {settings.biggerCursor ? 'Active' : 'Off'}
                </span>
              </button>

              {/* 3. Highlight Links & Buttons */}
              <button
                type="button"
                onClick={() => updateSetting('highlightLinks', !settings.highlightLinks)}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer select-none ${
                  settings.highlightLinks 
                    ? 'bg-[#0047FF]/20 border-[#0047FF] text-white shadow-[0_0_15px_rgba(0,71,255,0.3)]' 
                    : 'bg-[#131D2D] border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <LinkIcon className="w-5 h-5 text-[#00E5FF]" />
                <span className="text-xs font-semibold leading-tight">Tooltips & Links</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${settings.highlightLinks ? 'bg-[#0047FF] text-white' : 'text-slate-500'}`}>
                  {settings.highlightLinks ? 'Active' : 'Off'}
                </span>
              </button>

              {/* 4. Line Height */}
              <button
                type="button"
                onClick={() => updateSetting('lineHeight', !settings.lineHeight)}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer select-none ${
                  settings.lineHeight 
                    ? 'bg-[#0047FF]/20 border-[#0047FF] text-white shadow-[0_0_15px_rgba(0,71,255,0.3)]' 
                    : 'bg-[#131D2D] border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <AlignJustify className="w-5 h-5 text-[#00E5FF]" />
                <span className="text-xs font-semibold leading-tight">Line Height</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${settings.lineHeight ? 'bg-[#0047FF] text-white' : 'text-slate-500'}`}>
                  {settings.lineHeight ? 'Active' : 'Off'}
                </span>
              </button>

              {/* 5. Hide Images */}
              <button
                type="button"
                onClick={() => updateSetting('hideImages', !settings.hideImages)}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer select-none ${
                  settings.hideImages 
                    ? 'bg-[#0047FF]/20 border-[#0047FF] text-white shadow-[0_0_15px_rgba(0,71,255,0.3)]' 
                    : 'bg-[#131D2D] border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <ImageOff className="w-5 h-5 text-[#00E5FF]" />
                <span className="text-xs font-semibold leading-tight">Hide Images</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${settings.hideImages ? 'bg-[#0047FF] text-white' : 'text-slate-500'}`}>
                  {settings.hideImages ? 'Active' : 'Off'}
                </span>
              </button>

              {/* 6. Readable Fonts */}
              <button
                type="button"
                onClick={() => {
                  updateSetting('readableFont', !settings.readableFont);
                  if (!settings.readableFont) updateSetting('dyslexicFont', false);
                }}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer select-none ${
                  settings.readableFont 
                    ? 'bg-[#0047FF]/20 border-[#0047FF] text-white shadow-[0_0_15px_rgba(0,71,255,0.3)]' 
                    : 'bg-[#131D2D] border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <span className="text-base font-extrabold text-[#00E5FF]">Aa</span>
                <span className="text-xs font-semibold leading-tight">Readable Fonts</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${settings.readableFont ? 'bg-[#0047FF] text-white' : 'text-slate-500'}`}>
                  {settings.readableFont ? 'Active' : 'Off'}
                </span>
              </button>

              {/* 7. Dyslexic Font */}
              <button
                type="button"
                onClick={() => {
                  updateSetting('dyslexicFont', !settings.dyslexicFont);
                  if (!settings.dyslexicFont) updateSetting('readableFont', false);
                }}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer select-none ${
                  settings.dyslexicFont 
                    ? 'bg-[#0047FF]/20 border-[#0047FF] text-white shadow-[0_0_15px_rgba(0,71,255,0.3)]' 
                    : 'bg-[#131D2D] border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <BookOpen className="w-5 h-5 text-[#00E5FF]" />
                <span className="text-xs font-semibold leading-tight">Dyslexic Font</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${settings.dyslexicFont ? 'bg-[#0047FF] text-white' : 'text-slate-500'}`}>
                  {settings.dyslexicFont ? 'Active' : 'Off'}
                </span>
              </button>

              {/* 8. Stop Animations */}
              <button
                type="button"
                onClick={() => updateSetting('stopAnimations', !settings.stopAnimations)}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer select-none ${
                  settings.stopAnimations 
                    ? 'bg-[#0047FF]/20 border-[#0047FF] text-white shadow-[0_0_15px_rgba(0,71,255,0.3)]' 
                    : 'bg-[#131D2D] border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <PauseCircle className="w-5 h-5 text-[#00E5FF]" />
                <span className="text-xs font-semibold leading-tight">Stop Animations</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${settings.stopAnimations ? 'bg-[#0047FF] text-white' : 'text-slate-500'}`}>
                  {settings.stopAnimations ? 'Active' : 'Off'}
                </span>
              </button>

            </div>
          </div>

          {/* SECTION 2: COLORS & CONTRAST */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Colors & Contrast
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Display Modes</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              
              {/* Invert Colors */}
              <button
                type="button"
                onClick={() => updateSetting('invertColors', !settings.invertColors)}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer select-none ${
                  settings.invertColors 
                    ? 'bg-[#0047FF]/20 border-[#0047FF] text-white shadow-[0_0_15px_rgba(0,71,255,0.3)]' 
                    : 'bg-[#131D2D] border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <Contrast className="w-5 h-5 text-[#00E5FF]" />
                <span className="text-xs font-semibold leading-tight">Invert Colors</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${settings.invertColors ? 'bg-[#0047FF] text-white' : 'text-slate-500'}`}>
                  {settings.invertColors ? 'Active' : 'Off'}
                </span>
              </button>

              {/* Brightness */}
              <button
                type="button"
                onClick={() => updateSetting('brightness', (settings.brightness + 1) % 3)}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer select-none ${
                  settings.brightness > 0 
                    ? 'bg-[#0047FF]/20 border-[#0047FF] text-white shadow-[0_0_15px_rgba(0,71,255,0.3)]' 
                    : 'bg-[#131D2D] border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <Sun className="w-5 h-5 text-[#00E5FF]" />
                <span className="text-xs font-semibold leading-tight">Brightness</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${settings.brightness > 0 ? 'bg-[#0047FF] text-white' : 'text-slate-500'}`}>
                  {settings.brightness === 0 ? 'Normal' : settings.brightness === 1 ? 'High' : 'Low'}
                </span>
              </button>

              {/* Contrast */}
              <button
                type="button"
                onClick={() => updateSetting('contrast', settings.contrast === 1 ? 0 : 1)}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer select-none ${
                  settings.contrast > 0 
                    ? 'bg-[#0047FF]/20 border-[#0047FF] text-white shadow-[0_0_15px_rgba(0,71,255,0.3)]' 
                    : 'bg-[#131D2D] border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="w-5 h-5 rounded-full border-2 border-[#00E5FF] flex overflow-hidden">
                  <div className="w-1/2 h-full bg-[#00E5FF]" />
                </div>
                <span className="text-xs font-semibold leading-tight">Contrast</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${settings.contrast > 0 ? 'bg-[#0047FF] text-white' : 'text-slate-500'}`}>
                  {settings.contrast > 0 ? 'High' : 'Normal'}
                </span>
              </button>

              {/* Saturation */}
              <button
                type="button"
                onClick={() => updateSetting('saturation', (settings.saturation + 1) % 3)}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer select-none ${
                  settings.saturation > 0 
                    ? 'bg-[#0047FF]/20 border-[#0047FF] text-white shadow-[0_0_15px_rgba(0,71,255,0.3)]' 
                    : 'bg-[#131D2D] border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <Droplet className="w-5 h-5 text-[#00E5FF]" />
                <span className="text-xs font-semibold leading-tight">Saturation</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${settings.saturation > 0 ? 'bg-[#0047FF] text-white' : 'text-slate-500'}`}>
                  {settings.saturation === 0 ? 'Normal' : settings.saturation === 1 ? 'Low' : 'High'}
                </span>
              </button>

              {/* Color Filter: Grayscale */}
              <button
                type="button"
                onClick={() => updateSetting('colorFilter', settings.colorFilter === 'grayscale' ? 'none' : 'grayscale')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer select-none ${
                  settings.colorFilter === 'grayscale' 
                    ? 'bg-[#0047FF]/20 border-[#0047FF] text-white shadow-[0_0_15px_rgba(0,71,255,0.3)]' 
                    : 'bg-[#131D2D] border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-gray-400 to-gray-700 border border-slate-600" />
                <span className="text-xs font-semibold leading-tight">Grayscale</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${settings.colorFilter === 'grayscale' ? 'bg-[#0047FF] text-white' : 'text-slate-500'}`}>
                  {settings.colorFilter === 'grayscale' ? 'Active' : 'Off'}
                </span>
              </button>

              {/* Color Filter: Colorblind Assist */}
              <button
                type="button"
                onClick={() => updateSetting('colorFilter', settings.colorFilter === 'colorblind' ? 'none' : 'colorblind')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer select-none ${
                  settings.colorFilter === 'colorblind' 
                    ? 'bg-[#0047FF]/20 border-[#0047FF] text-white shadow-[0_0_15px_rgba(0,71,255,0.3)]' 
                    : 'bg-[#131D2D] border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-red-500 to-green-500 border border-slate-600" />
                <span className="text-xs font-semibold leading-tight">Color Filters</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${settings.colorFilter === 'colorblind' ? 'bg-[#0047FF] text-white' : 'text-slate-500'}`}>
                  {settings.colorFilter === 'colorblind' ? 'Red/Green' : 'Off'}
                </span>
              </button>

            </div>
          </div>

        </div>

        {/* Drawer Bottom Bar with Reset */}
        <div className="px-5 py-3.5 bg-[#080E18] border-t border-slate-800 space-y-2.5">
          <button
            type="button"
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 hover:border-slate-600 transition-all cursor-pointer active:scale-[0.98] shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span>Reset Settings</span>
          </button>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="hover:text-white transition-colors cursor-default flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00E5FF]" />
              Accessibility Standard
            </span>
            <span className="font-semibold text-slate-300 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
              Accessibly Verified
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
