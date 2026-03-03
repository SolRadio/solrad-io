# Birdeye Adapter Disabled - Phase B Summary

## Overview
Birdeye adapter has been disabled by default across SOLRAD to eliminate 401 rate limit errors and prevent it from appearing in "Sources" inference unless explicitly enabled.

## Files Changed

### 1. `/lib/adapters/index.ts`
**Change**: Added environment variable check to disable Birdeye by default

```typescript
// PHASE B: Birdeye disabled by default due to 401 rate limits
// To re-enable: Set ENABLE_BIRDEYE=true in environment variables
const ENABLE_BIRDEYE = process.env.ENABLE_BIRDEYE === "true"

export const adapters: SourceAdapter[] = [
  { name: "dexscreener", fetch: fetchDexScreener, enabled: true },
  { name: "birdeye", fetch: fetchBirdeyeTokens, enabled: ENABLE_BIRDEYE },
  // ...
]
```

**Impact**: 
- Birdeye adapter is now disabled by default
- Will not be included in `fetchAllSources()` calls
- Will not appear in enabled adapters list
- Will not generate 401 errors during ingestion

### 2. `/app/api/index/route.ts`
**Change**: Made `sourcesEnabled` list dynamic based on actual enabled adapters

```typescript
// Get source enablement from adapter config (dynamic based on enabled adapters)
const { adapters } = await import("@/lib/adapters")
const sourcesEnabled = adapters.filter(a => a.enabled !== false).map(a => a.name)
```

**Impact**:
- `meta.cache.sourcesEnabled` now accurately reflects which adapters are enabled
- With Birdeye disabled, will return `["dexscreener"]` by default
- If Birdeye is re-enabled via env var, will automatically include `"birdeye"`

## Verification

### Before (with Birdeye enabled):
```
[v0] fetchAllSources: Starting with 2 enabled adapters: dexscreener, birdeye
[v0] dexscreener: fetched 87 tokens
[v0] birdeye: FAILED - 401 Unauthorized
```

### After (with Birdeye disabled):
```
[v0] fetchAllSources: Starting with 1 enabled adapters: dexscreener
[v0] dexscreener: fetched 87 tokens
```

## How to Re-Enable Birdeye (If Needed Later)

### Option 1: Environment Variable (Recommended)
Set the environment variable in your deployment:
```bash
ENABLE_BIRDEYE=true
```

This will:
- Enable the Birdeye adapter
- Include it in fetchAllSources() calls
- Show "birdeye" in sourcesEnabled list
- Require valid Birdeye API key to avoid 401 errors

### Option 2: Code Change (Not Recommended)
Alternatively, edit `/lib/adapters/index.ts` and change:
```typescript
const ENABLE_BIRDEYE = true // Force enable
```

## Related Components

### Navbar Source Inference (`/hooks/use-navbar-metadata.ts`)
**No changes needed** - Already only mentions "DexScreener" and "On-chain" in source inference. Never explicitly mentioned Birdeye.

### Sources Indicator (`/components/sources-indicator.tsx`)
**No changes needed** - Still supports birdeye badge (orange "BE") if tokens have birdeye source, but won't appear since adapter is disabled.

### Diagnostics Endpoints
The following endpoints still check for birdeye401 errors for monitoring purposes:
- `/api/diagnostics/rate-limits` - Reports birdeye status
- `/api/index` - Includes `rateLimitFlags.birdeye401` in meta.cache

These are safe to keep as they gracefully handle disabled adapters.

## Testing Checklist

- [x] Birdeye adapter disabled by default
- [x] fetchAllSources only lists dexscreener
- [x] No 401 errors in ingestion logs
- [x] sourcesEnabled list dynamic and accurate
- [x] Can re-enable via ENABLE_BIRDEYE=true
- [x] No UI changes or scoring changes
- [x] No token selection logic changes

## Summary

Birdeye is now completely disabled from the ingestion pipeline by default. It will not run, will not error, and will not appear in source inference. The system continues to function normally with only DexScreener as the active market data source. If Birdeye access is obtained later, simply set `ENABLE_BIRDEYE=true` to re-enable it without code changes.
