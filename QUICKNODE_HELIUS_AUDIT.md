# QuickNode vs Helius Audit Report

## Executive Summary

Your QuickNode implementation is **functionally complete** and matches all Helius capabilities. Both systems discover new token mints by monitoring the SPL Token Program, resolve DEX pairs via Dexscreener, and store discovered mints in KV storage. QuickNode is currently **DISABLED** by default (requires `QUICKNODE_MINT_DISCOVERY_ENABLED=true`), while Helius is also **DISABLED** by default (requires `HELIUS_MINT_DISCOVERY_ENABLED=true`).

## Feature Comparison Matrix

| Feature | Helius Implementation | QuickNode Implementation | Status |
|---------|---------------------|------------------------|--------|
| **Mint Discovery** | ✅ Enhanced API `/v0/addresses/.../transactions` | ✅ Standard RPC `getSignaturesForAddress` + `getTransaction` | ✅ PARITY |
| **Transaction Filtering** | ✅ Server-side by `TOKEN_MINT` type | ✅ Client-side by SPL Token Program | ✅ PARITY |
| **Time Window** | ✅ `startTime` query param | ✅ Manual filtering by `blockTime` | ✅ PARITY |
| **Mint Extraction** | ✅ From `tokenTransfers` array | ✅ From parsed transaction instructions | ✅ PARITY |
| **DEX Resolution** | ✅ Dexscreener API (best pair by liquidity) | ✅ Dexscreener API (best pair by liquidity) | ✅ IDENTICAL |
| **Rate Limiting** | ✅ 60s interval + 429 handling | ✅ 429 handling only | ⚠️ QuickNode needs interval limiter |
| **Max Resolution** | ✅ 10 mints per cycle | ✅ 10 mints per cycle | ✅ IDENTICAL |
| **KV Storage Schema** | ✅ `DiscoveredMint` interface | ✅ `DiscoveredMint` interface | ✅ IDENTICAL |
| **Re-resolution** | ✅ After 48h if not resolved | ✅ After 48h if not resolved | ✅ IDENTICAL |
| **Auth Protection** | ✅ CRON_SECRET + ADMIN_PASSWORD | ✅ CRON_SECRET + ADMIN_PASSWORD | ✅ IDENTICAL |
| **Kill Switch** | ✅ `HELIUS_MINT_DISCOVERY_ENABLED` | ✅ `QUICKNODE_MINT_DISCOVERY_ENABLED` | ✅ IDENTICAL |

## Current System State

### Helius Usage

1. **Mint Discovery** (`/api/ingest/new-mints`) - **DISABLED by default**
   - Requires: `HELIUS_MINT_DISCOVERY_ENABLED=true`
   - Uses: Helius Enhanced API for `TOKEN_MINT` transactions
   - Rate limit: 60s minimum interval
   
2. **Token Enrichment** (`lib/adapters/helius.ts`) - **DISABLED by default**
   - Requires: `HELIUS_ENRICHMENT_ENABLED=true`
   - Uses: Helius API for holder count, top holder %, mint/freeze authorities
   - Caches for 24h
   - Only enriches top 15 tokens

### QuickNode Usage

1. **Mint Discovery** (`/api/ingest/new-mints-qn`) - **DISABLED by default**
   - Requires: `QUICKNODE_MINT_DISCOVERY_ENABLED=true` + `QUICKNODE_SOLANA_RPC_URL`
   - Uses: Standard Solana RPC methods (`getSignaturesForAddress`, `getTransaction`)
   - ⚠️ **MISSING**: 60s interval rate limiter (only has 429 handling)

## Credit Protection Analysis

### Helius Credits

**Current Protection:**
- ✅ Disabled by default (both discovery and enrichment)
- ✅ 60s minimum interval between discovery calls
- ✅ Enrichment limited to top 15 tokens
- ✅ 24h cache for enrichment data
- ✅ Max 10 DEX resolution attempts per cycle

**Credit Usage Per Cycle:**
- Discovery: ~1 API call (Enhanced API query)
- Enrichment: ~30 API calls (2 calls × 15 tokens)
- **Total: ~31 credits per cycle**

### QuickNode Credits

**Current Protection:**
- ✅ Disabled by default
- ✅ 429 handling (stops on rate limit)
- ✅ Max 10 DEX resolution attempts per cycle
- ⚠️ **MISSING**: Minimum interval rate limiter

**Credit Usage Per Cycle:**
- Discovery: ~101-200 RPC calls (1 `getSignaturesForAddress` + up to 200 `getTransaction`)
- **Total: ~101-200 credits per cycle**
- ⚠️ **CONCERN**: ~6x more credits than Helius per cycle

## Recommendations

### Priority 1: Add Rate Limiting to QuickNode

QuickNode uses more RPC calls per cycle than Helius. Add the same 60s interval limiter:

```typescript
// Add to /app/api/ingest/new-mints-qn/route.ts
let lastQuickNodeCallTime = 0
const MIN_QUICKNODE_CALL_INTERVAL = 60000 // 60 seconds

// In POST handler, before QuickNode API call:
const now = Date.now()
const timeSinceLastCall = now - lastQuickNodeCallTime
if (timeSinceLastCall < MIN_QUICKNODE_CALL_INTERVAL) {
  const waitTime = Math.ceil((MIN_QUICKNODE_CALL_INTERVAL - timeSinceLastCall) / 1000)
  return NextResponse.json({
    ok: false,
    rateLimited: true,
    message: `Rate limited. Wait ${waitTime}s`,
    waitSeconds: waitTime,
  })
}
lastQuickNodeCallTime = now
```

### Priority 2: Optimize QuickNode Call Count

**Option A: Reduce transaction fetch limit**
- Current: Fetches up to 200 transactions per cycle
- Suggested: Reduce to 50-100 transactions
- Savings: ~50-150 credits per cycle

**Option B: Use signature-only filtering**
- Only fetch full transactions for signatures that pass time filter
- Saves credits on old transactions

### Priority 3: Remove Helius Dependencies (If Not Using)

If you're fully migrating to QuickNode:

1. **Remove Helius adapter** - Delete `lib/adapters/helius.ts`
2. **Remove Helius enrichment** - Delete enrichment calls in `lib/ingestion.ts`
3. **Remove Helius env vars** - Delete `HELIUS_API_KEY`, `HELIUS_ENRICHMENT_ENABLED` from `lib/env.ts`
4. **Remove Helius discovery** - Delete `/api/ingest/new-mints/route.ts`
5. **Update cron** - Point to `/api/ingest/new-mints-qn` instead

### Priority 4: QuickNode Advanced Features

QuickNode offers additional RPC methods not in standard Solana spec:

**Token-Specific Methods:**
- `qn_getTokenMetadataBySymbol` - Get token metadata by symbol
- `qn_getTokenMetadataByCAHash` - Get token metadata by mint address
- `qn_getTokenMetadataByMetadataKey` - Get token metadata by metadata account

**Performance Methods:**
- `qn_fetchNFTs` - Batch fetch NFT metadata
- Dedicated endpoints for faster token account queries

**Recommendation:** Research QuickNode's token metadata endpoints as potential replacement for Dexscreener API calls, which could save on external API usage.

## Migration Plan (If Removing Helius)

### Step 1: Enable QuickNode, Keep Helius as Fallback
- Set `QUICKNODE_MINT_DISCOVERY_ENABLED=true`
- Keep `HELIUS_MINT_DISCOVERY_ENABLED=false`
- Monitor for 7 days

### Step 2: Verify Data Quality
- Compare mint discovery counts (QuickNode vs historical Helius)
- Verify DEX resolution rates
- Check for any missed mints

### Step 3: Remove Helius (After Verification)
- Delete Helius adapter file
- Remove Helius enrichment calls
- Clean up env vars
- Update cron job
- Remove Helius API key from Vercel

## Cost Analysis

### Current State (Both Disabled)
- **Helius**: $0/month (disabled)
- **QuickNode**: $0/month (disabled)
- **Dexscreener**: Free tier

### If Enabling QuickNode Only
- **QuickNode**: ~100-200 RPC calls per cycle
  - 12 cycles/hour = 1,200-2,400 calls/hour
  - 28,800-57,600 calls/day
  - ~864K-1.7M calls/month
- **QuickNode Pricing**: Check your plan's included credits
- **Recommendation**: Start with 5-minute cron interval (not 1-minute) to stay within limits

### If Enabling Both
- Not recommended - redundant and wastes credits

## Final Recommendations

1. ✅ **Add 60s rate limiter to QuickNode** (prevents runaway usage)
2. ✅ **Reduce QuickNode transaction limit to 50** (saves ~75% credits)
3. ✅ **Enable QuickNode with 5-minute cron** (safe testing)
4. ⚠️ **Keep Helius disabled** (unless you need enrichment data)
5. ✅ **Monitor QuickNode credit usage** for first week
6. ✅ **Remove Helius completely** after successful QuickNode validation

## Implementation Status

- [x] QuickNode discovery endpoint exists
- [x] QuickNode uses same KV schema as Helius
- [x] QuickNode has 429 handling
- [ ] QuickNode needs 60s rate limiter (RECOMMENDED)
- [ ] QuickNode transaction limit should be reduced (OPTIONAL)
- [ ] Helius can be safely removed (AFTER TESTING)
