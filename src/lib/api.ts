import { MarketSummary, FearGreedScore, MarketBreadth, SectorData, StockQuote } from '../types';
import {
  INDICES, SECTOR_ETFS, COMMODITIES,
  fetchBatch, fetchTopMovers, fetchEarningsToday,
  buildSectors, labelCommodities, fetchForex,
  fetchCrypto, fetchNews, fetchEconomicCalendar,
} from './yahooFinance';
import { generateSummary } from './summaryGenerator';

function computeFearGreed(indexQuotes: StockQuote[], sectors: SectorData[]): FearGreedScore {
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  const vix = indexQuotes.find(q => q.symbol === '^VIX')?.price ?? 20;
  const spChange = indexQuotes.find(q => q.symbol === '^GSPC')?.changePercent ?? 0;
  const sectorsUp = sectors.filter(s => s.changePercent > 0).length;

  const vixScore = clamp((45 - vix) / 35 * 100, 0, 100);
  const momentumScore = clamp(50 + spChange * 10, 0, 100);
  const breadthScore = (sectorsUp / 11) * 100;
  const score = Math.round(vixScore * 0.5 + momentumScore * 0.3 + breadthScore * 0.2);

  const label = score >= 75 ? 'Extreme Greed'
    : score >= 55 ? 'Greed'
    : score >= 45 ? 'Neutral'
    : score >= 25 ? 'Fear'
    : 'Extreme Fear';

  return { score, label, lastUpdated: new Date().toISOString() };
}

function dedupeBySymbol(quotes: StockQuote[]): StockQuote[] {
  const seen = new Set<string>();
  return quotes.filter(q => {
    if (seen.has(q.symbol)) return false;
    seen.add(q.symbol);
    return true;
  });
}

export async function fetchNewsletter(): Promise<MarketSummary> {
  const [indexQuotes, sectorQuotes, commodityQuotes, movers, earnings, currencies, crypto, news, economicEvents] = await Promise.all([
    fetchBatch(INDICES, true),
    fetchBatch(SECTOR_ETFS, false),
    fetchBatch(COMMODITIES, false),
    fetchTopMovers(),
    fetchEarningsToday(),
    fetchForex(),
    fetchCrypto(),
    fetchNews(),
    fetchEconomicCalendar(),
  ]);

  const sectors = buildSectors(sectorQuotes);
  let sectorsUp = 0, sectorsDown = 0;
  for (const s of sectors) s.changePercent > 0 ? sectorsUp++ : sectorsDown++;

  const breadth: MarketBreadth = {
    advancers: movers.gainersTotal,
    decliners: movers.losersTotal,
    sectorsUp,
    sectorsDown,
  };

  const fearGreed = computeFearGreed(indexQuotes, sectors);

  const allMovers = dedupeBySymbol([...movers.gainers, ...movers.losers, ...movers.active]);

  const sortByAbsPct = (key: 'preMarketChangePercent' | 'postMarketChangePercent') =>
    (a: StockQuote, b: StockQuote) => Math.abs(b[key] ?? 0) - Math.abs(a[key] ?? 0);

  const preMovers = allMovers
    .filter(q => Math.abs(q.preMarketChangePercent ?? 0) > 0)
    .sort(sortByAbsPct('preMarketChangePercent'))
    .slice(0, 10);

  const postMovers = allMovers
    .filter(q => Math.abs(q.postMarketChangePercent ?? 0) > 0)
    .sort(sortByAbsPct('postMarketChangePercent'))
    .slice(0, 10);

  const data = {
    date: new Date().toISOString(),
    indices: indexQuotes,
    sectors,
    commodities: labelCommodities(commodityQuotes),
    currencies,
    topGainers: movers.gainers.slice(0, 10),
    topLosers: movers.losers.slice(0, 10),
    mostActive: movers.active.slice(0, 10),
    preMovers,
    postMovers,
    earnings,
    crypto,
    news,
    economicEvents,
    breadth,
    fearGreed,
  };

  return { ...data, summary: generateSummary(data) };
}

