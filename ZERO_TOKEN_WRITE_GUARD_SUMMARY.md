# Zero-Token Write Guard + 429 Backoff Implementation Summary

## Overview
Implemented critical fix to prevent SOLRAD from overwriting good cached data with empty/minimal token sets when sources are rate-limited or experiencing errors. This ensures the dashboard always shows last-known-good data instead of entering "warming radar" state.

## Files Changed

### 1. `/lib/adapters/dexscreener.ts`
**Changes:** Added 429 rate limit detection to all three fetch endpoints

**What it does:**
- Detects HTTP 429 (Too Many Requests) responses from DexScreener API
- Instead of attempting to parse HTML error pages as JSON, immediately returns cached data
- Falls back to empty array only if no cache exists
- Logs clear warning messages for monitoring

**429 Detection Points:**
1. Token boosts top endpoint
2. Trending pairs endpoint  
3. Latest boosts endpoint

**Log Lines to Expect:**
```
[v0] DexScreener: Rate limited (429) on top boosts endpoint
[v0] DexScreener: Returning cached data due to 429
```

### 2. `/lib/ingestion.ts`
**Changes:** Added zero-token write guard and enhanced degraded state handling

**What it does:**

#### A) Zero-Token Write Guard (NEW)
- Checks if freshly ingested token count is below minimum threshold (5 tokens)
- If yes, AND there is existing cached data with > 0 tokens
- THEN: Skips cache overwrite and preserves last-good data
- Sets ingestion status to "rate_limited" with metadata
- Returns success but with degraded flag

**Log Lines to Expect:**
```
[v0] WriteGuard: Skipping persist of 0-token ingest; preserving last-good cache (127 tokens)
```

#### B) Enhanced Degraded Detection
- Improved existing degraded detection logic
- Now includes `lastGoodCount` in status metadata
- Uses consistent "WriteGuard" prefix for log messages

**Log Lines to Expect:**
```
[v0] WriteGuard: DEGRADED source detected (8 tokens, 25% healthy). Preserving last-good cache (127 tokens)
```

## How It Works

### Normal Flow (No Rate Limiting):
1. DexScreener fetch → 200 OK → Parse data → Score tokens
2. Validation passes (50+ tokens, healthy ratio) → Cache updated
3. Dashboard shows fresh data

### Rate Limited Flow (429 Response):
1. DexScreener fetch → 429 Too Many Requests
2. Adapter detects 429 → Returns cached data instead of empty array
3. Ingestion receives cached tokens → Proceeds with scoring
4. OR if fetch returns 0 tokens → Write guard activates
5. Write guard detects previous good cache → Skips persist
6. Dashboard continues showing last-good tokens
7. Status set to "rate_limited" for monitoring

### Zero Token Flow (Source Failure):
1. DexScreener fetch → Network error or empty response
2. Adapter returns empty array []
3. Scoring produces 0 valid tokens
4. **Write Guard Activates**
5. Checks for previous cached data
6. If previous cache exists with > 0 tokens:
   - Skips all cache overwrites (main, 1-hour fallback, 4-hour blob)
   - Preserves last-good data
   - Sets status to "rate_limited"
   - Returns success with degraded flag
7. Dashboard shows last-good data, never enters "warming" state

## Expected Log Sequence During 429 Event

```
[v0] Starting token ingestion...
[v0] DexScreener: fetching token boosts...
[v0] DexScreener: Rate limited (429) on top boosts endpoint
[v0] DexScreener: Returning cached data due to 429
[v0] DexScreener: cache hit (array), count: 127
[v0] Enriching top 15 tokens with Helius...
[v0] Computing signal states for 127 tokens...
[v0] Signal states computed
[v0] Ingestion complete: 127 tokens, 8452ms
```

OR if no cache and 0 tokens returned:

```
[v0] Starting token ingestion...
[v0] DexScreener: fetching token boosts...
[v0] DexScreener: Rate limited (429) on trending endpoint
[v0] DexScreener: Returning cached data due to 429
[v0] DexScreener: No candidates after boost + fallback discovery
[v0] WriteGuard: Skipping persist of 0-token ingest; preserving last-good cache (127 tokens)
```

## Configuration

### Minimum Token Threshold
```typescript
const MINIMUM_TOKEN_THRESHOLD = 5 // Absolute minimum to consider valid
```

Can be adjusted in `/lib/ingestion.ts` if needed, but 5 is conservative enough to catch rate limiting while allowing legitimate small datasets.

### Existing Degraded Thresholds (Unchanged)
```typescript
const MIN_TOKENS = 15 // Minimum for healthy ingestion
const MIN_HEALTHY_TOKENS_RATIO = 0.3 // 30% must have valid price/liquidity/volume
```

## Testing

### To Simulate 429 Rate Limiting:
1. Temporarily modify DexScreener adapter to force 429:
   ```typescript
   if (true) { // Force rate limit
     return []
   }
   ```

2. Trigger ingestion: `POST /api/ingest/cycle`

3. Verify logs show:
   - "WriteGuard: Skipping persist of 0-token ingest"
   - Dashboard still shows last-good tokens
   - Status endpoint shows "rate_limited"

4. Remove test code

### To Verify 429 Detection:
1. Monitor production logs during actual rate limiting
2. Look for log pattern above
3. Confirm dashboard never shows "warming radar" state
4. Confirm `/api/index` status returns "degraded" with reason "rate_limited"

## Monitoring

### Key Metrics to Track:
1. Ingestion status: `GET /api/diagnostics`
   - Look for `status: "rate_limited"` or `status: "degraded"`
   - Check `lastGoodIngestAt` timestamp

2. Token count consistency:
   - Dashboard should never drop to 0 tokens
   - Count should stay stable during rate limit events

3. Log patterns:
   - Frequency of "WriteGuard" messages
   - Frequency of "429" messages
   - Time to recovery after rate limit

## Rollback Instructions

If this implementation causes issues:

1. Revert changes to `/lib/adapters/dexscreener.ts`:
   - Remove all 429 detection blocks
   - Keep original `if (topRes.ok)` logic

2. Revert changes to `/lib/ingestion.ts`:
   - Remove "ZERO-TOKEN WRITE GUARD" section
   - Restore original flow

3. Redeploy previous version

## Future Enhancements

1. **Exponential Backoff**: Add retry logic with exponential backoff for 429 responses
2. **Rate Limit Headers**: Parse `Retry-After` header from 429 responses
3. **Multiple Source Fallback**: If DexScreener is down, attempt other sources before giving up
4. **Alerting**: Send notifications when write guard activates repeatedly
5. **Metrics Dashboard**: Track write guard activation frequency and duration

## Status

✅ Implemented
✅ Tested locally
✅ Ready for production deployment
⏳ Monitoring in production (ongoing)
