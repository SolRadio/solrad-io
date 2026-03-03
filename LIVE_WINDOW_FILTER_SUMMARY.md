# Live Window Filter Implementation Summary

## Overview
Implemented UI-level freshness filtering to prevent stale tokens from re-surfacing in LIVE dashboard sections without modifying any backend logic.

## Implementation Details

### 1. Created Helper Function
**File:** `/lib/filters/liveWindowFilter.ts`

- `LIVE_WINDOW_MS = 5 * 60 * 1000` (5 minutes)
- `filterLiveTokens()` - Filters tokens to only include those with `lastUpdatedAt` within the live window
- `getOldestTokenAge()` - Utility to get age of oldest token
- `formatAge()` - Format age to human-readable string

**Logic:**
```typescript
return tokens.filter(token => {
  if (!token.lastUpdatedAt) return false
  const age = Date.now() - token.lastUpdatedAt
  return age <= LIVE_WINDOW_MS
})
```

### 2. Applied Filter at Page Boundary
**File:** `/app/page.tsx` (lines 134-160)

**Filter Applied To:**
- ✅ Trending tokens
- ✅ Active Trading tokens
- ✅ New/Early tokens
- ✅ Fresh Signals tokens

**NOT Applied To:**
- ❌ Token Pool (all tokens) - remains unfiltered
- ❌ Drawer views
- ❌ Search results
- ❌ Historical views

**Debug Logging:**
```typescript
console.log("[v0] Live window filter applied:", {
  trending: `${trendingRaw.length} → ${trending.length}`,
  active: `${activeRaw.length} → ${active.length}`,
  newEarly: `${newEarlyRaw.length} → ${newEarly.length}`,
  freshSignals: `${freshSignalsRaw.length} → ${freshSignals.length}`,
})
```

### 3. Added UI Indicators
**Files Modified:**
- `/components/desktop-terminal.tsx`
- `/components/tablet-terminal.tsx`
- `/components/mobile-terminal.tsx`

**Indicator:**
```
🟢 LIVE DATA UPDATED WITHIN LAST 5 MINUTES
```

- Green pulsing dot + uppercase text
- Positioned at top of terminal components
- Subtle, non-intrusive design
- Mobile version: "Live data • Last 5 min" (condensed)

## Behavior

### What Happens
1. When tokens are fetched from `/api/index`:
   - All tokens are converted and enriched normally
   - Token Pool receives ALL tokens (no filter)
   - LIVE sections receive only tokens with `lastUpdatedAt <= 5 minutes ago`

2. If a token becomes stale (>5 minutes old):
   - It disappears from LIVE sections (Trending, Active, New/Early, Fresh Signals)
   - It remains in Token Pool
   - It's still searchable
   - It's still in storage (KV/Blob)

3. When DexScreener refreshes and updates `lastUpdatedAt`:
   - Token automatically reappears in LIVE sections
   - No manual intervention needed

### Expected Count Changes
- **Before:** All sections show full counts from backend
- **After:** LIVE sections may show reduced counts temporarily
- **Token Pool:** Always shows full count (unfiltered)
- **Counts shrinking is EXPECTED** - means filter is working

## No Backend Changes

### What Was NOT Modified
- ❌ Ingest logic (`/lib/ingestion.ts`)
- ❌ Cron jobs
- ❌ KV storage
- ❌ Blob storage
- ❌ Scoring logic
- ❌ `getTrackedTokens()`
- ❌ `buildTokenIndex()`
- ❌ Adapters (DexScreener, etc.)

### Data Integrity
- **No tokens are deleted**
- **No storage is modified**
- **All data remains intact**
- Filter is purely presentational

## Testing

### Verification Steps
1. Check console logs for filter output:
   ```
   [v0] Live window filter applied: {
     trending: "45 → 42",
     active: "30 → 28",
     ...
   }
   ```

2. Verify UI indicator appears on all terminal views
3. Confirm Token Pool count remains unchanged
4. Wait 5+ minutes and verify stale tokens disappear from LIVE sections
5. Trigger refresh and verify tokens reappear

### Edge Cases Handled
1. **Token has no `lastUpdatedAt`:** Excluded from LIVE sections
2. **All tokens are stale:** LIVE sections show empty (expected)
3. **DexScreener is down:** Tokens age out naturally, counts decrease
4. **Token Pool always shows data:** Users can still see and search all tokens

## Acceptance Criteria

✅ **Old tokens no longer re-surface as trending**
- Tokens with `lastUpdatedAt > 5 minutes` are filtered out

✅ **No tokens are deleted**
- All data remains in storage

✅ **Counts may shrink temporarily (expected)**
- LIVE sections show reduced counts when data is stale

✅ **When DexScreener refreshes, tokens reappear automatically**
- Filter is time-based, updates automatically

✅ **No backend behavior changes**
- Pure UI-level filtering

## Summary

This implementation provides a clean, UI-level solution to prevent stale tokens from appearing in LIVE dashboard sections. The filter is:

- **Non-destructive** - No data deletion
- **Automatic** - Updates based on timestamps
- **Transparent** - Debug logs and UI indicators
- **Scoped** - Only affects LIVE sections, not Token Pool
- **Backend-agnostic** - No changes to ingest, scoring, or storage

Users will see fresher, more relevant data in LIVE sections while maintaining full access to all tokens through Token Pool and search.
