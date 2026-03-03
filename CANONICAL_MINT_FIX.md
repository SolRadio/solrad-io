# Canonical Mint Address Fix

## Problem
Solscan, copy address, and social share were using raw DexScreener token IDs (often ending with "pump"), causing Solscan to open Account pages or show "Token not found" errors instead of the correct Token page.

## Solution
Implemented canonical mint normalization throughout the entire data pipeline while preserving DexScreener compatibility.

## Changes Made

### 1. Data Model Updates (lib/types.ts)
- Added `dexTokenAddress?: string` to both `TokenData` and `TokenScore` interfaces
- `address` field now always contains the canonical Solana mint (no "pump" suffix)
- `dexTokenAddress` stores the raw DexScreener token ID for API compatibility
- `pairAddress` remains for pair-specific operations

### 2. Ingestion Pipeline (lib/adapters/dexscreener.ts)
- Imported `normalizeMint` utility
- At enrichment time, normalize all token addresses:
  - `dexTokenAddress` = raw `bestPair.baseToken.address` (may have "pump")
  - `address` = `normalizeMint(bestPair.baseToken.address)` (canonical)
- Skip tokens where normalization fails or returns invalid mints
- Added validation warnings for tokens with "pump" suffix or short addresses

### 3. Cache Migration (lib/ingestion.ts)
- Before caching scores, migrate any old tokens with "pump" suffixes:
  - If `token.address.endsWith("pump")`, normalize it and move to `dexTokenAddress`
  - Set `address` to the canonical mint
  - Filter out tokens that fail migration
- Backfill `dexTokenAddress` for tokens missing it
- Added validation warnings after migration to catch any remaining issues

### 4. Scoring Function (lib/scoring.ts)
- Updated `calculateTokenScore` to preserve both fields:
  - `address`: canonical mint (from tokenDataMap key, already normalized)
  - `dexTokenAddress`: raw DexScreener ID
  - `pairAddress`: DexScreener pair address
- No changes to scoring logic or weights

### 5. Token Routes (app/token/[address]/page.tsx)
- Already had normalization via `normalizeMint()`
- Added redirect to canonical URL if raw mint differs from normalized mint
- Ensures clean, bookmarkable URLs without "pump" suffixes

### 6. UI Components
- **token-detail-drawer.tsx**: Already correctly uses `token.address` for Solscan links
- **Copy Mint**: Uses `token.address` (canonical)
- **Copy Pair**: Uses `token.pairAddress` (pair-specific)
- **DexScreener**: Uses `token.dexUrl` or `token.pairUrl` (no change)
- **Share Links**: Use canonical mint via normalized `token.address`

## Testing Checklist

Test with TRUMP token (known to have "pump" suffix):

- [x] DexScreener link opens correct pair page
- [x] Solscan link opens Token page (not Account page)
- [x] Copy Mint returns canonical address (no "pump")
- [x] Copy Pair returns pair address
- [x] Social share URLs use canonical mint
- [x] Token detail route redirects "pump" addresses to canonical URL
- [x] No layout or styling changes
- [x] Scoring logic unchanged

## Validation Warnings

Added console warnings for debugging (dev mode only):
- Warns if `token.address` ends with "pump" after migration
- Warns if `token.address.length < 32`
- Warns if `dexTokenAddress` is missing
- No secrets exposed in warnings

## Files Modified

1. `lib/types.ts` - Added `dexTokenAddress` field
2. `lib/adapters/dexscreener.ts` - Normalize mints at ingestion
3. `lib/ingestion.ts` - Cache migration and validation
4. `lib/scoring.ts` - Preserve both address fields
5. `app/token/[address]/page.tsx` - Redirect non-canonical URLs

## Backwards Compatibility

- Old cached tokens with "pump" suffixes are automatically migrated
- Failed migrations filter out invalid tokens
- No breaking changes to API responses
- UI components already using correct fields
