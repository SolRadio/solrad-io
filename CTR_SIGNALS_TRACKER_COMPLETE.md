# CTR Alignment: Signals & Tracker Complete

## Summary

Successfully wired canonical normalization + flags into Signals and Tracker pages without changing any existing logic.

## Files Modified

### 1. `/app/api/signal-outcomes/route.ts`
**Changes:**
- Added import: `toCanonicalToken`, `CanonicalToken`
- Extended `SignalOutcome` interface with optional `_canonical` field
- For each signal outcome:
  - Created `CanonicalToken` using `toCanonicalToken({ mint, symbol, name, scoreNow, scoreAtSignal, lastUpdatedAt })`
  - Preserved `scoreAtSignal` exactly as stored in the outcome
  - Attached `hasSignal: true` flag to all signal outcomes
- Added metadata to response: `meta: { asOf, signalCount, minScore }`

**Guarantees:**
- ✅ NO filtering applied - all existing signals remain
- ✅ NO changes to signal detection logic (FIRST_SEEN threshold)
- ✅ NO changes to scoring or sorting
- ✅ scoreAtSignal preserved exactly as stored

### 2. `/app/api/tracker/route.ts`
**Changes:**
- Added imports: `toCanonicalToken`, `joinCanonicalFlags`, `getBlobState`
- For each tracker metric (both `metrics` and `preQualified`):
  - Normalized with `toCanonicalToken` using mint, symbol, name, currentScore, firstSeen, lastSeen
  - Attached `hasSnapshot: true` flag (all tracked tokens have snapshots)
  - Fetched pool mints from blob storage
  - Applied `inPool` flag using `joinCanonicalFlags`
- Added metadata to response: `meta: { asOf, snapshotCount, tokensTracked, poolCount, window, mode }`

**Guarantees:**
- ✅ NO filtering applied - all existing tracker metrics remain
- ✅ NO changes to tracker computation logic
- ✅ NO changes to scoring or sorting
- ✅ Graceful fallback if pool mints unavailable

## Canonical Fields Added

All signal outcomes now include:
```typescript
_canonical: {
  mint: string
  symbol?: string
  name?: string
  scoreNow?: number
  scoreAtSignal?: number  // Preserved from signal detection
  lastUpdatedAt?: number
  hasSignal: true         // Always true for signals
}
```

All tracker metrics now include:
```typescript
_canonical: {
  mint: string
  symbol?: string
  name?: string
  scoreNow?: number
  firstSeenAt?: number
  lastUpdatedAt?: number
  hasSnapshot: true       // Always true for tracked tokens
  inPool?: boolean        // true if mint exists in token pool
}
```

## Metadata Added

**Signals API (`/api/signal-outcomes`):**
```json
{
  "meta": {
    "asOf": "2026-02-04T...",
    "signalCount": 42,
    "minScore": 75
  }
}
```

**Tracker API (`/api/tracker`):**
```json
{
  "meta": {
    "asOf": "2026-02-04T...",
    "snapshotCount": 156,
    "tokensTracked": 38,
    "poolCount": 245,
    "window": "24h",
    "mode": "treasure"
  }
}
```

## CTR System Complete

All major pages now have canonical normalization:
- ✅ Dashboard (`/api/index`) - metadata only, no token changes
- ✅ Browse (`/browse`) - pool tokens with `inPool=true`
- ✅ Signals (`/signals`) - signal outcomes with `hasSignal=true`
- ✅ Tracker (`/tracker`) - tracked tokens with `hasSnapshot=true` and `inPool`

## What Was NOT Changed

- ❌ NO token filtering anywhere
- ❌ NO scoring algorithm changes
- ❌ NO sorting changes
- ❌ NO UI layout changes
- ❌ NO ingest changes
- ❌ NO route contract breaking changes (only added optional fields)

The CTR system provides consistent normalization and membership flags across all pages while preserving 100% of existing functionality.
