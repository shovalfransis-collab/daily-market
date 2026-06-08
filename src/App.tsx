import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { fetchNewsletter } from './lib/api';
import { MarketSummary } from './types';
import { NewsletterSummaryCard } from './components/NewsletterSummary';
import { MarketOverview } from './components/MarketOverview';
import { TopMovers } from './components/TopMovers';
import { SectorHeatmap } from './components/SectorHeatmap';
import { CommoditiesPanel } from './components/CommoditiesPanel';
import { EarningsTable } from './components/EarningsTable';

export default function App() {
  const [data, setData] = useState<MarketSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-background text-slate-200">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-medium text-slate-100 tracking-tight">Market Daily</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{dateStr}</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted border border-border text-sm text-slate-300 hover:bg-[#1e1e2e] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </header>

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

        {/* Index cards + sparklines */}
        <div className="mb-6">
          <MarketOverview indices={data?.indices ?? []} loading={loading} />
        </div>

        {/* Top movers */}
        <div className="mb-6">
          <TopMovers gainers={data?.topGainers ?? []} losers={data?.topLosers ?? []} loading={loading} />
        </div>

        {/* Sector heatmap */}
        <div className="mb-6">
          <SectorHeatmap sectors={data?.sectors ?? []} loading={loading} />
        </div>

        {/* Commodities */}
        <div className="mb-6">
          <CommoditiesPanel commodities={data?.commodities ?? []} loading={loading} />
        </div>

        {/* Earnings */}
        <div className="mb-6">
          <EarningsTable earnings={data?.earnings ?? []} loading={loading} />
        </div>

        <footer className="text-center text-xs text-muted-foreground py-4 border-t border-border mt-4">
          Data provided by Yahoo Finance · Refreshes every 15 min · {dateStr}
        </footer>
      </div>
    </div>
  );
}
