# PROJECT BONES REPORT

> Generated 2026-02-14. Single source of truth for SOLRAD's architecture. Reference this before writing prompts.

---

## 1) ROUTES MAP

### User-Facing Pages

| Route | Purpose |
|---|---|
| `/` | Homepage dashboard -- token grid/table, mobile/desktop terminals, lead-time map |
| `/browse` | Full token pool browser with filters, sort, and search |
| `/tracker` | Top performer tracker with time-window filtering |
| `/signals` | Signal outcomes ledger (PRO-gated rows 4+) |
| `/research` | Proof Engine -- 4 tabs: Alpha Ledger, Lead-Time Ledger, Alerts, Methodology |
| `/research/daily/[date]` | Daily research report by date |
| `/research/weekly/[week]` | Weekly research report by week |
| `/research/token/[token]/[date]` | Per-token research deep-dive |
| `/watchlist` | User watchlist with ContextBar, LeftIntelStrip, AAdsRightRail |
| `/score-lab` | Interactive score breakdown sandbox |
| `/lead-time-proof` | Lead-time proof engine page |
| `/proof-engine/ledger-hash` | Cryptographic ledger hash verification |
| `/token/[address]` | Individual token detail page (SSR with dynamic OG) |
| `/token` | Token search/redirect page |
| `/alerts` | Alert types overview (coming soon) |
| `/wallets` | Wallet tracking features (coming soon) |
| `/intelligence` | AI intelligence features (coming soon) |
| `/pro` | PRO upgrade page + DevProToggle (?dev=1) |
| `/about` | About SOLRAD |
| `/scoring` | Scoring methodology explanation |
| `/security` | Security practices and architecture |
| `/infrastructure` | Infrastructure overview |
| `/faq` | Frequently asked questions |
| `/learn` | Educational article index |
| `/learn/[slug]` | Individual learn article |
| `/learn/category/[slug]` | Learn articles by category |
| `/learn/how-to-find-gems` | Featured guide |
| `/insights/[slug]` | Insights articles |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/disclaimer` | Risk disclaimer |
| `/contact` | Contact page |

### SEO Landing Pages (Route Group: `(seo)`)

| Route | Purpose |
|---|---|
| `/solana-gem-finder` | SEO page targeting "solana gem finder" |
| `/solana-token-scanner` | SEO page targeting "solana token scanner" |
| `/solana-trending/last-1h` | Trending tokens last 1 hour |
| `/solana-trending/last-6h` | Trending tokens last 6 hours |
| `/solana-trending/last-24h` | Trending tokens last 24 hours |
| `/solana-trending/by-holders` | Trending by holder count |
| `/solana-trending/by-liquidity` | Trending by liquidity |
| `/solana-trending/by-volume` | Trending by volume |

### Standalone SEO Pages (No Route Group)

| Route | Purpose |
|---|---|
| `/solana-meme-coin-scanner` | Meme coin scanner landing |
| `/solana-risk-checker` | Risk checker landing |
| `/solana-token-dashboard` | Token dashboard landing |
| `/solana-wallet-tracker` | Wallet tracker landing |

### Admin/Ops Pages

| Route | Purpose |
|---|---|
| `/ops` | Operations panel (auth-gated) -- ingest control, cache flush, mint management |
| `/admin/alerts` | Admin alert rule management |
| `/admin/ingest` | Admin ingestion monitoring |
| `/admin/intel` | Admin intel generation and audit |
| `/admin/qa` | Admin QA test runner |
| `/admin-cache-control` | Cache control panel |

---

## 2) KEY USER SURFACES (UI)

### Homepage (`/`)

**Main Components:**
- `desktop-terminal.tsx` -- Desktop token table (renders `TokenRowDesktop` per token)
- `tablet-terminal.tsx` -- Tablet-optimized layout
- `mobile-container.tsx` + `mobile-terminal.tsx` -- Mobile card stack
- `filter-bar.tsx` -- Sort/filter controls
- `live-signal-strip.tsx` -- Live signal ticker at top
- `market-intel-ticker.tsx` -- Market intel scrolling ticker
- `data-freshness-bar.tsx` -- Data age indicator
- `token-detail-drawer.tsx` -- Slide-out token detail panel (used site-wide)

**Data Sources:**
- `/api/tokens` -> `lib/storage.ts` -> Upstash KV (`solrad:latest`)
- `/api/lead-time/recent` -> lead-time proofs map
- `/api/sol-price` -> SOL/USD price
- `/api/active-trading` -> active trading status
- `leadTimeProofsMap` passed through to `DesktopTerminal` -> `TokenRowDesktop`

### Research / Proof Engine (`/research`)

**Tabs (TabId union):**

| Tab ID | Label | What It Renders |
|---|---|---|
| `ledger` | Alpha Ledger | Fetches `/api/alpha-ledger` -- cryptographically-hashed entries of token research snapshots |
| `leadtime` | Lead-Time Ledger | Fetches `/api/leadtime-ledger` -- lead-time proof records with block/second measurements |
| `alerts` | Alerts | `AlertsTab` component -- fetches `/api/lead-time/recent?limit=30` -- event feed of recent observations |
| `methodology` | Methodology | Static content explaining the scoring and proof methodology |

**Deep-link support:** `?tab=ledger|leadtime|alerts|methodology` or `#ledger` etc.

**Related Sub-Components:**
- `ResearchClient.tsx` -- Main client component with all tab logic
- `alerts-tab.tsx` -- Alerts tab panel
- `proof-summary-drawer.tsx` -- Proof detail drawer

### Signals (`/signals`)

**Gating Logic:**
- `usePro()` hook reads `solrad_pro` from localStorage
- `FREE_PREVIEW_ROWS = 3` -- first 3 rows visible to all users
- Rows 4+ show blur overlay with "Unlock High-Conviction Signals" + "Upgrade to PRO" button -> `/pro`

**Data Source:**
- Fetches `/api/signal-outcomes` with `?minScore=` threshold parameter
- Threshold selector: [60, 65, 70, 75, 80]

---

## 3) API MAP (Backend)

### Tokens / Market Data

| Route | Method | Purpose |
|---|---|---|
| `/api/tokens` | GET | Returns all tracked tokens from KV (`solrad:latest`) |
| `/api/tokens/batch` | POST | Batch token lookup by mint addresses |
| `/api/tokens/archive` | GET | Archived/delisted tokens |
| `/api/tokens/archive/health` | GET | Archive health check |
| `/api/token/[mint]` | GET | Single token detail by mint address |
| `/api/token/[mint]/enrich` | POST | Enrich token with on-chain data via Helius API |
| `/api/token/live` | GET | Live token data (real-time refresh) |
| `/api/quote/[mint]` | GET | DexScreener price quote for a mint |
| `/api/sol-price` | GET | SOL/USD price (CoinGecko + fallback) |
| `/api/token-history` | GET | Historical token data points |
| `/api/active-trading` | GET | Active trading pair status |
| `/api/tracker` | GET | Top performer tracker data |
| `/api/held-duration` | GET | Token held-duration stats |
| `/api/test-dex-fetch` | GET | DexScreener connectivity test |

### Scoring / Engine

| Route | Method | Purpose |
|---|---|---|
| `/api/score-lab` | GET/POST | Score simulation/breakdown sandbox |
| `/api/signal-outcomes` | GET | Signal outcome history with win/loss stats |
| `/api/index` | GET | Token index for search/autocomplete |

### Proof / Lead-Time

| Route | Method | Purpose |
|---|---|---|
| `/api/lead-time/[mint]` | GET | Lead-time proof for a specific mint |
| `/api/lead-time/recent` | GET | Recent lead-time proofs (batch). Params: `?limit=N` |
| `/api/lead-time/debug` | GET | Lead-time debug info (admin-keyed) |
| `/api/leadtime-ledger` | GET | Full lead-time ledger for research tab |
| `/api/alpha-ledger` | GET | Alpha ledger entries |
| `/api/alpha-ledger/hash` | GET | Current ledger hash |
| `/api/alpha-ledger/hash-history` | GET | Historical hash chain |
| `/api/proof-engine-health` | GET | Proof engine health check |
| `/api/proof-engine-status` | GET | Proof engine status dashboard |

### Ingestion

| Route | Method | Purpose |
|---|---|---|
| `/api/ingest` | POST | Manual ingestion trigger (ops-password gated) |
| `/api/ingest/cycle` | POST | Full ingest cycle orchestrator |
| `/api/ingest/new-mints` | POST | Helius-based new mint discovery |
| `/api/ingest/new-mints-qn` | POST | QuickNode-based new mint discovery |
| `/api/ingest/health` | GET | Ingestion pipeline health |
| `/api/refresh` | POST | Refresh token data |
| `/api/bootstrap` | POST | Bootstrap initial token set |
| `/api/trigger-ingestion` | POST | Trigger ingestion from external source |

### Intel

| Route | Method | Purpose |
|---|---|---|
| `/api/intel/generate/daily` | POST | Generate daily intel report (OpenAI) |
| `/api/intel/rebuild` | POST | Rebuild intel from existing data |
| `/api/news/solana` | GET | Solana news aggregation |
| `/api/research/generate` | POST | Generate research report |
| `/api/research/generate/daily` | POST | Generate daily research |
| `/api/research/generate/weekly` | POST | Generate weekly research |
| `/api/research/publish` | POST | Publish research to blob storage |

### Admin / Ops

| Route | Method | Purpose |
|---|---|---|
| `/api/ops/auth` | POST | Ops authentication check |
| `/api/ops/login` | POST | Ops login (sets cookie) |
| `/api/ops/logout` | POST | Ops logout (clears cookie) |
| `/api/ops/add-mint` | POST | Manually add a mint to tracking |
| `/api/ops/remove-mint` | POST | Remove a mint from tracking |
| `/api/ops/check` | GET | Ops health check |
| `/api/ops/flush-cache` | POST | Flush KV cache |
| `/api/ops/invalidate-cache` | POST | Invalidate specific cache keys |
| `/api/ops/fix-addresses` | POST | Fix malformed mint addresses |
| `/api/ops/nuclear-clear` | POST | Nuclear clear all data (dangerous) |
| `/api/admin/alerts` | GET/POST | Alert management CRUD |
| `/api/admin/alert-rules` | GET/POST | Alert rule configuration |
| `/api/admin/alert-delivery` | POST | Trigger alert delivery |
| `/api/admin/alpha-ledger/append` | POST | Append entry to alpha ledger |
| `/api/admin/alpha-ledger/harvest` | POST | Harvest outcomes into ledger |
| `/api/admin/alpha-ledger/void` | POST | Void a ledger entry |
| `/api/admin/flush-index-cache` | POST | Flush token index cache |
| `/api/admin/ingest/retry-resolution` | POST | Retry failed token resolution |
| `/api/admin/ingest/stats` | GET | Ingestion statistics |
| `/api/admin/intel/audit` | GET | Intel audit log |
| `/api/admin/intel/generate` | POST | Manual intel generation trigger |
| `/api/admin/intel/history` | GET | Intel generation history |
| `/api/admin/intel/latest` | GET | Latest intel report |
| `/api/admin/intel/send` | POST | Send intel via Telegram |
| `/api/admin/qa/run` | POST | Run QA suite |
| `/api/diagnostics` | GET | System diagnostics |
| `/api/diagnostics/rate-limits` | GET | Rate limit status |
| `/api/health` | GET | System health check |
| `/api/health/quicknode` | GET | QuickNode RPC health |
| `/api/health/quicknode-lastrun` | GET | QuickNode last run timestamp |

### Cron Jobs

| Route | Method | Purpose |
|---|---|---|
| `/api/cron` | POST | Main cron orchestrator |
| `/api/cron/ingest` | POST | Scheduled ingestion (Helius or QuickNode) |
| `/api/cron/alpha-ledger` | POST | Scheduled alpha ledger harvest |
| `/api/cron/snapshot` | POST | Scheduled snapshot logging |

### Telegram

| Route | Method | Purpose |
|---|---|---|
| `/api/telegram/alert` | POST | Send alert to Telegram channel |
| `/api/telegram/internal-trigger` | POST | Internal trigger for Telegram alerts |

### Misc

| Route | Method | Purpose |
|---|---|---|
| `/api/waitlist` | POST | Waitlist signup (stores in KV) |

---

## 4) DATA FLOW SUMMARY

### DexScreener

```
DexScreener API
  -> lib/adapters/dexscreener.ts  (fetches pairs, caches to KV)
  -> Cached at: solrad:source:dexscreener
  -> Consumed by: lib/ingestion.ts (token enrichment)
  -> Consumed by: /api/quote/[mint] (live price quotes)
  -> UI surfaces: token cards, detail drawer, price displays
```

### QuickNode RPC

```
QuickNode Solana RPC (QUICKNODE_SOLANA_RPC_URL)
  -> lib/adapters/helius.ts (on-chain enrichment -- holder count, supply)
  -> app/api/ingest/new-mints-qn/route.ts (new mint discovery via getProgramAccounts)
  -> Cached at: helius:enrich:{mint} (per-token enrichment cache)
  -> UI surfaces: holder counts, supply data in token cards/drawer
```

### Upstash KV Key Prefixes

| Prefix | Purpose | TTL |
|---|---|---|
| `solrad:latest` | Current scored token array | Refreshed each ingest cycle |
| `solrad:lastUpdated` | Last data update timestamp | -- |
| `solrad:sourceMeta` | Source metadata | -- |
| `solrad:lock:ingestion` | Ingestion mutex lock | Short-lived |
| `solrad:lastIngestTime` | Last ingest timestamp | -- |
| `solrad:ingestionStatus` | Pipeline status (ready/degraded) | -- |
| `solrad:tokens:fallback` | Token fallback cache | 1h |
| `solrad:tokens:blob-fallback` | Blob-derived fallback | -- |
| `solrad:last_good_index` | Last-known-good token set | -- |
| `solrad:last_good_count` | Token count at last good state | -- |
| `solrad:last_good_at` | Timestamp of last good state | -- |
| `solrad:source:dexscreener` | DexScreener response cache | TTL per adapter |
| `helius:enrich:{mint}` | Per-token on-chain enrichment | TTL per adapter |
| `solrad:alpha:ledger` | Alpha ledger entries | -- |
| `solrad:alpha:ledger:meta` | Alpha ledger metadata | -- |
| `solrad:alpha:ledger:hashHistory` | Ledger hash chain | -- |
| `solrad:lock:alphaLedger` | Alpha ledger write lock | Short-lived |
| `solrad:leadtime:{mint}` | Per-mint lead-time proof | -- |
| `solrad:leadtime:stats:{mint}` | Per-mint lead-time statistics | -- |
| `solrad:leadtime:recent` | Recent proofs array (global) | -- |
| `solrad:leadtime:obs:{mint}` | Pending observations (old prefix) | -- |
| `solrad:leadtime:observation:{mint}` | Pending observations (writer prefix) | -- |
| `solrad:signalState:{mint}` | Per-mint signal state (EARLY/CAUTION/STRONG) | -- |
| `solrad:signalTransitions` | Global signal transition log | -- |
| `solrad:signalTransitions:{mint}` | Per-mint transition history | -- |
| `solrad:signalStateAlerts` | Signal state alert log | -- |
| `solrad:signalAlertDedupe:{mint}:{from}:{to}` | Alert deduplication keys | TTL |
| `solrad:alertRules` | Alert rule definitions | -- |
| `solrad:alertDeliveryLog` | Alert delivery audit log | -- |
| `solrad:snapshots:index` | Snapshot index | -- |
| `solrad:snapshots:{date}` | Daily snapshots | -- |
| `solrad:ts:{mint}` | Per-token time series | -- |
| `solrad:tokenIndex:v1` | Token search index | -- |
| `solrad:tokenIndex:meta` | Token index metadata | -- |
| `solrad:watchlist:v1` | User watchlist (client-side localStorage) | -- |
| `intel:latest` | Latest intel report | -- |
| `intel:daily:{date}` | Daily intel report | -- |
| `intel:news:latest` | Latest news summary | -- |
| `intel:news:{date}` | Daily news summary | -- |
| `intel:audit:log` | Intel generation audit log | -- |
| `solrad_intel_draft:{id}` | Intel draft storage | -- |
| `mint:*` | Legacy per-mint tracking keys | -- |
| `leadtime:last_writer_run_at` | Writer last run timestamp | 24h |
| `leadtime:last_writer_stats` | Writer run statistics | 24h |
| `leadtime:last_error` | Writer last error | 24h |

### Vercel Blob Storage

| Path | Contents |
|---|---|
| `solrad/state.json` | Full application state: trackedMints, tokensByMint, history, pins, tags, archiveByMint, meta |
| `solrad/snapshots.json` | Historical token snapshots |
| Research blobs (via `lib/research.ts`) | Published research reports (daily/weekly) |

---

## 5) DEPLOY / ENV FLAGS

### Required Environment Variables

| Variable | Used In | Purpose |
|---|---|---|
| `KV_REST_API_URL` | `lib/storage.ts`, diagnostics, health, waitlist | Upstash Redis REST URL |
| `KV_REST_API_TOKEN` | `lib/storage.ts`, diagnostics, health, waitlist | Upstash Redis REST token |
| `UPSTASH_REDIS_REST_URL` | `lib/storage.ts`, diagnostics | Upstash Redis (alternative key) |
| `UPSTASH_REDIS_REST_TOKEN` | `lib/storage.ts`, diagnostics | Upstash Redis (alternative key) |
| `BLOB_READ_WRITE_TOKEN` | `lib/blob-storage.ts`, `lib/snapshots.ts` | Vercel Blob access token |

### Auth / Security

| Variable | Used In | Purpose |
|---|---|---|
| `OPS_PASSWORD` | ops routes, admin routes, diagnostics | Ops panel authentication |
| `ADMIN_PASSWORD` | admin routes, ingest routes | Admin-level authentication |
| `ADMIN_ALERTS_PASSWORD` | admin alert routes | Alert admin authentication |
| `SOLRAD_INTERNAL_SECRET` | refresh, telegram, auth-helpers | Internal API call signing |
| `CRON_SECRET` | all cron routes, ingest | Vercel cron job verification |
| `SOLRAD_ADMIN_KEY` | lead-time debug | Admin debug access |

### External APIs

| Variable | Used In | Purpose |
|---|---|---|
| `HELIUS_API_KEY` | `lib/adapters/helius.ts`, ingest/new-mints, token enrich | Helius RPC API key |
| `QUICKNODE_SOLANA_RPC_URL` | ingest/new-mints-qn, health/quicknode | QuickNode Solana RPC endpoint |
| `OPENAI_API_KEY` | `lib/adapters/openai.ts`, intel generator, research | OpenAI API for intel generation |
| `TELEGRAM_BOT_TOKEN` | `lib/telegram.ts`, admin alert delivery | Telegram bot for alerts |
| `TELEGRAM_ALERTS_CHAT_ID` | `lib/telegram.ts`, admin alert delivery | Telegram channel for alerts |

### Feature Flags

| Variable | Used In | Purpose |
|---|---|---|
| `QUICKNODE_MINT_DISCOVERY_ENABLED` | cron/ingest, ingest/new-mints-qn, refresh | Enable QuickNode mint discovery |
| `HELIUS_MINT_DISCOVERY_ENABLED` | cron/ingest, ingest/new-mints | Enable Helius mint discovery |
| `NEXT_PUBLIC_ACTIVE_TRADING_ENABLED` | active-trading route, component | Enable active trading feature |
| `SOLRAD_PRO_MODE` | lead-time storage, lead-time debug | Enable PRO-tier features server-side |
| `LEAD_TIME_QA_SEED` | lead-time routes | Seed lead-time with QA data |

### Public / URL

| Variable | Used In | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | learn pages, token pages, refresh | Public site URL (default: https://www.solrad.io) |
| `NEXT_PUBLIC_BASE_URL` | admin alert delivery, refresh | Base URL for internal API calls |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | ops-panel component | Client-side admin password (dev) |
| `VERCEL_URL` | refresh, cron routes | Auto-set by Vercel |
| `VERCEL_ENV` | health/quicknode-lastrun | Vercel environment (production/preview) |
| `VERCEL_DEPLOYMENT_ID` | signal-outcomes | Current deployment identifier |
| `NODE_ENV` | various | Node environment (development/production) |

---

## 6) COMPONENT DEPENDENCY MAP (Key Components)

```
page.tsx (Homepage)
  ├── filter-bar.tsx
  ├── live-signal-strip.tsx
  ├── data-freshness-bar.tsx
  ├── desktop-terminal.tsx
  │   └── token-row-desktop.tsx
  │       ├── conviction-icon.tsx -> lib/conviction.ts
  │       ├── lead-time-badge.tsx
  │       ├── signal-badges.tsx
  │       └── sources-indicator.tsx
  ├── tablet-terminal.tsx
  ├── mobile-container.tsx
  │   └── mobile-terminal.tsx
  │       └── token-row-mobile.tsx
  └── token-detail-drawer.tsx
      ├── conviction-icon.tsx
      ├── lead-time-proof-panel.tsx
      └── sources-indicator.tsx

token-card.tsx (Used in watchlist, card-grid)
  ├── conviction-icon.tsx
  ├── lead-time-badge.tsx
  └── signal-badges.tsx

navbar.tsx (Global shell -- all pages)
footer.tsx (Global shell -- all pages)
```

---

## 7) SHARED HOOKS

| Hook | File | Purpose |
|---|---|---|
| `usePro` | `lib/use-pro.ts` | PRO status from localStorage (`solrad_pro`) |
| `useLeadTimeRecentMap` | `hooks/use-lead-time-recent.ts` | Batch lead-time proofs as Map |
| `useLatestLeadTimeProof` | `hooks/use-lead-time.ts` | Per-mint lead-time proof (N+1, use sparingly) |
| `useFreshQuote` | `hooks/use-fresh-quote.ts` | Real-time price quote via SWR |
| `useSolPrice` | `hooks/use-sol-price.ts` | SOL/USD price via SWR |
| `useTokenHistory` | `hooks/use-token-history.ts` | Token history data |
| `useWatchlist` | `hooks/use-watchlist.ts` | Watchlist CRUD (localStorage events) |
| `useNavbarMetadata` | `hooks/use-navbar-metadata.ts` | Navbar contextual data |
| `useIsMobile` | `hooks/use-mobile.ts` | Responsive breakpoint detection |

---

## 8) SHELL PATTERN

All user-facing pages follow the Server Component wrapper pattern:

```tsx
// page.tsx (Server Component)
export const metadata: Metadata = { title, description, alternates, openGraph, twitter }

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <PageClient />  {/* or inline RSC content */}
      </main>
      <Footer />
    </div>
  )
}
```

**Pages already following this pattern:** `/`, `/browse`, `/research`, `/signals`, `/tracker`, `/watchlist`, `/alerts`, `/wallets`, `/intelligence`, `/score-lab`, `/about`, `/scoring`, `/security`, `/infrastructure`, `/faq`, `/privacy`, `/terms`, `/disclaimer`, `/contact`, `/pro`, `/lead-time-proof`, `/learn`, all SEO pages.

---

*End of report. Keep this file updated as architecture evolves.*
