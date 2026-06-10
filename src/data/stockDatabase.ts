import { SearchResult } from '../types';

// [symbol, name, exchange, type, sector]
// type: EQUITY | ETF | INDEX
const RAW: [string, string, string, string, string][] = [
  // ── Indices ──────────────────────────────────────────────────────────────
  ['^GSPC',  'S&P 500',                        'INDEX', 'INDEX', 'Index'],
  ['^IXIC',  'NASDAQ Composite',               'INDEX', 'INDEX', 'Index'],
  ['^DJI',   'Dow Jones Industrial Average',   'INDEX', 'INDEX', 'Index'],
  ['^RUT',   'Russell 2000',                   'INDEX', 'INDEX', 'Index'],
  ['^VIX',   'CBOE Volatility Index',          'INDEX', 'INDEX', 'Index'],
  ['^TNX',   '10-Year Treasury Yield',         'INDEX', 'INDEX', 'Index'],
  ['^NDX',   'NASDAQ-100',                     'INDEX', 'INDEX', 'Index'],
  ['SPX',    'S&P 500 Index',                  'INDEX', 'INDEX', 'Index'],
  ['DXY',    'US Dollar Index',                'INDEX', 'INDEX', 'Index'],
  // ── Sector ETFs ──────────────────────────────────────────────────────────
  ['XLK',  'Technology Select Sector SPDR',    'NYSE',   'ETF', 'Technology'],
  ['XLF',  'Financial Select Sector SPDR',     'NYSE',   'ETF', 'Financials'],
  ['XLE',  'Energy Select Sector SPDR',        'NYSE',   'ETF', 'Energy'],
  ['XLV',  'Health Care Select Sector SPDR',   'NYSE',   'ETF', 'Health Care'],
  ['XLY',  'Consumer Disc. Select Sector SPDR','NYSE',   'ETF', 'Consumer Disc.'],
  ['XLP',  'Consumer Staples Select Sector',   'NYSE',   'ETF', 'Cons. Staples'],
  ['XLI',  'Industrial Select Sector SPDR',    'NYSE',   'ETF', 'Industrials'],
  ['XLB',  'Materials Select Sector SPDR',     'NYSE',   'ETF', 'Materials'],
  ['XLU',  'Utilities Select Sector SPDR',     'NYSE',   'ETF', 'Utilities'],
  ['XLRE', 'Real Estate Select Sector SPDR',   'NYSE',   'ETF', 'Real Estate'],
  ['XLC',  'Communication Services SPDR',      'NYSE',   'ETF', 'Comm. Services'],
  // ── Broad Market ETFs ────────────────────────────────────────────────────
  ['SPY',  'SPDR S&P 500 ETF Trust',           'NYSE',   'ETF', ''],
  ['QQQ',  'Invesco QQQ Trust',                'NASDAQ', 'ETF', ''],
  ['IWM',  'iShares Russell 2000 ETF',         'NYSE',   'ETF', ''],
  ['VTI',  'Vanguard Total Stock Market ETF',  'NYSE',   'ETF', ''],
  ['DIA',  'SPDR Dow Jones Industrial Avg ETF','NYSE',   'ETF', ''],
  ['VOO',  'Vanguard S&P 500 ETF',             'NYSE',   'ETF', ''],
  ['TQQQ', 'ProShares UltraPro QQQ',           'NASDAQ', 'ETF', ''],
  ['SQQQ', 'ProShares UltraPro Short QQQ',     'NASDAQ', 'ETF', ''],
  ['ARKK', 'ARK Innovation ETF',               'NYSE',   'ETF', ''],
  // ── Commodity ETFs ───────────────────────────────────────────────────────
  ['GLD',  'SPDR Gold Shares',                 'NYSE',   'ETF', 'Commodities'],
  ['SLV',  'iShares Silver Trust',             'NYSE',   'ETF', 'Commodities'],
  ['USO',  'United States Oil Fund',           'NYSE',   'ETF', 'Commodities'],
  ['UNG',  'United States Natural Gas Fund',   'NYSE',   'ETF', 'Commodities'],
  ['COPX', 'Global X Copper Miners ETF',       'NYSE',   'ETF', 'Commodities'],
  ['XME',  'SPDR S&P Metals & Mining ETF',     'NYSE',   'ETF', 'Commodities'],
  ['WEAT', 'Teucrium Wheat Fund',              'NYSE',   'ETF', 'Commodities'],
  ['CORN', 'Teucrium Corn Fund',               'NYSE',   'ETF', 'Commodities'],
  ['SOYB', 'Teucrium Soybean Fund',            'NYSE',   'ETF', 'Commodities'],
  ['WOOD', 'iShares Global Timber & Forestry', 'NASDAQ', 'ETF', 'Commodities'],
  ['LIT',  'Global X Lithium & Battery Tech',  'NYSE',   'ETF', 'Commodities'],
  // ── Mega Cap Technology ──────────────────────────────────────────────────
  ['AAPL',  'Apple Inc.',                      'NASDAQ', 'EQUITY', 'Technology'],
  ['MSFT',  'Microsoft Corporation',           'NASDAQ', 'EQUITY', 'Technology'],
  ['NVDA',  'NVIDIA Corporation',              'NASDAQ', 'EQUITY', 'Technology'],
  ['GOOGL', 'Alphabet Inc.',                   'NASDAQ', 'EQUITY', 'Technology'],
  ['GOOG',  'Alphabet Inc. Class C',           'NASDAQ', 'EQUITY', 'Technology'],
  ['META',  'Meta Platforms Inc.',             'NASDAQ', 'EQUITY', 'Technology'],
  ['AVGO',  'Broadcom Inc.',                   'NASDAQ', 'EQUITY', 'Technology'],
  ['ORCL',  'Oracle Corporation',              'NYSE',   'EQUITY', 'Technology'],
  ['CRM',   'Salesforce Inc.',                 'NYSE',   'EQUITY', 'Technology'],
  ['AMD',   'Advanced Micro Devices Inc.',     'NASDAQ', 'EQUITY', 'Technology'],
  ['ADBE',  'Adobe Inc.',                      'NASDAQ', 'EQUITY', 'Technology'],
  ['CSCO',  'Cisco Systems Inc.',              'NASDAQ', 'EQUITY', 'Technology'],
  ['QCOM',  'Qualcomm Inc.',                   'NASDAQ', 'EQUITY', 'Technology'],
  ['ACN',   'Accenture plc',                   'NYSE',   'EQUITY', 'Technology'],
  ['IBM',   'International Business Machines', 'NYSE',   'EQUITY', 'Technology'],
  ['INTU',  'Intuit Inc.',                     'NASDAQ', 'EQUITY', 'Technology'],
  ['NOW',   'ServiceNow Inc.',                 'NYSE',   'EQUITY', 'Technology'],
  ['TXN',   'Texas Instruments Inc.',          'NASDAQ', 'EQUITY', 'Technology'],
  ['INTC',  'Intel Corporation',               'NASDAQ', 'EQUITY', 'Technology'],
  ['MU',    'Micron Technology Inc.',          'NASDAQ', 'EQUITY', 'Technology'],
  ['AMAT',  'Applied Materials Inc.',          'NASDAQ', 'EQUITY', 'Technology'],
  ['LRCX',  'Lam Research Corporation',        'NASDAQ', 'EQUITY', 'Technology'],
  ['KLAC',  'KLA Corporation',                 'NASDAQ', 'EQUITY', 'Technology'],
  ['ADI',   'Analog Devices Inc.',             'NASDAQ', 'EQUITY', 'Technology'],
  ['MRVL',  'Marvell Technology Inc.',         'NASDAQ', 'EQUITY', 'Technology'],
  ['SMCI',  'Super Micro Computer Inc.',       'NASDAQ', 'EQUITY', 'Technology'],
  ['ARM',   'Arm Holdings plc',                'NASDAQ', 'EQUITY', 'Technology'],
  ['PANW',  'Palo Alto Networks Inc.',         'NASDAQ', 'EQUITY', 'Technology'],
  ['ADP',   'Automatic Data Processing Inc.',  'NASDAQ', 'EQUITY', 'Technology'],
  ['SNOW',  'Snowflake Inc.',                  'NYSE',   'EQUITY', 'Technology'],
  ['PLTR',  'Palantir Technologies Inc.',      'NYSE',   'EQUITY', 'Technology'],
  ['CRWD',  'CrowdStrike Holdings Inc.',       'NASDAQ', 'EQUITY', 'Technology'],
  ['NET',   'Cloudflare Inc.',                 'NYSE',   'EQUITY', 'Technology'],
  ['DDOG',  'Datadog Inc.',                    'NASDAQ', 'EQUITY', 'Technology'],
  ['ZS',    'Zscaler Inc.',                    'NASDAQ', 'EQUITY', 'Technology'],
  ['SHOP',  'Shopify Inc.',                    'NYSE',   'EQUITY', 'Technology'],
  ['SQ',    'Block Inc.',                      'NYSE',   'EQUITY', 'Technology'],
  ['PYPL',  'PayPal Holdings Inc.',            'NASDAQ', 'EQUITY', 'Technology'],
  ['OKTA',  'Okta Inc.',                       'NASDAQ', 'EQUITY', 'Technology'],
  ['TWLO',  'Twilio Inc.',                     'NYSE',   'EQUITY', 'Technology'],
  ['ZM',    'Zoom Video Communications',       'NASDAQ', 'EQUITY', 'Technology'],
  ['MSTR',  'MicroStrategy Inc.',              'NASDAQ', 'EQUITY', 'Technology'],
  ['ASML',  'ASML Holding N.V.',               'NASDAQ', 'EQUITY', 'Technology'],
  ['TSM',   'Taiwan Semiconductor Mfg.',       'NYSE',   'EQUITY', 'Technology'],
  ['SAP',   'SAP SE',                          'NYSE',   'EQUITY', 'Technology'],
  ['DELL',  'Dell Technologies Inc.',          'NYSE',   'EQUITY', 'Technology'],
  ['HPQ',   'HP Inc.',                         'NYSE',   'EQUITY', 'Technology'],
  ['WDC',   'Western Digital Corporation',     'NASDAQ', 'EQUITY', 'Technology'],
  // ── Consumer & E-Commerce ────────────────────────────────────────────────
  ['AMZN',  'Amazon.com Inc.',                 'NASDAQ', 'EQUITY', 'Consumer'],
  ['TSLA',  'Tesla Inc.',                      'NASDAQ', 'EQUITY', 'Consumer'],
  ['NFLX',  'Netflix Inc.',                    'NASDAQ', 'EQUITY', 'Consumer'],
  ['HD',    'The Home Depot Inc.',             'NYSE',   'EQUITY', 'Consumer'],
  ['MCD',   'McDonald\'s Corporation',         'NYSE',   'EQUITY', 'Consumer'],
  ['COST',  'Costco Wholesale Corporation',    'NASDAQ', 'EQUITY', 'Consumer'],
  ['WMT',   'Walmart Inc.',                    'NYSE',   'EQUITY', 'Consumer'],
  ['LOW',   'Lowe\'s Companies Inc.',          'NYSE',   'EQUITY', 'Consumer'],
  ['NKE',   'Nike Inc.',                       'NYSE',   'EQUITY', 'Consumer'],
  ['SBUX',  'Starbucks Corporation',           'NASDAQ', 'EQUITY', 'Consumer'],
  ['TGT',   'Target Corporation',              'NYSE',   'EQUITY', 'Consumer'],
  ['BKNG',  'Booking Holdings Inc.',           'NASDAQ', 'EQUITY', 'Consumer'],
  ['UBER',  'Uber Technologies Inc.',          'NYSE',   'EQUITY', 'Consumer'],
  ['ABNB',  'Airbnb Inc.',                     'NASDAQ', 'EQUITY', 'Consumer'],
  ['DASH',  'DoorDash Inc.',                   'NYSE',   'EQUITY', 'Consumer'],
  ['LYFT',  'Lyft Inc.',                       'NASDAQ', 'EQUITY', 'Consumer'],
  ['LULU',  'Lululemon Athletica Inc.',        'NASDAQ', 'EQUITY', 'Consumer'],
  ['ROST',  'Ross Stores Inc.',                'NASDAQ', 'EQUITY', 'Consumer'],
  ['TJX',   'TJX Companies Inc.',              'NYSE',   'EQUITY', 'Consumer'],
  ['DLTR',  'Dollar Tree Inc.',                'NASDAQ', 'EQUITY', 'Consumer'],
  ['DG',    'Dollar General Corporation',      'NYSE',   'EQUITY', 'Consumer'],
  ['F',     'Ford Motor Company',              'NYSE',   'EQUITY', 'Consumer'],
  ['GM',    'General Motors Company',          'NYSE',   'EQUITY', 'Consumer'],
  ['RIVN',  'Rivian Automotive Inc.',          'NASDAQ', 'EQUITY', 'Consumer'],
  ['LCID',  'Lucid Group Inc.',                'NASDAQ', 'EQUITY', 'Consumer'],
  ['NIO',   'NIO Inc.',                        'NYSE',   'EQUITY', 'Consumer'],
  ['BABA',  'Alibaba Group Holding',           'NYSE',   'EQUITY', 'Consumer'],
  ['JD',    'JD.com Inc.',                     'NASDAQ', 'EQUITY', 'Consumer'],
  ['PDD',   'PDD Holdings Inc.',               'NASDAQ', 'EQUITY', 'Consumer'],
  ['MELI',  'MercadoLibre Inc.',               'NASDAQ', 'EQUITY', 'Consumer'],
  ['ETSY',  'Etsy Inc.',                       'NASDAQ', 'EQUITY', 'Consumer'],
  ['W',     'Wayfair Inc.',                    'NYSE',   'EQUITY', 'Consumer'],
  ['TM',    'Toyota Motor Corporation',        'NYSE',   'EQUITY', 'Consumer'],
  ['SONY',  'Sony Group Corporation',          'NYSE',   'EQUITY', 'Consumer'],
  // ── Communication & Media ────────────────────────────────────────────────
  ['DIS',   'Walt Disney Company',             'NYSE',   'EQUITY', 'Communication'],
  ['VZ',    'Verizon Communications Inc.',     'NYSE',   'EQUITY', 'Communication'],
  ['T',     'AT&T Inc.',                       'NYSE',   'EQUITY', 'Communication'],
  ['CMCSA', 'Comcast Corporation',             'NASDAQ', 'EQUITY', 'Communication'],
  ['SPOT',  'Spotify Technology S.A.',         'NYSE',   'EQUITY', 'Communication'],
  ['SNAP',  'Snap Inc.',                       'NYSE',   'EQUITY', 'Communication'],
  ['PINS',  'Pinterest Inc.',                  'NYSE',   'EQUITY', 'Communication'],
  ['RBLX',  'Roblox Corporation',              'NYSE',   'EQUITY', 'Communication'],
  ['EA',    'Electronic Arts Inc.',            'NASDAQ', 'EQUITY', 'Communication'],
  ['TTWO',  'Take-Two Interactive Software',   'NASDAQ', 'EQUITY', 'Communication'],
  ['BIDU',  'Baidu Inc.',                      'NASDAQ', 'EQUITY', 'Communication'],
  ['WBD',   'Warner Bros. Discovery Inc.',     'NASDAQ', 'EQUITY', 'Communication'],
  // ── Financials ───────────────────────────────────────────────────────────
  ['JPM',   'JPMorgan Chase & Co.',            'NYSE',   'EQUITY', 'Financials'],
  ['BAC',   'Bank of America Corporation',     'NYSE',   'EQUITY', 'Financials'],
  ['WFC',   'Wells Fargo & Company',           'NYSE',   'EQUITY', 'Financials'],
  ['GS',    'Goldman Sachs Group Inc.',        'NYSE',   'EQUITY', 'Financials'],
  ['MS',    'Morgan Stanley',                  'NYSE',   'EQUITY', 'Financials'],
  ['C',     'Citigroup Inc.',                  'NYSE',   'EQUITY', 'Financials'],
  ['USB',   'U.S. Bancorp',                    'NYSE',   'EQUITY', 'Financials'],
  ['BRK-B', 'Berkshire Hathaway Inc.',         'NYSE',   'EQUITY', 'Financials'],
  ['V',     'Visa Inc.',                       'NYSE',   'EQUITY', 'Financials'],
  ['MA',    'Mastercard Incorporated',         'NYSE',   'EQUITY', 'Financials'],
  ['AXP',   'American Express Company',        'NYSE',   'EQUITY', 'Financials'],
  ['SPGI',  'S&P Global Inc.',                 'NYSE',   'EQUITY', 'Financials'],
  ['BLK',   'BlackRock Inc.',                  'NYSE',   'EQUITY', 'Financials'],
  ['MMC',   'Marsh & McLennan Companies',      'NYSE',   'EQUITY', 'Financials'],
  ['CB',    'Chubb Limited',                   'NYSE',   'EQUITY', 'Financials'],
  ['ICE',   'Intercontinental Exchange Inc.',  'NYSE',   'EQUITY', 'Financials'],
  ['CME',   'CME Group Inc.',                  'NASDAQ', 'EQUITY', 'Financials'],
  ['COIN',  'Coinbase Global Inc.',            'NASDAQ', 'EQUITY', 'Financials'],
  ['SOFI',  'SoFi Technologies Inc.',          'NASDAQ', 'EQUITY', 'Financials'],
  ['AFRM',  'Affirm Holdings Inc.',            'NASDAQ', 'EQUITY', 'Financials'],
  ['NU',    'Nu Holdings Ltd.',                'NYSE',   'EQUITY', 'Financials'],
  // ── Healthcare ───────────────────────────────────────────────────────────
  ['UNH',   'UnitedHealth Group Inc.',         'NYSE',   'EQUITY', 'Health Care'],
  ['LLY',   'Eli Lilly and Company',           'NYSE',   'EQUITY', 'Health Care'],
  ['JNJ',   'Johnson & Johnson',               'NYSE',   'EQUITY', 'Health Care'],
  ['ABBV',  'AbbVie Inc.',                     'NYSE',   'EQUITY', 'Health Care'],
  ['MRK',   'Merck & Co. Inc.',                'NYSE',   'EQUITY', 'Health Care'],
  ['TMO',   'Thermo Fisher Scientific Inc.',   'NYSE',   'EQUITY', 'Health Care'],
  ['ABT',   'Abbott Laboratories',             'NYSE',   'EQUITY', 'Health Care'],
  ['DHR',   'Danaher Corporation',             'NYSE',   'EQUITY', 'Health Care'],
  ['AMGN',  'Amgen Inc.',                      'NASDAQ', 'EQUITY', 'Health Care'],
  ['ISRG',  'Intuitive Surgical Inc.',         'NASDAQ', 'EQUITY', 'Health Care'],
  ['PFE',   'Pfizer Inc.',                     'NYSE',   'EQUITY', 'Health Care'],
  ['MDT',   'Medtronic plc',                   'NYSE',   'EQUITY', 'Health Care'],
  ['ELV',   'Elevance Health Inc.',            'NYSE',   'EQUITY', 'Health Care'],
  ['CI',    'Cigna Group',                     'NYSE',   'EQUITY', 'Health Care'],
  ['GILD',  'Gilead Sciences Inc.',            'NASDAQ', 'EQUITY', 'Health Care'],
  ['REGN',  'Regeneron Pharmaceuticals',       'NASDAQ', 'EQUITY', 'Health Care'],
  ['SYK',   'Stryker Corporation',             'NYSE',   'EQUITY', 'Health Care'],
  ['BSX',   'Boston Scientific Corporation',   'NYSE',   'EQUITY', 'Health Care'],
  ['ZTS',   'Zoetis Inc.',                     'NYSE',   'EQUITY', 'Health Care'],
  ['CVS',   'CVS Health Corporation',          'NYSE',   'EQUITY', 'Health Care'],
  ['MRNA',  'Moderna Inc.',                    'NASDAQ', 'EQUITY', 'Health Care'],
  ['BNTX',  'BioNTech SE',                     'NASDAQ', 'EQUITY', 'Health Care'],
  ['NVO',   'Novo Nordisk A/S',                'NYSE',   'EQUITY', 'Health Care'],
  ['DXCM',  'Dexcom Inc.',                     'NASDAQ', 'EQUITY', 'Health Care'],
  ['HIMS',  'Hims & Hers Health Inc.',         'NYSE',   'EQUITY', 'Health Care'],
  // ── Energy ───────────────────────────────────────────────────────────────
  ['XOM',   'Exxon Mobil Corporation',         'NYSE',   'EQUITY', 'Energy'],
  ['CVX',   'Chevron Corporation',             'NYSE',   'EQUITY', 'Energy'],
  ['COP',   'ConocoPhillips',                  'NYSE',   'EQUITY', 'Energy'],
  ['OXY',   'Occidental Petroleum',            'NYSE',   'EQUITY', 'Energy'],
  ['BP',    'BP plc',                          'NYSE',   'EQUITY', 'Energy'],
  ['SHEL',  'Shell plc',                       'NYSE',   'EQUITY', 'Energy'],
  ['MPC',   'Marathon Petroleum Corporation',  'NYSE',   'EQUITY', 'Energy'],
  ['PSX',   'Phillips 66',                     'NYSE',   'EQUITY', 'Energy'],
  ['VLO',   'Valero Energy Corporation',       'NYSE',   'EQUITY', 'Energy'],
  ['HAL',   'Halliburton Company',             'NYSE',   'EQUITY', 'Energy'],
  ['DVN',   'Devon Energy Corporation',        'NYSE',   'EQUITY', 'Energy'],
  // ── Industrials ──────────────────────────────────────────────────────────
  ['GE',    'GE Aerospace',                    'NYSE',   'EQUITY', 'Industrials'],
  ['CAT',   'Caterpillar Inc.',                'NYSE',   'EQUITY', 'Industrials'],
  ['RTX',   'RTX Corporation',                 'NYSE',   'EQUITY', 'Industrials'],
  ['HON',   'Honeywell International Inc.',    'NASDAQ', 'EQUITY', 'Industrials'],
  ['DE',    'Deere & Company',                 'NYSE',   'EQUITY', 'Industrials'],
  ['UPS',   'United Parcel Service Inc.',      'NYSE',   'EQUITY', 'Industrials'],
  ['ETN',   'Eaton Corporation plc',           'NYSE',   'EQUITY', 'Industrials'],
  ['ITW',   'Illinois Tool Works Inc.',        'NYSE',   'EQUITY', 'Industrials'],
  ['WM',    'Waste Management Inc.',           'NYSE',   'EQUITY', 'Industrials'],
  ['LMT',   'Lockheed Martin Corporation',     'NYSE',   'EQUITY', 'Industrials'],
  ['BA',    'Boeing Company',                  'NYSE',   'EQUITY', 'Industrials'],
  ['NOC',   'Northrop Grumman Corporation',    'NYSE',   'EQUITY', 'Industrials'],
  ['GD',    'General Dynamics Corporation',    'NYSE',   'EQUITY', 'Industrials'],
  ['FDX',   'FedEx Corporation',               'NYSE',   'EQUITY', 'Industrials'],
  ['MMM',   '3M Company',                      'NYSE',   'EQUITY', 'Industrials'],
  // ── Consumer Staples ─────────────────────────────────────────────────────
  ['PG',    'Procter & Gamble Co.',            'NYSE',   'EQUITY', 'Cons. Staples'],
  ['PEP',   'PepsiCo Inc.',                    'NASDAQ', 'EQUITY', 'Cons. Staples'],
  ['KO',    'Coca-Cola Company',               'NYSE',   'EQUITY', 'Cons. Staples'],
  ['PM',    'Philip Morris International',     'NYSE',   'EQUITY', 'Cons. Staples'],
  ['MO',    'Altria Group Inc.',               'NYSE',   'EQUITY', 'Cons. Staples'],
  ['MNST',  'Monster Beverage Corporation',    'NASDAQ', 'EQUITY', 'Cons. Staples'],
  ['GIS',   'General Mills Inc.',              'NYSE',   'EQUITY', 'Cons. Staples'],
  ['CELH',  'Celsius Holdings Inc.',           'NASDAQ', 'EQUITY', 'Cons. Staples'],
  // ── Materials ────────────────────────────────────────────────────────────
  ['LIN',   'Linde plc',                       'NYSE',   'EQUITY', 'Materials'],
  ['ECL',   'Ecolab Inc.',                     'NYSE',   'EQUITY', 'Materials'],
  ['RIO',   'Rio Tinto plc',                   'NYSE',   'EQUITY', 'Materials'],
  ['BHP',   'BHP Group Limited',               'NYSE',   'EQUITY', 'Materials'],
  // ── Utilities ────────────────────────────────────────────────────────────
  ['NEE',   'NextEra Energy Inc.',             'NYSE',   'EQUITY', 'Utilities'],
  ['SO',    'Southern Company',                'NYSE',   'EQUITY', 'Utilities'],
  ['DUK',   'Duke Energy Corporation',         'NYSE',   'EQUITY', 'Utilities'],
  // ── Real Estate ──────────────────────────────────────────────────────────
  ['PLD',   'Prologis Inc.',                   'NYSE',   'EQUITY', 'Real Estate'],
  ['EQIX',  'Equinix Inc.',                    'NASDAQ', 'EQUITY', 'Real Estate'],
  ['AMT',   'American Tower Corporation',      'NYSE',   'EQUITY', 'Real Estate'],
];

export const STOCK_DB: SearchResult[] = RAW.map(([symbol, name, exchange, type, sector]) => ({
  symbol,
  name,
  exchange,
  type,
  sector,
}));

function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

export function searchLocal(query: string): SearchResult[] {
  const q = query.trim().toUpperCase();
  if (!q) return [];

  const scored = STOCK_DB.map(entry => {
    const sym = entry.symbol.toUpperCase();
    const name = entry.name.toUpperCase();
    let score = 0;

    if (sym === q) score += 1000;
    else if (sym.startsWith(q)) score += 600;
    else if (sym.includes(q)) score += 300;

    const nameQ = query.trim().toLowerCase();
    const nameLower = entry.name.toLowerCase();
    if (nameLower === nameQ) score += 900;
    else if (nameLower.startsWith(nameQ)) score += 400;
    else if (nameLower.includes(nameQ)) score += 200;

    // word match
    const words = nameQ.split(/\s+/);
    words.forEach(w => { if (w.length > 2 && nameLower.includes(w)) score += 80; });

    // fuzzy tolerance on short symbols
    if (score === 0 && sym.length <= 5 && q.length <= 5) {
      const dist = levenshtein(sym, q);
      if (dist === 1) score += 50;
    }

    return { entry, score };
  }).filter(x => x.score > 0);

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map(x => x.entry);
}

export const POPULAR: SearchResult[] = [
  STOCK_DB.find(s => s.symbol === 'AAPL')!,
  STOCK_DB.find(s => s.symbol === 'NVDA')!,
  STOCK_DB.find(s => s.symbol === 'TSLA')!,
  STOCK_DB.find(s => s.symbol === 'MSFT')!,
  STOCK_DB.find(s => s.symbol === '^GSPC')!,
  STOCK_DB.find(s => s.symbol === 'AMZN')!,
].filter(Boolean);
