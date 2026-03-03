# Helius to QuickNode Migration Guide

## Current Status

✅ **QuickNode is production-ready** with all necessary protections:
- 60-second rate limiting (same as Helius)
- 429 handling (graceful degradation)
- Reduced default limit (50 instead of 100 to save ~50% credits)
- Max 10 DEX resolutions per cycle
- Same KV storage schema as Helius

## Quick Start: Enable QuickNode

### Step 1: Add Environment Variables

Add to your Vercel project or `.env.local`:

```bash
# QuickNode Configuration
QUICKNODE_SOLANA_RPC_URL=https://your-endpoint.quiknode.pro/your-key/
QUICKNODE_MINT_DISCOVERY_ENABLED=true

# Keep Helius disabled (or remove entirely)
HELIUS_MINT_DISCOVERY_ENABLED=false
HELIUS_ENRICHMENT_ENABLED=false
```

### Step 2: Test the Endpoint

```bash
# Test manually (replace with your ADMIN_PASSWORD)
curl -X POST 'https://your-domain.com/api/ingest/new-mints-qn?limit=50&minutesBack=60' \
  -H 'x-admin-password: YOUR_ADMIN_PASSWORD'

# Expected response:
{
  "ok": true,
  "discovered": 25,
  "new": 12,
  "existing": 13,
  "resolved": 8,
  "rateLimited": false
}
```

### Step 3: Update Cron Job

Your existing cron job at `/api/cron/ingest` will automatically use QuickNode when enabled. No changes needed!

The cron will:
1. Check if `QUICKNODE_MINT_DISCOVERY_ENABLED=true`
2. Use `/api/ingest/new-mints-qn` if enabled
3. Fall back to `/api/ingest/new-mints` (Helius) if QuickNode disabled
4. Return error if both disabled

### Step 4: Set Cron Schedule (Recommended)

Use **5-minute intervals** to stay within QuickNode credit limits:

```bash
# Vercel cron config (vercel.json or dashboard)
*/5 * * * *  # Every 5 minutes
```

**Do NOT use 1-minute intervals** - this will consume credits too quickly (12x more usage).

## Credit Usage Comparison

| Interval | Cycles/Day | RPC Calls/Day | Recommended |
|----------|------------|---------------|-------------|
| 1 minute | 1,440 | 72,000-144,000 | ❌ Too high |
| 5 minutes | 288 | 14,400-28,800 | ✅ Recommended |
| 15 minutes | 96 | 4,800-9,600 | ✅ Conservative |
| 30 minutes | 48 | 2,400-4,800 | ✅ Light usage |

### QuickNode Pricing Tiers

Check your plan's included RPC calls:
- **Build Plan**: 500K calls/month (~16.6K/day = 5-min interval OK)
- **Growth Plan**: 5M calls/month (~166K/day = 1-min interval OK)
- **Business Plan**: 50M calls/month (any interval OK)

## Monitoring Guide

### Check Credit Usage

**QuickNode Dashboard:**
1. Go to https://dashboard.quiknode.io/
2. Select your Solana endpoint
3. View "Requests" tab for usage graph
4. Set up usage alerts if needed

### Check Ingestion Status

```bash
# View recent ingestion runs
curl 'https://your-domain.com/api/diagnostics' \
  -H 'x-admin-password: YOUR_ADMIN_PASSWORD'

# Check KV storage for discovered mints
# (requires Redis CLI or Vercel KV dashboard)
```

### Debug Logs

The cron job logs provider info:

```
[v0] CRON ingest: Using QuickNode endpoint
[v0] QN Mint ingestion: Starting... { limit: 50, minutesBack: 60 }
[v0] QN Mint ingestion: Received 50 signatures
[v0] QN Mint ingestion: Found 25 unique mints from 42 transactions
[v0] CRON ingest: Complete { provider: 'QuickNode', discovered: 25, resolved: 8 }
```

## Removing Helius (Optional)

Once QuickNode is verified working (7+ days):

### Step 1: Remove Environment Variables

```bash
# Remove from Vercel project settings:
HELIUS_API_KEY
HELIUS_ENRICHMENT_ENABLED
HELIUS_MINT_DISCOVERY_ENABLED
```

### Step 2: Delete Helius Files (Optional)

If you want to clean up the codebase:

```bash
# Delete Helius adapter
rm lib/adapters/helius.ts

# Delete Helius discovery endpoint
rm app/api/ingest/new-mints/route.ts

# Update ingestion.ts to remove Helius enrichment
# (Search for "enrichWithHelius" and remove those calls)
```

### Step 3: Clean Up Environment Schema

Edit `lib/env.ts` and remove:
```typescript
HELIUS_API_KEY: z.string().optional(),
HELIUS_ENRICHMENT_ENABLED: z.string().optional(),
HELIUS_MINT_DISCOVERY_ENABLED: z.string().optional(),
```

## Troubleshooting

### "Rate limited. Wait 60s"

**Cause:** Multiple cron jobs running or manual triggers too frequent.

**Solution:**
- Check cron schedule (should be ≥5 minutes)
- Ensure only one cron job is configured
- Wait 60 seconds before manual testing

### "QuickNode RPC error"

**Cause:** Invalid endpoint URL or API key.

**Solution:**
- Verify `QUICKNODE_SOLANA_RPC_URL` is correct
- Check QuickNode dashboard for endpoint status
- Ensure endpoint has Solana mainnet access

### High Credit Usage

**Cause:** Too frequent cron schedule or high transaction volume.

**Solution:**
- Increase cron interval (5min → 15min)
- Reduce `limit` parameter (50 → 25)
- Enable signature pre-filtering (requires code changes)

### No Mints Discovered

**Cause:** Time window too narrow or SPL Token Program has low activity.

**Solution:**
- Increase `minutesBack` (60 → 120)
- Check if signatures are being fetched (logs show "Received X signatures")
- Verify transactions are within time window

## Rollback Plan

If QuickNode has issues, you can instantly switch back to Helius:

```bash
# Disable QuickNode
QUICKNODE_MINT_DISCOVERY_ENABLED=false

# Enable Helius
HELIUS_MINT_DISCOVERY_ENABLED=true
HELIUS_API_KEY=your-helius-key
```

The cron will automatically use Helius on next run.

## Advanced: QuickNode Features

QuickNode offers additional RPC methods you could leverage:

### Token Metadata Methods

```typescript
// Get token metadata by mint address
const response = await fetch(quicknodeUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "qn_getTokenMetadataByCAHash",
    params: [mintAddress]
  })
})
```

This could potentially replace Dexscreener API calls, saving external API credits.

### WebSocket Subscriptions

QuickNode supports WebSockets for real-time mint discovery (instead of polling):

```typescript
// Subscribe to SPL Token Program account changes
const ws = new WebSocket(quicknodeWsUrl)
ws.send(JSON.stringify({
  jsonrpc: "2.0",
  id: 1,
  method: "accountSubscribe",
  params: [
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    { encoding: "jsonParsed", commitment: "confirmed" }
  ]
}))
```

This would eliminate cron polling entirely (real-time detection).

## Support

- **QuickNode Docs**: https://www.quicknode.com/docs/solana
- **QuickNode Support**: support@quicknode.com
- **SOLRAD Issues**: Check `/api/diagnostics` endpoint

## Summary

✅ **Recommended Setup:**
- Enable: `QUICKNODE_MINT_DISCOVERY_ENABLED=true`
- Disable: `HELIUS_MINT_DISCOVERY_ENABLED=false`
- Cron: Every 5 minutes
- Monitor: First week closely
- Remove Helius: After successful validation

Your QuickNode implementation is ready for production with all necessary protections in place!
