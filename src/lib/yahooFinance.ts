import { StockQuote, PricePoint, SectorData, EarningsReport } from '../types';


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
};

export const INDICES = ['^GSPC', '^IXIC', '^DJI', '^RUT', '^VIX', '^TNX'];
export const SECTOR_ETFS = ['XLK','XLF','XLE','XLV','XLY','XLP','XLI','XLB','XLU','XLRE','XLC'];
export const COMMODITIES = ['GLD','SLV','USO','UNG','COPX','XME','WEAT','CORN','SOYB','WOOD','LIT'];

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

export async function fetchTopMovers(): Promise<{ gainers: StockQuote[]; losers: StockQuote[]; active: StockQuote[] }> {
  const fetchScreener = async (scrId: string): Promise<StockQuote[]> => {
    try {
      const data = await yfGet(
        '/v1/finance/screener/predefined/saved', '1',
        { scrIds: scrId, count: '20', formatted: 'false' }
      );
      const quotes: any[] = data?.finance?.result?.[0]?.quotes ?? [];
      return quotes.map((q: any) => ({
        symbol: q.symbol ?? '',
        name: q.longName || q.shortName || q.symbol || '',
        price: q.regularMarketPrice ?? 0,
        change: q.regularMarketChange ?? 0,
        changePercent: q.regularMarketChangePercent ?? 0,
        volume: q.regularMarketVolume ?? 0,
        marketCap: q.marketCap,
      }));
    } catch {
      return [];
    }
  };

  const [gainers, losers, active] = await Promise.all([
    fetchScreener('day_gainers'),
    fetchScreener('day_losers'),
    fetchScreener('most_actives'),
  ]);
  return { gainers, losers, active };
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
