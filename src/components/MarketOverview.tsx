import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { StockQuote } from '../types';
import { formatPrice, formatPercent, formatChange, colorClass } from '../lib/utils';

const DISPLAY_INDICES = ['^GSPC', '^IXIC', '^DJI', '^RUT'];
const GAUGE_INDICES = ['^VIX', '^TNX'];

interface Props {
  indices: StockQuote[];
  loading: boolean;
  onSymbolClick?: (symbol: string, name: string) => void;
}

function Sparkline({ data, positive }: { data: { date: string; close: number }[]; positive: boolean }) {
  if (!data || data.length < 2) return <div className="h-12 w-full" />;
  const color = positive ? '#22c55e' : '#ef4444';
  return (
    <ResponsiveContainer width="100%" height={48}>
      <LineChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <Line
          type="monotone"
          dataKey="close"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
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

function IndexCard({ quote, onClick }: { quote: StockQuote; onClick?: () => void }) {
  const positive = quote.changePercent >= 0;
  const tintClass = positive ? 'bg-up/5 border-up/15' : 'bg-down/5 border-down/15';

  return (
    <div
      className={`rounded-xl border ${tintClass} p-4 flex flex-col gap-2 ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{quote.symbol.replace('^', '')}</p>
          <p className="text-sm text-slate-400 mt-0.5 truncate">{quote.name}</p>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${positive ? 'text-up bg-up/10' : 'text-down bg-down/10'}`}>
          {formatPercent(quote.changePercent)}
        </span>
      </div>
      <div>
        <p className="text-xl font-medium text-slate-100">{formatPrice(quote.price)}</p>
        <p className={`text-xs mt-0.5 ${colorClass(quote.changePercent)}`}>
          {formatChange(quote.change)}
        </p>
      </div>
      <Sparkline data={quote.history ?? []} positive={positive} />
    </div>
  );
}

function GaugeCard({ quote, onClick }: { quote: StockQuote; onClick?: () => void }) {
  const isVix = quote.symbol === '^VIX';
  const vixLevel = isVix
    ? quote.price > 30 ? 'HIGH FEAR' : quote.price > 20 ? 'CAUTION' : 'LOW'
    : null;
  const vixColor = isVix
    ? quote.price > 30 ? 'text-down' : quote.price > 20 ? 'text-yellow-400' : 'text-up'
    : colorClass(quote.changePercent);

  return (
    <div
      className={`rounded-xl border border-border bg-card p-4 ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      onClick={onClick}
    >
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
        {quote.symbol.replace('^', '')}
      </p>
      <p className="text-sm text-slate-400 mt-0.5">{quote.name}</p>
      <p className={`text-2xl font-medium mt-2 ${vixColor}`}>{formatPrice(quote.price)}</p>
      {vixLevel && (
        <p className={`text-xs font-medium mt-1 ${vixColor}`}>{vixLevel}</p>
      )}
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
  const mainIndices = indices.filter(i => DISPLAY_INDICES.includes(i.symbol));
  const gaugeIndices = indices.filter(i => GAUGE_INDICES.includes(i.symbol));

  return (
    <section>
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
        Major Indices
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-3">
        {loading
          ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
          : mainIndices.map(q => (
              <IndexCard
                key={q.symbol} quote={q}
                onClick={onSymbolClick ? () => onSymbolClick(q.symbol, q.name) : undefined}
              />
            ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {loading
          ? [...Array(2)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4 animate-pulse">
                <div className="h-3 bg-muted rounded w-12 mb-2" />
                <div className="h-3 bg-muted rounded w-20 mb-3" />
                <div className="h-7 bg-muted rounded w-20" />
              </div>
            ))
          : gaugeIndices.map(q => (
              <GaugeCard
                key={q.symbol} quote={q}
                onClick={onSymbolClick ? () => onSymbolClick(q.symbol, q.name) : undefined}
              />
            ))}
      </div>
    </section>
  );
}
