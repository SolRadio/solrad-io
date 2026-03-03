import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

const ALERT_KEY = "score-velocity:alerts"
const MAX_ALERTS = 20
const SINGLE_CYCLE_THRESHOLD = 12
const MULTI_CYCLE_THRESHOLD = 20
const MAX_PAIR_AGE_DAYS = 30
const MIN_LIQUIDITY = 10000
const MIN_DELTA = 5
const MIN_VOLUME_24H = 1000

interface SnapshotEntry {
  mint: string
  symbol: string
  solradScore: number
  price: number
  liquidityUsd: number
  volume24hUsd: number
  writtenAtMs: number
}

interface VelocityAlert {
  mint: string
  symbol: string
  scoreDelta: number
  currentScore: number
  previousScore: number
  priceUsd: number
  volume24h: number
  liquidityUsd: number
  pairAgeDays: number
  detectedAt: number
  surgeDetectedAt: number
}

export async function GET(request: Request) {
  const ua = request.headers.get("user-agent") ?? ""
  const isVercelCron = ua.includes("vercel-cron")
  const cronSecret = process.env.CRON_SECRET ?? process.env.SOLRAD_CRON_SECRET

  if (!isVercelCron) {
    const authHeader = request.headers.get("authorization")
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    // Get all tracked mint addresses from the snapshot index
    const mints: string[] = await kv.smembers("snap:index").catch(() => [])

    if (mints.length === 0) {
      return NextResponse.json({ ok: true, alerts: 0, reason: "No tracked mints" })
    }

    const alerts: VelocityAlert[] = []
    const now = Date.now()

    // Process mints in batches of 20 to stay within rate limits
    const BATCH_SIZE = 20
    for (let i = 0; i < mints.length; i += BATCH_SIZE) {
      const batch = mints.slice(i, i + BATCH_SIZE)

      await Promise.all(
        batch.map(async (mint) => {
          try {
            // Get last 3 snapshots (LPUSH means index 0 = newest)
            const snapshots = await kv.lrange<SnapshotEntry>(`snap:list:${mint}`, 0, 2)

            if (!snapshots || snapshots.length < 2) return

            const current = snapshots[0]
            const previous = snapshots[1]

            if (!current?.solradScore || !previous?.solradScore) return

            // Single-cycle delta
            const singleDelta = current.solradScore - previous.solradScore

            // Multi-cycle delta (across 3 snapshots)
            let multiDelta = 0
            if (snapshots.length >= 3 && snapshots[2]?.solradScore) {
              multiDelta = current.solradScore - snapshots[2].solradScore
            }

            const triggered =
              singleDelta >= SINGLE_CYCLE_THRESHOLD ||
              multiDelta >= MULTI_CYCLE_THRESHOLD

            if (!triggered) return

            // Filter: liquidity check
            if ((current.liquidityUsd ?? 0) < MIN_LIQUIDITY) return

            // Filter: pair age — estimate from first snapshot timestamp
            // Use the oldest snapshot we have to estimate age
            const oldestTs = snapshots[snapshots.length - 1]?.writtenAtMs ?? now
            const estimatedAgeDays = (now - oldestTs) / 86400000

            // For pair age, we use a loose estimate: if we've been tracking < 30 days, it qualifies
            // A more accurate check would use pairCreatedAt from the token data
            const pairAgeDays = Math.max(1, Math.round(estimatedAgeDays))
            if (pairAgeDays > MAX_PAIR_AGE_DAYS) return

            const scoreDelta = Math.max(singleDelta, multiDelta)

            // PROBLEM 3: Skip dead tokens -- minimum delta and volume filters
            if (scoreDelta < MIN_DELTA) return
            if ((current.volume24hUsd ?? 0) < MIN_VOLUME_24H) return
            // Skip tokens where score didn't actually move
            if (current.solradScore === previous.solradScore) return

            alerts.push({
              mint,
              symbol: current.symbol ?? "???",
              scoreDelta,
              currentScore: current.solradScore,
              previousScore: previous.solradScore,
              priceUsd: current.price ?? 0,
              volume24h: current.volume24hUsd ?? 0,
              liquidityUsd: current.liquidityUsd ?? 0,
              pairAgeDays,
              // PROBLEM 1 FIX: Use the snapshot's writtenAtMs as the true
              // detection time, NOT Date.now(). This is when the score
              // was actually recorded, not when the cron happened to run.
              detectedAt: current.writtenAtMs ?? now,
              surgeDetectedAt: current.writtenAtMs ?? now,
            })
          } catch {
            // Skip individual mint errors
          }
        })
      )
    }

    // Sort by score delta descending, then take top MAX_ALERTS
    alerts.sort((a, b) => b.scoreDelta - a.scoreDelta)
    const topAlerts = alerts.slice(0, MAX_ALERTS)

    // Merge with existing alerts, dedupe by mint
    const existing = (await kv.get<VelocityAlert[]>(ALERT_KEY).catch(() => null)) ?? []
    const merged = [...topAlerts, ...existing]

    // PROBLEM 2 FIX: Dedupe by mint — keep highest scoreDelta per mint,
    // and PRESERVE the original surgeDetectedAt from the first detection
    const seen = new Map<string, VelocityAlert>()
    for (const a of merged) {
      const prev = seen.get(a.mint)
      if (!prev) {
        seen.set(a.mint, a)
      } else if (a.scoreDelta > prev.scoreDelta) {
        // Keep the higher delta, but preserve the original detection timestamp
        seen.set(a.mint, {
          ...a,
          surgeDetectedAt: Math.min(
            a.surgeDetectedAt || a.detectedAt,
            prev.surgeDetectedAt || prev.detectedAt
          ),
          detectedAt: Math.min(
            a.surgeDetectedAt || a.detectedAt,
            prev.surgeDetectedAt || prev.detectedAt
          ),
        })
      }
    }

    const final = Array.from(seen.values())
      .sort((a, b) => b.scoreDelta - a.scoreDelta)
      .slice(0, MAX_ALERTS)

    // Filter: only keep surges detected in the last 2 hours
    const TWO_HOURS = 2 * 60 * 60 * 1000
    const freshFinal = final.filter(a => {
      const ts = a.surgeDetectedAt || a.detectedAt || 0
      return (now - ts) < TWO_HOURS
    })

    // Write back with 2-hour TTL (stale alerts auto-expire)
    await kv.set(ALERT_KEY, freshFinal, { ex: 7200 })

    // Track last run time
    await kv.set("solrad:last-velocity-run", Date.now())

    return NextResponse.json({
      ok: true,
      newAlerts: topAlerts.length,
      totalAlerts: freshFinal.length,
      staleFiltered: final.length - freshFinal.length,
      mintsScanned: mints.length,
    })
  } catch (error) {
    console.error("[v0] Score velocity cron failed:", error)
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 200 })
  }
}
