# STATE OF PROJECT — SOLRAD
**Audit Date:** 2026-02-23

---

## OVERVIEW

SOLRAD (Solana Radar) is a real-time Solana token intelligence platform that ingests on-chain data from QuickNode RPC and DexScreener, scores tokens using a proprietary multi-factor model (liquidity, volume, activity, age, health), and surfaces high-conviction signals through a terminal-style dashboard. It includes a Proof Engine (Alpha Ledger with SHA-256 timestamped entries), lead-time tracking, signal outcome measurement, research reports (daily/weekly), and a Pro tier with gated features. The platform is read-only — it never connects wallets or holds keys.

**Tech Stack:**
- Next.js 16 (App Router, Turbopack) with TypeScript
- Tailwind CSS v4 + shadcn/ui components
- Upstash Redis (via @vercel/kv) for all data storage
- Clerk for authentication
- Stripe for Pro subscriptions ($24/mo)
- Vercel for deployment (cron jobs, analytics, blob storage)
- DexScreener API + QuickNode Solana RPC for data
- OpenAI API for intel generation and research reports

**Deployment:** Vercel production at https://www.solrad.io with bare domain redirect (solrad.io -> www.solrad.io via proxy.ts).

---

## PAGES INVENTORY

| Route | Purpose | Status |
|-------|---------|--------|
| `/` | Main dashboard — token grid, signals, filters, real-time refresh | WORKING |
| `/token/[address]` | Individual token detail page with chart, scoring, signals | WORKING |
| `/token` | Token search/browse landing | WORKING |
| `/browse` | Browse all tracked tokens | WORKING |
| `/research` | Proof Engine — Alpha Ledger, Lead-Time Proofs, signal history | WORKING |
| `/research/daily/[date]` | Daily research report | WORKING |
| `/research/weekly/[week]` | Weekly research report | WORKING |
| `/research/token/[token]/[date]` | Token-specific research snapshot | WORKING |
| `/score-lab` | Score Lab — win rates, stats, snapshots (Pro-gated) | WORKING |
| `/signals` | Signal Outcomes — performance tracking (Pro-gated) | WORKING |
| `/saw-it-first` | "Saw It First" — proof of early signal detection | WORKING |
| `/lead-time-proof` | Lead-time proof display page | WORKING |
| `/proof-engine/ledger-hash` | Hash verification for Alpha Ledger integrity | WORKING |
| `/tracker` | Token tracker — custom tracking list | WORKING |
| `/watchlist` | User watchlist | WORKING |
| `/wallets` | Wallet intelligence (Clerk-protected) | PARTIAL — route protected, UI likely placeholder |
| `/alerts` | Alerts system (Clerk-protected) | PARTIAL — route protected, UI likely placeholder |
| `/intelligence` | Market intelligence feed | WORKING |
| `/insights/[slug]` | Individual insight article | WORKING |
| `/pro` | Pro upgrade page — pricing, features, Stripe checkout | WORKING |
| `/pro/success` | Post-checkout success page | WORKING |
| `/about` | About SOLRAD | WORKING |
| `/faq` | FAQ with JSON-LD structured data | WORKING |
| `/learn` | Learning center hub | WORKING |
| `/learn/[slug]` | Individual learn article | WORKING |
| `/learn/category/[slug]` | Learn articles by category | WORKING |
| `/learn/how-to-find-gems` | SEO guide page | WORKING |
| `/scoring` | How scoring works — methodology documentation | WORKING |
| `/security` | Security & transparency page | WORKING |
| `/infrastructure` | Infrastructure documentation page | WORKING |
| `/contact` | Contact form + email support | WORKING |
| `/privacy` | Privacy policy | WORKING |
| `/terms` | Terms of service | WORKING |
| `/disclaimer` | Disclaimer page | WORKING |
| `/sign-in/[[...sign-in]]` | Clerk sign-in page | WORKING |
| `/sign-up/[[...sign-up]]` | Clerk sign-up page | WORKING |
| `/ops` | Admin operations panel (password-protected) | WORKING |
| `/admin/status` | Admin system status | WORKING |
| `/admin/ingest` | Admin ingestion control | WORKING |
| `/admin/alerts` | Admin alerts management | WORKING |
| `/admin/intel` | Admin intel generation | WORKING |
| `/admin/qa` | Admin QA testing | WORKING |
| `/admin/suppress` | Admin token suppression | WORKING |
| `/admin/tools` | Admin diagnostic tools | WORKING |
| `/admin-cache-control` | Admin cache control | WORKING |
| **SEO Pages** | | |
| `/(seo)/solana-token-scanner` | SEO landing — token scanner | WORKING |
| `/(seo)/solana-gem-finder` | SEO landing — gem finder | WORKING |
| `/(seo)/solana-trending/*` | SEO landings — trending by time/metric | WORKING |
| `/solana-meme-coin-scanner` | SEO landing — meme coin scanner | WORKING |
| `/solana-risk-checker` | SEO landing — risk checker | WORKING |
| `/solana-token-dashboard` | SEO landing — token dashboard | WORKING |
| `/solana-wallet-tracker` | SEO landing — wallet tracker | WORKING |

---

## API ROUTES INVENTORY

### Core Data
| Endpoint | Purpose | Auth | Status |
|----------|---------|------|--------|
| `/api/tokens` | Get all tracked tokens | NO | WORKING |
| `/api/tokens/batch` | Batch token fetch | NO | WORKING |
| `/api/tokens/archive` | Archived tokens | NO | WORKING |
| `/api/tokens/archive/health` | Archive health check | NO | WORKING |
| `/api/token/[mint]` | Single token data | NO | WORKING |
| `/api/token/[mint]/enrich` | Enrich token with extra data | NO | WORKING |
| `/api/token/live` | Live token data | NO | WORKING |
| `/api/quote/[mint]` | Price quote for mint | NO | WORKING |
| `/api/sol-price` | Current SOL price | NO | WORKING |
| `/api/index` | Token index data | NO | WORKING |
| `/api/active-trading` | Active trading data | NO | WORKING |
| `/api/token-history` | Token price history | NO | WORKING |
| `/api/held-duration` | Token held duration calc | NO | WORKING |
| `/api/tracker` | Tracker data | NO | WORKING |

### Proof Engine & Research
| Endpoint | Purpose | Auth | Status |
|----------|---------|------|--------|
| `/api/alpha-ledger` | Alpha Ledger entries | NO | WORKING |
| `/api/alpha-ledger/hash` | Current ledger hash | NO | WORKING |
| `/api/alpha-ledger/hash-history` | Hash history log | NO | WORKING |
| `/api/lead-time/[mint]` | Lead-time data per mint | NO | WORKING |
| `/api/lead-time/recent` | Recent lead-time proofs | NO | WORKING |
| `/api/lead-time/debug` | Lead-time debug (admin key) | YES | WORKING |
| `/api/leadtime-ledger` | Lead-time ledger | NO | WORKING |
| `/api/signal-outcomes` | Signal outcome tracking | NO | WORKING |
| `/api/score-lab` | Score Lab data | NO | WORKING |
| `/api/research/generate` | Generate research report | YES | WORKING |
| `/api/research/generate/daily` | Generate daily report | YES | WORKING |
| `/api/research/generate/weekly` | Generate weekly report | YES | WORKING |
| `/api/research/publish` | Publish research | YES | WORKING |

### Ingestion & Cron
| Endpoint | Purpose | Auth | Status |
|----------|---------|------|--------|
| `/api/cron` | Main cron — token refresh | CRON_SECRET | WORKING |
| `/api/cron/snapshot` | Snapshot cron | CRON_SECRET | WORKING |
| `/api/cron/alpha-ledger` | Alpha Ledger cron | CRON_SECRET | WORKING |
| `/api/cron/leadtime-harvest` | Lead-time harvest cron | CRON_SECRET | WORKING |
| `/api/cron/ingest` | Ingestion cron | CRON_SECRET | WORKING |
| `/api/ingest` | Manual ingest trigger | OPS_PASSWORD | WORKING |
| `/api/ingest/cycle` | Ingestion cycle | INTERNAL | WORKING |
| `/api/ingest/health` | Ingest health | NO | WORKING |
| `/api/ingest/new-mints` | New mint discovery (Helius) | AUTH | WORKING |
| `/api/ingest/new-mints-qn` | New mint discovery (QuickNode) | AUTH | WORKING |
| `/api/trigger-ingestion` | Trigger ingestion manually | AUTH | WORKING |
| `/api/refresh` | Refresh data | AUTH | WORKING |
| `/api/bootstrap` | Bootstrap initial data | NO | WORKING |

### Intel & News
| Endpoint | Purpose | Auth | Status |
|----------|---------|------|--------|
| `/api/intel/generate/daily` | Generate daily intel | CRON_SECRET | WORKING |
| `/api/intel/rebuild` | Rebuild intel | ADMIN | WORKING |
| `/api/news/solana` | Solana news feed | NO | WORKING |

### Auth & Payments
| Endpoint | Purpose | Auth | Status |
|----------|---------|------|--------|
| `/api/stripe/checkout` | Create Stripe checkout session | CLERK | WORKING |
| `/api/stripe/webhook` | Stripe webhook handler | STRIPE_SIG | WORKING |
| `/api/stripe/portal` | Stripe billing portal | CLERK | WORKING |
| `/api/user/plan` | Get user plan status | NO (returns anonymous) | WORKING |
| `/api/user/pro-status` | Get Pro status | NO (returns anonymous) | WORKING |
| `/api/waitlist` | Waitlist signup | NO | WORKING |
| `/api/contact` | Contact form submission | NO | WORKING |

### Admin
| Endpoint | Purpose | Auth | Status |
|----------|---------|------|--------|
| `/api/admin/set-plan` | Set user plan (admin) | ADMIN_SECRET_KEY | WORKING |
| `/api/admin/alerts` | Admin alerts management | OPS_PASSWORD | WORKING |
| `/api/admin/alert-rules` | Alert rule management | OPS_PASSWORD | WORKING |
| `/api/admin/alert-delivery` | Alert delivery trigger | CRON_SECRET | WORKING |
| `/api/admin/alpha-ledger/*` | Ledger admin (append/harvest/void) | INTERNAL | WORKING |
| `/api/admin/harvest/run` | Run harvest | INTERNAL | WORKING |
| `/api/admin/ingest/*` | Ingest admin (retry/stats) | INTERNAL | WORKING |
| `/api/admin/intel/*` | Intel admin (audit/generate/history/latest/send) | ADMIN | WORKING |
| `/api/admin/snapshot/*` | Snapshot admin (reindex/run) | INTERNAL | WORKING |
| `/api/admin/suppress` | Token suppression | OPS_PASSWORD | WORKING |
| `/api/admin/system-report` | System health report | INTERNAL | WORKING |
| `/api/admin/tools/*` | Diagnostic tools | OPS_PASSWORD | WORKING |
| `/api/admin/flush-index-cache` | Flush cache | OPS_PASSWORD | WORKING |
| `/api/admin/run-snapshot-ingest` | Manual snapshot ingest | INTERNAL | WORKING |
| `/api/admin/run-leadtime-harvest` | Manual lead-time harvest | INTERNAL | WORKING |
| `/api/admin/readpath-trace` | Read path trace debug | OPS_PASSWORD | WORKING |
| `/api/admin/proof-engine-diag` | Proof engine diagnostics | INTERNAL | WORKING |
| `/api/admin/internal-auth-check` | Auth check diagnostic | NO | WORKING |
| `/api/ops/*` | Ops panel endpoints (login/logout/check/add-mint/remove-mint/flush-cache/invalidate-cache/fix-addresses/nuclear-clear) | OPS_PASSWORD | WORKING |

### Health & Debug
| Endpoint | Purpose | Auth | Status |
|----------|---------|------|--------|
| `/api/health` | System health | NO | WORKING |
| `/api/health/quicknode` | QuickNode health | AUTH | WORKING |
| `/api/health/quicknode-lastrun` | QuickNode last run | AUTH | WORKING |
| `/api/proof-engine-health` | Proof engine health | AUTH | WORKING |
| `/api/proof-engine-status` | Proof engine status | NO | WORKING |
| `/api/snapshot-health` | Snapshot health | AUTH | WORKING |
| `/api/diagnostics` | Full diagnostics | NO | WORKING |
| `/api/diagnostics/rate-limits` | Rate limit diagnostics | NO | WORKING |
| `/api/debug/kv-snapshots` | KV debug | AUTH | WORKING |
| `/api/test-dex-fetch` | DexScreener fetch test | NO | WORKING |
| `/api/telegram/*` | Telegram alert delivery | INTERNAL | WORKING |

---

## COMPONENTS INVENTORY

**Core Layout:** Navbar, Footer, ThemeProvider, ThemeToggle, CookieConsent
**Dashboard:** DesktopTerminal, TabletTerminal, MobileTerminal, MobileContainer, MobileHeader, MobileNav, HeroOverlay, WelcomePanel, ContextBar
**Token Display:** TokenCard, CompactTokenCard, TokenCardGrid, TokenRowDesktop, TokenRowMobile, TokenDetailDrawer, TokenChart, TokenSparkline, TokenIndex
**Signals & Badges:** SignalBadges, SignalStateBadge, ConvictionBadge, ConvictionIcon, IconBadge, LeadTimeBadge, TokenMicroBadge, BadgeLegendModal, BadgeOverflowSheet
**Proof Engine:** ProofEngineSection, ProofEngineOnboarding, ProofEngineStatusPanel, ProofPreviewRail, LeadTimeProofPanel, LeadTimeProofsFeeed, LeadTimeRecentPanel, RecentLeadTimeProofs
**Intelligence:** LiveIntelPanel, LeftIntelStrip, LiveSignalStrip, MarketIntelTicker, ResearchInsights
**Features:** FilterBar, DataFreshnessBar, ActiveTrading, ActivityHealth, SourcesIndicator, LiveIndicator, StatsCard, GemFinderModal, HowToPanel, HowToUseModal
**Pro:** ProWelcomeBanner, ProTokenCardPreview, LockedFeatureCard, DevProToggle, ComingSoonPill
**Auth/Admin:** OpsLogin, OpsPanel
**Utilities:** WhyFlagged, WatchlistButton, BrowseContent, NotTrackedPageComponent, TokenOriginAccent

---

## AUTHENTICATION

**Clerk Setup:** FULLY CONFIGURED
- ClerkProvider wraps entire app in `layout.tsx` with dark theme
- `proxy.ts` uses `clerkMiddleware` from `@clerk/nextjs/server`
- Sign-in and sign-up pages at `/sign-in` and `/sign-up` with SOLRAD branding
- `SignInButton` uses `mode="redirect"` (not modal)
- `telemetry={false}` and `dynamic` set for v0 preview compatibility

**Protected Routes (via proxy.ts):**
- `/score-lab(.*)` — Requires Clerk sign-in
- `/alerts(.*)` — Requires Clerk sign-in
- `/wallets(.*)` — Requires Clerk sign-in

**Pro Detection Methods (DUAL — potential inconsistency):**
1. **Server-side via Clerk metadata:** `lib/auth/get-pro-status.ts` reads `publicMetadata.plan` or `stripeSubscriptionId`
2. **Server-side via KV:** `lib/subscription.ts` reads `user:{userId}:plan` from Redis
3. **Client-side:** `lib/use-pro.ts` reads from **localStorage** (`solrad_pro`) — NOT connected to real auth

**Navbar:** Shows Sign In button (signed out) or UserButton + PRO badge (signed in)

---

## PAYMENTS

**Stripe Setup:** CONFIGURED
- `lib/stripe.ts` initializes Stripe with `STRIPE_SECRET_KEY`
- Checkout uses `STRIPE_PRICE_ID` environment variable
- Price: $24/month subscription

**Routes:**
- `/api/stripe/checkout` — Creates checkout session (Clerk auth required)
- `/api/stripe/webhook` — Handles `checkout.session.completed`, `customer.subscription.deleted`, `customer.subscription.updated`
- `/api/stripe/portal` — Creates billing portal session

**Webhook Handler:** Writes plan to KV via `setUserPlan()` and links Stripe customer to Clerk user via `linkStripeCustomer()`. Does NOT update Clerk `publicMetadata` directly — this is a gap.

**Pro Features:**
- Score Lab (full data access)
- Signal Outcomes (full table, not just 3 rows)
- CSV Export on Alpha Ledger and Lead-Time tabs
- (Future) Wallet Intelligence, Alerts, Advanced Filters

---

## DATA PIPELINE

**Data Sources:**
- **QuickNode Solana RPC** — New mint discovery, on-chain data
- **DexScreener API** — Token prices, liquidity, volume, pair data
- **Helius API** — Alternative mint discovery (feature-flagged)
- **OpenAI API** — Intel generation, research report writing

**Cron Jobs (vercel.json):**
| Schedule | Route | Purpose |
|----------|-------|---------|
| Every 5 min | `/api/cron` | Main token data refresh |
| Every 5 min | `/api/cron/snapshot` | Snapshot capture for history |
| Every 30 min | `/api/cron/leadtime-harvest` | Lead-time proof harvesting |
| Every 2 hours | `/api/cron/alpha-ledger` | Alpha Ledger update |
| Daily 6am UTC | `/api/research/generate/daily` | Daily research report |
| Monday 7am UTC | `/api/research/generate/weekly` | Weekly research report |
| Daily 8am UTC | `/api/intel/generate/daily` | Daily intel generation |

**Known Data Issues:**
- No data TTL/expiration strategy documented — KV could grow unbounded
- Snapshot data volume may be large over time

---

## PRO FEATURE GATES

| Feature | Location | Gate Method | Status |
|---------|----------|-------------|--------|
| Score Lab (full data) | `ScoreLabClient.tsx` | `isPro` prop from server `getUserPlan()` | ENFORCED (server-side) |
| Score Lab (route access) | `proxy.ts` | Clerk `auth.protect()` | ENFORCED |
| Signal Outcomes (full table) | `SignalsClient.tsx` | `usePro()` hook (localStorage!) | NOT ENFORCED — localStorage can be spoofed |
| CSV Export (Alpha Ledger) | `ResearchClient.tsx` | `usePro()` hook (localStorage!) | NOT ENFORCED — localStorage can be spoofed |
| CSV Export (Lead-Time) | `ResearchClient.tsx` | `usePro()` hook (localStorage!) | NOT ENFORCED — localStorage can be spoofed |
| Pro Welcome Banner | `pro-welcome-banner.tsx` | `usePro()` hook (localStorage!) | COSMETIC ONLY |
| Pro page checkout/portal | `pro-content.tsx` | `isPro` prop from server `isProUser()` (KV) | ENFORCED (server-side) |
| Alerts route | `proxy.ts` | Clerk `auth.protect()` | ENFORCED (auth only, not Pro) |
| Wallets route | `proxy.ts` | Clerk `auth.protect()` | ENFORCED (auth only, not Pro) |

---

## KNOWN ISSUES

| # | Issue | Severity | Details |
|---|-------|----------|---------|
| 1 | **`lib/use-pro.ts` reads from localStorage, not real auth** | **HIGH** | The client-side `usePro()` hook reads `solrad_pro` from localStorage. Anyone can set `localStorage.setItem("solrad_pro","true")` in the console to bypass Pro gates on Signal Outcomes and CSV Export. This hook should fetch from `/api/user/pro-status` instead. |
| 2 | **Stripe webhook does not update Clerk publicMetadata** | **HIGH** | Webhook writes plan to KV but never calls `clerkClient.users.updateUser()` to set `publicMetadata.plan`. This means `get-pro-status.ts` (which reads Clerk metadata) and `subscription.ts` (which reads KV) can disagree. |
| 3 | **Dual Pro detection systems disagree** | **HIGH** | `get-pro-status.ts` reads Clerk `publicMetadata`, `subscription.ts` reads KV, `use-pro.ts` reads localStorage. These three sources are not synchronized. |
| 4 | **`/alerts` and `/wallets` are auth-gated but not Pro-gated** | MEDIUM | Any signed-in free user can access these routes. If they contain Pro features, they need an additional Pro check. |
| 5 | **No Stripe webhook endpoint registered in Stripe dashboard** | MEDIUM | The webhook route exists but you must manually register `https://www.solrad.io/api/stripe/webhook` in the Stripe dashboard and set `STRIPE_WEBHOOK_SECRET`. |
| 6 | **`STRIPE_PRICE_ID` may not be set** | MEDIUM | Checkout will 500 if this env var is missing. Need to create a price in Stripe dashboard. |
| 7 | **Clerk `dynamic` prop may cause issues in production** | LOW | The `dynamic` prop was added for v0 preview compatibility. Test in production to ensure it doesn't affect auth behavior. |
| 8 | **Admin routes have inconsistent auth** | LOW | Some use `OPS_PASSWORD`, some use `ADMIN_PASSWORD`, some use `CRON_SECRET`, some use `INTERNAL_JOB_TOKEN`. No single unified admin auth system. |
| 9 | **SEO pages removed from footer but still indexed** | LOW | Token Scanner, Infrastructure, Lead-Time removed from footer nav but pages still exist and are crawlable. This is intentional for SEO. |
| 10 | **`pro/success` page may be orphaned** | LOW | Checkout now redirects to `/score-lab?welcome=pro` instead of `/pro/success`. The success page still exists but isn't linked to. |

---

## ENVIRONMENT VARIABLES

### Clerk (Authentication)
| Variable | Required |
|----------|----------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | YES |
| `CLERK_SECRET_KEY` | YES |

### Stripe (Payments)
| Variable | Required |
|----------|----------|
| `STRIPE_SECRET_KEY` | YES |
| `STRIPE_PUBLISHABLE_KEY` | YES |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | YES |
| `STRIPE_WEBHOOK_SECRET` | YES |
| `STRIPE_PRICE_ID` | YES |

### Redis / KV (Data Storage)
| Variable | Required |
|----------|----------|
| `KV_REST_API_URL` | YES |
| `KV_REST_API_TOKEN` | YES |
| `UPSTASH_REDIS_REST_URL` | FALLBACK |
| `UPSTASH_REDIS_REST_TOKEN` | FALLBACK |

### Data Sources
| Variable | Required |
|----------|----------|
| `QUICKNODE_SOLANA_RPC_URL` | YES |
| `QUICKNODE_MINT_DISCOVERY_ENABLED` | YES (feature flag) |
| `HELIUS_API_KEY` | OPTIONAL (alternative mint source) |
| `HELIUS_MINT_DISCOVERY_ENABLED` | OPTIONAL (feature flag) |
| `OPENAI_API_KEY` | YES (intel/research generation) |

### Admin & Internal
| Variable | Required |
|----------|----------|
| `OPS_PASSWORD` | YES |
| `ADMIN_PASSWORD` | YES |
| `ADMIN_ALERTS_PASSWORD` | YES |
| `ADMIN_SECRET_KEY` | YES |
| `CRON_SECRET` | YES (Vercel cron auth) |
| `SOLRAD_CRON_SECRET` | FALLBACK |
| `INTERNAL_JOB_TOKEN` | YES |
| `SOLRAD_INTERNAL_SECRET` | YES |
| `SOLRAD_ADMIN_KEY` | YES |

### Site & Deployment
| Variable | Required |
|----------|----------|
| `NEXT_PUBLIC_SITE_URL` | YES |
| `NEXT_PUBLIC_BASE_URL` | OPTIONAL |
| `VERCEL_URL` | AUTO (Vercel provides) |
| `VERCEL_ENV` | AUTO (Vercel provides) |

### Telegram
| Variable | Required |
|----------|----------|
| `TELEGRAM_BOT_TOKEN` | OPTIONAL |
| `TELEGRAM_ALERTS_CHAT_ID` | OPTIONAL |

### Feature Flags
| Variable | Required |
|----------|----------|
| `NEXT_PUBLIC_ACTIVE_TRADING_ENABLED` | OPTIONAL |
| `MVP_MODE` | OPTIONAL |
| `LEAD_TIME_QA_SEED` | OPTIONAL |
| `ALLOW_CRON_QUERY_SECRET` | OPTIONAL |
| `SOLRAD_PRO_MODE` | OPTIONAL |

---

## WHAT'S MISSING FOR LAUNCH

### Critical (Must Fix)
1. **Fix `lib/use-pro.ts` to use real auth** — Replace localStorage reads with an API call to `/api/user/pro-status`. This is the single biggest security gap: anyone can bypass Pro gates by setting a localStorage key.
2. **Sync Stripe webhook with Clerk metadata** — After `setUserPlan()` in the webhook, also call `clerkClient.users.updateUserMetadata()` to set `publicMetadata.plan = "pro"`. This ensures `get-pro-status.ts` and `subscription.ts` agree.
3. **Register Stripe webhook** — Go to Stripe Dashboard > Webhooks, add endpoint `https://www.solrad.io/api/stripe/webhook`, subscribe to `checkout.session.completed`, `customer.subscription.deleted`, `customer.subscription.updated`.
4. **Create Stripe Price** — Create a recurring $24/month price in Stripe dashboard and set `STRIPE_PRICE_ID`.
5. **Test full checkout flow end-to-end** — Sign up, subscribe, verify Pro gates unlock, cancel, verify gates re-lock.

### Important (Should Fix Before Launch)
6. **Unify Pro detection** — Pick one source of truth (KV via `subscription.ts`) and have all client/server reads use it. Remove the Clerk `publicMetadata` path or keep it as a cache only.
7. **Add Pro check to `/alerts` and `/wallets`** — Currently only auth-gated (any signed-in user), not Pro-gated.
8. **Remove or repurpose `/pro/success`** — Checkout redirects to `/score-lab?welcome=pro` now, so the success page is orphaned.
9. **Remove `dev-pro-toggle` component from production** — This lets anyone toggle Pro status via localStorage in the UI.
10. **Add error monitoring** — No Sentry or similar error tracking is set up.

### Nice to Have
11. **Consolidate admin auth** — Unify `OPS_PASSWORD`, `ADMIN_PASSWORD`, `ADMIN_ALERTS_PASSWORD`, `ADMIN_SECRET_KEY`, `INTERNAL_JOB_TOKEN`, and `SOLRAD_ADMIN_KEY` into fewer credentials.
12. **Add rate limiting** — Public API routes have no rate limiting.
13. **Add KV data TTL** — No expiration on snapshot/history data; KV will grow unbounded.
14. **Mobile testing** — Dashboard has desktop/tablet/mobile variants; verify all breakpoints work correctly.
15. **Accessibility audit** — Ensure WCAG AA compliance across all pages.
