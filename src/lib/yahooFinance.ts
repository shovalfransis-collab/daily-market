import { StockQuote, PricePoint, SectorData, EarningsReport, CurrencyRate, SearchResult, FinancialMetrics, NewsItem, EconomicEvent } from '../types';


const SECTOR_MAP: Record<string, string> = {
  XLK: 'Technology', XLF: 'Financials', XLE: 'Energy', XLV: 'Health Care',
  XLY: 'Cons. Disc.', XLP: 'Cons. Staples', XLI: 'Industrials', XLB: 'Materials',
  XLU: 'Utilities', XLRE: 'Real Estate', XLC: 'Comm. Services',
};

const COMMODITY_NAMES: Record<string, string> = {
  GLD: 'Gold', SLV: 'Silver', USO: 'Crude Oil', UNG: 'Natural Gas',
  COPX: 'Copper', XME: 'Metals & Mining', WEAT: 'Wheat',
  CORN: 'Corn', SOYB: 'Soybeans', WOOD: 'Timber', LIT: 'Lithium',
};

const INDEX_NAMES: Record<string, string> = {
  '^GSPC': 'S&P 500', '^IXIC': 'NASDAQ', '^DJI': 'Dow Jones',
  '^RUT': 'Russell 2000', '^VIX': 'VIX Fear Index', '^TNX': '10Y Treasury',
  'DX-Y.NYB': 'US Dollar Index',
};

export const INDICES = ['^GSPC', '^IXIC', '^DJI', '^RUT', '^VIX', '^TNX', 'DX-Y.NYB'];

export const CRYPTO_SYMBOLS = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD'];
const CRYPTO_NAMES: Record<string, string> = {
  'BTC-USD': 'Bitcoin', 'ETH-USD': 'Ethereum', 'SOL-USD': 'Solana', 'BNB-USD': 'BNB',
};
export const SECTOR_ETFS = ['XLK','XLF','XLE','XLV','XLY','XLP','XLI','XLB','XLU','XLRE','XLC'];
export const COMMODITIES = ['GLD','SLV','USO','UNG','COPX','XME','WEAT','CORN','SOYB','WOOD','LIT'];

export const FOREX_PAIRS: { symbol: string; pair: string; flag: string }[] = [
  { symbol: 'EURUSD=X', pair: 'EUR/USD', flag: '🇪🇺' },
  { symbol: 'GBPUSD=X', pair: 'GBP/USD', flag: '🇬🇧' },
  { symbol: 'USDJPY=X', pair: 'USD/JPY', flag: '🇯🇵' },
  { symbol: 'USDCAD=X', pair: 'USD/CAD', flag: '🇨🇦' },
  { symbol: 'AUDUSD=X', pair: 'AUD/USD', flag: '🇦🇺' },
  { symbol: 'USDCHF=X', pair: 'USD/CHF', flag: '🇨🇭' },
  { symbol: 'USDCNY=X', pair: 'USD/CNY', flag: '🇨🇳' },
  { symbol: 'USDILS=X', pair: 'USD/ILS', flag: '🇮🇱' },
];

async function yfGet(path: string, host: '1' | '2' = '1', params: Record<string, string> = {}): Promise<any> {
  const qs = new URLSearchParams({ ...params, _host: host, _path: path });
  const res = await fetch(`/api/yf?${qs}`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchChart(symbol: string, range = '1d'): Promise<any> {
  const enc = encodeURIComponent(symbol);
  return yfGet(`/v8/finance/chart/${enc}`, '1', { range, interval: '1d' });
}

export async function fetchChartRange(symbol: string, range: string, interval: string): Promise<any> {
  const enc = encodeURIComponent(symbol);
  const intraday = range === '1d' || range === '5d';
  const params: Record<string, string> = { range, interval };
  if (!intraday) { params.includeAdjustedClose = 'true'; params.events = 'div,splits'; }
  return yfGet(`/v8/finance/chart/${enc}`, '1', params);
}

function parseChartQuote(sym: string, data: any): StockQuote | null {
  const result = data?.chart?.result?.[0];
  if (!result) return null;
  const meta = result.meta;
  const prev = meta.chartPreviousClose ?? meta.previousClose ?? 0;
  const price: number = meta.regularMarketPrice ?? 0;
  const change = prev ? price - prev : 0;
  const changePercent = prev ? (change / prev) * 100 : 0;
  return {
    symbol: sym,
    name: meta.longName || meta.shortName || INDEX_NAMES[sym] || COMMODITY_NAMES[sym] || sym,
    price,
    change,
    changePercent,
    volume: meta.regularMarketVolume ?? 0,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
  };
}

function parseHistory(data: any, days = 7): PricePoint[] {
  try {
    const result = data?.chart?.result?.[0];
    if (!result) return [];
    const timestamps: number[] = result.timestamp ?? [];
    const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];
    return timestamps
      .map((ts, i) => ({ date: new Date(ts * 1000).toISOString().split('T')[0], close: closes[i] ?? 0 }))
      .filter(p => p.close > 0)
      .slice(-days);
  } catch {
    return [];
  }
}

export async function fetchSymbol(sym: string, includeHistory = false): Promise<StockQuote | null> {
  try {
    const data = await fetchChart(sym, includeHistory ? '1mo' : '1d');
    const quote = parseChartQuote(sym, data);
    if (!quote) return null;
    if (includeHistory) quote.history = parseHistory(data, 7);
    return quote;
  } catch {
    return null;
  }
}

export async function fetchBatch(symbols: string[], includeHistory = false): Promise<StockQuote[]> {
  const results = await Promise.allSettled(symbols.map(s => fetchSymbol(s, includeHistory)));
  return results
    .filter((r): r is PromiseFulfilledResult<StockQuote> => r.status === 'fulfilled' && r.value !== null)
    .map(r => r.value);
}

const MOVERS_CACHE_KEY = 'md_top_movers_cache';

export async function fetchTopMovers(): Promise<{ gainers: StockQuote[]; losers: StockQuote[]; active: StockQuote[]; gainersTotal: number; losersTotal: number }> {
  const fetchScreener = async (scrId: string): Promise<{ quotes: StockQuote[]; total: number }> => {
    try {
      const data = await yfGet(
        '/v1/finance/screener/predefined/saved', '1',
        { scrIds: scrId, count: '20', formatted: 'false' }
      );
      const result = data?.finance?.result?.[0];
      const total: number = result?.total ?? 0;
      const quotes: any[] = result?.quotes ?? [];
      return {
        total,
        quotes: quotes.map((q: any) => ({
          symbol: q.symbol ?? '',
          name: q.longName || q.shortName || q.symbol || '',
          price: q.regularMarketPrice ?? 0,
          change: q.regularMarketChange ?? 0,
          changePercent: q.regularMarketChangePercent ?? 0,
          volume: q.regularMarketVolume ?? 0,
          marketCap: q.marketCap,
          preMarketPrice: q.preMarketPrice,
          preMarketChangePercent: q.preMarketChangePercent,
          postMarketPrice: q.postMarketPrice,
          postMarketChangePercent: q.postMarketChangePercent,
        })),
      };
    } catch {
      return { quotes: [], total: 0 };
    }
  };

  const [g, l, a] = await Promise.all([
    fetchScreener('day_gainers'),
    fetchScreener('day_losers'),
    fetchScreener('most_actives'),
  ]);
  const gainers = g.quotes;
  const losers = l.quotes;
  const active = a.quotes;

  if (gainers.length > 0 && losers.length > 0) {
    try {
      localStorage.setItem(MOVERS_CACHE_KEY, JSON.stringify({ gainers, losers, active, gainersTotal: g.total, losersTotal: l.total, ts: Date.now() }));
    } catch {}
    return { gainers, losers, active, gainersTotal: g.total, losersTotal: l.total };
  }

  try {
    const raw = localStorage.getItem(MOVERS_CACHE_KEY);
    if (raw) {
      const cached = JSON.parse(raw);
      return {
        gainers: cached.gainers ?? [],
        losers: cached.losers ?? [],
        active: cached.active ?? [],
        gainersTotal: cached.gainersTotal ?? 0,
        losersTotal: cached.losersTotal ?? 0,
      };
    }
  } catch {}

  return { gainers, losers, active, gainersTotal: g.total, losersTotal: l.total };
}

export async function fetchCrypto(): Promise<StockQuote[]> {
  const quotes = await fetchBatch(CRYPTO_SYMBOLS, false);
  return quotes.map(q => ({ ...q, name: CRYPTO_NAMES[q.symbol] || q.name }));
}

export async function fetchNews(): Promise<NewsItem[]> {
  const parseItems = (items: any[]): NewsItem[] =>
    items.map((n: any) => ({
      title: n.title ?? '',
      publisher: n.publisher ?? '',
      link: n.link ?? '',
      publishedAt: n.providerPublishTime ?? 0,
      thumbnail: n.thumbnail?.resolutions?.[0]?.url,
    })).filter(n => n.title);

  try {
    // Fetch top market stories via S&P 500 and NASDAQ symbols — these return YF's actual top headlines
    const [spData, ndxData] = await Promise.all([
      yfGet('/v1/finance/search', '1', { q: '^GSPC', newsCount: '8', quotesCount: '0', enableNavLinks: 'false' }),
      yfGet('/v1/finance/search', '1', { q: '^IXIC', newsCount: '8', quotesCount: '0', enableNavLinks: 'false' }),
    ]);

    const seen = new Set<string>();
    const combined: NewsItem[] = [];
    for (const item of [...parseItems(spData?.news ?? []), ...parseItems(ndxData?.news ?? [])]) {
      if (!seen.has(item.title)) {
        seen.add(item.title);
        combined.push(item);
      }
    }

    if (combined.length >= 4) return combined.slice(0, 12);
  } catch {}

  // fallback
  try {
    const data = await yfGet('/v1/finance/search', '1', {
      q: 'stock market',
      newsCount: '12',
      quotesCount: '0',
      enableNavLinks: 'false',
    });
    return parseItems(data?.news ?? []);
  } catch {
    return [];
  }
}

export async function fetchEconomicCalendar(): Promise<EconomicEvent[]> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const data = await yfGet('/v1/finance/calendar/economic', '1', { date: today });
    const events: any[] = data?.finance?.result ?? [];
    return events.slice(0, 12).map((e: any) => ({
      event: e.eventName ?? e.event ?? '',
      date: e.date ?? today,
      time: e.time,
      actual: e.actual,
      estimate: e.estimate,
      prior: e.prior,
      impact: (['HIGH', 'high', '3'].includes(String(e.importance))
        ? 'high'
        : ['MEDIUM', 'medium', '2'].includes(String(e.importance))
        ? 'medium'
        : 'low') as 'high' | 'medium' | 'low',
      country: e.country ?? 'US',
    })).filter(e => e.event);
  } catch {
    return [];
  }
}

export async function fetchEarningsToday(): Promise<EarningsReport[]> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const data = await yfGet('/v1/finance/earning_releases', '2', { date: today, size: '20' });
    const items: any[] = data?.finance?.result?.[0]?.earningRelease ?? [];
    return items.slice(0, 15).map((e: any) => {
      const epsActual = e.epsActual?.raw;
      const epsEstimate = e.epsEstimate?.raw;
      const surprise =
        epsActual !== undefined && epsEstimate !== undefined && epsEstimate !== 0
          ? ((epsActual - epsEstimate) / Math.abs(epsEstimate)) * 100
          : undefined;
      return {
        symbol: e.ticker ?? '',
        name: e.companyShortName ?? e.ticker ?? '',
        epsActual,
        epsEstimate,
        revActual: e.revenueActual?.raw,
        revEstimate: e.revenueEstimate?.raw,
        surprisePercent: surprise,
        reportTime: e.startdatetimetype,
      };
    });
  } catch {
    return [];
  }
}

export function buildSectors(quotes: StockQuote[]): SectorData[] {
  return quotes.map(q => ({
    name: SECTOR_MAP[q.symbol] || q.symbol,
    etf: q.symbol,
    changePercent: q.changePercent,
  }));
}

export function labelCommodities(quotes: StockQuote[]): StockQuote[] {
  return quotes.map(q => ({ ...q, name: COMMODITY_NAMES[q.symbol] || q.name }));
}

export async function searchYahoo(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  try {
    const data = await yfGet('/v1/finance/search', '1', {
      q: query,
      quotesCount: '10',
      newsCount: '0',
      enableFuzzyQuery: 'true',
      enableNavLinks: 'false',
    });
    const quotes: any[] = data?.quotes ?? [];
    return quotes
      .filter(q => q.symbol && q.quoteType !== 'OPTION')
      .map(q => ({
        symbol: q.symbol,
        name: q.longname || q.shortname || q.symbol,
        exchange: q.exchDisp || q.exchange || '',
        type: q.quoteType || 'EQUITY',
        score: q.score,
      }));
  } catch {
    return [];
  }
}

const QS_MODULES = [
  'financialData',
  'defaultKeyStatistics',
  'summaryProfile',
  'recommendationTrend',
  'earningsTrend',
  'incomeStatementHistory',
  'balanceSheetHistory',
  'cashflowStatementHistory',
  'price',
].join(',');

export async function fetchQuoteSummary(symbol: string): Promise<FinancialMetrics | null> {
  try {
    const enc = encodeURIComponent(symbol);
    const data = await yfGet(`/v11/finance/quoteSummary/${enc}`, '1', { modules: QS_MODULES });
    const r = data?.quoteSummary?.result?.[0];
    if (!r) return null;

    const fd = r.financialData ?? {};
    const ks = r.defaultKeyStatistics ?? {};
    const sp = r.summaryProfile ?? {};
    const rt = r.recommendationTrend?.trend?.[0] ?? {};
    const et = r.earningsTrend?.trend ?? [];
    const pr = r.price ?? {};

    const raw = (obj: any, key: string): number | undefined => {
      const v = obj?.[key]?.raw;
      return v != null ? v : undefined;
    };

    // annual income statement history
    const isHistory = r.incomeStatementHistory?.incomeStatementHistory ?? [];
    const cfHistory = r.cashflowStatementHistory?.cashflowStatements ?? [];

    const annualRevenue = isHistory
      .map((s: any) => ({ date: s.endDate?.fmt ?? '', value: raw(s, 'totalRevenue') ?? 0 }))
      .filter((x: any) => x.value)
      .reverse();

    const annualNetIncome = isHistory
      .map((s: any) => ({ date: s.endDate?.fmt ?? '', value: raw(s, 'netIncome') ?? 0 }))
      .filter((x: any) => x.date)
      .reverse();

    const annualFreeCashFlow = cfHistory
      .map((s: any) => ({ date: s.endDate?.fmt ?? '', value: raw(s, 'totalCashFromOperatingActivities') ?? 0 }))
      .filter((x: any) => x.date)
      .reverse();

    // analyst price target from earningsTrend
    const nextEarnings = et.find((t: any) => t.period === '+1y') ?? et[0] ?? {};

    return {
      marketCap: raw(pr, 'marketCap'),
      enterpriseValue: raw(ks, 'enterpriseValue'),
      pe: raw(ks, 'trailingPE') ?? raw(pr, 'trailingPE'),
      forwardPE: raw(ks, 'forwardPE'),
      peg: raw(ks, 'pegRatio'),
      ps: raw(ks, 'priceToSalesTrailing12Months'),
      pb: raw(ks, 'priceToBook'),
      evToRevenue: raw(ks, 'enterpriseToRevenue'),
      evToEbitda: raw(ks, 'enterpriseToEbitda'),
      eps: raw(ks, 'trailingEps'),
      epsForward: raw(ks, 'forwardEps'),
      bookValue: raw(ks, 'bookValue'),
      beta: raw(ks, 'beta'),
      week52High: raw(ks, 'fiftyTwoWeekHigh') ?? raw(pr, 'fiftyTwoWeekHigh'),
      week52Low: raw(ks, 'fiftyTwoWeekLow') ?? raw(pr, 'fiftyTwoWeekLow'),
      // Income
      revenue: raw(fd, 'totalRevenue'),
      revenueGrowth: raw(fd, 'revenueGrowth'),
      grossProfit: raw(fd, 'grossProfits'),
      ebitda: raw(fd, 'ebitda'),
      netIncome: raw(fd, 'netIncomeToCommon'),
      freeCashFlow: raw(fd, 'freeCashflow'),
      grossMargin: raw(fd, 'grossMargins'),
      operatingMargin: raw(fd, 'operatingMargins'),
      netMargin: raw(fd, 'profitMargins'),
      roe: raw(fd, 'returnOnEquity'),
      roa: raw(fd, 'returnOnAssets'),
      debtToEquity: raw(fd, 'debtToEquity'),
      currentRatio: raw(fd, 'currentRatio'),
      // Profile
      description: sp.longBusinessSummary,
      sector: sp.sector,
      industry: sp.industry,
      website: sp.website,
      employees: sp.fullTimeEmployees,
      country: sp.country,
      currency: pr.currency,
      exchange: pr.exchangeName,
      longName: pr.longName,
      shortName: pr.shortName,
      // Analyst
      targetLow: raw(fd, 'targetLowPrice'),
      targetMean: raw(fd, 'targetMeanPrice'),
      targetHigh: raw(fd, 'targetHighPrice'),
      targetMedian: raw(fd, 'targetMedianPrice'),
      recommendationKey: fd.recommendationKey,
      analystStrongBuy: rt.strongBuy,
      analystBuy: rt.buy,
      analystHold: rt.hold,
      analystSell: rt.sell,
      analystStrongSell: rt.strongSell,
      // Post-market
      postMarketPrice: raw(pr, 'postMarketPrice'),
      postMarketChangePercent: raw(pr, 'postMarketChangePercent'),
      // Historical
      annualRevenue,
      annualNetIncome,
      annualFreeCashFlow,
    };
  } catch {
    return null;
  }
}

export async function fetchForex(): Promise<CurrencyRate[]> {
  const symbols = FOREX_PAIRS.map(p => p.symbol);
  const quotes = await fetchBatch(symbols, false);
  return quotes
    .map(q => {
      const meta = FOREX_PAIRS.find(p => p.symbol === q.symbol);
      if (!meta || !q.price) return null;
      return {
        pair: meta.pair,
        symbol: q.symbol,
        rate: q.price,
        change: q.change,
        changePercent: q.changePercent,
        flag: meta.flag,
      } as CurrencyRate;
    })
    .filter((c): c is CurrencyRate => c !== null);
}
