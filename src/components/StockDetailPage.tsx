import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { fetchChartRange } from '../lib/yahooFinance';
import { formatPrice, formatPercent, colorClass } from '../lib/utils';

interface Props {
  symbol: string;
  name: string;
  onBack: () => void;
}

/* ── Static data ──────────────────────────────────────────── */

const DESCRIPTIONS: Record<string, string> = {
  '^GSPC': 'The S&P 500 tracks 500 of the largest publicly traded U.S. companies and is the most widely followed benchmark for the American stock market. It covers roughly 80% of total U.S. market capitalization across all major sectors. Institutional investors, pension funds, and index funds use it as the standard measure of "the market." When analysts say "the market is up," they almost always mean the S&P 500.',
  '^IXIC': 'The NASDAQ Composite includes over 3,000 stocks listed on the NASDAQ exchange, heavily weighted toward technology, biotech, and growth companies. It is home to giants like Apple, Microsoft, Nvidia, Amazon, and Meta — making it the go-to gauge for the tech sector\'s health. The index tends to be more volatile than the S&P 500 due to its growth-stock concentration and sensitivity to interest rate expectations.',
  '^DJI': 'The Dow Jones Industrial Average is a price-weighted index of 30 iconic "blue-chip" U.S. companies selected to represent the breadth of the American economy. It is the oldest major U.S. stock index, dating back to 1896, and remains a popular headline number for everyday market sentiment. Because it is price-weighted (not market-cap weighted), high-priced stocks like UnitedHealth Group have outsized influence.',
  '^RUT': 'The Russell 2000 measures the performance of 2,000 small-cap U.S. companies — firms with market caps typically between $300M and $2B. It is considered a barometer for domestic economic health because small-caps derive most revenue inside the U.S. and are more sensitive to local credit conditions. Outperformance vs. the S&P 500 often signals broad economic confidence; underperformance can warn of tightening conditions ahead.',
  '^VIX': 'The VIX — often called the "Fear Index" — measures the market\'s expectation of 30-day volatility in the S&P 500, derived from options pricing. Readings below 15 indicate calm; 20–30 signals elevated uncertainty; above 30 suggests fear or crisis. The VIX spikes during selloffs and drops in bull markets, making it a useful contrarian tool: extreme highs often mark short-term bottoms, extreme lows can signal complacency.',
  '^TNX': 'The 10-Year Treasury Yield is the interest rate the U.S. government pays to borrow money for 10 years and is the world\'s most important benchmark rate. It influences mortgage rates, corporate borrowing costs, and stock valuations — particularly for growth and tech stocks. Rising yields increase the discount rate applied to future earnings, pressuring high-multiple equities. The yield reflects market expectations for inflation, Fed policy, and long-run economic growth.',
  // Sectors
  XLK: 'The Technology Select Sector SPDR ETF holds the largest tech and tech-adjacent companies in the S&P 500, including Apple, Microsoft, Nvidia, and Broadcom. It is the largest sector ETF by assets and dominates the S&P 500 weighting. Performance is driven by AI spending cycles, semiconductor demand, software growth, and interest rate sensitivity. When rates fall, XLK tends to outperform; when rates rise sharply, it faces multiple compression.',
  XLF: 'The Financial Select Sector SPDR ETF covers banks, insurance companies, asset managers, and payment processors. Major holdings include JPMorgan Chase, Berkshire Hathaway, Visa, and Mastercard. Financials are highly sensitive to the interest rate environment — steeper yield curves typically boost bank net interest margins. Regulatory changes and credit quality also drive performance significantly.',
  XLE: 'The Energy Select Sector SPDR ETF holds the largest U.S. oil and gas companies — ExxonMobil, Chevron, ConocoPhillips, and others. Performance tracks closely with crude oil and natural gas prices, geopolitical supply dynamics, and OPEC+ decisions. The sector also increasingly reflects the energy transition as majors allocate capital to lower-carbon projects. It is historically one of the most cyclical sectors.',
  XLV: 'The Health Care Select Sector SPDR ETF covers pharmaceuticals, biotech, medical devices, and managed care organizations. Top holdings include UnitedHealth Group, Eli Lilly, Johnson & Johnson, and AbbVie. Healthcare is considered a defensive sector — demand for medical care is relatively inelastic — but it faces recurring policy risk from drug pricing legislation and regulatory approvals. Biotech earnings are highly event-driven.',
  XLY: 'The Consumer Discretionary Select Sector SPDR ETF includes companies that sell non-essential goods and services — cars, luxury items, restaurants, and retail. Amazon and Tesla together make up a large share of the ETF. The sector is highly sensitive to consumer confidence, disposable income, and credit availability. It typically outperforms in early economic expansions and underperforms when consumer spending tightens.',
  XLP: 'The Consumer Staples Select Sector SPDR ETF holds companies selling everyday essentials — food, beverages, household products, and tobacco. Procter & Gamble, Coca-Cola, PepsiCo, and Walmart are top holdings. The sector is considered defensive: demand holds up even in recessions, making it a safe-haven rotation during downturns. It tends to lag in strong bull markets when risk appetite favors growth.',
  XLI: 'The Industrial Select Sector SPDR ETF covers aerospace, defense, machinery, transportation, and professional services companies. Major holdings include General Electric Aerospace, Caterpillar, Union Pacific, and RTX. Industrials are cyclically sensitive — they tend to lead economic expansions through capital goods orders and contract activity. Defense names within the sector provide some stability during geopolitical uncertainty.',
  XLB: 'The Materials Select Sector SPDR ETF holds producers of chemicals, construction materials, metals, and paper. Top holdings include Linde, Air Products, Freeport-McMoRan, and Nucor. The sector is a barometer of global industrial demand and commodity price cycles. Copper prices and construction activity are particularly important leading indicators for materials performance.',
  XLU: 'The Utilities Select Sector SPDR ETF covers electric, gas, and water utility companies — businesses with regulated, predictable cash flows and high dividend yields. NextEra Energy, Southern Company, and Duke Energy are major holdings. Utilities trade as a "bond proxy" — they rise when long-term yields fall and struggle when rates climb. The AI data-center power demand theme has boosted the sector as utilities are key electricity providers.',
  XLRE: 'The Real Estate Select Sector SPDR ETF holds real estate investment trusts (REITs) across property types including data centers, apartments, industrial warehouses, and retail malls. Prologis, American Tower, and Equinix are top holdings. Like utilities, REITs are rate-sensitive because they carry high debt loads and compete with bonds for income-oriented investors. E-commerce growth drives warehouse REIT demand; remote work reshaped office REIT dynamics.',
  XLC: 'The Communication Services Select Sector SPDR ETF covers media, telecom, and internet companies including Meta, Alphabet, Netflix, and Disney. The sector blends high-growth ad-supported platforms with slower-growing legacy telecom businesses. Digital advertising cycles, streaming subscriber growth, and regulatory scrutiny are key performance drivers. Meta and Alphabet alone often account for over 40% of the ETF.',
  // Commodities
  GLD: 'GLD is the SPDR Gold Shares ETF — the largest gold-backed ETF by assets — tracking the price of physical gold bullion. Gold is the world\'s oldest store of value and tends to rise during inflation, currency debasement, geopolitical crises, and periods of negative real interest rates. Central bank gold buying has accelerated in recent years as a reserve diversification strategy. Gold does not yield income, so it competes directly with bonds for safe-haven capital.',
  SLV: 'The iShares Silver Trust tracks the price of physical silver. Silver is a dual-purpose asset: it functions as a monetary metal like gold, but also has significant industrial demand — electronics, solar panels, and medical applications consume over half of annual supply. This dual nature makes silver more volatile than gold, with higher upside in inflationary growth cycles but steeper declines in recessions when industrial demand drops.',
  USO: 'The United States Oil Fund tracks the price of West Texas Intermediate (WTI) crude oil futures. Oil is the world\'s most traded commodity and prices are driven by OPEC+ production decisions, global demand growth, U.S. shale output, and geopolitical supply disruptions. Oil prices feed directly into inflation metrics and consumer purchasing power, making this ETF a useful hedge against energy inflation.',
  UNG: 'The United States Natural Gas Fund tracks near-month natural gas futures. Natural gas prices are highly seasonal — winter heating demand creates sharp spikes — and are influenced by storage levels, LNG export volumes, and weather patterns. U.S. natural gas has gained global significance as Europe diversified away from Russian pipeline gas, connecting domestic prices more tightly to international LNG markets.',
  COPX: 'The Global X Copper Miners ETF holds companies that mine copper, often called "Dr. Copper" because it is seen as a leading economic indicator. Copper demand is driven by construction, electrical grids, EVs, and data center infrastructure — all copper-intensive megatrends. Supply is constrained by a lack of new mine development over the past decade, creating a structural supply deficit expected to widen through the energy transition.',
  XME: 'The SPDR S&P Metals & Mining ETF provides diversified exposure to steel, aluminum, coal, and precious metals producers. The ETF is highly cyclical and sensitive to global infrastructure spending, Chinese industrial activity, and commodity price cycles. Steel producers like Nucor and Cleveland-Cliffs are major holdings. Infrastructure spending and reshoring of manufacturing have supported metals demand in recent years.',
  WEAT: 'The Teucrium Wheat Fund tracks wheat futures prices, which are determined by global crop yields, weather patterns, export policies, and geopolitical events. Wheat is a staple food grain and prices have significant humanitarian and political implications. The Russia-Ukraine conflict has historically been a key driver given both countries\' large export shares. Weather-driven supply shocks can cause violent short-term price swings.',
  CORN: 'The Teucrium Corn Fund tracks corn futures. Corn is both a food staple and an industrial input — the U.S. uses nearly 40% of its corn crop for ethanol production, linking corn prices to oil prices and energy policy. Export demand from China and weather in the U.S. Corn Belt during planting and pollination seasons are the primary price drivers.',
  SOYB: 'The Teucrium Soybean Fund tracks soybean futures. Soybeans are a critical protein source in animal feed and a key agricultural export, with China being the world\'s largest buyer. The U.S.-China trade relationship and South American harvest conditions (Brazil and Argentina supply roughly 55% of global exports) heavily influence prices. La Niña and El Niño weather patterns regularly create supply disruptions.',
  WOOD: 'The iShares Global Timber & Forestry ETF holds timber REITs and forestry companies worldwide. Lumber prices are closely tied to housing construction activity and mortgage rates — when housing starts fall, lumber demand drops sharply. Timber also serves as a long-term inflation hedge and carbon sequestration asset. The ETF provides exposure to both harvest cycles and land appreciation.',
  LIT: 'The Global X Lithium & Battery Tech ETF covers companies in the lithium mining, refining, and battery technology supply chain. Lithium is the critical mineral of the EV revolution — every electric vehicle requires significant amounts of lithium for its battery. Prices are highly volatile, having crashed from 2022 peaks as new supply came online faster than EV adoption accelerated. Long-term demand from EVs and grid storage is structurally positive.',
};

type Signal = 'strong-buy' | 'buy' | 'neutral' | 'sell' | 'strong-sell';

interface Rec {
  longTerm: Signal;
  shortTerm: Signal;
  reasoning: string;
}

const RECOMMENDATIONS: Record<string, Rec> = {
  '^GSPC': { longTerm: 'buy', shortTerm: 'neutral', reasoning: 'Historically the S&P 500 returns ~10% annually. Long-term dollar-cost averaging remains the most reliable wealth-building strategy. Short-term, elevated valuations and rate uncertainty warrant patience.' },
  '^IXIC': { longTerm: 'buy', shortTerm: 'neutral', reasoning: 'AI and software secular tailwinds make NASDAQ attractive long-term. However, high P/E multiples make it vulnerable to rate spikes and earnings disappointments in the near term.' },
  '^DJI': { longTerm: 'buy', shortTerm: 'neutral', reasoning: 'Blue-chip quality and dividend income make the Dow a solid long-term hold. The price-weighted methodology creates concentration risk in a few names, making diversification important.' },
  '^RUT': { longTerm: 'buy', shortTerm: 'neutral', reasoning: 'Small-caps are historically cheap relative to large-caps and could significantly outperform if the Fed cuts rates and the economy avoids recession. Short-term credit sensitivity adds risk.' },
  '^VIX': { longTerm: 'neutral', shortTerm: 'neutral', reasoning: 'The VIX is not directly investable long-term (futures decay). Short-term, elevated VIX spikes historically mark bottoms — extreme fear often signals buying opportunities in equities rather than VIX itself.' },
  '^TNX': { longTerm: 'neutral', shortTerm: 'neutral', reasoning: 'Treasury yields are driven by macro policy, not company fundamentals. Watch the 10Y as a key input for equity valuations — rising yields compress P/E ratios; falling yields support them.' },
  XLK: { longTerm: 'buy', shortTerm: 'buy', reasoning: 'AI infrastructure buildout and software adoption remain multi-year secular trends. Near-term earnings momentum from hyperscalers and chip designers supports the sector broadly.' },
  XLF: { longTerm: 'buy', shortTerm: 'neutral', reasoning: 'Strong bank balance sheets and potentially steepening yield curves support financials long-term. Short-term credit quality and commercial real estate exposure remain watchpoints.' },
  XLE: { longTerm: 'neutral', shortTerm: 'neutral', reasoning: 'Energy cash flows are healthy but the energy transition creates long-term uncertainty. Short-term oil price volatility and geopolitical risk cut both ways.' },
  XLV: { longTerm: 'buy', shortTerm: 'buy', reasoning: 'Healthcare is defensive with a strong secular growth angle in GLP-1 drugs, oncology, and medical devices. Relatively insulated from economic cycles and benefits from aging demographics.' },
  XLY: { longTerm: 'neutral', shortTerm: 'neutral', reasoning: 'Consumer discretionary is sensitive to interest rates and consumer debt levels. Amazon\'s dominance skews the ETF toward e-commerce strength, but Tesla adds EV cycle volatility.' },
  XLP: { longTerm: 'buy', shortTerm: 'neutral', reasoning: 'Staples are reliable in downturns but lag in bull markets. Best used as portfolio ballast or a tactical safe-haven rotation when economic indicators deteriorate.' },
  XLI: { longTerm: 'buy', shortTerm: 'buy', reasoning: 'Reshoring, infrastructure spending, and defense budgets create a durable capex cycle for industrials. Aerospace backlogs remain massive. Earnings have consistently surprised to the upside.' },
  XLB: { longTerm: 'neutral', shortTerm: 'neutral', reasoning: 'Materials are a leveraged play on global growth. China stimulus and energy-transition mineral demand are long-term positives, but cyclical risk and input cost volatility require careful timing.' },
  XLU: { longTerm: 'buy', shortTerm: 'buy', reasoning: 'AI data center power demand is a new structural growth driver for utilities. Regulated earnings and dividend growth are attractive in any rate environment. The power shortage narrative should sustain interest.' },
  XLRE: { longTerm: 'neutral', shortTerm: 'neutral', reasoning: 'REITs face a complex rate environment. Data center and industrial REITs are strong; office and retail face structural headwinds. Selective exposure to growth sub-sectors is preferred over broad ETF.' },
  XLC: { longTerm: 'buy', shortTerm: 'buy', reasoning: 'Meta and Alphabet dominate digital advertising with strong AI monetization paths. Streaming profitability is improving. The sector offers growth at a more reasonable valuation than pure tech.' },
  GLD: { longTerm: 'buy', shortTerm: 'buy', reasoning: 'Central bank accumulation, de-dollarization trends, and geopolitical tensions support gold structurally. It serves as effective portfolio insurance and benefits from eventual Fed rate cuts reducing real yields.' },
  SLV: { longTerm: 'buy', shortTerm: 'neutral', reasoning: 'Solar and electronics demand create a structural industrial bid for silver. Short-term, it tends to lag gold in risk-off moves. Best accumulated on dips for a long-term energy-transition thesis.' },
  USO: { longTerm: 'neutral', shortTerm: 'neutral', reasoning: 'Oil is a trading vehicle, not a long-term hold — contango in futures markets erodes returns over time. Best used as a short-term hedge or tactical play on supply disruptions.' },
  UNG: { longTerm: 'neutral', shortTerm: 'neutral', reasoning: 'Natural gas is extremely volatile and contango-impacted. Suitable only as a short-term tactical trade. LNG export expansion is a long-term structural positive but timing is difficult.' },
  COPX: { longTerm: 'buy', shortTerm: 'neutral', reasoning: 'Copper\'s role in electrification, EVs, and AI data centers creates a strong long-term demand story. Near-term, China\'s sluggish property sector and macro uncertainty weigh on prices.' },
  XME: { longTerm: 'neutral', shortTerm: 'neutral', reasoning: 'Metals and mining are highly cyclical. Infrastructure spending tailwinds compete with China demand uncertainty. Steel producers have benefited from reshoring; coal exposure is a long-term headwind.' },
  WEAT: { longTerm: 'neutral', shortTerm: 'neutral', reasoning: 'Agricultural commodities are weather and geopolitics driven, making them unsuitable for long-term holdings. Best used by specialized traders with strong commodity cycle expertise.' },
  CORN: { longTerm: 'neutral', shortTerm: 'neutral', reasoning: 'Corn futures are tied to ethanol policy, crop yields, and export demand. High volatility and contango erosion make this a tactical instrument rather than a long-term investment.' },
  SOYB: { longTerm: 'neutral', shortTerm: 'neutral', reasoning: 'Soybeans are driven by China demand and South American weather. Without a specific thesis on these factors, this is a difficult holding to manage for non-specialists.' },
  WOOD: { longTerm: 'buy', shortTerm: 'neutral', reasoning: 'Timber is a real asset with inflation-hedging properties and growing carbon credit value. Housing market sensitivity is the primary short-term risk; long-term land appreciation and ESG demand are tailwinds.' },
  LIT: { longTerm: 'buy', shortTerm: 'neutral', reasoning: 'The EV and grid storage megatrend makes lithium strategically critical long-term. Short-term, supply gluts have crushed lithium carbonate prices — the real recovery depends on EV adoption acceleration.' },
};

const DEFAULT_REC: Rec = {
  longTerm: 'neutral',
  shortTerm: 'neutral',
  reasoning: 'This stock is not in our pre-analyzed universe. Always research fundamentals, earnings trends, sector dynamics, and macro environment before making investment decisions. Consult a financial advisor for personalized guidance.',
};

/* ── Range config ─────────────────────────────────────────── */

const RANGES = [
  { label: '24H', range: '1d',  interval: '5m' },
  { label: '1W',  range: '5d',  interval: '60m' },
  { label: '1M',  range: '1mo', interval: '1d' },
  { label: '3M',  range: '3mo', interval: '1d' },
  { label: '6M',  range: '6mo', interval: '1d' },
  { label: '1Y',  range: '1y',  interval: '1d' },
  { label: '2Y',  range: '2y',  interval: '1wk' },
  { label: '5Y',  range: '5y',  interval: '1wk' },
  { label: 'All', range: 'max', interval: '1mo' },
];

/* ── Types ────────────────────────────────────────────────── */

interface ChartPoint {
  t: string;
  close: number;
  high: number;
  low: number;
  open: number;
}

/* ── Helpers ──────────────────────────────────────────────── */

function parseChartData(data: any, rangeLabel: string): ChartPoint[] {
  try {
    const result = data?.chart?.result?.[0];
    if (!result) return [];
    const timestamps: number[] = result.timestamp ?? [];
    const q = result.indicators?.quote?.[0] ?? {};
    const closes: number[] = q.close ?? [];
    const highs: number[] = q.high ?? [];
    const lows: number[] = q.low ?? [];
    const opens: number[] = q.open ?? [];

    const isIntraday = rangeLabel === '24H' || rangeLabel === '1W';

    return timestamps
      .map((ts, i) => ({
        t: isIntraday
          ? new Date(ts * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
          : new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: rangeLabel === 'All' || rangeLabel === '5Y' || rangeLabel === '2Y' ? '2-digit' : undefined }),
        close: closes[i] ?? 0,
        high: highs[i] ?? 0,
        low: lows[i] ?? 0,
        open: opens[i] ?? 0,
      }))
      .filter(p => p.close > 0);
  } catch {
    return [];
  }
}

function getCurrentPrice(data: any): { price: number; change: number; changePct: number } {
  try {
    const meta = data?.chart?.result?.[0]?.meta ?? {};
    const price = meta.regularMarketPrice ?? 0;
    const prev = meta.chartPreviousClose ?? meta.previousClose ?? 0;
    const change = prev ? price - prev : 0;
    const changePct = prev ? (change / prev) * 100 : 0;
    return { price, change, changePct };
  } catch {
    return { price: 0, change: 0, changePct: 0 };
  }
}

function signalLabel(s: Signal): string {
  return { 'strong-buy': 'Strong Buy', buy: 'Buy', neutral: 'Hold / Neutral', sell: 'Sell', 'strong-sell': 'Strong Sell' }[s];
}

function signalColor(s: Signal): string {
  if (s === 'strong-buy' || s === 'buy') return 'text-up';
  if (s === 'strong-sell' || s === 'sell') return 'text-down';
  return 'text-yellow-400';
}

function signalBg(s: Signal): string {
  if (s === 'strong-buy' || s === 'buy') return 'bg-up/10 border-up/20';
  if (s === 'strong-sell' || s === 'sell') return 'bg-down/10 border-down/20';
  return 'bg-yellow-400/10 border-yellow-400/20';
}

function SignalIcon({ s }: { s: Signal }) {
  if (s === 'strong-buy' || s === 'buy') return <TrendingUp size={16} className="text-up" />;
  if (s === 'strong-sell' || s === 'sell') return <TrendingDown size={16} className="text-down" />;
  return <Minus size={16} className="text-yellow-400" />;
}

/* ── Component ────────────────────────────────────────────── */

export function StockDetailPage({ symbol, name, onBack }: Props) {
  const [activeRange, setActiveRange] = useState(2); // default 1M
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState({ price: 0, change: 0, changePct: 0 });
  const [loading, setLoading] = useState(true);
  const cache = useRef<Record<number, { points: ChartPoint[]; price: { price: number; change: number; changePct: number } }>>({});

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (cache.current[activeRange]) {
        setChartData(cache.current[activeRange].points);
        setCurrentPrice(cache.current[activeRange].price);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { range, interval, label } = RANGES[activeRange];
        const data = await fetchChartRange(symbol, range, interval);
        if (cancelled) return;
        const points = parseChartData(data, label);
        const price = getCurrentPrice(data);
        cache.current[activeRange] = { points, price };
        setChartData(points);
        setCurrentPrice(price);
      } catch {
        if (!cancelled) setChartData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [symbol, activeRange]);

  const high = chartData.length ? Math.max(...chartData.map(p => p.high)) : 0;
  const low  = chartData.length ? Math.min(...chartData.filter(p => p.low > 0).map(p => p.low)) : 0;
  const open = chartData[0]?.open ?? 0;
  const positive = currentPrice.changePct >= 0;
  const gradColor = positive ? '#22c55e' : '#ef4444';
  const rec = RECOMMENDATIONS[symbol] ?? DEFAULT_REC;
  const description = DESCRIPTIONS[symbol];
  const displayName = name || symbol.replace('^', '');

  const yMin = chartData.length ? Math.min(...chartData.map(p => p.close)) * 0.998 : 'auto';
  const yMax = chartData.length ? Math.max(...chartData.map(p => p.close)) * 1.002 : 'auto';

  const tickCount = Math.min(chartData.length, 6);
  const step = chartData.length > 1 ? Math.floor((chartData.length - 1) / (tickCount - 1)) : 1;
  const xTicks = chartData.length
    ? [...Array(tickCount)].map((_, i) => chartData[Math.min(i * step, chartData.length - 1)]?.t).filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-background text-slate-200">
      <div className="max-w-screen-xl mx-auto px-4 py-6">

        {/* Header */}
        <header className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border text-sm text-slate-300 hover:bg-[#1e1e2e] transition-colors shrink-0"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">{displayName}</h1>
              <span className="text-sm text-slate-500 font-mono">{symbol.replace('^', '')}</span>
            </div>
          </div>
        </header>

        {/* Price hero */}
        <div className="rounded-xl border border-border bg-card p-6 mb-4">
          {loading && currentPrice.price === 0 ? (
            <div className="animate-pulse">
              <div className="h-10 bg-muted rounded w-40 mb-2" />
              <div className="h-4 bg-muted rounded w-24" />
            </div>
          ) : (
            <>
              <p className="text-4xl font-bold text-slate-100 tracking-tight">
                {formatPrice(currentPrice.price)}
              </p>
              <p className={`text-base mt-1 font-medium ${colorClass(currentPrice.changePct)}`}>
                {currentPrice.change >= 0 ? '+' : ''}{formatPrice(currentPrice.change)}&nbsp;
                ({formatPercent(currentPrice.changePct)})
                <span className="text-slate-500 font-normal ml-2 text-sm">today</span>
              </p>
            </>
          )}
        </div>

        {/* Chart card */}
        <div className="rounded-xl border border-border bg-card p-6 mb-4">

          {/* Range tabs */}
          <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
            {RANGES.map((r, i) => (
              <button
                key={r.label}
                onClick={() => setActiveRange(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0
                  ${activeRange === i
                    ? 'bg-up text-white shadow-[0_0_12px_rgba(34,197,94,0.3)]'
                    : 'bg-muted text-slate-400 hover:text-slate-200 hover:bg-[#1e1e2e]'}`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Chart */}
          {loading ? (
            <div className="h-64 bg-muted rounded-lg animate-pulse" />
          ) : chartData.length < 2 ? (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
              No data available for this range
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={gradColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={gradColor} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" />
                <XAxis
                  dataKey="t"
                  ticks={xTicks}
                  stroke="#334155"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#334155"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={v => formatPrice(v)}
                  domain={[yMin, yMax]}
                  width={72}
                />
                <Tooltip
                  contentStyle={{ background: '#0d1117', border: '1px solid #1e2535', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#94a3b8', marginBottom: 4 }}
                  formatter={(v: number) => [formatPrice(v), 'Price']}
                />
                <Area
                  type="monotone" dataKey="close"
                  stroke={gradColor} strokeWidth={2}
                  fill="url(#chartGrad)"
                  dot={false} isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {/* High / Low / Open stats */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { label: `Period High`, value: high, accent: 'text-up' },
              { label: `Period Low`,  value: low,  accent: 'text-down' },
              { label: `Period Open`, value: open, accent: 'text-slate-200' },
            ].map(({ label, value, accent }) => (
              <div key={label} className="rounded-lg bg-muted p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                {loading
                  ? <div className="h-4 bg-background rounded w-16 mx-auto animate-pulse" />
                  : <p className={`text-sm font-semibold ${accent}`}>{value ? formatPrice(value) : '—'}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        {description && (
          <div className="rounded-xl border border-border bg-card p-6 mb-4">
            <h2 className="text-base font-semibold text-slate-100 mb-3">About {displayName}</h2>
            <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
          </div>
        )}

        {/* Recommendation */}
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-semibold text-slate-100">Market Outlook</h2>
            <span className="text-xs text-slate-500 ml-1">— general analysis, not financial advice</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className={`rounded-xl border p-4 ${signalBg(rec.longTerm)}`}>
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Long Term</p>
              <div className="flex items-center gap-2">
                <SignalIcon s={rec.longTerm} />
                <p className={`text-base font-bold ${signalColor(rec.longTerm)}`}>
                  {signalLabel(rec.longTerm)}
                </p>
              </div>
            </div>
            <div className={`rounded-xl border p-4 ${signalBg(rec.shortTerm)}`}>
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Short Term</p>
              <div className="flex items-center gap-2">
                <SignalIcon s={rec.shortTerm} />
                <p className={`text-base font-bold ${signalColor(rec.shortTerm)}`}>
                  {signalLabel(rec.shortTerm)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-slate-400 leading-relaxed">{rec.reasoning}</p>
          </div>

          <p className="text-xs text-slate-600 mt-3">
            ⚠ Recommendations reflect general market consensus and educational context only.
            Past performance does not guarantee future results. Always do your own research.
          </p>
        </div>

        <footer className="text-center text-xs text-muted-foreground py-4 border-t border-border">
          Data via Yahoo Finance · Not financial advice
        </footer>
      </div>
    </div>
  );
}
