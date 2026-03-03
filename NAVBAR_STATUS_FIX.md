# Navbar Status Fix - Phase A

## Summary
Updated the navbar LIVE indicator and Data Confidence tooltip to display real data from the API instead of hardcoded values, and removed all Helius references.

## Changes Made

### 1. Created `/hooks/use-navbar-metadata.ts`
- New custom React hook that fetches real metadata from `/api/index`
- Extracts `updatedAt`, `tokenCount`, and infers `sources` from API response
- Auto-refreshes every 30 seconds to stay in sync with dashboard
- Client-side only, no backend changes
- Fallback values on error: `{ updatedAt: null, tokenCount: 0, sources: ["DexScreener"] }`

### 2. Updated `/components/navbar.tsx`
- Added `useNavbarMetadata()` hook to fetch real data
- Updated desktop status indicator (lines 326-359):
  - Sources now display real data: `metadata.sources.join(" + ")` instead of hardcoded "DexScreener + On-chain"
  - Coverage uses real token count: `tokenCount || metadata.tokenCount`
  - Timestamp uses `lastUpdated || metadata.updatedAt || Date.now()` with proper fallback
- Updated tooltip text:
  - Removed all mentions of "Helius"
  - Now says: "Read-only analysis from {metadata.sources.join(", ")} sources"
  - Dynamic source list based on actual data
- Maintained stale indicator logic (unchanged)

## Data Flow

```
/api/index (existing endpoint)
  ↓
useNavbarMetadata hook (client-side fetch + 30s polling)
  ↓
Navbar component (renders real metadata)
  ↓
Desktop XL+ displays: "● LIVE · {time} ago"
                     "Sources: DexScreener + On-chain · Coverage: N tokens"
```

## Source Inference Logic (Phase A - Client-side only)

The hook infers sources from API response data:
- Always includes "DexScreener" (primary market data source)
- Adds "On-chain" if tokens have `pairCreatedAt`, `holders`, or `dexUrl` fields

## Acceptance Test Results

✅ Navbar pill never mentions Helius
✅ Navbar pill displays real token count from API
✅ Navbar sources match actual data sources
✅ Tooltip dynamically lists sources from metadata
✅ No "cannot be accessed on the client" warnings (no env vars used)
✅ Auto-refreshes every 30s to stay current
✅ Graceful fallback if API fails

## Phase A Compliance

- ✅ UI-only changes, no backend modifications
- ✅ No changes to ingest, scoring, filtering, or canonical logic
- ✅ Reuses existing `/api/index` endpoint (no new API routes)
- ✅ Client-side data fetching only
- ✅ Additive only - no features removed
- ✅ No environment variable changes

## Next Steps (Optional - Phase B)

If more detailed source tracking is needed:
- Add `sources` field to API response with explicit source list
- Add `sourcesUsed` array to index API metadata
- Track per-token source attribution in database
- Add source quality metrics to tooltip

## Notes

- The navbar now stays in sync with the dashboard DataFreshnessBar
- Both components show the same metadata within the same refresh window
- The 30-second polling ensures the navbar reflects current data without manual refresh
- Fallback logic prevents crashes if API is temporarily unavailable
