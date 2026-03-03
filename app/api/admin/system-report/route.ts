import { NextRequest, NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { verifyOpsPasswordFromHeader } from "@/lib/auth-helpers"
import { getTrackedMints, getSnapshotHistory } from "@/lib/snapshotLogger"
import { scanSnapshotRecency, getSnapshotRecencyMs } from "@/lib/snapshotRecency"
import { getCutoffMs24h, getKvIdentity } from "@/lib/getCutoffMs24h"
import { getRecentLeadTimeProofs } from "@/lib/lead-time/storage"

export const dynamic = "force-dynamic"

const PROOF_STALE_THRESHOLD_MS = 3 * 60 * 60 * 1000 // 3 hours (cron runs every 2h)

/**
 * GET /api/admin/system-report
 *
 * Single compact JSON "truth report" that merges:
 *   1) KV snapshot health (snap:index + sample snap:list)
 *   2) Proof engine health (alpha ledger + harvest telemetry)
 *   3) Lead-time recent proofs
 *   4) Gate diagnosis (why signals might be empty)
 *
 * Protected by x-ops-password.
 */
export async function GET(request: NextRequest) {
  if (!verifyOpsPasswordFromHeader(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  const t0 = Date.now()
  const nowMs = Date.now()
  const nowISO = new Date(nowMs).toISOString()
  const cutoffMs = getCutoffMs24h(nowMs)
  const cutoffISO = new Date(cutoffMs).toISOString()
  const gates: string[] = []

  // ── 1) KV Snapshots ──
  let kvSection: Record<string, unknown>
  try {
    const trackedMints = await getTrackedMints()
    const safeMints = trackedMints.filter(
      (m): m is string => typeof m === "string" && m.length > 0
    )

    // ── pickRecentSamples: light-scan up to 200 mints, pick 5 with most recent data ──
    async function pickRecentSamples(
      mints: string[],
      cutoff: number,
      maxCandidates = 200,
      maxSamples = 5,
    ): Promise<{ picked: string[]; mode: "recent" | "fallback" }> {
      const candidates = mints.slice(0, maxCandidates)
      const scored: { mint: string; newestMs: number }[] = []

      // Light-read in batches: 1 snapshot per mint, just to get newest timestamp
      const BATCH = 25
      for (let i = 0; i < candidates.length; i += BATCH) {
        const batch = candidates.slice(i, i + BATCH)
        const results = await Promise.all(
          batch.map(async (m) => {
            try {
              const h = await getSnapshotHistory(m, 1)
              if (!h.length) return null
              const scan = scanSnapshotRecency(h, cutoff)
              if (scan.newestRecencyMs && scan.newestRecencyMs >= cutoff) {
                return { mint: m, newestMs: scan.newestRecencyMs }
              }
              return null
            } catch {
              return null
            }
          }),
        )
        for (const r of results) {
          if (r) scored.push(r)
        }
      }

      if (scored.length > 0) {
        scored.sort((a, b) => b.newestMs - a.newestMs)
        return { picked: scored.slice(0, maxSamples).map((s) => s.mint), mode: "recent" }
      }
      // Fallback: first N mints from the index (same as old behavior)
      return { picked: mints.slice(0, maxSamples), mode: "fallback" }
    }

    const { picked: sampleMints, mode: sampleMode } = await pickRecentSamples(safeMints, cutoffMs)

    // Build full sample details for each picked mint
    const samples: Record<string, unknown>[] = []
    for (const mint of sampleMints) {
      try {
        const listKey = `snap:list:${mint}`
        const [llen, history] = await Promise.all([
          kv.llen(listKey).catch(() => 0),
          getSnapshotHistory(mint, 3),
        ])

        const scan = scanSnapshotRecency(history, cutoffMs)

        // Extract per-snapshot timestamps for the sample
        const snapshotPreviews = history.slice(0, 3).map((s: any) => {
          const recency = getSnapshotRecencyMs(s)
          return {
            recencyMs: recency,
            recencyISO: recency ? new Date(recency).toISOString() : null,
            keys: Object.keys(s).slice(0, 10),
          }
        })

        samples.push({
          mint: mint.slice(0, 12) + "...",
          mintFull: mint,
          llen,
          sampleCount: history.length,
          newestRecencyMs: scan.newestRecencyMs,
          newestRecencyISO: scan.newestRecencyMs
            ? new Date(scan.newestRecencyMs).toISOString()
            : null,
          countLast24h: scan.countLast24h,
          snapshotPreviews,
        })
      } catch {
        samples.push({ mint: mint.slice(0, 12) + "...", error: "read_failed" })
      }
    }

    if (safeMints.length === 0) gates.push("snap_index_empty")

    // ── Overall recency scan: check ALL mints (not just samples) for gate accuracy ──
    // Fetch only the newest 1 snapshot per mint for a fast recency check.
    let overallNewestMs: number | null = null
    let overallCountLast24h = 0
    const BATCH_SIZE = 20
    for (let i = 0; i < safeMints.length; i += BATCH_SIZE) {
      const batch = safeMints.slice(i, i + BATCH_SIZE)
      const results = await Promise.all(
        batch.map((m) => getSnapshotHistory(m, 1).catch(() => []))
      )
      for (const history of results) {
        if (!history.length) continue
        const scan = scanSnapshotRecency(history, cutoffMs)
        overallCountLast24h += scan.countLast24h
        if (scan.newestRecencyMs && (overallNewestMs === null || scan.newestRecencyMs > overallNewestMs)) {
          overallNewestMs = scan.newestRecencyMs
        }
      }
    }

    // Gate uses overall scan, NOT sample-only data
    if (overallCountLast24h === 0 && safeMints.length > 0) gates.push("no_snapshots_in_24h")

    // Sample-level freshness (for display only)
    let sampleNewestMs: number | null = null
    let sampleCountLast24h = 0
    for (const s of samples) {
      const ms = (s as any).newestRecencyMs
      if (typeof ms === "number" && ms > 0 && (sampleNewestMs === null || ms > sampleNewestMs)) {
        sampleNewestMs = ms
      }
      const c24 = (s as any).countLast24h
      if (typeof c24 === "number") sampleCountLast24h += c24
    }

    kvSection = {
      ok: true,
      key: "snap:index + snap:list:{mint}",
      source: "kv",
      lastWriteAt: overallNewestMs ? new Date(overallNewestMs).toISOString() : null,
      ageSec: overallNewestMs ? Math.round((nowMs - overallNewestMs) / 1000) : null,
      trackedMintsCount: safeMints.length,
      countLast24hOverall: overallCountLast24h,
      newestObservedAtOverall: overallNewestMs ? new Date(overallNewestMs).toISOString() : null,
      newestObservedAgeSecOverall: overallNewestMs ? Math.round((nowMs - overallNewestMs) / 1000) : null,
      countLast24hSampled: sampleCountLast24h,
      sampleMode,
      samples,
      kvIdentity: getKvIdentity(),
    }
  } catch (err) {
    kvSection = {
      ok: false,
      error: err instanceof Error ? err.message : "unknown",
    }
    gates.push("kv_unavailable")
  }

  // ── 2) Proof Engine Health ──
  // Reuse the same logic as /api/proof-engine-health: read harvest telemetry keys
  let proofSection: Record<string, unknown>
  try {
    const { storage } = await import("@/lib/storage")
    const TEL = "solrad:alpha:harvest"
    const [runAt, successAt, errorAt, status, count] = await Promise.all([
      storage.get(`${TEL}:last_run_at`),
      storage.get(`${TEL}:last_success_at`),
      storage.get(`${TEL}:last_error_at`),
      storage.get(`${TEL}:last_run_status`),
      storage.get(`${TEL}:last_processed_count`),
    ])

    const lastSuccessMs =
      typeof successAt === "number" && successAt > 0 ? successAt : null
    const lastRunMs =
      typeof runAt === "number" && runAt > 0 ? runAt : null
    const bestTs = lastSuccessMs ?? lastRunMs
    const isFresh =
      bestTs !== null && nowMs - bestTs <= PROOF_STALE_THRESHOLD_MS
    const ageSec = bestTs !== null ? Math.round((nowMs - bestTs) / 1000) : null

    if (!isFresh) gates.push("proof_engine_stale")

    proofSection = {
      ok: isFresh,
      key: TEL,
      source: "kv",
      lastWriteAt: bestTs ? new Date(bestTs).toISOString() : null,
      ageSec,
      isFresh,
      lastUpdateISO: bestTs ? new Date(bestTs).toISOString() : null,
      lastUpdateAgeSec: ageSec,
      lastRunStatus: typeof status === "string" ? status : null,
      lastProcessedCount: typeof count === "number" ? count : null,
      lastSuccessISO: lastSuccessMs
        ? new Date(lastSuccessMs).toISOString()
        : null,
      lastErrorISO:
        typeof errorAt === "number" && errorAt > 0
          ? new Date(errorAt).toISOString()
          : null,
    }
  } catch (err) {
    proofSection = {
      ok: false,
      error: err instanceof Error ? err.message : "unknown",
    }
    gates.push("proof_engine_read_failed")
  }

  // ── 2b) Lead-Time Harvest Health (cron telemetry) ──
  let leadtimeHarvestSection: Record<string, unknown>
  try {
    const { storage: st } = await import("@/lib/storage")
    const LT = "solrad:proof"
    const HIT = "solrad:cron:leadtime"
    const [ltRunAt, ltStatus, ltError, ltResult, hitAt, hitStatus, hitError] = await Promise.all([
      st.get(`${LT}:lastRunAt`),
      st.get(`${LT}:lastStatus`),
      st.get(`${LT}:lastError`),
      st.get(`${LT}:lastResult`),
      st.get(`${HIT}:lastHitAt`),
      st.get(`${HIT}:lastHitStatus`),
      st.get(`${HIT}:lastHitError`),
    ])

    const lastRunMs = typeof ltRunAt === "string" ? new Date(ltRunAt).getTime() : null
    const isFresh = lastRunMs !== null && nowMs - lastRunMs <= 45 * 60 * 1000 // 45 min (cron runs every 30)
    const ageSec = lastRunMs !== null ? Math.round((nowMs - lastRunMs) / 1000) : null

    if (!isFresh) gates.push("leadtime_harvest_stale")

    // Parse lastError if present
    let parsedError: Record<string, unknown> | null = null
    if (typeof ltError === "string") {
      try { parsedError = JSON.parse(ltError) } catch { parsedError = { raw: ltError } }
    }

    // Parse lastResult if present
    let parsedResult: Record<string, unknown> | null = null
    if (typeof ltResult === "string") {
      try { parsedResult = JSON.parse(ltResult) } catch { parsedResult = null }
    }

    // Compute cron hit age
    const hitAtMs = typeof hitAt === "string" ? new Date(hitAt).getTime() : null
    const hitAgeSec = hitAtMs !== null && Number.isFinite(hitAtMs) ? Math.round((nowMs - hitAtMs) / 1000) : null

    leadtimeHarvestSection = {
      ok: isFresh,
      key: LT,
      source: "kv",
      lastRunAt: typeof ltRunAt === "string" ? ltRunAt : null,
      ageSec,
      isFresh,
      status: typeof ltStatus === "string" ? ltStatus : null,
      lastError: parsedError,
      lastResult: parsedResult,
      // Cron hit telemetry (written on every cron invocation, even auth failures)
      cronHit: {
        lastHitAt: typeof hitAt === "string" ? hitAt : null,
        lastHitAgeSec: hitAgeSec,
        lastHitStatus: typeof hitStatus === "string" ? hitStatus : null,
        lastHitError: typeof hitError === "string" ? hitError : null,
      },
    }
  } catch (err) {
    leadtimeHarvestSection = {
      ok: false,
      error: err instanceof Error ? err.message : "unknown",
    }
    gates.push("leadtime_harvest_read_failed")
  }

  // ── 3) Lead-Time Recent ──
  const LEAD_TIME_RECENT_KEY = "solrad:leadtime:recent"
  const LEAD_TIME_ALT_KEYS = ["solrad:leadtime:proofs:recent", "leadtime:recent"]
  let leadtimeSection: Record<string, unknown>
  try {
    const proofs = await getRecentLeadTimeProofs(50)
    const recentCount = proofs.length

    // Derive scannedAt from newest proof
    let scannedAtMs: number | null = null
    for (const p of proofs) {
      const ts =
        typeof p.proofCreatedAt === "number" ? p.proofCreatedAt : 0
      if (ts > (scannedAtMs ?? 0)) scannedAtMs = ts
    }

    if (recentCount === 0) gates.push("leadtime_empty")

    // Key mismatch detector: if primary key is empty, check alternates (read-only)
    let keyMismatch: Record<string, unknown> | null = null
    if (recentCount === 0) {
      const { storage } = await import("@/lib/storage")
      const altResults: Record<string, unknown> = {}
      for (const altKey of LEAD_TIME_ALT_KEYS) {
        try {
          const altData = await storage.get(altKey)
          const altLen = Array.isArray(altData) ? altData.length : (altData ? 1 : 0)
          if (altLen > 0) {
            altResults[altKey] = { found: true, length: altLen }
          } else {
            altResults[altKey] = { found: false }
          }
        } catch {
          altResults[altKey] = { found: false, error: "read_failed" }
        }
      }
      // Also check the primary key directly via storage.get to rule out wrapper issues
      try {
        const directRead = await storage.get(LEAD_TIME_RECENT_KEY)
        const directLen = Array.isArray(directRead) ? directRead.length : (directRead ? 1 : 0)
        altResults[`${LEAD_TIME_RECENT_KEY} (direct)`] = { found: directLen > 0, length: directLen }
      } catch {
        altResults[`${LEAD_TIME_RECENT_KEY} (direct)`] = { found: false, error: "read_failed" }
      }
      const anyAltHasData = Object.values(altResults).some((v: any) => v.found)
      if (anyAltHasData) gates.push("leadtime_key_mismatch")
      keyMismatch = { primaryKey: LEAD_TIME_RECENT_KEY, alternates: altResults, mismatchDetected: anyAltHasData }
    }

    leadtimeSection = {
      ok: recentCount > 0,
      key: LEAD_TIME_RECENT_KEY,
      source: "kv",
      lastWriteAt: scannedAtMs ? new Date(scannedAtMs).toISOString() : null,
      ageSec: scannedAtMs ? Math.round((nowMs - scannedAtMs) / 1000) : null,
      recentCount,
      scannedAtISO: scannedAtMs
        ? new Date(scannedAtMs).toISOString()
        : null,
      scannedAgoSec: scannedAtMs
        ? Math.round((nowMs - scannedAtMs) / 1000)
        : null,
      ...(keyMismatch ? { keyMismatch } : {}),
    }
  } catch (err) {
    leadtimeSection = {
      ok: false,
      key: LEAD_TIME_RECENT_KEY,
      source: "kv",
      error: err instanceof Error ? err.message : "unknown",
    }
    gates.push("leadtime_read_failed")
  }

  // ── 4) Gate Diagnosis ──
  const allOk =
    gates.length === 0 &&
    (kvSection as any).ok !== false &&
    (proofSection as any).ok !== false &&
    (leadtimeSection as any).ok !== false

  const durationMs = Date.now() - t0

  return NextResponse.json(
    {
      ok: allOk,
      nowISO,
      cutoffISO,
      durationMs,
      kv: kvSection,
      proof: proofSection,
      leadtimeHarvest: leadtimeHarvestSection,
      leadtime: leadtimeSection,
      gates,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  )
}
