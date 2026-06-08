import { EarningsReport } from '../types';

interface Props {
  earnings: EarningsReport[];
  loading: boolean;
}

function formatEps(n?: number): string {
  if (n === undefined || n === null) return '—';
  return n.toFixed(2);
}

function formatRev(n?: number): string {
  if (n === undefined || n === null) return '—';
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

function SurpriseBadge({ pct }: { pct?: number }) {
  if (pct === undefined || pct === null) return <span className="text-muted-foreground text-xs">—</span>;
  const beat = pct >= 0;
  const label = Math.abs(pct) < 1 ? 'IN LINE' : beat ? 'BEAT' : 'MISS';
  const cls = beat
    ? 'text-up bg-up/10 border-up/20'
    : 'text-down bg-down/10 border-down/20';
  if (Math.abs(pct) < 1) {
    return <span className="text-xs text-neutral bg-neutral/10 border border-neutral/20 px-2 py-0.5 rounded-full">IN LINE</span>;
  }
  return (
    <span className={`text-xs font-medium border px-2 py-0.5 rounded-full ${cls}`}>
      {label} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

export function EarningsTable({ earnings, loading }: Props) {
  return (
    <section>
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
        Earnings Today
      </h3>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-4 flex flex-col gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4">
                <div className="h-3 bg-muted rounded w-16" />
                <div className="h-3 bg-muted rounded w-32" />
                <div className="h-3 bg-muted rounded w-12" />
                <div className="h-3 bg-muted rounded w-12" />
                <div className="h-3 bg-muted rounded w-20" />
              </div>
            ))}
          </div>
        ) : earnings.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground text-sm">No earnings reports available for today.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Symbol</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Company</th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">EPS Act.</th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">EPS Est.</th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Rev Act.</th>
                  <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Result</th>
                  <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {earnings.map((e, idx) => (
                  <tr key={e.symbol + idx} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-100">{e.symbol}</td>
                    <td className="px-4 py-3 text-slate-400 max-w-[180px] truncate">{e.name}</td>
                    <td className="px-4 py-3 text-right text-slate-300">{formatEps(e.epsActual)}</td>
                    <td className="px-4 py-3 text-right text-slate-400">{formatEps(e.epsEstimate)}</td>
                    <td className="px-4 py-3 text-right text-slate-300">{formatRev(e.revActual)}</td>
                    <td className="px-4 py-3 text-center">
                      <SurpriseBadge pct={e.surprisePercent} />
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                      {e.reportTime === 'AMC' ? 'After Close' : e.reportTime === 'BMO' ? 'Pre-Market' : e.reportTime ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
