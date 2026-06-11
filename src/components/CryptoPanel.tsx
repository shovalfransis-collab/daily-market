import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { StockQuote } from '../types';
import { formatPrice, formatPercent, colorClass } from '../lib/utils';

interface Props {
  crypto: StockQuote[];
  loading: boolean;
  onSymbolClick?: (symbol: string, name: string) => void;
}

const CRYPTO_ICONS: Record<string, string> = {
  'BTC-USD': '₿',
  'ETH-USD': 'Ξ',
  'SOL-USD': '◎',
  'BNB-USD': 'B',
};

function CryptoCard({ quote, onClick }: { quote: StockQuote; onClick?: () => void }) {
  const positive = quote.changePercent >= 0;
  const icon = CRYPTO_ICONS[quote.symbol] ?? '¤';
  const color = positive ? '#22c55e' : '#ef4444';
  const hasHistory = quote.history && quote.history.length >= 2;

  return (
    <div
      className={`rounded-xl border p-4 flex-shrink-0 w-44 ${positive ? 'border-up/20 bg-up/5' : 'border-down/20 bg-down/5'} ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base font-bold ${positive ? 'bg-up/10 text-up' : 'bg-down/10 text-down'}`}>
          {icon}
        </div>
        <span className="text-xs text-muted-foreground font-medium">{quote.name}</span>
      </div>
      <p className="text-lg font-medium text-slate-100 tabular-nums">{formatPrice(quote.price)}</p>
      <p className={`text-xs mt-0.5 font-medium tabular-nums ${colorClass(quote.changePercent)}`}>
        {formatPercent(quote.changePercent)}
      </p>
      {hasHistory && (
        <div className="mt-2">
          <ResponsiveContainer width="100%" height={40}>
            <LineChart data={quote.history} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
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
        </div>
      )}
    </div>
  );
}

export function CryptoPanel({ crypto, loading, onSymbolClick }: Props) {
  return (
    <section>
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
        Crypto
      </h3>
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
          {loading
            ? [...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-4 w-44 flex-shrink-0 animate-pulse">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-muted rounded-lg" />
                    <div className="h-3 bg-muted rounded w-16" />
                  </div>
                  <div className="h-5 bg-muted rounded w-24 mb-1" />
                  <div className="h-3 bg-muted rounded w-14" />
                </div>
              ))
            : crypto.map(c => (
                <CryptoCard
                  key={c.symbol}
                  quote={c}
                  onClick={onSymbolClick ? () => onSymbolClick(c.symbol, c.name) : undefined}
                />
              ))}
        </div>
      </div>
    </section>
  );
}
