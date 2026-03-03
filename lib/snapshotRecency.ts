/**
 * Shared snapshot recency helpers.
 * ONE canonical implementation used by both /api/signal-outcomes and /api/snapshot-health.
 * No ordering assumptions -- always a single-pass scan.
 */

// ── Primitives ──

/** Coerce number | numeric-string to number, or null. */
export function toNum(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) && v > 0 ? v : null
  if (typeof v === "string") {
    const n = Number(v)
    return Number.isFinite(n) && n > 0 ? n : null
  }
  return null
}

/** Normalize a raw numeric value to ms-epoch. Handles seconds and ms. */
function normalizeToMs(n: number): number | null {
  if (n <= 0) return null
  // seconds (< 1e12) -> multiply to ms
  const ms = n < 1e12 ? n * 1000 : n
  // Sanity: must be after 2001-01-01 (978307200000 ms)
  return ms > 978_307_200_000 ? ms : null
}

// ── Field-level extractors ──

const TS_FIELDS = ["ts", "t", "timestamp", "time", "createdAt"] as const
export type TsFieldName = (typeof TS_FIELDS)[number]

const WRITTEN_FIELDS = ["writtenAtMs", "writtenAt", "written_at"] as const
export type WrittenFieldName = (typeof WRITTEN_FIELDS)[number]

/** Extract the best ts-family field from a snapshot as ms-epoch. */
export function getSnapshotTsMs(s: any): { ms: number; field: TsFieldName } | null {
  if (!s || typeof s !== "object") return null
  for (const field of TS_FIELDS) {
    const raw = s[field]
    if (raw == null) continue
    const n = toNum(raw)
    if (n === null) continue
    const ms = normalizeToMs(n)
    if (ms !== null) return { ms, field }
  }
  return null
}

/** Extract the best writtenAt-family field from a snapshot as ms-epoch. */
export function getSnapshotWrittenAtMs(s: any): { ms: number; field: WrittenFieldName } | null {
  if (!s || typeof s !== "object") return null
  for (const field of WRITTEN_FIELDS) {
    const raw = s[field]
    if (raw == null) continue
    const n = toNum(raw)
    if (n === null) continue
    // writtenAtMs is always stored as ms, no seconds normalization needed
    // but writtenAt/written_at might be seconds
    const ms = normalizeToMs(n)
    if (ms !== null) return { ms, field }
  }
  return null
}

/**
 * Canonical recency for a single snapshot: max(tsMs, writtenAtMs).
 * Returns null if neither field yields a valid ms-epoch.
 */
export function getSnapshotRecencyMs(s: any): number | null {
  const tsR = getSnapshotTsMs(s)
  const wR = getSnapshotWrittenAtMs(s)
  const tMs = tsR?.ms ?? 0
  const wMs = wR?.ms ?? 0
  const best = Math.max(tMs, wMs)
  return best > 0 ? best : null
}

// ── Scan result ──

export interface SnapshotScanResult {
  /** Snapshots that had at least one valid timestamp field */
  totalUsable: number
  /** Snapshots whose recencyMs >= cutoffMs */
  countLast24h: number
  /** Newest recencyMs across all snapshots */
  newestRecencyMs: number | null
  /** Oldest recencyMs across all snapshots */
  oldestRecencyMs: number | null
  /** Newest ts-family field value */
  newestTsMs: number | null
  /** Newest writtenAt-family field value */
  newestWrittenAtMs: number | null
  /** Which ts field was detected on the newest snapshot */
  tsFieldDetected: TsFieldName | null
  /** Which writtenAt field was detected on the newest snapshot */
  writtenFieldDetected: WrittenFieldName | null
}

/**
 * Single-pass scan over a snapshot array.
 * Computes all recency metrics without sorting or ordering assumptions.
 */
export function scanSnapshotRecency(snapshots: any[], cutoffMs: number): SnapshotScanResult {
  let totalUsable = 0
  let countLast24h = 0
  let newestRecencyMs: number | null = null
  let oldestRecencyMs: number | null = null
  let newestTsMs: number | null = null
  let newestWrittenAtMs: number | null = null
  let tsFieldDetected: TsFieldName | null = null
  let writtenFieldDetected: WrittenFieldName | null = null

  for (let i = 0; i < snapshots.length; i++) {
    const snap = snapshots[i]

    const tsR = getSnapshotTsMs(snap)
    const wR = getSnapshotWrittenAtMs(snap)
    const tMs = tsR?.ms ?? 0
    const wMs = wR?.ms ?? 0
    const recency = Math.max(tMs, wMs)

    if (recency <= 0) continue
    totalUsable++

    if (newestRecencyMs === null || recency > newestRecencyMs) newestRecencyMs = recency
    if (oldestRecencyMs === null || recency < oldestRecencyMs) oldestRecencyMs = recency
    if (recency >= cutoffMs) countLast24h++

    // Track individual field maximums for diagnostics
    if (tsR && (newestTsMs === null || tsR.ms > newestTsMs)) {
      newestTsMs = tsR.ms
      tsFieldDetected = tsR.field
    }
    if (wR && (newestWrittenAtMs === null || wR.ms > newestWrittenAtMs)) {
      newestWrittenAtMs = wR.ms
      writtenFieldDetected = wR.field
    }
  }

  return {
    totalUsable,
    countLast24h,
    newestRecencyMs,
    oldestRecencyMs,
    newestTsMs,
    newestWrittenAtMs,
    tsFieldDetected,
    writtenFieldDetected,
  }
}
