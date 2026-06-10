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

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
  sector?: string;
  score?: number;
}

export interface FinancialMetrics {
  // Valuation
  marketCap?: number;
  enterpriseValue?: number;
  pe?: number;
  forwardPE?: number;
  peg?: number;
  ps?: number;
  pb?: number;
  evToRevenue?: number;
  evToEbitda?: number;
  eps?: number;
  epsForward?: number;
  bookValue?: number;
  beta?: number;
  // Growth & profitability
  revenue?: number;
  revenueGrowth?: number;
  grossProfit?: number;
  ebitda?: number;
  netIncome?: number;
  freeCashFlow?: number;
  grossMargin?: number;
  operatingMargin?: number;
  netMargin?: number;
  roe?: number;
  roa?: number;
  // Balance sheet
  debtToEquity?: number;
  currentRatio?: number;
  // 52-week
  week52High?: number;
  week52Low?: number;
  // Profile
  description?: string;
  sector?: string;
  industry?: string;
  website?: string;
  employees?: number;
  country?: string;
  currency?: string;
  exchange?: string;
  longName?: string;
  shortName?: string;
  // Analyst
  targetLow?: number;
  targetMean?: number;
  targetHigh?: number;
  targetMedian?: number;
  recommendationKey?: string;
  analystStrongBuy?: number;
  analystBuy?: number;
  analystHold?: number;
  analystSell?: number;
  analystStrongSell?: number;
  // Post-market
  postMarketPrice?: number;
  postMarketChangePercent?: number;
  // Historical annual data
  annualRevenue?: { date: string; value: number }[];
  annualNetIncome?: { date: string; value: number }[];
  annualFreeCashFlow?: { date: string; value: number }[];
}

export interface AIScores {
  growth: number;
  profitability: number;
  strength: number;
  valuation: number;
  momentum: number;
  overall: number;
}

export interface CurrencyRate {
  pair: string;
  symbol: string;
  rate: number;
  change: number;
  changePercent: number;
  flag: string;
}

export interface MarketSummary {
  date: string;
  indices: StockQuote[];
  sectors: SectorData[];
  commodities: StockQuote[];
  currencies: CurrencyRate[];
  topGainers: StockQuote[];
  topLosers: StockQuote[];
  mostActive: StockQuote[];
  earnings: EarningsReport[];
  summary: NewsletterSummary;
}
