import { useState, useMemo, memo } from 'react';
import { TrendingUp, TrendingDown, Activity, Bell } from 'lucide-react';
import { StockQuote } from '../types';
import { formatPrice, formatPercent, isMarketOpen } from '../lib/utils';

function getNextOpenMsg(): string {
  const et = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = et.getDay();
  const mins = et.getHours() * 60 + et.getMinutes();
  const openMins = 9 * 60 + 30;

  if (day === 6) return 'Reopens Monday at 9:30 AM ET';
  if (day === 0) return 'Reopens Monday at 9:30 AM ET';
  if (day === 5 && mins >= 16 * 60) return 'Reopens Monday at 9:30 AM ET';
  if (mins < openMins) return 'Opens today at 9:30 AM ET';
  return 'Reopens tomorrow at 9:30 AM ET';
}

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
type CapFilter = 'all' | 'large' | 'mid' | 'small';

const CAP_LABELS: { id: CapFilter; label: string; desc: string }[] = [
  { id: 'all',   label: 'All',   desc: '' },
  { id: 'large', label: 'Large', desc: '>$10B' },
  { id: 'mid',   label: 'Mid',   desc: '$2-10B' },
  { id: 'small', label: 'Small', desc: '<$2B' },
];

function filterByCap(quotes: StockQuote[], cap: CapFilter): StockQuote[] {
  if (cap === 'all') return quotes;
  return quotes.filter(q => {
    const mc = q.marketCap ?? 0;
    if (cap === 'large') return mc >= 10e9;
    if (cap === 'mid')   return mc >= 2e9 && mc < 10e9;
    if (cap === 'small') return mc > 0 && mc < 2e9;
    return true;
  });
}

function Column({
  title, quotes, icon: Icon, colorClass, loading, usePrePost, isPost, onSymbolClick,
}: {
  title: string; quotes: StockQuote[]; icon: typeof TrendingUp; colorClass: string;
  loading: boolean; usePrePost?: boolean; isPost?: boolean;
  onSymbolClick?: (symbol: string, name: string) => void;
}) {
  const maxPct = useMemo(() => Math.max(...quotes.map(q => {
    const pct = usePrePost
      ? (isPost ? Math.abs(q.postMarketChangePercent ?? 0) : Math.abs(q.preMarketChangePercent ?? 0))
      : Math.abs(q.changePercent);
    return pct;
  }), 1), [quotes, usePrePost, isPost]);

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
  const [capFilter, setCapFilter] = useState<CapFilter>('all');
  const marketClosed = !isMarketOpen();
  const noData = !loading && gainers.length === 0 && losers.length === 0;

  const filteredGainers = useMemo(() => filterByCap(gainers, capFilter), [gainers, capFilter]);
  const filteredLosers  = useMemo(() => filterByCap(losers,  capFilter), [losers,  capFilter]);

  return (
    <section>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Top Movers</h3>
        {(!marketClosed || !noData) && (
          <>
            {tab === 'regular' && (
              <div className="flex gap-1">
                {CAP_LABELS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCapFilter(c.id)}
                    title={c.desc}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${capFilter === c.id ? 'bg-muted text-slate-200 border border-border' : 'text-muted-foreground hover:text-slate-300'}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}
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
          </>
        )}
      </div>

      {marketClosed && noData ? (
        <div className="rounded-xl border border-border bg-card px-6 py-10 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center">
            <Bell size={20} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-200">Markets Are Closed</p>
            <p className="text-sm text-muted-foreground mt-1">{getNextOpenMsg()}</p>
          </div>
          <p className="text-xs text-muted-foreground/60 max-w-xs">
            NYSE &amp; NASDAQ · Mon–Fri · 9:30 AM – 4:00 PM ET
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tab === 'regular' ? (
            <>
              <Column title="Top Gainers" quotes={filteredGainers} icon={TrendingUp} colorClass="text-up" loading={loading} onSymbolClick={onSymbolClick} />
              <Column title="Top Losers" quotes={filteredLosers} icon={TrendingDown} colorClass="text-down" loading={loading} onSymbolClick={onSymbolClick} />
            </>
          ) : (
            <>
              <Column title="Pre-Market" quotes={preMovers} icon={Activity} colorClass="text-amber-400" loading={loading} usePrePost isPost={false} onSymbolClick={onSymbolClick} />
              <Column title="Post-Market" quotes={postMovers} icon={Activity} colorClass="text-amber-400" loading={loading} usePrePost isPost onSymbolClick={onSymbolClick} />
            </>
          )}
        </div>
      )}
    </section>
  );
}
