import { MarketSummary, NewsletterSummary, SectorData } from '../types';

function sign(n: number) { return n >= 0 ? '+' : ''; }
function fmt(n: number, d = 2) { return n.toFixed(d); }

export function generateSummary(data: Omit<MarketSummary, 'summary'>): NewsletterSummary {
  const sp500 = data.indices.find(i => i.symbol === '^GSPC');
  const nasdaq = data.indices.find(i => i.symbol === '^IXIC');
  const vix = data.indices.find(i => i.symbol === '^VIX');
  const treasury = data.indices.find(i => i.symbol === '^TNX');

  const spChange = sp500?.changePercent ?? 0;
  const marketMood: 'bullish' | 'bearish' | 'neutral' =
    spChange > 0.5 ? 'bullish' : spChange < -0.5 ? 'bearish' : 'neutral';

  const sortedSectors = [...data.sectors].sort((a, b) => b.changePercent - a.changePercent);
  const sectorLeader = sortedSectors[0];
  const sectorLaggard = sortedSectors[sortedSectors.length - 1];

  // Headline
  const verb = spChange > 0 ? 'rises' : spChange < 0 ? 'falls' : 'holds flat';
  const driver = sectorLeader
    ? `${sectorLeader.name} leads ${sectorLeader.changePercent >= 0 ? 'gains' : 'declines'}`
    : 'broad market movement';
  const headline = sp500
    ? `S&P 500 ${verb} ${Math.abs(spChange).toFixed(2)}% — ${driver}`
    : 'Market update unavailable';

  // Key points
  const keyPoints: string[] = [];
  const topGainer = data.topGainers[0];
  if (topGainer) keyPoints.push(`Top gainer: ${topGainer.symbol} (${topGainer.name}) ${sign(topGainer.changePercent)}${fmt(topGainer.changePercent)}%`);
  const topLoser = data.topLosers[0];
  if (topLoser) keyPoints.push(`Biggest decliner: ${topLoser.symbol} (${topLoser.name}) ${fmt(topLoser.changePercent)}%`);
  if (sectorLeader) keyPoints.push(`Best sector: ${sectorLeader.name} (${sectorLeader.etf}) ${sign(sectorLeader.changePercent)}${fmt(sectorLeader.changePercent)}%`);
  if (sectorLaggard) keyPoints.push(`Worst sector: ${sectorLaggard.name} (${sectorLaggard.etf}) ${fmt(sectorLaggard.changePercent)}%`);
  if (vix) {
    const label = vix.price > 30 ? 'elevated fear' : vix.price > 20 ? 'moderate caution' : 'low volatility';
    keyPoints.push(`VIX at ${fmt(vix.price, 1)} — ${label}`);
  }
  if (treasury) keyPoints.push(`10Y Treasury yield: ${fmt(treasury.price, 2)}% (${sign(treasury.change)}${fmt(treasury.change, 3)})`);

  // Analysis
  const moodDesc = marketMood === 'bullish'
    ? 'Equity markets showed broad strength today'
    : marketMood === 'bearish'
    ? 'Selling pressure weighed on equities today'
    : 'Markets traded in a mixed, directionless fashion today';
  const spDetail = sp500
    ? `, with the S&P 500 ${sp500.changePercent >= 0 ? 'adding' : 'shedding'} ${Math.abs(sp500.changePercent).toFixed(2)}% and the NASDAQ ${nasdaq && nasdaq.changePercent >= 0 ? 'gaining' : 'falling'} ${nasdaq ? Math.abs(nasdaq.changePercent).toFixed(2) : 'N/A'}%`
    : '';
  const sectorCtx = sortedSectors.length >= 2
    ? ` ${sortedSectors[0].name} led sector performance while ${sortedSectors[sortedSectors.length - 1].name} lagged${vix ? `, and VIX at ${vix.price.toFixed(1)} signals ${vix.price > 25 ? 'elevated anxiety' : 'contained risk'}` : ''}.`
    : '.';
  const marketAnalysis = `${moodDesc}${spDetail}.${sectorCtx}`;

  return { headline, marketMood, keyPoints: keyPoints.slice(0, 6), marketAnalysis };
}
