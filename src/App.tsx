import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { fetchNewsletter } from './lib/api';
import { fetchBatch } from './lib/yahooFinance';
import { isMarketOpen } from './lib/utils';
import { MarketSummary, EarningsReport } from './types';
import { NewsletterSummaryCard } from './components/NewsletterSummary';
import { MarketOverview } from './components/MarketOverview';
import { TopMovers } from './components/TopMovers';
import { SectorHeatmap } from './components/SectorHeatmap';
import { CommoditiesPanel } from './components/CommoditiesPanel';
import { CurrencyPanel } from './components/CurrencyPanel';
import { EarningsTable } from './components/EarningsTable';
import { YoungRicherCalculator } from './components/YoungRicherCalculator';
import { ThemePicker, ThemeId } from './components/ThemePicker';
import { GlobalSearch } from './components/GlobalSearch';
import { FearGreedMeter } from './components/FearGreedMeter';
import { MarketBreadthPanel } from './components/MarketBreadthPanel';
import { NewsPanel } from './components/NewsPanel';
import { EconomicCalendarPanel } from './components/EconomicCalendarPanel';
import { CryptoPanel } from './components/CryptoPanel';
import { Watchlist } from './components/Watchlist';


const WATCHLIST_KEY = 'md_watchlist';

function loadWatchlistSymbols(): string[] {
  try { return JSON.parse(localStorage.getItem(WATCHLIST_KEY) ?? '[]'); } catch { return []; }
}

export default function App() {
  const [data, setData] = useState<MarketSummary | null>(null);
  const [mergedEarnings, setMergedEarnings] = useState<EarningsReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeId>(() => (localStorage.getItem('theme') as ThemeId) || 'obsidian');
  const [showCalculator, setShowCalculator] = useState(false);
  const navigate = useNavigate();
  const prevMarketOpen = useRef(false);

  const mergeWatchlistIntoEarnings = useCallback(async (earnings: EarningsReport[]) => {
    const syms = loadWatchlistSymbols();
    if (syms.length === 0) { setMergedEarnings(earnings); return; }
    try {
      const quotes = await fetchBatch(syms, false);
      const earningsSymbols = new Set(earnings.map(e => e.symbol));
      const enriched = earnings.map(e => {
        const q = quotes.find(q => q.symbol === e.symbol);
        return q ? { ...e, changePercent: q.changePercent, isWatchlist: true } : e;
      });
      const watchlistOnly = quotes
        .filter(q => !earningsSymbols.has(q.symbol))
        .map(q => ({
          symbol: q.symbol,
          name: q.name,
          changePercent: q.changePercent,
          isWatchlist: true,
        } as EarningsReport));
      setMergedEarnings([...enriched, ...watchlistOnly]);
    } catch {
      setMergedEarnings(earnings);
    }
  }, []);

  const load = useCallback(async (bust = false) => {
    try {
      setError(null);
      const result = await fetchNewsletter();
      setData(result);
      await mergeWatchlistIntoEarnings(result.earnings);
    } catch (e: any) {
      setError(e?.message || 'Failed to load market data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [mergeWatchlistIntoEarnings]);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('theme-daylight', 'theme-terminal', 'theme-aurora', 'theme-gold');
    if (theme !== 'obsidian') html.classList.add(`theme-${theme}`);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const tick = () => {
      const open = isMarketOpen();
      if (open && !prevMarketOpen.current) load();
      prevMarketOpen.current = open;
    };
    const minuteId = setInterval(tick, 60_000);
    const refreshId = setInterval(() => { if (isMarketOpen()) load(); }, 15 * 60_000);
    return () => { clearInterval(minuteId); clearInterval(refreshId); };
  }, [load]);

  useEffect(() => { load(); }, [load]);

  const dataRef = useRef<MarketSummary | null>(null);
  useEffect(() => { dataRef.current = data; }, [data]);

  useEffect(() => {
    const onWatchlistChanged = () => {
      if (dataRef.current) mergeWatchlistIntoEarnings(dataRef.current.earnings);
    };
    window.addEventListener('watchlist-changed', onWatchlistChanged);
    return () => window.removeEventListener('watchlist-changed', onWatchlistChanged);
  }, [mergeWatchlistIntoEarnings]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load(true);
  };

  const dateStr = data
    ? new Date(data.date).toLocaleDateString('en-US', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
      });

  if (showCalculator) {
    return <YoungRicherCalculator onBack={() => setShowCalculator(false)} currencies={data?.currencies} />;
  }

  const handleSymbolClick = (symbol: string, _name: string) => navigate(`/stock/${encodeURIComponent(symbol)}`);

  return (
    <div className="min-h-screen bg-background text-slate-200">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="mr-auto">
            <h1 className="text-2xl font-medium text-slate-100 tracking-tight">Market Daily</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{dateStr}</p>
          </div>
          <GlobalSearch onNavigate={handleSymbolClick} />
          <ThemePicker current={theme} onChange={setTheme} />
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border text-sm text-slate-300 hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </header>

        {/* Fear & Greed */}
        <div className="mb-4">
          <FearGreedMeter data={data?.fearGreed ?? null} loading={loading} />
        </div>

        {/* Calculator CTA Banner */}
        <div className="mb-6">
          <button
            onClick={() => setShowCalculator(true)}
            className="w-full group relative overflow-hidden rounded-2xl text-left"
            style={{ background: 'linear-gradient(135deg, #071a07 0%, #0a2410 40%, #071f10 70%, #050f05 100%)' }}
          >
            {/* Animated border glow */}
            <span className="pointer-events-none absolute inset-0 rounded-2xl border border-transparent group-hover:border-green-400/40 transition-all duration-500" style={{ boxShadow: '0 0 0 1px rgba(34,197,94,0.15), inset 0 0 0 1px rgba(34,197,94,0.08)' }} />
            {/* Shimmer sweep */}
            <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[800ms] ease-in-out bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
            {/* Glow orbs */}
            <span className="pointer-events-none absolute -top-8 left-1/4 h-28 w-28 rounded-full bg-green-500/20 blur-3xl group-hover:bg-green-500/35 transition-all duration-700" />
            <span className="pointer-events-none absolute -bottom-6 right-1/4 h-20 w-20 rounded-full bg-amber-400/15 blur-2xl animate-pulse [animation-delay:0.5s]" />
            <span className="pointer-events-none absolute top-2 right-8 h-16 w-16 rounded-full bg-emerald-400/10 blur-2xl animate-pulse [animation-delay:1.2s]" />

            <div className="relative px-6 py-5 flex items-center gap-5">
              {/* Icon block */}
              <div className="relative shrink-0">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500/30 to-emerald-600/20 border border-green-500/30 group-hover:border-green-400/50 group-hover:from-green-500/40 transition-all duration-300 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                  <TrendingUp size={26} className="text-green-400 group-hover:text-green-300 transition-colors drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-50" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500 shadow-[0_0_6px_rgba(34,197,94,1)]" />
                </span>
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/90 mb-1">Free Tool · No Sign-up</p>
                <p className="text-lg font-extrabold text-white leading-tight group-hover:text-green-50 transition-colors">
                  The Younger The Richer Calculator
                </p>
                <p className="text-xs text-slate-400 mt-1 group-hover:text-slate-300 transition-colors">
                  Enter your age, monthly savings &amp; expected return → see your exact wealth at retirement
                </p>
              </div>

              {/* CTA button */}
              <div className="shrink-0">
                <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_0_24px_rgba(34,197,94,0.5)] group-hover:shadow-[0_0_40px_rgba(34,197,94,0.75)] group-hover:from-green-400 group-hover:to-emerald-400 transition-all duration-300">
                  Try it free →
                </div>
              </div>
            </div>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-[#1a0a0a] border border-down/30 text-down text-sm">
            {error}
          </div>
        )}

        {/* Newsletter headline & analysis */}
        {(loading || data) && (
          <div className="mb-6">
            <NewsletterSummaryCard summary={data?.summary ?? null} loading={loading} />
          </div>
        )}

        {/* News */}
        <div className="mb-6">
          <NewsPanel news={data?.news ?? []} loading={loading} summary={data?.summary ?? null} />
        </div>

        {/* Index cards + sparklines */}
        <div className="mb-6">
          <MarketOverview indices={data?.indices ?? []} loading={loading} onSymbolClick={handleSymbolClick} />
        </div>

        {/* Crypto */}
        <div className="mb-6">
          <CryptoPanel crypto={data?.crypto ?? []} loading={loading} onSymbolClick={handleSymbolClick} />
        </div>

        {/* Currencies */}
        <div className="mb-6">
          <CurrencyPanel currencies={data?.currencies ?? []} loading={loading} lastUpdated={data?.date ?? null} />
        </div>

        {/* Top movers */}
        <div className="mb-6">
          <TopMovers
            gainers={data?.topGainers ?? []}
            losers={data?.topLosers ?? []}
            preMovers={data?.preMovers ?? []}
            postMovers={data?.postMovers ?? []}
            loading={loading}
            onSymbolClick={handleSymbolClick}
          />
        </div>

        {/* Market breadth */}
        <div className="mb-6">
          <MarketBreadthPanel breadth={data?.breadth ?? null} loading={loading} />
        </div>

        {/* Sector heatmap */}
        <div className="mb-6">
          <SectorHeatmap sectors={data?.sectors ?? []} loading={loading} onSymbolClick={handleSymbolClick} />
        </div>

        {/* Commodities */}
        <div className="mb-6">
          <CommoditiesPanel commodities={data?.commodities ?? []} loading={loading} onSymbolClick={handleSymbolClick} />
        </div>

        {/* Economic calendar */}
        <div className="mb-6">
          <EconomicCalendarPanel events={data?.economicEvents ?? []} loading={loading} />
        </div>

        {/* Earnings */}
        <div className="mb-6">
          <EarningsTable earnings={mergedEarnings} loading={loading} />
        </div>

        {/* Watchlist */}
        <div className="mb-6">
          <Watchlist onSymbolClick={handleSymbolClick} />
        </div>

        <footer className="text-center text-xs text-muted-foreground py-4 border-t border-border mt-4">
          Data provided by Yahoo Finance · Refreshes every 15 min · {dateStr}
        </footer>
      </div>
    </div>
  );
}
