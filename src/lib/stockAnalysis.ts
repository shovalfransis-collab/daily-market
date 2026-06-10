import { FinancialMetrics } from '../types';

export type OutlookSignal = 'Bullish' | 'Cautiously Bullish' | 'Neutral' | 'Cautiously Bearish' | 'Bearish';
export type ValuationVerdict = 'Undervalued' | 'Fairly Valued' | 'Slightly Overvalued' | 'Overvalued' | 'Speculative';

export interface StockAnalysis {
  thesis: string;
  bullCase: string[];
  bearCase: string[];
  valuation: { verdict: ValuationVerdict; reasoning: string };
  shortTerm: { signal: OutlookSignal; text: string };
  longTerm:  { signal: OutlookSignal; text: string };
  catalysts: string[];
  risks: string[];
}

function pct(v: number) { return `${(v * 100).toFixed(1)}%`; }
function fmt(v: number, dec = 1) { return v.toFixed(dec); }
function money(v: number) {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(1)}T`;
  if (v >= 1e9)  return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6)  return `$${(v / 1e6).toFixed(1)}M`;
  return `$${v.toLocaleString()}`;
}

export function generateAnalysis(
  m: FinancialMetrics,
  currentPrice: number,
  companyName: string,
): StockAnalysis | null {
  const hasMinData = [m.grossMargin, m.pe, m.revenue, m.revenueGrowth].some(v => v != null);
  if (!hasMinData) return null;

  const name = companyName || 'The company';
  const sector = m.sector ?? 'its sector';
  const revGrowth  = m.revenueGrowth ?? 0;
  const grossMgn   = m.grossMargin ?? 0;
  const opMgn      = m.operatingMargin ?? 0;
  const netMgn     = m.netMargin ?? 0;
  const roe        = m.roe ?? 0;
  const debtEq     = m.debtToEquity ?? 0;
  const currRatio  = m.currentRatio ?? 1;
  const pe         = m.pe ?? 0;
  const fwdPe      = m.forwardPE ?? 0;
  const peg        = m.peg ?? 0;
  const fcf        = m.freeCashFlow ?? 0;
  const rev        = m.revenue ?? 0;
  const mktCap     = m.marketCap ?? 0;
  const targetMean = m.targetMean ?? 0;
  const totalAnalysts = (m.analystStrongBuy ?? 0) + (m.analystBuy ?? 0) + (m.analystHold ?? 0) + (m.analystSell ?? 0) + (m.analystStrongSell ?? 0);
  const bullAnalysts = (m.analystStrongBuy ?? 0) + (m.analystBuy ?? 0);
  const analystBullPct = totalAnalysts > 0 ? bullAnalysts / totalAnalysts : 0;
  const w52High = m.week52High ?? 0;
  const w52Low  = m.week52Low ?? 0;
  const pricePos = (w52High > w52Low && currentPrice > 0)
    ? (currentPrice - w52Low) / (w52High - w52Low)
    : 0.5;

  // ── Archetype classification ─────────────────────────────────────────────
  const isHighGrowth       = revGrowth > 0.15;
  const isMegaCap          = mktCap > 500e9;
  const isHighMargin       = grossMgn > 0.55;
  const isProfitable       = (m.netIncome ?? 0) > 0;
  const isFCFPositive      = fcf > 0;
  const isValueStock       = pe > 0 && pe < 18 && revGrowth < 0.1;
  const isExpensive        = pe > 40;
  const isVeryExpensive    = pe > 70 || pe <= 0;
  const hasStrongBalance   = debtEq < 60 && currRatio > 1.2;
  const hasWeakBalance     = debtEq > 200 || currRatio < 1;
  const isGrowthToProfit   = revGrowth > 0.1 && fwdPe > 0 && fwdPe < pe * 0.85;
  const hasMomentum        = pricePos > 0.65;
  const isNearLow          = pricePos < 0.25;

  // ── Investment Thesis ────────────────────────────────────────────────────
  let thesis = '';
  if (isHighGrowth && isHighMargin && isProfitable) {
    thesis = `${name} is a high-quality compounding machine in ${sector}, growing revenue at ${pct(revGrowth)} annually while maintaining ${pct(grossMgn)} gross margins. `
      + (isFCFPositive
        ? `The business generates ${money(fcf)} in free cash flow, funding reinvestment without dilution. `
        : `Cash flow generation is improving as scale benefits flow through the P&L. `)
      + `For long-term investors, the combination of durable growth, pricing power, and ${pct(netMgn)} net margins justifies premium valuation multiples.`;
  } else if (isHighGrowth && !isProfitable) {
    thesis = `${name} is in aggressive growth mode, expanding revenue at ${pct(revGrowth)} YoY while investing heavily in market share capture. `
      + `Current unprofitability reflects intentional reinvestment in ${sector} dominance — the thesis hinges on the path to profitability as the business scales. `
      + `Investors are paying for optionality on a category winner; execution and unit economics improvement are the key watch items.`;
  } else if (isValueStock) {
    thesis = `${name} is a mature, profitable business trading at ${fmt(pe)}x earnings — a valuation that prices in limited growth but offers margin of safety. `
      + (isFCFPositive ? `Generating ${money(fcf)} in annual free cash flow, ` : '')
      + `the company's ${pct(grossMgn)} gross margins and established market position provide resilience through economic cycles. `
      + `The investment case centers on capital returns (buybacks and dividends) and downside protection rather than multiple expansion.`;
  } else if (isMegaCap && isHighMargin) {
    thesis = `${name} is a dominant platform business with ${pct(grossMgn)} gross margins and ${money(rev)} in annual revenue. `
      + `Its scale, network effects, and competitive moat in ${sector} make it one of the most defensible businesses in global equity markets. `
      + (isGrowthToProfit
        ? `Earnings acceleration — with forward P/E of ${fmt(fwdPe)}x versus trailing ${fmt(pe)}x — signals margin expansion ahead.`
        : `The core business throws off enormous cash flows that fund both reinvestment and capital returns.`);
  } else {
    thesis = `${name} operates in ${sector} with ${rev > 0 ? money(rev) + ' in revenue and ' : ''}${pe > 0 ? fmt(pe) + 'x trailing earnings. ' : 'evolving profitability metrics. '}`
      + (revGrowth !== 0
        ? `Top-line growth of ${pct(revGrowth)} ${revGrowth > 0 ? 'reflects' : 'signals headwinds in'} the core business. `
        : '')
      + `The investment case requires careful assessment of competitive position, balance sheet health, and management's capital allocation discipline.`;
  }

  // ── Bull Case ────────────────────────────────────────────────────────────
  const bullCase: string[] = [];

  if (revGrowth > 0.25)
    bullCase.push(`Exceptional revenue growth of ${pct(revGrowth)} YoY demonstrates strong product-market fit and expanding addressable market.`);
  else if (revGrowth > 0.1)
    bullCase.push(`Healthy ${pct(revGrowth)} revenue growth outpaces most peers in ${sector}, signaling continued market share gains.`);
  else if (revGrowth > 0)
    bullCase.push(`Stable ${pct(revGrowth)} revenue growth in a mature market, underpinned by recurring customer relationships.`);

  if (grossMgn > 0.7)
    bullCase.push(`Best-in-class ${pct(grossMgn)} gross margin reflects dominant pricing power and a scalable software or platform business model.`);
  else if (grossMgn > 0.5)
    bullCase.push(`${pct(grossMgn)} gross margins indicate strong unit economics with significant operating leverage as the business scales.`);
  else if (grossMgn > 0.3)
    bullCase.push(`${pct(grossMgn)} gross margin provides sufficient headroom for marketing investment while still delivering bottom-line profitability.`);

  if (isGrowthToProfit)
    bullCase.push(`Forward P/E of ${fmt(fwdPe)}x versus trailing ${fmt(pe)}x implies meaningful earnings acceleration — a classic re-rating catalyst.`);

  if (isFCFPositive && fcf > 0)
    bullCase.push(`${money(fcf)} in annual free cash flow funds share buybacks, debt reduction, and strategic M&A without needing capital markets.`);

  if (roe > 0.2)
    bullCase.push(`${pct(roe)} return on equity demonstrates management's ability to generate superior returns on invested capital.`);

  if (hasStrongBalance)
    bullCase.push(`Clean balance sheet with ${fmt(debtEq, 0)}% debt-to-equity and ${fmt(currRatio)}x current ratio provides financial flexibility and recession resilience.`);

  if (analystBullPct > 0.7 && totalAnalysts >= 5)
    bullCase.push(`${Math.round(analystBullPct * 100)}% of ${totalAnalysts} analysts rate this a Buy, with average price target implying ${targetMean > 0 && currentPrice > 0 ? ((targetMean - currentPrice) / currentPrice * 100).toFixed(0) + '%' : 'meaningful'} upside.`);

  if (hasMomentum)
    bullCase.push(`Strong price momentum — trading in the upper ${Math.round(pricePos * 100)}th percentile of its 52-week range — reflects improving fundamentals and institutional accumulation.`);

  // ── Bear Case ────────────────────────────────────────────────────────────
  const bearCase: string[] = [];

  if (isVeryExpensive)
    bearCase.push(`Elevated valuation${pe > 0 ? ` (${fmt(pe)}x P/E)` : ''} leaves little room for execution misses — even a modest earnings miss could trigger sharp multiple compression.`);
  else if (isExpensive)
    bearCase.push(`At ${fmt(pe)}x earnings, the stock requires sustained high growth to justify current multiples; any deceleration risks a de-rating.`);

  if (!isProfitable)
    bearCase.push(`Negative net income means the business is burning cash to fund growth — if the market loses patience with the path to profitability, the stock could reprice sharply lower.`);

  if (!isFCFPositive && fcf < 0)
    bearCase.push(`Negative free cash flow (${money(Math.abs(fcf))}) requires ongoing access to debt or equity markets, creating dilution risk and balance sheet vulnerability.`);

  if (hasWeakBalance)
    bearCase.push(`${debtEq > 200 ? `High ${fmt(debtEq, 0)}% debt-to-equity ratio` : `Current ratio of ${fmt(currRatio)}`} raises solvency concerns in a higher-for-longer interest rate environment.`);

  if (revGrowth < 0)
    bearCase.push(`Revenue declining ${pct(Math.abs(revGrowth))} YoY signals structural headwinds or intensifying competition — growth reinvestment may not be translating into market share.`);
  else if (revGrowth < 0.03 && isExpensive)
    bearCase.push(`Near-zero revenue growth of ${pct(revGrowth)} is difficult to reconcile with a premium multiple, creating a challenging setup for multiple expansion.`);

  if (opMgn < 0.05 && opMgn > -0.5 && isProfitable)
    bearCase.push(`Thin ${pct(opMgn)} operating margin leaves the business highly exposed to cost inflation, wage pressure, or revenue shortfalls.`);

  if (isNearLow)
    bearCase.push(`Trading near 52-week lows, with the stock in the bottom ${Math.round(pricePos * 100)}th percentile of its range — technical trend and institutional sentiment are negative.`);

  const analystBearPct = totalAnalysts > 0
    ? ((m.analystSell ?? 0) + (m.analystStrongSell ?? 0)) / totalAnalysts
    : 0;
  if (analystBearPct > 0.25)
    bearCase.push(`${Math.round(analystBearPct * 100)}% of analysts rate this a Sell — unusually high sell-side skepticism warrants investigation into thesis-threatening concerns.`);

  // ── Valuation Assessment ─────────────────────────────────────────────────
  let valuationVerdict: ValuationVerdict;
  let valuationReason = '';

  if (!isProfitable || pe <= 0) {
    valuationVerdict = 'Speculative';
    valuationReason = `Without positive earnings, traditional valuation metrics don't apply. The stock is valued on revenue multiples${m.ps ? ` (${fmt(m.ps)}x P/S)` : ''} and growth expectations. ${revGrowth > 0.2 ? `Revenue growing at ${pct(revGrowth)} supports a speculative premium, but the stock requires either profitability inflection or continued high growth to hold current levels.` : `With growth decelerating, the risk/reward for a speculative valuation is increasingly asymmetric.`}`;
  } else if (peg > 0 && peg < 1) {
    valuationVerdict = 'Undervalued';
    valuationReason = `PEG ratio of ${fmt(peg)} below 1.0 suggests the market is underpricing growth relative to earnings power. At ${fmt(pe)}x trailing P/E${fwdPe > 0 ? ` (${fmt(fwdPe)}x forward)` : ''} with ${pct(revGrowth)} revenue growth, investors are paying a reasonable price for a high-quality, growing business.`;
  } else if (pe < 15 && isProfitable && isFCFPositive) {
    valuationVerdict = 'Undervalued';
    valuationReason = `${fmt(pe)}x earnings is cheap for a business generating ${money(fcf)} in free cash flow. ${roe > 0.1 ? `With ${pct(roe)} ROE and positive FCF, ` : ''}the market appears to be discounting near-term headwinds that may prove temporary rather than structural.`;
  } else if (pe < 20 || (peg > 0 && peg < 1.5)) {
    valuationVerdict = 'Fairly Valued';
    valuationReason = `At ${fmt(pe)}x P/E${peg > 0 ? ` and ${fmt(peg)} PEG` : ''}, the stock is priced in-line with its growth profile and sector comparables. ${isGrowthToProfit ? `The forward multiple of ${fmt(fwdPe)}x provides confidence that earnings are expanding. ` : ''}Fair value suggests limited near-term multiple expansion, with returns dependent on earnings growth.`;
  } else if (pe < 35 && revGrowth > 0.1) {
    valuationVerdict = 'Slightly Overvalued';
    valuationReason = `${fmt(pe)}x earnings carries a growth premium that is justifiable${peg > 0 ? ` (PEG: ${fmt(peg)})` : ''} only if ${pct(revGrowth)} revenue growth is sustained. Any meaningful deceleration creates downside risk to the multiple, though the business quality supports a floor.`;
  } else if (pe >= 35 || (m.ps != null && m.ps > 20)) {
    valuationVerdict = 'Overvalued';
    valuationReason = `${pe > 0 ? `${fmt(pe)}x earnings is difficult to justify` : `Revenue multiple of ${m.ps ? fmt(m.ps) + 'x P/S' : 'N/A'} appears stretched`} without a clear and sustained earnings acceleration. ${peg > 2 ? `A PEG ratio of ${fmt(peg)} confirms the market is pricing in optimistic growth that may not materialize. ` : ''}Investors entering at current levels are taking on significant valuation risk.`;
  } else {
    valuationVerdict = 'Fairly Valued';
    valuationReason = `Current valuation metrics are broadly in line with fundamentals and sector peers. Returns will be primarily driven by operational execution rather than multiple re-rating.`;
  }

  // ── Short Term Outlook ───────────────────────────────────────────────────
  let shortSignal: OutlookSignal;
  let shortText = '';

  const shortScore =
    (hasMomentum ? 2 : isNearLow ? -2 : 0) +
    (analystBullPct > 0.65 ? 1 : analystBullPct < 0.35 ? -1 : 0) +
    (isGrowthToProfit ? 1 : 0) +
    (revGrowth > 0.15 ? 1 : revGrowth < 0 ? -1 : 0) +
    (isFCFPositive ? 0.5 : -0.5);

  if (shortScore >= 3) {
    shortSignal = 'Bullish';
    shortText = `Near-term setup looks constructive. ${hasMomentum ? `Price momentum in the upper range, ` : ''}${analystBullPct > 0.65 ? `${Math.round(analystBullPct * 100)}% analyst buy ratings, ` : ''}${isGrowthToProfit ? `and earnings acceleration (fwd P/E ${fmt(fwdPe)}x vs trailing ${fmt(pe)}x) ` : ''}all point toward a favorable risk/reward into the next earnings cycle. Watch for any guidance raises as a catalyst for higher prices.`;
  } else if (shortScore >= 1) {
    shortSignal = 'Cautiously Bullish';
    shortText = `Short-term outlook is modestly positive with some caveats. ${revGrowth > 0.1 ? `Revenue growth of ${pct(revGrowth)} supports the earnings backdrop, ` : ''}but ${isExpensive ? `elevated multiples (${fmt(pe)}x P/E) leave the stock exposed to macro volatility. ` : `mixed technical momentum suggests a range-bound near term. `}Positioning should reflect the uncertainty — scaling in on weakness rather than chasing strength.`;
  } else if (shortScore <= -3) {
    shortSignal = 'Bearish';
    shortText = `Short-term risk/reward is unfavorable. ${isNearLow ? `Stock trading near 52-week lows with negative momentum. ` : ''}${revGrowth < 0 ? `Declining revenue of ${pct(revGrowth)} YoY is a structural red flag that will continue pressuring sentiment. ` : ''}${!isProfitable && !isFCFPositive ? `Cash burn with no clear profitability path increases the risk of a forced capital raise. ` : ''}High-conviction longs may need to wait for a fundamental catalyst before the stock can sustainably re-rate.`;
  } else if (shortScore <= -1) {
    shortSignal = 'Cautiously Bearish';
    shortText = `Near-term headwinds outweigh tailwinds. ${!hasMomentum ? `Poor price action suggests distribution by institutional holders. ` : ''}${!isFCFPositive ? `Negative free cash flow limits strategic flexibility. ` : ''}${analystBullPct < 0.4 && totalAnalysts > 3 ? `Only ${Math.round(analystBullPct * 100)}% analyst buy coverage suggests the investment community sees better risk/reward elsewhere. ` : ''}Patience likely rewarded — revisit after next earnings for improved clarity.`;
  } else {
    shortSignal = 'Neutral';
    shortText = `Short-term direction is difficult to call with conviction. ${revGrowth > 0 ? `Revenue growing at ${pct(revGrowth)} keeps the fundamental case intact, ` : ''}but ${isExpensive ? 'valuation leaves little margin for error. ' : 'limited near-term catalysts make timing tricky. '}The stock is likely to trade with the market and sector. Wait for a clear catalyst — earnings surprise, guidance raise, or macro shift — to take a directional position.`;
  }

  // ── Long Term Outlook ────────────────────────────────────────────────────
  let longSignal: OutlookSignal;
  let longText = '';

  const longScore =
    (isHighGrowth ? 2 : revGrowth < 0 ? -2 : 0) +
    (isHighMargin ? 1.5 : grossMgn < 0.15 ? -1 : 0) +
    (hasStrongBalance ? 1 : hasWeakBalance ? -2 : 0) +
    (isFCFPositive ? 1 : -1) +
    (roe > 0.15 ? 1 : roe < 0 ? -1.5 : 0) +
    (isValueStock ? 0.5 : isVeryExpensive && !isHighGrowth ? -1 : 0);

  if (longScore >= 4) {
    longSignal = 'Bullish';
    longText = `Compelling long-term investment case. ${name} combines ${isHighGrowth ? `strong ${pct(revGrowth)} revenue growth ` : ''}${isHighMargin ? `with ${pct(grossMgn)} gross margins ` : ''}that compound into exceptional shareholder returns over time. ${hasStrongBalance ? 'The clean balance sheet provides a buffer for economic downturns while maintaining investment in growth. ' : ''}${roe > 0.2 ? `${pct(roe)} ROE confirms superior capital allocation discipline. ` : ''}Investors with a 3-5 year horizon are likely to be well-rewarded by patient accumulation.`;
  } else if (longScore >= 2) {
    longSignal = 'Cautiously Bullish';
    longText = `Long-term thesis is intact but requires monitoring. The core business in ${sector} has durable advantages${isHighMargin ? ` — ${pct(grossMgn)} gross margins don't come from weak competitive positions —` : ''} but ${hasWeakBalance ? 'the balance sheet carries elevated risk, ' : ''}${!isHighGrowth && !isValueStock ? 'moderate growth limits the compounding power ' : ''}${isExpensive ? `and the current valuation (${fmt(pe)}x) requires execution without stumbles. ` : ''}A position built over time through dollar-cost averaging is more sensible than a concentrated entry today.`;
  } else if (longScore <= -3) {
    longSignal = 'Bearish';
    longText = `Long-term fundamentals raise serious concerns. ${revGrowth < 0 ? `Revenue contraction of ${pct(Math.abs(revGrowth))} suggests the core business is losing relevance. ` : ''}${hasWeakBalance ? `The balance sheet (${fmt(debtEq, 0)}% D/E, ${fmt(currRatio)}x current ratio) is fragile — a cyclical downturn could be existential. ` : ''}${roe < 0 ? 'Negative return on equity means the business destroys capital rather than creates it. ' : ''}Without a credible turnaround plan backed by evidence, this is not an investment, it's a speculation.`;
  } else if (longScore <= 0) {
    longSignal = 'Cautiously Bearish';
    longText = `Long-term case requires a leap of faith. ${!isFCFPositive ? `Negative free cash flow means the business cannot self-fund — perpetual capital markets access is assumed. ` : ''}${opMgn < 0.05 ? `Operating margins of ${pct(opMgn)} leave no cushion for investment. ` : ''}${revGrowth < 0.05 && isExpensive ? `Paying ${fmt(pe)}x earnings for ${pct(revGrowth)} growth is a poor long-term deal mathematically. ` : ''}The burden of proof lies with the company to demonstrate operational improvement before long-term capital commitment is justified.`;
  } else {
    longSignal = 'Neutral';
    longText = `Long-term picture is balanced. ${name} is a legitimate business in ${sector} with ${rev > 0 ? money(rev) + ' in revenue ' : ''}and ${isProfitable ? 'positive earnings, ' : 'a path toward profitability. '}${isFCFPositive ? 'Free cash flow generation is a key strength. ' : ''}The stock is unlikely to be a generational compounder but also unlikely to be a value trap. Returns over the next 3-5 years will largely track earnings growth, making execution the primary variable to monitor.`;
  }

  // ── Catalysts & Risks ────────────────────────────────────────────────────
  const catalysts: string[] = [];
  const risks: string[] = [];

  if (revGrowth > 0.1) catalysts.push('Earnings beats driven by above-consensus revenue growth');
  if (isGrowthToProfit) catalysts.push('Margin expansion visible in forward estimates — a re-rating catalyst');
  if (targetMean > 0 && currentPrice > 0 && targetMean > currentPrice * 1.1)
    catalysts.push(`Analyst price target upgrades toward consensus mean of ${money(targetMean)}`);
  if (hasStrongBalance && isFCFPositive)
    catalysts.push('Capital return announcements (buybacks or dividends) as FCF accumulates');
  if (hasMomentum) catalysts.push('Technical breakout above key resistance supported by strong fundamentals');
  catalysts.push('Sector rotation into growth / value (depending on rate environment)');
  if (isHighGrowth) catalysts.push('AI, automation, or digital transformation tailwinds accelerating adoption');

  if (isExpensive) risks.push(`Multiple compression if ${pct(revGrowth)} growth rate decelerates — P/E of ${fmt(pe)}x has no cushion`);
  if (!isProfitable) risks.push('Path to profitability longer or more dilutive than expected');
  if (hasWeakBalance) risks.push('Refinancing risk if credit markets tighten in a rising-rate environment');
  if (revGrowth < 0) risks.push('Structural revenue decline threatening the long-term earnings base');
  risks.push('Macro deterioration (recession, rate shock) compressing sector multiples');
  risks.push('Competitive disruption from well-funded new entrants or incumbents pivoting');
  if (m.beta != null && m.beta > 1.5)
    risks.push(`High beta of ${fmt(m.beta)} amplifies downside in broad market selloffs`);

  return {
    thesis,
    bullCase:   bullCase.slice(0, 4),
    bearCase:   bearCase.slice(0, 4),
    valuation:  { verdict: valuationVerdict, reasoning: valuationReason },
    shortTerm:  { signal: shortSignal, text: shortText },
    longTerm:   { signal: longSignal, text: longText },
    catalysts:  catalysts.slice(0, 4),
    risks:      risks.slice(0, 4),
  };
}

export function outlookColor(s: OutlookSignal): string {
  if (s === 'Bullish') return 'text-up';
  if (s === 'Cautiously Bullish') return 'text-up/80';
  if (s === 'Cautiously Bearish') return 'text-down/80';
  if (s === 'Bearish') return 'text-down';
  return 'text-yellow-400';
}

export function outlookBg(s: OutlookSignal): string {
  if (s === 'Bullish') return 'bg-up/10 border-up/25';
  if (s === 'Cautiously Bullish') return 'bg-up/5 border-up/15';
  if (s === 'Cautiously Bearish') return 'bg-down/5 border-down/15';
  if (s === 'Bearish') return 'bg-down/10 border-down/25';
  return 'bg-yellow-400/10 border-yellow-400/20';
}

export function valuationColor(v: ValuationVerdict): string {
  if (v === 'Undervalued') return 'text-up';
  if (v === 'Fairly Valued') return 'text-yellow-400';
  if (v === 'Slightly Overvalued') return 'text-orange-400';
  if (v === 'Overvalued') return 'text-down';
  return 'text-purple-400';
}
