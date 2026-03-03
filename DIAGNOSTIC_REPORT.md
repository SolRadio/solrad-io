# SOLRAD Token Ingestion & Caching Diagnostic Report

**Generated:** 2026-02-05  
**Purpose:** Map the complete data flow from external sources to /api/index response

---

## Question 1: Where does /api/index get its live token list?

### Primary Data Source
**File:** `/app/api/index/route.ts`  
**Function:** `GET(request: Request)`  
**Line:** 64

```typescript
indexCache = await getTokenIndexCached()
```

### Cache Key Hierarchy (3-tier fallback)

**Tier 1 - Primary Cache (5min TTL):**
- **Key:** `"solrad:tokenIndex:v1"` 
- **Defined in:** `/lib/intel/tokenIndex.ts` line 13
- **TTL:** 300 seconds (5 minutes)
- **Function:** `getTokenIndexCached()` line 385

**Tier 2 - Intermediate Fallback (1h TTL):**
- **Key:** `"solrad:tokens:fallback"`
- **Defined in:** `/lib/ingestion.ts` line 293
- **TTL:** 3600 seconds (1 hour)
- **Purpose:** "Prevents warming radar state when cache expires and new ingestion fails"

**Tier 3 - Long-term Fallback (4h TTL):**
- **Key:** `"solrad:tokens:blob-fallback"`
- **Defined in:** `/lib/ingestion.ts` line 297
- **TTL:** 14400 seconds (4 hours)
- **Contains:** Top 100 tokens only

**Metadata Cache:**
- **Key:** `"solrad:tokenIndex:meta"`
- **Defined in:** `/lib/intel/tokenIndex.ts` line 14
- **Contains:** `firstSeenMap` tracking for badge calculations
- **TTL:** 600 seconds (2x primary cache)

### Data Flow Path

```
/api/index (line 64)
  → getTokenIndexCached() [tokenIndex.ts:385]
    → storage.get(TOKEN_INDEX_KEY) [tokenIndex.ts:388]
      CACHE MISS → rebuildAndCache() [tokenIndex.ts:454]
        → buildTokenIndex() [tokenIndex.ts:265]
          → getTrackedTokens() [get-tracked-tokens.ts:62]
            → getCachedTokens() [ingestion.ts:350]
              PRIMARY: storage.get(CACHE_KEYS.TOKENS) [ingestion.ts:352]
              FALLBACK 1: storage.get("solrad:tokens:fallback") [ingestion.ts:356]
              FALLBACK 2: storage.get("solrad:tokens:blob-fallback") [ingestion.ts:363]
```

---

## Question 2: KV vs Blob Token Merge Logic

### Current Implementation: **STRICT KV_ONLY POLICY**

**File:** `/lib/get-tracked-tokens.ts`  
**Function:** `getTrackedTokens()`  
**Lines:** 100-143

### Three Operating Modes

**Mode 1: KV_ONLY (cachedCount > 0)**
- **Lines:** 100-128
- **Policy:** Blob tokens are NEVER added to the live set
- **Blob Usage:** Metadata overlay ONLY for tokens already in KV
- **Log:** `"[v0] getTrackedTokens policy: KV_ONLY"` (line 103)

```typescript
// Lines 118-127
for (const [mint, storedToken] of Object.entries(storedTokens)) {
  const mintLower = mint.toLowerCase()
  const liveToken = allTokens.get(mintLower)
  
  if (liveToken) {
    // Live token exists - merge ONLY metadata from stored
    const merged = mergeStoredMetadataIntoLive(liveToken, storedToken)
    allTokens.set(mintLower, merged)
  }
  // REMOVED: Do not add blob tokens as fallback when cache exists
}
```

**Mode 2: BLOB_FALLBACK (cachedCount == 0 && blobTokenCount > 0)**
- **Lines:** 129-141
- **Policy:** ALL blob tokens become live tokens (only when KV is empty)
- **Log:** `"[v0] getTrackedTokens policy: BLOB_FALLBACK"` (line 131)

**Mode 3: NO_DATA (both empty)**
- **Lines:** 142-144
- **Returns:** Empty array

### Safe Metadata Fields (Overlay Only)

**File:** `/lib/get-tracked-tokens.ts`  
**Lines:** 10-19

```typescript
const SAFE_METADATA_FIELDS = [
  "notes",
  "isPinned",
  "tag",
  "firstSeenAt",
  "watchlist",
  "userLabels",
  "customTags",
] as const
```

### Merge Function

**Function:** `mergeStoredMetadataIntoLive(live, stored)`  
**Lines:** 25-42  
**Behavior:**
1. Start with live token (line 27)
2. Overlay ONLY safe metadata from stored (lines 30-34)
3. Special case: Preserve `firstSeenAt` if live lacks `pairCreatedAt` (lines 37-39)
4. **NEVER overwrites:** price, volume, liquidity, score, etc.

---

## Question 3: Zero-Token Write Conditions

### Two Write Guards Implemented

**Guard 1: Zero-Token Write Guard**

**File:** `/lib/ingestion.ts`  
**Lines:** 157-185  
**Trigger:** `validScores.length < 5`

```typescript
const MINIMUM_TOKEN_THRESHOLD = 5 // Absolute minimum to consider valid

if (validScores.length < MINIMUM_TOKEN_THRESHOLD) {
  const previousCachedData = await getCachedTokens()
  
  if (previousCachedData && previousCachedData.tokens.length > 0) {
    console.log(`[INGEST GUARD] Skipped write due to zero-token failure...`)
    // DOES NOT WRITE - returns early (line 174)
    // PRESERVES last-good cache
  }
}
```

**Actions When Triggered:**
1. Sets ingestion status to `"rate_limited"` (lines 165-171)
2. Deletes ingestion lock (line 173)
3. **Returns early** - NO storage writes occur (lines 176-183)

**Guard 2: Degraded Data Guard**

**File:** `/lib/ingestion.ts`  
**Lines:** 226-271  
**Triggers:**
- `validScores.length < 15` (MIN_TOKENS)
- OR `healthyRatio < 0.3` (less than 30% tokens have valid price/liquidity/volume)

```typescript
const healthyTokens = validScores.filter(t => {
  const hasPrice = (t.priceUsd ?? 0) > 0
  const hasLiquidity = (t.liquidity ?? 0) > 0
  const hasVolume = (t.volume24h ?? 0) > 0
  return hasPrice && hasLiquidity && hasVolume
})

const isDegraded = 
  validScores.length < MIN_TOKENS || 
  healthyRatio < MIN_HEALTHY_TOKENS_RATIO

if (isDegraded && previousCachedData && previousCachedData.tokens.length > 0) {
  console.log(`[INGEST GUARD] Skipped write due to degraded data...`)
  // DOES NOT WRITE - returns early (line 259)
}
```

**Actions When Triggered:**
1. Sets ingestion status to `"degraded"` (lines 251-258)
2. Deletes ingestion lock (line 260)
3. **Returns early** - NO storage writes occur (lines 262-271)

### Where Storage Writes Occur (Only After Guards Pass)

**File:** `/lib/ingestion.ts`  
**Lines:** 273-303

```typescript
// Line 289: Primary cache (15min TTL)
await storage.set(CACHE_KEYS.TOKENS, cacheData, { ex: CACHE_TTL.TOKENS })

// Line 290: Source metadata
await storage.set(CACHE_KEYS.SOURCE_META, sourceMeta, { ex: CACHE_TTL.TOKENS })

// Line 293: 1-hour fallback
await storage.set("solrad:tokens:fallback", cacheData, { ex: 3600 })

// Line 297: 4-hour blob fallback (top 100 only)
await storage.set("solrad:tokens:blob-fallback", {
  tokens: validScores.slice(0, 100),
  updatedAt: Date.now(),
}, { ex: 14400 })

// Line 305: Clear degraded status
await storage.set(CACHE_KEYS.INGESTION_STATUS, {
  status: "ready",
  lastGoodIngestAt: Date.now(),
}, { ex: 3600 })
```

### Summary: Zero Tokens Can NEVER Be Written

Both guards check for `previousCachedData.tokens.length > 0` before skipping writes. This means:
- **If cache has tokens:** Guards activate, writes are blocked
- **If cache is empty:** No previous data to protect, writes proceed (even if 0 tokens)
- **Result:** Successful ingests with 0 tokens can only occur on first-ever run

---

## Question 4: Ingestion Lock Mechanism

### Lock Implementation

**File:** `/lib/ingestion.ts`  
**Function:** `ingestTokenData(force = false)`

**Lock Check (Lines 105-115):**
```typescript
const lock = await storage.get(CACHE_KEYS.INGESTION_LOCK)
if (lock && !force) {
  logger.log("[v0] Ingestion lock detected, checking if stale...")
  return {
    success: false,
    tokensProcessed: 0,
    sourcesUsed: 0,
    duration: Date.now() - startTime,
    error: "Ingestion already in progress",
  }
}
```

**Lock Acquisition (Lines 117-118):**
```typescript
await storage.set(CACHE_KEYS.INGESTION_LOCK, true, { ex: CACHE_TTL.LOCK })
await storage.set(CACHE_KEYS.LAST_INGEST_TIME, Date.now())
```

**Lock Release Points:**
1. **After successful ingestion** (line 337): `await storage.del(CACHE_KEYS.INGESTION_LOCK)`
2. **After zero-token guard** (line 173): `await storage.del(CACHE_KEYS.INGESTION_LOCK)`
3. **After degraded guard** (line 260): `await storage.del(CACHE_KEYS.INGESTION_LOCK)`
4. **After error** (line 341): `await storage.del(CACHE_KEYS.INGESTION_LOCK)`

**Lock Key & TTL:**
- **Key:** `"solrad:lock:ingestion"` (defined in `/lib/storage.ts` line 223)
- **TTL:** `300` seconds (5 minutes, defined in `/lib/storage.ts` line 234)
- **Auto-expiry:** Lock automatically expires after 5 minutes even if process crashes

**Force Override:**
- Parameter: `force = false` (line 17)
- When `force = true`: Lock check is bypassed (line 106)
- Used for admin-triggered manual ingestion

### Rate Limit Check (Additional Guard)

**Lines 84-96:**
```typescript
const lastIngestTime = await storage.get(CACHE_KEYS.LAST_INGEST_TIME)
if (lastIngestTime && !force) {
  const timeSinceLastIngest = Date.now() - (lastIngestTime as number)
  if (timeSinceLastIngest < CACHE_TTL.RATE_LIMIT * 1000) {
    const retryAfter = Math.ceil((CACHE_TTL.RATE_LIMIT * 1000 - timeSinceLastIngest) / 1000)
    return {
      success: false,
      error: `Rate limited. Retry after ${retryAfter} seconds`,
    }
  }
}
```

**Rate Limit TTL:** 60 seconds (defined in `/lib/storage.ts` line 236)

---

## Question 5: External Data Source Adapters

### Currently Enabled Adapters

**File:** `/lib/adapters/index.ts`  
**Export:** `adapters: SourceAdapter[]`  
**Lines:** 12-16

```typescript
export const adapters: SourceAdapter[] = [
  { name: "dexscreener", fetch: fetchDexScreener, enabled: true },
  // Pump.fun adapter - disabled by default, enable once API endpoint is verified
  // { name: "pumpfun", fetch: fetchPumpFun, enabled: false },
]
```

### Active Adapters: 1 ONLY

**1. DexScreener (ENABLED)**
- **Name:** `"dexscreener"`
- **File:** `/lib/adapters/dexscreener.ts`
- **Fetch Function:** `fetchDexScreener()`
- **Endpoints:**
  - `https://api.dexscreener.com/token-boosts/top/v1` (line 126)
  - `https://api.dexscreener.com/latest/dex/search?q=solana` (line 170)
  - `https://api.dexscreener.com/token-boosts/latest/v1` (line 215)
- **429 Handling:** Returns cached data on rate limit (lines 131-139, 175-183, 220-228)
- **Cache Key:** `"dexscreener:cache"` (line 15)

**2. Pump.fun (DISABLED)**
- **Status:** Commented out (line 15)
- **Reason:** "enable once API endpoint is verified"

### Removed/Disabled Adapters

**Birdeye (REMOVED)**
- **Previous Status:** Disabled via `ENABLE_BIRDEYE` env flag
- **Removal Date:** Phase B implementation
- **Files Modified:**
  - `/lib/adapters/index.ts` - removed import and adapter entry
  - `/lib/types.ts` - removed from SourceType union (line 1)
  - `/app/api/index/route.ts` - removed birdeye401 tracking (line 221)
  - `/components/sources-indicator.tsx` - removed birdeye colors/labels

**Jupiter (NEVER IMPLEMENTED)**
- Listed in SourceType union but no adapter exists

**Helius (ENRICHMENT ONLY, NOT A SOURCE)**
- **File:** `/lib/ingestion.ts` lines 142-161
- **Function:** `enrichWithHelius(address)`
- **Usage:** Enriches TOP 15 tokens only (line 145)
- **Purpose:** Add holder data, mint/freeze authority status
- **Does NOT:** Provide new tokens, only enriches existing ones

### Adapter Execution Flow

**File:** `/lib/adapters/index.ts`  
**Function:** `fetchAllSources()`  
**Lines:** 18-51

```typescript
// Line 20: Filter to enabled adapters only
const enabledAdapters = adapters.filter((adapter) => adapter.enabled !== false)

// Line 22: Log enabled adapters
logger.log(`[v0] fetchAllSources: Starting with ${enabledAdapters.length} enabled adapters: ${enabledAdapters.map(a => a.name).join(", ")}`)

// Line 24: Fetch in parallel
const results = await Promise.allSettled(enabledAdapters.map((adapter) => adapter.fetch()))
```

**Expected Log Output (Current State):**
```
[v0] fetchAllSources: Starting with 1 enabled adapters: dexscreener
```

### How to Enable/Disable Adapters

**Method 1: Edit adapters array**
- File: `/lib/adapters/index.ts`
- Set `enabled: false` to disable
- Set `enabled: true` to enable
- Omit `enabled` field (defaults to enabled)

**Method 2: Environment Variable (Legacy, Removed)**
- Previous: `ENABLE_BIRDEYE=true`
- Current: No env-based toggles exist

**Method 3: Conditional Logic**
```typescript
// Example for future adapters
const ENABLE_PUMPFUN = process.env.ENABLE_PUMPFUN === "true"

export const adapters: SourceAdapter[] = [
  { name: "dexscreener", fetch: fetchDexScreener, enabled: true },
  { name: "pumpfun", fetch: fetchPumpFun, enabled: ENABLE_PUMPFUN },
]
```

---

## Summary Table

| Component | Key/Function | File:Line | TTL/Threshold |
|-----------|--------------|-----------|---------------|
| **Primary Index Cache** | `solrad:tokenIndex:v1` | `tokenIndex.ts:13` | 300s (5m) |
| **1h Fallback Cache** | `solrad:tokens:fallback` | `ingestion.ts:293` | 3600s (1h) |
| **4h Blob Fallback** | `solrad:tokens:blob-fallback` | `ingestion.ts:297` | 14400s (4h) |
| **Zero-Token Guard** | `< 5 tokens` | `ingestion.ts:158` | N/A |
| **Degraded Guard** | `< 15 tokens OR < 30% healthy` | `ingestion.ts:243` | N/A |
| **Ingestion Lock** | `solrad:lock:ingestion` | `storage.ts:223` | 300s (5m) |
| **Rate Limit** | `LAST_INGEST_TIME` | `storage.ts:236` | 60s |
| **KV_ONLY Policy** | `cachedCount > 0` | `get-tracked-tokens.ts:100` | N/A |
| **BLOB_FALLBACK Policy** | `cachedCount == 0` | `get-tracked-tokens.ts:129` | N/A |
| **Active Adapter** | `dexscreener` | `adapters/index.ts:13` | enabled |
| **Disabled Adapter** | `pumpfun` | `adapters/index.ts:15` | disabled |

---

## Key Findings

1. **No Union Merge:** Blob tokens are NEVER unionized with KV tokens. Blob is metadata-only when KV has data.

2. **Zero-Token Protection:** Two independent guards prevent writes when data is empty/degraded AND previous cache exists.

3. **3-Tier Fallback:** System will serve stale data up to 4 hours old before entering "warming" state.

4. **Single Source:** Only DexScreener is active. Birdeye removed, Pump.fun disabled, Jupiter never existed.

5. **Lock Auto-Expiry:** Even if process crashes, lock expires after 5 minutes automatically.

6. **Fresh Data Priority:** /api/index bypasses cache with `?bypassCache=1` param (line 56-62).

---

**Report Complete**
