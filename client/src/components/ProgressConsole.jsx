import React, { useRef, useEffect } from 'react';
import { Terminal, ChevronUp, ChevronDown, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export default function ProgressConsole({ logs, status, isCollapsed, onToggleCollapse }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isCollapsed && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, isCollapsed]);

  if (logs.length === 0) return null;

  return (
    <div className="w-full rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xl dark:shadow-2xl animate-in fade-in duration-300">
      
      {/* Header bar */}
      <div
        onClick={onToggleCollapse}
        className="flex items-center justify-between px-4 py-3 bg-neutral-100 dark:bg-neutral-900/90 border-b border-neutral-200 dark:border-neutral-800/80 cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <Terminal className="w-4 h-4 text-[#8b9900] dark:text-[#F1FF0A]" />
          <span className="text-xs font-bold text-neutral-900 dark:text-white tracking-wide uppercase">
            Live Scraping Console
          </span>

          {status === 'loading' && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#F1FF0A]/20 border border-[#F1FF0A]/40 text-[10px] font-bold text-neutral-900 dark:text-[#F1FF0A] animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              Streaming Live
            </span>
          )}
          {status === 'done' && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              Completed
            </span>
          )}
          {status === 'error' && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-[10px] font-bold text-red-600 dark:text-red-400">
              <AlertCircle className="w-3 h-3" />
              Error
            </span>
          )}
        </div>

        <button className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-1 transition-colors cursor-pointer">
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* Logs View */}
      {!isCollapsed && (
        <div 
          ref={containerRef}
          className="p-4 bg-[#F8F9FB] dark:bg-black/90 font-mono text-[11px] text-neutral-800 dark:text-neutral-300 max-h-52 overflow-y-auto space-y-1.5 leading-relaxed border-t border-neutral-200 dark:border-neutral-800/80"
        >
          {logs.map((log, index) => {
            const isError = log.includes('error') || log.includes('Failed') || log.includes('Error');
            const isSuccess = log.includes('Success') || log.includes('Completed') || log.includes('Extracted');
            const isDiscover = log.includes('Discovered') || log.includes('Detected');

            return (
              <div
                key={index}
                className={`flex items-start gap-2 ${
                  isError
                    ? 'text-red-600 dark:text-red-400 font-semibold'
                    : isSuccess
                    ? 'text-emerald-700 dark:text-[#F1FF0A] font-semibold'
                    : isDiscover
                    ? 'text-blue-700 dark:text-yellow-300 font-semibold'
                    : 'text-neutral-700 dark:text-neutral-400 font-normal'
                }`}
              >
                <span className="text-neutral-400 dark:text-neutral-600 font-bold select-none">›</span>
                <span className="break-all">{log}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
