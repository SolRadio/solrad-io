# Token Archive Implementation Summary

## Problem Solved
Tokens were disappearing from "All Tokens" and Watchlist when they fell out of the live ingestion snapshot. This created a poor user experience where saved tokens would vanish from view.

## Solution: Persistent Token Archive

A persistent token archive stored in Vercel Blob (`state.json`) that preserves every token ever seen by SOLRAD above a score threshold (≥50).

---

## Files Changed

### 1. `/lib/types.ts`
**Added:** `ArchivedToken` interface
- Minimal fields for storage efficiency
- Tracks: lastScore, maxScore, lastSeenAt, firstSeenAt
- Stores last known metrics: price, volume, liquidity, etc.

### 2. `/lib/blob-storage.ts`
**Added:** 
- `archiveByMint` field to `BlobState` interface
- `upsertArchiveTokens(tokens, thresholdScore)` function
- Archive eviction policy (max 5000 tokens, removes stale tokens with maxScore < 60 and lastSeen > 30 days)

**Updated:**
- `getDefaultState()` to initialize empty archive
- Import `ArchivedToken` type

### 3. `/lib/ingestion.ts`
**Added:**
- Archive upsert call after successful ingestion
- Try/catch wrapper (non-fatal if archive fails)
- Only tokens with score ≥ 50 are archived

### 4. `/app/api/tokens/archive/route.ts` (NEW)
**Created:** Archive API endpoint
- `GET /api/tokens/archive`
- Query params: `minScore`, `sort`, `page`, `pageSize`, `q` (search)
- Returns paginated archived tokens
- 5-minute cache with stale-while-revalidate

### 5. `/app/browse/page.tsx`
**Changed:** Data source from `/api/index` to `/api/tokens/archive`
- Fetches up to 5000 archived tokens
- Sorts by maxScore by default
- Converts archived tokens to `TokenScore` format for display
- No UI/layout changes

### 6. `/app/watchlist/page.tsx`
**Added:**
- `archiveMap` state to store archive lookup
- Archive fetch on mount
- Three-tier fallback logic:
  1. Prefer live token from current index
  2. Fallback to archived token
  3. Last resort: placeholder token with "Not Currently Indexed" badge

**Behavior:**
- Watchlist items NEVER disappear from UI
- Stale/archived tokens show with "⏸️ Not Currently Indexed" badge
- Placeholder tokens display mint address when even archive is missing

---

## Key Features

### 1. Automatic Archiving
- Every successful ingestion upserts eligible tokens (score ≥ 50)
- Tracks max score ever achieved
- Updates lastSeenAt timestamp

### 2. Eviction Policy
- Maximum 5000 archived tokens
- Removes oldest tokens with:
  - `lastSeenAt` > 30 days old
  - `maxScore` < 60
- Prevents unbounded growth

### 3. Fallback Chain (Watchlist)
\`\`\`
Live Token (from /api/index)
  ↓ (if missing)
Archive Token (from archive map)
  ↓ (if missing)
Placeholder Token (with "Not Indexed" badge)
\`\`\`

### 4. Performance Optimizations
- Archive reads cached in memory (5-minute TTL)
- Blob writes only during ingestion (not on every request)
- Archive map built once on page load
- Pagination for large archive queries

---

## API Usage

### Fetch Archive Tokens
\`\`\`typescript
GET /api/tokens/archive?minScore=50&sort=maxScore&page=1&pageSize=50&q=solana

Response:
{
  tokens: ArchivedToken[],
  total: number,
  page: number,
  pageSize: number,
  updatedAt: string
}
\`\`\`

### Sort Options
- `lastSeen`: Most recently seen tokens first (default)
- `maxScore`: Highest max score ever achieved
- `lastScore`: Highest last known score

---

## Constraints Followed

✅ No existing layout/styling changes  
✅ No database introduced (uses existing blob storage)  
✅ No breaking changes to existing endpoints  
✅ TypeScript-safe with minimal `any` usage  
✅ Non-fatal archive failures (won't break ingestion)  
✅ Performance-safe (no blob read on every request)  

---

## Testing Checklist

- [ ] Deploy and trigger ingestion
- [ ] Verify archive upsert in logs: "Archive updated: X tokens upserted"
- [ ] Check `/api/tokens/archive` returns tokens
- [ ] Verify "All Tokens" page shows archived tokens
- [ ] Add token to watchlist, wait for it to fall out of live index
- [ ] Confirm watchlist shows archived token with stale badge
- [ ] Test placeholder fallback (add non-existent mint to watchlist)
- [ ] Verify eviction policy after 5000+ tokens archived

---

## Deployment Notes

1. **First Deploy**: Archive will be empty until first ingestion completes
2. **Blob Storage**: Uses existing `solrad/state.json` - no new storage needed
3. **Backwards Compatible**: Archive is additive - no breaking changes
4. **Gradual Rollout**: Old pages still work, archive builds over time

---

## Success Metrics

✅ **Problem:** Tokens disappear from "All Tokens"  
✅ **Solution:** Archive persists all tokens with score ≥ 50  

✅ **Problem:** Watchlist items vanish when token falls out of index  
✅ **Solution:** Three-tier fallback ensures watchlist items never disappear  

✅ **Problem:** No historical record of past tokens  
✅ **Solution:** Archive tracks maxScore, firstSeen, lastSeen for every token  

✅ **Performance:** Archive reads cached, writes only during ingestion  
✅ **Safety:** Non-fatal failures, won't break existing features
