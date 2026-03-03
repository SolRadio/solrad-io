# Phase C1: Signal Clarity Implementation

## Summary

Added derived, read-only "signal rationale" strings to token UI surfaces using ONLY existing fields. No new data sources, no changes to ingest/scoring/sorting.

## Files Changed

### 1. Helper Function
**File:** `/lib/signals/deriveSignalRationale.ts` (NEW)
- Pure, deterministic function that analyzes token properties
- Returns human-readable rationale string (e.g., "Fresh signal (score ↑)", "Rising momentum")
- Uses only existing fields: scoreNow, priceChange*, volume, liquidity, age, scoreBreakdown
- Priority-based logic with 11 rationale patterns
- Export helper `enrichTokensWithRationale()` for batch processing

### 2. Page Boundary Enrichment

**File:** `/app/page.tsx` (Dashboard)
- Line 133: Import `enrichTokensWithRationale`
- Lines 135-139: Enrich all token arrays (all, trending, active, newEarly, freshSignals)
- Rationale attached as `_rationale` property to each token
- No changes to sorting, filtering, or counts

**File:** `/app/signals/page.tsx` (Signals)
- Lines 324-330: Enrich token data when fetching for drawer
- Calls `deriveSignalRationale()` and attaches to token

### 3. UI Display Components

**File:** `/components/token-card.tsx`
- Lines 76-80: Display `_rationale` as subtle secondary line
- Appears below token name, styled as `text-xs text-primary/70 italic`
- Gracefully falls back to nothing if undefined

**File:** `/components/token-row-mobile.tsx`
- Lines 211-217: Display `_rationale` in mobile token rows
- Appears below token name, styled as `text-[10px] text-primary/70 italic`
- Gracefully falls back to nothing if undefined

### 4. Type Definition

**File:** `/lib/types.ts`
- Lines 124-125: Added optional `_rationale?: string` to TokenScore type
- Marked as UI-only, not persisted
- Prefixed with underscore to indicate derived/transient property

## Rationale Logic (Priority Order)

1. **Fresh signal (score ↑)** - Strong signal state + price rising
2. **Rising momentum** - Price + score improving together
3. **Liquidity surge** - High liquidity score component
4. **Unusual volume** - High volume/liquidity ratio
5. **New listing** - < 48h old with decent score
6. **Active & stable** - High activity, low volatility
7. **Early stage** - < 7 days old with high score
8. **Strong fundamentals** - High health score
9. **Price breakout** - Significant price increase
10. **High quality** - SOLRAD score ≥ 80
11. **Emerging signal** - Building momentum

## No Changes Made To

- ✅ Ingest pipeline (`/lib/ingestion.ts`)
- ✅ KV cache writes (`/lib/storage.ts`)
- ✅ Blob storage
- ✅ Cron jobs
- ✅ Scoring logic (`/lib/scoring-v2.ts`)
- ✅ Token selection thresholds
- ✅ Sorting algorithms
- ✅ Filtering logic
- ✅ Layout structure
- ✅ Routing

## Acceptance Criteria

✅ **Tokens render exactly as before plus rationale text**
- Token cards show rationale below name
- Mobile rows show rationale below name
- No layout shifts or breaking changes

✅ **No change in counts or ordering**
- All tokens still present
- Sorting unchanged
- Filtering unchanged

✅ **Works with cached data**
- Uses existing token fields only
- No API calls required
- Pure client-side computation at render time

✅ **Graceful fallback**
- If `_rationale` is undefined or empty, nothing displays
- No errors or visual artifacts
- Backward compatible

## Testing

1. **Dashboard**: Visit `/` - tokens should show rationale below name
2. **Mobile**: View on mobile - tokens in lists should show rationale
3. **Signals**: Visit `/signals` - drawer should show enriched tokens
4. **Empty State**: Tokens without matching rationale show no extra text
5. **Performance**: No visible performance impact (pure function, memoized)

## Example Output

Token with properties:
- `totalScore: 75`
- `priceChange1h: 12`
- `priceChange5m: 8`

Displays rationale: **"Rising momentum"**

Token with properties:
- `totalScore: 82`
- `liquidity: 150000`
- `scoreBreakdown.liquidityScore: 22`

Displays rationale: **"Liquidity surge"**
