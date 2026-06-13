import { useState, useEffect, useRef, useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { StockQuote, PricePoint } from '../types';
import { formatPrice, formatPercent, formatChange, formatVolume, colorClass } from '../lib/utils';
import { fetchSymbolHistory } from '../lib/yahooFinance';

const DISPLAY_INDICES = ['^GSPC', '^IXIC', '^DJI', '^RUT'];
const GAUGE_INDICES = ['^VIX', '^TNX', '^IRX'];

type Timeframe = '1W' | '1M' | '3M' | '6M';
const TF_CONFIG: Record<Timeframe, { range: string; interval: string }> = {
  '1W': { range: '5d',  interval: '1d' },
  '1M': { range: '1mo', interval: '1d' },
  '3M': { range: '3mo', interval: '1d' },
  '6M': { range: '6mo', interval: '1d' },
};

interface Props {
  indices: StockQuote[];
  loading: boolean;
  onSymbolClick?: (symbol: string, name: string) => void;
}

function Sparkline({ data, positive }: { data: PricePoint[]; positive: boolean }) {
  if (!data || data.length < 2) return <div className="h-12 w-full" />;
  const color = positive ? '#22c55e' : '#ef4444';
  return (
    <ResponsiveContainer width="100%" height={48}>
      <LineChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <Line type="monotone" dataKey="close" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
        <Tooltip
          contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11 }}
          labelStyle={{ color: 'var(--muted-foreground)' }}
          itemStyle={{ color }}
          formatter={(v: number) => [formatPrice(v), '']}
          labelFormatter={() => ''}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function IndexCard({ quote, history, historyLoading, onClick }: {
  quote: StockQuote; history: PricePoint[]; historyLoading: boolean; onClick?: () => void;
}) {
  const positive = quote.changePercent >= 0;
  const tintClass = positive ? 'bg-up/5 border-up/15' : 'bg-down/5 border-down/15';

  return (
    <div
      className={`rounded-xl border ${tintClass} p-4 flex flex-col gap-2 ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{quote.symbol.replace('^', '')}</p>
          <p className="text-sm text-slate-400 mt-0.5 truncate">{quote.name}</p>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${positive ? 'text-up bg-up/10' : 'text-down bg-down/10'}`}>
          {formatPercent(quote.changePercent)}
        </span>
      </div>
      <div>
        <p className="text-xl font-medium text-slate-100">{formatPrice(quote.price)}</p>
        <div className="flex items-center justify-between mt-0.5">
          <p className={`text-xs ${colorClass(quote.changePercent)}`}>{formatChange(quote.change)}</p>
          {quote.volume > 0 && (
            <p className="text-xs text-muted-foreground">Vol {formatVolume(quote.volume)}</p>
          )}
        </div>
      </div>
      {historyLoading ? (
        <div className="h-12 bg-muted/40 rounded animate-pulse" />
      ) : (
        <Sparkline data={history} positive={positive} />
      )}
    </div>
  );
}

function YieldCurveCard({ tnx, irx, onClick }: {
  tnx: StockQuote; irx: StockQuote | undefined; onClick?: () => void;
}) {
  const spread = irx ? tnx.price - irx.price : null;
  const inverted = spread !== null && spread < 0;
  const spreadColor = inverted ? 'text-down' : 'text-up';
  const spreadLabel = inverted ? 'INVERTED ⚠' : 'NORMAL';

  return (
    <div
      className={`rounded-xl border border-border bg-card p-4 ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      onClick={onClick}
    >
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Yield Curve</p>
      <div className="flex items-end gap-4 mt-2">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">10Y</p>
          <p className="text-xl font-medium text-slate-100">{tnx.price.toFixed(2)}%</p>
          <p className={`text-xs ${colorClass(tnx.changePercent)}`}>{formatChange(tnx.change)} ({formatPercent(tnx.changePercent)})</p>
        </div>
        {irx && (
          <>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">3M</p>
              <p className="text-lg font-medium text-slate-300">{irx.price.toFixed(2)}%</p>
              <p className={`text-xs ${colorClass(irx.changePercent)}`}>{formatChange(irx.change)}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Spread</p>
              <p className={`text-lg font-semibold tabular-nums ${spreadColor}`}>
                {spread! >= 0 ? '+' : ''}{(spread! * 100).toFixed(0)}bps
              </p>
              <p className={`text-[10px] font-medium ${spreadColor}`}>{spreadLabel}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function VixCard({ quote, onClick }: { quote: StockQuote; onClick?: () => void }) {
  const level = quote.price > 30 ? 'HIGH FEAR' : quote.price > 20 ? 'CAUTION' : 'LOW';
  const color = quote.price > 30 ? 'text-down' : quote.price > 20 ? 'text-yellow-400' : 'text-up';

  return (
    <div
      className={`rounded-xl border border-border bg-card p-4 ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      onClick={onClick}
    >
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">VIX</p>
      <p className="text-sm text-slate-400 mt-0.5">VIX Fear Index</p>
      <p className={`text-2xl font-medium mt-2 ${color}`}>{formatPrice(quote.price)}</p>
      <p className={`text-xs font-medium mt-1 ${color}`}>{level}</p>
      <p className={`text-xs mt-1 ${colorClass(quote.changePercent)}`}>
        {formatChange(quote.change)} ({formatPercent(quote.changePercent)})
      </p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 animate-pulse">
      <div className="h-3 bg-muted rounded w-16 mb-2" />
      <div className="h-3 bg-muted rounded w-24 mb-3" />
      <div className="h-7 bg-muted rounded w-28 mb-1" />
      <div className="h-3 bg-muted rounded w-16 mb-3" />
      <div className="h-12 bg-muted rounded" />
    </div>
  );
}

export function MarketOverview({ indices, loading, onSymbolClick }: Props) {
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [historyMap, setHistoryMap] = useState<Record<string, PricePoint[]>>({});
  const [historyLoading, setHistoryLoading] = useState(false);
  const initializedRef = useRef(false);

  const { mainIndices, vix, tnx, irx } = useMemo(() => {
    const map = new Map(indices.map(i => [i.symbol, i]));
    return {
      mainIndices: DISPLAY_INDICES.map(s => map.get(s)).filter(Boolean) as typeof indices,
      vix: map.get('^VIX'),
      tnx: map.get('^TNX'),
      irx: map.get('^IRX'),
    };
  }, [indices]);

  // seed history from props on first load
  useEffect(() => {
    if (indices.length === 0 || initializedRef.current) return;
    initializedRef.current = true;
    const map: Record<string, PricePoint[]> = {};
    for (const q of indices) {
      if (q.history && q.history.length > 0) map[q.symbol] = q.history;
    }
    setHistoryMap(map);
  }, [indices]);

  // re-fetch when timeframe changes (skip default 1M on init since we have it from props)
  const timeframeRef = useRef<Timeframe>('1M');
  useEffect(() => {
    if (timeframe === timeframeRef.current && initializedRef.current) return;
    timeframeRef.current = timeframe;
    if (mainIndices.length === 0) return;
    if (timeframe === '1M' && !initializedRef.current) return; // wait for init

    const { range, interval } = TF_CONFIG[timeframe];
    setHistoryLoading(true);
    Promise.all(
      DISPLAY_INDICES.map(sym =>
        fetchSymbolHistory(sym, range, interval).then(h => ({ sym, h }))
      )
    ).then(results => {
      setHistoryMap(prev => {
        const next = { ...prev };
        for (const { sym, h } of results) if (h.length) next[sym] = h;
        return next;
      });
      setHistoryLoading(false);
    });
  }, [timeframe, mainIndices.length]);

  const TF_LABELS: Timeframe[] = ['1W', '1M', '3M', '6M'];

  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Major Indices</h3>
        <div className="flex gap-1 ml-auto">
          {TF_LABELS.map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${timeframe === tf ? 'bg-muted text-slate-200 border border-border' : 'text-muted-foreground hover:text-slate-300'}`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-3">
        {loading
          ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
          : mainIndices.map(q => (
              <IndexCard
                key={q.symbol}
                quote={q}
                history={historyMap[q.symbol] ?? []}
                historyLoading={historyLoading}
                onClick={onSymbolClick ? () => onSymbolClick(q.symbol, q.name) : undefined}
              />
            ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {loading ? (
          <>
            <div className="rounded-xl border border-border bg-card p-4 animate-pulse">
              <div className="h-3 bg-muted rounded w-12 mb-2" />
              <div className="h-7 bg-muted rounded w-20 mb-1" />
              <div className="h-3 bg-muted rounded w-16" />
            </div>
            <div className="rounded-xl border border-border bg-card p-4 animate-pulse">
              <div className="h-3 bg-muted rounded w-16 mb-2" />
              <div className="h-7 bg-muted rounded w-20 mb-1" />
              <div className="h-3 bg-muted rounded w-24" />
            </div>
          </>
        ) : (
          <>
            {vix && (
              <VixCard
                quote={vix}
                onClick={onSymbolClick ? () => onSymbolClick(vix.symbol, vix.name) : undefined}
              />
            )}
            {tnx && (
              <YieldCurveCard
                tnx={tnx}
                irx={irx}
                onClick={onSymbolClick ? () => onSymbolClick(tnx.symbol, tnx.name) : undefined}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}
