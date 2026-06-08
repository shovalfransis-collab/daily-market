export interface PricePoint {
  date: string;
  close: number;
}

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  eps?: number;
  peRatio?: number;
  revenue?: number;
  netIncome?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  sector?: string;
  history?: PricePoint[];
}

export interface SectorData {
  name: string;
  etf: string;
  changePercent: number;
}

export interface EarningsReport {
  symbol: string;
  name: string;
  epsActual?: number;
  epsEstimate?: number;
  revActual?: number;
  revEstimate?: number;
  surprisePercent?: number;
  reportTime?: string;
}

export interface NewsletterSummary {
  headline: string;
  marketMood: 'bullish' | 'bearish' | 'neutral';
  keyPoints: string[];
  marketAnalysis: string;
}

export interface MarketSummary {
  date: string;
  indices: StockQuote[];
  sectors: SectorData[];
  commodities: StockQuote[];
  topGainers: StockQuote[];
  topLosers: StockQuote[];
  mostActive: StockQuote[];
  earnings: EarningsReport[];
  summary: NewsletterSummary;
}
