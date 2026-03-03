import { NextResponse } from "next/server"
import { readLedger, readMeta, normalizeMint, isValidMintStr } from "@/lib/alpha-ledger"
import { getRecentLeadTimeProofs } from "@/lib/lead-time/storage"
import { storage } from "@/lib/storage"

const STALE_THRESHOLD_MS = 3 * 60 * 60 * 1000 // 3 hours (cron runs every 2h)
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Pick the most trustworthy "last activity" timestamp.
 * Priority: max of (meta timestamp, newest entry timestamp).
 * Returns { ts, source } where source explains which value won.
 */
function bestTimestamp(
  metaTs: number | null,
  newestEntryTs: number | null,
): { ts: number | null; source: string } {
  const mOk = metaTs !== null && Number.isFinite(metaTs) && metaTs > 0
  const eOk = newestEntryTs !== null && Number.isFinite(newestEntryTs) && newestEntryTs > 0

  if (mOk && eOk) {
    return metaTs! >= newestEntryTs!
      ? { ts: metaTs, source: "meta" }
      : { ts: newestEntryTs, source: "newestEntry" }
  }
  if (mOk) return { ts: metaTs, source: "meta" }
  if (eOk) return { ts: newestEntryTs, source: "newestEntry (meta missing)" }
  return { ts: null, source: "none" }
}

function isFresh(ts: number | null, nowMs: number): boolean {
  return ts !== null && Number.isFinite(ts) && ts > 0 && (nowMs - ts) <= STALE_THRESHOLD_MS
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  const internalToken = request.headers.get("x-internal-job-token")
  const expectedInternal = process.env.INTERNAL_JOB_TOKEN
  const isAuthed = (authHeader && cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (internalToken && expectedInternal && internalToken === expectedInternal)
  if (!isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const start = Date.now()
  const nowMs = Date.now()
  const nowISO = new Date(nowMs).toISOString()
  const cutoff30d = nowMs - THIRTY_DAYS_MS

  const { searchParams } = new URL(request.url)
  const debug = searchParams.get("debug") === "1"

  // ── Alpha Ledger ──
  let alphaStatus: "OK" | "DEGRADED" | "UNKNOWN" = "UNKNOWN"
  let alphaStatusReason = ""
  let alphaLastUpdateAt: string | null = null
  let alphaLastUpdateAgoSec: number | null = null
  let alphaEntries30d = 0
  let alphaUniqueMints30d = 0
  let alphaVoidedCount = 0
  let alphaInvalidCount30d = 0
  let alphaLedgerHash: string | null = null
  let alphaHashUpdatedAt: number | null = null
  let alphaHashEntryCount: number | null = null
  let kvAlphaOk = true
  let kvAlphaError = ""

  // Debug collectors
  let dbgAlphaMetaLastWriteAt: string | null = null
  let dbgAlphaMetaHashUpdatedAt: number | null = null
  let dbgAlphaNewestDetectedAt: string | null = null
  let dbgAlphaNewestCreatedAt: string | null = null
  let dbgAlphaLastUpdateSource = "none"
  let dbgBadMintCount = 0
  const dbgBadMintSamples: Array<{ id: string; mintType: string; mintPreview: string }> = []

  try {
    const [entries, meta] = await Promise.all([readLedger(), readMeta()])

    // Voided total
    alphaVoidedCount = entries.filter((e) => e.voided).length

    // Normalize all mints safely at read-time (never crashes)
    const entriesWithSafeMint = entries.map((e) => {
      const safe = normalizeMint(e.mint)
      if (safe !== e.mint) {
        dbgBadMintCount++
        if (dbgBadMintSamples.length < 3) {
          dbgBadMintSamples.push({
            id: typeof e.id === "string" ? e.id : "??",
            mintType: typeof e.mint,
            mintPreview: String(e.mint).slice(0, 80),
          })
        }
      }
      return { ...e, mint: safe }
    })

    // Active entries within 30d
    const active = entriesWithSafeMint.filter((e) => !e.voided)
    const active30d = active.filter((e) => {
      const ts = new Date(e.detectedAt).getTime()
      return Number.isFinite(ts) && ts >= cutoff30d
    })
    alphaEntries30d = active30d.length

    // Unique mints within 30d (using safe normalized values)
    const mintSet30d = new Set<string>()
    for (const e of active30d) {
      if (e.mint.length > 0 && isValidMintStr(e.mint)) mintSet30d.add(e.mint)
    }
    alphaUniqueMints30d = mintSet30d.size

    // Invalid: entries with empty/bad mint or invalid date
    alphaInvalidCount30d = entriesWithSafeMint.filter((e) => {
      if (e.mint.length === 0 || !isValidMintStr(e.mint)) return true
      const ts = new Date(e.detectedAt).getTime()
      if (!Number.isFinite(ts) || ts <= 0) return true
      return false
    }).length

    // Compute newest entry timestamps from real data
    let newestDetected = 0
    let newestCreated = 0
    for (const e of active) {
      const d = new Date(e.detectedAt).getTime()
      if (Number.isFinite(d) && d > newestDetected) newestDetected = d
      const c = new Date(e.createdAt).getTime()
      if (Number.isFinite(c) && c > newestCreated) newestCreated = c
    }
    const newestEntryTs = Math.max(newestDetected, newestCreated) || null

    // Meta timestamp
    let metaTs: number | null = null
    if (meta?.lastWriteAt) {
      const t = new Date(meta.lastWriteAt).getTime()
      if (Number.isFinite(t) && t > 0) metaTs = t
    }

    // Pick best timestamp (real-data fallback)
    const best = bestTimestamp(metaTs, newestEntryTs)
    dbgAlphaLastUpdateSource = best.source

    if (best.ts) {
      alphaLastUpdateAt = new Date(best.ts).toISOString()
      alphaLastUpdateAgoSec = Math.round((nowMs - best.ts) / 1000)
    }

    // Status: fresh if best timestamp is within threshold, OR if entries30d > 0 and newest is fresh
    if (isFresh(best.ts, nowMs)) {
      alphaStatus = "OK"
      alphaStatusReason = `fresh via ${best.source}`
    } else if (alphaEntries30d > 0 && newestEntryTs && isFresh(newestEntryTs, nowMs)) {
      alphaStatus = "OK"
      alphaStatusReason = "fresh via newestEntry (meta stale)"
    } else if (alphaEntries30d > 0) {
      alphaStatus = "OK"
      alphaStatusReason = `${alphaEntries30d} entries in 30d, last update ${best.source}`
    } else if (best.ts !== null) {
      alphaStatus = "DEGRADED"
      alphaStatusReason = `stale: last update ${Math.round((nowMs - best.ts) / 60000)}m ago via ${best.source}`
    } else {
      alphaStatus = "UNKNOWN"
      alphaStatusReason = "no entries, no meta"
    }

    // Extract hash fields from meta
    if (meta) {
      alphaLedgerHash = (meta as Record<string, unknown>).ledgerHash as string ?? null
      alphaHashUpdatedAt = (meta as Record<string, unknown>).hashUpdatedAt as number ?? null
      alphaHashEntryCount = (meta as Record<string, unknown>).hashEntryCount as number ?? null
    }

    // Debug data
    dbgAlphaMetaLastWriteAt = meta?.lastWriteAt ?? null
    dbgAlphaMetaHashUpdatedAt = (meta as Record<string, unknown> | null)?.hashUpdatedAt as number ?? null
    dbgAlphaNewestDetectedAt = newestDetected > 0 ? new Date(newestDetected).toISOString() : null
    dbgAlphaNewestCreatedAt = newestCreated > 0 ? new Date(newestCreated).toISOString() : null
  } catch (err) {
    kvAlphaOk = false
    kvAlphaError = err instanceof Error ? err.message : "unknown"
    alphaStatus = "UNKNOWN"
    alphaStatusReason = `kv read failed: ${kvAlphaError}`
  }

  // ── Lead-Time ──
  let leadStatus: "OK" | "DEGRADED" | "UNKNOWN" = "UNKNOWN"
  let leadStatusReason = ""
  let leadLastProofAt: string | null = null
  let leadLastProofAgoSec: number | null = null
  let leadProofs30d = 0
  let leadUniqueMints30d = 0
  let kvLeadOk = true
  let kvLeadError = ""

  let dbgLeadNewestObservedAt: string | null = null
  let dbgLeadNewestCreatedAt: string | null = null
  let dbgLeadLastUpdateSource = "none"

  try {
    const proofs = await getRecentLeadTimeProofs(50)
    const within30d = proofs.filter((p) => {
      const ts = typeof p.proofCreatedAt === "number" ? p.proofCreatedAt : 0
      return ts >= cutoff30d
    })
    leadProofs30d = within30d.length

    const leadMintSet = new Set<string>()
    for (const p of within30d) {
      const m = normalizeMint(p.mint)
      if (m.length > 0) leadMintSet.add(m)
    }
    leadUniqueMints30d = leadMintSet.size

    // Compute newest timestamps from real data
    let newestCreated = 0
    let newestObserved = 0
    for (const p of proofs) {
      const c = typeof p.proofCreatedAt === "number" ? p.proofCreatedAt : 0
      if (c > newestCreated) newestCreated = c
      const o = typeof p.observationEvent?.blockTimestamp === "number" ? p.observationEvent.blockTimestamp : 0
      if (o > newestObserved) newestObserved = o
    }
    const newestProofTs = Math.max(newestCreated, newestObserved) || null
    const best = bestTimestamp(null, newestProofTs) // lead has no separate meta
    dbgLeadLastUpdateSource = best.source

    if (best.ts && best.ts > 0) {
      leadLastProofAt = new Date(best.ts).toISOString()
      leadLastProofAgoSec = Math.round((nowMs - best.ts) / 1000)
    }

    if (isFresh(best.ts, nowMs)) {
      leadStatus = "OK"
      leadStatusReason = `fresh via ${best.source}`
    } else if (leadProofs30d > 0) {
      leadStatus = "OK"
      leadStatusReason = `${leadProofs30d} proofs in 30d`
    } else if (best.ts !== null) {
      leadStatus = "DEGRADED"
      leadStatusReason = `stale: last proof ${Math.round((nowMs - best.ts) / 60000)}m ago`
    } else {
      leadStatus = "UNKNOWN"
      leadStatusReason = "no proofs found"
    }

    dbgLeadNewestObservedAt = newestObserved > 0 ? new Date(newestObserved).toISOString() : null
    dbgLeadNewestCreatedAt = newestCreated > 0 ? new Date(newestCreated).toISOString() : null
  } catch (err) {
    kvLeadOk = false
    kvLeadError = err instanceof Error ? err.message : "unknown"
    leadStatus = "UNKNOWN"
    leadStatusReason = `kv read failed: ${kvLeadError}`
  }

  // ── KV ──
  const kvStatus: "OK" | "DEGRADED" | "UNKNOWN" = kvAlphaOk && kvLeadOk ? "OK" : "DEGRADED"

  // ── Overall (fair rules) ──
  // OK: kv ok AND (alpha ok OR lead ok)
  // DEGRADED: kv ok but both alpha and lead are stale/empty
  // UNKNOWN: kv read failed
  let overallStatus: "OK" | "DEGRADED" | "UNKNOWN"
  let overallReason: string

  if (kvStatus !== "OK") {
    overallStatus = "UNKNOWN"
    overallReason = `kv ${kvStatus}`
  } else if (alphaStatus === "OK" || leadStatus === "OK") {
    overallStatus = "OK"
    overallReason = [
      alphaStatus === "OK" ? "alpha ok" : `alpha ${alphaStatus.toLowerCase()}`,
      leadStatus === "OK" ? "lead ok" : `lead ${leadStatus.toLowerCase()}`,
    ].join(", ")
  } else {
    overallStatus = "DEGRADED"
    overallReason = `alpha: ${alphaStatusReason}; lead: ${leadStatusReason}`
  }

  const latencyMs = Date.now() - start

  // ── Harvest Run Telemetry ──
  let harvestLastRunAt: number | null = null
  let harvestLastSuccessAt: number | null = null
  let harvestLastErrorAt: number | null = null
  let harvestLastStatus: string | null = null
  let harvestLastProcessedCount: number | null = null

  try {
    const TEL = "solrad:alpha:harvest"
    const [runAt, successAt, errorAt, status, count] = await Promise.all([
      storage.get(`${TEL}:last_run_at`),
      storage.get(`${TEL}:last_success_at`),
      storage.get(`${TEL}:last_error_at`),
      storage.get(`${TEL}:last_run_status`),
      storage.get(`${TEL}:last_processed_count`),
    ])
    harvestLastRunAt = typeof runAt === "number" ? runAt : null
    harvestLastSuccessAt = typeof successAt === "number" ? successAt : null
    harvestLastErrorAt = typeof errorAt === "number" ? errorAt : null
    harvestLastStatus = typeof status === "string" ? status : null
    harvestLastProcessedCount = typeof count === "number" ? count : null
  } catch {
    // non-fatal: telemetry keys may not exist yet
  }

  // ── Alpha freshness fallback: if meta + entries both missing, use harvest telemetry ──
  if (alphaLastUpdateAt === null) {
    if (harvestLastSuccessAt !== null && Number.isFinite(harvestLastSuccessAt) && harvestLastSuccessAt > 0) {
      // Fallback 1: harvest telemetry knows when the last successful run was
      alphaLastUpdateAt = new Date(harvestLastSuccessAt).toISOString()
      alphaLastUpdateAgoSec = Math.round((nowMs - harvestLastSuccessAt) / 1000)
      dbgAlphaLastUpdateSource = "harvest_telemetry"

      if (isFresh(harvestLastSuccessAt, nowMs)) {
        alphaStatus = "OK"
        alphaStatusReason = "fresh via harvest_telemetry (meta missing)"
      } else if (alphaEntries30d > 0) {
        alphaStatus = "OK"
        alphaStatusReason = `${alphaEntries30d} entries in 30d, last harvest ${Math.round((nowMs - harvestLastSuccessAt) / 60000)}m ago`
      } else {
        alphaStatus = "DEGRADED"
        alphaStatusReason = `stale: last harvest success ${Math.round((nowMs - harvestLastSuccessAt) / 60000)}m ago (meta missing)`
      }
    } else if (harvestLastRunAt !== null && Number.isFinite(harvestLastRunAt) && harvestLastRunAt > 0) {
      // Fallback 2: harvest ran but may not have succeeded -- still better than "unknown"
      alphaLastUpdateAt = new Date(harvestLastRunAt).toISOString()
      alphaLastUpdateAgoSec = Math.round((nowMs - harvestLastRunAt) / 1000)
      dbgAlphaLastUpdateSource = "harvest_last_run"

      if (alphaEntries30d > 0) {
        alphaStatus = "OK"
        alphaStatusReason = `${alphaEntries30d} entries in 30d, last run ${Math.round((nowMs - harvestLastRunAt) / 60000)}m ago`
      } else {
        alphaStatus = "DEGRADED"
        alphaStatusReason = `harvest ran ${Math.round((nowMs - harvestLastRunAt) / 60000)}m ago but meta missing, status: ${harvestLastStatus ?? "unknown"}`
      }
    }
    // else: keep the existing source="none" / UNKNOWN status set earlier
  }

  // Re-derive overall now that alpha may have been patched by harvest fallback
  if (kvStatus !== "OK") {
    overallStatus = "UNKNOWN"
    overallReason = `kv ${kvStatus}`
  } else if (alphaStatus === "OK" || leadStatus === "OK") {
    overallStatus = "OK"
    overallReason = [
      alphaStatus === "OK" ? "alpha ok" : `alpha ${alphaStatus.toLowerCase()}`,
      leadStatus === "OK" ? "lead ok" : `lead ${leadStatus.toLowerCase()}`,
    ].join(", ")
  } else {
    overallStatus = "DEGRADED"
    overallReason = `alpha: ${alphaStatusReason}; lead: ${leadStatusReason}`
  }

  const body: Record<string, unknown> = {
    ok: overallStatus === "OK",
    now: nowISO,
    latencyMs,
    alpha: {
      lastUpdateAt: alphaLastUpdateAt,
      lastUpdateAgoSec: alphaLastUpdateAgoSec,
      entries30d: alphaEntries30d,
      uniqueMints30d: alphaUniqueMints30d,
      voidedCount: alphaVoidedCount,
      invalidCount: alphaInvalidCount30d,
      ledgerHash: alphaLedgerHash,
      hashUpdatedAt: alphaHashUpdatedAt,
      hashEntryCount: alphaHashEntryCount,
      status: alphaStatus,
      statusReason: alphaStatusReason,
      lastUpdateSource: dbgAlphaLastUpdateSource,
      metaLastWriteAt: dbgAlphaMetaLastWriteAt,
      metaKeyUsed: "solrad:alpha:ledger:meta",
      // Keep old field name for backwards compat
      lastHarvestAt: alphaLastUpdateAt,
      lastHarvestAgoSec: alphaLastUpdateAgoSec,
    },
    lead: {
      lastProofAt: leadLastProofAt,
      lastProofAgoSec: leadLastProofAgoSec,
      proofs30d: leadProofs30d,
      uniqueMints30d: leadUniqueMints30d,
      status: leadStatus,
      statusReason: leadStatusReason,
    },
    kv: {
      status: kvStatus,
      ...(kvAlphaError ? { alphaErrorCode: "KV_READ_FAILED", alphaError: kvAlphaError } : {}),
      ...(kvLeadError ? { leadErrorCode: "KV_READ_FAILED", leadError: kvLeadError } : {}),
    },
    overall: { status: overallStatus, reason: overallReason },
    harvest: {
      lastRunAt: harvestLastRunAt,
      lastSuccessAt: harvestLastSuccessAt,
      lastErrorAt: harvestLastErrorAt,
      lastStatus: harvestLastStatus,
      lastProcessedCount: harvestLastProcessedCount,
    },
  }

  if (debug) {
    body._debug = {
      nowIso: nowISO,
      staleThresholdMs: STALE_THRESHOLD_MS,
      alpha: {
        entries30d: alphaEntries30d,
        uniqueMints30d: alphaUniqueMints30d,
        metaLastWriteAt: dbgAlphaMetaLastWriteAt,
        metaHashUpdatedAt: dbgAlphaMetaHashUpdatedAt,
        newestEntryDetectedAt: dbgAlphaNewestDetectedAt,
        newestEntryCreatedAt: dbgAlphaNewestCreatedAt,
        lastUpdateSource: dbgAlphaLastUpdateSource,
        lastUpdateAt: alphaLastUpdateAt,
        isFresh: isFresh(alphaLastUpdateAgoSec !== null ? nowMs - (alphaLastUpdateAgoSec * 1000) : null, nowMs),
        badMintCount: dbgBadMintCount,
        badMintSamples: dbgBadMintSamples.length > 0 ? dbgBadMintSamples : null,
      },
      lead: {
        proofs30d: leadProofs30d,
        newestProofObservedAt: dbgLeadNewestObservedAt,
        newestProofCreatedAt: dbgLeadNewestCreatedAt,
        lastUpdateSource: dbgLeadLastUpdateSource,
        lastUpdateAt: leadLastProofAt,
        isFresh: isFresh(leadLastProofAgoSec !== null ? nowMs - (leadLastProofAgoSec * 1000) : null, nowMs),
      },
      kv: {
        ok: kvAlphaOk && kvLeadOk,
        alphaError: kvAlphaError || null,
        leadError: kvLeadError || null,
      },
      computed: {
        alphaStatus,
        alphaStatusReason,
        leadStatus,
        leadStatusReason,
        overallStatus,
        overallReason,
      },
    }
  }

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  })
}
