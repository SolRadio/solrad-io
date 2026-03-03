# SOLRAD Mobile UX Audit
**Date:** February 25, 2026
**Auditor:** SOLRAD Engineering
**Scope:** Full application mobile audit -- 390px (iPhone 14) primary target

## Executive Summary
Overall mobile health score: **6/10**. The app has a dedicated mobile component system (MobileContainer, MobileHeader, MobileNav, RadarTab with virtualized lists, TokenRowMobile) that provides a functional trading experience on small screens. The biggest win is the RadarTab with TanStack Virtual, which handles large token lists without scroll jank. The biggest problem is that several secondary pages (Signal Outcomes, Top Performers, Proof Engine) use desktop `<Table>` layouts with no mobile adaptation, causing severe horizontal overflow and unreadable data at 390px.

## Screen-by-Screen Audit

### 1. Dashboard / Token Table
**Current State:** HomeClient renders a full `MobileTerminal` for `<md` breakpoint (line 885: `block md:hidden`) with tabbed sections (Trending/Active/New), search, sort, risk filters, and a dedicated `MobileContainer` system with `MobileHeader`, `MobileNav`, and `RadarTab`. RadarTab uses `@tanstack/react-virtual` for performant list rendering. TokenRowMobile is a compact card layout with rank, 32px avatar, symbol, signal state, price, change, vol/liq (hidden below 400px), lead-time badge, score pill, and action buttons.

**Mobile Score:** 7/10

**Issues Found:**
- CRITICAL: Two separate mobile paths exist -- `MobileTerminal` (rendered at line 885) AND `MobileContainer` (imported but rendered separately at a different breakpoint). This creates confusion about which mobile experience the user actually sees. The `MobileContainer` has the full 5-tab bottom nav (RADAR/PROOF/WATCH/LEARN/FILTERS) while `MobileTerminal` has its own 3-tab UI (Trending/Active/New). Users likely see `MobileTerminal` since it's inside the main render at `block md:hidden`, meaning the full `MobileContainer` with PROOF/WATCH/LEARN tabs may be unreachable from the main dashboard.
- HIGH: The filter toggles row (Watchlist, GEM FINDER, LEAD-TIME, TOP PERF, SIGNALS) at lines 896-970 is NOT inside the `md:hidden` block -- it renders BELOW the `MobileTerminal` on mobile, causing a duplicate controls section that scrolls off-screen. These `flex items-center flex-wrap gap-2` toggles are tiny switches with 10px labels that are hard to tap.
- HIGH: The stats grid (VOL 24H, AVG SCORE, LIQUIDITY, TRACKED, SOL) at line 670 uses `hidden md:grid md:grid-cols-5` -- completely invisible on mobile. Mobile users have no access to aggregate market stats from the dashboard.
- MEDIUM: `MobileTerminal` search input at `h-10` is fine for touch, but the risk filter chips have `min-h-[44px]` explicitly set -- good. However the sort `<Select>` at `w-[110px] h-8` is slightly below the 44px Apple HIG target.
- LOW: The `WelcomePanel` and `HeroOverlay` session-gated overlays may add visual clutter on first mobile visit.

**What Works Well:**
- RadarTab's virtualized list handles 100+ tokens smoothly at 52px estimated row height
- TokenRowMobile card design is clean: 32x32 avatar, truncated symbol, price, change, score pill all readable at 390px
- Market snapshot ticker in RadarTab (`Vol | Liq | Tkns | Avg`) is horizontally scrollable and compact
- Section tabs (FRESH/TREND/ACTIVE/NEW) with counts provide fast category switching
- Search + Gem Finder toggle row is well-composed with good density

**Recommended Fixes:**
- Unify the mobile rendering path: either use MobileContainer exclusively (with its 5-tab system) or MobileTerminal exclusively, not both
- Move the filter toggles row inside the md:hidden block or integrate into MobileTerminal's sticky controls
- Add a compact stats row to MobileHeader or RadarTab's market snapshot ticker

### 2. Token Detail Drawer
**Current State:** Uses `<Sheet>` (shadcn) with `side="right"` and `w-full sm:max-w-xl`. Content has `px-4 sm:px-6` padding. Header shows 56x56 avatar, symbol (text-2xl), name, address, and source badges. Key metrics strip uses `grid grid-cols-5` with PRICE/24H/LIQ/VOL/SCORE. Below: links section, scoring factors accordion, holder data, sparkline chart, lead-time proofs, AI intel panel. Bottom has safe-area padding via `pb-[calc(env(safe-area-inset-bottom)+6rem)]`.

**Mobile Score:** 6/10

**Issues Found:**
- HIGH: `grid grid-cols-5` metrics strip at 390px width = ~78px per cell. With `px-2` padding, each cell has ~58px of content width. The 9px labels and 14px values work, but "PRICE" values like `$0.000042` (8 chars) will overflow their cell at smaller font sizes. No `overflow-hidden` or `truncate` on metric values.
- HIGH: The links section renders Solscan, DexScreener, Birdeye, Jupiter, Photon, Share, and Copy buttons as `flex flex-wrap gap-2`. At 390px, this creates 2-3 rows of buttons that push the scoring breakdown far down -- users must scroll significantly to see the SOLRAD score breakdown.
- MEDIUM: Scoring factors use `<Accordion>` with progress bars. The accordion trigger text is readable but the sub-detail description text is tiny and dense. Each factor's visual bar is clear.
- MEDIUM: `SheetContent` scrolls via its own overflow, but the `flex-1 overflow-y-auto` div with `thin-scrollbar` CSS class may not be visible on mobile (custom scrollbar styling often invisible on iOS).
- LOW: The address copy button at `text-[11px]` with `slice(0, 6)...slice(-4)` is fine but the hit target is text-only with no padding -- hard to tap precisely.

**What Works Well:**
- Full-width drawer on mobile means no wasted space
- Safe-area bottom padding prevents content from being hidden behind home indicator
- Live price polling (useFreshQuote at 45s intervals) keeps data current while drawer is open
- Sparkline chart and score breakdown give thorough analysis
- WatchlistButton and Share are accessible within the drawer

**Recommended Fixes:**
- Add `truncate` or `text-ellipsis overflow-hidden` to metric values in the 5-column grid
- Consider reducing to `grid-cols-3` on mobile (PRICE/24H/SCORE as primary row, LIQ/VOL below)
- Add `min-h-[44px] min-w-[44px]` to the address copy button
- Move critical actions (DexScreener, Trade) above the fold on mobile

### 3. Pro Hub
**Current State:** `ProHubClient` is a terminal-themed page (`bg-[#0a0a0a] font-mono`) with a scanline overlay, max-width 900px centered, and padding `px-4 py-8`. It fetches from `/api/score-lab`, `/api/score-velocity`, and `/api/alpha-ledger`. Contains: pulse metrics bar, quick access cards (6 items), score surge horizontal scroller, recent movers horizontal scroller, roadmap section.

**Mobile Score:** 7/10

**Issues Found:**
- MEDIUM: `max-w-[900px] mx-auto px-4` works at 390px but gives only 358px of content width. The pulse metrics bar likely uses a horizontal flex layout that may wrap awkwardly.
- MEDIUM: Quick access cards grid is not explicitly responsive -- if it uses a fixed column count, cards may be too narrow on mobile.
- MEDIUM: Score surge and movers horizontal scrollers (`overflow-x-auto`) use ref-based scroll buttons (`scrollBy({ left: 200 })`) but these chevron buttons may be small and easy to miss on mobile. The scroll container itself should be swipeable, which it is via native overflow scroll.
- LOW: The scanline overlay (`position: fixed inset-0`) is purely cosmetic but adds a full-screen pseudo-element that could affect touch event propagation on some devices.

**What Works Well:**
- Compact data density appropriate for a "command center" feel
- Clock and last-snapshot-ago provide temporal awareness
- Horizontal scrollers are a good mobile pattern for dense data

**Recommended Fixes:**
- Ensure quick access cards use `grid-cols-2` on mobile for comfortable tap targets
- Increase chevron scroll button sizes to 44x44px
- Add `snap-x snap-mandatory` to horizontal scrollers for better mobile swipe UX

### 4. Navigation
**Current State:** Two navigation systems: (1) `<Navbar>` component used across all pages -- desktop has full nav tabs, mobile has hamburger menu + centered logo + right actions. (2) `<MobileNav>` fixed bottom tab bar with 5 tabs (RADAR/PROOF/WATCH/LEARN/FILTERS) used only inside `MobileContainer`.

**Mobile Score:** 5/10

**Issues Found:**
- CRITICAL: `MobileNav` has `md:hidden` class but is only rendered inside `MobileContainer`. If the user is on the main dashboard and sees `MobileTerminal` instead, they have NO bottom nav. The only navigation is the hamburger menu in `<Navbar>`, which opens a `<Sheet>` from the RIGHT side (`side="right"`) with full-width nav items.
- HIGH: The `<Navbar>` mobile hamburger menu renders the full page navigation (DASHBOARD, TOKEN POOL, SIGNAL OUTCOMES, TOP PERFORMERS, PROOF ENGINE) plus roadmap items and a REFRESH button. However, there is no way to reach the mobile-specific tabs (PROOF, WATCH, LEARN, FILTERS) from the hamburger menu -- these are MobileContainer-exclusive.
- HIGH: On the mobile navbar, the center logo uses `absolute left-1/2 -translate-x-1/2` with `w-40` (160px image). At 390px, with 80px left and 100px right containers, the 160px logo may cause overlap. The logo image `w-40` is very large for a 390px viewport.
- MEDIUM: The right actions container on mobile (`w-[100px]`) contains SignIn/UserButton + Admin shield button + ThemeToggle. That's 3-4 buttons at h-9 w-9 (36px) each with `gap-1` = ~148px needed, overflowing the 100px container.
- LOW: The ADMIN shield button is `opacity-10 hover:opacity-100` -- invisible on mobile where there's no hover state. Only discoverable by accident.

**What Works Well:**
- Hamburger sheet is right-aligned (thumb-friendly for right-handed users)
- Mobile menu items are full-width buttons with icons -- good tap targets
- Safe-area padding on sheet content (`pb-[calc(env(safe-area-inset-bottom)+1rem)]`)
- Roadmap items with "SOON" badges are informative

**Recommended Fixes:**
- Reduce logo `w-40` to `w-28` or `w-24` on mobile to prevent overlap
- Cap the right actions to 2 buttons max on mobile (Auth + Theme, hide Admin)
- Either integrate MobileNav into the Navbar for all mobile screens, or ensure MobileContainer is the only mobile render path
- Add `overflow-hidden` to the navbar mobile container to prevent layout shifts

### 5. Signal Outcomes / Alpha Ledger / Top Performers

#### Signal Outcomes (`/signals`)
**Current State:** `SignalsClient` renders a standard `<Table>` (shadcn) with columns: Token, Type, Detected, Price @ Signal, Price Now, 24h Change, Score @ Signal, Score Now, Risk, Liquidity. No mobile-specific layout.

**Mobile Score:** 3/10

**Issues Found:**
- CRITICAL: A 10-column `<Table>` at 390px is completely unusable. Horizontal scroll is required but the table is inside a `rounded-xl border bg-card/50` container that likely doesn't have `overflow-x-auto`. Users will see truncated or overlapping content.
- CRITICAL: Table headers are `text-xs uppercase font-bold` with no `whitespace-nowrap` -- "Price @ Signal" and "Price Now" will wrap or overlap.
- HIGH: No mobile card layout alternative exists. Desktop table rows render identically at all widths.
- MEDIUM: The page uses `<Navbar>` + `<Footer>` wrapper, which is fine, but the footer (`hidden xl:flex` for desktop bar) shows a stacked mobile version that's reasonable.

**What Works Well:**
- Data content is comprehensive and well-labeled
- Token image + symbol display is compact

**Recommended Fixes:**
- Add `overflow-x-auto` to the table container as an immediate fix
- Build a mobile card layout (`md:hidden`) showing Token, Score Delta, and 24h Change as primary info
- Consider a horizontally scrollable card carousel for mobile

#### Top Performers (`/tracker`)
**Current State:** `TrackerClient` uses a grid/list/sparks view mode toggle. Grid mode likely renders token cards, list mode renders a table. Has time window tabs (1h/4h/6h/24h/7d) using shadcn `<Tabs>`.

**Mobile Score:** 5/10

**Issues Found:**
- HIGH: The view mode toggle and time window tabs likely stack awkwardly on mobile if they're in a horizontal flex row
- MEDIUM: Grid view with cards should work reasonably at 390px if cards are full-width, but may have density issues
- LOW: Copy-mint functionality uses a small icon button

**What Works Well:**
- Multiple view modes give users a choice of information density
- Time window selection is a familiar tab pattern

**Recommended Fixes:**
- Ensure grid cards are `grid-cols-1` on mobile, `grid-cols-2` on tablet
- Make time window tabs horizontally scrollable if they overflow

#### Proof Engine (`/research`)
**Current State:** `ResearchClient` has 17 instances of `hidden md:` or `md:hidden` responsive classes, indicating significant mobile adaptation work has been done. Uses a tabbed interface.

**Mobile Score:** 6/10

**Issues Found:**
- MEDIUM: 17 responsive class instances suggest a mix-and-match approach rather than a cohesive mobile layout
- LOW: Alert tab uses 2 responsive classes, suggesting basic adaptation

**What Works Well:**
- Extensive responsive class usage shows awareness of mobile needs
- Tabbed interface works well on mobile

**Recommended Fixes:**
- Audit the 17 responsive breakpoints for consistency

## The 3 Core Trader Journeys on Mobile

### Journey 1: Find a winner fast
1. Open app on iPhone 14 (390px) -- see MobileTerminal inside HomeClient
2. Default tab is "Trending" with tokens sorted by score
3. Scan the list: each row shows symbol, signal state, price, change, score pill
4. Identify highest-scoring token by the green score pill (80+)
5. **Time estimate: 3-5 seconds** (excellent)
6. **Friction points:** None significant -- the default view is well-optimized for this journey
7. **Where they'd give up:** If MobileContainer renders instead of MobileTerminal, the RadarTab defaults to "FRESH" signals tab which may be empty, requiring a tab switch

### Journey 2: Evaluate a token before trading
1. Tap a token row -- TokenDetailDrawer slides in from right (full width on mobile)
2. See symbol, name, price, 24h change at top
3. Scroll down to see 5-column metrics strip (PRICE/24H/LIQ/VOL/SCORE)
4. Continue scrolling: links section, scoring breakdown accordion, holder concentration
5. Hit "Trade on Jupiter" or DexScreener link to execute
6. **Time estimate: 8-12 seconds** to evaluate, 15-20 seconds to reach trade link
7. **What data is missing or hard to read:** Holder concentration data loads separately (2nd fetch). The 5-column metrics strip values may truncate. The trade link is below the fold after the scoring accordion.
8. **Friction points:** Significant scrolling required to reach actionable links. The links section (Solscan, DexScreener, Birdeye, Jupiter, Photon, Share, Copy) creates 2-3 rows of buttons that push critical data down.

### Journey 3: Check yesterday's proof
1. Open app -- see dashboard
2. Need to navigate to Proof Engine (/research) or Signal Outcomes (/signals)
3. Tap hamburger menu (top-left)
4. Sheet opens from RIGHT -- find "SIGNAL OUTCOMES" or "PROOF ENGINE" in nav list
5. Tap to navigate
6. See a desktop `<Table>` layout that's 10+ columns wide
7. **Time estimate: 5 seconds to navigate, then frustration**
8. **Can they even find it?** Yes, via hamburger menu. But the PROOF tab in MobileNav is only available inside MobileContainer, which may not be the active mobile component.
9. **Friction points:** The proof/signal pages are desktop-optimized tables that are unusable at 390px. A trader would likely give up trying to read the data and close the tab.

## Priority Fix List

| Priority | Fix | Impact | Effort | File to Edit |
|----------|-----|--------|--------|--------------|
| P0 | Unify mobile render: use MobileContainer exclusively OR integrate MobileNav into Navbar | HIGH | MED | `app/HomeClient.tsx`, `components/navbar.tsx` |
| P0 | Add `overflow-x-auto` to SignalsClient table container | HIGH | LOW | `app/signals/SignalsClient.tsx` |
| P0 | Build mobile card layout for Signal Outcomes table | HIGH | MED | `app/signals/SignalsClient.tsx` |
| P1 | Fix navbar logo overlap: reduce `w-40` to `w-24` on mobile | HIGH | LOW | `components/navbar.tsx` |
| P1 | Fix navbar right actions overflow: cap at 2 buttons on mobile | HIGH | LOW | `components/navbar.tsx` |
| P1 | Reduce token detail drawer metrics from 5-col to 3-col on mobile | MED | LOW | `components/token-detail-drawer.tsx` |
| P1 | Move Trade/DexScreener link above the fold in drawer on mobile | MED | LOW | `components/token-detail-drawer.tsx` |
| P2 | Add aggregate stats to MobileHeader or RadarTab | MED | LOW | `components/mobile-header.tsx` |
| P2 | Ensure TrackerClient grid is `grid-cols-1` on mobile | MED | LOW | `app/tracker/TrackerClient.tsx` |
| P2 | Remove filter toggles rendering outside md:hidden block | MED | LOW | `app/HomeClient.tsx` |

## Mobile-First Feature Recommendations

- **Swipe-to-trade on token rows:** A left-swipe gesture on TokenRowMobile that reveals a "TRADE" button linking directly to Jupiter/Photon would reduce the journey from tap > drawer > scroll > trade to swipe > trade (2 taps vs 4+ taps). Critical for mobile traders who need speed.
- **Pull-to-refresh on token list:** The RadarTab uses a standard overflow scroll. Adding native pull-to-refresh feedback (already have `onRefresh` prop) would make refresh feel native on iOS/Android.
- **Sticky score badge on drawer scroll:** When scrolling the token detail drawer, the SOLRAD score disappears above the fold. A sticky mini-header showing `$SYMBOL 82.1/100` would keep the key metric visible.
- **Mobile-optimized Signal Outcomes cards:** Replace the 10-column table with a swipeable card view showing Token + Score Delta + Price Change as the primary card, with a "flip" gesture or expand to see full details.
- **Quick-trade bottom bar in drawer:** A fixed bottom bar in the token detail drawer with "COPY CA" and "TRADE ON JUPITER" buttons would eliminate scrolling to find the trade action. This is the single highest-impact mobile UX improvement.
- **Haptic feedback on watchlist toggle:** Mobile traders using the watchlist star button get no tactile feedback. Adding `navigator.vibrate(10)` on toggle would confirm the action.
- **Score alert push notifications:** Mobile traders can't currently set alerts. A "Notify me if score crosses X" button on the token drawer would be high-value for mobile users who check periodically.

## Component Inventory

| Component | Has Mobile Styles | Touch Friendly | Readable at 390px | Notes |
|-----------|------------------|----------------|-------------------|-------|
| MobileContainer | YES | YES | YES | Full mobile system with bottom nav |
| MobileHeader | YES | YES | YES | 48px fixed header with brand, SOL price, refresh |
| MobileNav | YES | YES | YES | 56px fixed bottom tabs, `md:hidden` |
| MobileTerminal | YES | YES | YES | Tabbed token browser with search/sort/filter |
| RadarTab | YES | YES | YES | Virtualized list, market ticker, gem finder |
| TokenRowMobile | YES | YES | YES | 52px compact card, responsive at min-[400px] |
| TokenRowDesktop | NO | PARTIAL | NO | flex-wrap helps but desktop-optimized |
| DesktopTerminal | NO | NO | NO | 4-column desktop layout, hidden on mobile |
| TokenDetailDrawer | PARTIAL | PARTIAL | PARTIAL | Full-width on mobile, but 5-col grid tight |
| Navbar | YES | PARTIAL | PARTIAL | Logo too wide, right actions overflow |
| Footer | YES | YES | YES | Stacked layout on mobile, `xl:flex` desktop bar |
| SignalsClient | NO | NO | NO | Desktop table, no mobile adaptation |
| TrackerClient | PARTIAL | PARTIAL | PARTIAL | Grid view may work, list view is a table |
| ProHubClient | PARTIAL | YES | YES | 900px max-width with px-4, mostly works |
| ResearchClient | YES | PARTIAL | PARTIAL | 17 responsive classes, mixed adaptation |
| DataFreshnessBar | YES | YES | YES | Compact bar component |
| TokenCardGrid | UNKNOWN | UNKNOWN | UNKNOWN | Not audited -- used in some views |
| HeroOverlay | PARTIAL | YES | PARTIAL | Full-screen overlay, may need mobile sizing |
| WelcomePanel | PARTIAL | YES | PARTIAL | Session-gated, unknown mobile layout |
| GemFinderModal | YES | YES | YES | Modal with bottom sheet on mobile |
| LeadTimeBadge | YES | YES | YES | Small inline badge, works at all sizes |
| ProofPreviewRail | NO | NO | NO | Desktop sidebar component |
| LiveSignalFeed | PARTIAL | PARTIAL | PARTIAL | Unknown mobile handling |
| LeftIntelStrip | NO | NO | NO | Desktop left sidebar |
| ContextBar | PARTIAL | PARTIAL | PARTIAL | Unknown mobile handling |

## Quick Wins (implement in under 1 hour each)

1. **Add `overflow-x-auto` to SignalsClient table wrapper** -- File: `app/signals/SignalsClient.tsx`. Change: Wrap `<Table>` in `<div className="overflow-x-auto">`. Expected: Table becomes horizontally scrollable instead of overflowing the viewport. 5 minutes.

2. **Reduce navbar logo to `w-24` on mobile** -- File: `components/navbar.tsx` line 203. Change: `className="h-auto w-40"` to `className="h-auto w-24 md:w-40"`. Expected: Logo stops overlapping the hamburger and action buttons at 390px.

3. **Hide Admin shield button on mobile** -- File: `components/navbar.tsx` line 258. Change: Add `hidden md:flex` to the Admin `<Button>`. Expected: Reclaims ~36px in the right actions area, preventing overflow.

4. **Add `truncate` to drawer metric values** -- File: `components/token-detail-drawer.tsx` lines 438/443/448/452/456. Change: Add `truncate` class to each metric value `<div>`. Expected: Long prices like `$0.00000042` won't overflow their grid cell.

5. **Wrap filter toggles in `hidden md:flex`** -- File: `app/HomeClient.tsx` line 896. Change: Add `hidden md:flex` to the `<div className="flex items-center flex-wrap gap-2 mb-2">`. Expected: Duplicate filter controls stop rendering below MobileTerminal on mobile.

6. **Make token drawer metrics 3-col on mobile** -- File: `components/token-detail-drawer.tsx` line 435. Change: `grid grid-cols-5` to `grid grid-cols-3 sm:grid-cols-5`. Expected: PRICE/24H/SCORE visible without cramming, LIQ/VOL in a second row.

7. **Add `whitespace-nowrap` to Signal Outcomes table headers** -- File: `app/signals/SignalsClient.tsx` lines 96-100. Change: Add `whitespace-nowrap` to each `<TableHead>`. Expected: Column headers stop wrapping and breaking layout.

## Technical Debt -- Mobile

**Hardcoded widths:**
- Navbar: `w-[80px]` left, `w-[100px]` right containers use fixed widths that don't account for content overflow
- Navbar logo: `w-40` (160px) is hardcoded, too wide for 390px minus 180px of fixed containers
- MobileTerminal sort select: `w-[110px]` is fine but inflexible

**Desktop-only CSS / components that don't render on mobile:**
- `DesktopTerminal`: `hidden md:block` -- correct, but means desktop 4-column layout is inaccessible on mobile
- `TabletTerminal`: imported but unclear rendering conditions
- Stats grid: `hidden md:grid md:grid-cols-5` -- mobile users get zero aggregate stats
- Terminal status bar: `hidden md:flex` -- mobile users don't see LIVE/STALE indicator or "SOLANA ONLY" label
- `ProofPreviewRail`, `LeftIntelStrip`, `AAdsRightRail`: desktop sidebar components, correctly hidden on mobile
- Footer desktop bar: `hidden xl:flex` -- mobile gets stacked version, which is correct

**Dual mobile rendering paths:**
- `MobileTerminal` (line 885, `block md:hidden`) vs `MobileContainer` (imported, renders with MobileNav) creates a fractured mobile experience. Both exist but may not both be reachable. This is the single largest piece of mobile tech debt.

**`overflow-x: hidden` hacks:**
- Navbar has `overflow-hidden` on the outer `<nav>` which could mask horizontal overflow issues
- No explicit `overflow-hidden` on body or main content, but the `MobileContainer` uses `fixed inset-0` which naturally prevents overflow

**Components that simply don't render on mobile:**
- The entire `DesktopTerminal` 4-column intelligence grid
- Market Intel Ticker (unclear rendering conditions)
- Left Intel Strip
- Proof Preview Rail
- Context Bar (may have mobile rendering, but unclear)

**Missing safe-area handling:**
- MobileContainer correctly uses `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`
- MobileNav uses `.safe-bottom` class (must verify this exists in globals.css)
- Token detail drawer uses `pb-[calc(env(safe-area-inset-bottom)+6rem)]` -- correct
- Navbar hamburger sheet uses `pb-[calc(env(safe-area-inset-bottom)+1rem)]` -- correct
- Other pages (signals, tracker, research) do NOT have safe-area handling
