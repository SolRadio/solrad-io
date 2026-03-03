# PROOF ENGINE + ALPHA LEDGER SYSTEM REPORT

> Generated from source code analysis. All field names, key paths, and line references are exact.

---

## A) Architecture Overview

### What is the Proof Engine?

The "Proof Engine" is the umbrella term for the system that:
1. **Harvests** signal outcomes from `/api/signal-outcomes` into the Alpha Ledger (KV storage)
2. **Reports health** via `/api/proof-engine-health` (freshness, entry counts, KV status)
3. **Displays status** in the `/research` page header ("Updated Xm ago" + "Harvest: OK/ERROR")

### What is the Alpha Ledger?

An append-only, dedup-protected, capped (2000 entries) log of token signal outcomes stored in Upstash KV. Each entry records: mint, symbol, detection time, score at signal, current price, outcome (win/loss/neutral), and a per-entry SHA-256 hash. A rolling ledger hash provides tamper-evidence.

**Storage**: `lib/alpha-ledger.ts`
**Types**: `AlphaLedgerEntry`, `AlphaLedgerMeta`, `HashHistoryRecord`, `LedgerMetrics`

### What "Harvest Now" does vs Cron

| | Admin Harvest | Cron Harvest |
|---|---|---|
| **Route** | `POST /api/admin/alpha-ledger/harvest` | `GET /api/cron/alpha-ledger` |
| **Auth** | `x-ops-password` header | `Bearer CRON_SECRET` |
| **Throttle** | None | 60-min minimum gap (via `meta.lastWriteAt`) |
| **Timeout** | 25s hard deadline (`Promise.race`) | None (Vercel function timeout) |
| **Stage tracking** | Yes (9 stages written to KV) | No |
| **Before/after proof** | Yes (`metaBefore`, `metaAfter`, `telemetryBefore`, `telemetryAfter`) | No |
| **Shared logic** | Both call `appendEntries()` from `lib/alpha-ledger.ts` | Same |
| **Telemetry** | Writes `STARTED (admin)`, `OK (added=N, deduped=N, invalid=N)`, or `ERROR (stage): msg` | Writes `STARTED`, `OK`, or `ERROR: msg` |

### What "Updated / Stale" is based on

The UI "Updated Xm ago" badge in `ResearchClient.tsx` (line 836) uses `metrics.lastUpdated` which comes from the `/api/research/ledger-metrics` endpoint (derived from `meta.lastWriteAt`).

The health endpoint (`/api/proof-engine-health`) computes `alpha.lastUpdateAt` using this priority chain:

```
Priority 1: bestTimestamp(meta.lastWriteAt, newestEntry.detectedAt|createdAt)
  -> picks max of meta timestamp vs newest entry timestamp
Priority 2: harvest.lastSuccessAt (telemetry key) -> source="harvest_telemetry"
Priority 3: harvest.lastRunAt (telemetry key) -> source="harvest_last_run"
Priority 4: null -> source="none", status="UNKNOWN"
```

**Freshness threshold**: 2 hours (`STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000`)

---

## B) Exact KV Keys and Shapes

### Core Ledger Keys

| Key | Type | Written By | Description |
|---|---|---|---|
| `solrad:alpha:ledger` | `AlphaLedgerEntry[]` | `appendEntries()`, `voidEntry()` | The full ledger array (capped at 2000, sorted newest-first) |
| `solrad:alpha:ledger:meta` | `AlphaLedgerMeta` | `appendEntries()`, `voidEntry()` | Ledger metadata (timestamps, counts, hash) |
| `solrad:alpha:ledger:hashHistory` | `HashHistoryRecord[]` | `appendHashHistory()` | Append-only hash change log (capped at 100) |
| `solrad:lock:alphaLedger` | `number` (epoch ms) | `acquireLock()` | Write lock with 10s TTL (`{ ex: 10 }`) |

### AlphaLedgerMeta Shape (line 38-46 of `lib/alpha-ledger.ts`)

```typescript
{
  trackedSince: string       // ISO - first ever write
  lastWriteAt: string        // ISO - ALWAYS set to now on appendEntries()
  totalEntries: number       // count of non-voided entries
  totalVoided: number        // count of voided entries
  ledgerHash?: string        // SHA-256 rolling hash of all entry hashes
  hashUpdatedAt?: number     // epoch ms - when hash was last computed
  hashEntryCount?: number    // total entries included in hash
}
```

### Telemetry Keys (written by cron + admin harvest routes)

| Key | Type | Written When | Description |
|---|---|---|---|
| `solrad:alpha:harvest:last_run_at` | `number` (epoch ms) | Harvest start | When the current run began |
| `solrad:alpha:harvest:last_run_status` | `string` | Start / finish / error | `"STARTED"`, `"STARTED (admin)"`, `"OK"`, `"OK (added=N, deduped=N, invalid=N)"`, or `"ERROR (stage): message"` |
| `solrad:alpha:harvest:last_success_at` | `number` (epoch ms) | Harvest success | When the last successful run finished |
| `solrad:alpha:harvest:last_error_at` | `number` (epoch ms) | Harvest error | When the last error occurred |
| `solrad:alpha:harvest:last_processed_count` | `number` | Harvest success | Number of entries added in last successful run |

### Stage Key (admin harvest only)

| Key | Type | Written When | Description |
|---|---|---|---|
| `solrad:alpha:harvest:last_stage` | `string` | Each stage checkpoint | Format: `"stage_name @ ISO_timestamp"`. Stages: `init`, `read_before_state`, `started`, `fetch_signals`, `signals_fetched`, `normalize_entries`, `entries_ready`, `append_entries`, `append_done`, `done`, `error_*` |

---

## C) Data Flow Diagrams

### Harvest Route Sequence (Admin + Cron share core logic)

```
Auth check (x-ops-password / Bearer CRON_SECRET)
  |
  v
[Admin only] Read metaBefore + telemetryBefore from KV
  |
  v
[Cron only] Throttle guard: skip if meta.lastWriteAt < 60min ago
  |
  v
Write telemetry: last_run_at = now, last_run_status = "STARTED"
  |
  v
Fetch GET /api/signal-outcomes?limit=100&minScore=70
  |-- if !res.ok -> write ERROR telemetry, return 502
  |
  v
Parse signals[] from response JSON
  |-- if signals.length === 0 -> return { ok: true, harvested: 0 }
  |   NOTE: NO appendEntries() call, NO meta update, NO telemetry OK write
  |
  v
Filter + validate entries:
  - Remove entries with non-string/empty mint
  - Remove entries with invalid/missing detectedAt
  - Count skippedInvalid
  |-- if entries.length === 0 (all invalid) -> return { ok: true, skippedInvalid }
  |   NOTE: NO appendEntries() call, NO meta update
  |
  v
appendEntries(entries):
  1. acquireLock() (10s TTL) -- throws if lock held
  2. Read existing ledger from KV
  3. Dedup by entry.id -> count skipped
  4. Normalize mints, compute entry hashes
  5. Sort by detectedAt desc, cap at 2000
  6. Write ledger to KV
  7. Read prev meta, compute new rolling hash
  8. Write meta to KV (lastWriteAt = now -- ALWAYS)
  9. Append hash history if hash changed
  10. releaseLock()
  |
  v
Write telemetry: last_run_status = "OK", last_success_at = now, last_processed_count = added
  |
  v
Return JSON response
```

### Health Endpoint Sequence (`GET /api/proof-engine-health`)

```
Read alpha ledger + meta from KV (parallel)
  |
  v
Compute: entries30d, uniqueMints30d, voidedCount, invalidCount
Compute: newestDetectedAt, newestCreatedAt from entries
Parse: metaTs from meta.lastWriteAt
  |
  v
bestTimestamp(metaTs, newestEntryTs) -> { ts, source }
  |
  v
Determine alphaStatus: OK / DEGRADED / UNKNOWN (based on freshness + entry counts)
  |
  v
Read lead-time proofs (parallel with above would be better but currently sequential)
  |
  v
Read harvest telemetry from KV (5 keys in parallel)
  |
  v
Fallback chain: if alphaLastUpdateAt is still null:
  - Try harvest.lastSuccessAt -> source="harvest_telemetry"
  - Try harvest.lastRunAt -> source="harvest_last_run"
  |
  v
Re-derive overallStatus after fallback
  |
  v
Return JSON with Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate
```

### UI Display Sequence (`app/research/ResearchClient.tsx`)

```
useHealthPolling(60_000) -> polls GET /api/proof-engine-health every 60s
  |
  v
Header row displays:
  1. "Updated Xm ago" <- metrics.lastUpdated (from /api/research/ledger-metrics, NOT health endpoint)
  2. "Harvest: OK (N added)" <- healthData.harvest.lastStatus + lastProcessedCount
  |
  v
HealthStrip shows: alpha status, lead status, overall status (color-coded)
IntegrityStrip shows: ledgerHash, hashEntryCount
LedgerHashLine shows: hash + age
```

---

## D) Current Observed Behavior: Why "Harvest: OK" but "Updated 2d ago"

### The Symptom

The UI simultaneously shows:
- `Harvest: OK (added=0, invalid=19)` (harvest ran, telemetry wrote OK)
- `Updated 2d ago` (meta.lastWriteAt is 2 days old)

### Root Cause: Three Early-Return Paths Skip `appendEntries()`

The harvest routes have **two early-return guards** before calling `appendEntries()`. When either fires, NO meta write happens:

#### Guard 1: `signals.length === 0` (Cron route, line ~91)

```typescript
if (signals.length === 0) {
  return NextResponse.json({ ok: true, harvested: 0, added: 0, skipped: 0, message: "No signals to harvest" })
}
```

**Effect**: Returns immediately. No `appendEntries()` call. No meta update. But the cron route DOES write STARTED telemetry before this point, so `last_run_status` stays as "STARTED" forever.

#### Guard 2: `entries.length === 0` after validation (Cron route, line ~102)

```typescript
if (entries.length === 0) {
  return NextResponse.json({
    ok: true, harvested: signals.length, added: 0, skipped: 0, skippedInvalid,
    message: "All signals had invalid mint/date",
  })
}
```

**Effect**: Returns immediately. No `appendEntries()` call. No meta update. Telemetry was written as STARTED but never updated to OK or ERROR.

#### Guard 2b: Same in Admin route (line ~118-121)

The admin route has the same `entries.length === 0` early return but DOES write OK telemetry afterward:

```typescript
if (entries.length > 0) {
  result = await appendEntries(entries)
}
```

When `entries.length === 0`, it skips `appendEntries()` but continues to the OK telemetry write. So the admin route writes `OK (added=0, invalid=19)` to telemetry -- but meta.lastWriteAt is NEVER touched because `appendEntries()` was never called.

### The Exact Condition

```
meta.lastWriteAt is only updated inside appendEntries() (line 322 of lib/alpha-ledger.ts).
appendEntries() is only called when entries.length > 0.
When all 19 signals are invalid (bad mint/date), entries.length === 0.
Therefore meta.lastWriteAt stays at whatever the LAST successful non-zero-entry harvest wrote.
```

### Why `lastWriteAt = now` on line 322 doesn't help

The fix on line 322 (`lastWriteAt: now` instead of conditional) only fires when `appendEntries()` is called. It correctly handles the `added === 0, skipped > 0` case (all deduped). But when `entries.length === 0` (all invalid), `appendEntries()` is never reached.

---

## E) Verification Checklist

### 1. Check current state

```
GET /api/proof-engine-health?debug=1
```

**Look for in JSON response:**

| Field | What it tells you |
|---|---|
| `alpha.metaLastWriteAt` | Raw ISO string from `meta.lastWriteAt` -- the authoritative timestamp |
| `alpha.metaKeyUsed` | Should be `"solrad:alpha:ledger:meta"` |
| `alpha.lastUpdateAt` | Computed best timestamp (may differ from meta if fallback kicked in) |
| `alpha.lastUpdateSource` | Which priority won: `"meta"`, `"newestEntry"`, `"harvest_telemetry"`, `"harvest_last_run"`, or `"none"` |
| `alpha.status` | `"OK"` / `"DEGRADED"` / `"UNKNOWN"` |
| `alpha.statusReason` | Human-readable explanation |
| `alpha.entries30d` | If > 0 but status is DEGRADED, the freshness check is the problem |
| `harvest.lastRunAt` | Epoch ms -- when harvest last started |
| `harvest.lastSuccessAt` | Epoch ms -- when harvest last succeeded |
| `harvest.lastStatus` | The exact status string: `"OK"`, `"STARTED"`, `"ERROR: ..."` |
| `harvest.lastProcessedCount` | How many entries were added in the last successful run |
| `_debug.alpha.isFresh` | Boolean -- is `lastUpdateAt` within 2h of now? |

### 2. Trigger admin harvest

```
POST /api/admin/alpha-ledger/harvest
Headers: { "x-ops-password": "<your_ops_pw>", "Content-Type": "application/json" }
```

**Look for in response:**

| Field | What it tells you |
|---|---|
| `ok` | `true` if completed without error |
| `stage` | Should be `"done"` if successful |
| `added` | Entries actually written (0 if all deduped or invalid) |
| `skipped` | Entries deduped |
| `skippedInvalid` | Entries with bad mint/date |
| `metaBefore.lastWriteAt` | Meta BEFORE harvest |
| `metaAfter.lastWriteAt` | Meta AFTER harvest -- should be fresh IF added > 0 |
| `metaAfter` | Will be `null` or unchanged if `entries.length === 0` (the bug) |
| `telemetryBefore.last_run_status` | Previous telemetry status |
| `telemetryAfter.last_run_status` | New telemetry status |

### 3. Trigger cron harvest

```
GET /api/cron/alpha-ledger
Headers: { "Authorization": "Bearer <CRON_SECRET>" }
```

**Look for in response:**

| Field | What it tells you |
|---|---|
| `throttled` | `true` if last harvest was < 60min ago |
| `added` | Entries written |
| `skippedInvalid` | Invalid entries skipped |
| `message` | Present when 0 signals or all invalid |

### 4. Check stage key (admin harvest debugging)

```
GET /api/proof-engine-health?debug=1
```

The `harvest.lastStatus` field will show the stage if an error occurred: `"ERROR (fetch_signals): ..."`. The raw stage key is at `solrad:alpha:harvest:last_stage` in KV.

---

## F) Safe Fixes (Recommendations Only -- No Code Changes)

### Fix 1: Update meta even when all entries are invalid (SAFEST)

**Where**: Both harvest routes, BEFORE the early-return guards for `entries.length === 0`.

**What**: Call `readMeta()` and write updated meta with `lastWriteAt = now` even when no entries are appended. This is safe because:
- It only touches the meta key, not the ledger array
- `lastWriteAt` semantically means "last time the harvest pipeline ran and checked the ledger", not "last time new entries were added"
- The `totalEntries` and `totalVoided` counts don't change, so the meta is truthful
- The ledger hash doesn't change, so integrity is preserved

**Risk**: None. The meta write is idempotent and only updates the timestamp.

### Fix 2: Always write telemetry OK/ERROR, even on early-return paths (SAFE)

**Where**: Both harvest routes, in the `signals.length === 0` and `entries.length === 0` early-return guards.

**What**: Before returning, write:
```
storage.set(`${TEL}:last_run_status`, "OK (0 signals)" or "OK (0 valid entries, N invalid)")
storage.set(`${TEL}:last_success_at`, Date.now())
storage.set(`${TEL}:last_processed_count`, 0)
```

**Why safe**: Telemetry keys are purely diagnostic -- they don't affect ledger content or integrity. Currently the cron route writes STARTED but never updates to OK on these paths, leaving telemetry in an ambiguous state.

**Risk**: None. These keys are only read by the health endpoint for display purposes.

### Fix 3: Health fallback should treat stale meta + fresh harvest telemetry as OK (SAFE)

**Where**: `app/api/proof-engine-health/route.ts`, in the harvest fallback chain.

**What**: Currently the fallback chain only activates when `alphaLastUpdateAt === null`. It should ALSO activate when `alphaLastUpdateAt` is stale AND harvest telemetry is fresh. Specifically:

```
if (alphaStatus === "DEGRADED" && harvestLastSuccessAt is fresh) {
  alphaStatus = "OK"
  alphaStatusReason = "meta stale but harvest succeeded recently"
  alphaLastUpdateSource = "harvest_telemetry_override"
}
```

**Why safe**: This only changes the displayed status, not any data. The health endpoint is read-only. The logic is: "if the harvest pipeline ran successfully within 2 hours, the system is working even if meta.lastWriteAt is old because the harvest simply had nothing new to write."

**Risk**: Minimal. Could mask a genuine meta-write failure, but the `lastUpdateSource` field would indicate the override for debugging.

---

## File Reference Index

| File | Role |
|---|---|
| `lib/alpha-ledger.ts` | Types, KEYS, readMeta/readLedger, appendEntries, voidEntry, metrics |
| `lib/storage.ts` | Hybrid KV adapter (Vercel KV / Upstash / memory fallback) |
| `app/api/admin/alpha-ledger/harvest/route.ts` | Admin harvest with stage tracking + 25s timeout |
| `app/api/cron/alpha-ledger/route.ts` | Cron harvest with 60-min throttle |
| `app/api/proof-engine-health/route.ts` | Health endpoint (freshness, fallback chain, telemetry) |
| `app/research/ResearchClient.tsx` | UI display (Updated badge, Harvest line, HealthStrip) |
