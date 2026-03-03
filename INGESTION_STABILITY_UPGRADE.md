# SOLRAD Ingestion Stability Upgrade

## Changes Implemented

### A) Ingestion Guard (lib/ingestion.ts)
- Added `MIN_TOKENS = 80` constant - minimum tokens required for healthy ingestion
- Added `MIN_HEALTHY_TOKENS_RATIO = 0.5` - at least 50% tokens must have valid price/liquidity/volume
- Before overwriting cache, validates new ingestion data:
  - Checks if token count >= 80
  - Checks if healthy ratio >= 50%
- If degraded AND previous cache exists:
  - Keeps previous cache (DOES NOT OVERWRITE)
  - Sets degraded metadata with reason ("source_shrink" or "unhealthy_data")
  - Returns success=true but degraded=true
- If healthy OR no previous cache:
  - Proceeds with normal cache update
  - Clears degraded status

### B) Fallback Discovery (lib/adapters/dexscreener.ts)
- After fetching DexScreener boosts, checks if candidates < 80
- If too few candidates, activates fallback:
  1. Calls `/api/ingest/new-mints?limit=150&minutesBack=120`
  2. Fetches resolved mints from KV storage (mint:* keys)
  3. Dedupes and adds to candidate list
  4. Continues with normal batch enrichment
- Gracefully handles fallback errors (continues with boost candidates only)
- Logs all fallback activity for debugging

### C) New/Early Query Fix (lib/intel/queries.ts)
- Changed from "pairCreatedAt ONLY" to "pairCreatedAt OR firstSeenAt fallback"
- Filter logic:
  \`\`\`ts
  const tokenAge = token.pairCreatedAt || token.firstSeenAt
  if (!tokenAge) return false // Must have some age indicator
  \`\`\`
- Sort logic updated to use same fallback:
  \`\`\`ts
  const ageA = a.pairCreatedAt || a.firstSeenAt || 0
  const ageB = b.pairCreatedAt || b.firstSeenAt || 0
  \`\`\`
- Ensures New/Early column never goes empty if tokens exist

### D) API Status (app/api/index/route.ts)
- Reads `INGESTION_STATUS` from storage
- Returns in response:
  - `status: "ready" | "degraded" | "warming"`
  - `degradedReason?: "source_shrink" | "unhealthy_data"`
  - `lastGoodIngestAt?: string` (ISO timestamp)
- Frontend can show degraded status message while still displaying tokens

### E) Storage Key Addition (lib/storage.ts)
- Added `INGESTION_STATUS: "solrad:ingestionStatus"` to CACHE_KEYS
- Used to persist degraded state across requests

## Testing Checklist

### Manual Testing
1. **Normal Operation**
   - [ ] Trigger ingestion with healthy data
   - [ ] Verify status = "ready"
   - [ ] Verify New/Early column has tokens

2. **Degraded Source (< 80 tokens)**
   - [ ] Mock DexScreener to return < 80 candidates
   - [ ] Verify ingestion guard activates
   - [ ] Verify previous cache retained
   - [ ] Verify status = "degraded", reason = "source_shrink"
   - [ ] Verify frontend still shows tokens (from last good cache)

3. **Fallback Discovery**
   - [ ] Mock DexScreener to return 40 candidates
   - [ ] Verify fallback discovery activates
   - [ ] Verify new-mints endpoint called
   - [ ] Verify final candidate count > 40 (supplemented)
   - [ ] Verify tokens ingested successfully

4. **New/Early Fallback**
   - [ ] Check tokens with pairCreatedAt = null but firstSeenAt = valid
   - [ ] Verify they appear in New/Early if < 30 days old
   - [ ] Verify tokens with both use pairCreatedAt (preferred)

5. **API Response**
   - [ ] GET /api/index with healthy data → status = "ready"
   - [ ] GET /api/index with degraded data → status = "degraded", degradedReason provided
   - [ ] Verify all column counts correct

## Expected Outcomes

✅ Token pool never collapses below 80 tokens (unless no previous cache exists)
✅ New/Early column never empty if tokens exist (uses firstSeenAt fallback)
✅ Fresh Signals always has candidates (supplemented by new-mints when needed)
✅ Frontend displays degraded status but continues functioning
✅ Rate limits respected (batched enrichment, graceful 429 handling)

## Rollback Plan

If issues occur, revert these files:
1. lib/ingestion.ts
2. lib/adapters/dexscreener.ts  
3. lib/intel/queries.ts
4. app/api/index/route.ts
5. lib/storage.ts (remove INGESTION_STATUS key)

Original behavior:
- No ingestion guard (always overwrites cache)
- No fallback discovery (DexScreener boosts only)
- New/Early requires pairCreatedAt (strict)
- API returns "ready" or "warming" only
