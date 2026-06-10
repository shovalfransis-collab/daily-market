import { useState } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { StockQuote } from '../types';
import { formatPrice, formatPercent } from '../lib/utils';

interface Props {
  gainers: StockQuote[];
  losers: StockQuote[];
  preMovers: StockQuote[];
  postMovers: StockQuote[];
  loading: boolean;
  onSymbolClick?: (symbol: string, name: string) => void;
}

function MoverRow({ quote, maxPct, usePrePost, isPost, onClick }: {
  quote: StockQuote; maxPct: number; usePrePost?: boolean; isPost?: boolean; onClick?: () => void;
}) {
  const pct = usePrePost
    ? (isPost ? (quote.postMarketChangePercent ?? quote.changePercent) : (quote.preMarketChangePercent ?? quote.changePercent))
    : quote.changePercent;
  const price = usePrePost
    ? (isPost ? (quote.postMarketPrice ?? quote.price) : (quote.preMarketPrice ?? quote.price))
    : quote.price;
  const positive = pct >= 0;
  const barWidth = Math.min(100, (Math.abs(pct) / Math.max(maxPct, 1)) * 100);

  return (
    <div
      className={`flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0 ${onClick ? 'cursor-pointer hover:bg-muted/40 rounded px-1 -mx-1 transition-colors' : ''}`}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-sm font-medium text-slate-100">{quote.symbol}</span>
          <span className={`text-sm font-medium ${positive ? 'text-up' : 'text-down'}`}>
            {formatPercent(pct)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground truncate">{quote.name}</p>
          <span className="text-xs text-slate-400 shrink-0">{formatPrice(price)}</span>
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

type TabId = 'regular' | 'prepost';

function Column({
  title, quotes, icon: Icon, colorClass, loading, usePrePost, isPost, onSymbolClick,
}: {
  title: string; quotes: StockQuote[]; icon: typeof TrendingUp; colorClass: string;
  loading: boolean; usePrePost?: boolean; isPost?: boolean;
  onSymbolClick?: (symbol: string, name: string) => void;
}) {
  const maxPct = Math.max(...quotes.map(q => {
    const pct = usePrePost
      ? (isPost ? Math.abs(q.postMarketChangePercent ?? 0) : Math.abs(q.preMarketChangePercent ?? 0))
      : Math.abs(q.changePercent);
    return pct;
  }), 1);

  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} className={colorClass} />
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
              usePrePost={usePrePost} isPost={isPost}
              onClick={onSymbolClick ? () => onSymbolClick(q.symbol, q.name) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TopMovers({ gainers, losers, preMovers, postMovers, loading, onSymbolClick }: Props) {
  const [tab, setTab] = useState<TabId>('regular');

  return (
    <section>
      <div className="flex items-center gap-4 mb-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Top Movers</h3>
        <div className="flex gap-1 ml-auto">
          <button
            onClick={() => setTab('regular')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${tab === 'regular' ? 'bg-muted text-slate-200 border border-border' : 'text-muted-foreground hover:text-slate-300'}`}
          >
            Regular
          </button>
          <button
            onClick={() => setTab('prepost')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${tab === 'prepost' ? 'bg-muted text-slate-200 border border-border' : 'text-muted-foreground hover:text-slate-300'}`}
          >
            Pre / Post
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tab === 'regular' ? (
          <>
            <Column title="Top Gainers" quotes={gainers} icon={TrendingUp} colorClass="text-up" loading={loading} onSymbolClick={onSymbolClick} />
            <Column title="Top Losers" quotes={losers} icon={TrendingDown} colorClass="text-down" loading={loading} onSymbolClick={onSymbolClick} />
          </>
        ) : (
          <>
            <Column title="Pre-Market" quotes={preMovers} icon={Activity} colorClass="text-amber-400" loading={loading} usePrePost isPost={false} onSymbolClick={onSymbolClick} />
            <Column title="Post-Market" quotes={postMovers} icon={Activity} colorClass="text-amber-400" loading={loading} usePrePost isPost onSymbolClick={onSymbolClick} />
          </>
        )}
      </div>
    </section>
  );
}
