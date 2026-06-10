import { TrendingUp, TrendingDown } from 'lucide-react';
import { StockQuote } from '../types';
import { formatPrice, formatPercent, formatMarketCap } from '../lib/utils';

interface Props {
  gainers: StockQuote[];
  losers: StockQuote[];
  loading: boolean;
  onSymbolClick?: (symbol: string, name: string) => void;
}

function MoverRow({ quote, maxPct, onClick }: { quote: StockQuote; maxPct: number; onClick?: () => void }) {
  const positive = quote.changePercent >= 0;
  const barWidth = Math.min(100, (Math.abs(quote.changePercent) / Math.max(maxPct, 1)) * 100);

  return (
    <div
      className={`flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0 ${onClick ? 'cursor-pointer hover:bg-muted/40 rounded px-1 -mx-1 transition-colors' : ''}`}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-sm font-medium text-slate-100">{quote.symbol}</span>
          <span className={`text-sm font-medium ${positive ? 'text-up' : 'text-down'}`}>
            {formatPercent(quote.changePercent)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground truncate">{quote.name}</p>
          <span className="text-xs text-slate-400 shrink-0">{formatPrice(quote.price)}</span>
        </div>
        <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${positive ? 'bg-up' : 'bg-down'}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function Column({
  title, quotes, icon: Icon, loading, onSymbolClick,
}: {
  title: string; quotes: StockQuote[]; icon: typeof TrendingUp;
  loading: boolean; onSymbolClick?: (symbol: string, name: string) => void;
}) {
  const maxPct = Math.max(...quotes.map(q => Math.abs(q.changePercent)), 1);

  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} className={title.includes('Gainer') ? 'text-up' : 'text-down'} />
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{title}</h3>
      </div>
      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex justify-between mb-1">
                <div className="h-3 bg-muted rounded w-16" />
                <div className="h-3 bg-muted rounded w-12" />
              </div>
              <div className="h-1 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : quotes.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No data available</p>
      ) : (
        <div className="overflow-y-auto max-h-80">
          {quotes.map(q => (
            <MoverRow
              key={q.symbol} quote={q} maxPct={maxPct}
              onClick={onSymbolClick ? () => onSymbolClick(q.symbol, q.name) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TopMovers({ gainers, losers, loading, onSymbolClick }: Props) {
  return (
    <section>
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
        Top Movers
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Column title="Top Gainers" quotes={gainers} icon={TrendingUp} loading={loading} onSymbolClick={onSymbolClick} />
        <Column title="Top Losers" quotes={losers} icon={TrendingDown} loading={loading} onSymbolClick={onSymbolClick} />
      </div>
    </section>
  );
}
