# SOLRAD UX Audit Report -- Persona-Based Journey Analysis

**Generated:** 2026-02-21
**Auditor:** v0 Senior Engineer
**Site:** solrad.io

---

## Executive Summary

SOLRAD has a powerful data engine and a genuinely useful product underneath, but its UX creates significant friction for all three personas tested. The core problem: the site was built feature-out (engineering-first) rather than user-in (journey-first). The result is an interface that rewards power users who already know what everything means, while alienating newcomers and failing to convert potential paying customers.

| Metric | Finding |
|---|---|
| First-time visitor bounce risk | **HIGH** -- no hero, no explainer, dumps straight into a data terminal |
| Daily trader daily utility | **MEDIUM** -- good data, but missing personalization, keyboard shortcuts, saved views |
| Pro conversion path | **BROKEN** -- no payment system, localStorage-only gating, "Coming Soon" everywhere |
| Mobile experience | **GOOD structure** -- native app-like shell, but some content gaps |
| Trust signals | **WEAK** -- no user counts, no testimonials, proof engine is buried |
| Empty/error/loading states | **INCONSISTENT** -- some pages polished, many have bare spinners or nothing |

---

## PERSONA 1: First-Time Visitor via Google ("solana gem finder")

### Entry Point
Google search "solana gem finder" lands on `/solana-gem-finder` (the SEO page in the `(seo)` route group).

### What They See First
A proper SEO landing page with:
- Hero section with "Solana Gem Finder" H1
- Gem icon, clear value proposition
- Detailed FAQ section with JSON-LD schema
- CTAs linking to the main dashboard

**Verdict: This is the strongest entry point.** The SEO page does its job. The problem starts when they click through.

### The Journey Falls Apart at the Dashboard

When the user clicks "Start Scanning Now" or any CTA pointing to `/`, they land on the homepage which is a `"use client"` component with:

1. **No hero, no explanation, no onboarding.** The page immediately renders a data terminal with columns labeled "TRENDING", "ACTIVE", "NEW/EARLY", "SIGNALS". A first-time visitor has no context for what these mean or how the scoring works.

2. **960 lines of dense client-side code** rendering a multi-column terminal interface. There is no progressive disclosure -- everything is shown at once.

3. **Jargon overload.** Terms like "Signal State: STRONG", "Lead-Time Proof", "GEM Finder Mode", "Live Window Fallback" are scattered throughout with no inline definitions. Tooltips exist on some toggles but the user has to hover to find them.

4. **No clear "what to do next" CTA.** The user sees a grid of tokens with scores but has no idea what a "good" score is, what the badges mean, or what action to take.

### What Would Make Them Leave Immediately

| Issue | Component/File | Severity |
|---|---|---|
| No explanation of what SOLRAD is on the homepage | `/app/page.tsx` -- no hero section exists | CRITICAL |
| Scores shown without context (what is 78/100?) | `token-row-desktop.tsx`, `token-row-mobile.tsx` | HIGH |
| "Scanning for Early Signals..." warming state on first visit if cache is cold | `/app/page.tsx` lines 699-755 | HIGH |
| Cookie consent banner pops up immediately, adding visual noise | `/components/cookie-consent.tsx` | MEDIUM |
| Navbar says "COMING SOON" for Wallets, Alerts, Pro -- signals incompleteness | `/components/navbar.tsx` comingSoonItems array | HIGH |
| No social proof anywhere -- no user count, no testimonials, no "used by X traders" | Missing entirely | CRITICAL |

### What Would Make Them Bookmark It

| Feature | Status |
|---|---|
| A clear "here's what this tool does and how to use it" moment | MISSING on homepage. Exists on `/about`, `/learn`, `/scoring` but those are 2-3 clicks deep |
| Seeing a real token they recognize with useful data they can't get elsewhere | WORKS -- if tokens are loaded and not in warming state |
| The lead-time proof system (proving SOLRAD spotted tokens early) | EXISTS at `/research` but is completely buried -- not mentioned on homepage |
| The scoring explanation | EXISTS at `/scoring` but a first-time user won't navigate there |

### Specific Fix Recommendations

1. **Add a collapsible hero/intro banner to the homepage** that appears for new visitors (not in localStorage). 3 sentences: what SOLRAD is, what the score means, what to do. Dismissable.
   - File: `/app/page.tsx` -- add above the terminal grid
   - Priority: CRITICAL

2. **Add a score legend inline** -- a small "?" icon next to the first score display that opens a tooltip: "SOLRAD scores tokens 0-100 based on liquidity, volume, activity, and risk. 70+ = strong fundamentals."
   - File: `token-row-desktop.tsx`, `token-row-mobile.tsx`
   - Priority: HIGH

3. **Surface the Proof Engine on the homepage.** The `ProofPreviewRail` exists but is only shown at 2xl+ breakpoints (1536px+). Move a compact version into the main content area.
   - File: `/app/page.tsx` lines 933-937
   - Priority: HIGH

4. **Remove "COMING SOON" from the main navbar.** Move incomplete features to the footer or a roadmap page. "Coming Soon" in primary navigation signals "this product isn't ready."
   - File: `/components/navbar.tsx` -- `comingSoonItems` array
   - Priority: HIGH

---

## PERSONA 2: Daily Active Trader (Morning Routine)

### Entry Point
Direct navigation to `/` (bookmarked). Uses the site every morning to scan for opportunities.

### What They See First
The full desktop terminal: Navbar with LIVE indicator, MarketIntelTicker, stats bar (Volume, Avg Score, Liquidity, Tokens Tracked, SOL price), then the 4-column terminal with filter toggles.

### What Works Well

| Feature | Implementation | Verdict |
|---|---|---|
| Live data indicator with staleness detection | Navbar + DataFreshnessBar | GOOD |
| 4-column intelligence layout (Trending/Active/New/Signals) | `DesktopTerminal` component | GOOD |
| Per-column search, sort, and risk filters | `DesktopTerminal` local state | GOOD |
| Auto-refresh every 2 minutes | `page.tsx` useEffect interval | GOOD |
| Token detail drawer (click to expand) | `TokenDetailDrawer` | GOOD |
| Request deduplication for API calls | Module-level `inFlightFetch` guard | GOOD |
| Mobile app-like native experience | `MobileContainer` with bottom nav | GOOD |

### What Frustrates a Daily User

| Issue | Component/File | Severity |
|---|---|---|
| **No saved filter presets.** Every morning they re-enable GEM Finder, Lead-Time, Top Performers manually. State resets on every page load. | `/app/page.tsx` -- all filter state is `useState` with no persistence | HIGH |
| **No keyboard shortcuts.** Power traders expect `r` for refresh, `g` for gem mode, `/` to focus search, `1-4` to switch columns. | Missing entirely | MEDIUM |
| **Watchlist is localStorage-only** with no sync across devices. A trader using desktop at home and mobile on the go loses their list. | `/hooks/use-watchlist.ts` uses localStorage | HIGH |
| **No price alerts.** The Alerts page (`/alerts`) exists but is a "Coming Soon" stub via `AlertsClient`. | `/app/alerts/page.tsx` + `AlertsClient` | MEDIUM |
| **Token detail page (`/token/[address]`) is a full page navigation** that breaks the flow. Trader has to use browser back to return to their filtered dashboard state. | `/app/token/[address]/page.tsx` vs drawer in homepage | MEDIUM |
| **Force Refresh has 60s cooldown** but no visual countdown on the button itself (only shows in toast). | `/app/page.tsx` lines 265-306 | LOW |
| **No "last session" state.** If the browser crashes, all context is lost. | No session persistence | MEDIUM |
| **The left TokenIndex sidebar (xl+ only)** shows all tokens but uses the same `sortedAll` as the main grid -- it's redundant, not a different view. | `/app/page.tsx` line 541 | LOW |

### Mobile-Specific Issues for Daily Trader

| Issue | Component | Severity |
|---|---|---|
| Mobile header uses `<img>` instead of `next/image` for the logo | `/components/mobile-header.tsx` line 27: `<img src="/brand/icon-512.png" ...>` | MEDIUM |
| Bottom nav has 5 tabs but no visual badge for "new signals since last visit" | `/components/mobile-nav.tsx` | MEDIUM |
| Watchlist tab fetches `/api/index` as fallback if `allTokens` is empty -- potential duplicate fetch | `/components/mobile-tabs/watchlist-tab.tsx` lines 39-49 | LOW |
| No swipe gestures between tab sections (Radar/Proof/Watch/Learn/Filters) | `MobileContainer` uses conditional render not swipeable | LOW |

### Specific Fix Recommendations

1. **Persist filter state to localStorage.** Save `gemFinderMode`, `leadTimeOnly`, `topPerformersMode`, `signalWinnersMode` so they survive page refreshes.
   - File: `/app/page.tsx` -- add `useEffect` to save/restore filter state
   - Priority: HIGH

2. **Add keyboard shortcut handler.** Bind `r` = refresh, `g` = gem mode toggle, `/` = focus search, `Escape` = clear filters. Show a `?` shortcut overlay.
   - File: New component `keyboard-shortcuts.tsx` + integration in `page.tsx`
   - Priority: MEDIUM

3. **Show refresh countdown directly on the button** instead of relying on toast. When `refreshCooldown > 0`, show the seconds remaining as a badge or overlay on the Refresh button.
   - File: `/app/page.tsx` handleForceRefresh / button rendering
   - Priority: LOW

4. **Add "new signals since last visit" indicator on mobile.** Store `lastVisitTimestamp` in localStorage, compare against `freshSignals[0].lastUpdated`.
   - File: `/components/mobile-nav.tsx` -- add notification dot
   - Priority: MEDIUM

---

## PERSONA 3: Potential Pro Subscriber Evaluating $24/month

### Entry Point
Clicks "PRO" link from the dashboard status bar (`/app/page.tsx` line 688) or navbar "COMING SOON" dropdown.

### What They See on the Pro Page

The Pro page (`/app/pro/page.tsx`) is a Server Component that renders `<ProContent />` -- but **this component file does not exist** (`/components/pro-content.tsx` returns "This file does not currently exist"). This means:

**The Pro page is likely broken or renders nothing beyond the JSON-LD scripts.**

Additionally, there's a `<DevProToggle />` component that is only visible when `?dev=1` is in the URL. This component sets `localStorage.setItem("solrad_pro", "true")` to toggle Pro status.

### The Pro System is Completely Hollow

| Finding | Evidence | Severity |
|---|---|---|
| **No payment integration.** Zero Stripe references in the entire codebase. | `grep stripe` = 0 results across all files | CRITICAL |
| **No user authentication.** Zero NextAuth/Clerk/auth.js references. | `grep NextAuth\|Clerk` = 0 results | CRITICAL |
| **Pro status is a localStorage boolean.** `usePro()` reads `localStorage.getItem("solrad_pro")` | `/lib/use-pro.ts` -- entire implementation is 20 lines | CRITICAL |
| **No server-side Pro enforcement.** API routes do not check Pro status. Any "Pro-only" features are UI-gated only. | No auth middleware, no Pro checks in `/app/api/**` | CRITICAL |
| **Dev toggle allows anyone to enable Pro** by adding `?dev=1` to the URL. | `/components/dev-pro-toggle.tsx` -- checks `window.location.search.includes("dev=1")` | CRITICAL |
| **Pro page component is missing.** `pro-content.tsx` does not exist. | File system check | CRITICAL |

### What a Potential Subscriber Sees

1. They click "PRO" and land on a page that either:
   - Shows nothing (missing component)
   - Shows a "Coming Soon" teaser (if there's a fallback)
2. They see features listed as "Coming Soon" across the site (Wallets, Alerts, Pro itself)
3. They see zero pricing, zero comparison table, zero testimonials
4. There is no way to pay, no way to sign up, no way to create an account

### Trust Signals Audit

| Trust Signal | Present? | Location |
|---|---|---|
| User count / active traders metric | NO | - |
| Testimonials or reviews | NO | - |
| Track record / win rate stats | PARTIALLY -- Proof Engine at `/research` but requires navigation | Buried |
| Team / company information | MINIMAL -- "SOLRAD Team" in metadata, `/about` page exists | Weak |
| Security assurances | YES -- "Read-only, no wallet required" appears in footer and modals | Good |
| External validation (press, partners) | NO | - |
| Uptime / reliability metrics | NO | - |
| Open-source / transparency claims | NO | - |

### What Would Make Them Pay

1. **A working payment system** (obviously)
2. **A comparison table:** Free vs Pro with specific feature differences
3. **A trial or demo** of Pro features (time-limited, not localStorage toggle)
4. **Social proof:** "X traders use SOLRAD daily" or "SOLRAD spotted Y token Z hours before it pumped"
5. **The Proof Engine front and center** -- this is the most compelling trust signal and it's buried on a subpage

### Specific Fix Recommendations

1. **Create the Pro page content.** At minimum: feature comparison table, waitlist email capture form, and clear messaging about what Pro includes and when it launches.
   - File: Create `/components/pro-content.tsx`
   - Priority: CRITICAL

2. **Remove the DevProToggle from production** or add proper environment check. Currently anyone can enable Pro with `?dev=1`.
   - File: `/components/dev-pro-toggle.tsx` -- wrap in `process.env.NODE_ENV === "development"` check
   - Priority: CRITICAL

3. **Add Stripe integration** or at minimum a waitlist capture with email validation before advertising a $24/month price point.
   - Priority: CRITICAL (for monetization)

4. **Surface the Proof Engine data on the Pro page** as evidence of SOLRAD's value. "Our engine spotted X gems early -- here's the proof."
   - Priority: HIGH

---

## CROSS-CUTTING UI/UX ISSUES

### 1. Information Hierarchy Problems

| Problem | Where | Recommendation |
|---|---|---|
| Homepage dumps all data at once with no progressive disclosure | `/app/page.tsx` | Add collapsible sections, "show more" patterns, or tabbed views on first visit |
| Stats bar shows 5 metrics but Volume and Liquidity aren't labeled with "$" context | Homepage stats grid (lines 607-658) | Add "Total" prefix: "TOTAL VOL 24H" |
| Token rows show score, price, volume, liquidity, badges all at the same font weight | `token-row-desktop.tsx` | Make score the visually dominant element (larger, colored), demote secondary metrics |
| The "LIVE" indicator and "Xm ago" timestamp appear in 3+ places on desktop (navbar, status bar, Intel ticker) | Navbar, status strip, column headers | Consolidate to one authoritative location |

### 2. Navigation Confusion

| Issue | Details |
|---|---|
| **Navbar has 6 items + a "COMING SOON" dropdown** = 9 total navigation targets. This is too many. | Items: DASHBOARD, TOKEN POOL, SIGNAL OUTCOMES, TOP PERFORMERS, PROOF ENGINE, HOW SCORING WORKS + WALLETS, ALERTS, PRO |
| **"TOKEN POOL" vs homepage "Token Pool"** -- The `/browse` page is called "Token Pool" but shows tokens scoring 50+, while the homepage shows all tokens. The distinction is unclear. | `/app/browse/page.tsx` header says "Token Pool" but navbar says "TOKEN POOL" which a user might assume is the same view |
| **"PROOF ENGINE" vs "Research"** -- navbar says "PROOF ENGINE" linking to `/research`, but the page title says "SOLRAD Proof Engine -- Alpha Ledger". Footer says "Research". Three different names for one page. | Navbar, `/app/research/page.tsx`, footer |
| **"HOW SCORING WORKS" is a full navbar item** -- this is educational content, not a primary feature. It belongs in the footer or a help section, not primary nav. | `/components/navbar.tsx` navItems array |
| **Mobile bottom nav has different items than desktop nav.** Mobile: Radar, Proof, Watch, Learn, Filters. Desktop: Dashboard, Token Pool, Signal Outcomes, Top Performers, Proof Engine, Scoring. These are completely different mental models. | `/components/mobile-nav.tsx` vs `/components/navbar.tsx` |
| **Footer has 14 links on desktop** in a single row. Several link to pages not in the navbar (Infrastructure, Disclaimer, Contact, Score Lab, Lead-Time). | `/components/footer.tsx` |
| **The `/watchlist` page exists** but is separate from the mobile Watchlist tab. Desktop users have to navigate to a separate page; mobile users have it in a tab. Inconsistent. | `/app/watchlist/page.tsx` vs `/components/mobile-tabs/watchlist-tab.tsx` |

### 3. Missing or Weak Trust Signals

| Signal | Current State | Recommendation |
|---|---|---|
| "Read-only, no wallet required" | Appears in footer + Security modal | GOOD -- but should be above the fold on homepage |
| Data source attribution | Footer says "Sources: QuickNode RPC + DexScreener" | Should be visible on the dashboard, not just footer |
| Signal track record | `/research` page with Proof Engine | Move key stats (win rate, avg lead time) to homepage |
| Error transparency | Stale data indicator exists | GOOD |
| Team identity | "SOLRAD Team" in metadata only | Add team section to About page with real names/handles |

### 4. Load State / Empty State / Error State Handling

| Page/Component | Loading State | Empty State | Error State |
|---|---|---|---|
| Homepage (`/app/page.tsx`) | Spinner (line 758) + Warming screen (line 699) | "No tokens match criteria" with filter reset (line 761) | Falls back to `/api/tokens`, then shows warming | 
| `/browse` | Has `loading.tsx` | Server-rendered, returns empty array | Server `try/catch`, falls back to empty array |
| `/tracker` | `loading` state with manual spinner | Not handled -- empty `metrics` array renders nothing | Console.error only, sets empty arrays |
| `/signals` | Delegated to `SignalsClient` | Unknown -- client component | Unknown |
| `/token/[address]` | No loading state (RSC) | `NotTrackedPageComponent` for unfound tokens | Redirects to `/` on invalid mint |
| `/research` | No explicit loading | Relies on `loadAllResearchReports` returning empty | Server-side try/catch |
| `/alerts` | "Coming Soon" stub | N/A | N/A |
| `/wallets` | "Coming Soon" stub | N/A | N/A |
| `/pro` | Missing component | N/A | Likely renders empty |

**Global findings:**
- Only 6 routes have `loading.tsx` files out of 53 total pages
- Only 1 route has an `error.tsx` boundary (admin/intel)
- The root `app/not-found.tsx` exists (good) but no per-section not-found handling
- Zero `Suspense` boundaries in the entire codebase

### 5. Dark Patterns / Confusing Interactions

| Issue | Details | Severity |
|---|---|---|
| **DevProToggle accessible in production** via `?dev=1` URL param. Any user could discover this and "unlock" Pro features. | `/components/dev-pro-toggle.tsx` | HIGH |
| **"Force Refresh" button with hidden cooldown.** User clicks, gets a toast saying "wait 60 seconds" but the button doesn't visually indicate it's in cooldown. | `/app/page.tsx` handleForceRefresh | MEDIUM |
| **Cookie consent "Got it" button** implies acceptance but there's no "decline" option. GDPR requires reject option. | `/components/cookie-consent.tsx` | MEDIUM |
| **Navbar admin login button at 10% opacity** (`opacity-10 hover:opacity-100`). This is fine for hiding admin access but could confuse users who accidentally hover over it. | `/components/navbar.tsx` line with `opacity-10` | LOW |

### 6. Mobile Experience Gaps

| Gap | Details |
|---|---|
| **Logo uses raw `<img>` tag** instead of `next/image` on mobile header, bypassing optimization | `/components/mobile-header.tsx` line 27 |
| **No pull-to-refresh gesture** on mobile despite being an app-like experience | `MobileContainer` -- standard web behavior |
| **Safe area handling is inline styles** rather than Tailwind classes | `MobileContainer` lines 69-70 use `style={{ paddingTop: "calc(3rem + env(safe-area-inset-top))" }}` |
| **No haptic feedback** on key interactions (star/unstar, refresh) | Standard web limitation but could use Vibration API |
| **Bottom nav "Filters" tab** is a separate screen rather than a sheet/drawer, breaking the mental model of "I'm filtering my current view" | `FiltersTab` is a full tab swap, not an overlay |

---

## PRIORITIZED ISSUE LIST

### CRITICAL (Blocks core business goals)

| # | Issue | File(s) | Impact |
|---|---|---|---|
| 1 | Pro page component is missing -- page likely renders empty | `/components/pro-content.tsx` (missing) | Breaks monetization funnel entirely |
| 2 | Zero payment integration -- no way to charge $24/month | Entire codebase | No revenue possible |
| 3 | Zero user authentication -- no accounts, no sessions | Entire codebase | Cannot tie subscriptions to users |
| 4 | Pro status is localStorage toggle -- no server enforcement | `/lib/use-pro.ts` | Any user can self-grant Pro |
| 5 | DevProToggle accessible in production via `?dev=1` | `/components/dev-pro-toggle.tsx` | Security hole |
| 6 | Homepage has zero onboarding for new visitors | `/app/page.tsx` | High bounce rate from organic traffic |
| 7 | No social proof anywhere on the site | Missing | Severely undermines conversion |

### HIGH (Degrades experience for target users)

| # | Issue | File(s) |
|---|---|---|
| 8 | Navbar "COMING SOON" signals unfinished product | `/components/navbar.tsx` |
| 9 | Filter state not persisted across sessions | `/app/page.tsx` |
| 10 | Watchlist localStorage-only, no cross-device sync | `/hooks/use-watchlist.ts` |
| 11 | Proof Engine buried on subpage, not surfaced on homepage | `/app/page.tsx`, `/app/research/page.tsx` |
| 12 | Mobile/desktop nav use completely different item sets | `/components/mobile-nav.tsx` vs `navbar.tsx` |
| 13 | Score meaning not explained inline on first encounter | `token-row-desktop.tsx` |
| 14 | Cookie consent has no "decline" option (GDPR risk) | `/components/cookie-consent.tsx` |
| 15 | Tracker page has no metadata export (is "use client") | `/app/tracker/page.tsx` |

### MEDIUM (Noticeable friction)

| # | Issue | File(s) |
|---|---|---|
| 16 | No keyboard shortcuts for power users | Missing |
| 17 | Mobile header uses `<img>` instead of `next/image` | `/components/mobile-header.tsx` |
| 18 | "PROOF ENGINE" / "Research" / "Alpha Ledger" naming inconsistency | Navbar, research page, footer |
| 19 | No "new since last visit" indicator on mobile | `/components/mobile-nav.tsx` |
| 20 | Refresh cooldown not visible on button UI | `/app/page.tsx` |
| 21 | 14+ footer links create visual noise | `/components/footer.tsx` |
| 22 | 0 Suspense boundaries in entire codebase | All async components |
| 23 | Only 1 error boundary in entire codebase | `app/admin/intel/error.tsx` only |

### LOW (Minor polish)

| # | Issue | File(s) |
|---|---|---|
| 24 | "HOW SCORING WORKS" takes primary nav space | `/components/navbar.tsx` |
| 25 | LIVE indicator appears 3+ times on desktop | Navbar, status bar, columns |
| 26 | Mobile safe area uses inline styles | `/components/mobile-container.tsx` |
| 27 | TokenIndex sidebar is redundant with main grid | `/app/page.tsx` line 541 |
| 28 | Admin login button at 10% opacity confusing on accidental hover | `/components/navbar.tsx` |

---

## QUICK WINS (Under 30 minutes each)

1. **Gate DevProToggle behind NODE_ENV check** -- Add `if (process.env.NODE_ENV !== "development") return null` at top of component. 2 minutes.

2. **Replace `<img>` with `<Image>` in mobile header** -- Change line 27 in `mobile-header.tsx`. 5 minutes.

3. **Add "decline" option to cookie consent** -- Add a "Decline" button next to "Got it" that sets `localStorage.setItem(CONSENT_KEY, "declined")`. 10 minutes.

4. **Persist filter toggles in localStorage** -- In `page.tsx`, add `useEffect` to save `gemFinderMode`, `leadTimeOnly`, `topPerformersMode`, `signalWinnersMode` to localStorage on change, and read them on mount. 15 minutes.

5. **Rename "COMING SOON" dropdown** to "ROADMAP" and move it out of the primary nav into a footer link or a dropdown under a settings/info icon. 15 minutes.

6. **Consolidate page naming** -- Rename "PROOF ENGINE" to "Research" everywhere, or "Research" to "Proof Engine" everywhere. Pick one. 10 minutes.

7. **Add score tooltip on first token row** -- On the first token rendered, add a one-time tooltip: "SOLRAD Score: 0-100 composite of liquidity, volume, activity, and risk." 20 minutes.

8. **Add visible refresh cooldown** -- When `refreshCooldown > 0`, show it as a badge on the Refresh button: `REFRESH (42s)`. 10 minutes.

9. **Add basic homepage social proof** -- Hardcode a single line below the stats bar: "Tracking X tokens across Solana. Powered by QuickNode + DexScreener." Uses data already in `stats.tokensTracked`. 10 minutes.

10. **Create minimal ProContent component** -- Even a "Join the waitlist" page with an email input and feature list is better than a missing component. 25 minutes.
