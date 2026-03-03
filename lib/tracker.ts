import { storage, CACHE_KEYS } from "./storage"
import type { TokenSnapshot, DailySnapshot, TrackerMetrics, RiskLabel } from "./types"

const MAX_SNAPSHOTS_PER_DAY = 24 // Reduced to prevent KV size limits (1 per hour max)
const MAX_SNAPSHOT_DAYS = 8
const SNAPSHOT_THROTTLE_MS = 10 * 60 * 1000 // 10 minutes
const SNAPSHOT_THROTTLE_KEY = "tracker:last_snapshot_at"

/**
 * Safely convert storage value to array (handles both parsed and string formats)
 */
function asArray<T>(val: unknown): T[] {
  if (!val) return []
  // Upstash/KV usually returns parsed objects/arrays already
  if (Array.isArray(val)) return val as T[]
  // Backward compat: sometimes stored as JSON string
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val)
      return Array.isArray(parsed) ? (parsed as T[]) : []
    } catch {
      return []
    }
  }
  return []
}

/**
 * Safely convert storage value to object (handles both parsed and string formats)
 */
function asObject<T extends Record<string, unknown>>(val: unknown): T | null {
  if (!val) return null
  if (typeof val === "object" && val !== null) return val as T
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val)
      return parsed && typeof parsed === "object" ? (parsed as T) : null
    } catch {
      return null
    }
  }
  return null
}

/**
 * Check if we should record a snapshot (throttled to once every 10 minutes)
 * Returns true if should record, false if throttled
 */
export async function shouldRecordSnapshot(now = Date.now()): Promise<boolean> {
  try {
    const lastSnapshotAt = await storage.get(SNAPSHOT_THROTTLE_KEY)
    
    if (!lastSnapshotAt) {
      // First snapshot ever
      await storage.set(SNAPSHOT_THROTTLE_KEY, now, { ex: 60 * 60 * 24 }) // 24h TTL
      return true
    }
    
    const timeSinceLastSnapshot = now - (lastSnapshotAt as number)
    
    if (timeSinceLastSnapshot >= SNAPSHOT_THROTTLE_MS) {
      // Enough time has passed
      await storage.set(SNAPSHOT_THROTTLE_KEY, now, { ex: 60 * 60 * 24 })
      return true
    }
    
    // Throttled
    return false
  } catch (error) {
    console.error("[v0] shouldRecordSnapshot check failed:", error)
    // Fail open - allow snapshot on error
    return true
  }
}

export async function saveSnapshot(
  tokens: Array<{
  address: string
  symbol: string
  name: string
  totalScore: number
  riskLabel: RiskLabel
  volume24h: number
  liquidity: number
  trendingRank?: number
  imageUrl?: string
  }>,
): Promise<void> {
  try {
    const now = Date.now()
    const today = new Date(now).toISOString().split("T")[0] // YYYY-MM-DD

    // Create snapshot
    const snapshot: DailySnapshot = {
      ts: now,
      tokens: tokens.slice(0, 50).map((t, idx) => ({
        mint: t.address,
        symbol: t.symbol,
        name: t.name,
        score: t.totalScore,
        label: t.riskLabel,
        volume24h: t.volume24h,
        liquidity: t.liquidity,
        rank: t.trendingRank ?? idx + 1,
        ...(t.imageUrl ? { imageUrl: t.imageUrl } : {}),
      })),
    }

    // Get today's snapshots
    const dayKey = CACHE_KEYS.SNAPSHOTS_DAY(today)
    const existingData = await storage.get(dayKey)
    const daySnapshots: DailySnapshot[] = existingData ? (existingData as DailySnapshot[]) : []

    // Add new snapshot (cap at MAX_SNAPSHOTS_PER_DAY)
    daySnapshots.push(snapshot)
    if (daySnapshots.length > MAX_SNAPSHOTS_PER_DAY) {
      daySnapshots.shift() // Remove oldest
    }

    // Save updated snapshots (store native object, not stringified)
    await storage.set(dayKey, daySnapshots, { ex: 60 * 60 * 24 * MAX_SNAPSHOT_DAYS }) // 8 days TTL

    // Update index
    const indexData = await storage.get(CACHE_KEYS.SNAPSHOTS_INDEX)
    const index: string[] = indexData ? (indexData as string[]) : []
    if (!index.includes(today)) {
      index.push(today)
      // Keep only last MAX_SNAPSHOT_DAYS
      if (index.length > MAX_SNAPSHOT_DAYS) {
        index.shift()
      }
      await storage.set(CACHE_KEYS.SNAPSHOTS_INDEX, index, { ex: 60 * 60 * 24 * MAX_SNAPSHOT_DAYS })
    }

    console.log(`[v0] Snapshot saved: key=${dayKey}, count=${snapshot.tokens.length}, date=${today}`)
  } catch (error) {
    console.error("[v0] Failed to save snapshot:", error)
  }
}

/**
 * Record snapshot if not throttled (best effort, never throws)
 * Calls both saveSnapshot() and logSnapshots()
 */
export async function recordSnapshotIfNeeded(
  tokens: Array<{
  address: string
  symbol: string
  name: string
  totalScore: number
  riskLabel: RiskLabel
  volume24h: number
  liquidity: number
  imageUrl?: string
    trendingRank?: number
  }>,
  source: "fresh" | "cached",
): Promise<void> {
  try {
    const should = await shouldRecordSnapshot()
    
    if (!should) {
      console.log("[v0] Snapshot skipped (throttled)")
      return
    }
    
    // Record to tracker system
    try {
      await saveSnapshot(tokens)
    } catch (err) {
      console.error("[v0] saveSnapshot failed:", err)
    }
    
    // Record to KV snapshot logger
    try {
      const { logSnapshots } = await import("./snapshotLogger")
      await logSnapshots(tokens)
    } catch (err) {
      console.error("[v0] logSnapshots failed:", err)
    }
    
    console.log(`[v0] Snapshot recorded (source=${source}) count=${tokens.length}`)
  } catch (error) {
    console.error("[v0] recordSnapshotIfNeeded failed:", error)
    // Best effort - never throw
  }
}

export async function getTrackerMetrics(
  window: "1h" | "4h" | "6h" | "24h" | "7d",
  mode: "treasure" | "all" = "treasure",
): Promise<{
  metrics: TrackerMetrics[]
  preQualified: TrackerMetrics[]
  totalSnapshots: number
  tokensTracked: number
  windowStart: number
  windowEnd: number
}> {
  try {
    const now = Date.now()
    const windowMs = {
      "1h": 1 * 60 * 60 * 1000,
      "4h": 4 * 60 * 60 * 1000,
      "6h": 6 * 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
    }[window]

    const windowStart = now - windowMs
    const cutoffISO = new Date(windowStart).toISOString()

    // Get snapshot index (safe parsing)
    const indexData = await storage.get(CACHE_KEYS.SNAPSHOTS_INDEX)
    const index = asArray<string>(indexData)

    console.log(`[v0] Tracker: Computing window=${window}, cutoff=${cutoffISO}`)

    // Load snapshots from relevant days
    const allSnapshots: DailySnapshot[] = []
    let totalSnapshotsLoaded = 0
    
    for (const day of index) {
      const dayKey = CACHE_KEYS.SNAPSHOTS_DAY(day)
      const dayData = await storage.get(dayKey)
      if (dayData) {
        const daySnapshots = asArray<DailySnapshot>(dayData)
        totalSnapshotsLoaded += daySnapshots.length
        
        // CRITICAL: Filter snapshots within window BEFORE aggregation
        const relevantSnapshots = daySnapshots.filter((s) => s.ts >= windowStart && s.ts <= now)
        allSnapshots.push(...relevantSnapshots)
      }
    }

    const windowSnapshotsUsed = allSnapshots.length

    console.log(
      `[v0] Tracker: window=${window}, totalLoaded=${totalSnapshotsLoaded}, windowUsed=${windowSnapshotsUsed}, cutoff=${cutoffISO}`
    )

    if (allSnapshots.length === 0) {
      console.log(`[v0] Tracker: No snapshots in window=${window}, returning empty`)
      return {
        metrics: [],
        preQualified: [],
        totalSnapshots: 0,
        tokensTracked: 0,
        windowStart,
        windowEnd: now,
      }
    }

    // Sort snapshots chronologically for proper delta calculation
    allSnapshots.sort((a, b) => a.ts - b.ts)

    // Count unique tokens across window snapshots ONLY
    const uniqueTokensInWindow = new Set(allSnapshots.flatMap((s) => s.tokens?.map((t) => t.mint) ?? [])).size
    console.log(`[v0] Tracker: uniqueTokensInWindow=${uniqueTokensInWindow}, snapshots=${allSnapshots.length}`)

    // Aggregate metrics by mint
    const metricsMap = new Map<
      string,
      {
        mint: string
        symbol: string
        name: string
        appearances: number
        firstScore: number
        lastScore: number
        latestSnapshot: TokenSnapshot
        firstSeen: number
        lastSeen: number
      }
    >()

    allSnapshots.forEach((snapshot) => {
      snapshot.tokens.forEach((token) => {
        // Filter by mode using current scoring system
        // TREASURE range: score >= 80 (with optional LOW RISK requirement)
        if (mode === "treasure") {
          // Include all tokens that have entered the SOLRAD pool (score >= 50)
          if (token.score < 50) return
        }

        const existing = metricsMap.get(token.mint)
        if (existing) {
          existing.appearances++
          existing.lastScore = token.score // Update to latest score
          
          // Update lastSeen and latestSnapshot if this is newer
          if (snapshot.ts >= existing.lastSeen) {
            existing.lastSeen = snapshot.ts
            existing.latestSnapshot = token
          }
        } else {
          metricsMap.set(token.mint, {
            mint: token.mint,
            symbol: token.symbol,
            name: token.name,
            appearances: 1,
            firstScore: token.score,
            lastScore: token.score,
            latestSnapshot: token,
            firstSeen: snapshot.ts,
            lastSeen: snapshot.ts,
          })
        }
      })
    })

    // Calculate final metrics
    const metrics: TrackerMetrics[] = Array.from(metricsMap.values()).map((m) => {
      const consistency = (m.appearances / allSnapshots.length) * 100
      // True delta: last score - first score within window
      const scoreDelta = m.lastScore - m.firstScore

    return {
      mint: m.mint,
      symbol: m.symbol,
      name: m.name,
      imageUrl: m.latestSnapshot.imageUrl,
      appearances: m.appearances,
      consistency,
      scoreDelta,
      latestScore: m.latestSnapshot.score,
      latestLabel: m.latestSnapshot.label,
      latestRank: m.latestSnapshot.rank,
      firstSeen: m.firstSeen,
      lastSeen: m.lastSeen,
    }
    })

    // Sort by consistency desc, then score delta desc, then latest score desc
    metrics.sort((a, b) => {
      if (Math.abs(b.consistency - a.consistency) > 0.1) return b.consistency - a.consistency
      if (Math.abs(b.scoreDelta - a.scoreDelta) > 1) return b.scoreDelta - a.scoreDelta
      return b.latestScore - a.latestScore
    })

    // Extract pre-qualified tokens (appeared 2+ times but low consistency)
    // These are tokens building consistency but not yet "Top Performers"
    const preQualified = metrics.filter(
      (m) => m.appearances >= 2 && m.latestScore >= 80 && m.consistency < 30
    )

    console.log(
      `[v0] Tracker: Computed ${metrics.length} performers, ${preQualified.length} pre-qualified for window=${window}`
    )

    return {
      metrics,
      preQualified,
      totalSnapshots: allSnapshots.length,
      tokensTracked: uniqueTokensInWindow,
      windowStart,
      windowEnd: now,
    }
  } catch (error) {
    console.error("[v0] Failed to get tracker metrics:", error)
    const now = Date.now()
    return {
      metrics: [],
      preQualified: [],
      totalSnapshots: 0,
      tokensTracked: 0,
      windowStart: now - 4 * 60 * 60 * 1000,
      windowEnd: now,
    }
  }
}
