# Live Window Filter Bug Fix

## Problem
The Live Window Filter was causing ALL dashboard sections (Trending, Active, New/Early, Fresh Signals) to show 0 tokens, blanking the entire dashboard. Debug logs showed:
```
[v0] Live window filter applied: {"trending":"15 → 0","active":"14 → 0","newEarly":"4 → 0","freshSignals":"35 → 0"}
```

## Root Causes

### 1. Wrong Field Name
The filter was checking `token.lastUpdatedAt` which doesn't exist on TokenScore.
The actual field is `token.lastUpdated` (no "At" suffix).

### 2. No Timestamp Fallback Logic
Tokens had various timestamp fields but the filter only checked one field, causing all tokens without that specific field to be filtered out.

### 3. No Empty Section Prevention
If filtering resulted in 0 tokens, sections would be completely empty even though data existed.

## Solution

### 1. Multi-Field Timestamp Extraction (`/lib/filters/liveWindowFilter.ts`)

Added `extractTimestamp()` helper that tries multiple fields in order:
- `lastUpdatedAt` (for future compatibility)
- `lastUpdated` (actual field on TokenScore)
- `updatedAt`
- `updated`
- `sourceUpdatedAt`
- `_canonical?.lastUpdatedAt`
- `_canonical?.firstSeenAt`

Handles both:
- Number timestamps (milliseconds)
- ISO string timestamps (parsed via Date.parse)

**Fail-open policy**: If NO valid timestamp is found, returns `true` (includes the token). This prevents blanking due to missing metadata.

### 2. Fallback Logic in `/app/page.tsx`

Added safety check for each section:
```typescript
const trendingFiltered = filterLiveTokens(trendingRaw)
const trending = (trendingFiltered.length === 0 && trendingRaw.length > 0) 
  ? trendingRaw  // Use original if filtered is empty
  : trendingFiltered
```

This ensures sections NEVER go completely empty when original data exists.

### 3. UI Indicator Updates

Added `liveWindowFallback` state to track when fallback is active:
- **Green pulsing dot**: "Live data updated within last 5 minutes" (normal)
- **Yellow solid dot**: "Live window unavailable (timestamp missing)" (fallback)

Updated components:
- `/components/desktop-terminal.tsx` - Shows fallback indicator
- `/components/tablet-terminal.tsx` - Shows fallback indicator
- `/app/page.tsx` - Tracks and passes fallback state

## Testing

### Before Fix
```
[v0] Live window filter applied: {
  "trending": "15 → 0",
  "active": "14 → 0",
  "newEarly": "4 → 0",
  "freshSignals": "35 → 0"
}
```
Result: Blank dashboard

### After Fix (Expected)
```
[v0] Live window filter applied: {
  "trending": "15 → 15 (fallback)",
  "active": "14 → 14 (fallback)",
  "newEarly": "4 → 4 (fallback)",
  "freshSignals": "35 → 35 (fallback)"
}
```
Result: Dashboard shows all tokens, yellow indicator shows fallback mode

## Files Changed

1. `/lib/filters/liveWindowFilter.ts` - Added timestamp extraction logic
2. `/app/page.tsx` - Added fallback prevention and state tracking
3. `/components/desktop-terminal.tsx` - Added fallback indicator
4. `/components/tablet-terminal.tsx` - Added fallback indicator

## Behavior

- **Normal mode**: Tokens with valid timestamps < 5min old pass through
- **Fallback mode**: When timestamps missing or filtered result is empty, shows all tokens with yellow indicator
- **Never blanks**: Dashboard always shows tokens when data exists
- **No backend changes**: Purely UI-level filtering, no data is deleted
