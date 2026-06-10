import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, TrendingUp, TrendingDown, Minus,
  ExternalLink, Users, Globe, Building2,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import { fetchChartRange, fetchQuoteSummary } from '../lib/yahooFinance';
import { formatPrice, formatPercent, formatMarketCap, formatVolume, colorClass } from '../lib/utils';
import { FinancialMetrics, AIScores } from '../types';
import { generateAnalysis, generateFromRec, outlookColor, outlookBg, valuationColor } from '../lib/stockAnalysis';

interface Props {
  symbol: string;
  name: string;
  onBack: () => void;
}

// ── Static fallback data ───────────────────────────────────────

const DESCRIPTIONS: Record<string, string> = {
  '^GSPC': 'The S&P 500 tracks 500 of the largest publicly traded U.S. companies and is the most widely followed benchmark for the American stock market. It covers roughly 80% of total U.S. market capitalization across all major sectors.',
  '^IXIC': 'The NASDAQ Composite includes over 3,000 stocks listed on the NASDAQ exchange, heavily weighted toward technology, biotech, and growth companies. Home to Apple, Microsoft, Nvidia, Amazon, and Meta.',
  '^DJI': 'The Dow Jones Industrial Average is a price-weighted index of 30 iconic blue-chip U.S. companies selected to represent the breadth of the American economy. The oldest major U.S. stock index, dating to 1896.',
  '^RUT': 'The Russell 2000 measures the performance of 2,000 small-cap U.S. companies. It is considered a barometer for domestic economic health because small-caps derive most revenue inside the U.S.',
  '^VIX': 'The VIX — the "Fear Index" — measures the market\'s expectation of 30-day S&P 500 volatility derived from options pricing. Readings below 15 = calm; 20–30 = caution; above 30 = fear.',
  '^TNX': 'The 10-Year Treasury Yield is the world\'s most important benchmark rate, influencing mortgage rates, corporate borrowing costs, and equity valuations.',
  XLK: 'Technology Select Sector SPDR ETF. Holds the largest tech and tech-adjacent companies in the S&P 500 including Apple, Microsoft, Nvidia, and Broadcom.',
  XLF: 'Financial Select Sector SPDR ETF. Covers banks, insurance, asset managers, and payment processors. Key holdings: JPMorgan, Berkshire, Visa, Mastercard.',
  XLE: 'Energy Select Sector SPDR ETF. Holds the largest U.S. oil and gas companies — ExxonMobil, Chevron, ConocoPhillips.',
  XLV: 'Health Care Select Sector SPDR ETF. Covers pharma, biotech, medical devices, and managed care. Top names: UnitedHealth, Eli Lilly, J&J, AbbVie.',
  XLY: 'Consumer Discretionary Select Sector SPDR ETF. Includes Amazon and Tesla as top holdings alongside auto, luxury, retail, and restaurants.',
  XLP: 'Consumer Staples Select Sector SPDR ETF. Holds everyday essentials — food, beverages, household products. P&G, Coca-Cola, PepsiCo, Walmart.',
  XLI: 'Industrial Select Sector SPDR ETF. Covers aerospace, defense, machinery, and transportation. GE Aerospace, Caterpillar, Union Pacific, RTX.',
  XLB: 'Materials Select Sector SPDR ETF. Holds producers of chemicals, construction materials, metals. Linde, Air Products, Freeport-McMoRan.',
  XLU: 'Utilities Select Sector SPDR ETF. Electric, gas, and water utilities with regulated cash flows. NextEra, Southern, Duke. Trades as a bond proxy.',
  XLRE: 'Real Estate Select Sector SPDR ETF. Holds REITs across data centers, apartments, industrial, and retail. Prologis, American Tower, Equinix.',
  XLC: 'Communication Services SPDR ETF. Meta, Alphabet, Netflix, Disney. Blends high-growth ad platforms with legacy telecom.',
  GLD: 'SPDR Gold Shares — largest gold-backed ETF. Gold rises during inflation, currency debasement, geopolitical crises, and negative real rates.',
  SLV: 'iShares Silver Trust. Silver is both monetary metal and industrial input — electronics, solar panels, medical applications.',
  USO: 'United States Oil Fund. Tracks WTI crude oil futures. Prices driven by OPEC+, global demand, U.S. shale output, and geopolitical disruptions.',
  UNG: 'United States Natural Gas Fund. Tracks near-month natural gas futures. Highly seasonal; LNG exports have tightened domestic-international linkages.',
  COPX: 'Global X Copper Miners ETF. Copper is called "Dr. Copper" — a leading economic indicator driven by construction, EVs, and AI data center infrastructure.',
  XME: 'SPDR S&P Metals & Mining ETF. Diversified exposure to steel, aluminum, coal, and precious metals producers.',
  GLD_: '', SLV_: '', WEAT: 'Teucrium Wheat Fund. Tracks wheat futures. Driven by global crop yields, weather, and geopolitical events including Russia-Ukraine dynamics.',
  CORN: 'Teucrium Corn Fund. Tracks corn futures. The U.S. uses ~40% of its crop for ethanol, linking corn to oil prices and energy policy.',
  SOYB: 'Teucrium Soybean Fund. Soybeans are critical protein source and key export; China is the world\'s largest buyer.',
  WOOD: 'iShares Global Timber & Forestry ETF. Holds timber REITs and forestry companies. Linked to housing starts, mortgage rates, and carbon sequestration.',
  LIT: 'Global X Lithium & Battery Tech ETF. Covers lithium mining and battery technology. The EV revolution requires massive lithium for batteries.',
};

type Signal = 'strong-buy' | 'buy' | 'neutral' | 'sell' | 'strong-sell';
interface Rec { longTerm: Signal; shortTerm: Signal; reasoning: string }

const RECOMMENDATIONS: Record<string, Rec> = {
  '^GSPC': { longTerm: 'buy', shortTerm: 'neutral', reasoning: 'Historically returns ~10% annually. Long-term dollar-cost averaging remains the most reliable wealth-building strategy. Short-term, elevated valuations and rate uncertainty warrant patience.' },
  '^IXIC': { longTerm: 'buy', shortTerm: 'neutral', reasoning: 'AI and software secular tailwinds make NASDAQ attractive long-term. High P/E multiples make it vulnerable to rate spikes and earnings disappointments near-term.' },
  '^DJI':  { longTerm: 'buy', shortTerm: 'neutral', reasoning: 'Blue-chip quality and dividend income make the Dow a solid long-term hold. The price-weighted methodology creates concentration risk in a few high-priced names.' },
  '^RUT':  { longTerm: 'buy', shortTerm: 'neutral', reasoning: 'Small-caps are historically cheap relative to large-caps and could significantly outperform if the Fed cuts rates and the economy avoids recession.' },
  '^VIX':  { longTerm: 'neutral', shortTerm: 'neutral', reasoning: 'The VIX is not directly investable long-term. Extreme highs historically mark short-term bottoms — fear often signals buying opportunities in equities rather than VIX itself.' },
  '^TNX':  { longTerm: 'neutral', shortTerm: 'neutral', reasoning: 'Treasury yields are driven by macro policy. Watch the 10Y as a key equity valuation input — rising yields compress P/E ratios; falling yields support them.' },
  XLK:  { longTerm: 'buy',    shortTerm: 'buy',     reasoning: 'AI infrastructure buildout and software adoption remain multi-year secular trends. Near-term earnings momentum from hyperscalers and chip designers is strong.' },
  XLF:  { longTerm: 'buy',    shortTerm: 'neutral', reasoning: 'Strong bank balance sheets support financials long-term. Short-term credit quality and commercial real estate exposure remain watchpoints.' },
  XLE:  { longTerm: 'neutral', shortTerm: 'neutral', reasoning: 'Energy cash flows are healthy but the energy transition creates long-term uncertainty. Oil price volatility and geopolitical risk cut both ways.' },
  XLV:  { longTerm: 'buy',    shortTerm: 'buy',     reasoning: 'Healthcare is defensive with strong secular growth in GLP-1 drugs, oncology, and medical devices. Relatively insulated from economic cycles.' },
  XLY:  { longTerm: 'neutral', shortTerm: 'neutral', reasoning: 'Sensitive to interest rates and consumer debt levels. Amazon\'s dominance skews toward e-commerce; Tesla adds EV cycle volatility.' },
  XLP:  { longTerm: 'buy',    shortTerm: 'neutral', reasoning: 'Reliable in downturns but lags in bull markets. Best used as portfolio ballast or a tactical safe-haven rotation.' },
  XLI:  { longTerm: 'buy',    shortTerm: 'buy',     reasoning: 'Reshoring, infrastructure spending, and defense budgets create a durable capex cycle. Aerospace backlogs remain massive.' },
  XLB:  { longTerm: 'neutral', shortTerm: 'neutral', reasoning: 'Materials are a leveraged play on global growth. China stimulus and energy-transition mineral demand compete with cyclical risk.' },
  XLU:  { longTerm: 'buy',    shortTerm: 'buy',     reasoning: 'AI data center power demand is a new structural growth driver. Regulated earnings and dividend growth are attractive in any rate environment.' },
  XLRE: { longTerm: 'neutral', shortTerm: 'neutral', reasoning: 'REITs face a complex rate environment. Data center and industrial REITs are strong; office and retail face structural headwinds.' },
  XLC:  { longTerm: 'buy',    shortTerm: 'buy',     reasoning: 'Meta and Alphabet dominate digital advertising with strong AI monetization. Streaming profitability is improving.' },
  GLD:  { longTerm: 'buy',    shortTerm: 'buy',     reasoning: 'Central bank accumulation, de-dollarization, and geopolitical tensions support gold structurally. Portfolio insurance and hedge against dollar weakness.' },
  SLV:  { longTerm: 'buy',    shortTerm: 'neutral', reasoning: 'Solar and electronics demand create a structural industrial bid. Best accumulated on dips for a long-term energy-transition thesis.' },
  USO:  { longTerm: 'neutral', shortTerm: 'neutral', reasoning: 'Oil is a trading vehicle, not a long-term hold — contango erodes returns over time. Best as a short-term hedge.' },
  UNG:  { longTerm: 'neutral', shortTerm: 'neutral', reasoning: 'Natural gas is extremely volatile and contango-impacted. Suitable only as a short-term tactical trade.' },
  COPX: { longTerm: 'buy',    shortTerm: 'neutral', reasoning: 'Copper\'s role in electrification, EVs, and AI data centers creates a strong long-term demand story.' },
  XME:  { longTerm: 'neutral', shortTerm: 'neutral', reasoning: 'Infrastructure tailwinds compete with China demand uncertainty. Steel benefits from reshoring; coal exposure is a long-term headwind.' },
  WEAT: { longTerm: 'neutral', shortTerm: 'neutral', reasoning: 'Agricultural commodities are weather and geopolitics driven — unsuitable for long-term holdings without specialist expertise.' },
  CORN: { longTerm: 'neutral', shortTerm: 'neutral', reasoning: 'Tied to ethanol policy, crop yields, and export demand. High volatility and contango erosion make this a tactical instrument.' },
  SOYB: { longTerm: 'neutral', shortTerm: 'neutral', reasoning: 'Driven by China demand and South American weather. Difficult to manage for non-specialists.' },
  WOOD: { longTerm: 'buy',    shortTerm: 'neutral', reasoning: 'Real asset with inflation-hedging properties and growing carbon credit value. Housing sensitivity is the primary short-term risk.' },
  LIT:  { longTerm: 'buy',    shortTerm: 'neutral', reasoning: 'EV and grid storage megatrend makes lithium strategically critical long-term. Short-term supply gluts have pressured prices.' },
};

const DEFAULT_REC: Rec = {
  longTerm: 'neutral',
  shortTerm: 'neutral',
  reasoning: 'Always research fundamentals, earnings trends, sector dynamics, and macro environment before making investment decisions. Consult a financial advisor for personalized guidance.',
};

// ── Range config ───────────────────────────────────────────────

const RANGES = [
  { label: '1D',  range: '1d',  interval: '5m' },
  { label: '5D',  range: '5d',  interval: '60m' },
  { label: '1M',  range: '1mo', interval: '1d' },
  { label: '6M',  range: '6mo', interval: '1d' },
  { label: 'YTD', range: 'ytd', interval: '1d' },
  { label: '1Y',  range: '1y',  interval: '1d' },
  { label: '5Y',  range: '5y',  interval: '1wk' },
  { label: 'MAX', range: 'max', interval: '1mo' },
];

// ── Types ──────────────────────────────────────────────────────

interface ChartPoint { t: string; close: number; high: number; low: number; open: number; volume: number }

// ── Helpers ────────────────────────────────────────────────────

function parseChartData(data: any, rangeLabel: string): ChartPoint[] {
  try {
    const result = data?.chart?.result?.[0];
    if (!result) return [];
    const timestamps: number[] = result.timestamp ?? [];
    if (!timestamps.length) return [];

    const q = result.indicators?.quote?.[0] ?? {};
    const adjCloses: (number | null)[] = result.indicators?.adjclose?.[0]?.adjclose ?? [];
    const rawCloses: (number | null)[] = q.close ?? [];
    const isIntraday = rangeLabel === '1D' || rangeLabel === '5D';

    // For daily/weekly/monthly ranges prefer adjclose (splits/dividends adjusted)
    const closes = !isIntraday && adjCloses.some(v => v != null && v > 0)
      ? adjCloses
      : rawCloses;

    const highs:   (number | null)[] = q.high   ?? [];
    const lows:    (number | null)[] = q.low    ?? [];
    const opens:   (number | null)[] = q.open   ?? [];
    const volumes: (number | null)[] = q.volume ?? [];

    return timestamps
      .map((ts, i) => {
        const close = closes[i];
        if (!ts || close == null || close <= 0) return null;
        const high  = highs[i];
        const low   = lows[i];
        const open  = opens[i];
        return {
          t: isIntraday
            ? new Date(ts * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
            : new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: rangeLabel === 'MAX' || rangeLabel === '5Y' ? '2-digit' : undefined }),
          close,
          high:   high   != null && high   > 0 ? high   : close,
          low:    low    != null && low    > 0 ? low    : close,
          open:   open   != null && open   > 0 ? open   : close,
          volume: volumes[i] ?? 0,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null) as ChartPoint[];
  } catch { return []; }
}

function getCurrentPrice(data: any) {
  try {
    const meta = data?.chart?.result?.[0]?.meta ?? {};
    const price = meta.regularMarketPrice ?? 0;
    const prev  = meta.chartPreviousClose ?? meta.previousClose ?? 0;
    const change = prev ? price - prev : 0;
    const changePct = prev ? (change / prev) * 100 : 0;
    return { price, change, changePct };
  } catch { return { price: 0, change: 0, changePct: 0 }; }
}

function fmtMoney(n?: number): string {
  if (n == null) return '—';
  if (Math.abs(n) >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (Math.abs(n) >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6)  return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}

function fmtPct(n?: number): string {
  if (n == null) return '—';
  return `${(n * 100).toFixed(1)}%`;
}

function fmtNum(n?: number, dec = 2): string {
  if (n == null) return '—';
  return n.toFixed(dec);
}

function signalLabel(s: Signal) {
  return { 'strong-buy': 'Strong Buy', buy: 'Buy', neutral: 'Hold', sell: 'Sell', 'strong-sell': 'Strong Sell' }[s];
}
function signalColor(s: Signal) {
  if (s === 'strong-buy' || s === 'buy') return 'text-up';
  if (s === 'strong-sell' || s === 'sell') return 'text-down';
  return 'text-yellow-400';
}
function signalBg(s: Signal) {
  if (s === 'strong-buy' || s === 'buy') return 'bg-up/10 border-up/20';
  if (s === 'strong-sell' || s === 'sell') return 'bg-down/10 border-down/20';
  return 'bg-yellow-400/10 border-yellow-400/20';
}

// ── AI Score computation ───────────────────────────────────────

function computeAIScores(m: FinancialMetrics, currentPrice: number): AIScores | null {
  const hasAny = [m.grossMargin, m.pe, m.debtToEquity, m.revenueGrowth].some(v => v != null);
  if (!hasAny) return null;

  // Growth
  let growth = 50;
  if (m.revenueGrowth != null) {
    growth = m.revenueGrowth > 0.3 ? 95
           : m.revenueGrowth > 0.2 ? 83
           : m.revenueGrowth > 0.1 ? 68
           : m.revenueGrowth > 0.05 ? 52
           : m.revenueGrowth > 0 ? 38
           : m.revenueGrowth > -0.05 ? 22 : 12;
  }
  if ((m.revenueGrowth ?? 0) > 0.1 && (m.forwardPE ?? 999) < (m.pe ?? 999)) growth = Math.min(100, growth + 8);

  // Profitability
  let profitability = 50;
  if (m.grossMargin != null) {
    profitability = m.grossMargin > 0.7 ? 90
                  : m.grossMargin > 0.5 ? 76
                  : m.grossMargin > 0.35 ? 60
                  : m.grossMargin > 0.2 ? 44 : 28;
  }
  if (m.roe != null) {
    if (m.roe > 0.25) profitability = Math.min(100, profitability + 12);
    else if (m.roe < 0) profitability = Math.max(0, profitability - 15);
  }
  if (m.netMargin != null && m.netMargin > 0.2) profitability = Math.min(100, profitability + 8);

  // Financial strength
  let strength = 50;
  if (m.debtToEquity != null) {
    strength = m.debtToEquity < 30 ? 88
             : m.debtToEquity < 60 ? 72
             : m.debtToEquity < 120 ? 55
             : m.debtToEquity < 250 ? 38 : 20;
  }
  if (m.currentRatio != null) {
    if (m.currentRatio > 2)  strength = Math.min(100, strength + 10);
    if (m.currentRatio < 1)  strength = Math.max(0, strength - 15);
  }
  if (m.freeCashFlow != null) {
    strength = m.freeCashFlow > 0 ? Math.min(100, strength + 6) : Math.max(0, strength - 12);
  }

  // Valuation (higher = more attractive)
  let valuation = 50;
  if (m.pe != null && m.pe > 0) {
    valuation = m.pe < 10 ? 92
              : m.pe < 15 ? 80
              : m.pe < 22 ? 64
              : m.pe < 30 ? 48
              : m.pe < 45 ? 32
              : m.pe < 70 ? 20 : 10;
  }
  if (m.peg != null && m.peg > 0) {
    if (m.peg < 1)   valuation = Math.min(100, valuation + 14);
    else if (m.peg < 1.5) valuation = Math.min(100, valuation + 6);
    else if (m.peg > 3)   valuation = Math.max(0, valuation - 12);
  }

  // Momentum: price position in 52-week range
  let momentum = 50;
  if (m.week52High != null && m.week52Low != null && currentPrice > 0) {
    const range = m.week52High - m.week52Low;
    if (range > 0) {
      const pos = (currentPrice - m.week52Low) / range;
      momentum = Math.round(pos * 100);
      if (momentum > 70) momentum = Math.min(100, momentum + 10);
    }
  }
  if (m.beta != null) {
    if (m.beta < 0.8) momentum = Math.max(0, momentum - 5);
    if (m.beta > 2)   momentum = Math.min(100, momentum + 5);
  }

  const overall = Math.round(
    growth * 0.25 + profitability * 0.25 + strength * 0.20 + valuation * 0.15 + momentum * 0.15
  );

  return {
    growth:        Math.round(growth),
    profitability: Math.round(profitability),
    strength:      Math.round(strength),
    valuation:     Math.round(valuation),
    momentum:      Math.round(momentum),
    overall,
  };
}

// ── Sub-components ─────────────────────────────────────────────

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? 'bg-up' : value >= 45 ? 'bg-yellow-400' : 'bg-down';
  const textColor = value >= 70 ? 'text-up' : value >= 45 ? 'text-yellow-400' : 'text-down';
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={`text-xs font-bold ${textColor}`}>{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function MetricCell({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-muted/50 border border-border p-3">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm font-bold text-slate-200">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-muted rounded animate-pulse ${className}`} />;
}

// ── Analyst consensus label from recommendationKey ────────────

function consensusFromKey(key?: string): { label: string; signal: Signal } {
  if (!key) return { label: 'N/A', signal: 'neutral' };
  const k = key.toLowerCase();
  if (k.includes('strongbuy') || k === 'strong_buy') return { label: 'Strong Buy', signal: 'strong-buy' };
  if (k.includes('buy')) return { label: 'Buy', signal: 'buy' };
  if (k.includes('strongsell') || k === 'strong_sell') return { label: 'Strong Sell', signal: 'strong-sell' };
  if (k.includes('sell')) return { label: 'Sell', signal: 'sell' };
  return { label: 'Hold', signal: 'neutral' };
}

// ── Main component ─────────────────────────────────────────────

export function StockDetailPage({ symbol, name, onBack }: Props) {
  const [activeRange, setActiveRange] = useState(2);
  const [chartData, setChartData]     = useState<ChartPoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState({ price: 0, change: 0, changePct: 0 });
  const [chartLoading, setChartLoading] = useState(true);
  const [metrics, setMetrics]           = useState<FinancialMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const chartCache = useRef<Record<number, { points: ChartPoint[]; price: typeof currentPrice }>>({});

  // Fetch chart data
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (chartCache.current[activeRange]) {
        const c = chartCache.current[activeRange];
        setChartData(c.points);
        setCurrentPrice(c.price);
        setChartLoading(false);
        return;
      }
      setChartLoading(true);
      try {
        const { range, interval, label } = RANGES[activeRange];
        const data = await fetchChartRange(symbol, range, interval);
        if (cancelled) return;
        const points = parseChartData(data, label);
        const price  = getCurrentPrice(data);
        chartCache.current[activeRange] = { points, price };
        setChartData(points);
        setCurrentPrice(price);
      } catch { if (!cancelled) setChartData([]); }
      finally   { if (!cancelled) setChartLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [symbol, activeRange]);

  // Fetch financial metrics (once per symbol)
  useEffect(() => {
    let cancelled = false;
    setMetrics(null);
    setMetricsLoading(true);
    fetchQuoteSummary(symbol).then(m => {
      if (!cancelled) { setMetrics(m); setMetricsLoading(false); }
    });
    return () => { cancelled = true; };
  }, [symbol]);

  const positive   = currentPrice.changePct >= 0;
  const gradColor  = positive ? 'var(--up)' : 'var(--down)';
  const gradId     = `cg_${symbol.replace(/[^a-z0-9]/gi, '')}`;
  const rec        = RECOMMENDATIONS[symbol] ?? DEFAULT_REC;
  const staticDesc = DESCRIPTIONS[symbol];
  const liveDesc   = metrics?.description;
  const description = liveDesc || staticDesc;
  const displayName = metrics?.longName || metrics?.shortName || name || symbol.replace('^', '');
  const aiScores       = metrics ? computeAIScores(metrics, currentPrice.price) : null;
  const liveAnalysis   = metrics ? generateAnalysis(metrics, currentPrice.price, displayName) : null;
  const analysis       = liveAnalysis ?? (!metricsLoading ? generateFromRec(rec, displayName, symbol) : null);

  const high = chartData.length ? Math.max(...chartData.map(p => p.high || p.close)) : 0;
  const low  = chartData.length ? Math.min(...chartData.filter(p => p.low > 0).map(p => p.low)) : 0;
  const open = chartData[0]?.open ?? 0;
  const yMin = chartData.length ? Math.min(...chartData.map(p => p.close)) * 0.998 : 'auto';
  const yMax = chartData.length ? Math.max(...chartData.map(p => p.close)) * 1.002 : 'auto';
  const step = Math.max(1, Math.floor((chartData.length - 1) / 5));
  const xTicks = chartData.length
    ? [...Array(6)].map((_, i) => chartData[Math.min(i * step, chartData.length - 1)]?.t).filter(Boolean)
    : [];

  const totalAnalysts = (metrics?.analystStrongBuy ?? 0) + (metrics?.analystBuy ?? 0) +
    (metrics?.analystHold ?? 0) + (metrics?.analystSell ?? 0) + (metrics?.analystStrongSell ?? 0);
  const bullPct = totalAnalysts > 0
    ? Math.round(((metrics?.analystStrongBuy ?? 0) + (metrics?.analystBuy ?? 0)) / totalAnalysts * 100)
    : 0;
  const consensus = consensusFromKey(metrics?.recommendationKey);

  // Annual revenue bar chart data
  const revenueData = metrics?.annualRevenue?.slice(-4) ?? [];
  const incomeData  = metrics?.annualNetIncome?.slice(-4) ?? [];

  return (
    <div className="min-h-screen bg-background text-slate-200">
      <div className="max-w-screen-xl mx-auto px-4 py-6">

        {/* ── Header ─────────────────────────────────────────────── */}
        <header className="flex items-start gap-4 mb-5">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border text-sm text-slate-300 hover:opacity-80 transition-opacity shrink-0 mt-0.5"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-baseline gap-2">
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">{displayName}</h1>
              <span className="text-sm text-muted-foreground font-mono">{symbol.replace('^', '')}</span>
              {(metrics?.exchange || metrics?.sector) && (
                <div className="flex gap-2 flex-wrap">
                  {metrics?.exchange && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-accent/15 text-accent">
                      {metrics.exchange}
                    </span>
                  )}
                  {metrics?.sector && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground">
                      {metrics.sector}
                    </span>
                  )}
                </div>
              )}
            </div>
            {metrics?.industry && (
              <p className="text-xs text-muted-foreground mt-0.5">{metrics.industry}</p>
            )}
          </div>
        </header>

        {/* ── Price Hero ─────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card p-5 mb-4">
          {chartLoading && currentPrice.price === 0 ? (
            <div className="animate-pulse flex gap-4 items-start">
              <div><Skeleton className="h-9 w-40 mb-2" /><Skeleton className="h-4 w-28" /></div>
            </div>
          ) : (
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-4xl font-bold text-slate-100 tracking-tight tabular-nums">
                  {formatPrice(currentPrice.price)}
                  {metrics?.currency && <span className="text-lg text-muted-foreground font-normal ml-2">{metrics.currency}</span>}
                </p>
                <p className={`text-base mt-1 font-semibold ${colorClass(currentPrice.changePct)}`}>
                  {currentPrice.change >= 0 ? '+' : ''}{formatPrice(currentPrice.change)}&nbsp;
                  ({formatPercent(currentPrice.changePct)})
                  <span className="text-slate-500 font-normal text-sm ml-2">today</span>
                </p>
                {metrics?.postMarketPrice && metrics.postMarketPrice > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    After hours: <span className="text-slate-300 font-medium">{formatPrice(metrics.postMarketPrice)}</span>
                    <span className={`ml-2 ${(metrics.postMarketChangePercent ?? 0) >= 0 ? 'text-up' : 'text-down'}`}>
                      ({formatPercent(metrics.postMarketChangePercent ?? 0)})
                    </span>
                  </p>
                )}
              </div>
              {metrics?.marketCap && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-0.5">Market Cap</p>
                  <p className="text-xl font-bold text-slate-100">{formatMarketCap(metrics.marketCap)}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Chart ──────────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card p-5 mb-4">
          <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
            {RANGES.map((r, i) => (
              <button key={r.label} onClick={() => setActiveRange(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                  activeRange === i ? 'bg-up text-white shadow-[0_0_12px_rgba(34,197,94,0.25)]' : 'bg-muted text-slate-400 hover:text-slate-200'
                }`}>
                {r.label}
              </button>
            ))}
          </div>

          {chartLoading ? (
            <Skeleton className="h-64" />
          ) : chartData.length < 2 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No data for this range</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={gradColor} stopOpacity={0.28} />
                    <stop offset="95%" stopColor={gradColor} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="t" ticks={xTicks} stroke="var(--border)" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis stroke="var(--border)" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                  tickFormatter={v => formatPrice(v)} domain={[yMin, yMax]} width={76} />
                <Tooltip
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'var(--muted-foreground)', marginBottom: 4 }}
                  formatter={(v: number) => [formatPrice(v), 'Price']} />
                <Area type="monotone" dataKey="close" stroke={gradColor} strokeWidth={2}
                  fill={`url(#${gradId})`} dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}

          <div className="grid grid-cols-3 gap-3 mt-4">
            {[['Range High', high, 'text-up'], ['Range Low', low, 'text-down'], ['Range Open', open, 'text-slate-200']].map(([label, value, accent]) => (
              <div key={label as string} className="rounded-lg bg-muted p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                {chartLoading
                  ? <Skeleton className="h-4 w-16 mx-auto" />
                  : <p className={`text-sm font-bold ${accent}`}>{value ? formatPrice(value as number) : '—'}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* ── Key Metrics Grid ───────────────────────────────────── */}
        {(metricsLoading || metrics) && (
          <div className="rounded-xl border border-border bg-card p-5 mb-4">
            <h2 className="text-sm font-semibold text-slate-100 mb-4 uppercase tracking-wide">Key Metrics</h2>
            {metricsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[...Array(12)].map((_, i) => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : metrics ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <MetricCell label="P/E Ratio"        value={fmtNum(metrics.pe, 1)}    sub={`Fwd: ${fmtNum(metrics.forwardPE, 1)}`} />
                <MetricCell label="EPS (TTM)"        value={metrics.eps != null ? `$${fmtNum(metrics.eps)}` : '—'} sub={`Fwd: ${metrics.epsForward != null ? `$${fmtNum(metrics.epsForward)}` : '—'}`} />
                <MetricCell label="Revenue"          value={fmtMoney(metrics.revenue)}  sub={metrics.revenueGrowth != null ? `YoY ${fmtPct(metrics.revenueGrowth)}` : undefined} />
                <MetricCell label="Net Income"       value={fmtMoney(metrics.netIncome)} />
                <MetricCell label="Gross Margin"     value={fmtPct(metrics.grossMargin)} sub={`Op: ${fmtPct(metrics.operatingMargin)}`} />
                <MetricCell label="Net Margin"       value={fmtPct(metrics.netMargin)} />
                <MetricCell label="Free Cash Flow"   value={fmtMoney(metrics.freeCashFlow)} />
                <MetricCell label="EBITDA"           value={fmtMoney(metrics.ebitda)} />
                <MetricCell label="P/S Ratio"        value={fmtNum(metrics.ps, 1)}   sub={`P/B: ${fmtNum(metrics.pb, 1)}`} />
                <MetricCell label="PEG Ratio"        value={fmtNum(metrics.peg, 2)} />
                <MetricCell label="ROE"              value={fmtPct(metrics.roe)}    sub={`ROA: ${fmtPct(metrics.roa)}`} />
                <MetricCell label="Debt / Equity"    value={fmtNum(metrics.debtToEquity, 1)} sub={`Current R: ${fmtNum(metrics.currentRatio, 1)}`} />
                <MetricCell label="Beta"             value={fmtNum(metrics.beta)} />
                <MetricCell label="52W High"         value={metrics.week52High ? formatPrice(metrics.week52High) : '—'} sub={metrics.week52Low ? `Low: ${formatPrice(metrics.week52Low)}` : undefined} />
                {metrics.employees ? <MetricCell label="Employees" value={metrics.employees.toLocaleString()} /> : null}
                {metrics.evToEbitda ? <MetricCell label="EV/EBITDA" value={fmtNum(metrics.evToEbitda, 1)} sub={`EV/Rev: ${fmtNum(metrics.evToRevenue, 1)}`} /> : null}
              </div>
            ) : null}
          </div>
        )}

        {/* ── Analyst + AI Scores row ────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Analyst Coverage */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-slate-100 mb-4 uppercase tracking-wide">Analyst Coverage</h2>
            {metricsLoading ? (
              <div className="space-y-3"><Skeleton className="h-8" /><Skeleton className="h-4" /><Skeleton className="h-4" /></div>
            ) : metrics && totalAnalysts > 0 ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`px-4 py-2 rounded-xl border text-sm font-bold ${signalBg(consensus.signal)}`}>
                    <span className={signalColor(consensus.signal)}>{consensus.label}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{totalAnalysts} analysts</div>
                  {metrics.targetMean && (
                    <div className="ml-auto text-right">
                      <p className="text-xs text-muted-foreground">Avg Target</p>
                      <p className="text-base font-bold text-slate-100">{formatPrice(metrics.targetMean)}</p>
                      {currentPrice.price > 0 && (
                        <p className={`text-xs font-medium ${metrics.targetMean > currentPrice.price ? 'text-up' : 'text-down'}`}>
                          {metrics.targetMean > currentPrice.price ? '▲' : '▼'}
                          {' '}{Math.abs(((metrics.targetMean - currentPrice.price) / currentPrice.price) * 100).toFixed(1)}% upside
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {/* Rating bar */}
                <div className="flex h-2.5 rounded-full overflow-hidden mb-3 gap-0.5">
                  {[
                    { v: metrics.analystStrongBuy, c: 'bg-up' },
                    { v: metrics.analystBuy, c: 'bg-up/60' },
                    { v: metrics.analystHold, c: 'bg-yellow-400/70' },
                    { v: metrics.analystSell, c: 'bg-down/60' },
                    { v: metrics.analystStrongSell, c: 'bg-down' },
                  ].filter(x => (x.v ?? 0) > 0).map((x, i) => (
                    <div key={i} className={`h-full rounded-sm ${x.c}`} style={{ flex: x.v }} />
                  ))}
                </div>
                <div className="grid grid-cols-5 gap-1 text-center text-xs">
                  {[
                    ['Str Buy', metrics.analystStrongBuy, 'text-up'],
                    ['Buy',     metrics.analystBuy,       'text-up'],
                    ['Hold',    metrics.analystHold,      'text-yellow-400'],
                    ['Sell',    metrics.analystSell,      'text-down'],
                    ['Str Sell',metrics.analystStrongSell,'text-down'],
                  ].map(([label, val, cls]) => (
                    <div key={label as string}>
                      <p className={`font-bold text-sm ${cls}`}>{val ?? 0}</p>
                      <p className="text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
                {(metrics.targetLow || metrics.targetHigh) && (
                  <div className="flex justify-between text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                    <span>Low: <span className="text-slate-300">{metrics.targetLow ? formatPrice(metrics.targetLow) : '—'}</span></span>
                    <span>Median: <span className="text-slate-300">{metrics.targetMedian ? formatPrice(metrics.targetMedian) : '—'}</span></span>
                    <span>High: <span className="text-slate-300">{metrics.targetHigh ? formatPrice(metrics.targetHigh) : '—'}</span></span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No analyst coverage data available for this symbol.</p>
            )}
          </div>

          {/* AI Scores */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">AI Quality Scores</h2>
              {aiScores && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Overall</span>
                  <span className={`text-2xl font-black ${aiScores.overall >= 70 ? 'text-up' : aiScores.overall >= 45 ? 'text-yellow-400' : 'text-down'}`}>
                    {aiScores.overall}
                  </span>
                </div>
              )}
            </div>
            {metricsLoading ? (
              <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-6" />)}</div>
            ) : aiScores ? (
              <div className="space-y-3.5">
                <ScoreBar label="Growth"            value={aiScores.growth} />
                <ScoreBar label="Profitability"     value={aiScores.profitability} />
                <ScoreBar label="Financial Strength" value={aiScores.strength} />
                <ScoreBar label="Valuation"         value={aiScores.valuation} />
                <ScoreBar label="Momentum"          value={aiScores.momentum} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Insufficient financial data to compute AI scores.</p>
            )}
            <p className="text-[10px] text-muted-foreground mt-4">Algorithmic scores from financial metrics. Not investment advice.</p>
          </div>
        </div>

        {/* ── Investment Analysis ────────────────────────────────── */}
        {(metricsLoading || metrics || RECOMMENDATIONS[symbol]) && (
          <div className="rounded-xl border border-border bg-card p-5 mb-4">
            <div className="flex items-center gap-2 mb-5">
              <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">Investment Analysis</h2>
              <span className="text-xs text-muted-foreground">— algorithmic, not financial advice</span>
            </div>

            {metricsLoading && !analysis ? (
              <div className="space-y-3">
                <Skeleton className="h-16" />
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Skeleton className="h-32" /><Skeleton className="h-32" />
                </div>
                <Skeleton className="h-12 mt-3" />
              </div>
            ) : analysis ? (
              <>
                {/* Investment Thesis */}
                <div className="rounded-lg bg-muted/50 border border-border p-4 mb-5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Investment Thesis</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{analysis.thesis}</p>
                </div>

                {/* Bull / Bear columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  {/* Bull Case */}
                  <div className="rounded-lg border border-up/20 bg-up/5 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp size={14} className="text-up" />
                      <p className="text-xs font-bold text-up uppercase tracking-widest">Bull Case</p>
                    </div>
                    <ul className="space-y-2">
                      {analysis.bullCase.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                          <span className="text-up mt-0.5 shrink-0">▲</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Bear Case */}
                  <div className="rounded-lg border border-down/20 bg-down/5 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingDown size={14} className="text-down" />
                      <p className="text-xs font-bold text-down uppercase tracking-widest">Bear Case</p>
                    </div>
                    <ul className="space-y-2">
                      {analysis.bearCase.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                          <span className="text-down mt-0.5 shrink-0">▼</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Valuation Verdict */}
                <div className="rounded-lg bg-muted/50 border border-border p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Valuation Verdict</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                      analysis.valuation.verdict === 'Undervalued' ? 'bg-up/10 border-up/25 text-up' :
                      analysis.valuation.verdict === 'Fairly Valued' ? 'bg-yellow-400/10 border-yellow-400/25 text-yellow-400' :
                      analysis.valuation.verdict === 'Slightly Overvalued' ? 'bg-orange-400/10 border-orange-400/25 text-orange-400' :
                      analysis.valuation.verdict === 'Overvalued' ? 'bg-down/10 border-down/25 text-down' :
                      'bg-purple-400/10 border-purple-400/25 text-purple-400'
                    }`}>{analysis.valuation.verdict}</span>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{analysis.valuation.reasoning}</p>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ── Annual Financial Snapshot ──────────────────────────── */}
        {revenueData.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5 mb-4">
            <h2 className="text-sm font-semibold text-slate-100 mb-4 uppercase tracking-wide">Annual Financials</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'Revenue', data: revenueData, color: 'var(--accent)' },
                { title: 'Net Income', data: incomeData, color: incomeData.some(d => d.value < 0) ? 'var(--down)' : 'var(--up)' },
              ].map(({ title, data, color }) => data.length > 0 && (
                <div key={title}>
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">{title}</p>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                      <XAxis dataKey="date" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis hide domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11 }}
                        formatter={(v: number) => [fmtMoney(v), title]}
                        labelStyle={{ color: 'var(--muted-foreground)' }}
                      />
                      <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                        {data.map((d, i) => (
                          <Cell key={i} fill={d.value < 0 ? 'var(--down)' : color} fillOpacity={0.8} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── About / Description ────────────────────────────────── */}
        {description && (
          <div className="rounded-xl border border-border bg-card p-5 mb-4">
            <div className="flex items-start justify-between gap-4 mb-3">
              <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">About {displayName}</h2>
              <div className="flex gap-3 shrink-0">
                {metrics?.website && (
                  <a href={metrics.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-accent hover:underline">
                    <Globe size={12} /> Website
                  </a>
                )}
              </div>
            </div>
            <p className={`text-sm text-slate-400 leading-relaxed ${!showFullDesc && description.length > 400 ? 'line-clamp-4' : ''}`}>
              {description}
            </p>
            {description.length > 400 && (
              <button onClick={() => setShowFullDesc(v => !v)} className="text-xs text-accent mt-2 hover:underline">
                {showFullDesc ? 'Show less' : 'Show more'}
              </button>
            )}
            {(metrics?.sector || metrics?.industry || metrics?.employees || metrics?.country) && (
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
                {metrics.sector    && <span className="flex items-center gap-1"><Building2 size={11} /> {metrics.sector}</span>}
                {metrics.industry  && <span>{metrics.industry}</span>}
                {metrics.employees && <span className="flex items-center gap-1"><Users size={11} /> {metrics.employees.toLocaleString()} employees</span>}
                {metrics.country   && <span className="flex items-center gap-1"><Globe size={11} /> {metrics.country}</span>}
              </div>
            )}
          </div>
        )}

        {/* ── Market Outlook ─────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">Market Outlook</h2>
            <span className="text-xs text-muted-foreground">— educational only, not financial advice</span>
          </div>

          {analysis ? (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {([
                  { period: 'Short Term', data: analysis.shortTerm },
                  { period: 'Long Term',  data: analysis.longTerm  },
                ] as const).map(({ period, data }) => (
                  <div key={period} className={`rounded-xl border p-4 ${outlookBg(data.signal)}`}>
                    <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">{period}</p>
                    <div className="flex items-center gap-2 mb-2">
                      {(data.signal === 'Bullish' || data.signal === 'Cautiously Bullish')
                        ? <TrendingUp size={16} className="text-up" />
                        : (data.signal === 'Bearish' || data.signal === 'Cautiously Bearish')
                          ? <TrendingDown size={16} className="text-down" />
                          : <Minus size={16} className="text-yellow-400" />}
                      <p className={`text-sm font-bold ${outlookColor(data.signal)}`}>{data.signal}</p>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{data.text}</p>
                  </div>
                ))}
              </div>
              {(analysis.catalysts.length > 0 || analysis.risks.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                  {analysis.catalysts.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Key Catalysts</p>
                      <ul className="space-y-1.5">
                        {analysis.catalysts.map((c, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                            <span className="text-up shrink-0 mt-0.5">→</span><span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysis.risks.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Key Risks</p>
                      <ul className="space-y-1.5">
                        {analysis.risks.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                            <span className="text-down shrink-0 mt-0.5">→</span><span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[['Long Term', rec.longTerm], ['Short Term', rec.shortTerm]].map(([period, signal]) => (
                  <div key={period as string} className={`rounded-xl border p-4 ${signalBg(signal as Signal)}`}>
                    <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">{period}</p>
                    <div className="flex items-center gap-2">
                      {(signal === 'strong-buy' || signal === 'buy') ? <TrendingUp size={16} className="text-up" /> :
                       (signal === 'strong-sell' || signal === 'sell') ? <TrendingDown size={16} className="text-down" /> :
                       <Minus size={16} className="text-yellow-400" />}
                      <p className={`text-sm font-bold ${signalColor(signal as Signal)}`}>{signalLabel(signal as Signal)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-slate-400 leading-relaxed">{rec.reasoning}</p>
              </div>
            </>
          )}
        </div>

        <footer className="text-center text-xs text-muted-foreground py-4 border-t border-border">
          Data via Yahoo Finance · Not financial advice · {new Date().toLocaleDateString()}
        </footer>
      </div>
    </div>
  );
}
