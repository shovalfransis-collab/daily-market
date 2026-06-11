import { FearGreedScore } from '../types';

interface Props {
  data: FearGreedScore | null;
  loading: boolean;
}

function scoreColor(score: number): string {
  if (score >= 75) return '#22c55e';
  if (score >= 55) return '#86efac';
  if (score >= 45) return '#f59e0b';
  if (score >= 25) return '#f97316';
  return '#ef4444';
}

function labelColor(label: FearGreedScore['label']): string {
  if (label === 'Extreme Greed') return 'text-up';
  if (label === 'Greed') return 'text-green-400';
  if (label === 'Neutral') return 'text-amber-400';
  if (label === 'Fear') return 'text-orange-400';
  return 'text-down';
}

export function FearGreedMeter({ data, loading }: Props) {
  if (loading || !data) {
    return (
      <div className="rounded-xl border border-border bg-card px-5 py-4 flex items-center gap-6 animate-pulse">
        <div className="h-10 w-10 rounded-full bg-muted" />
        <div>
          <div className="h-3 bg-muted rounded w-24 mb-2" />
          <div className="h-4 bg-muted rounded w-32" />
        </div>
        <div className="ml-auto h-2 bg-muted rounded-full w-48" />
      </div>
    );
  }

  const pct = data.score;
  const color = scoreColor(pct);

  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4 flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-3 shrink-0">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
          style={{ background: `conic-gradient(${color} ${pct}%, #1e293b ${pct}%)` }}
        >
          <span className="text-sm font-bold text-white">{pct}</span>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Fear &amp; Greed</p>
          <p className={`text-base font-semibold ${labelColor(data.label)}`}>{data.label}</p>
        </div>
      </div>

      <div className="flex-1 min-w-48">
        <div className="relative h-3 rounded-full overflow-visible" style={{ background: 'linear-gradient(to right, #ef4444, #f97316, #f59e0b, #86efac, #22c55e)' }}>
          <div
            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-[3px] border-white shadow-[0_0_10px_rgba(255,255,255,0.6),0_0_20px_var(--indicator-glow)]"
            style={{
              left: `calc(${pct}% - 10px)`,
              background: color,
              '--indicator-glow': color,
              boxShadow: `0 0 8px 2px ${color}, 0 0 0 3px white`,
            } as React.CSSProperties}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">Extreme Fear</span>
          <span className="text-[10px] text-muted-foreground">Extreme Greed</span>
        </div>
      </div>

      <div className="ml-auto shrink-0 text-right">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Last updated</p>
        <p className="text-[11px] text-muted-foreground font-mono">
          {new Date(data.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
