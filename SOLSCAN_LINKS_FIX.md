# Solscan Links Fix

## Problem
Solscan buttons could potentially open wrong URLs if not using the correct `/token/` endpoint for SPL tokens.

## Solution
Created centralized helper function and added safety guards.

## Changes Made

### 1. Helper Function Created
**File:** `lib/utils/solscan.ts`

\`\`\`typescript
export function getSolscanTokenUrl(mint: string | null | undefined): string | null
export function isValidMintForSolscan(mint: string | null | undefined): boolean
\`\`\`

**Purpose:**
- Single source of truth for Solscan URL generation
- Returns `https://solscan.io/token/{mint}` (NOT `/account/`)
- Returns `null` if mint is invalid (missing or < 32 chars)
- Guards against showing broken links

### 2. Token Detail Drawer Updated
**File:** `components/token-detail-drawer.tsx`

**Changes:**
- Imported `getSolscanTokenUrl` and `isValidMintForSolscan` helpers
- Added Tooltip component for disabled state
- Solscan button now:
  - Uses `getSolscanTokenUrl(token.address)` 
  - Shows as disabled with "Mint unavailable" tooltip if mint is invalid
  - Uses canonical mint address (`token.address`)

**Before:**
\`\`\`tsx
<Button onClick={() => window.open(`https://solscan.io/token/${encodeURIComponent(token.address)}`, "_blank")}>
  Solscan
</Button>
\`\`\`

**After:**
\`\`\`tsx
{isValidMintForSolscan(token.address) ? (
  <Button onClick={() => {
    const url = getSolscanTokenUrl(token.address)
    if (url) window.open(url, "_blank")
  }}>
    Solscan
  </Button>
) : (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button disabled>Solscan</Button>
    </TooltipTrigger>
    <TooltipContent>Mint unavailable</TooltipContent>
  </Tooltip>
)}
\`\`\`

### 3. Other Components Verified
**Files checked:**
- `components/token-card-grid.tsx` - No Solscan links (only copy/share)
- All copy operations use `token.address` (canonical mint) ✓
- All share operations use `normalizeMint(token.address)` for solrad.io URLs ✓

## Address Usage Confirmed

| Action | Address Used | Correct |
|--------|-------------|---------|
| Solscan button | `token.address` via helper | ✅ Yes |
| Copy Mint | `token.address` | ✅ Yes |
| Copy Pair | `token.pairAddress` | ✅ Yes |
| Share URL | `normalizeMint(token.address)` | ✅ Yes |
| DexScreener | `dexUrl` (pair URL) | ✅ Yes |

## Safety Guards

1. **Mint Validation**
   - Checks mint exists and is >= 32 characters
   - Prevents opening broken Solscan links
   
2. **UI Feedback**
   - Button disabled if mint unavailable
   - Tooltip shows "Mint unavailable" on hover
   - No layout changes when disabled

3. **Null Safety**
   - Helper returns `null` for invalid mints
   - UI checks result before opening window

## Testing Checklist

- [x] Solscan button opens `https://solscan.io/token/{mint}`
- [x] Uses canonical mint address (no "pump" suffix)
- [x] Button disabled + tooltip when mint invalid
- [x] Copy mint uses `token.address`
- [x] Share URL uses normalized mint
- [x] DexScreener uses pair URL
- [x] No layout/styling changes

## Summary
✅ Created centralized `getSolscanTokenUrl()` helper in `lib/utils/solscan.ts`
✅ Updated token detail drawer with safety guard (disabled button + tooltip)
✅ Verified all address usages are correct (mint vs pair)
✅ No UI layout changes, only URL correctness fixes
