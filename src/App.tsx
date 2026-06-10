import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { fetchNewsletter } from './lib/api';
import { isMarketOpen } from './lib/utils';
import { MarketSummary } from './types';
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


export default function App() {
  const [data, setData] = useState<MarketSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeId>(() => (localStorage.getItem('theme') as ThemeId) || 'obsidian');
  const [showCalculator, setShowCalculator] = useState(false);
  const navigate = useNavigate();
  const prevMarketOpen = useRef(false);

  const load = useCallback(async (bust = false) => {
    try {
      setError(null);
      const result = await fetchNewsletter();
      setData(result);
    } catch (e: any) {
      setError(e?.message || 'Failed to load market data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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
    return <YoungRicherCalculator onBack={() => setShowCalculator(false)} />;
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
            className="calculator-cta w-full group relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-r from-[#0d1f0d] via-[#0f2318] to-[#0d1a0d] px-6 py-4 text-left transition-all duration-300 hover:border-amber-400/70 hover:shadow-[0_0_40px_rgba(34,197,94,0.25)] hover:scale-[1.01]"
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            <span className="pointer-events-none absolute -top-6 right-16 h-20 w-20 rounded-full bg-up/20 blur-2xl animate-pulse" />
            <span className="pointer-events-none absolute -bottom-4 right-32 h-14 w-14 rounded-full bg-amber-400/15 blur-xl animate-pulse [animation-delay:0.7s]" />
            <div className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-up/20 border border-up/30 group-hover:bg-up/30 transition-colors">
                  <TrendingUp size={20} className="text-up" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-amber-400/80 mb-0.5">Free Tool</p>
                  <p className="text-base font-bold text-slate-100 group-hover:text-white transition-colors">
                    The Younger The Richer Calculator
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    See exactly how much wealth you'll build — start age, monthly input, annual return → real number
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2 rounded-xl bg-up px-4 py-2 text-sm font-bold text-white shadow-[0_0_20px_rgba(34,197,94,0.4)] group-hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] transition-shadow">
                Try it →
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
          <EarningsTable earnings={data?.earnings ?? []} loading={loading} />
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
