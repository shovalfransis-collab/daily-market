import { EconomicEvent } from '../types';

interface Props {
  events: EconomicEvent[];
  loading: boolean;
}

function ImpactBadge({ impact }: { impact: EconomicEvent['impact'] }) {
  const cls = impact === 'high'
    ? 'bg-down/20 text-down border-down/30'
    : impact === 'medium'
    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    : 'bg-muted text-muted-foreground border-border';
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border uppercase tracking-wide ${cls}`}>
      {impact}
    </span>
  );
}

function formatEventDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function EconomicCalendarPanel({ events, loading }: Props) {
  return (
    <section>
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
        Economic Calendar
      </h3>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="divide-y divide-border">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-3 animate-pulse">
                <div className="h-3 bg-muted rounded w-16" />
                <div className="h-3 bg-muted rounded flex-1" />
                <div className="h-5 bg-muted rounded w-14" />
                <div className="h-3 bg-muted rounded w-12" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="px-4 py-6 text-xs text-muted-foreground text-center">No economic events available</p>
        ) : (
          <div className="divide-y divide-border">
            <div className="grid grid-cols-[80px_1fr_70px_80px_80px] gap-2 px-4 py-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              <span>Date</span>
              <span>Event</span>
              <span>Impact</span>
              <span className="text-right">Estimate</span>
              <span className="text-right">Actual</span>
            </div>
            {events.map((e, i) => (
              <div key={i} className="grid grid-cols-[80px_1fr_70px_80px_80px] gap-2 px-4 py-2.5 items-center hover:bg-muted/30 transition-colors">
                <span className="text-xs text-muted-foreground">{formatEventDate(e.date)}{e.time ? ` ${e.time}` : ''}</span>
                <span className="text-xs text-slate-200 truncate">{e.event}</span>
                <span><ImpactBadge impact={e.impact} /></span>
                <span className="text-xs text-muted-foreground text-right tabular-nums">{e.estimate ?? '—'}</span>
                <span className={`text-xs text-right tabular-nums font-medium ${e.actual ? 'text-slate-100' : 'text-muted-foreground'}`}>
                  {e.actual ?? '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
