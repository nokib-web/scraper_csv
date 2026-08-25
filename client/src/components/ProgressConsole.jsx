import React, { useRef, useEffect } from 'react';
import { Terminal, CheckCircle, AlertTriangle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

export default function ProgressConsole({
  logs = [],
  isLoading = false,
  error = null,
  isOpen = true,
  setIsOpen
}) {
  const logEndRef = useRef(null);

  useEffect(() => {
    if (logEndRef.current && isOpen) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen]);

  if (logs.length === 0 && !isLoading && !error) return null;

  return (
    <div className="w-full glass-panel border-indigo-500/20 overflow-hidden mb-6">
      {/* Console Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-5 py-3 bg-slate-950/80 border-b border-white/10 cursor-pointer hover:bg-slate-900/80 transition"
      >
        <div className="flex items-center gap-2.5">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Live Scraping Console
          </span>
          {isLoading && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
              Streaming Data
            </span>
          )}
          {!isLoading && logs.length > 0 && !error && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <CheckCircle className="w-3 h-3" />
              Extraction Done
            </span>
          )}
          {error && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <AlertTriangle className="w-3 h-3" />
              Error Occurred
            </span>
          )}
        </div>

        <button className="text-slate-400 hover:text-white p-1">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Console Body */}
      {isOpen && (
        <div className="p-4 bg-slate-950/90 font-mono text-xs max-h-48 overflow-y-auto space-y-1.5">
          {logs.map((log, index) => (
            <div key={index} className="flex items-start gap-2 text-slate-300 leading-relaxed">
              <span className="text-slate-500 select-none">
                [{typeof log === 'object' ? log.timestamp || 'LOG' : 'LOG'}]
              </span>
              <span className="text-indigo-400 select-none">❯</span>
              <span className={index === logs.length - 1 && isLoading ? 'text-cyan-300 font-semibold' : 'text-slate-200'}>
                {typeof log === 'object' ? log.message : log}
              </span>
            </div>
          ))}

          {error && (
            <div className="flex items-start gap-2 text-rose-400 bg-rose-950/40 p-2.5 rounded-lg border border-rose-500/30 mt-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Extraction Failed</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          <div ref={logEndRef} />
        </div>
      )}
    </div>
  );
}
