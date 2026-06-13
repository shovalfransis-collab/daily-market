import { EconomicEvent } from '../types';

interface Props {
  events: EconomicEvent[];
  loading: boolean;
}

const EVENT_CONTEXT: { keywords: string[]; why: string; icon: string }[] = [
  {
    keywords: ['fed', 'fomc', 'interest rate', 'federal funds'],
    why: 'When the Fed moves rates, every stock, bond, and mortgage in America moves with it. This single number controls the cost of all money.',
    icon: '🏛️',
  },
  {
    keywords: ['cpi', 'consumer price', 'inflation'],
    why: 'Inflation data directly controls what the Fed does next. A hot print = rate hikes stay. A cool print = cuts coming. Markets reprice everything instantly.',
    icon: '🔥',
  },
  {
    keywords: ['ppi', 'producer price'],
    why: 'PPI is inflation before it hits your wallet. What businesses pay today, consumers pay tomorrow — it\'s the leading edge of CPI.',
    icon: '🏭',
  },
  {
    keywords: ['jobs', 'nonfarm', 'payroll', 'employment', 'unemployment'],
    why: 'Jobs = consumer spending = corporate earnings. A strong jobs report can flip a market rally to selloff overnight if it means rates stay high.',
    icon: '👷',
  },
  {
    keywords: ['gdp', 'gross domestic'],
    why: 'GDP is the scoreboard for the whole economy. Two negative quarters = recession call. Markets are always pricing what this number means for earnings.',
    icon: '📊',
  },
  {
    keywords: ['pce', 'personal consumption'],
    why: 'PCE is the Fed\'s preferred inflation gauge — they actually use this, not CPI. When PCE moves, the Fed\'s next move becomes much clearer.',
    icon: '🎯',
  },
  {
    keywords: ['retail sales'],
    why: 'Consumer spending is 70% of the US economy. Retail sales tell you if people are still opening their wallets — or closing them.',
    icon: '🛍️',
  },
  {
    keywords: ['housing', 'home sales', 'building permit'],
    why: 'Housing is rate-sensitive and a leading indicator. When housing slows, construction, appliances, and furniture follow — it ripples wide.',
    icon: '🏠',
  },
  {
    keywords: ['ism', 'pmi', 'manufacturing', 'services'],
    why: 'PMI is a real-time pulse of whether businesses are expanding or contracting. Above 50 = growth. Below 50 = contraction. Simple and powerful.',
    icon: '⚙️',
  },
  {
    keywords: ['earnings', 'eps', 'revenue'],
    why: 'Earnings are why stocks exist. Miss badly enough and a stock drops 20% overnight. Beat big enough and you get a gap-up that changes portfolios.',
    icon: '💰',
  },
];

function getEventContext(name: string): { why: string; icon: string } {
  const lower = name.toLowerCase();
  for (const entry of EVENT_CONTEXT) {
    if (entry.keywords.some(k => lower.includes(k))) {
      return { why: entry.why, icon: entry.icon };
    }
  }
  return { why: 'Economic data releases create immediate price reactions as traders reprice assets based on the new information.', icon: '📅' };
}

function formatEventDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function ImpactDot({ impact }: { impact: EconomicEvent['impact'] }) {
  const cls = impact === 'high'
    ? 'bg-down'
    : impact === 'medium'
    ? 'bg-amber-400'
    : 'bg-slate-500';
  return <span className={`inline-block w-2 h-2 rounded-full ${cls}`} />;
}

export function EconomicCalendarPanel({ events, loading }: Props) {
  if (loading) {
    return (
      <section>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
          Today's Big Story
        </h3>
        <div className="rounded-xl border border-border bg-card p-6 animate-pulse">
          <div className="h-5 bg-muted rounded w-1/3 mb-3" />
          <div className="h-8 bg-muted rounded w-2/3 mb-4" />
          <div className="h-3 bg-muted rounded w-full mb-2" />
          <div className="h-3 bg-muted rounded w-4/5" />
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return (
      <section>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
          Today's Big Story
        </h3>
        <div className="rounded-xl border border-border bg-card px-4 py-6 text-center">
          <p className="text-2xl mb-2">😴</p>
          <p className="text-sm font-medium text-slate-200">Quiet Day Ahead</p>
          <p className="text-xs text-muted-foreground mt-1">No major economic events scheduled. Markets move on technicals and sentiment today.</p>
        </div>
      </section>
    );
  }

  const sorted = [...events].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.impact] - order[b.impact];
  });

  const hero = sorted[0];
  const rest = sorted.slice(1);
  const { why, icon } = getEventContext(hero.event);

  const impactLabel = hero.impact === 'high' ? 'Market Mover' : hero.impact === 'medium' ? 'Watch This' : 'On the Radar';
  const impactCls = hero.impact === 'high'
    ? 'text-down bg-down/10 border-down/30'
    : hero.impact === 'medium'
    ? 'text-amber-400 bg-amber-400/10 border-amber-400/30'
    : 'text-slate-400 bg-slate-400/10 border-slate-400/30';

  return (
    <section>
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
        Today's Big Story
      </h3>

      {/* Hero card */}
      <div className="rounded-xl border border-border bg-card overflow-hidden mb-3">
        <div className="p-5">
          <div className="flex items-start gap-4">
            <span className="text-4xl leading-none mt-0.5 shrink-0">{icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded border ${impactCls}`}>
                  {impactLabel}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatEventDate(hero.date)}{hero.time ? ` · ${hero.time}` : ''}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-slate-100 leading-tight mb-3">{hero.event}</h2>
              <p className="text-sm text-slate-400 leading-relaxed">{why}</p>
            </div>
          </div>

          {/* Numbers */}
          {(hero.estimate || hero.actual || hero.prior) && (
            <div className="flex gap-6 mt-4 pt-4 border-t border-border">
              {hero.actual && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Actual</p>
                  <p className="text-base font-bold text-slate-100 tabular-nums">{hero.actual}</p>
                </div>
              )}
              {hero.estimate && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Estimate</p>
                  <p className="text-base font-semibold text-slate-300 tabular-nums">{hero.estimate}</p>
                </div>
              )}
              {hero.prior && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Prior</p>
                  <p className="text-base font-semibold text-slate-400 tabular-nums">{hero.prior}</p>
                </div>
              )}
              {!hero.actual && hero.estimate && (
                <div className="ml-auto flex items-center">
                  <span className="text-xs text-muted-foreground italic">Awaiting release…</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rest of the events — compact pills */}
      {rest.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {rest.map((e, i) => (
            <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs text-slate-300">
              <ImpactDot impact={e.impact} />
              <span className="font-medium">{e.event}</span>
              {e.time && <span className="text-muted-foreground">{e.time}</span>}
              {e.actual && <span className="text-slate-100 font-semibold ml-1">{e.actual}</span>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
