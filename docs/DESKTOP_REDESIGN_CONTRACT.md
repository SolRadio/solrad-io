# SOLRAD Desktop Dashboard -- REDESIGN CONTRACT

## A) Architecture Map (Desktop xl+ Layout)

```
+---------------------------------------------------------------+
| Navbar (fixed top)                                            |
| Logo | Nav Links | Refresh(60s cooldown) | Theme | Ops Login  |
+---------------------------------------------------------------+
| MarketIntelTicker (scrolling news/tips bar)                   |
+---------------------------------------------------------------+
| LeftIntelStrip  |  TokenIndex   |   Main Content Area          | AAdsRightRail |
| (72px, fixed)   |  (260px)     |   (flex-1)                   | (300px, 2xl+) |
| STUB: empty     |  Search +    |   Stats Cards (5)             | LeadTimePanel |
|                 |  Scrollable  |   Hero/Controls Strip         | + Ad iframes  |
|                 |  token list  |   GemFinder Toggle             |               |
|                 |  Click ->    |   DesktopTerminal (4-col grid)|               |
|                 |  page drawer |     Trending | Active |       |               |
|                 |              |     New/Early | Fresh          |               |
+---------------------------------------------------------------+
| Footer                                                        |
+---------------------------------------------------------------+
```

**Breakpoint tiers (CSS visibility):**
- `block md:hidden` -> MobileContainer
- `hidden md:block lg:hidden` -> TabletTerminal
- `hidden lg:block xl:hidden` -> DesktopTerminal compact={true}
- `hidden xl:flex` -> Full layout (Navbar, Ticker, Index, Terminal, Rail, Footer)

**Entry point:** `app/page.tsx` -> `HomePage()` client component.

---

## B) Component Ownership Map

### Desktop-ONLY (safe to restyle):
| Component | File | Role |
|-----------|------|------|
| DesktopTerminal | `components/desktop-terminal.tsx` | 4-col (or 2-col compact) token grid |
| TokenRowDesktop | `components/token-row-desktop.tsx` | Individual token card (React.memo) |
| TokenIndex | `components/token-index.tsx` | Left sidebar token list |
| Navbar | `components/navbar.tsx` | Top navigation bar |
| MarketIntelTicker | `components/market-intel-ticker.tsx` | Scrolling ticker |
| LeftIntelStrip | `components/left-intel-strip.tsx` | STUB (renders empty aside) |
| ContextBar | `components/context-bar.tsx` | STUB (renders null) |
| AAdsRightRail | `components/ads/AAdsRightRail.tsx` | Ad rail (2xl+ only) |
| Stats cards + Hero | Inline in `app/page.tsx` | Stats grid + controls |

### SHARED (visual-only changes, NO logic changes):
| Component | File | Role |
|-----------|------|------|
| TokenDetailDrawer | `components/token-detail-drawer.tsx` | Drawer used by BOTH desktop rows and mobile rows |
| DataFreshnessBar | `components/data-freshness-bar.tsx` | Freshness indicator |
| LeadTimeBadge | `components/lead-time-badge.tsx` | Lead-time display badge |
| BadgeLegendModal | `components/badge-legend-modal.tsx` | Badge info modal |
| HowToUseModal | `components/how-to-use-modal.tsx` | Usage guide modal |

### MOBILE/TABLET-ONLY (DO NOT TOUCH):
| Component | File |
|-----------|------|
| MobileContainer | `components/mobile-container.tsx` |
| MobileHeader | `components/mobile-header.tsx` |
| MobileNav | `components/mobile-nav.tsx` |
| TokenRowMobile | `components/token-row-mobile.tsx` |
| RadarTab / ProofTab / WatchlistTab / LearnTab / FiltersTab | `components/mobile-tabs/*` |
| TabletTerminal | `components/tablet-terminal.tsx` |
| MobileTerminal | `components/mobile-terminal.tsx` |

---

## C) Data Contract Map

### Authoritative fields (from API, used in desktop UI):
- `address`, `symbol`, `name`, `imageUrl`
- `priceUsd`, `priceChange24h`
- `volume24h`, `liquidity`, `fdv`, `marketCap`
- `totalScore` (SOLRAD score 0-100)
- `riskLabel` ("LOW RISK" | "MEDIUM RISK" | "HIGH RISK")
- `pairUrl`, `pairAddress`, `pairCreatedAt`, `dexUrl`
- `txns24h`, `holders`
- `scoreBreakdown` (6 sub-scores)
- `sources[]`, `badges[]`
- `heliusData` (holderCount, topHolderPercentage, mintAuthority, freezeAuthority, tokenAge)
- `washTrading` (suspected, adjustedVolume24h, confidence, notes, risk)
- `signalState` ("EARLY" | "CAUTION" | "STRONG")
- `signalReasons[]`
- `whyFlagged`, `scoreDebug`, `tokenInsight`, `aiExplanation`
- `lastUpdated`, `sourceUpdatedAt`
- `tokenAgeHours`, `dexTokenAddress`

### Proxy/derived fields (client-side, UI-only):
- `_rationale` -- from `deriveSignalRationale()` in enrichment step
- `_leadTimeBlocks`, `_leadTimeConfidence` -- UI-only annotations
- Confidence score -- computed inline in drawer (5 penalties)
- Signal badge -- from `signalState` + inline confidence fallback
- Origin accent/label -- from `getTokenOriginWithReason()`
- SOLRAD score display -- from `getSolradScore()` helper

### NOT available (do not invent):
- No wallet/portfolio data
- No on-chain transaction-level data (only aggregates)
- No order book depth
- No social sentiment score
- No historical snapshots beyond 24h fetched per-drawer
- No real-time WebSocket (polling only)

---

## D) Interaction Map

| User Action | Trigger | Handler |
|-------------|---------|---------|
| Click token in TokenIndex | `handleTokenSelect(token)` | Sets `selectedToken` state -> opens page-level drawer |
| Click TokenRowDesktop | `setDrawerOpen(true)` | Opens per-row inline drawer |
| Copy X Post button | `handleCopy()` | Copies share text to clipboard |
| Share on X button | `handleShare()` | Opens Twitter compose URL |
| Toggle Watchlist star | `toggleWatch(address)` | Adds/removes from localStorage watchlist |
| External Link button | `handleExternalLink()` | Opens DexScreener in new tab |
| Click badge/info icon | Popover toggle | Shows whyFlagged/scoreDebug/tokenInsight |
| Refresh button (Navbar) | `onRefresh -> fetchTokens()` | Re-fetches `/api/index`, 60s cooldown enforced |
| GemFinder toggle | `setGemFinderMode()` | Filters all lists to GEM badge tokens only |
| Column search input | Local state per column | Filters column tokens by symbol/name/address |
| Column risk filter | Local state per column | Filters by LOW/MED/HIGH/ALL |
| Global search (page) | `setSearch()` | Filters `allTokens` into `filteredAll` |
| Global sort (page) | `setSortBy()` | Sorts `filteredAll` into `sortedAll` |
| Source filter (page) | `setSourceFilter()` | Filters by source membership |

---

## E) Drawer Map

### Component: `TokenDetailDrawer` (1541 lines)

**Sections (top to bottom):**
1. Header: Avatar (80x80), symbol, name, copyable mint, source badges
2. Official Links: Solscan, DexScreener, Copy Mint, Copy Pair, social links
3. Price & Change: Live price + 24h % + LIVE/STALE indicator
4. On-chain Activity & DEX Stats: 2-col grid (8 metrics)
5. Lead-Time Proof Panel (conditional)
6. Safety Snapshot: Risk level, chips, depth, FDV/liq, age, wash, insider, authorities
7. Data Sources: Count + indicator
8. SOLRAD Score: Large display + signal badge + intel status + confidence meter
9. Accordions (collapsible):
   - WHY SOLRAD FLAGGED THIS (default open)
   - SCORING BREAKDOWN
   - HISTORY (24H) -- sparklines, signal proof outcome grid
   - TELEMETRY
   - SOLRAD INTELLIGENCE (conditional)
10. Full Mint Address (copyable)
11. Sticky Footer: COPY / SHARE / DEX

**Polling hooks (active when drawer is open):**
- `useFreshQuote(address, { enabled: open, pollInterval: 45000 })`
- `useTokenHistory(address, { enabled: open, limit: 80, window: "24h" })`
- `useLeadTime(normalizedMint, { enabled: open })`

**State paths:**
1. TokenRowDesktop: `drawerOpen` local state -> per-row `<TokenDetailDrawer>`
2. page.tsx: `selectedToken` state -> page-level `<TokenDetailDrawer>` (from TokenIndex clicks)

---

## F) Performance Guards

| Guard | Location | Purpose |
|-------|----------|---------|
| `React.memo` | TokenRowDesktop | Prevents rerender when parent rerenders |
| `useMemo` (trendingView, etc.) | page.tsx | Prevents recomputing filtered views |
| `useMemo` (filteredAll, sortedAll, stats) | page.tsx | Prevents recomputing on unrelated state changes |
| `useMemo` (column filters) | desktop-terminal.tsx | Prevents refiltering on unrelated state changes |
| `inFlightFetch` | page.tsx (module-level) | Prevents concurrent /api/index requests |
| `quoteCache` | use-fresh-quote.ts (module-level) | Prevents duplicate quote polling per mint |
| `pollingRegistry` | use-fresh-quote.ts (module-level) | Prevents duplicate interval timers |
| `listeners` | use-fresh-quote.ts (module-level) | Shares polling across components |
| Refresh cooldown (60s) | page.tsx client state | Prevents button spam |

---

## G) Fragile Zones & Do-Not-Touch List (ranked by break risk)

### CRITICAL (will break scoring/data):
1. **Confidence computation in TokenDetailDrawer** -- duplicated in 2 IIFEs (badge logic + confidence meter). Change one = mismatch.
2. **Signal threshold constant (70)** -- hardcoded in 4+ locations inside drawer.
3. **`use-fresh-quote.ts` module-level caching** -- quoteCache, pollingRegistry, listeners. Changing = polling storms.
4. **`inFlightFetch` guard in page.tsx** -- removing = concurrent request duplication.

### HIGH (will break UX flow):
5. **Dual-drawer mechanism** -- per-row (TokenRowDesktop) + page-level (TokenIndex). Merging = broken navigation.
6. **Server ordering of column arrays** -- columns receive pre-sorted data. Adding client sort = wrong order.
7. **Live Window Filter scope** -- applies to 4 live arrays only, NOT allTokens. Changing = hidden tokens.
8. **GEM mode badge filter** -- filters by `badge.key === "GEM"`. Changing key = broken filter.

### MODERATE (visual/perf regression):
9. **`React.memo` on TokenRowDesktop** -- removing = rerender storm on every poll cycle.
10. **Origin detection (`getTokenOriginWithReason`)** -- does full `JSON.stringify(token)` in Pass 2. Calling in render loops = expensive.
11. **50 drawer instances mounted** -- each TokenRowDesktop mounts its own drawer. Adding more = memory bloat.
12. **LeftIntelStrip / ContextBar** -- empty stubs. Adding logic = unexpected layout shifts.

---

# INVARIANTS CHECKLIST (Post-Redesign QA)

## Data & API Invariants
- [ ] `TokenScore` type contract unchanged (all fields in `lib/types.ts`)
- [ ] `/api/index` response shape unchanged (all, trending, active, newEarly, freshSignals + metadata)
- [ ] Server ordering of column arrays preserved (no client re-sort on Trending/Active/New-Early/Fresh)
- [ ] Live Window Filter applied ONLY to 4 live arrays, NOT allTokens
- [ ] `convertIntelToScore()` and `enrichTokensWithRationale()` pipeline unchanged
- [ ] No new API calls introduced
- [ ] No new fields invented or assumed

## Performance Invariants
- [ ] `React.memo` wrapping on TokenRowDesktop remains intact
- [ ] All `useMemo` wrappers (filteredAll, sortedAll, stats, column views) remain intact
- [ ] `inFlightFetch` module-level guard in page.tsx remains intact
- [ ] `useFreshQuote` module-level dedup (quoteCache, pollingRegistry, listeners) untouched
- [ ] Mounted drawer instances count unchanged (1 per TokenRowDesktop + 1 page-level)
- [ ] No new per-row expensive computations introduced

## Polling & Timing Invariants
- [ ] Main data refresh interval: 120,000ms (2 minutes)
- [ ] Drawer fresh quote poll: 45,000ms (45 seconds)
- [ ] Force refresh cooldown: 60,000ms (60 seconds)

## Interaction Invariants
- [ ] TokenIndex click -> sets `selectedToken` state -> opens page-level drawer
- [ ] TokenRowDesktop click -> opens per-row inline drawer (local `drawerOpen` state)
- [ ] Copy X Post copies share text to clipboard
- [ ] Share on X opens Twitter compose
- [ ] Watchlist toggle saves to localStorage
- [ ] External Link opens DexScreener
- [ ] GEM mode filters by `badge.key === "GEM"`
- [ ] Column search filters by symbol/name/address (local state)
- [ ] Column risk filter filters by risk label (local state)
- [ ] `handleTokenSelect` uses React state directly (not URL params)

## Logic Invariants
- [ ] Confidence computation (5 penalties, 0-100 clamped) identical in both badge logic and confidence meter
- [ ] Signal threshold constant (70) consistent across all 4+ usages in drawer
- [ ] Signal state from server (`signalState` field) used as primary source; inline fallback only when absent
- [ ] `_rationale` derived by `deriveSignalRationale()` -- deterministic, not AI

## Layout Invariants
- [ ] Mobile (`<768px`) and Tablet (`768-1023px`) experiences completely untouched
- [ ] AAdsRightRail visible only at 2xl+ (>=1536px)
- [ ] LeftIntelStrip and ContextBar remain stubs (no new logic)
- [ ] Footer rendered at bottom of xl+ layout
- [ ] Compact desktop (1024-1279) uses DesktopTerminal compact={true} with 2 columns

## Cross-Cutting Invariants
- [ ] No changes to: lib/types.ts, lib/scoring-v2.ts, lib/signal-state.ts, lib/token-score.ts
- [ ] No changes to: hooks/use-fresh-quote.ts, hooks/use-watchlist.ts, hooks/use-token-history.ts
- [ ] No changes to: any /api/* route handlers
- [ ] No changes to: any mobile-tabs/* files
- [ ] No changes to: MobileContainer, MobileHeader, MobileNav, TokenRowMobile, TabletTerminal

---

# SAFE REDESIGN PLAN

## Allowed Changes (purely visual + layout composition):
- Tailwind classes (colors, spacing, typography, borders, backgrounds)
- CSS Grid/Flexbox layout adjustments within existing containers
- Font sizes, weights, letter-spacing
- Border/divider styling (1px solid, border-color)
- Background colors and opacity
- Box shadows and subtle effects
- Icon sizes
- Token logo sizes (e.g., making avatars bigger)
- Section header typography
- Accordion styling
- Badge/chip visual appearance (colors, borders, rounded)
- Scroll container styling

## Forbidden Changes (logic/data/types/hooks):
- TokenScore type definition
- API route handlers or response shapes
- Signal state computation or confidence computation
- Hook implementations (use-fresh-quote, use-watchlist, use-token-history, use-lead-time)
- Polling intervals or cooldowns
- Event handler logic (handleCopy, handleShare, toggleWatch, handleExternalLink)
- Column sorting behavior
- Live Window Filter logic
- GEM mode filter logic
- inFlightFetch guard
- React.memo or useMemo wrappers
- Drawer section order, conditions, or data bindings

## Minimal Surface Area Files to Touch:

### Phase 0 -- Foundation Styling:
- `app/globals.css` -- terminal theme tokens (dark backgrounds, border colors, text hierarchy)
- `app/page.tsx` -- stats cards and hero/controls strip visual styling ONLY (classes, not logic)

### Phase 1 -- Layout Wrapper Visuals:
- `components/navbar.tsx` -- terminal-style header
- `components/token-index.tsx` -- bigger logos, cleaner rows, terminal alignment
- `components/desktop-terminal.tsx` -- column headers, grid gaps, dividers

### Phase 2 -- Token Row Visual Restyle:
- `components/token-row-desktop.tsx` -- terminal row layout with column slots, bigger logo, cleaner badges
- `components/token-detail-drawer.tsx` -- VISUAL ONLY: spacing, headers, typography, dividers, key metrics strip

---

# RED FLAGS -- What NOT To Do

1. **DO NOT refactor TokenDetailDrawer** into sub-components or change its section order. It is 1541 lines for a reason (confidence logic duplication, inline IIFEs). Visual-only changes.

2. **DO NOT merge the dual-drawer pattern.** Per-row drawers in TokenRowDesktop and the page-level drawer from TokenIndex are SEPARATE paths. Do not consolidate.

3. **DO NOT add client-side sorting to the 4 columns.** The sort dropdown in columns is display-only. Server ordering is the source of truth.

4. **DO NOT change hook implementations.** Especially `use-fresh-quote.ts` -- its module-level caching prevents polling storms. Visual consumption only.

5. **DO NOT touch mobile or tablet files.** MobileContainer, mobile-tabs/*, TokenRowMobile, TabletTerminal, MobileTerminal are completely separate experiences.

6. **DO NOT invent new data fields.** If a field is not in the TokenScore type or the API response, do not assume it exists.

7. **DO NOT remove React.memo from TokenRowDesktop** or remove useMemo wrappers. These are critical performance guards.

8. **DO NOT change the refresh cooldown, polling intervals, or inFlightFetch guard.** These prevent API storms and rate limiting.

9. **DO NOT call `getTokenOriginWithReason()` in new render loops.** It does an expensive `JSON.stringify` in Pass 2. Use existing derived values.

10. **DO NOT change the signal threshold constant (70)** -- it appears in 4+ locations in the drawer. All must stay in sync.

11. **DO NOT add new per-row API calls.** Lead-time proofs are already fetched once at page level and passed down via Map.

12. **DO NOT change the AAdsRightRail ad provider logic or visibility breakpoint (2xl+).**
