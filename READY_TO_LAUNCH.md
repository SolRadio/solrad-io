# SOLRAD Launch Readiness Report

> Generated: 2026-02-17 | Source: live repo scan (Glob, Grep, Read)
> Status: **YELLOW -- 1 blocker, several high-priority items**

---

## 1. Route Map (Exact)

### Pages (51 total)

| Route | Type |
|---|---|
| `/` | Landing / home |
| `/about` | Static content |
| `/admin-cache-control` | Admin |
| `/admin/alerts` | Admin |
| `/admin/ingest` | Admin |
| `/admin/intel` | Admin |
| `/admin/qa` | Admin |
| `/admin/status` | Admin (system panel) |
| `/alerts` | Public |
| `/browse` | Public (force-dynamic) |
| `/contact` | Static content |
| `/disclaimer` | Static content |
| `/faq` | Static content |
| `/infrastructure` | Static content |
| `/insights/[slug]` | Dynamic content |
| `/intelligence` | Public (intel reports) |
| `/lead-time-proof` | Public (proof feed) |
| `/learn` | Static content hub |
| `/learn/[slug]` | Dynamic content |
| `/learn/category/[slug]` | Dynamic content |
| `/learn/how-to-find-gems` | Static content |
| `/ops` | Admin (ops panel) |
| `/privacy` | Static content |
| `/pro` | Public (upgrade CTA) |
| `/proof-engine/ledger-hash` | Public (ledger integrity) |
| `/research` | Public (force-dynamic) |
| `/research/daily/[date]` | Dynamic content |
| `/research/token/[token]/[date]` | Dynamic content |
| `/research/weekly/[week]` | Dynamic content |
| `/score-lab` | Public (interactive) |
| `/scoring` | Static content |
| `/security` | Static content |
| `/signals` | Public |
| `/solana-meme-coin-scanner` | SEO landing |
| `/solana-risk-checker` | SEO landing |
| `/solana-token-dashboard` | SEO landing |
| `/solana-wallet-tracker` | SEO landing |
| `/terms` | Static content |
| `/token/[address]` | Dynamic (token detail) |
| `/token` | Public (redirect/hub) |
| `/tracker` | Public |
| `/wallets` | Public |
| `/watchlist` | Public |
| `/(seo)/solana-gem-finder` | SEO landing |
| `/(seo)/solana-token-scanner` | SEO landing |
| `/(seo)/solana-trending/by-holders` | SEO landing |
| `/(seo)/solana-trending/by-liquidity` | SEO landing |
| `/(seo)/solana-trending/by-volume` | SEO landing |
| `/(seo)/solana-trending/last-1h` | SEO landing |
| `/(seo)/solana-trending/last-24h` | SEO landing |
| `/(seo)/solana-trending/last-6h` | SEO landing |

### API Routes (87 total)

**Public Data:**
- `GET /api/tokens` -- token index
- `GET /api/tokens/batch` -- batch token lookup
- `GET /api/tokens/archive` -- archive
- `GET /api/tokens/archive/health` -- archive health
- `GET /api/token/[mint]` -- single token detail
- `GET /api/token/[mint]/enrich` -- enriched data
- `GET /api/token/live` -- live data
- `GET /api/index` -- main index
- `GET /api/quote/[mint]` -- price quote
- `GET /api/sol-price` -- SOL price
- `GET /api/signal-outcomes` -- signals + outcomes
- `GET /api/active-trading` -- active trading data
- `GET /api/token-history` -- history
- `GET /api/held-duration` -- held duration
- `GET /api/tracker` -- tracker feed
- `GET /api/news/solana` -- news feed
- `POST /api/waitlist` -- waitlist signup

**Research + Intel:**
- `GET /api/alpha-ledger` -- alpha ledger
- `GET /api/alpha-ledger/hash` -- ledger hash
- `GET /api/alpha-ledger/hash-history` -- hash history
- `GET /api/leadtime-ledger` -- lead-time ledger
- `GET /api/lead-time/recent` -- recent proofs
- `GET /api/lead-time/[mint]` -- per-mint proofs
- `GET /api/lead-time/debug` -- lead-time debug
- `GET /api/score-lab` -- score lab API

**Health + Diagnostics:**
- `GET /api/health` -- basic health check
- `GET /api/health/quicknode` -- QuickNode status
- `GET /api/health/quicknode-lastrun` -- QN last run
- `GET /api/diagnostics` -- system diagnostics
- `GET /api/diagnostics/rate-limits` -- rate limit status
- `GET /api/proof-engine-health` -- proof engine
- `GET /api/proof-engine-status` -- proof status
- `GET /api/snapshot-health` -- snapshot health
- `GET /api/debug/kv-snapshots` -- KV debug
- `GET /api/bootstrap` -- bootstrap check

**Ingestion Pipelines:**
- `POST /api/ingest` -- manual ingest
- `POST /api/ingest/cycle` -- ingest cycle
- `POST /api/ingest/new-mints` -- Helius mint discovery
- `POST /api/ingest/new-mints-qn` -- QuickNode mint discovery
- `GET /api/ingest/health` -- ingest health
- `POST /api/trigger-ingestion` -- trigger
- `POST /api/refresh` -- data refresh
- `GET /api/test-dex-fetch` -- DexScreener test

**Cron Jobs:**
- `GET /api/cron` -- main cron (every 5 min)
- `GET /api/cron/snapshot` -- snapshot cron (every 5 min)
- `GET /api/cron/ingest` -- ingest cron
- `GET /api/cron/alpha-ledger` -- alpha ledger (every 6 hrs)
- `GET /api/research/generate/daily` -- daily research (6am UTC)
- `GET /api/research/generate/weekly` -- weekly research (Mon 7am UTC)
- `GET /api/intel/generate/daily` -- daily intel (8am UTC)

**Admin (password-protected):**
- `POST /api/admin/system-report` -- system report
- `POST /api/admin/harvest/run` -- manual harvest
- `POST /api/admin/run-snapshot-ingest` -- manual snapshot ingest
- `POST /api/admin/run-leadtime-harvest` -- manual lead-time harvest
- `POST /api/admin/snapshot/reindex` -- reindex snap:index
- `POST /api/admin/snapshot/run` -- manual snapshot run
- `POST /api/admin/readpath-trace` -- read-path debug
- `POST /api/admin/alpha-ledger/harvest` -- alpha harvest
- `POST /api/admin/alpha-ledger/append` -- ledger append
- `POST /api/admin/alpha-ledger/void` -- void entry
- `POST /api/admin/flush-index-cache` -- flush index
- `GET/POST /api/admin/alerts` -- alert management
- `GET/POST /api/admin/alert-rules` -- rule CRUD
- `POST /api/admin/alert-delivery` -- alert delivery
- `POST /api/admin/qa/run` -- QA runner
- `POST /api/admin/ingest/retry-resolution` -- retry resolution
- `GET /api/admin/ingest/stats` -- ingest stats
- `POST /api/admin/intel/generate` -- generate intel
- `GET /api/admin/intel/latest` -- latest intel
- `GET /api/admin/intel/history` -- intel history
- `POST /api/admin/intel/send` -- send intel
- `POST /api/admin/intel/audit` -- audit intel

**Ops (password-protected):**
- `POST /api/ops/auth` -- ops auth
- `POST /api/ops/login` -- ops login
- `POST /api/ops/logout` -- ops logout
- `GET /api/ops/check` -- check auth
- `POST /api/ops/add-mint` -- add tracked mint
- `POST /api/ops/remove-mint` -- remove mint
- `POST /api/ops/fix-addresses` -- fix addresses
- `POST /api/ops/flush-cache` -- flush cache
- `POST /api/ops/invalidate-cache` -- invalidate cache
- `POST /api/ops/nuclear-clear` -- nuclear clear

**Telegram:**
- `POST /api/telegram/alert` -- alert webhook
- `POST /api/telegram/internal-trigger` -- internal trigger

**Research Generation:**
- `POST /api/research/generate` -- generate report
- `POST /api/research/publish` -- publish report
- `POST /api/intel/rebuild` -- rebuild intel

---

## 2. Data + KV Map (Exact)

All keys discovered by scanning `kv.*` and `storage.*` calls across the repo:

| Prefix | Purpose | Read By | Written By | Freshness |
|---|---|---|---|---|
| `solrad:latest` | Main token scores array | `/api/tokens`, `/api/index`, intel gen | `lib/ingestion.ts` | ~5 min (cron) |
| `solrad:lastUpdated` | Last ingest timestamp | proof-engine-status | ingestion | ~5 min |
| `solrad:sourceMeta` | Data source metadata | diagnostics | ingestion | ~5 min |
| `solrad:ingestionStatus` | Ingest status object | diagnostics, flush-index | ingestion | ~5 min |
| `solrad:lastIngestTime` | Epoch ms of last ingest | ingestion guard | ingestion | ~5 min |
| `solrad:lock:ingestion` | Ingest mutex lock | ingestion | ingestion | 60s TTL |
| `solrad:source:dexscreener` | DexScreener cached tokens | dexscreener adapter | dexscreener adapter | 120s TTL |
| `solrad:tokenIndex:v1` | Token index cache | rate-limits, intel/rebuild | flush-index | Variable |
| `solrad:tokenIndex:meta` | Index metadata | flush-index | ingestion | Variable |
| `solrad:tokens:fallback` | Fallback token cache | ingestion | ingestion | 1hr TTL |
| `solrad:tokens:blob-fallback` | Blob fallback ref | ingestion | ingestion | Variable |
| `solrad:firstSeenAt` | First-seen timestamps | nuclear-clear | ingestion | Permanent |
| `snap:index` | Set of all tracked mints | signal-outcomes, system-report, reindex, snapshot-health | snapshotLogger, signal-outcomes (heal) | Updated on every snapshot |
| `snap:list:{mint}` | Per-mint snapshot history (list) | signal-outcomes, system-report, kv-snapshots | snapshotLogger (lpush) | ~5 min per mint |
| `snap:latest:{mint}` | Latest snapshot for a mint | snapshotLogger | snapshotLogger | ~5 min |
| `snap:lastLogged:{mint}` | Dedup timestamp | snapshotLogger | snapshotLogger | DEDUP_WINDOW TTL |
| `mint:{address}` | Per-mint detailed data | ingest/stats, invalidate-cache | ingest/new-mints, ingest/new-mints-qn | 90 day TTL |
| `ingest:lastRunTime` | Last ingest epoch | ingest/stats | cron/ingest | ~5 min |
| `ingest:lastError` | Last ingest error msg | ingest/stats, cron/ingest | cron/ingest | 24hr TTL |
| `ingest:health` | Ingest health object | ingest/health | ingest/cycle | 1hr TTL |
| `token:enrich:{mint}` | Enriched token cache | token/[mint]/enrich | token/[mint]/enrich | Variable |
| `solrad:mint:{mint}` | Mint detail cache | token/[mint] | token/[mint] | Variable |
| `solrad:batch:token:{mint}` | Batch token cache | tokens/batch | tokens/batch | Variable |
| `solrad:quote:{mint}` | Price quote cache | quote/[mint] | quote/[mint] | Variable |
| `solrad:sol:price:v2` | SOL/USD price | sol-price | sol-price | Short TTL |
| `solrad:alpha:ledger` | Alpha ledger entries | alpha-ledger route, proof-engine | alpha-ledger harvest | 6hr cycle |
| `solrad:alpha:ledger:meta` | Ledger metadata (hash, ts) | proof-engine-health, status | alpha-ledger harvest | 6hr cycle |
| `solrad:alpha:ledger:hashHistory` | Hash chain history | alpha-ledger/hash-history | alpha-ledger.ts | 6hr cycle |
| `solrad:lock:alphaLedger` | Ledger write mutex | alpha-ledger.ts | alpha-ledger.ts | 10s TTL |
| `solrad:alpha:harvest` | Harvest telemetry | proof-engine-health, system-report | cron/alpha-ledger | 6hr cycle |
| `solrad:harvest:run_lock` | Admin harvest mutex | harvest/run | harvest/run | 120s TTL |
| `solrad:snapshot-ingest:run_lock` | Admin ingest mutex | run-snapshot-ingest | run-snapshot-ingest | 120s TTL |
| `solrad:leadtime-harvest:run_lock` | Admin LT harvest mutex | run-leadtime-harvest | run-leadtime-harvest | 120s TTL |
| `solrad:leadtime:recent` | Recent lead-time proofs | lead-time/recent, system-report | lead-time/writer, addToRecentProofs | 7 day TTL |
| `solrad:leadtime:observation:{mint}` | Pending observation | writer | writer | 6hr TTL |
| `solrad:leadtime:proof:{mint}` | Per-mint proof | lead-time/[mint] | saveLeadTimeProof | 30 day TTL |
| `solrad:leadtime:stats` | Lead-time stats | storage.ts | storage.ts | 30 day TTL |
| `solrad:leadtime:ping` | Debug ping | lead-time/debug | UNVERIFIED | Variable |
| `leadtime:last_writer_run_at` | Writer last run ts | UNVERIFIED (diagnostic) | writer.ts | 24hr TTL |
| `leadtime:last_writer_stats` | Writer run stats | UNVERIFIED (diagnostic) | writer.ts | 24hr TTL |
| `leadtime:last_error` | Writer last error | UNVERIFIED (diagnostic) | writer.ts | 24hr TTL |
| `solrad:alertRules` | Alert rule definitions | alert-rules | alert-rules | Persistent |
| `solrad:alertDeliveryLog` | Delivery log | alert-delivery | emit-signal-state-alert | 24hr TTL |
| `solrad:signalStateAlerts` | Signal state alerts | admin/alerts | emit-signal-state-alert | Variable |
| `solrad:signalAlertDedupe:{mint}:{from}:{to}` | Alert dedup | emit-signal-state-alert | emit-signal-state-alert | DEDUPE_TTL |
| `solrad:quicknode:lastRun` | QN last run receipt | health/quicknode-lastrun, refresh | ingest/new-mints-qn | 7 day TTL |
| `solrad:waitlist:emails` | Waitlist email set | waitlist | waitlist | Persistent |
| `solrad:waitlist:meta:{email}` | Waitlist metadata | UNVERIFIED | waitlist | Persistent |
| `fresh:{mint}` | Ingest freshness guard | ingest/guard | ingest/guard | FRESH_TTL |
| `seen:{mint}` | Ingest seen guard | ingest/guard | ingest/guard | SEEN_TTL |
| `fresh:list` | Fresh mints list | UNVERIFIED | ingest/guard | 1hr TTL |
| `research:*` | Research report storage | researchStore | researchStore | Persistent |
| `solrad:intel:latest` | Latest intel report | admin/intel/latest | intel/generator | 24hr TTL |

---

## 3. Cron / Schedules (Exact)

From `vercel.json`:

| Path | Schedule | What it does |
|---|---|---|
| `/api/cron` | `*/5 * * * *` (every 5 min) | Main pipeline: ingest tokens, log snapshots, run proof engine |
| `/api/cron/snapshot` | `*/5 * * * *` (every 5 min) | Snapshot logger: write snap:list entries for tracked mints |
| `/api/cron/alpha-ledger` | `0 */6 * * *` (every 6 hrs) | Alpha ledger harvest: score + archive signals |
| `/api/research/generate/daily` | `0 6 * * *` (6am UTC daily) | Generate daily research report |
| `/api/research/generate/weekly` | `0 7 * * 1` (Mon 7am UTC) | Generate weekly research report |
| `/api/intel/generate/daily` | `0 8 * * *` (8am UTC daily) | Generate daily intelligence report |

All cron routes require `CRON_SECRET` via `Authorization: Bearer {secret}` header.

---

## 4. Launch Blockers (Strict)

### BLOCKER

- [ ] **B1: Hardcoded fallback password in source code.**
  - File: `app/api/intel/rebuild/route.ts:17`
  - Code: `process.env.ADMIN_PASSWORD || "solrad-admin-2024"`
  - Risk: If `ADMIN_PASSWORD` env var is unset, anyone can access with the hardcoded string.
  - Fix: Remove the `|| "solrad-admin-2024"` fallback. Reject if env var is missing.

### HIGH

- [ ] **H1: No root `not-found.tsx` or `global-error.tsx`.**
  - Only `app/loading.tsx`, `app/browse/loading.tsx`, `app/watchlist/loading.tsx`, `app/(seo)/*/loading.tsx`, and `app/admin/intel/error.tsx` exist.
  - A bad URL like `/xyzabc` will show the default Next.js 404 (unstyled).
  - Fix: Add `app/not-found.tsx` and `app/global-error.tsx` with branded styling.

- [ ] **H2: `ignoreBuildErrors: true` in `next.config.mjs`.**
  - TypeScript errors are silently ignored during build. A bad import or type mismatch could ship broken pages.
  - Fix: Remove or set to false before launch. Fix any TS errors that surface.

- [ ] **H3: Auth pattern fragmentation.**
  - Three different password env vars: `OPS_PASSWORD`, `ADMIN_PASSWORD`, `ADMIN_ALERTS_PASSWORD`.
  - Some routes accept any of the three (`/api/ops/auth`), some only check one.
  - Client pages store passwords in `sessionStorage` under different keys.
  - Risk: Confusion over which password protects which route; one leaked password may not cover all admin surfaces.
  - Recommendation: Consolidate to `OPS_PASSWORD` only, or document clearly.

- [ ] **H4: Lead-time proofs may be empty at launch.**
  - `solrad:leadtime:recent` requires active observations + reactions (volume >30% or liquidity >20% within 1 hour).
  - If no tokens meet these thresholds, the `/lead-time-proof` page shows nothing.
  - The MVP_MODE fallback exists (`process.env.MVP_MODE=1`) but stores `confidence: "LOW"` placeholder proofs.
  - Recommendation: Verify proofs exist via `/api/lead-time/recent` before launch.

- [ ] **H5: No payment/billing backend.**
  - `isPro` is hardcoded `false` everywhere (free user delay of 15 min on lead-time proofs, locked signal rows).
  - `/pro` page exists as CTA but has no Stripe/payment integration.
  - OK for launch if positioning as "free beta", but Pro teasers must not imply immediate access.

### MEDIUM

- [ ] **M1: No rate limiting on public API routes.**
  - Routes like `/api/tokens`, `/api/signal-outcomes`, `/api/quote/[mint]` have no rate limiting.
  - Risk: Bot scraping or abuse.

- [ ] **M2: `process.env` used on client in ResearchClient.tsx (lines 1038, 1047, 1381, 1389).**
  - `process.env.NODE_ENV` works in Next.js client bundles, but these are dev-only debug panels.
  - They are gated by `!== "production"` so they won't render in prod. Low risk.

---

## 5. Trust Layer Checklist

### Proof Engine Correctness

- [x] **Observation timestamp**: `Date.now()` at observation creation (`writer.ts:357`)
- [x] **Reaction timestamp**: `Date.now()` at reaction detection (`writer.ts:408`)
- [x] **Lead time calculation**: `leadSeconds = (reactionTimestamp - observationTimestamp) / 1000` (`storage.ts:47+`)
- [x] **Magnitude math**: Volume change = `(current - baseline) / baseline * 100` (`writer.ts:386-390`). Capped at `Math.round(magnitude * 100) / 100` for display.
- [x] **Confidence levels**: Derived from `stateData.confidence`: >=80 = HIGH, >=65 = MEDIUM, else LOW (`writer.ts:352-353`)
- [x] **Thresholds**: Score jump >= 10 OR signal upgrade triggers observation. Volume >= 30% OR liquidity >= 20% triggers reaction.
- [x] **Observation expiry**: 6-hour TTL (`OBSERVATION_TTL = 60*60*6`). Expired observations deleted, not converted to proofs.
- [x] **Deduplication**: Existing observation check prevents double-counting (`writer.ts:335`)
- [x] **Alpha ledger hash chain**: Ledger entries are hashed and hash history is maintained (`alpha-ledger.ts:239`)
- [ ] **VERIFY**: No unit tests found for proof engine math. Manual verification required pre-launch.

### Data Freshness Go/No-Go

| Metric | Go Threshold | Check Endpoint |
|---|---|---|
| Last ingest age | < 10 min | `/api/health` -> `lastUpdated` |
| Snapshot freshness | < 10 min (any mint) | `/api/admin/system-report` -> `kv.ageSec` |
| Alpha ledger age | < 7 hrs | `/api/admin/system-report` -> `proof.ageSec` |
| Lead-time recent count | > 0 proofs | `/api/lead-time/recent` -> `readCount` |
| Cron execution | All 6 crons ran in last cycle | Vercel dashboard -> Cron Jobs |

---

## 6. Security Checklist

- [x] **`verifyOpsPasswordFromHeader`** in `lib/auth-helpers.ts` reads from `process.env.OPS_PASSWORD` only (no fallback).
- [ ] **BLOCKER**: `app/api/intel/rebuild/route.ts:17` has `|| "solrad-admin-2024"` fallback. Must remove.
- [x] All cron routes check `CRON_SECRET` via Authorization header.
- [x] Admin pages use `sessionStorage` for password (never in URL, never in cookies for admin).
- [x] `process.env.*` secrets are server-only (not prefixed with `NEXT_PUBLIC_`).
- [x] `readpath-trace` accepts `_pw` query param for browser-tab access -- acceptable for admin-only debug use.
- [x] No API keys or tokens found hardcoded in source.
- [x] `OPS_PASSWORD` returns `false` (deny) when env var is unset (`auth-helpers.ts:88-90`).
- [ ] **VERIFY**: Confirm all three password env vars (`OPS_PASSWORD`, `ADMIN_PASSWORD`, `ADMIN_ALERTS_PASSWORD`) are set in Vercel.

### Required Environment Variables

| Variable | Used By | Required |
|---|---|---|
| `KV_REST_API_URL` | Upstash Redis | Yes |
| `KV_REST_API_TOKEN` | Upstash Redis | Yes |
| `CRON_SECRET` | All cron routes | Yes |
| `OPS_PASSWORD` | Admin routes, ops panel | Yes |
| `ADMIN_PASSWORD` | Some admin routes | Yes (or consolidate with OPS) |
| `ADMIN_ALERTS_PASSWORD` | Alert admin routes | Yes (or consolidate with OPS) |
| `SOLRAD_INTERNAL_SECRET` | Internal triggers | Yes |
| `HELIUS_API_KEY` | Token enrichment, mint discovery | Yes (if Helius enabled) |
| `QUICKNODE_SOLANA_RPC_URL` | QuickNode mint discovery | Yes (if QN enabled) |
| `QUICKNODE_MINT_DISCOVERY_ENABLED` | Feature flag | Optional |
| `HELIUS_MINT_DISCOVERY_ENABLED` | Feature flag | Optional |
| `OPENAI_API_KEY` | Intel/research generation | Yes (if intel enabled) |
| `TELEGRAM_BOT_TOKEN` | Telegram alerts | Optional |
| `TELEGRAM_ALERTS_CHAT_ID` | Telegram alerts | Optional |
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs, OG tags | Recommended |
| `NEXT_PUBLIC_BASE_URL` | Internal API calls | Recommended |
| `SOLRAD_ADMIN_KEY` | Lead-time debug | Optional |
| `MVP_MODE` | Lead-time fallback proofs | Optional |
| `LEAD_TIME_QA_SEED` | QA seed proofs | Optional (dev only) |

---

## 7. Performance / UX Checklist

- [x] **Token grid**: Uses responsive Tailwind grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` etc.).
- [x] **Loading states**: Root `app/loading.tsx`, `/browse/loading.tsx`, `/watchlist/loading.tsx`, SEO pages have loading.tsx.
- [ ] **Missing loading states**: `/research`, `/token/[address]`, `/signals`, `/alerts`, `/tracker` have no `loading.tsx`.
- [x] **Empty states**: 50+ files handle "no data" / "no results" / "no tokens" conditions.
- [x] **Error boundary**: `app/admin/intel/error.tsx` exists for intel admin.
- [ ] **Missing error boundaries**: No root `error.tsx`, no `/research/error.tsx`, no `/token/[address]/error.tsx`.
- [x] **Caching**: `sol-price` uses KV TTL cache. Token data cached with 5-min cron cycle. Snapshot data cached per-mint.
- [x] **`force-dynamic`** on `/browse` and `/research` prevents SSG crashes.
- [x] **AlertsTab MAX_ROWS**: Capped at 50 rows to prevent DOM explosion.
- [x] **Locked row backdrop-blur**: Removed (was causing compositor overhead).
- [x] **Search debounce**: 300ms debounce on both ledger and lead-time search inputs.
- [x] **AbortControllers**: Active on both `fetchLedger` and `fetchLeadTime` to cancel stale requests.

---

## 8. Monetization Readiness (UI-Only)

| Feature | Status | Location |
|---|---|---|
| Locked signal rows | IMPLEMENTED | `alerts-tab.tsx` -- `PRO signal` placeholder with Lock icon |
| Delayed lead-time proofs | IMPLEMENTED | `/api/lead-time/recent` -- 15-min delay for `isPro=false` |
| Per-mint proof delay | IMPLEMENTED | `/api/lead-time/[mint]` -- 15-min delay for `isPro=false` |
| Pro upgrade CTA page | IMPLEMENTED | `/pro` -- landing page exists |
| Upgrade prompts | PARTIAL | Appears in some signal rows. No CTA button on `/lead-time-proof`. |
| Payment backend | NOT IMPLEMENTED | No Stripe, no checkout, no subscription management |
| Pro auth state | NOT IMPLEMENTED | `isPro` is always `false`. No user sessions or JWT. |

**Launch position**: Free beta with visible Pro teasers. No payment flow needed yet.

---

## 9. Final Runbook

### Pre-Launch Verification Steps

**Step 1: Environment Variables**
- URL: Vercel Dashboard -> Project -> Settings -> Environment Variables
- Confirm all "Required" vars from Section 6 are set for Production
- Expected: All present, no empty values

**Step 2: Health Check**
- URL: `https://www.solrad.io/api/health`
- Expected: `{ "status": "ok", "kvConnected": true }`

**Step 3: Data Freshness**
- URL: `https://www.solrad.io/api/diagnostics`
- Expected: `kvConfigured: true`, `heliusConfigured: true`, `opsPasswordConfigured: true`

**Step 4: Token Data Flowing**
- URL: `https://www.solrad.io/api/tokens`
- Expected: JSON array with 30+ tokens, each with `totalScore`, `address`, `symbol`

**Step 5: Signals Rendering**
- URL: `https://www.solrad.io/browse`
- Expected: Token grid renders with scores, no blank page, no error

**Step 6: Signal Outcomes Endpoint**
- URL: `https://www.solrad.io/api/signal-outcomes`
- Expected: Non-empty `signals` array, `meta.trackedMintsCount > 0`

**Step 7: Proof Engine Status**
- URL: `https://www.solrad.io/api/proof-engine-health?debug=1`
- Expected: `status: "OK"` or `"WARN"`, `lastHarvestAgeMinutes < 400`

**Step 8: Lead-Time Proofs**
- URL: `https://www.solrad.io/api/lead-time/recent`
- Expected: `readOk: true`. If `readCount: 0`, trigger manual harvest from admin/status.

**Step 9: Research Page**
- URL: `https://www.solrad.io/research`
- Expected: Page loads, tabs work (Ledger, Lead-Time, Alerts). No blank page.

**Step 10: Admin Status Panel**
- URL: `https://www.solrad.io/admin/status` (enter OPS_PASSWORD)
- Expected: Three status cards (KV Snapshots, Proof Engine, Lead-Time). Check gates list is empty or has only `leadtime_empty`.

**Step 11: SEO Basics**
- URL: `https://www.solrad.io/robots.txt`
- Expected: Allows crawling, sitemap URL present
- URL: `https://www.solrad.io/sitemap.xml`
- Expected: Lists all public pages

**Step 12: Token Detail Page**
- URL: `https://www.solrad.io/token/{any-tracked-mint}`
- Expected: Token detail renders with score, chart area, metadata

**Step 13: Mobile Spot Check**
- Open `/browse` and `/research` on mobile viewport
- Expected: Responsive grid, no horizontal overflow, tabs work

**Step 14: 404 Page**
- URL: `https://www.solrad.io/this-does-not-exist`
- Expected: Branded 404 page (CURRENTLY MISSING -- will show default Next.js 404)

### Safe to Tweet Checklist

- [ ] Steps 1-13 all pass
- [ ] Blocker B1 is fixed (hardcoded password removed)
- [ ] At least 1 lead-time proof exists in `/api/lead-time/recent`
- [ ] `ignoreBuildErrors` is removed from next.config.mjs
- [ ] No gates show in admin/status (or only `leadtime_empty` with MVP_MODE on)

---

*End of report. ONE file. Markdown only. Every path, key, and finding based on live repo scan.*
