# QuickNode Safe Implementation Summary

## GOAL
Actually utilize QuickNode credits safely without affecting UI or token scoring. Mint discovery only with strict caps and clear server logs.

---

## FILES CHANGED

### 1. `/app/api/ingest/new-mints-qn/route.ts`
**Changes:**
- Added HARD CAPS: `MAX_SIGNATURES = 40`, `MAX_TX = 40`
- Added comprehensive server logs at entry point showing:
  - `provider: "QuickNode"`
  - `discoveryEnabled` (boolean)
  - `rpcUrlPresent` (boolean - NO sensitive data)
  - `maxSignatures` and `maxTransactions` caps
- Changed safe defaults: `minutesBack=30` (was 60), `limit=40` (was 50)
- Enforced MAX_TX cap in transaction loop with early break
- Enhanced final logs with detailed metrics:
  - `signaturesFetched`
  - `transactionsFetched`
  - `mintsDiscovered`
  - `minutesBack`
  - `limit`
  - `new`, `existing`, `resolved`, `rateLimited`
- Improved error handling: Returns `ok:false` with message instead of crashing when RPC URL missing

**Key Log Lines You'll See:**
```
[v0] QN Mint Discovery Configuration: {
  provider: "QuickNode",
  discoveryEnabled: true,
  rpcUrlPresent: true,
  maxSignatures: 40,
  maxTransactions: 40
}

[v0] QN Mint ingestion: Starting with safe parameters {
  limit: 40,
  minutesBack: 30,
  hardCap: 40
}

[v0] QN Mint ingestion: Reached MAX_TX cap 40

[v0] QN Mint ingestion: Complete {
  provider: "QuickNode",
  signaturesFetched: 40,
  transactionsFetched: 40,
  mintsDiscovered: 12,
  minutesBack: 30,
  limit: 40,
  new: 8,
  existing: 4,
  resolved: 6,
  rateLimited: false
}
```

---

### 2. `/app/api/cron/ingest/route.ts`
**Changes:**
- Updated to use conservative parameters when QuickNode is enabled:
  - `limit=40` (was 50)
  - `minutesBack=30` (was 60)
- Wrapped QuickNode call in try-catch to prevent abort on failure
- If QuickNode mint discovery fails, logs warning but CONTINUES cron execution (doesn't abort)
- Returns partial success response instead of 500 error when mint discovery fails
- Still stores lastRunTime even if mint discovery fails

**Key Log Lines You'll See:**
```
[v0] CRON ingest: Using QuickNode endpoint

// If successful:
[v0] CRON ingest: Complete {
  provider: "QuickNode",
  discovered: 12,
  resolved: 6,
  rateLimited: false,
  durationMs: 3456
}

// If QuickNode fails:
[v0] CRON ingest: QuickNode mint discovery failed or returned ok:false {
  error: "...",
  disabled: true/false,
  message: "..."
}
```

---

### 3. `/app/api/health/quicknode/route.ts` (NEW)
**Purpose:** Server-only health check endpoint to verify QuickNode connection

**Functionality:**
- If `QUICKNODE_MINT_DISCOVERY_ENABLED !== 'true'`, returns `{ok:false, disabled:true}`
- If enabled, attempts cheap RPC call (`getLatestBlockhash` - only 1 compute unit)
- Returns `{ok:true, provider:"QuickNode"}` if successful
- Logs verification attempt

**Usage:**
```bash
curl http://localhost:3000/api/health/quicknode
```

**Key Log Lines You'll See:**
```
[v0] QuickNode Health Check: {
  discoveryEnabled: true,
  rpcUrlPresent: true
}

[v0] QuickNode Health Check: SUCCESS - RPC connection verified
```

---

## CREDIT USAGE ESTIMATES

**Per Mint Discovery Run (limit=40, minutesBack=30):**
- `getSignaturesForAddress`: 1 call = ~1 credit
- `getTransaction` (parsed): Up to 40 calls = ~80 credits (2 credits each)
- **Total per run:** ~81 credits

**With Hourly Cron:**
- 24 runs/day × 81 credits = ~1,944 credits/day
- ~58,320 credits/month

**Safety Margin:**
- Hard caps ensure maximum 40 transactions fetched per run
- Rate limiting prevents calls more frequent than 60 seconds
- Conservative minutesBack=30 reduces chance of fetching old signatures

---

## WHAT TO MONITOR

### 1. **Server Logs (Vercel Dashboard)**
Look for these log patterns to confirm QuickNode is being used:

**Successful Run:**
```
✅ [v0] QN Mint Discovery Configuration: { provider: "QuickNode", discoveryEnabled: true, ... }
✅ [v0] QN Mint ingestion: Starting with safe parameters { limit: 40, minutesBack: 30, ... }
✅ [v0] QN Mint ingestion: Complete { signaturesFetched: X, mintsDiscovered: Y, ... }
✅ [v0] CRON ingest: Complete { provider: "QuickNode", discovered: X, resolved: Y, ... }
```

**Failed Run (but non-critical):**
```
⚠️ [v0] CRON ingest: QuickNode mint discovery failed or returned ok:false
⚠️ [v0] CRON ingest: Complete { mintDiscoveryFailed: true, ... }
```

### 2. **QuickNode Dashboard**
- Check "Compute Units Used" graph for activity
- Should see consistent usage (~80 credits/hour if cron is hourly)
- If usage spikes above expected, check logs for issues

### 3. **KV Store**
Check for discovered mints:
```bash
# In Vercel KV or Upstash Console
KEYS mint:*
```

---

## TESTING CHECKLIST

### Before Enabling in Production:

1. **Test Health Check:**
   ```bash
   curl https://your-domain.com/api/health/quicknode
   ```
   Should return `{ok:true, provider:"QuickNode"}` if enabled

2. **Test Manual Mint Discovery:**
   ```bash
   curl -X POST https://your-domain.com/api/ingest/new-mints-qn?limit=10&minutesBack=30 \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```
   Check logs for the detailed configuration and results

3. **Test Cron Integration:**
   Trigger cron manually:
   ```bash
   curl https://your-domain.com/api/cron/ingest \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```
   Verify logs show QuickNode being used

4. **Monitor for 24 hours:**
   - Check QuickNode dashboard for credit usage
   - Verify logs show consistent mint discovery
   - Confirm no errors or rate limit issues

---

## ROLLBACK PLAN

If credit usage is higher than expected or errors occur:

1. **Immediate Kill Switch:**
   Set `QUICKNODE_MINT_DISCOVERY_ENABLED=false` in Vercel environment variables
   
2. **Verify Disabled:**
   ```bash
   curl https://your-domain.com/api/health/quicknode
   ```
   Should return `{ok:false, disabled:true}`

3. **No Code Changes Required:**
   All kill switches are environment-based - no redeployment needed

---

## SUMMARY

**What Changed:**
- Added hard caps (MAX_SIGNATURES=40, MAX_TX=40) to prevent excessive RPC usage
- Added comprehensive server logs with all key metrics (NO sensitive data exposed)
- Set conservative defaults (minutesBack=30, limit=40)
- Made cron resilient - continues even if QuickNode fails
- Created health check endpoint for easy verification

**What Didn't Change:**
- NO UI changes
- NO scoring/ranking changes
- NO token card changes
- NO dashboard filter changes
- DexScreener remains primary for price/liquidity/volume

**Credits Impact:**
- ~81 credits per run (40 signatures + 40 transactions)
- ~58,320 credits/month if running hourly
- Well within QuickNode's free tier or low-cost plans

**Safety:**
- Kill switch still in place (QUICKNODE_MINT_DISCOVERY_ENABLED)
- Hard caps prevent runaway usage
- Rate limiting prevents excessive calls
- Graceful failure handling - never aborts entire ingest
