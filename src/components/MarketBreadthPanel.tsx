import { MarketBreadth } from '../types';

interface Props {
  breadth: MarketBreadth | null;
  loading: boolean;
}

export function MarketBreadthPanel({ breadth, loading }: Props) {
  if (loading || !breadth) {
    return (
      <div className="rounded-xl border border-border bg-card px-5 py-4 animate-pulse">
        <div className="h-3 bg-muted rounded w-32 mb-4" />
        <div className="h-2 bg-muted rounded-full mb-3" />
        <div className="flex gap-2 flex-wrap">
          {[...Array(11)].map((_, i) => <div key={i} className="w-5 h-5 rounded-full bg-muted" />)}
        </div>
      </div>
    );
  }

  const total = breadth.advancers + breadth.decliners;
  const advPct = total > 0 ? (breadth.advancers / total) * 100 : 50;
  const sectorTotal = breadth.sectorsUp + breadth.sectorsDown;

  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
        Market Breadth
      </h3>

      <div className="flex flex-wrap gap-6">
        {/* A/D line */}
        <div className="flex-1 min-w-48">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-up font-medium">{breadth.advancers > 0 ? `${breadth.advancers} adv` : '— adv'}</span>
            <span className="text-muted-foreground text-[10px]">Advancers / Decliners</span>
            <span className="text-down font-medium">{breadth.decliners > 0 ? `${breadth.decliners} dec` : '— dec'}</span>
          </div>
          <div className="h-2 rounded-full bg-down/40 overflow-hidden">
            <div className="h-full rounded-full bg-up transition-all" style={{ width: `${advPct}%` }} />
          </div>
          {total > 0 && (
            <p className="text-[10px] text-muted-foreground mt-1 text-center">
              {advPct.toFixed(0)}% advancing
            </p>
          )}
        </div>

        {/* Sector dots */}
        <div>
          <p className="text-[10px] text-muted-foreground mb-2">Sectors ({breadth.sectorsUp}/{sectorTotal} up)</p>
          <div className="flex gap-1.5 flex-wrap max-w-[160px]">
            {[...Array(breadth.sectorsUp)].map((_, i) => (
              <div key={`u${i}`} className="w-4 h-4 rounded-full bg-up/80" />
            ))}
            {[...Array(breadth.sectorsDown)].map((_, i) => (
              <div key={`d${i}`} className="w-4 h-4 rounded-full bg-down/80" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
