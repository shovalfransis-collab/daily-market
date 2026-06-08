# Daily Market

A pure frontend React + TypeScript app that generates a daily market newsletter from live Yahoo Finance data — no backend, no API key required.

## Features

- **Market Overview** — index cards for S&P 500, NASDAQ, Dow, Russell 2000, VIX, and 10Y yield with 7-day sparklines
- **Top Movers** — gainers/losers tabs with volume and market cap
- **Sector Heatmap** — 11 SPDR sector ETFs colored by % change
- **Commodities Panel** — ETF proxies for gold, silver, oil, and more
- **Earnings Table** — today's earnings releases with EPS surprise %
- **Newsletter Summary** — auto-generated headline, market mood, key bullet points, and analysis

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS (dark theme)
- Recharts (sparklines/charts)
- Radix UI (Dialog, Tooltip)
- Lucide React (icons)
- Yahoo Finance public APIs (client-side, no key needed)

## Getting Started

```bash
npm install
npm run dev       # start dev server at localhost:5173
npm run build     # tsc + vite build
npm run preview   # preview production build
```

## Architecture

All data is fetched client-side in parallel on mount and on manual refresh:

```
App.tsx
  └── lib/api.ts            — orchestrates 5 parallel Yahoo Finance calls
        ├── lib/yahooFinance.ts   — fetchBatch, fetchTopMovers, fetchEarningsToday
        └── lib/summaryGenerator.ts — generates NewsletterSummary from raw data
```

Types are defined in `types.ts`: `MarketSummary`, `StockQuote`, `SectorData`, `EarningsReport`, `NewsletterSummary`.
