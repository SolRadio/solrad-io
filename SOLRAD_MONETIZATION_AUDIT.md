# SOLRAD Monetization Readiness Audit

_Full codebase audit with file paths, code evidence, and implementation roadmap._

---

## Executive Summary

| Question | Answer |
|----------|--------|
| Payment processing? | **NONE.** Zero. No Stripe, no Lemon Squeezy, no Paddle. Not even a package installed. |
| User authentication? | **NONE.** No NextAuth, no Clerk, no Supabase Auth, no custom JWT. Zero user identity. |
| Feature gating? | **Cosmetic only.** `usePro()` reads `localStorage.getItem("solrad_pro")` -- any user can grant themselves Pro in browser devtools. Zero server enforcement. |
| Waitlist? | **Yes, functional.** `/api/waitlist` stores emails in Vercel KV. This is the only monetization-adjacent system that works. |

**Bottom line:** SOLRAD currently has zero revenue infrastructure. The Pro page shows pricing ($29/month) and collects waitlist emails, but there is no checkout, no auth, and no server-side gating. Every "locked" feature is a CSS overlay with a Lock icon -- the data still loads and renders underneath.

---

## 1. Payment Processing: NONE

### Evidence

**package.json** -- Zero payment packages:
```
// Searched for: stripe, @stripe, lemon, lemonsqueezy, paddle
// Result: 0 matches in package.json dependencies
```

**Codebase-wide search:**
```
grep -r "stripe|Stripe|STRIPE|lemon|squeezy|paddle|Paddle|checkout|payment|billing|subscription|subscribe"
Result: 0 files matched across all .ts/.tsx files
```

**What exists instead:** The Pro page (`/app/pro/pro-content.tsx` line 95) shows `$29/month` as hardcoded text in a pricing tier object. The "Join Waitlist" button submits to `/api/waitlist`. That's it.

### Price Inconsistency Found

| Location | Price Shown |
|----------|-------------|
| `/app/pro/pro-content.tsx` line 95 | **$29/month** |
| User's stated target | **$24/month** |

The displayed price doesn't match the intended price.

---

## 2. User Authentication: NONE

### Evidence

**package.json** -- Zero auth packages:
```
// Searched for: next-auth, @auth, @clerk, clerk, supabase, bcrypt, jose, jsonwebtoken
// Result: 0 matches
```

**Codebase-wide search:**
```
grep -r "NextAuth|Clerk|clerk|supabase.*auth|signIn|signOut|session|jwt|JWT|bearer|Bearer|useAuth|useUser|useSession"
Result: 0 files matched across all .ts/.tsx files
```

**What exists:**
- `lib/auth.ts` -- Contains only `verifyOpsPassword()` for admin panel access (plain string comparison against `process.env.OPS_PASSWORD`)
- `lib/internal-auth.ts` -- Service-to-service token auth for cron jobs (`x-internal-job-token` header)
- `lib/auth-helpers.ts` -- IP-based rate limiting + internal secret verification
- `proxy.ts` -- Redirects `solrad.io` to `www.solrad.io`, bypasses middleware for internal job tokens

**None of these provide user identity, sessions, or subscription state.**

### Internal Auth (Ops/Admin Only)

```
lib/internal-auth.ts:
  - isInternalJob(req) -> checks x-internal-job-token header
  - requireInternalJobOrOps(req) -> checks internal token OR x-ops-password header
  - Used by: 48 API routes in /app/api/admin/** and /app/api/cron/**

lib/auth.ts:
  - verifyOpsPassword(password) -> compares against process.env.OPS_PASSWORD
  - Used by: /app/ops/** and admin routes

lib/auth-helpers.ts:
  - checkIPRateLimit() -> IP-based rate limiter using KV
  - verifyInternalSecret() -> checks x-solrad-internal header
  - verifyOpsPasswordFromHeader() -> checks x-ops-password header
```

This is a machine-to-machine auth system for internal operations. It has nothing to do with end users.

---

## 3. Feature Gating: COSMETIC ONLY

### The `usePro()` Hook

**File:** `lib/use-pro.ts` (24 lines total)

```typescript
"use client"
import { useEffect, useState } from "react"

export function usePro() {
  const [isPro, setIsPro] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("solrad_pro")
    setIsPro(stored === "true")
  }, [])

  const enablePro = () => {
    localStorage.setItem("solrad_pro", "true")
    setIsPro(true)
  }

  const disablePro = () => {
    localStorage.setItem("solrad_pro", "false")
    setIsPro(false)
  }

  return { isPro, enablePro, disablePro }
}
```

**How any user bypasses it:** Open browser devtools, type `localStorage.setItem("solrad_pro", "true")`, reload.

### Where `usePro()` is Actually Consumed

Only **3 files** import it:

| File | What it gates |
|------|--------------|
| `app/signals/SignalsClient.tsx` (lines 88-114) | Shows first 3 signal outcomes rows free; rows 4+ get a blurred/locked overlay if `!isPro` |
| `app/research/alerts-tab.tsx` (lines 126-292) | Shows limited proof alerts free; remaining get a "Unlock real-time signals" teaser if `!isPro` |
| `components/dev-pro-toggle.tsx` (lines 4-7) | Dev tool visible at `?dev=1` URL -- toggles localStorage flag |

**Critical finding:** The API routes behind these features (`/api/signal-outcomes`, `/api/lead-time/recent`) have **zero auth checks for Pro status**. They return all data to any caller. The "gating" is purely a CSS overlay in the client component -- the full data is already in the DOM.

### The `LockedFeatureCard` Component

**File:** `components/locked-feature-card.tsx`

This component renders a card with a backdrop-blur overlay and a Lock icon. It's used by:
- `app/wallets/WalletsClient.tsx` -- All 6 wallet features are wrapped in LockedFeatureCard
- The card has a `ComingSoonPill` badge

This is purely presentational. It doesn't check any auth state -- it always shows as locked.

### Feature Flags (Unrelated to Pro)

**File:** `lib/featureFlags.ts`

```typescript
export const featureFlags = {
  signalBadges: true,
  whyFlagged: true,
  gemFinderMode: true,
  scoringV3: false,
  scoreVelocity: false,
  convictionBadge: false,
}
```

These are compile-time boolean flags for A/B-testing scoring features. They have nothing to do with Pro tier or user identity.

---

## 4. What Stripe + Clerk Implementation Requires

### Files to CREATE (new)

| # | File | Purpose | Complexity |
|---|------|---------|------------|
| 1 | `app/api/auth/webhook/route.ts` | Clerk webhook endpoint for user sync | Medium |
| 2 | `app/api/stripe/checkout/route.ts` | Creates Stripe Checkout session | Medium |
| 3 | `app/api/stripe/webhook/route.ts` | Handles Stripe events (subscription created/cancelled/updated) | High |
| 4 | `app/api/stripe/portal/route.ts` | Creates Stripe Customer Portal session (manage billing) | Low |
| 5 | `app/sign-in/[[...sign-in]]/page.tsx` | Clerk sign-in page | Low |
| 6 | `app/sign-up/[[...sign-up]]/page.tsx` | Clerk sign-up page | Low |
| 7 | `lib/stripe.ts` | Stripe client initialization + helpers | Low |
| 8 | `lib/subscription.ts` | Server-side subscription check: `isProUser(userId)` reads KV | Medium |
| 9 | `components/auth-button.tsx` | Navbar sign-in/user-menu button (replaces nothing -- nav currently has no auth) | Low |
| 10 | `components/upgrade-banner.tsx` | Reusable "Upgrade to Pro" CTA for gated sections | Low |
| 11 | `components/pro-gate.tsx` | Wrapper component: checks server-side Pro status, renders children or upgrade prompt | Medium |

### Files to MODIFY (existing)

| # | File | Change Required | Impact |
|---|------|----------------|--------|
| 1 | `package.json` | Add `@clerk/nextjs`, `stripe`, `@stripe/stripe-js` | Config |
| 2 | `proxy.ts` (middleware) | Add Clerk `clerkMiddleware()` wrapping, protect routes | High |
| 3 | `app/layout.tsx` | Wrap app in `<ClerkProvider>` | Low |
| 4 | `components/navbar.tsx` | Add `<AuthButton />` with `<SignedIn>`/`<SignedOut>` | Medium |
| 5 | `lib/use-pro.ts` | **DELETE entirely** or replace with server-aware hook that calls `/api/subscription/status` | Medium |
| 6 | `components/dev-pro-toggle.tsx` | **DELETE entirely** -- no more localStorage Pro toggle | Trivial |
| 7 | `app/pro/pro-content.tsx` | Replace waitlist form with Stripe checkout button; fix price from $29 to $24 | Medium |
| 8 | `app/signals/SignalsClient.tsx` | Replace `usePro()` with Clerk `useUser()` + subscription check | Medium |
| 9 | `app/research/alerts-tab.tsx` | Replace `usePro()` with Clerk `useUser()` + subscription check | Medium |
| 10 | `app/api/signal-outcomes/route.ts` | Add auth check: return limited data for free users, full data for Pro | High |
| 11 | `app/api/lead-time/recent/route.ts` | Add auth check: limit proof count for free users | High |
| 12 | `app/wallets/WalletsClient.tsx` | Replace `LockedFeatureCard` with `ProGate` that checks real subscription | Low (currently all locked anyway) |
| 13 | `app/alerts/AlertsClient.tsx` | Replace static mockup with real gated content when features exist | Low (currently all placeholder) |

### Vercel KV Keys Needed for Subscription Storage

```
# User -> Stripe mapping (set on Clerk webhook + Stripe webhook)
user:{clerkUserId}:stripe_customer_id    -> "cus_xxxxx"
user:{clerkUserId}:subscription_status   -> "active" | "past_due" | "cancelled" | "none"
user:{clerkUserId}:subscription_id       -> "sub_xxxxx"
user:{clerkUserId}:subscription_end      -> 1234567890 (Unix timestamp)
user:{clerkUserId}:plan                  -> "pro" | "free"

# Reverse lookup (Stripe -> Clerk user)
stripe:customer:{stripeCustomerId}:clerk_user_id -> "user_xxxxx"

# Existing key (keep, rename)
solrad:waitlist:emails                   -> Set of emails (already exists, keep for migration)
```

### Estimated Complexity by Phase

| Phase | Work | Estimate |
|-------|------|----------|
| **Phase 1: Auth (Clerk)** | Install Clerk, create sign-in/sign-up pages, add to middleware + layout + navbar, test login/logout flow | 4-6 hours |
| **Phase 2: Payments (Stripe)** | Create Stripe product/price, build checkout route, build webhook handler, build portal route, wire up Pro page CTA | 6-8 hours |
| **Phase 3: Server-Side Gating** | Build `isProUser()` in `lib/subscription.ts`, gate API routes, replace `usePro()` in 2 client components, add `ProGate` wrapper | 4-6 hours |
| **Phase 4: Testing + Polish** | End-to-end subscription flow, webhook signature verification, error states, downgrade handling, billing portal | 3-4 hours |
| **TOTAL** | | **17-24 hours of focused work** |

---

## 5. Pro Feature Status: Built vs. Needs Building

### BUILT and functional (could gate immediately)

| Feature | Page/Route | Status | Gating Effort |
|---------|-----------|--------|---------------|
| **Signal Outcomes (full table)** | `/signals` via `/api/signal-outcomes` | Works. Shows win/loss history for scored tokens. Currently shows 3 rows free, rest blurred. | Low -- already has UI gate, just needs server enforcement |
| **Alert Proofs (full feed)** | `/research` alerts tab via `/api/lead-time/recent` | Works. Shows real-time lead-time proofs. Currently shows limited count free. | Low -- already has UI gate, just needs server enforcement |
| **Watchlist (unlimited)** | `/watchlist` | Works. localStorage-based watchlist with live scores. | Medium -- could gate watchlist size (e.g., 5 free, unlimited Pro) |
| **Score Lab** | `/score-lab` | Works. Shows scoring model performance, win rates by tier. | Low -- could gate historical depth |
| **Tracker (Gem Scanner)** | `/tracker` | Works. Multi-window gem scanning with pre-qualified tokens. | Medium -- could gate time windows (e.g., free = 24h only, Pro = 1h/4h/6h/7d) |
| **Token Detail (deep view)** | `/token/[address]` | Works. Full scoring breakdown, lead-time history, metadata. | Low -- could gate scoring breakdown details |
| **Research / Proof Engine** | `/research` | Works. Append-only alpha ledger with CSV export. | Low -- could gate CSV export + full history |
| **Ad-free experience** | All pages with `AAdsRightRail` | Ads are embedded iframes via a-ads.com. | Low -- conditionally hide `<AAdsRightRail>` for Pro users |

### BUILT as placeholder only (no real functionality)

| Feature | Page | Status | Build Effort |
|---------|------|--------|-------------|
| **Smart Alerts** | `/alerts` | UI-only. Static list of 5 alert types all showing "Locked" + "Coming Soon". No backend, no notification system. | **HIGH** -- need full notification pipeline (Telegram bot, email, or push notifications + per-user alert config + trigger system) |
| **Wallet Intelligence** | `/wallets` | UI-only. 6 features all wrapped in `LockedFeatureCard`. No backend, no wallet tracking, no data pipeline. | **VERY HIGH** -- need Helius/Shyft wallet indexer integration, cluster detection algorithms, real-time monitoring |
| **Holder Quality Score** | Referenced on Pro page | Not implemented anywhere in scoring-v2.ts. Pro page lists it as a Pro feature. | **HIGH** -- need holder analysis data source + scoring algorithm |
| **Insider Risk Engine** | Referenced on Pro page | Not implemented. | **HIGH** -- need wallet cluster analysis + risk scoring |
| **Liquidity Rotation Detector** | Referenced on Pro page | Not implemented. | **HIGH** -- need liquidity pool monitoring across DEXes |

### NOT BUILT at all (Pro page promises, no code exists)

| Feature | Evidence |
|---------|----------|
| "Smart Flow Badge" | Listed in `pro-content.tsx` line 98. No component, no API, no scoring dimension exists. |
| "Early Signal Feed" | Listed in `pro-content.tsx` line 101. The alerts-tab shows lead-time proofs but there's no dedicated early-signal system. |
| "White-label dashboard" | Listed in Enterprise tier. Zero code. |
| "API access" | Listed in Enterprise tier. All API routes are public already (no auth). There's no rate-limited API key system. |

---

## 6. Minimum Viable Pro Tier (2-Week Launch Plan)

### Gate Only What Already Works

The fastest path to revenue is gating the 5 features that already function, behind real auth + real payments. Do NOT try to build Wallet Intelligence or Smart Alerts for v1 -- they need months of backend work.

### MVP Pro Feature Set

| Free Tier (keep generous) | Pro Tier ($24/month) |
|--------------------------|---------------------|
| Full token index + scoring | Everything in Free |
| 3 signal outcomes rows | **Unlimited signal outcomes** |
| 5 lead-time proof alerts | **Unlimited proof alerts** |
| 5-token watchlist | **Unlimited watchlist** |
| 24h tracker window only | **All tracker windows (1h/4h/6h/7d)** |
| Basic token detail | **Full scoring breakdown + lead-time history** |
| Ads shown | **Ad-free experience** |
| No CSV export | **CSV export from Research/Proof Engine** |

### 2-Week Sprint Plan

#### Week 1: Auth + Payments Foundation

| Day | Task | Deliverable |
|-----|------|-------------|
| Day 1-2 | **Install Clerk, build auth flow** | Sign-in/sign-up pages, ClerkProvider in layout, AuthButton in navbar, middleware protection |
| Day 3-4 | **Install Stripe, build checkout** | Stripe product + price created, checkout session API, webhook handler, KV subscription storage |
| Day 5 | **Build `isProUser()` + billing portal** | Server-side subscription check, customer portal for self-service billing management |

#### Week 2: Gating + Polish

| Day | Task | Deliverable |
|-----|------|-------------|
| Day 6-7 | **Gate API routes** | `/api/signal-outcomes` returns limited rows for free; `/api/lead-time/recent` returns limited proofs for free; tracker API limits windows |
| Day 8-9 | **Gate UI components** | Replace `usePro()` localStorage with real auth checks in SignalsClient, alerts-tab. Add ProGate wrapper. Hide ads for Pro. |
| Day 10 | **Update Pro page + test E2E** | Replace waitlist form with checkout button (keep waitlist as fallback). Fix price to $24. Full signup -> checkout -> Pro access test. |

### Environment Variables Needed

| Variable | Source | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard | Client-side Clerk |
| `CLERK_SECRET_KEY` | Clerk Dashboard | Server-side Clerk |
| `CLERK_WEBHOOK_SECRET` | Clerk Dashboard | Webhook verification |
| `STRIPE_SECRET_KEY` | Stripe Dashboard | Server-side Stripe |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard | Client-side Stripe (optional, for Elements) |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard | Webhook signature verification |
| `STRIPE_PRO_PRICE_ID` | Stripe Dashboard | The $24/month price ID |

### Existing Env Vars (Already Set, Needed)

| Variable | Used For |
|----------|---------|
| `KV_REST_API_URL` | Subscription status storage |
| `KV_REST_API_TOKEN` | Subscription status storage |

---

## 7. Current Revenue: Ads Only

The only current revenue source is **a-ads.com display ads**:

**File:** `components/ads/AAdsRightRail.tsx`

```typescript
<iframe
  data-aa={id}
  src={`https://acceptable.a-ads.com/${id}/?size=Adaptive`}
  ...
/>
```

These are crypto-focused display ads shown in the right rail of several pages. Revenue from these is likely minimal ($0-50/month at current traffic levels). Removing them for Pro users is a meaningful upgrade signal at near-zero cost.

---

## 8. Risk Assessment

### What Could Go Wrong

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Users gaming free tier limits (new accounts) | Medium | Rate limit signups by IP; require email verification via Clerk |
| Stripe webhook failures losing subscription state | Medium | Build idempotent webhook handler; add manual sync endpoint for ops |
| Existing "Pro" localStorage users expecting continued access | Low | No one is paying -- there are no real Pro users. Clean break. |
| Pro features not compelling enough at $24/month | High | Start with signal outcomes + proof alerts (these are genuinely unique). Iterate fast based on churn data. |
| Clerk + Stripe adding cold-start latency | Medium | Clerk Edge middleware is fast; Stripe calls are server-only |

### What Must NOT Ship

| Anti-pattern | Why | Current Status |
|-------------|-----|----------------|
| `?dev=1` Pro toggle | Any user can discover this URL param and get Pro for free | **EXISTS** -- `components/dev-pro-toggle.tsx` must be deleted or environment-gated to `NODE_ENV === 'development'` only |
| localStorage Pro flag | Trivially bypassable | **EXISTS** -- `lib/use-pro.ts` must be replaced entirely |
| Unprotected Pro API routes | Even with UI gating, data is accessible via curl | **EXISTS** -- all API routes return full data regardless of auth |
| $29 price on Pro page | Doesn't match stated $24 target | **EXISTS** -- `app/pro/pro-content.tsx` line 95 |

---

## Summary Decision Matrix

| Path | Time | Revenue Start | Risk |
|------|------|--------------|------|
| **A: Gate existing features with Clerk + Stripe** | 2 weeks | Immediate | Low -- features already work |
| **B: Build wallet intelligence first, then gate** | 2-3 months | Delayed | High -- complex backend, may never ship |
| **C: Keep waitlist, build more free features** | Ongoing | Never | You're burning money on hosting with zero path to revenue |

**Recommendation: Path A.** Gate what works today. The signal outcomes table and proof alerts feed are genuinely unique in the Solana ecosystem -- no competitor has verifiable lead-time proofs. That alone justifies $24/month for active traders. Ship auth + payments in 2 weeks, then use revenue to fund building wallet intelligence for Pro v2.
