# Canonical Token Record (CTR) Implementation

## Overview
Implemented a lightweight normalization layer for token data across SOLRAD pages. This system provides consistent token fields WITHOUT changing existing filtering, scoring, or UI logic.

## Files Added

### 1. `/lib/canonical/canonicalToken.ts` (NEW)
Core module with:
- **`CanonicalToken` interface**: Standardized token shape with mint, symbol, name, scores, timestamps, and membership flags
- **`toCanonicalToken(input: any): CanonicalToken`**: Safely extracts token data from various object shapes
- **`joinCanonicalFlags(...)`**: Adds `inPool`, `hasSignal`, `hasSnapshot` flags based on mint membership

## Files Modified

### 2. `/app/api/index/route.ts`
**Changes:**
- Import canonical functions and blob storage
- Fetch pool/signal/snapshot mint lists (lightweight)
- Normalize tokens through `toCanonicalToken()`
- Apply flags via `joinCanonicalFlags()`
- Add `meta.poolCount`, `meta.signalCount`, `meta.snapshotCount` to response

**NO changes to:**
- Token selection logic
- Filtering logic  
- Response structure (still returns original `indexCache.tokens`)

### 3. `/app/browse/page.tsx`
**Changes:**
- Import `toCanonicalToken`
- Map archived pool tokens through canonical normalization
- Add `_canonical` field with `inPool: true` flag

**NO changes to:**
- Token fetching logic
- Sorting logic
- UI rendering

## What This Does

1. **Dashboard (`/`)**: Receives enriched metadata about pool/signal/snapshot counts but continues using existing live tokens
2. **Browse (`/browse`)**: Pool tokens now carry canonical fields with `inPool=true` flag
3. **Signals**: Ready for canonical fields when needed (not implemented yet to avoid changing existing logic)
4. **Tracker**: Ready for canonical fields when needed (not implemented yet to avoid changing existing logic)

## What This Does NOT Do

✅ **Does NOT filter dashboard tokens by pool**
✅ **Does NOT change ingest routes**
✅ **Does NOT change scoring logic**
✅ **Does NOT change UI layouts**
✅ **Does NOT break existing pages**

## Next Steps (Optional)

If you want to use canonical flags in the future:
1. Pages can access `token._canonical?.inPool` to check membership
2. `/api/signal-outcomes` can attach canonical fields to outcomes
3. `/api/tracker` can attach canonical fields to snapshots

## Testing

1. Dashboard should load normally with same token count
2. Browse page should show pool tokens with canonical fields
3. `/api/index` response should include `meta.poolCount`, etc.
4. No pages should show 0 tokens due to canonical logic

## Key Principles

- **Normalization only**: Maps data to consistent shape
- **No filtering**: Never removes tokens from results
- **Additive flags**: Only adds fields, never removes them
- **Backward compatible**: Existing code continues to work
