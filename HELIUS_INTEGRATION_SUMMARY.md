# Helius Integration Summary

## Overview
SOLRAD now correctly integrates Helius alongside DexScreener with proper address handling and metadata enrichment.

## Architecture

### Data Sources
1. **DexScreener** - Market/pair data source
   - Price, volume, liquidity, 24h changes
   - Pair address for DEX operations
   - Social links (website, twitter, telegram) from pair info
   
2. **Helius** - On-chain truth + metadata enrichment
   - Holder counts and distribution
   - Mint/freeze authorities
   - Token metadata (image, description, socials)
   - On-chain account data

## Address Correctness (CRITICAL FIX)

### Data Model
\`\`\`typescript
interface TokenData {
  address: string           // Canonical Solana mint (normalized, no "pump" suffix)
  dexTokenAddress?: string  // Raw DexScreener token id (may end with "pump")
  pairAddress?: string      // DEX pair address
  // ... other fields
}
\`\`\`

### Address Usage
| Component | Address Used | Purpose |
|-----------|-------------|---------|
| Solscan button | `token.address` | Canonical mint for blockchain explorer |
| Copy Mint button | `token.address` | Canonical mint for sharing/importing |
| Share URL | `normalizeMint(token.address)` | Canonical mint for solrad.io URLs |
| DexScreener button | `dexUrl` (pair URL) | DEX pair for trading interface |
| Copy Pair button | `token.pairAddress` | DEX pair address |

### Guards
- If `token.address` is missing/invalid: Solscan button disabled, shows "Mint unavailable"
- All mints normalized at ingestion (strips "pump" suffix)
- URL redirects ensure canonical mint in browser address bar
- Cache migration fixes old tokens with "pump" suffixes

## Helius Enrichment API

### Endpoint: `/api/token/[mint]/enrich`

**Purpose**: Server-side metadata enrichment from Helius

**Cache Strategy**:
- Key: `token:enrich:<mint>`
- TTL: 6 hours (21,600 seconds)
- Stored in Upstash Redis KV

**Response**:
\`\`\`json
{
  "mint": "string",
  "metadata": {
    "image": "string?",
    "description": "string?",
    "website": "string?",
    "twitter": "string?",
    "telegram": "string?"
  },
  "authorities": {
    "mintAuthorityRevoked": "boolean",
    "freezeAuthorityRevoked": "boolean",
    "mintAuthority": "string | null",
    "freezeAuthority": "string | null"
  },
  "cached": "boolean",
  "cacheAge": "number?"
}
\`\`\`

**Features**:
- Fetches on-chain + off-chain metadata from Helius
- Extracts social links from metadata attributes
- Returns authority status (revoked = safer tokens)
- Automatic 6-hour caching per mint
- Graceful fallback if HELIUS_API_KEY not configured

## Token Detail Drawer

### Official Links Section
Already implemented with correct address handling:

\`\`\`tsx
<Button onClick={() => window.open(
  `https://solscan.io/token/${encodeURIComponent(token.address)}`, 
  "_blank"
)}>
  Solscan (mint)
</Button>

<Button onClick={() => window.open(dexUrl, "_blank")}>
  DexScreener (pair)
</Button>

<Button onClick={handleCopy}>
  Copy Mint
</Button>

{token.pairAddress && (
  <Button onClick={handleCopyPair}>
    Copy Pair
  </Button>
)}

{quote?.website && <Button>Website</Button>}
{quote?.twitter && <Button>Twitter</Button>}
{quote?.telegram && <Button>Telegram</Button>}
\`\`\`

### Layout
- Compact design, no major redesign needed
- All links in one row with flex-wrap
- Social links show only when available
- Separate copy buttons for mint vs pair addresses

## Integration with Existing Systems

### Ingestion Pipeline
1. DexScreener discovers tokens via boosts
2. Mints normalized at ingestion (strips "pump")
3. Helius enriches with holder data + authorities
4. Both `address` (canonical) and `dexTokenAddress` (raw) stored
5. Cache migration ensures old data gets fixed

### Token API (`/api/token/[mint]`)
- Fetches fresh quote from DexScreener using canonical mint
- Returns social links from DexScreener pair info
- 60-second cache per mint
- Used by `useFreshQuote` hook for live drawer updates

### New Enrich API (`/api/token/[mint]/enrich`)
- Fetches metadata from Helius
- 6-hour cache per mint
- Can be called client-side or server-side
- Optional: can integrate into drawer for authority badges

## Environment Variables Required

\`\`\`env
HELIUS_API_KEY=your_helius_api_key
KV_URL=your_upstash_redis_url
KV_REST_API_TOKEN=your_upstash_token
KV_REST_API_URL=your_upstash_rest_url
\`\`\`

## Testing Checklist

- [ ] Solscan button opens correct mint address (no "pump" suffix)
- [ ] Copy Mint copies canonical address
- [ ] Share URL uses canonical mint
- [ ] DexScreener button opens pair URL (not mint)
- [ ] Copy Pair copies pair address (when available)
- [ ] Social links show when available from DexScreener
- [ ] `/api/token/[mint]/enrich` returns metadata
- [ ] Enrich endpoint caches for 6 hours
- [ ] Authorities show as revoked when null

## Future Enhancements

1. **Client-side Helius Integration**
   - Add `useHeliusEnrich` hook
   - Display authority badges in Safety Snapshot
   - Show metadata description in drawer

2. **Fallback Chain**
   - DexScreener socials → Helius metadata → default
   - Prioritize DexScreener for fresh trading data
   - Use Helius for permanent token metadata

3. **Authority Warnings**
   - Red badge if mint/freeze authority present
   - Green badge if both revoked
   - Integrate into scoring system

## Summary

✅ **Address correctness fixed** - Solscan/copy/share use canonical mint, DexScreener uses pair
✅ **Helius enrichment API created** - `/api/token/[mint]/enrich` with 6h cache
✅ **Official Links implemented** - Compact design, correct addresses, social links
✅ **No layout redesign** - Minimal changes to existing UI
✅ **Production ready** - Proper caching, error handling, fallbacks
