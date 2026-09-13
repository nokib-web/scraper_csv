import React, { useState, useEffect, useRef } from 'react';
import { Lock, KeyRound, Eye, EyeOff, ArrowRight, AlertCircle, X, Loader2, ShieldCheck, Store } from 'lucide-react';

export default function PasswordModal({
  isOpen,
  onClose,
  onSubmit,
  url = '',
  isLoading = false,
  errorMessage = '',
  platform = 'shopify'
}) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setShowPassword(false);
      // Autofocus input on open
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password.trim() || isLoading) return;
    onSubmit(password.trim());
  };

  let cleanHost = '';
  try {
    if (url) {
      const u = new URL(url.startsWith('http') ? url : `https://${url}`);
      cleanHost = u.hostname;
    }
  } catch (e) {
    cleanHost = url;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#121216] border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="password-modal-title"
      >
        {/* Top Decorative Glow */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#F1FF0A]/20 dark:bg-[#F1FF0A]/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Lock Icon */}
        <div className="flex items-start gap-3.5 mb-5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0 text-amber-600 dark:text-amber-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 id="password-modal-title" className="text-lg font-bold text-neutral-950 dark:text-white">
              Password-Protected Store
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              This store is in development or protected mode. Enter the storefront password to unlock and scrape catalog.
            </p>
          </div>
        </div>

        {/* Store Host Info */}
        {cleanHost && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-700 dark:text-neutral-300 mb-4">
            <Store className="w-3.5 h-3.5 text-[#8b9900] dark:text-[#F1FF0A] flex-shrink-0" />
            <span className="truncate">{cleanHost}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-medium mb-4 animate-in shake duration-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label 
              htmlFor="storefront-password-input" 
              className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5"
            >
              Storefront Password:
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-neutral-400 dark:text-neutral-500 pointer-events-none">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                ref={inputRef}
                id="storefront-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter store password..."
                disabled={isLoading}
                required
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 hover:border-[#F1FF0A] focus:border-[#F1FF0A] focus:ring-2 focus:ring-[#F1FF0A]/20 dark:focus:ring-[#F1FF0A]/10 text-neutral-950 dark:text-white text-sm font-medium outline-none transition-all placeholder-neutral-400 dark:placeholder-neutral-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
              Usually configured under Shopify Admin &gt; Online Store &gt; Preferences &gt; Password protection.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#F1FF0A] hover:bg-[#D4FF00] active:scale-[0.98] text-black text-xs font-bold shadow-lg shadow-[#F1FF0A]/20 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Unlocking...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Unlock & Extract</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
