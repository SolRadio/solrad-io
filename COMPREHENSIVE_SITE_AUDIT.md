# SOLRAD Comprehensive Site Audit Report

**Generated:** 2026-02-13
**Scope:** All 50 page routes, 56 components, 80 lib modules, 78 API routes
**Audit Areas:** Page structure, front-end/back-end alignment, data consistency, layout/typography/visual consistency

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Global Design System](#2-global-design-system)
3. [Shared Shell (Navbar + Footer)](#3-shared-shell)
4. [Page-by-Page Audit](#4-page-by-page-audit)
5. [Data Flow & API Alignment](#5-data-flow--api-alignment)
6. [Cross-Page Consistency Matrix](#6-cross-page-consistency-matrix)
7. [Findings & Recommendations](#7-findings--recommendations)

---

## 1. Architecture Overview

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Runtime | next-lite (browser-based) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Fonts | Geist (sans) + Geist Mono (mono) via `next/font/google` |
| Theme | Dark-first (`html.dark`), oklch color system |
| Storage | Vercel KV (Upstash Redis), Vercel Blob |
| Analytics | Vercel Analytics |
| SEO | JSON-LD structured data, canonical URLs, Open Graph, Twitter Cards |

### Route Groups
| Group | Routes | Purpose |
|-------|--------|---------|
| Core App | `/`, `/browse`, `/signals`, `/tracker`, `/research` | Main user-facing dashboard pages |
| Proof Engine | `/research`, `/lead-time-proof`, `/proof-engine/ledger-hash` | Signal verification system |
| Token Detail | `/token/[address]`, `/token` (redirect) | Individual token pages |
| Info/Legal | `/about`, `/faq`, `/scoring`, `/security`, `/infrastructure`, `/privacy`, `/terms`, `/disclaimer`, `/contact` | Static informational pages |
| Coming Soon | `/wallets`, `/alerts`, `/pro`, `/intelligence`, `/watchlist` | Feature placeholder pages |
| SEO Landing | `/solana-gem-finder`, `/solana-token-scanner`, `/solana-trending/*`, `/solana-meme-coin-scanner`, `/solana-risk-checker`, `/solana-token-dashboard`, `/solana-wallet-tracker` | SEO-optimized content pages |
| Learn | `/learn`, `/learn/[slug]`, `/learn/category/[slug]`, `/learn/how-to-find-gems` | Educational content |
| Research | `/research/daily/[date]`, `/research/weekly/[week]`, `/research/token/[token]/[date]` | Research reports |
| Admin | `/ops`, `/admin/alerts`, `/admin/ingest`, `/admin/intel`, `/admin/qa`, `/admin-cache-control` | Admin/ops dashboards |

---

## 2. Global Design System

### 2.1 Color Tokens (Dark Mode -- Primary)

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `oklch(0.06 0 0)` | Deep black base |
| `--foreground` | `oklch(0.92 0 0)` | Primary text |
| `--card` | `oklch(0.10 0 0)` | Card surfaces |
| `--primary` | `oklch(0.65 0.25 310)` | Brand purple -- buttons, links, accents |
| `--accent` | `oklch(0.72 0.18 200)` | Terminal cyan -- data accent |
| `--success` | `oklch(0.72 0.22 145)` | Financial green -- positive indicators |
| `--destructive` | `oklch(0.60 0.24 25)` | Red -- warnings, risk |
| `--muted` | `oklch(0.14 0 0)` | Subdued backgrounds |
| `--muted-foreground` | `oklch(0.55 0 0)` | Secondary text |
| `--border` | `oklch(0.18 0 0)` | Borders |

### 2.2 Typography

| Element | Font | Weight | Size Pattern |
|---------|------|--------|-------------|
| Body text | Geist (sans) | 400 | `text-sm` (14px) / `text-xs` (12px) |
| Headings | Geist (sans) | 800-900 (`font-black`) | `text-4xl` (H1), `text-2xl` (H2), `text-xl` (H3) |
| Monospace data | Geist Mono | 400-500 | `font-mono text-xs` for addresses, numbers |
| Nav labels | Geist (sans) | 700 (`font-bold`) | `text-xs uppercase tracking-wide` |

### 2.3 Spacing & Layout Patterns

| Pattern | Implementation |
|---------|---------------|
| Page shell | `min-h-screen flex flex-col bg-background` |
| Main content | `flex-1 container mx-auto px-4 py-12` |
| Content max-width | `max-w-3xl mx-auto` (legal), `max-w-4xl mx-auto` (info), `max-w-6xl` (data) |
| Card spacing | `space-y-6` between sections, `p-6` internal padding |
| Section headers | Icon + `text-2xl font-bold uppercase mb-6` |
| Border radius | `--radius: 0.75rem` (12px) via `rounded-lg` / `rounded-xl` |

### 2.4 Custom CSS Utilities

| Class | Purpose |
|-------|---------|
| `.breathe-dot` | Pulsing green dot for LIVE status |
| `.badge-glow` | Glowing effect on signal badges |
| `.glass-card` | Frosted glass card effect |
| `.shimmer` | Loading skeleton animation |
| `.ticker-content` | Horizontal scrolling market ticker |
| `.thin-scrollbar` | Narrow scrollbar for terminal views |
| `.safe-top` / `.safe-bottom` | Notch device safe areas |
| `.press-scale` | Tactile press feedback |

---

## 3. Shared Shell

### 3.1 Navbar (`components/navbar.tsx`)

**Structure:** Sticky top bar, `z-50`, background blur
**Breakpoints:**
- **Mobile (<lg):** Hamburger left, centered logo, admin+theme right. Sheet drawer for nav.
- **Desktop (lg+):** 3-zone: logo left, nav center, actions right. Dropdown for "Coming Soon" items.

**Nav Items:**
| Label | Route | Icon |
|-------|-------|------|
| DASHBOARD | `/` | Radar |
| TOKEN POOL | `/browse` | Search |
| SIGNAL OUTCOMES | `/signals` | Activity |
| TOP PERFORMERS | `/tracker` | Trophy |
| PROOF ENGINE | `/research` | FlaskConical |
| HOW SCORING WORKS | `/scoring` | Info |

**Coming Soon Items:** WALLETS (`/wallets`), ALERTS (`/alerts`), PRO (`/pro`)

**Data Dependencies:**
- `useNavbarMetadata()` hook -> `/api/index` (30s polling)
- Props: `onRefresh`, `isRefreshing`, `lastUpdated`, `stale`, `staleSeverity`, `tokenCount`

**Status Display (desktop xl+):** LIVE/STALE indicator, time since update, data sources, token count, Data Confidence tooltip

### 3.2 Footer (`components/footer.tsx`)

**Structure:** `border-t bg-background`, 3 responsive variants
**Breakpoints:**
- **Desktop (xl+):** Single horizontal bar -- nav links | copyright | live status + social
- **Tablet (md to xl):** 2 rows -- centered nav links, copyright + status
- **Mobile (<md):** Accordion "About SOLRAD" + flat link grid + copyright

**Links:** About, FAQ, Learn, Token Scanner, Security, Infrastructure, Privacy, Terms, Scoring, Score Lab, Research, Lead-Time, Contact, Disclaimer

**Hardcoded Copy:** "Updated 2m ago" (not dynamic), "SOL: Bullish", "Vol: Elevated" (static placeholders)

---

## 4. Page-by-Page Audit

### 4.1 Home / Dashboard (`app/page.tsx`)

| Property | Value |
|----------|-------|
| **Type** | Client Component (`"use client"`) |
| **Shell** | Navbar + Footer (inline) |
| **Layout** | Responsive: MobileTerminal / TabletTerminal / DesktopTerminal |
| **Data Source** | `/api/index` via SWR-like fetch with dedup guard |
| **Key Components** | TokenCardGrid, TokenRowMobile, DesktopTerminal, MobileContainer, TabletTerminal, MarketIntelTicker, ContextBar, TokenIndex, TokenDetailDrawer, GemFinderModal, LeadTimeRecentPanel, HowToPanel, DataFreshnessBar, LeftIntelStrip, AAdsRightRail |
| **State** | 20+ useState hooks: tokens (5 arrays), filters, stale tracking, warming, cooldown |
| **Metadata** | Set in layout.tsx (root), not in page |
| **Typography** | Consistent: `font-bold uppercase`, `text-xs`, `font-mono` for data |
| **Issues** | None -- follows all design patterns |

### 4.2 Token Pool / Browse (`app/browse/page.tsx`)

| Property | Value |
|----------|-------|
| **Type** | Server Component (RSC) with client child |
| **Shell** | Navbar + Footer (inline) |
| **Layout** | `container mx-auto` with BrowseContent client component |
| **Data Source** | Server-side fetch to `/api/tokens/archive?minScore=50` |
| **Metadata** | Full OG/Twitter/canonical |
| **Key Components** | BrowseContent (handles filtering, pagination, rendering) |
| **Issues** | None |

### 4.3 Signal Outcomes (`app/signals/page.tsx`)

| Property | Value |
|----------|-------|
| **Type** | Client Component |
| **Shell** | No Navbar/Footer (standalone) -- uses DataFreshnessBar |
| **Layout** | `min-h-screen bg-background`, back-link header |
| **Data Source** | `/api/signal-outcomes?range=7d` |
| **Key Components** | Table, TokenDetailDrawer, TokenSparkline |
| **Metadata** | None (client component) |
| **Typography** | Consistent uppercase headers, `font-mono` for data |
| **Issues** | MISSING Navbar/Footer -- inconsistent with other pages |

### 4.4 Top Performers / Tracker (`app/tracker/page.tsx`)

| Property | Value |
|----------|-------|
| **Type** | Client Component |
| **Shell** | Navbar + Footer (inline) |
| **Layout** | `min-h-screen flex flex-col`, container with grid/list/sparks views |
| **Data Source** | `/api/tracker?window=24h&mode=treasure` |
| **Key Components** | Card grid, DataFreshnessBar, Tabs (1h/4h/6h/24h/7d) |
| **Metadata** | None (client component) |
| **Sub-layout** | `app/tracker/layout.tsx` exists |
| **Issues** | None |

### 4.5 Proof Engine / Research (`app/research/page.tsx`)

| Property | Value |
|----------|-------|
| **Type** | Server Component (RSC) with ResearchClient child |
| **Shell** | Navbar + Footer (inline in RSC) |
| **Layout** | `min-h-screen flex flex-col bg-background` |
| **Data Source** | `loadAllResearchReports(30)` server-side |
| **Metadata** | Full metadata with keywords |
| **Key Components** | ResearchClient (1600+ line client component) |
| **Issues** | None |

### 4.6 About (`app/about/page.tsx`)

| Property | Value |
|----------|-------|
| **Type** | Server Component |
| **Shell** | Navbar + Footer |
| **Layout** | `min-h-screen flex flex-col bg-background`, `container mx-auto px-4 py-12`, `max-w-5xl` |
| **Metadata** | Full OG/Twitter/canonical with JSON-LD (Organization + WebApplication + Breadcrumb) |
| **Typography** | `text-4xl font-black uppercase` H1, `text-2xl font-bold uppercase` H2 |
| **Issues** | None |

### 4.7 Scoring (`app/scoring/page.tsx`)

| Property | Value |
|----------|-------|
| **Type** | Server Component |
| **Shell** | Navbar + Footer |
| **Layout** | `container mx-auto px-4 py-12`, `max-w-4xl mx-auto` |
| **Metadata** | Full OG/Twitter/canonical with Breadcrumb JSON-LD |
| **Typography** | Standard pattern |
| **Issues** | None |

### 4.8 Security (`app/security/page.tsx`)

| Property | Value |
|----------|-------|
| **Type** | Server Component |
| **Shell** | Navbar + Footer |
| **Layout** | `container mx-auto px-4 py-12`, `max-w-4xl mx-auto` |
| **Metadata** | Full OG/Twitter/canonical |
| **Typography** | Standard pattern. Green-500 accent for security cards. |
| **Issues** | None |

### 4.9 Infrastructure (`app/infrastructure/page.tsx`)

| Property | Value |
|----------|-------|
| **Type** | Server Component |
| **Shell** | Navbar + Footer |
| **Layout** | Same as Security -- `container mx-auto px-4 py-12` |
| **Metadata** | Full OG/Twitter/canonical |
| **Issues** | None |

### 4.10 FAQ (`app/faq/page.tsx`)

| Property | Value |
|----------|-------|
| **Type** | Server Component |
| **Shell** | Navbar + Footer |
| **Layout** | `container mx-auto px-4 py-12`, `max-w-4xl mx-auto` |
| **Metadata** | Full metadata + FAQPage JSON-LD schema + Breadcrumb |
| **Key Components** | Accordion (shadcn) |
| **Issues** | None |

### 4.11 Privacy (`app/privacy/page.tsx`)

| Property | Value |
|----------|-------|
| **Type** | Server Component |
| **Shell** | Navbar + Footer |
| **Layout** | `container mx-auto px-4 py-12`, `max-w-3xl mx-auto` |
| **Metadata** | None (missing explicit metadata export) |
| **Typography** | H1: `text-4xl font-black uppercase`, H2: `text-xl font-bold uppercase` |
| **Issues** | MISSING metadata export (no title/description/canonical) |

### 4.12 Terms (`app/terms/page.tsx`)

| Property | Value |
|----------|-------|
| **Type** | Server Component |
| **Shell** | Navbar + Footer |
| **Layout** | Identical to Privacy -- `max-w-3xl mx-auto` |
| **Metadata** | None (missing explicit metadata export) |
| **Issues** | MISSING metadata export |

### 4.13 Disclaimer (`app/disclaimer/page.tsx`)

| Property | Value |
|----------|-------|
| **Type** | Server Component |
| **Shell** | Navbar + Footer |
| **Layout** | Identical to Privacy/Terms |
| **Metadata** | None (missing explicit metadata export) |
| **Issues** | MISSING metadata export |

### 4.14 Contact (`app/contact/page.tsx`)

| Property | Value |
|----------|-------|
| **Type** | Server Component |
| **Shell** | Navbar + Footer |
| **Layout** | Identical pattern -- `max-w-3xl mx-auto` |
| **Metadata** | None (missing explicit metadata export) |
| **Issues** | MISSING metadata export |

### 4.15 Score Lab (`app/score-lab/page.tsx`)

| Property | Value |
|----------|-------|
| **Type** | Client Component |
| **Shell** | Provided by sub-layout (`app/score-lab/layout.tsx`) |
| **Data Source** | `/api/score-lab` |
| **Issues** | None |

### 4.16 Lead-Time Proof (`app/lead-time-proof/page.tsx`)

| Property | Value |
|----------|-------|
| **Type** | Server Component |
| **Shell** | Uses Navbar + Footer (inline) |
| **Metadata** | Partial (has title, description, OG -- no canonical) |
| **Issues** | MISSING canonical URL |

### 4.17 Learn Hub (`app/learn/page.tsx`)

| Property | Value |
|----------|-------|
| **Type** | Server Component |
| **Shell** | Navbar + Footer |
| **Metadata** | Full metadata + Breadcrumb JSON-LD |
| **Key Components** | Card grid linking to learn articles |
| **Issues** | None |

### 4.18 Watchlist (`app/watchlist/page.tsx`)

| Property | Value |
|----------|-------|
| **Type** | Client Component |
| **Shell** | Navbar + Footer |
| **Data Source** | `useWatchlist()` hook (localStorage) + `/api/tokens/batch` for live data |
| **Issues** | Uses localStorage for persistence (watchlist mints) -- acceptable for client preference |

### 4.19 Wallets (`app/wallets/page.tsx`)

| Property | Value |
|----------|-------|
| **Type** | Client Component |
| **Shell** | Navbar + Footer |
| **Layout** | `min-h-screen flex flex-col bg-background` |
| **Status** | Coming Soon -- uses LockedFeatureCard |
| **Issues** | MISSING metadata export |

### 4.20 Alerts (`app/alerts/page.tsx`)

| Property | Value |
|----------|-------|
| **Type** | Client Component |
| **Shell** | Navbar + Footer |
| **Status** | Coming Soon -- uses ComingSoonPill |
| **Issues** | MISSING metadata export |

### 4.21 Intelligence (`app/intelligence/page.tsx`)

| Property | Value |
|----------|-------|
| **Type** | Client Component |
| **Shell** | Navbar + Footer |
| **Status** | Coming Soon |
| **Issues** | MISSING metadata export |

### 4.22 Pro (`app/pro/page.tsx`)

| Property | Value |
|----------|-------|
| **Type** | Server Component wrapper + ProContent client child |
| **Shell** | ProContent includes Navbar + Footer |
| **Metadata** | Full OG + canonical + Breadcrumb + FAQ JSON-LD |
| **Issues** | None |

### 4.23 Ops (`app/ops/page.tsx`)

| Property | Value |
|----------|-------|
| **Type** | Client Component |
| **Shell** | None (standalone admin page) |
| **Layout** | `min-h-screen flex items-center justify-center bg-background` |
| **Auth** | Password-based auth via `/api/ops/auth` |
| **Issues** | Intentionally standalone -- no Navbar/Footer (admin-only) |

### 4.24 Token Detail (`app/token/[address]/page.tsx`)

| Property | Value |
|----------|-------|
| **Type** | Server Component |
| **Shell** | Has own layout (`app/token/[address]/layout.tsx`) |
| **Data Source** | `/api/token/[mint]` server-side fetch |
| **Metadata** | Dynamic metadata via `generateMetadata()` |
| **Issues** | None |

### 4.25 Token Redirect (`app/token/page.tsx`)

| Property | Value |
|----------|-------|
| **Type** | Server Component |
| **Purpose** | Redirects `/token?mint=X` to `/token/X` |
| **Issues** | None |

### 4.26 SEO -- Solana Gem Finder (`app/(seo)/solana-gem-finder/page.tsx`)

| Property | Value |
|----------|-------|
| **Type** | Server Component |
| **Shell** | Navbar + Footer |
| **Metadata** | Full metadata + Breadcrumb + FAQ JSON-LD |
| **Layout** | `container mx-auto px-4 py-16` (py-16 vs standard py-12) |
| **Issues** | Slightly larger padding (py-16 vs py-12) -- intentional for SEO landing feel |

### 4.27 SEO -- Solana Token Scanner (`app/(seo)/solana-token-scanner/page.tsx`)

| Property | Value |
|----------|-------|
| **Type** | Server Component |
| **Shell** | Navbar + Footer |
| **Metadata** | Full metadata + Breadcrumb + FAQ JSON-LD |
| **Issues** | None |

### 4.28 SEO -- Solana Trending Pages (`app/(seo)/solana-trending/*`)

| Property | Value |
|----------|-------|
| **Type** | Server Components |
| **Shell** | Via `solana-trending/layout.tsx` (Navbar + Footer) |
| **Variants** | `last-1h`, `last-6h`, `last-24h`, `by-volume`, `by-liquidity`, `by-holders` |
| **Metadata** | Each has full metadata + canonical |
| **Issues** | None |

### 4.29 SEO -- Meme Coin Scanner (`app/solana-meme-coin-scanner/page.tsx`)

| Property | Value |
|----------|-------|
| **Type** | Server Component |
| **Shell** | Navbar + Footer |
| **Metadata** | Full metadata + canonical |
| **Issues** | None |

### 4.30 SEO -- Risk Checker (`app/solana-risk-checker/page.tsx`)

| Property | Value |
|----------|-------|
| **Type** | Server Component |
| **Shell** | Navbar + Footer |
| **Metadata** | Full metadata + canonical |
| **Issues** | None |

### 4.31 SEO -- Token Dashboard (`app/solana-token-dashboard/page.tsx`)

| Property | Value |
|----------|-------|
| **Type** | Server/Client hybrid |
| **Shell** | Navbar + Footer |
| **Metadata** | Full metadata |
| **Issues** | None |

### 4.32 SEO -- Wallet Tracker (`app/solana-wallet-tracker/page.tsx`)

| Property | Value |
|----------|-------|
| **Type** | Server Component |
| **Shell** | Navbar + Footer |
| **Metadata** | Full metadata |
| **Issues** | None |

### 4.33 Insights (`app/insights/[slug]/page.tsx`)

| Property | Value |
|----------|-------|
| **Type** | Server Component |
| **Shell** | Navbar + Footer |
| **Metadata** | Dynamic via `generateMetadata()` |
| **Issues** | None |

### 4.34 Admin Pages (`app/admin/*`)

| Property | Value |
|----------|-------|
| **Type** | All Client Components |
| **Shell** | Standalone (no Navbar/Footer) -- admin-only |
| **Auth** | Password-protected |
| **Pages** | alerts, ingest, intel, qa |
| **Issues** | Intentionally standalone |

### 4.35 Proof Engine Ledger Hash (`app/proof-engine/ledger-hash/page.tsx`)

| Property | Value |
|----------|-------|
| **Type** | Standalone verification page |
| **Shell** | Minimal |
| **Issues** | None |

### 4.36 Admin Cache Control (`app/admin-cache-control/page.tsx`)

| Property | Value |
|----------|-------|
| **Type** | Client Component |
| **Shell** | Standalone admin |
| **Issues** | None -- intentionally admin-only |

---

## 5. Data Flow & API Alignment

### 5.1 Primary Data Pipeline

```
Ingest Sources (DexScreener, QuickNode RPC, Jupiter, Pump.fun)
    |
    v
/api/cron/ingest (every 5min) --> Vercel KV
    |
    v
/api/index (read) --> Home Dashboard
/api/tokens (read) --> Browse / Token Pool
/api/tracker (read) --> Top Performers
/api/signal-outcomes (read) --> Signal Outcomes
/api/alpha-ledger (read) --> Proof Engine
/api/lead-time/* (read) --> Lead-Time Proofs
```

### 5.2 Type Contracts

| Interface | File | Consumers |
|-----------|------|-----------|
| `TokenScore` | `lib/types.ts` | Home, Browse, Signals, Tracker, Token Detail, Watchlist |
| `TokenData` | `lib/types.ts` | Ingest pipeline, adapters |
| `HeliusEnrichment` | `lib/types.ts` | Token Detail Drawer (display only) |
| `SourceType` | `lib/types.ts` | Sources Indicator |
| `TrackerMetrics` | `lib/types.ts` | Tracker page |
| `RiskLabel` | `lib/types.ts` | Multiple pages |
| `LeadTimeProof` | `lib/lead-time/types.ts` | Lead-time components |
| `AlphaLedgerEntry` | `lib/alpha-ledger.ts` | Proof Engine, Research |

### 5.3 Shared Hooks

| Hook | File | Used By |
|------|------|---------|
| `useNavbarMetadata` | `hooks/use-navbar-metadata.ts` | Navbar (polls `/api/index` every 30s) |
| `useSolPrice` | `hooks/use-sol-price.ts` | Home page |
| `useWatchlist` | `hooks/use-watchlist.ts` | Watchlist page, Token cards |
| `useToast` | `hooks/use-toast.ts` | Multiple pages |

### 5.4 API Route Inventory (Key Routes)

| Route | Method | Purpose | Consumers |
|-------|--------|---------|-----------|
| `/api/index` | GET | Main token index + metadata | Home, Navbar |
| `/api/tokens` | GET | Token list | Multiple |
| `/api/tokens/archive` | GET | Archived high-score tokens | Browse |
| `/api/tokens/batch` | POST | Batch token lookup | Watchlist |
| `/api/token/[mint]` | GET | Single token detail | Token page |
| `/api/token/[mint]/enrich` | GET | Enrichment data | Token drawer |
| `/api/tracker` | GET | Performance metrics | Tracker |
| `/api/signal-outcomes` | GET | Signal win/loss data | Signals |
| `/api/alpha-ledger` | GET | Proof engine entries | Research/Proof Engine |
| `/api/alpha-ledger/hash` | GET | Ledger integrity hash | Ledger hash page |
| `/api/lead-time/recent` | GET | Recent lead-time proofs | Lead-time panel |
| `/api/score-lab` | GET | Score backtesting | Score Lab |
| `/api/health` | GET | System health | Ops |
| `/api/proof-engine-health` | GET | Proof engine health | Health strip |
| `/api/sol-price` | GET | SOL/USD price | Home |

---

## 6. Cross-Page Consistency Matrix

### 6.1 Page Shell Consistency

| Page | Navbar | Footer | Shell Pattern |
|------|--------|--------|---------------|
| `/` (Home) | Yes | Yes | Standard |
| `/browse` | Yes | Yes | Standard |
| `/signals` | **NO** | **NO** | **Standalone -- INCONSISTENT** |
| `/tracker` | Yes | Yes | Standard (via layout) |
| `/research` | Yes | Yes | Standard |
| `/about` | Yes | Yes | Standard |
| `/faq` | Yes | Yes | Standard |
| `/scoring` | Yes | Yes | Standard |
| `/security` | Yes | Yes | Standard |
| `/infrastructure` | Yes | Yes | Standard |
| `/privacy` | Yes | Yes | Standard |
| `/terms` | Yes | Yes | Standard |
| `/disclaimer` | Yes | Yes | Standard |
| `/contact` | Yes | Yes | Standard |
| `/pro` | Yes | Yes | Standard (in ProContent) |
| `/wallets` | Yes | Yes | Standard |
| `/alerts` | Yes | Yes | Standard |
| `/intelligence` | Yes | Yes | Standard |
| `/watchlist` | Yes | Yes | Standard |
| `/learn` | Yes | Yes | Standard |
| `/score-lab` | Yes | Yes | Via layout |
| `/lead-time-proof` | Yes | Yes | Standard |
| `/token/[address]` | Yes | Yes | Via layout |
| `/ops` | **NO** | **NO** | Standalone (intentional -- admin) |
| `/admin/*` | **NO** | **NO** | Standalone (intentional -- admin) |
| SEO pages | Yes | Yes | Standard / via layout |

### 6.2 Metadata Consistency

| Page | Title | Description | Canonical | OG | Twitter | JSON-LD |
|------|-------|-------------|-----------|----|---------|---------| 
| `/` | Root layout | Root layout | Root layout | Root layout | Root layout | Root layout |
| `/browse` | Yes | Yes | Yes | Yes | -- | -- |
| `/signals` | **NO** | **NO** | **NO** | **NO** | **NO** | **NO** |
| `/tracker` | **NO** | **NO** | **NO** | **NO** | **NO** | **NO** |
| `/research` | Yes | Yes | Yes (inferred) | -- | -- | -- |
| `/about` | Yes | Yes | Yes | Yes | Yes | Org+App+Breadcrumb |
| `/faq` | Yes | Yes | Yes | Yes | Yes | FAQ+Breadcrumb |
| `/scoring` | Yes | Yes | Yes | Yes | Yes | Breadcrumb |
| `/security` | Yes | Yes | Yes | Yes | Yes | -- |
| `/infrastructure` | Yes | Yes | Yes | Yes | Yes | -- |
| `/privacy` | **NO** | **NO** | **NO** | **NO** | **NO** | **NO** |
| `/terms` | **NO** | **NO** | **NO** | **NO** | **NO** | **NO** |
| `/disclaimer` | **NO** | **NO** | **NO** | **NO** | **NO** | **NO** |
| `/contact` | **NO** | **NO** | **NO** | **NO** | **NO** | **NO** |
| `/pro` | Yes | Yes | Yes | Yes | -- | Breadcrumb+FAQ |
| `/wallets` | **NO** | **NO** | **NO** | **NO** | **NO** | **NO** |
| `/alerts` | **NO** | **NO** | **NO** | **NO** | **NO** | **NO** |
| `/intelligence` | **NO** | **NO** | **NO** | **NO** | **NO** | **NO** |
| `/watchlist` | **NO** | **NO** | **NO** | **NO** | **NO** | **NO** |
| `/learn` | Yes | Yes | Yes | Yes | -- | Breadcrumb |
| `/lead-time-proof` | Yes | Yes | **NO** | Yes | -- | -- |
| `/score-lab` | **NO** | **NO** | **NO** | **NO** | **NO** | **NO** |
| SEO pages | Yes | Yes | Yes | Yes | Yes | Various |
| `/token/[address]` | Dynamic | Dynamic | Dynamic | Dynamic | -- | -- |

### 6.3 Typography Consistency

| Pattern | Expected | Violations |
|---------|----------|------------|
| H1 | `text-4xl font-black uppercase tracking-tight` | None found |
| H2 | `text-2xl font-bold uppercase mb-6` | Minor: some use `mb-4` |
| H3 | `text-xl font-bold uppercase mb-2/3` | Consistent |
| Body | `text-sm text-muted-foreground leading-relaxed` | Consistent |
| Cards | `Card className="p-6"` | Consistent (some use p-8) |
| Section gaps | `space-y-6` or `space-y-4` | Some variation (4 vs 6) |

### 6.4 Icon Usage Consistency

| Concept | Icon | Color | Consistent? |
|---------|------|-------|-------------|
| Security/Safety | Shield | `text-green-500` | Yes |
| Risk/Warning | AlertTriangle | `text-destructive` | Yes |
| Data/Database | Database | `text-primary` | Yes |
| Live Status | Dot + "LIVE" | `text-green-500` | Yes |
| Trending | TrendingUp | `text-green-500` | Yes |
| Activity | Activity | `text-primary` or `text-green-500` | Slight variation |
| Search | Search | default | Yes |
| Info | Info | `text-primary` or `text-muted-foreground` | Slight variation |

---

## 7. Findings & Recommendations

### 7.1 Critical Issues

| # | Issue | Severity | Pages Affected |
|---|-------|----------|----------------|
| C1 | `/signals` page has no Navbar or Footer | HIGH | `/signals` |
| C2 | 9 pages missing metadata exports entirely | MEDIUM | `/privacy`, `/terms`, `/disclaimer`, `/contact`, `/wallets`, `/alerts`, `/intelligence`, `/watchlist`, `/score-lab` |
| C3 | `/signals` and `/tracker` are client components with no metadata | MEDIUM | `/signals`, `/tracker` |

### 7.2 Minor Issues

| # | Issue | Severity | Pages Affected |
|---|-------|----------|----------------|
| M1 | Footer has hardcoded "Updated 2m ago" / "SOL: Bullish" / "Vol: Elevated" instead of live data | LOW | All pages with footer |
| M2 | `/lead-time-proof` missing canonical URL in metadata | LOW | `/lead-time-proof` |
| M3 | SEO landing pages use `py-16` while standard pages use `py-12` | TRIVIAL | SEO pages (intentional) |
| M4 | Some sections use `space-y-4` while others use `space-y-6` | TRIVIAL | Various |
| M5 | Info icon color varies between `text-primary` and `text-muted-foreground` | TRIVIAL | Various |

### 7.3 Data Integrity Observations

| Check | Status | Notes |
|-------|--------|-------|
| All data pages use same `TokenScore` type | PASS | Consistent across Home, Browse, Signals, Tracker, Watchlist |
| API routes return consistent shapes | PASS | All checked routes return expected JSON structures |
| normalizeMint() used consistently | PASS | After recent audit -- all mint handling goes through normalization |
| SourceType labels are truthful | PASS | After recent audit -- "helius" maps to "On-Chain (RPC)" in UI |
| No wallet/custody claims | PASS | All pages consistently say "read-only, no wallet required" |
| JSON-LD schemas are valid | PASS | Organization, WebApplication, FAQ, Breadcrumb, Dataset schemas |

### 7.4 Recommended Actions (Priority Order)

1. **Add Navbar + Footer to `/signals` page** -- Currently the only public-facing page missing the shell
2. **Add metadata exports to 9 pages** -- Privacy, Terms, Disclaimer, Contact need SEO metadata; Coming Soon pages (Wallets, Alerts, Intelligence) and Score Lab/Watchlist should have basic titles
3. **Convert `/signals` and `/tracker` to RSC wrapper + client child** -- Enables metadata exports
4. **Make footer status dynamic** -- Replace hardcoded "2m ago" / "Bullish" / "Elevated" with real data or remove
5. **Add canonical to `/lead-time-proof`** -- Minor SEO fix

---

*End of Comprehensive Site Audit Report*
