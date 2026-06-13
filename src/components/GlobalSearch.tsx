import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, X, TrendingUp, Clock, ChevronRight } from 'lucide-react';
import { SearchResult } from '../types';
import { searchLocal, POPULAR } from '../data/stockDatabase';
import { searchYahoo } from '../lib/yahooFinance';

interface Props {
  onNavigate: (symbol: string, name: string) => void;
}

const RECENT_KEY = 'search_recent';
const MAX_RECENT = 6;

function getRecent(): SearchResult[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); }
  catch { return []; }
}

function saveRecent(result: SearchResult) {
  const prev = getRecent().filter(r => r.symbol !== result.symbol);
  localStorage.setItem(RECENT_KEY, JSON.stringify([result, ...prev].slice(0, MAX_RECENT)));
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    EQUITY:    { label: 'Stock',  cls: 'bg-accent/15 text-accent' },
    ETF:       { label: 'ETF',    cls: 'bg-yellow-500/15 text-yellow-400' },
    INDEX:     { label: 'Index',  cls: 'bg-up/15 text-up' },
    MUTUALFUND:{ label: 'Fund',   cls: 'bg-muted text-muted-foreground' },
    CURRENCY:  { label: 'FX',     cls: 'bg-blue-500/15 text-blue-400' },
    FUTURE:    { label: 'Future', cls: 'bg-orange-500/15 text-orange-400' },
  };
  const m = map[type] ?? { label: type, cls: 'bg-muted text-muted-foreground' };
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${m.cls} uppercase tracking-wide shrink-0`}>
      {m.label}
    </span>
  );
}

function ResultRow({
  result, active, onClick,
}: { result: SearchResult; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors group ${
        active ? 'bg-accent/10' : 'hover:bg-muted'
      }`}
    >
      <div className="w-10 h-8 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-slate-300 leading-none">
          {result.symbol.replace('^', '').slice(0, 4)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-200 truncate leading-tight">{result.name}</p>
        <p className="text-xs text-muted-foreground">{result.exchange}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <TypeBadge type={result.type} />
        <ChevronRight size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="px-4 pt-3 pb-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}

export function GlobalSearch({ onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [localResults, setLocalResults] = useState<SearchResult[]>([]);
  const [apiResults, setApiResults]   = useState<SearchResult[]>([]);
  const [apiLoading, setApiLoading]   = useState(false);
  const [selected, setSelected]       = useState(0);
  const [recent, setRecent]           = useState<SearchResult[]>([]);
  const inputRef  = useRef<HTMLInputElement>(null);
  const apiTimer  = useRef<ReturnType<typeof setTimeout>>();

  const openModal = useCallback(() => {
    setOpen(true);
    setQuery('');
    setLocalResults([]);
    setApiResults([]);
    setSelected(0);
    setRecent(getRecent());
  }, []);

  const closeModal = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        open ? closeModal() : openModal();
      }
      if (e.key === 'Escape' && open) closeModal();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, openModal, closeModal]);

  // Focus input when modal opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Search on query change
  useEffect(() => {
    if (!query.trim()) {
      setLocalResults([]);
      setApiResults([]);
      setApiLoading(false);
      clearTimeout(apiTimer.current);
      return;
    }
    setLocalResults(searchLocal(query));
    setSelected(0);
    clearTimeout(apiTimer.current);
    setApiLoading(true);
    apiTimer.current = setTimeout(async () => {
      const res = await searchYahoo(query);
      setApiResults(res);
      setApiLoading(false);
    }, 280);
    return () => clearTimeout(apiTimer.current);
  }, [query]);

  const merged = useMemo<SearchResult[]>(() => {
    const localSymbols = new Set(localResults.map(r => r.symbol));
    return [...localResults, ...apiResults.filter(r => !localSymbols.has(r.symbol))].slice(0, 12);
  }, [localResults, apiResults]);

  const displayList: SearchResult[] = query.trim() ? merged : [];
  const showRecent   = !query.trim() && recent.length > 0;
  const showPopular  = !query.trim();
  const totalItems   = displayList.length || (showRecent ? recent.length : 0) + (showPopular ? POPULAR.length : 0);

  function navigate(result: SearchResult) {
    saveRecent(result);
    setRecent(getRecent());
    closeModal();
    onNavigate(result.symbol, result.name);
  }

  // Keyboard navigation through results
  useEffect(() => {
    if (!open) return;
    const listLen = displayList.length || (showRecent ? recent.length : 0) + (showPopular ? POPULAR.length : 0);
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, listLen - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter') {
        e.preventDefault();
        const list = displayList.length ? displayList : [...(showRecent ? recent : []), ...(showPopular ? POPULAR : [])];
        if (list[selected]) navigate(list[selected]);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, selected, displayList, recent, showRecent, showPopular]);

  if (!open) {
    return (
      <button
        onClick={openModal}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border text-sm text-muted-foreground hover:text-slate-300 hover:border-border transition-colors min-w-[180px] md:min-w-[240px]"
      >
        <Search size={14} />
        <span className="flex-1 text-left">Search stocks…</span>
        <kbd className="hidden md:flex items-center gap-0.5 text-[10px] bg-background border border-border px-1.5 py-0.5 rounded font-mono text-muted-foreground">
          ⌘K
        </kbd>
      </button>
    );
  }

  let rowIndex = -1;
  const nextRow = () => { rowIndex++; return rowIndex; };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search size={18} className="text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search stocks, tickers, companies…"
            className="flex-1 bg-transparent text-slate-100 placeholder:text-muted-foreground text-base outline-none"
          />
          {apiLoading && (
            <div className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin shrink-0" />
          )}
          <button onClick={closeModal} className="shrink-0 p-1 hover:bg-muted rounded-lg transition-colors">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[420px] overflow-y-auto">
          {/* Search results */}
          {query.trim() && (
            <>
              {merged.length === 0 && !apiLoading ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No results for "{query}"
                </div>
              ) : (
                <>
                  <SectionLabel label="Results" />
                  {merged.map(r => {
                    const idx = nextRow();
                    return (
                      <ResultRow key={r.symbol} result={r} active={selected === idx} onClick={() => navigate(r)} />
                    );
                  })}
                </>
              )}
            </>
          )}

          {/* Recent + Popular (empty state) */}
          {!query.trim() && (
            <>
              {showRecent && (
                <>
                  <SectionLabel label="Recent" />
                  {recent.map(r => {
                    const idx = nextRow();
                    return (
                      <ResultRow key={r.symbol} result={r} active={selected === idx} onClick={() => navigate(r)} />
                    );
                  })}
                </>
              )}
              {showPopular && (
                <>
                  <SectionLabel label="Popular" />
                  {POPULAR.map(r => {
                    const idx = nextRow();
                    return (
                      <ResultRow key={r.symbol} result={r} active={selected === idx} onClick={() => navigate(r)} />
                    );
                  })}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border bg-background/50 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><kbd className="bg-muted px-1 rounded font-mono">↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="bg-muted px-1 rounded font-mono">↵</kbd> select</span>
          <span className="flex items-center gap-1"><kbd className="bg-muted px-1 rounded font-mono">Esc</kbd> close</span>
          <span className="ml-auto">Powered by Yahoo Finance</span>
        </div>
      </div>
    </div>
  );
}
