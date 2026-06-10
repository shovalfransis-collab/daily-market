import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Star } from 'lucide-react';
import { StockQuote } from '../types';
import { fetchBatch } from '../lib/yahooFinance';
import { formatPrice, formatPercent, colorClass } from '../lib/utils';

const STORAGE_KEY = 'md_watchlist';
const MAX_SYMBOLS = 15;

interface Props {
  onSymbolClick?: (symbol: string, name: string) => void;
}

function loadSymbols(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveSymbols(syms: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(syms));
  } catch {}
}

export function Watchlist({ onSymbolClick }: Props) {
  const [symbols, setSymbols] = useState<string[]>(loadSymbols);
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [input, setInput] = useState('');
  const [fetching, setFetching] = useState(false);

  const refresh = useCallback(async (syms: string[]) => {
    if (syms.length === 0) { setQuotes([]); return; }
    setFetching(true);
    try {
      const data = await fetchBatch(syms, false);
      setQuotes(data);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => { refresh(symbols); }, [symbols, refresh]);

  const add = () => {
    const sym = input.trim().toUpperCase();
    if (!sym || symbols.includes(sym) || symbols.length >= MAX_SYMBOLS) return;
    const next = [...symbols, sym];
    setSymbols(next);
    saveSymbols(next);
    setInput('');
  };

  const remove = (sym: string) => {
    const next = symbols.filter(s => s !== sym);
    setSymbols(next);
    saveSymbols(next);
    setQuotes(prev => prev.filter(q => q.symbol !== sym));
  };

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Star size={12} className="text-amber-400" />
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Watchlist</h3>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex gap-2 px-4 py-3 border-b border-border">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="Add symbol (e.g. AAPL)"
            maxLength={12}
            className="flex-1 bg-muted rounded-lg px-3 py-1.5 text-sm text-slate-200 placeholder:text-muted-foreground border border-border focus:outline-none focus:border-slate-500"
          />
          <button
            onClick={add}
            disabled={!input.trim() || symbols.length >= MAX_SYMBOLS}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-up/20 border border-up/30 text-up text-sm font-medium hover:bg-up/30 transition-colors disabled:opacity-40"
          >
            <Plus size={14} /> Add
          </button>
        </div>

        {symbols.length === 0 ? (
          <p className="px-4 py-6 text-xs text-muted-foreground text-center">No symbols added yet</p>
        ) : (
          <div className="divide-y divide-border">
            {symbols.map(sym => {
              const q = quotes.find(x => x.symbol === sym);
              return (
                <div key={sym} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors group">
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => q && onSymbolClick?.(sym, q.name)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-100">{sym}</span>
                      {q && <span className="text-xs text-muted-foreground truncate">{q.name}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {fetching && !q ? (
                      <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                    ) : q ? (
                      <>
                        <span className="text-sm font-medium text-slate-100 tabular-nums">{formatPrice(q.price)}</span>
                        <span className={`text-xs ml-2 tabular-nums ${colorClass(q.changePercent)}`}>{formatPercent(q.changePercent)}</span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                  <button
                    onClick={() => remove(sym)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-down"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
