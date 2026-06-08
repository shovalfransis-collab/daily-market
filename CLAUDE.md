# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start Vite dev server (localhost:5173)
npm run build     # tsc then vite build
npm run preview   # preview production build
```

No test runner configured.

## Architecture

Pure frontend React + TypeScript app. No backend. All market data fetched client-side directly from Yahoo Finance public APIs (no API key required, but CORS-dependent).

**Data flow:**
1. `App.tsx` calls `fetchNewsletter()` on mount and on manual refresh
2. `lib/api.ts` — orchestrates 5 parallel Yahoo Finance calls, assembles `MarketSummary`
3. `lib/yahooFinance.ts` — all YF API calls: `fetchBatch` (indices/sectors/commodities), `fetchTopMovers` (screener), `fetchEarningsToday`
4. `lib/summaryGenerator.ts` — pure function, generates `NewsletterSummary` (headline, mood, key points, analysis) from raw market data with no AI/LLM
5. `types.ts` — all shared interfaces (`MarketSummary`, `StockQuote`, `SectorData`, `EarningsReport`, `NewsletterSummary`)

**Component layout (rendered top to bottom in App.tsx):**
- `NewsletterSummary` — AI-style headline + market mood badge + key bullet points + analysis paragraph
- `MarketOverview` — index cards (S&P, NASDAQ, Dow, Russell, VIX, 10Y) with 7-day sparklines via Recharts
- `TopMovers` — gainers/losers tabs with volume and market cap
- `SectorHeatmap` — 11 SPDR sector ETFs colored by change %
- `CommoditiesPanel` — commodity ETF proxies (GLD/SLV/USO etc.)
- `EarningsTable` — today's earnings releases with EPS surprise %

**Key constants in `yahooFinance.ts`:**
- `INDICES` — 6 symbols including `^VIX` and `^TNX`
- `SECTOR_ETFS` — 11 SPDR ETFs
- `COMMODITIES` — 11 commodity ETFs (no futures, ETF proxies only)
- `SECTOR_MAP` / `COMMODITY_NAMES` — display name mappings

## Newsletter Design Goals

The newsletter must hook readers immediately. Rules:
- **Headline**: acts like a salesman — shocking but real, no clickbait lies
- **30-second summary**: top of page, 5 bullet points, full picture at a glance
- **"Why the market moved"**: one sentence explaining causation, not just numbers
- **Winners/Losers**: show symbol, name, % change, and reason
- **"What Actually Matters"**: distinguish signal from noise, call out what media hypes vs. what moves money
- **Tomorrow's Watchlist**: upcoming events with why each matters
- **Macro Corner**: DXY/oil/gold/yields with 2-3 sentence stock implication
- **Sentiment Score**: simple visual score (e.g. Bullish 7/10)

`summaryGenerator.ts` currently handles headline + mood + key points + analysis. Future AI-powered narrative generation should preserve this structure and extend it, not replace it.

## Styling

Tailwind CSS with dark theme. Color conventions:
- `text-up` / `bg-up` — green for gains
- `text-down` / `bg-down` — red for losses
- `bg-background`, `bg-muted`, `border-border` — dark slate palette defined in `index.css`

Radix UI primitives used for Dialog and Tooltip. Lucide React for icons. Recharts for sparklines/charts.
