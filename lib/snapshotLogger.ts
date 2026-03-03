import { kv } from "@vercel/kv"
import type { TokenScore } from "./types"
import { computeActivityRatio, computeQualityScore, computeReadinessScore, computeGemScore, computeSignalScoreV2 } from "./scoring-v2"

/**
 * Normalize any timestamp-like value to ms-epoch.
 * Handles: seconds (< 1e11), ambiguous range (1e11-1e12 treated as seconds), ms (>= 1e12),
 * numeric strings, and ISO date strings.
 * Returns null if the value cannot be resolved to a valid ms-epoch after 2001-01-01.
 */
export function toMsEpoch(x: unknown): number | null {
  if (x == null) return null
  let n: number
  if (typeof x === "number") {
    n = x
  } else if (typeof x === "string") {
    // Try numeric parse first, then ISO date
    const asNum = Number(x)
    n = Number.isFinite(asNum) && asNum > 0 ? asNum : new Date(x).getTime()
  } else {
    return null
  }
  if (!Number.isFinite(n) || n <= 0) return null
  // Normalize seconds -> ms
  if (n < 1e12) n = n * 1000
  // Sanity: must be after 2001-01-01 (978307200000 ms)
  return n > 978_307_200_000 ? n : null
}

/**
 * Check if a value is a valid ms-epoch timestamp (after 2001).
 */
export function isValidEpochMs(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x) && x > 978_307_200_000
}

/**
 * Derive a normalized ms timestamp from a snapshot's legacy fields.
 * Tries: writtenAtMs, ts, t, timestamp, time, createdAt (in order).
 */
const LEGACY_TS_FIELDS = ["writtenAtMs", "ts", "t", "timestamp", "time", "createdAt"] as const

function deriveWrittenAtMs(s: Record<string, unknown>): number | null {
  for (const field of LEGACY_TS_FIELDS) {
    const v = s[field]
    if (v == null) continue
    const ms = toMsEpoch(v)
    if (ms !== null) return ms
  }
  return null
}

export interface TokenSnapshot {
  ts: number // Legacy field, kept for backward compatibility
  /** Server-side write timestamp in ms-epoch. Source of truth for freshness gating. */
  writtenAtMs: number
  /** Normalized ms-epoch from event timestamp fields, or writtenAtMs as fallback. */
  tsMs: number
  mint: string
  symbol: string
  name: string
  price: number
  liquidityUsd: number
  volume24hUsd: number
  solradScore: number
  qualityScore: number
  readinessScore: number
  gemScore: number
  signalScore: number | null
  activityRatio: number | null
  riskLabel: string
}

const DEDUP_WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const MAX_SNAPSHOTS_PER_MINT = 200

/**
 * Normalize token input to array shape (resilient to different data formats)
 */
function normalizeTokens(input: unknown): TokenScore[] {
  // If already an array, use it
  if (Array.isArray(input)) {
    return input as TokenScore[]
  }

  // If it's an object with tokens or data property that's an array
  if (input && typeof input === "object") {
    const obj = input as any
    if (Array.isArray(obj.tokens)) return obj.tokens
    if (Array.isArray(obj.data)) return obj.data
    
    // If it looks like a single token object (has address/mint field)
    if (obj.address || obj.mint) {
      return [obj as TokenScore]
    }
  }

  // If null/undefined/other, return empty array
  return []
}

/**
 * Log token snapshots to Vercel KV
 * - Deduplicates: only logs once per mint per 10 minutes
 * - Safe: never fails the UI (catches all errors)
 * - Graceful: no-ops if KV is not configured
 */
export async function logSnapshots(tokens: TokenScore[] | unknown): Promise<void> {
  try {
    // Check if KV is configured
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.log("[v0] KV not configured, skipping snapshot logging")
      return
    }

    // Normalize input to array
    const normalizedTokens = normalizeTokens(tokens)
    
    // Filter out invalid entries (must have valid address/mint)
    const validTokens = normalizedTokens.filter((token) => {
      const hasMint = token?.address && typeof token.address === "string"
      return hasMint && token.address.length >= 32 && token.address.length <= 44
    })

    // If no valid tokens, log warning and return gracefully
    if (validTokens.length === 0) {
      console.log("[v0] No valid tokens to log (after normalization and filtering)")
      return
    }

    const now = Date.now()
    const snapshots: TokenSnapshot[] = []

    for (const token of validTokens) {
      // Validate mint address (must be valid base58 and reasonable length)
      if (!token.address || token.address.length < 32 || token.address.length > 44) {
        console.log(`[v0] Skipping snapshot for invalid mint: ${token.address}`)
        continue
      }

      // Deduplicate: check if we logged this mint recently
      const lastLoggedKey = `snap:last:${token.address}`
      const lastLogged = await kv.get<number>(lastLoggedKey).catch(() => null)

      if (lastLogged && now - lastLogged < DEDUP_WINDOW_MS) {
        continue // Skip, already logged recently
      }

      // Create snapshot
      // writtenAtMs is the server-side source of truth for freshness gating.
      // tsMs is a normalized ms-epoch derived from legacy event fields (or writtenAtMs fallback).
      const snapshot: TokenSnapshot = {
        ts: now,
        writtenAtMs: now,
        tsMs: now,
        mint: token.address,
        symbol: token.symbol,
        name: token.name,
        price: token.priceUsd,
        liquidityUsd: token.liquidity,
        volume24hUsd: token.volume24h,
        solradScore: token.totalScore,
        qualityScore: computeQualityScore(token),
        readinessScore: computeReadinessScore(token),
        gemScore: computeGemScore(token),
        signalScore: computeSignalScoreV2(token),
        activityRatio: computeActivityRatio(token),
        riskLabel: token.riskLabel,
      }

      snapshots.push(snapshot)

      // Write snapshot to KV
      const latestKey = `snap:latest:${token.address}`
      const listKey = `snap:list:${token.address}`

      // Update latest snapshot
      await kv.set(latestKey, snapshot).catch((err) => {
        console.error(`[v0] Failed to set latest snapshot for ${token.address}:`, err)
      })

      // Append to list (LPUSH + cap to 200)
      await kv.lpush(listKey, snapshot).catch((err) => {
        console.error(`[v0] Failed to push snapshot for ${token.address}:`, err)
      })
      await kv.ltrim(listKey, 0, MAX_SNAPSHOTS_PER_MINT - 1).catch((err) => {
        console.error(`[v0] Failed to trim snapshot list for ${token.address}:`, err)
      })

      // Add to index (KV expects members array)
      await kv.sadd("snap:index", [token.address]).catch((err) => {
        console.error(`[v0] Failed to add mint to index:`, err)
      })

      // Update last logged timestamp
      await kv.set(lastLoggedKey, now, { ex: Math.floor(DEDUP_WINDOW_MS / 1000) }).catch((err) => {
        console.error(`[v0] Failed to set last logged timestamp for ${token.address}:`, err)
      })
    }

    if (snapshots.length > 0) {
      console.log(`[v0] Logged ${snapshots.length} snapshots to KV`)
    }
  } catch (error) {
    console.error("[v0] Snapshot logging failed:", error)
    // Never fail the UI
  }
}

/**
 * Get latest snapshots for a mint
 */
export async function getLatestSnapshot(mint: string): Promise<TokenSnapshot | null> {
  try {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      return null
    }

    const latestKey = `snap:latest:${mint}`
    const s = await kv.get<Record<string, unknown>>(latestKey).catch(() => null)
    if (!s || typeof s !== "object") return null

    // Normalize writtenAtMs for legacy snapshots
    if (!isValidEpochMs(s.writtenAtMs)) {
      const derived = deriveWrittenAtMs(s)
      s.writtenAtMs = derived
      if (!isValidEpochMs(s.tsMs)) s.tsMs = derived
    }
    return s as unknown as TokenSnapshot
  } catch (error) {
    console.error(`[snapshot] Failed to get latest snapshot for ${mint}:`, error)
    return null
  }
}

/**
 * Get snapshot history for a mint
 */
export async function getSnapshotHistory(mint: string, limit = 50): Promise<TokenSnapshot[]> {
  try {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      return []
    }

    const listKey = `snap:list:${mint}`
    const raw = await kv.lrange<Record<string, unknown>>(listKey, 0, limit - 1).catch(() => [])
    if (!raw || raw.length === 0) return []

    // Self-heal: if this mint has snapshot data, ensure it's in snap:index.
    // This repairs mints that were written before sadd was added to the write path.
    // Adds BOTH the exact mint key AND a stripped variant (if valid pubkey).
    // Fire-and-forget: never block reads, never throw.
    const mintsToHeal = [mint]
    // Try stripping ".pump" or bare "pump" -- only if result is a valid base58 pubkey
    const lc = mint.toLowerCase()
    if (lc.endsWith(".pump") && mint.length > 5 + 32) {
      const stripped = mint.slice(0, -5)
      try { const { PublicKey: PK } = await import("@solana/web3.js"); new PK(stripped); mintsToHeal.push(stripped) } catch { /* invalid, skip */ }
    } else if (lc.endsWith("pump") && mint.length > 4 + 32) {
      const stripped = mint.slice(0, -4)
      try { const { PublicKey: PK } = await import("@solana/web3.js"); new PK(stripped); mintsToHeal.push(stripped) } catch { /* invalid, skip */ }
    }
    kv.sadd("snap:index", mintsToHeal).catch(() => {/* fire-and-forget */})

    // Normalize each snapshot to include writtenAtMs.
    // New snapshots already have it; legacy snapshots get it derived from ts/t/timestamp fields.
    return raw.map((s) => {
      const obj = (s && typeof s === "object" ? s : {}) as Record<string, unknown>
      if (!isValidEpochMs(obj.writtenAtMs)) {
        const derived = deriveWrittenAtMs(obj)
        obj.writtenAtMs = derived
        // tsMs: use derived value or null (will be same as writtenAtMs for legacy)
        if (!isValidEpochMs(obj.tsMs)) {
          obj.tsMs = derived
        }
      }
      return obj as unknown as TokenSnapshot
    })
  } catch (error) {
    console.error(`[snapshot] Failed to get snapshot history for ${mint}:`, error)
    return []
  }
}

/**
 * Get all tracked mints
 */
export async function getTrackedMints(): Promise<string[]> {
  try {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      return []
    }

    const mints = await kv.smembers<string>("snap:index").catch(() => [])
    return mints || []
  } catch (error) {
    console.error("[v0] Failed to get tracked mints:", error)
    return []
  }
}

/**
 * Get all snapshots from the last 24 hours
 */
export async function getSnapshotsLast24h(): Promise<TokenSnapshot[]> {
  try {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      return []
    }

    const mints = await getTrackedMints()
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000
    const allSnapshots: TokenSnapshot[] = []

    for (const mint of mints) {
      const history = await getSnapshotHistory(mint, 200)
      const recent = history.filter(s => s.ts >= twentyFourHoursAgo)
      allSnapshots.push(...recent)
    }

    return allSnapshots
  } catch (error) {
    console.error("[v0] Failed to get snapshots from last 24h:", error)
    return []
  }
}
