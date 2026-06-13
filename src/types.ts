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
  preMarketPrice?: number;
  preMarketChangePercent?: number;
  postMarketPrice?: number;
  postMarketChangePercent?: number;
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
  changePercent?: number;
  isWatchlist?: boolean;
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
  debtToEquity?: number;
  currentRatio?: number;
  week52High?: number;
  week52Low?: number;
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
  postMarketPrice?: number;
  postMarketChangePercent?: number;
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

export interface NewsItem {
  title: string;
  publisher: string;
  link: string;
  publishedAt: number;
  thumbnail?: string;
}

export interface EconomicEvent {
  event: string;
  date: string;
  time?: string;
  actual?: string;
  estimate?: string;
  prior?: string;
  impact: 'high' | 'medium' | 'low';
  country: string;
}

export interface MarketBreadth {
  advancers: number;
  decliners: number;
  sectorsUp: number;
  sectorsDown: number;
}

export interface FearGreedScore {
  score: number;
  label: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  lastUpdated: string;
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
  preMovers: StockQuote[];
  postMovers: StockQuote[];
  earnings: EarningsReport[];
  summary: NewsletterSummary;
  news: NewsItem[];
  economicEvents: EconomicEvent[];
  crypto: StockQuote[];
  breadth: MarketBreadth;
  fearGreed: FearGreedScore;
}
