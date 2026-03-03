# SOLRAD Token Lifecycle Diagnostic Report
**Date:** 2026-02-04  
**Purpose:** Architectural audit to resolve "warming radar / 0 tokens" issues  
**Status:** READ-ONLY (No code changes)

---

## 1) Token Lifecycle Map (Critical)

### Dashboard (/) Flow

```
[Cron Trigger] 
  → /api/cron/ingest (POST with CRON_SECRET header)
  → lib/ingestion.ts::ingestTokenData()
  
[Ingestion]
  → lib/adapters/index.ts::fetchAllSources() [DexScreener API]
  → lib/scoring.ts::calculateTokenScore() [adds totalScore]
  → storage.set(CACHE_KEYS.TOKENS, tokens) [KV storage with 900s TTL]
  
[TokenIndex Build]
  → lib/intel/tokenIndex.ts::buildTokenIndex()
  → lib/get-tracked-tokens.ts (merges KV + Blob)
  → lib/intel/tokenIndex.ts::normalizeToken() [adds badges, explains]
  → storage.set(TOKEN_INDEX_KEY, cache) [300s TTL]
  
[API Exposure]
  → /api/index/route.ts::GET()
  → lib/intel/tokenIndex.ts::getTokenIndexCached()
  → lib/intel/queries.ts::getTrending/getActiveTrading/etc [server-side filtering]
  → Returns: {all, trending, active, newEarly, freshSignals}
  
[Client Fetch]
  → app/page.tsx::fetchTokens()
  → fetch("/api/index")
  → Converts TokenIntel → TokenScore via convertIntelToScore()
  → Sets React state: setAllTokens(), setTrendingTokens(), etc.
  → Renders: TokenCardGrid, TokenIndex sidebar
```

**Conditions for INCLUSION:**
- Dashboard: Token must pass DexScreener → scoring → KV cache → TokenIndex → queries filters
- Trending: `liquidityUsd >= 25000`
- Active: `liquidityUsd >= 25000 AND (volume >= 500k OR change >= 10%)`
- New/Early: `liquidityUsd >= 100k, age <= 30 days, score >= 70, !HIGH RISK, !trash`
- Fresh Signals: `momentum 5m/1h OR volume spike OR wash warning OR risk warning`

**Conditions for EXCLUSION:**
- Ingestion: Token filtered if invalid Solana mint (length < 32 or > 48)
- Ingestion Guard: Entire batch rejected if `tokens.length < 15 OR healthyRatio < 30%`
- Cache Collapse: If new batch < 60% of last good count, serve last-good cache instead
- Query Filters: Token excluded if doesn't meet specific column filter criteria

**Storage Layers Used:**
- KV (Primary): `solrad:latest` (900s TTL), `solrad:tokens:fallback` (3600s TTL)
- KV (Index): `solrad:tokenIndex:v1` (300s TTL)
- Blob: `solrad/state.json` (manual tracking + archive)
- Memory: In-memory TTL cache (30s freshness for blob, 5min for KV URL)

---

### Browse (/browse) Flow

```
[Server Component RSC]
  → app/browse/page.tsx::fetchTokensServer()
  → fetch("https://www.solrad.io/api/tokens/archive?minScore=50")
  
[Archive API]
  → /app/api/tokens/archive/route.ts (NOT FOUND - endpoint doesn't exist!)
  → FALLBACK: fetch("/api/index")
  → Returns tokens from main TokenIndex
  
[Client Render]
  → BrowseContent component (client-side filtering/search)
  → Displays paginated tokens (100 per page, max 5 pages)
```

**Conditions for INCLUSION:**
- Browse: Token must be in `/api/index` response (archive API not found)
- Archive Intent: `score >= 50` (not enforced - endpoint missing)

**Conditions for EXCLUSION:**
- Browse: Same as Dashboard (inherits from /api/index)

**Storage Layers Used:**
- KV: Reads from same `solrad:tokenIndex:v1` cache as Dashboard
- Blob: `archiveByMint` object exists but NO API serves it

---

### Signals (/signals) Flow

```
[Client Fetch]
  → app/signals/page.tsx::fetchSignals()
  → fetch("/api/signal-outcomes?minScore=75&sort=priceChangePct24h")
  
[Signal Detection]
  → /app/api/signal-outcomes/route.ts::GET()
  → lib/snapshotLogger.ts::getTrackedMints() [KV: snap:index]
  → lib/snapshotLogger.ts::getSnapshotHistory() [KV: snap:list:{mint}]
  → Filters snapshots in 24h window
  → Detects FIRST_SEEN crossing minScore threshold
  → Computes price change, score delta
  
[Response]
  → Returns: {signals: SignalOutcome[], count, debug}
  → Each signal has _canonical field (added by CTR)
```

**Conditions for INCLUSION:**
- Signals: Token must have `snap:list:{mint}` history in KV
- Signal Detection: At least 1 snapshot with `score >= minScore` in last 24h
- Minimum: `getTrackedMints()` returns non-empty array

**Conditions for EXCLUSION:**
- Signals: Token never had snapshot logged (not in `snap:index`)
- Detection: All snapshots < minScore in 24h window
- Throttling: Snapshots logged max once per 10 minutes (dedup)

**Storage Layers Used:**
- KV Snapshots: `snap:index` (set of all mints), `snap:list:{mint}` (LPUSH list, max 200)
- KV Latest: `snap:latest:{mint}` (single snapshot)
- KV Dedup: `snap:last:{mint}` (timestamp, 10min TTL)

---

### Tracker (/tracker) Flow

```
[Client Fetch]
  → app/tracker/page.tsx::fetchMetrics()
  → fetch("/api/tracker?window=24h&mode=treasure")
  
[Tracker Computation]
  → /app/api/tracker/route.ts::GET()
  → lib/tracker.ts::getTrackerMetrics()
  → storage.get(CACHE_KEYS.SNAPSHOTS_INDEX) [array of YYYY-MM-DD dates]
  → storage.get(CACHE_KEYS.SNAPSHOTS_DAY(date)) [array of DailySnapshot]
  → Filters snapshots within time window (1h/4h/6h/24h/7d)
  → Aggregates appearances, consistency, score delta per mint
  → Splits: metrics (high consistency) vs preQualified (low consistency)
  
[Response]
  → Returns: {metrics, preQualified, totalSnapshots, tokensTracked}
  → Each metric has _canonical field (added by CTR)
```

**Conditions for INCLUSION:**
- Tracker: Token must appear in daily snapshots (`tracker:snapshots:YYYY-MM-DD`)
- Metrics: Appears 2+ times AND consistency >= 30% (calculated as appearances/totalSnapshots * 100)
- PreQualified: Appears 2+ times AND consistency < 30% AND score >= 80
- Mode Filter: `treasure` requires score >= 80 (OR score >= 80 AND LOW RISK)

**Conditions for EXCLUSION:**
- Tracker: Token never saved to daily snapshots
- Window Filter: Snapshot timestamp outside selected time window (1h/4h/24h/etc.)
- Appears Once: Single appearance = no consistency metric

**Storage Layers Used:**
- KV Tracker: `tracker:snapshots:index` (array of dates), `tracker:snapshots:YYYY-MM-DD` (DailySnapshot array, max 24 per day, 8 day TTL)
- KV Throttle: `tracker:last_snapshot_at` (timestamp, throttles to 10min intervals)

---

## 2) Source of Truth Table

| Page | Primary Data Source | Persistence | Filter Rules | Refresh Trigger | Can Return Zero Tokens? | Why |
|------|---------------------|-------------|--------------|-----------------|-------------------------|-----|
| **/ (Dashboard)** | `/api/index` → `getTokenIndexCached()` | KV 300s + Blob 30s | Trending: liq≥25k, Active: liq≥25k+vol≥500k, NewEarly: liq≥100k+age≤30d+score≥70, Fresh: momentum/vol spikes | 2min client poll + cron | YES | If ingestion guard rejects new batch BUT no last-good cache exists, returns empty. Also if KV cache expires and buildTokenIndex() fails. |
| **/browse** | `/api/tokens/archive` (404) → fallback `/api/index` | KV 300s (same as dashboard) | Intent: score≥50 (NOT enforced) | Server-side fetch on page load | YES | Inherits Dashboard's failure modes. Archive API doesn't exist, so depends on /api/index working. |
| **/signals** | `/api/signal-outcomes` → KV snapshots | KV `snap:list:{mint}` (no TTL expiration, LPUSH capped at 200) | minScore≥75 (configurable), 24h window, FIRST_SEEN detection | 60s client poll | YES | If no tokens have snapshot history (`snap:index` empty) OR no snapshots in 24h window OR all snapshots below minScore. Common when system first deployed or after KV flush. |
| **/tracker** | `/api/tracker` → KV daily snapshots | KV `tracker:snapshots:YYYY-MM-DD` (8 day TTL, max 24 per day) | Metrics: consistency≥30%, PreQualified: 2+ appearances + consistency<30% + score≥80 | 60s client poll on window change | YES | If no daily snapshots exist for selected time window OR all tokens have <2 appearances. Empty on fresh deployment until 2+ snapshots saved (20+ minutes). |

---

## 3) Token Identity Consistency Check

| Location | Field Used as ID | Normalized? | Casing | Notes |
|----------|------------------|-------------|--------|-------|
| **DexScreener API** | `baseToken.address` | NO | Mixed case | Source truth - as returned by API |
| **Ingestion (fetchAllSources)** | `token.address` | YES (lowercase map key) | Lowercase (map key) | Dedupe uses `address.toLowerCase()` as map key |
| **Ingestion (validation)** | `tokens[0].address` | NO (uses original) | Original mixed case | CRITICAL: Validates original properly-cased address, not lowercase map key |
| **KV Cache (CACHE_KEYS.TOKENS)** | `token.address` | NO | Mixed case | Stores original token objects with mixed case addresses |
| **TokenIndex (buildTokenIndex)** | `token.address` | YES (lowercase for firstSeenMap) | Lowercase (internal tracking) | `mintLower = token.address.toLowerCase()` for dedup |
| **TokenIndex (normalizeToken)** | `token.address` → `mint` | NO | Mixed case | Canonical field uses original mixed case |
| **Queries (getTrending, etc.)** | `token.address` (via mint) | NO | Mixed case | Operates on TokenIntel.mint (mixed case) |
| **CTR (toCanonicalToken)** | `input.mint \| input.address` | NO | Preserves input casing | Extracts from multiple possible fields |
| **CTR (joinCanonicalFlags)** | `token.mint.toLowerCase()` | YES | Lowercase (for lookup) | Creates lowercase Set for case-insensitive matching |
| **Blob Storage** | `token.address.toLowerCase()` | YES | Lowercase | Map key: `archiveByMint[mint]`, `tokensByMint[mint]` |
| **KV Snapshots** | `token.address` (mint field) | NO | Mixed case | Keys: `snap:list:{mint}`, `snap:latest:{mint}` - uses original casing |
| **Tracker Daily Snapshots** | `token.mint` | NO | Mixed case | TokenSnapshot.mint field preserves original casing |
| **Signal Outcomes** | `mint` | NO | Mixed case | SignalOutcome.mint uses original casing |

**MISMATCH DETECTED:**
1. **Ingestion Deduplication vs Validation:** Map keys use lowercase for deduplication, but validation uses original properly-cased addresses. THIS IS CORRECT - no issue.
2. **Blob Storage Lookup:** Uses lowercase keys but stores mixed-case data. Potential case sensitivity issues if code doesn't normalize consistently when accessing blob.
3. **CTR Flag Joins:** Normalizes to lowercase for Set lookups, but input tokens may have mixed case. THIS IS CORRECT - case-insensitive matching intended.

**NO CRITICAL MISMATCHES** - System correctly preserves original casing while using lowercase for deduplication/lookups.

---

## 4) CTR Impact Analysis (No Changes)

### Which Pages Currently Rely on CTR?

**Signals Page:**
- `/app/api/signal-outcomes/route.ts` adds `_canonical` field to each `SignalOutcome`
- CTR fields: `mint, symbol, name, scoreNow, scoreAtSignal, lastUpdatedAt`
- Flag: `hasSignal: true` (all signal outcomes)
- Usage: Available in response but NOT used by frontend rendering

**Tracker Page:**
- `/app/api/tracker/route.ts` adds `_canonical` field to each `TrackerMetrics`
- CTR fields: `mint, symbol, name, scoreNow, firstSeenAt, lastUpdatedAt`
- Flag: `hasSnapshot: true` (all tracked tokens), `inPool` (if in archiveByMint)
- Usage: Available in response but NOT used by frontend rendering

**Browse Page:**
- `/app/browse/page.tsx` adds `_canonical` field to each `TokenScore`
- CTR fields: `mint, symbol, name` (from toCanonicalToken)
- Flag: `inPool: true` (hardcoded since these are pool tokens)
- Usage: Available but NOT used by BrowseContent component

**Dashboard Page:**
- `/app/api/index/route.ts` DOES NOT add `_canonical` to response
- CTR is used internally to build `tokensWithFlags` but NOT returned in JSON
- Flag computation: `inPool, hasSignal, hasSnapshot` (from blob/snapshot sets)
- Usage: **NOT EXPOSED TO FRONTEND**

### Which Pages Do NOT Rely on CTR?

- Dashboard (`/`) - returns original TokenIntel objects from tokenIndex
- All frontend components - none read `_canonical` field
- All query filters - operate on original token objects

### Whether CTR Currently FILTERS Tokens Anywhere?

**NO** - CTR does NOT filter tokens anywhere.

**Evidence:**
- `toCanonicalToken()` - pure normalization, returns CanonicalToken for ALL inputs
- `joinCanonicalFlags()` - adds flags but does NOT remove any tokens from array
- API routes add `_canonical` field but return original full arrays
- No conditional logic filters based on `inPool`, `hasSignal`, or `hasSnapshot` flags

**CTR is metadata-only.** It enriches tokens with consistent fields but NEVER excludes tokens.

### Whether CTR Can Cause "warming / 0 tokens" States?

**NO** - CTR cannot cause 0-token states.

**Reasoning:**
1. Dashboard `/api/index` doesn't return CTR-normalized tokens (uses original TokenIntel)
2. CTR modules (`canonicalToken.ts`) never filter - only transform
3. Browse/Signals/Tracker add `_canonical` **after** token selection/filtering
4. Zero-token states occur **before** CTR runs (e.g., empty KV cache, failed ingestion)

**CTR is downstream of all filtering.** If 0 tokens exist, it's due to:
- Empty KV cache (`CACHE_KEYS.TOKENS`)
- Ingestion guard rejection
- Failed buildTokenIndex() call
- Query filters returning empty (e.g., no tokens meet `liquidityUsd >= 25k`)

---

## 5) Failure Mode Summary

### 1. Rate Limit (Ingestion)

**Trigger:** `timeSinceLastIngest < 60 seconds`

**Expected:** Returns `{success: false, error: "Rate limited. Retry after X seconds"}`

**Actual:** CORRECT - ingestion blocked, previous cache served

**Impact:** Client continues to serve stale tokens until rate limit expires

---

### 2. Empty Blob

**Trigger:** `getBlobState()` returns `{trackedMints: [], tokensByMint: {}, archiveByMint: {}}`

**Expected:** Merge logic in `get-tracked-tokens.ts` falls back to KV cache only

**Actual:** CORRECT - tokens from KV cache still served (blob is additive, not required)

**Impact:** Manual tokens and archive disappear, but auto-ingested tokens remain

---

### 3. Cache Overwrite (Ingestion Guard)

**Trigger:** New ingestion returns `tokens.length < 15 OR healthyRatio < 0.3`

**Expected:** Reject new batch, keep previous cache via `LAST_GOOD_INDEX`

**Actual:** PARTIAL SUCCESS
- Sets `INGESTION_STATUS: "degraded"` ✓
- Returns `previousCachedData` if available ✓
- **BUG:** If no `previousCachedData` exists (e.g., fresh deployment), falls through and **saves degraded batch anyway**

**Impact:** On fresh deployment with bad source data, system accepts degraded batch → 0 tokens possible

---

### 4. Fallback Logic (Cache Expiration)

**Trigger:** Main KV cache (`CACHE_KEYS.TOKENS`) expired, no fallback cache available

**Expected:** Return empty OR trigger background refresh

**Actual:** MULTIPLE FALLBACKS
1. Try `solrad:tokens:fallback` (1-hour TTL) ✓
2. Try `solrad:tokens:blob-fallback` (4-hour TTL) ✓
3. **BUG:** If all fallbacks expire AND `buildTokenIndex()` fails → returns `{tokens: [], generatedAt, version: "v1"}` → **Dashboard shows "warming radar"**

**Impact:** During off-hours or after KV flush, Dashboard can enter "warming" state even though data exists in Blob

---

### 5. Feature Flags (Gem Finder Mode)

**Trigger:** `featureFlags.gemFinderMode === true AND gemFinderMode === true`

**Expected:** Filter to show only tokens with GEM badge

**Actual:** CORRECT - filters in `filteredAll` memo, does NOT affect data fetching

**Impact:** UI-only filter, does NOT cause 0-token state at API level

---

### 6. Query Filter Empty Returns

**Trigger:** `/api/index` returns `{trending: [], active: [], newEarly: [], freshSignals: []}`

**Expected:** Dashboard shows "No tokens in this column" but `allTokens.length > 0`

**Actual:** CORRECT - columns can be empty while sidebar has tokens

**Impact:** UI shows empty columns but system is NOT in "warming" state

---

### 7. CTR Flag Lookup Failure

**Trigger:** `getBlobState()` throws OR `blobState.archiveByMint` is undefined

**Expected:** CTR flags all default to `false`, tokens still returned

**Actual:** CORRECT - wrapped in try/catch, logs warning, proceeds with empty mint sets

**Impact:** Tokens returned without flags, no data loss

---

## 6) Minimal Fix Options (DO NOT IMPLEMENT)

### Option A: Smallest Safe Fix

**Goal:** Prevent "warming radar" state when fallback caches exist

**Changes:**
1. `/lib/intel/tokenIndex.ts::getTokenIndexCached()`
   - Add Blob fallback BEFORE returning empty `{tokens: []}`
   - If `buildTokenIndex()` fails, try `getBlobState().tokensByMint` as last resort
   - Return cached tokens even if stale, rather than empty array

**Files Touched:** 1 file (`lib/intel/tokenIndex.ts`)

**Risk Level:** LOW

**Blast Radius:** Dashboard only - doesn't affect other pages

**Pros:** Fixes most common "0 tokens on Dashboard" scenarios

**Cons:** Doesn't address ingestion guard initial deployment bug

---

### Option B: Medium Fix

**Goal:** Add robust last-good-state preservation across all storage layers

**Changes:**
1. `/lib/ingestion.ts::ingestTokenData()`
   - Strengthen ingestion guard: NEVER accept degraded batch on fresh deployment
   - If `previousCachedData === null`, try reading from Blob archive as fallback
   - Only accept new batch if `tokens.length >= MIN_TOKENS` OR previous state exists

2. `/lib/intel/tokenIndex.ts::getTokenIndexCached()`
   - Add Blob fallback (same as Option A)
   - Add KV long-term fallback (`solrad:last_known_good`, 24h TTL)

3. `/lib/intel/tokenIndex.ts::buildTokenIndex()`
   - Save successful builds to `solrad:last_known_good` (24h TTL)
   - On failure, try loading from this key before returning empty

**Files Touched:** 2 files (`lib/ingestion.ts`, `lib/intel/tokenIndex.ts`)

**Risk Level:** MEDIUM

**Blast Radius:** Ingestion pipeline + Dashboard

**Pros:** Prevents empty state in almost all scenarios, including fresh deployment

**Cons:** Adds more fallback complexity, requires careful testing

---

### Option C: Structural Fix

**Goal:** Unified token storage with guaranteed availability

**Changes:**
1. **Consolidate Storage Layers**
   - Make Blob the canonical source of truth for tokens
   - KV becomes cache-only (derived from Blob)
   - All pages read from unified `getBlobState().tokensByMint` + live cache merge

2. **Add Snapshot Persistence**
   - Save `/api/index` response snapshots to Blob (not just KV)
   - Tracker/Signals read from Blob snapshots (never expire)
   - KV snapshots become write-through cache

3. **Guaranteed Non-Empty Response**
   - `/api/index` ALWAYS returns at minimum last known Blob state
   - Add `staleWarning: boolean` flag instead of `status: "warming"`
   - Frontend continues to show data with staleness indicator

4. **Remove CTR Flag Computation**
   - Flags are pre-computed during ingestion and stored in token objects
   - No runtime `joinCanonicalFlags()` lookups
   - Blob stores full enriched tokens with flags

**Files Touched:** 6+ files
- `lib/ingestion.ts` (consolidate storage)
- `lib/intel/tokenIndex.ts` (read from unified source)
- `lib/blob-storage.ts` (add snapshot storage)
- `lib/tracker.ts` (read from blob snapshots)
- `lib/snapshotLogger.ts` (write-through to blob)
- `app/api/index/route.ts` (guaranteed non-empty response)

**Risk Level:** HIGH

**Blast Radius:** Entire system - all pages affected

**Pros:** 
- Eliminates "warming radar" permanently
- Simplifies multi-layer caching
- Blob as single source of truth = simpler mental model
- Snapshots never expire = historical data preserved

**Cons:**
- Large refactor, high risk of regressions
- Blob API has rate limits (429 errors), needs retry logic
- May hit Blob storage size limits (need eviction policy)
- Requires migration of existing KV data to Blob

---

## Summary

**Primary Cause of "Warming Radar / 0 Tokens":**

1. **Cache Expiration Chain Failure**
   - Main KV cache expires (900s TTL)
   - Fallback caches expire (1h, 4h TTLs)
   - `buildTokenIndex()` fails (e.g., network error, KV unavailable)
   - System returns `{tokens: [], status: "warming"}`

2. **Ingestion Guard on Fresh Deployment**
   - New deployment, no previous cache
   - First ingestion returns degraded batch (< 15 tokens OR < 30% healthy)
   - Guard has no `previousCachedData` to fall back to
   - Accepts degraded batch OR returns empty

3. **Blob Fallback Not Wired to TokenIndex**
   - `getBlobState().tokensByMint` contains valid tokens
   - `getTokenIndexCached()` doesn't check Blob as fallback
   - Returns empty instead of using Blob data

**CTR System Impact:** NONE - CTR is metadata-only, does NOT filter or cause 0-token states.

**Recommended Next Step:** Implement **Option B** (medium fix) - adds Blob fallback to TokenIndex and strengthens ingestion guard, fixing most common failure scenarios with manageable risk.

---

## END REPORT
