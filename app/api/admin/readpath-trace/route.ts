import { NextRequest, NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { verifyOpsPasswordFromHeader } from "@/lib/auth-helpers"
import { getTrackedMints, getSnapshotHistory, type TokenSnapshot } from "@/lib/snapshotLogger"
import { scanSnapshotRecency, getSnapshotRecencyMs } from "@/lib/snapshotRecency"
import { getCutoffMs24h, getKvIdentity } from "@/lib/getCutoffMs24h"

export const dynamic = "force-dynamic"

/**
 * GET /api/admin/readpath-trace
 *
 * Read-path diagnostic that traces exactly the same code path
 * as /api/signal-outcomes -- calling the same helpers, same thresholds,
 * same KV keys -- and reports how many items survive each pipeline stage.
 *
 * Protected by x-ops-password.
 */

function getScore(s: any): number {
  const v = s?.solradScore ?? s?.score ?? s?.signalScore ?? s?.qualityScore ?? s?.compositeScore
  return typeof v === "number" ? v : Number(v ?? 0)
}

function getPrice(s: any): number | null {
  const v = s?.price ?? s?.priceUsd ?? s?.usdPrice
  const n = typeof v === "number" ? v : Number(v ?? NaN)
  return Number.isFinite(n) ? n : null
}

function isValidEpochMs(x: unknown): x is number {
  const n = typeof x === "string" ? Number(x) : x
  return typeof n === "number" && Number.isFinite(n) && n > 1_000_000_000_000
}

export async function GET(request: NextRequest) {
  // Accept password from header OR query param (browser tabs can't set headers)
  const qpPw = new URL(request.url).searchParams.get("_pw")
  const headerOk = verifyOpsPasswordFromHeader(request)
  const qpOk = !!qpPw && qpPw === process.env.OPS_PASSWORD
  if (!headerOk && !qpOk) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  const t0 = Date.now()
  const nowMs = Date.now()
  const cutoffMs = getCutoffMs24h(nowMs)
  const kvIdent = getKvIdentity()
  const minScore = 75 // default threshold used by signal-outcomes

  // ── 1) Snapshots section: reuse system-report data ──
  let trackedMints: string[] = []
  try {
    trackedMints = await getTrackedMints()
  } catch { /* */ }
  const safeMints = trackedMints.filter(
    (m): m is string => typeof m === "string" && m.length > 0
  )

  // Quick freshness check on 10 sample mints (light, no full scan)
  let overallNewest: number | null = null
  let countInWindow = 0
  const SAMPLE_COUNT = Math.min(safeMints.length, 10)
  const sampleIdxes = new Set<number>()
  // Pick evenly spaced samples
  for (let i = 0; i < SAMPLE_COUNT; i++) {
    sampleIdxes.add(Math.floor((i / SAMPLE_COUNT) * safeMints.length))
  }
  for (const idx of sampleIdxes) {
    try {
      const h = await getSnapshotHistory(safeMints[idx], 1)
      if (!h.length) continue
      const scan = scanSnapshotRecency(h, cutoffMs)
      if (scan.newestRecencyMs && (overallNewest === null || scan.newestRecencyMs > overallNewest)) {
        overallNewest = scan.newestRecencyMs
      }
      if (scan.countLast24h > 0) countInWindow++
    } catch { /* */ }
  }

  const snapshots = {
    trackedMintsCount: safeMints.length,
    countLast24hOverall: countInWindow,
    sampleSize: SAMPLE_COUNT,
    newestObservedAtOverall: overallNewest ? new Date(overallNewest).toISOString() : null,
    newestAgeSecOverall: overallNewest ? Math.round((nowMs - overallNewest) / 1000) : null,
    kvIdentity: kvIdent,
  }

  // ── 2) Signals Source: exact KV keys the signal-outcomes page reads ──
  const signalKeys = [
    { key: "snap:index", description: "Set of all tracked mint addresses" },
  ]
  // Also list 3 sample snap:list keys
  for (let i = 0; i < Math.min(3, safeMints.length); i++) {
    signalKeys.push({
      key: `snap:list:${safeMints[i]}`,
      description: `Snapshot history list for ${safeMints[i].slice(0, 12)}...`,
    })
  }

  // Probe each key
  const signalsSource: Record<string, unknown>[] = []
  for (const { key, description } of signalKeys) {
    try {
      if (key === "snap:index") {
        const count = await kv.scard("snap:index").catch(() => 0)
        signalsSource.push({
          key,
          description,
          exists: count > 0,
          approxCount: count,
          lastWriteAt: null, // sets don't have a timestamp
          ageSec: null,
        })
      } else {
        // snap:list:* is an lrange-based list
        const llen = await kv.llen(key).catch(() => 0)
        let lastWriteAt: string | null = null
        let ageSec: number | null = null
        if (llen > 0) {
          // Read newest entry to get timestamp
          const newest = await kv.lrange(key, 0, 0).catch(() => [])
          if (newest.length > 0) {
            const entry = newest[0] as any
            const ms = getSnapshotRecencyMs(entry)
            if (ms) {
              lastWriteAt = new Date(ms).toISOString()
              ageSec = Math.round((nowMs - ms) / 1000)
            }
          }
        }
        signalsSource.push({
          key,
          description,
          exists: llen > 0,
          approxCount: llen,
          lastWriteAt,
          ageSec,
        })
      }
    } catch {
      signalsSource.push({
        key,
        description,
        exists: false,
        approxCount: 0,
        error: "probe_failed",
      })
    }
  }

  // ── 3) Filters: default thresholds used by signal-outcomes ──
  const filters = {
    minScore,
    cutoffMs,
    cutoffISO: new Date(cutoffMs).toISOString(),
    windowHours: 24,
    minSnapshotsRequired: 1,
    sortDefault: "priceChangePct24h",
    limitDefault: 50,
    limitMax: 100,
    note: "Tokens need >= 1 snapshot in 24h window with score >= minScore to produce a signal",
  }

  // ── 4) Stage counts: trace how many items survive each pipeline stage ──
  // We run through a subset of mints (up to 50) to compute stage counts
  // without doing a full heavy scan
  const TRACE_LIMIT = Math.min(safeMints.length, 50)
  let stageRaw = 0
  let stageTimeWindow = 0
  let stageThreshold = 0
  let stageFinal = 0
  let sampleMintTraces: Record<string, unknown>[] = []

  for (let i = 0; i < TRACE_LIMIT; i++) {
    const rawMint = safeMints[i]
    stageRaw++

    try {
      const history = await getSnapshotHistory(rawMint, 80)
      if (!history.length) continue

      const scan = scanSnapshotRecency(history, cutoffMs)
      const recent = history.filter((s) => {
        const ms = getSnapshotRecencyMs(s)
        return ms !== null && ms >= cutoffMs
      })

      if (recent.length === 0) continue
      stageTimeWindow++

      const hasAboveThreshold = recent.some((s) => getScore(s) >= minScore)
      if (!hasAboveThreshold) continue
      stageThreshold++

      // Final validation: would this produce a valid signal?
      const firstSeen = recent.find((s) => getScore(s) >= minScore)
      if (firstSeen) {
        const recency = getSnapshotRecencyMs(firstSeen)
        if (recency && isValidEpochMs(recency)) {
          stageFinal++
        }
      }

      // Capture up to 5 sample traces for debugging
      if (sampleMintTraces.length < 5) {
        const maxScore = Math.max(...recent.map(getScore))
        const price = getPrice(recent[recent.length - 1])
        sampleMintTraces.push({
          mint: rawMint.slice(0, 12) + "...",
          historyLen: history.length,
          recentLen: recent.length,
          maxScoreInWindow: maxScore,
          priceNow: price,
          passedThreshold: hasAboveThreshold,
          passedFinal: stageFinal > sampleMintTraces.length,
        })
      }
    } catch { /* skip */ }
  }

  // Extrapolate to full set
  const ratio = safeMints.length > 0 ? safeMints.length / TRACE_LIMIT : 0

  const stages = {
    tracedMints: TRACE_LIMIT,
    totalMints: safeMints.length,
    extrapolationRatio: Math.round(ratio * 100) / 100,
    stage_raw: stageRaw,
    stage_time_window: stageTimeWindow,
    stage_threshold: stageThreshold,
    stage_final: stageFinal,
    stage_final_extrapolated: Math.round(stageFinal * ratio),
    sampleTraces: sampleMintTraces,
    dropoff: {
      raw_to_timewindow: stageRaw > 0 ? `${Math.round((1 - stageTimeWindow / stageRaw) * 100)}% dropped` : "n/a",
      timewindow_to_threshold: stageTimeWindow > 0 ? `${Math.round((1 - stageThreshold / stageTimeWindow) * 100)}% dropped` : "n/a",
      threshold_to_final: stageThreshold > 0 ? `${Math.round((1 - stageFinal / stageThreshold) * 100)}% dropped` : "n/a",
    },
  }

  // ── 5) Verdict: flags that explain why results may be empty ──
  const verdict: string[] = []

  if (safeMints.length === 0) verdict.push("missing_key:snap_index_empty")
  if (countInWindow === 0 && safeMints.length > 0) verdict.push("stale_key:no_snapshots_in_24h_window")
  if (overallNewest && (nowMs - overallNewest) > 4 * 60 * 60 * 1000) verdict.push("stale_key:newest_snapshot_older_than_4h")
  if (stageTimeWindow === 0 && stageRaw > 0) verdict.push("time_window_zero:all_snapshots_outside_24h")
  if (stageThreshold === 0 && stageTimeWindow > 0) verdict.push(`threshold_too_high:no_scores_above_${minScore}`)
  if (stageFinal === 0 && stageThreshold > 0) verdict.push("validation_dropped_all:detectedAt_or_mint_invalid")
  if (stageRaw > 0 && stageFinal === 0) verdict.push("read_mismatch:snapshots_exist_but_zero_signals")
  if (kvIdent === "KV_NOT_SET") verdict.push("missing_key:kv_not_configured")

  // Check for key existence mismatches
  const indexProbe = signalsSource.find((s) => s.key === "snap:index")
  const listProbes = signalsSource.filter((s) => (s.key as string).startsWith("snap:list:"))
  if (indexProbe?.exists && listProbes.length > 0 && listProbes.every((p) => !p.exists)) {
    verdict.push("read_mismatch:index_has_mints_but_lists_empty")
  }

  if (verdict.length === 0) verdict.push("ok")

  const durationMs = Date.now() - t0

  return NextResponse.json(
    {
      ok: true,
      generatedAt: new Date(nowMs).toISOString(),
      durationMs,
      snapshots,
      signals_source: signalsSource,
      filters,
      stages,
      verdict,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  )
}
