# SOLRAD Full Codebase Audit Report

**Generated:** 2026-02-21
**Auditor:** v0 Senior Engineer
**Codebase:** solrad.io (Next.js 16 / Tailwind v4 / Vercel)

---

## SUMMARY TABLE

| Metric | Count |
|---|---|
| Total Page Routes | 53 |
| Total Components (custom, non-ui) | 68 |
| Total UI Components (shadcn) | 57 |
| Total API Routes | 93 |
| Total Lib Modules | 93 |
| Total Hooks | 10 |
| Total Public Assets | 32 |
| Cron Jobs (vercel.json) | 7 |
| **Critical Issues** | **9** |
| **High Issues** | **14** |
| **Medium Issues** | **22** |
| **Low Issues** | **18** |

---

## 1. PROJECT STRUCTURE

### /app (Routes & Layouts)

#### Layouts (8)
| File | Purpose |
|---|---|
| `app/layout.tsx` | Root layout - dark mode, Geist fonts, JSON-LD, Analytics, Toaster, CookieConsent |
| `app/(seo)/solana-trending/layout.tsx` | SEO trending group layout |
| `app/browse/layout.tsx` | Browse page layout |
| `app/proof-engine/ledger-hash/layout.tsx` | Proof engine layout |
| `app/score-lab/layout.tsx` | Score lab layout |
| `app/token/[address]/layout.tsx` | Token detail layout |
| `app/tracker/layout.tsx` | Tracker layout |
| `app/watchlist/layout.tsx` | Watchlist layout |

#### Loading/Error/Not-Found (8)
| File | Type |
|---|---|
| `app/loading.tsx` | Root loading state |
| `app/not-found.tsx` | Root 404 page |
| `app/(seo)/solana-gem-finder/loading.tsx` | SEO page loading |
| `app/(seo)/solana-token-scanner/loading.tsx` | SEO page loading |
| `app/admin/intel/error.tsx` | Admin intel error boundary |
| `app/admin/status/loading.tsx` | Admin status loading |
| `app/browse/loading.tsx` | Browse loading |
| `app/watchlist/loading.tsx` | Watchlist loading |

**Missing error boundaries:** Only 1 error.tsx exists (admin/intel). No error boundaries for /browse, /token/[address], /tracker, /signals, /watchlist, /research, or the homepage. This is a **CRITICAL gap**.

#### SEO Files
| File | Purpose |
|---|---|
| `app/robots.ts` | robots.txt - blocks /api/, /admin/, /ops/, AI crawlers |
| `app/sitemap.ts` | Dynamic sitemap with chunked token sitemaps (score >= 75) |

### /components (125 files)

#### Custom Components (68)
| Component | Client/Server |
|---|---|
| `active-trading.tsx` | Client |
| `activity-health.tsx` | Client |
| `ads/AAdsRightRail.tsx` | Client |
| `badge-legend-modal.tsx` | Client |
| `badge-overflow-sheet.tsx` | Client |
| `browse-content.tsx` | Client |
| `coming-soon-pill.tsx` | Client |
| `compact-token-card.tsx` | Client |
| `context-bar.tsx` | Client |
| `conviction-badge.tsx` | Client |
| `conviction-icon.tsx` | Client |
| `cookie-consent.tsx` | Client |
| `data-freshness-bar.tsx` | Client |
| `desktop-terminal.tsx` | Client |
| `dev-pro-toggle.tsx` | Client |
| `filter-bar.tsx` | Client |
| `footer.tsx` | Server |
| `gem-finder-modal.tsx` | Client |
| `how-to-panel.tsx` | Client |
| `how-to-use-modal.tsx` | Client |
| `icon-badge.tsx` | Client |
| `lead-time-badge.tsx` | Client |
| `lead-time-proof-panel.tsx` | Client |
| `lead-time-proofs-feed.tsx` | Client |
| `lead-time-recent-panel.tsx` | Client |
| `left-intel-strip.tsx` | Client |
| `live-indicator.tsx` | Client |
| `live-intel-panel.tsx` | Client |
| `live-signal-strip.tsx` | Client |
| `locked-feature-card.tsx` | Client |
| `market-intel-ticker.tsx` | Client |
| `mobile-container.tsx` | Client |
| `mobile-header.tsx` | Client |
| `mobile-nav.tsx` | Client |
| `mobile-tabs/filters-tab.tsx` | Client |
| `mobile-tabs/learn-tab.tsx` | Client |
| `mobile-tabs/proof-tab.tsx` | Client |
| `mobile-tabs/radar-tab.tsx` | Client |
| `mobile-tabs/watchlist-tab.tsx` | Client |
| `mobile-terminal.tsx` | Client |
| `navbar.tsx` | Client |
| `not-tracked-page-component.tsx` | Client |
| `ops-login.tsx` | Client |
| `ops-panel.tsx` | Client |
| `pro-token-card-preview.tsx` | Client |
| `proof-engine-onboarding.tsx` | Client |
| `proof-engine-status-panel.tsx` | Client |
| `proof-preview-rail.tsx` | Client |
| `recent-lead-time-proofs.tsx` | Client |
| `research-insights.tsx` | Client |
| `seo/Schema.tsx` | Server |
| `signal-badges.tsx` | Client |
| `signal-state-badge.tsx` | Client |
| `sources-indicator.tsx` | Client |
| `stats-card.tsx` | Client |
| `tablet-terminal.tsx` | Client |
| `theme-provider.tsx` | Client |
| `theme-toggle.tsx` | Client |
| `token-card-grid.tsx` | Client |
| `token-card.tsx` | Client |
| `token-detail-drawer.tsx` | Client |
| `token-index.tsx` | Client |
| `token-micro-badge.tsx` | Client |
| `token-row-desktop.tsx` | Client |
| `token-row-mobile.tsx` | Client |
| `token-sparkline.tsx` | Client |
| `watchlist-button.tsx` | Client |
| `why-flagged.tsx` | Client |

#### shadcn/ui Components (57)
All standard shadcn components present in `components/ui/`. No custom modifications noted beyond defaults.

### /lib (93 files)

Organized into subfolders:
- `lib/adapters/` (6) - dexscreener, helius, jupiter, openai, pumpfun, index
- `lib/canonical/` (1) - canonicalToken.ts
- `lib/filters/` (1) - liveWindowFilter.ts
- `lib/ingest/` (2) - guard.ts, sources.ts
- `lib/intel/` (14) - converter, drafts, generator, integrity, newsFetch, newsSources, newsSummarize, openaiVoice, queries, redditGenerator, storage, templates, tokenIndex, types, winnersToday
- `lib/lead-time/` (6) - detector.ts, index.ts, normalize-mint.ts, storage.ts, types.ts, writer.ts
- `lib/research/` (1) - openai.ts
- `lib/signals/` (1) - deriveSignalRationale.ts
- `lib/solana/` (3) - extractMintsFromParsedTx.ts, normalizeMint.ts, validateMint.ts
- `lib/types/` (1) - research.ts
- `lib/utils/` (5) - normalize-risk.ts, signal-score.ts, solana.ts, solscan.ts, why-flagged.ts
- Root `lib/` (52) - auth, blob-storage, buildWhyFlagged, conviction, env, explorers, featureFlags, fetch-with-timeout, format, get-tracked-tokens, heldDuration, ingestion, internal-auth, kvUtils, logger, meta, normalize-token, research, researchStore, schema, scoring, scoring-v2, seo, seo-content-generator, signal-outcomes, signal-state, signals, snapshotLogger, snapshotRecency, snapshots, storage, suppress, telegram, time-series, token-origin, token-origin-accent, token-resolver, token-score, tracker, types, use-auto-refresh, use-pro, utils, watchlist, etc.

### /hooks (10 files)
| Hook | Purpose |
|---|---|
| `use-debounced-value.ts` | Debounce input values |
| `use-fresh-quote.ts` | Real-time token price quotes |
| `use-lead-time-recent.ts` | Lead time proof data |
| `use-lead-time.ts` | Lead time for single token |
| `use-mobile.ts` | Mobile breakpoint detection |
| `use-navbar-metadata.ts` | Navbar metadata hook |
| `use-sol-price.ts` | SOL price polling |
| `use-toast.ts` | Toast notifications |
| `use-token-history.ts` | Token price history |
| `use-watchlist.ts` | Watchlist management |

### /app/api (93 routes)
See Section 4 for full audit.

### Config Files
| File | Notes |
|---|---|
| `package.json` | Next 16.0.10, React 19.2, Tailwind 4.1.9, Zod 3.25, @vercel/kv + @vercel/blob + @upstash/redis |
| `next.config.mjs` | **`ignoreBuildErrors: true`**, `images.unoptimized: true`, remote patterns allow all hosts, SEO headers, optimizePackageImports |
| `tsconfig.json` | **strict: true** (good), target ES6, bundler resolution |
| `vercel.json` | 7 cron jobs defined |
| `proxy.ts` | Domain redirect (solrad.io -> www.solrad.io), internal job token bypass |
| `components.json` | shadcn config (New York style, oklch colors) |

### /public (32 assets)
- Brand assets: og-1200x630.png, twitter-1200x630.png, icon-512.png, apple-180.png, favicon.ico
- About page images: 5 generated JPGs
- Screenshots: 6 PNGs
- Legacy unused: 5 placeholder token images in `/legacy-unused/`
- Placeholders: placeholder-logo.png/svg, placeholder-user.jpg, placeholder.jpg/svg
- `site.webmanifest`, icon SVGs

---

## 2. PAGE ROUTE AUDIT

### Legend
- RSC = React Server Component, CC = Client Component ("use client")
- Nav/Footer = whether Navbar and Footer are rendered

### Client Component Pages (10 pages -- CANNOT export metadata)

| # | Path | Type | Nav | Footer | Metadata | Data Fetching | Key Children | Health |
|---|---|---|---|---|---|---|---|---|
| 1 | `/app/page.tsx` | CC | Yes (inline import) | Yes (inline) | **NO** (client component) | `fetch('/api/index')` in useEffect-like pattern + SWR-like polling | DesktopTerminal, MobileTerminal, TabletTerminal, TokenCardGrid, TokenDetailDrawer, Navbar, Footer, MarketIntelTicker, ContextBar, TokenIndex, GemFinderModal, LeadTimeRecentPanel, HowToPanel, DataFreshnessBar | **NEEDS WORK** - 960-line mega-component, no metadata export possible, all data fetching in client |
| 2 | `/app/tracker/page.tsx` | CC | Via layout | Yes | **NO** | `fetch('/api/tracker')` client-side | TrackerTable, token detail panels | NEEDS WORK |
| 3 | `/app/ops/page.tsx` | CC | No | No | **NO** | Client-side ops API calls | OpsLogin, OpsPanel | GOOD (admin page, no SEO needed) |
| 4 | `/app/admin/status/page.tsx` | CC | No | No | **NO** | Multiple admin API fetches | Status panels, diagnostics | GOOD |
| 5 | `/app/admin/alerts/page.tsx` | CC | No | No | **NO** | Admin alert API | Alert management panels | GOOD |
| 6 | `/app/admin/ingest/page.tsx` | CC | No | No | **NO** | Admin ingest API | Ingest monitoring | GOOD |
| 7 | `/app/admin/qa/page.tsx` | CC | No | No | **NO** | Admin QA API | QA test runner | GOOD |
| 8 | `/app/admin/suppress/page.tsx` | CC | No | No | **NO** | Admin suppress API | Token suppress management | GOOD |
| 9 | `/app/admin/tools/page.tsx` | CC | No | No | **NO** | Admin tools API | KV scan, diagnostics | GOOD |
| 10 | `/app/admin-cache-control/page.tsx` | CC | No | No | **NO** | Cache control APIs | Cache management | GOOD |

### Server Component Pages (43 pages -- CAN export metadata)

| # | Path | Type | Metadata | Nav | Footer | Key Notes | Health |
|---|---|---|---|---|---|---|---|
| 1 | `/app/about/page.tsx` | RSC | Yes (title, desc, OG, canonical, JSON-LD) | Via layout | Inline | Rich SEO, 5 generated images | GOOD |
| 2 | `/app/browse/page.tsx` | RSC | Yes (title, desc, OG, canonical) | Via layout | Yes | Token browse with pagination | GOOD |
| 3 | `/app/token/[address]/page.tsx` | RSC | Yes (`generateMetadata` with dynamic token data, canonical, noindex for low-score) | Via layout | Yes | Full token detail with JSON-LD, FAQ schema, breadcrumbs | GOOD |
| 4 | `/app/pro/page.tsx` | RSC | Yes (title, desc, OG, JSON-LD FAQ) | Yes | Yes | Pro tier landing, waitlist form | GOOD |
| 5 | `/app/alerts/page.tsx` | RSC | Yes | Yes | Yes | Alerts landing page | GOOD |
| 6 | `/app/watchlist/page.tsx` | RSC | Yes | Via layout | Yes | Watchlist management | GOOD |
| 7 | `/app/signals/page.tsx` | RSC | Yes | Yes | Yes | Signal state explorer | GOOD |
| 8 | `/app/research/page.tsx` | RSC | Yes | Yes | Yes | Research hub | GOOD |
| 9 | `/app/research/daily/[date]/page.tsx` | RSC | Yes (generateMetadata) | Yes | Yes | Daily research report | GOOD |
| 10 | `/app/research/token/[token]/[date]/page.tsx` | RSC | Yes (generateMetadata) | Yes | Yes | Token research report | GOOD |
| 11 | `/app/research/weekly/[week]/page.tsx` | RSC | Yes (generateMetadata) | Yes | Yes | Weekly research report | GOOD |
| 12 | `/app/intelligence/page.tsx` | RSC | Yes | Yes | Yes | Intelligence overview | GOOD |
| 13 | `/app/learn/page.tsx` | RSC | Yes | Yes | Yes | Learning hub | GOOD |
| 14 | `/app/learn/[slug]/page.tsx` | RSC | Yes (generateMetadata) | Yes | Yes | Individual learn articles | GOOD |
| 15 | `/app/learn/category/[slug]/page.tsx` | RSC | Yes (generateMetadata) | Yes | Yes | Learn category pages | GOOD |
| 16 | `/app/learn/how-to-find-gems/page.tsx` | RSC | Yes | Yes | Yes | Gem finding guide | GOOD |
| 17 | `/app/scoring/page.tsx` | RSC | Yes (title, desc, OG, JSON-LD) | Yes | Yes | Scoring methodology | GOOD |
| 18 | `/app/score-lab/page.tsx` | RSC | Yes | Via layout | Yes | Score lab tool | GOOD |
| 19 | `/app/wallets/page.tsx` | RSC | Yes | Yes | Yes | Wallet tracker | GOOD |
| 20 | `/app/faq/page.tsx` | RSC | Yes (title, desc, OG, JSON-LD FAQ) | Yes | Yes | FAQ with structured data | GOOD |
| 21 | `/app/contact/page.tsx` | RSC | Yes | Yes | Yes | Contact page | GOOD |
| 22 | `/app/disclaimer/page.tsx` | RSC | Yes | Yes | Yes | Legal disclaimer | GOOD |
| 23 | `/app/privacy/page.tsx` | RSC | Yes | Yes | Yes | Privacy policy | GOOD |
| 24 | `/app/terms/page.tsx` | RSC | Yes | Yes | Yes | Terms of service | GOOD |
| 25 | `/app/security/page.tsx` | RSC | Yes | Yes | Yes | Security page | GOOD |
| 26 | `/app/infrastructure/page.tsx` | RSC | Yes | Yes | Yes | Infrastructure overview | GOOD |
| 27 | `/app/insights/[slug]/page.tsx` | RSC | Yes (generateMetadata) | Yes | Yes | Individual insight articles | GOOD |
| 28 | `/app/lead-time-proof/page.tsx` | RSC | Yes | Yes | Yes | Lead time proof explorer | GOOD |
| 29 | `/app/proof-engine/ledger-hash/page.tsx` | RSC | Yes | Via layout | Yes | Proof engine ledger hash | GOOD |
| 30 | `/app/token/page.tsx` | RSC | Yes | Yes | Yes | Token index/search | GOOD |
| 31 | `/app/(seo)/solana-gem-finder/page.tsx` | RSC | Yes (rich SEO) | Yes | Yes | SEO landing - gem finder | GOOD |
| 32 | `/app/(seo)/solana-token-scanner/page.tsx` | RSC | Yes (rich SEO) | Yes | Yes | SEO landing - token scanner | GOOD |
| 33 | `/app/(seo)/solana-trending/by-holders/page.tsx` | RSC | Yes | Yes | Yes | SEO landing - trending by holders | GOOD |
| 34 | `/app/(seo)/solana-trending/by-liquidity/page.tsx` | RSC | Yes | Yes | Yes | SEO landing - trending by liquidity | GOOD |
| 35 | `/app/(seo)/solana-trending/by-volume/page.tsx` | RSC | Yes | Yes | Yes | SEO landing - trending by volume | GOOD |
| 36 | `/app/(seo)/solana-trending/last-1h/page.tsx` | RSC | Yes | Yes | Yes | SEO landing - last 1h | GOOD |
| 37 | `/app/(seo)/solana-trending/last-24h/page.tsx` | RSC | Yes | Yes | Yes | SEO landing - last 24h | GOOD |
| 38 | `/app/(seo)/solana-trending/last-6h/page.tsx` | RSC | Yes | Yes | Yes | SEO landing - last 6h | GOOD |
| 39 | `/app/solana-meme-coin-scanner/page.tsx` | RSC | Yes | Yes | Yes | SEO landing | GOOD |
| 40 | `/app/solana-risk-checker/page.tsx` | RSC | Yes | Yes | Yes | SEO landing | GOOD |
| 41 | `/app/solana-token-dashboard/page.tsx` | RSC | Yes | Yes | Yes | SEO landing | GOOD |
| 42 | `/app/solana-wallet-tracker/page.tsx` | RSC | Yes | Yes | Yes | SEO landing | GOOD |
| 43 | `/app/admin/intel/page.tsx` | RSC | No (admin) | No | No | Admin intel dashboard | GOOD |

---

## 3. COMPONENT AUDIT (Custom Components)

Due to the volume (68 custom components), here is the audit organized by category:

### Navigation & Layout
| Component | Props | Consumers | Issues | Health |
|---|---|---|---|---|
| `navbar.tsx` | None (reads internal state) | Homepage, most pages | Heavy client component, localStorage for pro state | NEEDS WORK |
| `footer.tsx` | None | Most pages | None found | GOOD |
| `mobile-container.tsx` | children, tokens, various state props | Homepage | Large prop interface | NEEDS WORK |
| `mobile-header.tsx` | Various mobile state props | MobileContainer | None | GOOD |
| `mobile-nav.tsx` | navigation state | MobileContainer | None | GOOD |
| `desktop-terminal.tsx` | tokens, filters, selection state | Homepage | Massive client component | NEEDS WORK |
| `tablet-terminal.tsx` | tokens, filters, selection state | Homepage | Similar to desktop-terminal | NEEDS WORK |
| `mobile-terminal.tsx` | tokens, filters, selection state | Homepage | Similar pattern | NEEDS WORK |

### Token Display
| Component | Props | Issues | Health |
|---|---|---|---|
| `token-card.tsx` | TokenScore, onClick, etc. | None | GOOD |
| `token-card-grid.tsx` | TokenScore[], layout config | None | GOOD |
| `token-row-desktop.tsx` | TokenScore, selection handlers | None | GOOD |
| `token-row-mobile.tsx` | TokenScore, selection handlers | None | GOOD |
| `compact-token-card.tsx` | TokenScore | None | GOOD |
| `token-detail-drawer.tsx` | TokenScore, open state | Large component | NEEDS WORK |
| `token-index.tsx` | tokens, onSelect | None | GOOD |
| `token-sparkline.tsx` | data points | None | GOOD |
| `token-micro-badge.tsx` | badge type | None | GOOD |

### Signal & Badge System
| Component | Props | Issues | Health |
|---|---|---|---|
| `signal-badges.tsx` | TokenScore | None | GOOD |
| `signal-state-badge.tsx` | signal state string | None | GOOD |
| `conviction-badge.tsx` | conviction data | Feature-flagged off | GOOD |
| `conviction-icon.tsx` | type | None | GOOD |
| `badge-legend-modal.tsx` | open state | None | GOOD |
| `badge-overflow-sheet.tsx` | badges[] | None | GOOD |
| `icon-badge.tsx` | icon, label | None | GOOD |
| `why-flagged.tsx` | reasons[] | None | GOOD |
| `lead-time-badge.tsx` | lead time data | None | GOOD |

### Intelligence & Data
| Component | Props | Issues | Health |
|---|---|---|---|
| `market-intel-ticker.tsx` | None (fetches internally) | Internal fetch, CSS animation | GOOD |
| `live-intel-panel.tsx` | intel data | None | GOOD |
| `live-signal-strip.tsx` | signals[] | None | GOOD |
| `left-intel-strip.tsx` | intel items | None | GOOD |
| `context-bar.tsx` | metadata | None | GOOD |
| `data-freshness-bar.tsx` | freshness state | None | GOOD |
| `research-insights.tsx` | research data | None | GOOD |
| `live-indicator.tsx` | status | None | GOOD |
| `sources-indicator.tsx` | source data | None | GOOD |
| `stats-card.tsx` | stat data | None | GOOD |
| `active-trading.tsx` | tokens[] | None | GOOD |
| `activity-health.tsx` | health data | None | GOOD |

### Lead Time / Proof Engine
| Component | Props | Issues | Health |
|---|---|---|---|
| `lead-time-proof-panel.tsx` | proof data | None | GOOD |
| `lead-time-proofs-feed.tsx` | proofs[] | None | GOOD |
| `lead-time-recent-panel.tsx` | recent proofs | None | GOOD |
| `proof-engine-onboarding.tsx` | None | localStorage usage | NEEDS WORK |
| `proof-engine-status-panel.tsx` | status data | None | GOOD |
| `proof-preview-rail.tsx` | proofs[] | None | GOOD |
| `recent-lead-time-proofs.tsx` | proofs[] | None | GOOD |

### Pro / Monetization
| Component | Props | Issues | Health |
|---|---|---|---|
| `locked-feature-card.tsx` | feature info | None | GOOD |
| `dev-pro-toggle.tsx` | None | **localStorage-only pro toggle** - no real auth | **NEEDS WORK** |
| `pro-token-card-preview.tsx` | TokenScore | None | GOOD |
| `coming-soon-pill.tsx` | None | Hardcoded "Coming Soon" | GOOD |

### Utilities
| Component | Props | Issues | Health |
|---|---|---|---|
| `cookie-consent.tsx` | None | localStorage for consent state | GOOD |
| `filter-bar.tsx` | filter state, callbacks | None | GOOD |
| `gem-finder-modal.tsx` | open state, tokens | None | GOOD |
| `how-to-panel.tsx` | None | None | GOOD |
| `how-to-use-modal.tsx` | open state | None | GOOD |
| `browse-content.tsx` | tokens, filters | None | GOOD |
| `not-tracked-page-component.tsx` | token address | None | GOOD |
| `ops-login.tsx` | onLogin callback | None | GOOD |
| `ops-panel.tsx` | ops state | None | GOOD |
| `theme-provider.tsx` | children | None | GOOD |
| `theme-toggle.tsx` | None | None | GOOD |
| `watchlist-button.tsx` | token, watchlist state | None | GOOD |
| `seo/Schema.tsx` | schema data | None | GOOD |

### Ads
| Component | Notes | Health |
|---|---|---|
| `ads/AAdsRightRail.tsx` | A-Ads integration, client component | GOOD |

### Mobile Tabs (5)
All client components, used by MobileContainer. Health: GOOD.

---

## 4. API ROUTE AUDIT

### Core Data Routes (Public)
| Route | Methods | Auth | Cache | Error Handling | Health |
|---|---|---|---|---|---|
| `/api/index` | GET | No | `s-maxage=60, swr=300` | Yes (warming fallback) | GOOD |
| `/api/tokens` | GET | No | `max-age=3600, swr=86400` | Yes (empty fallback) | GOOD |
| `/api/tokens/batch` | GET | No | Unknown | Yes | GOOD |
| `/api/tokens/archive` | GET | No | Unknown | Yes | GOOD |
| `/api/tokens/archive/health` | GET | No | Unknown | Yes | GOOD |
| `/api/token/[mint]` | GET | No | Unknown | Yes | GOOD |
| `/api/token/[mint]/enrich` | GET | No | Unknown | Yes | GOOD |
| `/api/token/live` | GET | No | Unknown | Yes | GOOD |
| `/api/sol-price` | GET | No | `s-maxage=30, swr=60` | Yes | GOOD |
| `/api/quote/[mint]` | GET | No | Unknown | Yes | GOOD |
| `/api/tracker` | GET | No | Unknown | Yes | GOOD |
| `/api/active-trading` | GET | No | Unknown | Yes | GOOD |
| `/api/token-history` | GET | No | Unknown | Yes | GOOD |
| `/api/held-duration` | GET | No | Unknown | Yes | GOOD |
| `/api/lead-time/[mint]` | GET | No | Unknown | Yes | GOOD |
| `/api/lead-time/debug` | GET | No | Unknown | Yes | GOOD |
| `/api/lead-time/recent` | GET | No | Unknown | Yes | GOOD |
| `/api/leadtime-ledger` | GET | No | Unknown | Yes | GOOD |
| `/api/alpha-ledger` | GET | No | Unknown | Yes | GOOD |
| `/api/alpha-ledger/hash` | GET | No | Unknown | Yes | GOOD |
| `/api/alpha-ledger/hash-history` | GET | No | Unknown | Yes | GOOD |
| `/api/news/solana` | GET | No | Unknown | Yes | GOOD |
| `/api/signal-outcomes` | GET | Auth (internal/ops) | Unknown | Yes | GOOD |
| `/api/score-lab` | GET/POST | No | Unknown | Yes | GOOD |
| `/api/waitlist` | POST | No | Unknown | Yes | GOOD |
| `/api/refresh` | GET | No | Unknown | Yes | GOOD |
| `/api/bootstrap` | GET | No | Unknown | Yes | GOOD |
| `/api/health` | GET | No | None | Yes | GOOD |
| `/api/health/quicknode` | GET | No | None | Yes | GOOD |
| `/api/health/quicknode-lastrun` | GET | No | None | Yes | GOOD |
| `/api/snapshot-health` | GET | No | None | Yes | GOOD |
| `/api/proof-engine-health` | GET | No | None | Yes | GOOD |
| `/api/proof-engine-status` | GET | Auth | None | Yes | GOOD |

### Ingestion Routes
| Route | Methods | Auth | Notes | Health |
|---|---|---|---|---|
| `/api/ingest` | POST | Auth (internal/ops) | Main ingestion pipeline | GOOD |
| `/api/ingest/cycle` | POST | Auth | Ingestion cycle runner | GOOD |
| `/api/ingest/health` | GET | No | Ingestion health check | GOOD |
| `/api/ingest/new-mints` | POST | Auth | New mint discovery (Helius) | GOOD |
| `/api/ingest/new-mints-qn` | POST | Auth | New mint discovery (QuickNode) | GOOD |
| `/api/trigger-ingestion` | POST | Auth | Manual ingestion trigger | GOOD |

### Cron Routes
| Route | Methods | Auth | Schedule | Health |
|---|---|---|---|---|
| `/api/cron` | GET | CRON_SECRET/internal | Every 5 min | GOOD |
| `/api/cron/snapshot` | GET | CRON_SECRET/internal | Every 5 min | GOOD |
| `/api/cron/alpha-ledger` | GET | CRON_SECRET/internal | Every 2 hours | GOOD |
| `/api/cron/ingest` | GET | CRON_SECRET/internal | (disabled in vercel.json) | GOOD |
| `/api/cron/leadtime-harvest` | GET | CRON_SECRET/internal | Every 30 min | GOOD |

### Research / Intel Generation
| Route | Methods | Auth | Health |
|---|---|---|---|
| `/api/research/generate` | POST | Auth | GOOD |
| `/api/research/generate/daily` | GET/POST | CRON_SECRET | GOOD |
| `/api/research/generate/weekly` | GET/POST | CRON_SECRET | GOOD |
| `/api/research/publish` | POST | Auth | GOOD |
| `/api/intel/generate/daily` | GET/POST | CRON_SECRET | GOOD |
| `/api/intel/rebuild` | POST | Auth | GOOD |

### Admin Routes (27 routes) -- All require auth (internal job token OR ops password)
| Route | Methods | Auth Check | Health |
|---|---|---|---|
| `/api/admin/alerts` | GET/POST | requireInternalJobOrOps | GOOD |
| `/api/admin/alert-delivery` | POST | requireInternalJobOrOps | GOOD |
| `/api/admin/alert-rules` | GET/POST | requireInternalJobOrOps | GOOD |
| `/api/admin/alpha-ledger/append` | POST | requireInternalJobOrOps | GOOD |
| `/api/admin/alpha-ledger/harvest` | POST | requireInternalJobOrOps | GOOD |
| `/api/admin/alpha-ledger/void` | POST | requireInternalJobOrOps | GOOD |
| `/api/admin/flush-index-cache` | POST | requireInternalJobOrOps | GOOD |
| `/api/admin/harvest/run` | POST | requireInternalJobOrOps | GOOD |
| `/api/admin/ingest/retry-resolution` | POST | requireInternalJobOrOps | GOOD |
| `/api/admin/ingest/stats` | GET | requireInternalJobOrOps | GOOD |
| `/api/admin/intel/audit` | POST | requireInternalJobOrOps | GOOD |
| `/api/admin/intel/generate` | POST | requireInternalJobOrOps | GOOD |
| `/api/admin/intel/history` | GET | requireInternalJobOrOps | GOOD |
| `/api/admin/intel/latest` | GET | requireInternalJobOrOps | GOOD |
| `/api/admin/intel/send` | POST | requireInternalJobOrOps | GOOD |
| `/api/admin/internal-auth-check` | GET | requireInternalJobOrOps | GOOD |
| `/api/admin/proof-engine-diag` | GET | requireInternalJobOrOps | GOOD |
| `/api/admin/qa/run` | POST | requireInternalJobOrOps | GOOD |
| `/api/admin/readpath-trace` | GET | requireInternalJobOrOps | GOOD |
| `/api/admin/run-leadtime-harvest` | POST | requireInternalJobOrOps | GOOD |
| `/api/admin/run-snapshot-ingest` | POST | requireInternalJobOrOps | GOOD |
| `/api/admin/snapshot/reindex` | POST | requireInternalJobOrOps | GOOD |
| `/api/admin/snapshot/run` | POST | requireInternalJobOrOps | GOOD |
| `/api/admin/suppress` | GET/POST/DELETE | requireInternalJobOrOps | GOOD |
| `/api/admin/system-report` | GET | requireInternalJobOrOps | GOOD |
| `/api/admin/tools/diag` | GET | requireInternalJobOrOps | GOOD |
| `/api/admin/tools/kv-scan` | GET | requireInternalJobOrOps | GOOD |

### Ops Routes
| Route | Methods | Auth | Health |
|---|---|---|---|
| `/api/ops/login` | POST | Password check | GOOD |
| `/api/ops/logout` | POST | None | GOOD |
| `/api/ops/auth` | GET | OPS_PASSWORD | GOOD |
| `/api/ops/check` | GET | OPS_PASSWORD | GOOD |
| `/api/ops/add-mint` | POST | OPS_PASSWORD | GOOD |
| `/api/ops/remove-mint` | POST | OPS_PASSWORD | GOOD |
| `/api/ops/fix-addresses` | POST | OPS_PASSWORD | GOOD |
| `/api/ops/flush-cache` | POST | OPS_PASSWORD | GOOD |
| `/api/ops/invalidate-cache` | POST | OPS_PASSWORD | GOOD |
| `/api/ops/nuclear-clear` | POST | OPS_PASSWORD | GOOD |

### Telegram Routes
| Route | Methods | Auth | Health |
|---|---|---|---|
| `/api/telegram/alert` | POST | Auth | GOOD |
| `/api/telegram/internal-trigger` | POST | Internal token | GOOD |

### Diagnostic / Debug Routes
| Route | Methods | Auth | Health |
|---|---|---|---|
| `/api/diagnostics` | GET | Auth | GOOD |
| `/api/diagnostics/rate-limits` | GET | No | **NEEDS WORK** - should require auth |
| `/api/debug/kv-snapshots` | GET | No | **NEEDS WORK** - should require auth |
| `/api/test-dex-fetch` | GET | No | **NEEDS WORK** - test route in production |

---

## 5. LIB MODULE AUDIT

### Critical Modules

| Module | Purpose | Dependencies | Health |
|---|---|---|---|
| `storage.ts` | Hybrid KV/Upstash/Memory storage adapter | @vercel/kv, @upstash/redis, env, logger | GOOD - well-architected with fallbacks |
| `blob-storage.ts` | Vercel Blob persistent state (tracked tokens, archive, history) | @vercel/blob, storage, types | GOOD - rate limit cooldown, retry logic |
| `internal-auth.ts` | Service-to-service auth (INTERNAL_JOB_TOKEN + OPS_PASSWORD) | None | GOOD - clean dual-auth pattern |
| `auth.ts` | OPS_PASSWORD verification | None | GOOD but minimal |
| `env.ts` | Centralized env var validation with Zod | zod | GOOD |
| `types.ts` | Core type definitions (TokenData, TokenScore, etc.) | None | GOOD - comprehensive |
| `ingestion.ts` | Token data ingestion pipeline | adapters, storage, blob-storage, scoring | GOOD |
| `scoring.ts` | V1 scoring algorithm | types | GOOD |
| `scoring-v2.ts` | V2 scoring (quality, readiness, gem, signal) | types | GOOD |
| `schema.ts` | JSON-LD structured data generators | types | GOOD - comprehensive |
| `token-resolver.ts` | Canonical token lookup across all data sources | storage, blob-storage, types | GOOD |
| `featureFlags.ts` | Static feature flag definitions | None | GOOD - simple and clear |
| `use-pro.ts` | Pro tier state management | **localStorage only** | **BROKEN** - no real auth |
| `watchlist.ts` | Watchlist management | localStorage | NEEDS WORK - client-only |
| `telegram.ts` | Telegram bot integration | None | GOOD |
| `suppress.ts` | Token suppression (rug/scam filtering) | storage | GOOD |
| `seo-content-generator.ts` | Dynamic SEO content for token pages | types | GOOD |
| `seo.ts` | SEO utilities | None | GOOD |
| `format.ts` | Number/price formatting utilities | None | GOOD |
| `logger.ts` | Logging utility | None | GOOD |

### Adapter Modules

| Module | External API | Health |
|---|---|---|
| `adapters/dexscreener.ts` | DexScreener Trending API | GOOD |
| `adapters/helius.ts` | Helius RPC (enrichment, mint discovery) | GOOD |
| `adapters/jupiter.ts` | Jupiter Price API | GOOD |
| `adapters/openai.ts` | OpenAI API (research, intel) | GOOD |
| `adapters/pumpfun.ts` | Pump.fun API (disabled) | GOOD |
| `adapters/index.ts` | Adapter orchestration | GOOD |

### Intel Subsystem (14 modules)
All focused on intelligence generation, news aggregation, and content creation. Generally healthy. `openaiVoice.ts` is unused.

### Lead-Time Subsystem (6 modules)
Well-structured proof engine for detecting early signals. All GOOD.

---

## 6. DESIGN SYSTEM AUDIT

### CSS Custom Properties (globals.css)

**Light Mode (:root):** 36 variables defined
**Dark Mode (.dark):** 36 variables defined

Both light and dark mode tokens are fully defined. The design system uses oklch color space throughout.

**Key Token Map:**
| Token | Light | Dark | Notes |
|---|---|---|---|
| `--background` | oklch(0.98 0 0) | oklch(0.06 0 0) | Near-white / Deep black |
| `--foreground` | oklch(0.15 0 0) | oklch(0.92 0 0) | Near-black / Light gray |
| `--primary` | oklch(0.6 0.28 310) | oklch(0.65 0.25 310) | Magenta/purple |
| `--accent` | oklch(0.7 0.22 200) | oklch(0.72 0.18 200) | Cyan |
| `--success` | oklch(0.75 0.24 130) | oklch(0.72 0.22 145) | Green |
| `--destructive` | oklch(0.58 0.24 25) | oklch(0.60 0.24 25) | Red |
| `--radius` | 0.75rem | 0.75rem | Border radius |

### Custom CSS Classes
- `.ticker-wrapper` / `.ticker-content` - Market ticker scroll animation
- `.scrollbar-hide` - Hide scrollbar utility
- `.thin-scrollbar` - Terminal-grade thin scrollbar
- `.badge-glow` - Badge glow animation
- `.breathe-dot` - Breathing dot animation
- `.animate-gradient` - Rainbow gradient animation
- `.shimmer` - Loading shimmer effect
- `.glass-card` - Glassmorphism card
- `.glow-pulse` - Glow pulse animation
- `.press-scale` - Press scale interaction
- `.signal-early-glow` / `.signal-caution-glow` / `.signal-strong-glow` - Signal state animations
- `.gem-active` - Gem sparkle animation
- `.w-13` / `.h-13` - Custom 52px size utility
- `.safe-top` / `.safe-bottom` - Safe area padding for notched devices

### Fonts
- **Geist** (sans-serif) - loaded via `next/font/google`, weights 400-900
- **Geist Mono** (monospace) - loaded via `next/font/google`
- Configured in `@theme inline` block in globals.css

### Issues
1. **Duplicate preconnect tags** in layout.tsx `<head>` - `fonts.googleapis.com` and `fonts.gstatic.com` are each preconnected twice
2. Some signal animations use hardcoded rgba colors instead of design tokens (`.signal-early-glow` uses `rgba(168, 85, 247, 0.4)` instead of a token)
3. The `focus-pulse` keyframe uses hardcoded `rgba(112, 26, 255, ...)` instead of design tokens

---

## 7. DATA FLOW MAP

```
                     EXTERNAL APIS
                          |
    +--------------------+--------------------+
    |                    |                    |
DexScreener         Helius RPC          Jupiter API
(trending)         (enrichment)         (prices)
    |                    |                    |
    v                    v                    v
  lib/adapters/dexscreener.ts  helius.ts  jupiter.ts
    |                    |                    |
    +--------------------+--------------------+
                         |
              lib/adapters/index.ts
             (fetchAllSources → aggregate)
                         |
                         v
              lib/ingestion.ts
         (score, enrich, dedupe, store)
                         |
           +-------------+-------------+
           |                           |
    Vercel KV / Upstash          Vercel Blob
    (lib/storage.ts)         (lib/blob-storage.ts)
    - solrad:latest          - solrad/state.json
    - solrad:ts:{mint}       - trackedMints[]
    - solrad:snapshots:*     - tokensByMint{}
    - solrad:lock:*          - history{}
    - solrad:lastIngestTime  - archiveByMint{}
    - solrad:ingestionStatus - pins[], tags{}
           |                           |
           +-------------+-------------+
                         |
              lib/intel/tokenIndex.ts
            (buildTokenIndex → cache)
                         |
                         v
              /api/index (GET)
         (canonical response + columns)
                         |
         +---------------+---------------+
         |               |               |
    Homepage         /browse          /token/[addr]
    (client fetch)   (server fetch)   (server fetch)
```

### External Services Called
| Service | Called By | Purpose |
|---|---|---|
| DexScreener API | `lib/adapters/dexscreener.ts` | Trending token discovery |
| Helius RPC | `lib/adapters/helius.ts` | On-chain enrichment (holders, authorities) |
| Jupiter Price API | `lib/adapters/jupiter.ts` | Token price data |
| OpenAI API | `lib/adapters/openai.ts`, `lib/intel/generator.ts`, `lib/research/openai.ts` | Research reports, intel generation |
| QuickNode RPC | `lib/ingest/sources.ts` | New mint discovery |
| Telegram API | `lib/telegram.ts` | Alert delivery |
| A-Ads | `components/ads/AAdsRightRail.tsx` | Advertising |

### KV Key Patterns
| Pattern | Usage |
|---|---|
| `solrad:latest` | Current scored token cache |
| `solrad:lastUpdated` | Last update timestamp |
| `solrad:sourceMeta` | Source metadata |
| `solrad:lock:ingestion` | Ingestion single-flight lock |
| `solrad:lastIngestTime` | Last ingestion timestamp |
| `solrad:ingestionStatus` | Degraded/ready status |
| `solrad:snapshots:index` | Snapshot mint index |
| `solrad:snapshots:{date}` | Daily snapshot data |
| `solrad:ts:{mint}` | Per-token time series |
| `solrad:last_good_index` | Last-known-good cache |
| `solrad:last_good_count` | Token count at last good |
| `solrad:last_good_at` | Timestamp of last good |
| `solrad:blob:cooldown` | Blob rate-limit cooldown |
| `snap:{mint}` | Individual token snapshots |
| `snap:index` | Snapshot index set |
| Various others for intel, research, alerts, suppress | See respective lib modules |

### Race Conditions / Deduplication
- **Ingestion lock** (`solrad:lock:ingestion`) prevents concurrent ingestion runs - 90s TTL
- **In-flight fetch guard** in homepage (`inFlightFetch` module-level variable) deduplicates client requests
- **Blob cooldown** prevents blob write storms after rate limiting
- **Memory cache TTL** (30s for blob state) prevents excessive blob reads
- **Potential issue:** No deduplication between `/api/index` and `/api/tokens` - both read from similar sources but could serve stale data from different cache layers

---

## 8. PERFORMANCE AUDIT

### Rendering Strategy
| Page | Rendering | Notes |
|---|---|---|
| `/` (homepage) | **Dynamic (client)** | "use client" - everything client-rendered | 
| `/browse` | Server (dynamic) | Fetches at request time |
| `/token/[address]` | Server (dynamic) | generateMetadata + server fetch |
| `/about`, `/faq`, `/scoring`, `/pro` | Server (static-ish) | Could be statically generated |
| SEO landing pages (8) | Server (dynamic) | Fetch tokens at request time - could use caching |
| `/tracker` | **Dynamic (client)** | "use client" |
| Admin pages (7) | Client | Expected for admin |

### Suspense Boundaries
**ZERO Suspense boundaries found in the entire codebase.** This is a significant performance issue. Any async server component will block the entire page render.

### Image Optimization
- `images.unoptimized: true` in next.config.mjs -- **ALL image optimization disabled**
- `next/image` is imported in some components (token detail page) but with unoptimized flag, no actual optimization occurs
- No `<img>` tags found (good - all using next/image)
- Remote patterns allow ALL hosts (`hostname: '**'`) which is overly permissive

### Bundle Size Concerns
- **Homepage (`app/page.tsx`)** is a 960-line "use client" component importing 30+ components. This creates a massive client-side JS bundle for the most important page.
- Terminal components (`desktop-terminal.tsx`, `tablet-terminal.tsx`, `mobile-terminal.tsx`) are all client components that could potentially be partially server-rendered
- `recharts` (charting library) is bundled client-side
- `html-to-image` is imported but unclear if used

### Cache Headers
| Route | Cache Strategy | Assessment |
|---|---|---|
| `/api/index` | `s-maxage=60, swr=300` | Good |
| `/api/sol-price` | `s-maxage=30, swr=60` | Good |
| `/api/tokens` | `max-age=3600, swr=86400` | Aggressive but ok |
| SEO pages | `s-maxage=86400, swr=604800` | Good for SEO |
| Most other API routes | None set | **NEEDS WORK** |

### Waterfall Fetching
- Homepage fetches `/api/index` then separately fetches lead-time proofs - could be parallelized at the API level
- `/api/index` does parallel fetches internally (good)
- Token detail page fetches token data then research data sequentially in `getTokenData` - could parallelize

---

## 9. SEO AUDIT

### Metadata Coverage

| Page | Title | Description | Canonical | OG Image | Twitter Card | JSON-LD |
|---|---|---|---|---|---|---|
| `/` (homepage) | **MISSING** (client component) | **MISSING** | **MISSING** | **MISSING** | **MISSING** | Via root layout only |
| `/about` | Yes | Yes | Yes | Yes | Yes | Yes |
| `/browse` | Yes | Yes | Yes | Yes | Yes | Yes (ItemList) |
| `/token/[address]` | Yes (dynamic) | Yes (dynamic) | Yes (normalized) | Yes | Yes | Yes (FinancialProduct + FAQ) |
| `/pro` | Yes | Yes | Yes | Yes | Yes | Yes (FAQ) |
| `/faq` | Yes | Yes | Yes | Yes | Yes | Yes (FAQ) |
| `/scoring` | Yes | Yes | Yes | Yes | Yes | Yes |
| `/signals` | Yes | Yes | Yes | Yes | Yes | No |
| `/research` | Yes | Yes | Yes | Yes | Yes | No |
| `/learn` | Yes | Yes | Yes | Yes | Yes | Yes |
| SEO landing pages (8) | Yes | Yes | Yes | Yes | Yes | Yes |
| `/tracker` | **MISSING** (CC) | **MISSING** | **MISSING** | **MISSING** | **MISSING** | No |
| `/watchlist` | Yes | Yes | Yes | Yes | Yes | No |
| All admin/ops pages | **MISSING** (OK - not indexed) | - | - | - | - | - |

### CRITICAL SEO Issues
1. **Homepage has NO metadata** - it's a "use client" component so it cannot export `metadata` or `generateMetadata`. The root layout has default metadata, but the homepage title/description defaults to the generic layout title. **This is your most important page.**
2. **Tracker page has NO metadata** - same issue (client component)
3. **Sitemap references `sitemap-static.xml` and `sitemap-tokens-{n}.xml`** but these appear to be generated by the sitemap function. Verify these actually resolve.

### robots.txt
- Present and well-configured
- Blocks /api/, /admin/, /ops/, /_next/
- Blocks AI crawlers (GPTBot, ChatGPT-User, CCBot, anthropic-ai, Google-Extended)
- Points to sitemap at correct URL

### Heading Hierarchy
- Most RSC pages appear to follow proper H1 -> H2 -> H3 hierarchy
- Homepage (client) manages its own heading hierarchy - verify in browser

### Dynamic Route SEO
- `/token/[address]` uses `generateMetadata()` with dynamic data, canonical URLs, and noindex for low-score tokens (< 75) -- **excellent implementation**
- `/learn/[slug]`, `/research/daily/[date]` also use dynamic metadata -- good

---

## 10. SECURITY AUDIT

### API Route Protection

**Well Protected:**
- All 27 `/api/admin/*` routes use `requireInternalJobOrOps()` -- requires either INTERNAL_JOB_TOKEN header or OPS_PASSWORD header
- All `/api/cron/*` routes check CRON_SECRET or internal job token
- All `/api/ops/*` routes check OPS_PASSWORD
- `/api/ingest/*` routes require auth
- Telegram routes require internal token

**Unprotected Routes That Should Be Protected:**
| Route | Risk | Recommendation |
|---|---|---|
| `/api/diagnostics/rate-limits` | LOW | Exposes rate limit info - add auth |
| `/api/debug/kv-snapshots` | MEDIUM | Exposes KV data structure - add auth or remove |
| `/api/test-dex-fetch` | LOW | Test route in production - remove |

### Environment Variable Exposure
- `lib/env.ts` validates env vars server-side with Zod - good
- `process.env` used in 6 page files - all appear to be server components or using `NEXT_PUBLIC_` prefix
- No secrets found exposed in client components
- `proxy.ts` reads `INTERNAL_JOB_TOKEN` from process.env - this is server-side middleware, safe

### Input Sanitization
- Token addresses are normalized via `normalizeMint()` and validated via `isValidSolanaMint()` before use - good
- API routes that accept user input (waitlist email, ops commands) have basic validation
- No SQL injection risk (no SQL database)
- KV key patterns use template strings with mint addresses - sanitized by normalization

### Admin Page Protection
- Admin pages (`/admin/*`) are **NOT route-protected** at the page level - they are client components that fetch from protected API routes. The API routes require auth, but the pages themselves render the admin UI shell before auth. This is acceptable since no sensitive data is in the page bundle, only in API responses.
- `/ops` page has a login gate component (OpsLogin) - good

### CORS
- No explicit CORS headers set on API routes
- Next.js default behavior: same-origin for API routes
- No cross-origin API access configured (fine for current architecture)

---

## 11. MONETIZATION READINESS

### Current State: NOT READY

| Aspect | Status | Details |
|---|---|---|
| Payment Integration (Stripe) | **NONE** | No Stripe, no payment processor of any kind |
| Pro Tier Gating | **UI-ONLY** | `lib/use-pro.ts` uses `localStorage.getItem("solrad_pro")` -- anyone can set this to "true" in devtools |
| User Auth | **NONE** | No NextAuth, no Clerk, no Supabase Auth, no custom auth system. The only auth is admin OPS_PASSWORD |
| Session Management | **NONE** | No user sessions exist |
| Waitlist | **EXISTS** | `/api/waitlist` POST route exists, `/pro` page has waitlist form |

### What's Needed for Subscription-Based Access
1. **User authentication system** (Clerk or Supabase Auth recommended)
2. **Stripe Checkout integration** for payment
3. **Server-side Pro verification** - replace localStorage check with JWT/session check against a user database
4. **API-level gating** - Pro features must be gated in API routes, not just UI
5. **Webhook handler** for Stripe subscription events (created, cancelled, renewed)
6. **User database** to store subscription status (Supabase or Neon)

---

## 12. CROSS-CUTTING CONCERNS

### TypeScript
- `strict: true` in tsconfig.json -- **GOOD**
- `ignoreBuildErrors: true` in next.config.mjs -- **BAD**. This means TypeScript errors are silently ignored during builds. You could be shipping broken code.
- No `type: any` found in grep -- excellent
- Types are comprehensive in `lib/types.ts`

### Error Boundaries
- Only **1 error.tsx** exists (`app/admin/intel/error.tsx`)
- **No error boundaries** for: homepage, browse, token detail, tracker, signals, watchlist, research, or any public-facing page
- If any server component throws, users see the Next.js default error page

### Loading States
- 5 loading.tsx files exist (root, browse, watchlist, 2 SEO pages, admin status)
- **Missing loading states** for: token detail, tracker, signals, research, learn, scoring, about, faq, pro

### Environment Variables
- No `.env.example` file found -- **developers have no documentation of required vars**
- `lib/env.ts` documents all vars but everything is optional, so nothing fails loudly

### Test Coverage
- **ZERO test files found** -- no unit tests, no integration tests, no E2E tests
- No test framework configured (no jest, vitest, playwright, cypress)

### Console.log Statements
- **169 `console.log("[v0]` statements** found across 55 files -- these are debug logs from development
- Many are useful for production debugging but should be behind a log level

---

## PRIORITIZED ISSUES LIST

### CRITICAL (Fix immediately)

| # | Issue | File(s) | Impact |
|---|---|---|---|
| C1 | **Homepage has no metadata** - "use client" prevents metadata export. Your most important page has no title, description, OG image, or canonical URL of its own. | `app/page.tsx` | SEO catastrophic for homepage |
| C2 | **`ignoreBuildErrors: true`** - TypeScript errors are silently ignored in production builds | `next.config.mjs` | Could ship broken code |
| C3 | **Pro tier is localStorage-only** - anyone can enable Pro features via browser devtools | `lib/use-pro.ts`, `components/dev-pro-toggle.tsx` | Zero monetization protection |
| C4 | **No Suspense boundaries anywhere** - async server components block entire page renders | All RSC pages | Performance, UX |
| C5 | **No error boundaries on public pages** - only 1 error.tsx exists (admin/intel) | All public routes | Users see raw errors |
| C6 | **Images unoptimized globally** - `images.unoptimized: true` disables all Next.js image optimization | `next.config.mjs` | LCP, bandwidth, Core Web Vitals |
| C7 | **Homepage is a 960-line client component** - entire page is client-rendered including all 30+ imported components | `app/page.tsx` | Massive JS bundle, slow FCP, no SSR for most important page |
| C8 | **Zero test coverage** - no test framework, no tests | Entire codebase | Regressions undetectable |
| C9 | **No user authentication system** - cannot implement paid features | Entire codebase | Blocks monetization |

### HIGH (Fix within 1-2 sprints)

| # | Issue | File(s) | Impact |
|---|---|---|---|
| H1 | **Tracker page has no metadata** - "use client" prevents metadata export | `app/tracker/page.tsx` | SEO for tracker page |
| H2 | **Debug/test routes exposed in production** | `/api/debug/kv-snapshots`, `/api/test-dex-fetch`, `/api/diagnostics/rate-limits` | Info disclosure |
| H3 | **No .env.example** - developers have no env var documentation | Root | DX, onboarding |
| H4 | **169 debug console.log statements** in production code | 55 files | Log noise, minor perf |
| H5 | **Duplicate preconnect tags** in root layout head | `app/layout.tsx` | Minor perf, validation |
| H6 | **Missing loading.tsx** for 8+ major routes | `/token/[address]`, `/signals`, `/research`, etc. | UX on slow connections |
| H7 | **No payment integration** - Pro page advertises $29/mo but has no payment flow | `app/pro/page.tsx` | User confusion |
| H8 | **remote image patterns allow all hosts** (`hostname: '**'`) | `next.config.mjs` | Security (minor with unoptimized) |
| H9 | **localStorage used for watchlist** - data lost on browser clear | `lib/watchlist.ts` | UX, data loss |
| H10 | **Admin pages have no route-level protection** - UI shell renders before API auth | `app/admin/*` | Minor security (no data exposed) |
| H11 | **`/api/tokens` has aggressive 1-hour cache** | `app/api/tokens/route.ts` | Could serve very stale data to SEO pages |
| H12 | **Legacy unused assets** in public/ | `public/legacy-unused/*` | Bundle bloat |
| H13 | **Hardcoded signal animation colors** in CSS instead of design tokens | `app/globals.css` | Theme inconsistency |
| H14 | **Both `/api/index` and `/api/tokens` serve similar data** - no clear deduplication | Both routes | Confusing, potential stale divergence |

### MEDIUM (Fix within 1-2 months)

| # | Issue | File(s) | Impact |
|---|---|---|---|
| M1 | Hardcoded `https://www.solrad.io` in 82 files (270 matches) | Multiple | Should use env var or constant |
| M2 | Homepage fetchTokens could benefit from SWR instead of manual polling | `app/page.tsx` | Data consistency, dedup |
| M3 | Token detail page fetches sequentially (token then research) | `app/token/[address]/page.tsx` | Could parallelize |
| M4 | No dark/light mode toggle visible to users (forced dark) | `app/layout.tsx` (`className="dark"`) | Accessibility preference |
| M5 | `html-to-image` dependency unclear if actively used | `package.json` | Unused dependency? |
| M6 | Pump.fun adapter disabled but still in codebase | `lib/adapters/pumpfun.ts` | Dead code |
| M7 | Feature flags are static (no runtime toggle) | `lib/featureFlags.ts` | Inflexible |
| M8 | `schema.ts` `generateTokenFAQSchema` references `token.riskFactors` which doesn't exist on TokenScore type | `lib/schema.ts` | Silent undefined access |
| M9 | Many API routes missing explicit Cache-Control headers | Various | Inconsistent caching |
| M10 | `token-detail-drawer.tsx` is likely a large component | `components/token-detail-drawer.tsx` | Bundle concern |
| M11 | OG/Twitter meta tags duplicated in both metadata export AND manual head tags | `app/layout.tsx` | Redundant, potential conflicts |
| M12 | Blob state file is a single JSON file that grows unbounded (archiveByMint) | `lib/blob-storage.ts` | Performance at scale |
| M13 | `use-auto-refresh.ts` in lib/ should be in hooks/ | `lib/use-auto-refresh.ts` | Code organization |
| M14 | `use-pro.ts` in lib/ should be in hooks/ | `lib/use-pro.ts` | Code organization |
| M15 | `use-mobile.tsx` exists in both `hooks/` and `components/ui/` | Both locations | Confusing |
| M16 | JSON-LD `aggregateRating` with ratingCount "1" is misleading | `lib/schema.ts` | Could be penalized by Google |
| M17 | No canonical URL normalization for trailing slashes | `proxy.ts` | SEO edge case |
| M18 | Cookie consent uses localStorage (fine for consent, but not GDPR-complete) | `components/cookie-consent.tsx` | Legal compliance |
| M19 | Sitemap generates chunk URLs (`sitemap-tokens-0.xml`) but unclear if these XML files are actually generated | `app/sitemap.ts` | Broken sitemap references |
| M20 | No rate limiting on public API routes | `/api/index`, `/api/tokens`, etc. | Abuse potential |
| M21 | `@solana/web3.js` pinned to "latest" | `package.json` | Non-deterministic builds |
| M22 | Multiple dependencies pinned to "latest" | `package.json` | Non-deterministic builds |

### LOW (Backlog)

| # | Issue | File(s) | Impact |
|---|---|---|---|
| L1 | No favicon.png referenced in headers (uses favicon.ico) | `next.config.mjs` headers | Minor |
| L2 | `placeholder-logo.png/svg`, `placeholder-user.jpg`, `placeholder.jpg/svg` still in public/ | `public/` | Cleanup |
| L3 | Five mobile tab components could potentially share more code | `components/mobile-tabs/*` | Code DRY |
| L4 | `conviction-badge.tsx` and `conviction-icon.tsx` feature-flagged off | Components | Dead code if never enabled |
| L5 | `openaiVoice.ts` in intel subsystem unclear usage | `lib/intel/openaiVoice.ts` | Potentially dead code |
| L6 | `computeSignalScore` alias in scoring-v2 for backward compat | `lib/scoring-v2.ts` | Cleanup opportunity |
| L7 | `TokenSnapshot` interface defined twice in types.ts | `lib/types.ts` | TypeScript confusion |
| L8 | Desktop/Tablet/Mobile terminal components have duplicated logic | `components/*-terminal.tsx` | DRY opportunity |
| L9 | `@vercel/og` at pinned 0.8.6 while other Vercel packages at latest | `package.json` | Version inconsistency |
| L10 | No structured data on `/signals` or `/research` pages | Those pages | SEO enhancement |
| L11 | `biome-ignore` comment in layout.tsx for dangerouslySetInnerHTML | `app/layout.tsx` | Tech debt |
| L12 | `searchParams` handling with `extractMint` uses `any` type | `app/token/[address]/page.tsx` | Type safety |
| L13 | Vercel Analytics loaded but no custom events tracked | `app/layout.tsx` | Missed analytics |
| L14 | `data-focused="true"` attribute used for CSS animation targeting | `app/globals.css` | Non-standard |
| L15 | Screenshot filenames have odd format (`screenshot-202026-01-29-20175248.png`) | `public/images/` | Naming |
| L16 | `w-13` / `h-13` custom utilities could use Tailwind extend | `app/globals.css` | Minor |
| L17 | `OPS_PASSWORD` is plain string comparison (not bcrypt) | `lib/auth.ts` | Timing attack risk (low) |
| L18 | Multiple `console.warn` / `console.error` should use logger.ts consistently | Various | Log consistency |

---

## QUICK WINS (Under 30 minutes each)

| # | Fix | Est. Time | Files |
|---|---|---|---|
| 1 | Remove duplicate preconnect tags in layout.tsx head | 5 min | `app/layout.tsx` |
| 2 | Remove `/api/test-dex-fetch` route | 2 min | Delete file |
| 3 | Add auth to `/api/debug/kv-snapshots` and `/api/diagnostics/rate-limits` | 10 min | 2 files |
| 4 | Delete `public/legacy-unused/` folder | 2 min | 5 files |
| 5 | Delete placeholder images from `public/` | 2 min | 5 files |
| 6 | Create `.env.example` documenting all env vars | 15 min | New file |
| 7 | Fix duplicate `TokenSnapshot` interface in types.ts | 5 min | `lib/types.ts` |
| 8 | Move `use-pro.ts` and `use-auto-refresh.ts` from `lib/` to `hooks/` | 10 min | 2 files + imports |
| 9 | Add `loading.tsx` files for `/token/[address]`, `/signals`, `/research` | 15 min | 3 new files |
| 10 | Remove duplicate OG/Twitter meta tags from layout.tsx head (already in metadata export) | 10 min | `app/layout.tsx` |
| 11 | Pin "latest" dependencies to specific versions in package.json | 10 min | `package.json` |
| 12 | Add basic error.tsx to `/app/error.tsx` for root error boundary | 10 min | 1 new file |
| 13 | Add loading.tsx to `/app/token/[address]/loading.tsx` | 5 min | 1 new file |
| 14 | Fix `riskFactors` reference in schema.ts (property doesn't exist on TokenScore) | 5 min | `lib/schema.ts` |
