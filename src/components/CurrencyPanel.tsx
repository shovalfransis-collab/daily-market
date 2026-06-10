import { CurrencyRate } from '../types';
import { formatPercent } from '../lib/utils';

interface Props {
  currencies: CurrencyRate[];
  loading: boolean;
  lastUpdated: string | null;
}

function colorClass(pct: number) {
  if (pct > 0) return 'text-up';
  if (pct < 0) return 'text-down';
  return 'text-muted-foreground';
}

function formatRate(rate: number, pair: string): string {
  if (pair.includes('JPY') || pair.includes('CNY')) {
    return rate.toFixed(2);
  }
  return rate.toFixed(4);
}

function CurrencyCard({ c }: { c: CurrencyRate }) {
  const positive = c.changePercent >= 0;
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between gap-3 hover:opacity-90 transition-opacity">
      <div className="flex items-center gap-2.5">
        <span className="text-xl leading-none">{c.flag}</span>
        <div>
          <p className="text-sm font-semibold text-slate-200">{c.pair}</p>
          <p className={`text-xs font-medium mt-0.5 ${colorClass(c.changePercent)}`}>
            {positive ? '+' : ''}{formatPercent(c.changePercent)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-base font-semibold text-slate-100 tabular-nums">
          {formatRate(c.rate, c.pair)}
        </p>
        <p className={`text-xs mt-0.5 tabular-nums ${colorClass(c.changePercent)}`}>
          {positive ? '+' : ''}{c.change.toFixed(4)}
        </p>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 animate-pulse flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 bg-muted rounded" />
        <div>
          <div className="h-3.5 bg-muted rounded w-16 mb-1.5" />
          <div className="h-3 bg-muted rounded w-10" />
        </div>
      </div>
      <div className="text-right">
        <div className="h-4 bg-muted rounded w-20 mb-1.5" />
        <div className="h-3 bg-muted rounded w-14" />
      </div>
    </div>
  );
}

export function CurrencyPanel({ currencies, loading, lastUpdated }: Props) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
          Forex & Currencies
        </h3>
        {lastUpdated && (
          <span className="text-xs text-muted-foreground">
            Updated {new Date(lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {loading
          ? [...Array(8)].map((_, i) => <SkeletonCard key={i} />)
          : currencies.map(c => <CurrencyCard key={c.symbol} c={c} />)}
      </div>
    </section>
  );
}
