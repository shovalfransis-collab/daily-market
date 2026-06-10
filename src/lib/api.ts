import { MarketSummary } from '../types';
import {
  INDICES, SECTOR_ETFS, COMMODITIES,
  fetchBatch, fetchTopMovers, fetchEarningsToday,
  buildSectors, labelCommodities, fetchForex,
} from './yahooFinance';
import { generateSummary } from './summaryGenerator';

export async function fetchNewsletter(): Promise<MarketSummary> {
  const [indexQuotes, sectorQuotes, commodityQuotes, movers, earnings, currencies] = await Promise.all([
    fetchBatch(INDICES, true),
    fetchBatch(SECTOR_ETFS, false),
    fetchBatch(COMMODITIES, false),
    fetchTopMovers(),
    fetchEarningsToday(),
    fetchForex(),
  ]);

  const data = {
    date: new Date().toISOString(),
    indices: indexQuotes,
    sectors: buildSectors(sectorQuotes),
    commodities: labelCommodities(commodityQuotes),
    currencies,
    topGainers: movers.gainers.slice(0, 10),
    topLosers: movers.losers.slice(0, 10),
    mostActive: movers.active.slice(0, 10),
    earnings,
  };

  return { ...data, summary: generateSummary(data) };
}

export { fetchNewsletter as refreshNewsletter };
