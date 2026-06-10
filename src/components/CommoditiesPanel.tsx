import { Gem, Droplets, Flame, Zap, Factory, Wheat, TreePine, Battery } from 'lucide-react';
import { StockQuote } from '../types';
import { formatPrice, formatPercent, colorClass } from '../lib/utils';

interface Props {
  commodities: StockQuote[];
  loading: boolean;
  onSymbolClick?: (symbol: string, name: string) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  GLD: Gem,
  SLV: Gem,
  USO: Droplets,
  UNG: Flame,
  COPX: Zap,
  XME: Factory,
  WEAT: Wheat,
  CORN: Wheat,
  SOYB: Wheat,
  WOOD: TreePine,
  LIT: Battery,
};

function CommodityCard({ quote, onClick }: { quote: StockQuote; onClick?: () => void }) {
  const positive = quote.changePercent >= 0;
  const Icon = ICON_MAP[quote.symbol] ?? Gem;

  return (
    <div
      className={`rounded-xl border p-4 flex-shrink-0 w-40 ${positive ? 'border-up/20 bg-up/5' : 'border-down/20 bg-down/5'} ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-1.5 rounded-lg ${positive ? 'bg-up/10' : 'bg-down/10'}`}>
          <Icon size={14} className={positive ? 'text-up' : 'text-down'} />
        </div>
        <span className="text-xs text-muted-foreground font-medium">{quote.symbol}</span>
      </div>
      <p className="text-xs text-slate-400 mb-2 leading-tight">{quote.name}</p>
      <p className="text-lg font-medium text-slate-100">{formatPrice(quote.price)}</p>
      <p className={`text-xs mt-0.5 font-medium ${colorClass(quote.changePercent)}`}>
        {formatPercent(quote.changePercent)}
      </p>
    </div>
  );
}

export function CommoditiesPanel({ commodities, loading, onSymbolClick }: Props) {
  return (
    <section>
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
        Natural Resources & Commodities
      </h3>
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
          {loading
            ? [...Array(11)].map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-4 w-40 flex-shrink-0 animate-pulse">
                  <div className="h-8 w-8 bg-muted rounded-lg mb-3" />
                  <div className="h-3 bg-muted rounded w-20 mb-2" />
                  <div className="h-5 bg-muted rounded w-16 mb-1" />
                  <div className="h-3 bg-muted rounded w-12" />
                </div>
              ))
            : commodities.map(c => (
                <CommodityCard
                  key={c.symbol} quote={c}
                  onClick={onSymbolClick ? () => onSymbolClick(c.symbol, c.name) : undefined}
                />
              ))}
        </div>
      </div>
    </section>
  );
}
