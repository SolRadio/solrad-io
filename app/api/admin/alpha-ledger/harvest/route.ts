import { NextResponse } from "next/server"
import { verifyOpsPasswordFromHeader } from "@/lib/auth-helpers"
import {
  appendEntries,
  readMeta,
  signalOutcomeToEntry,
  type SignalOutcomeRow,
} from "@/lib/alpha-ledger"
import { storage } from "@/lib/storage"
import { isInternalJob } from "@/lib/internal-auth"
import { getSignalOutcomes } from "@/lib/signal-outcomes"

// ── Keys ──────────────────────────────────────────────────────────────
const META_KEY = "solrad:alpha:ledger:meta"
const STATUS_KEY = "solrad:alpha:harvest"        // structured status object
const LOCK_KEY = "solrad:alpha:harvest:lock"      // single-flight lock
const STAGE_KEY = `${STATUS_KEY}:last_stage`

// ── Tunables ──────────────────────────────────────────────────────────
const LOCK_TTL_SEC = 120          // lock auto-expires after 2 min
const DEADLINE_MS = 60_000        // hard timeout for harvest execution
const STALE_STARTED_MS = 15 * 60 * 1000 // 15 min: reap stale STARTED

// ── Helpers ───────────────────────────────────────────────────────────
function makeRunId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

interface HarvestStatus {
  status: "STARTED" | "OK" | "ERROR"
  runId: string
  startedAtISO: string
  startedAtMs: number
  finishedAtISO?: string
  lastSuccessISO?: string | null
  processedCount?: number
  error?: { message: string; stack?: string } | null
}

async function readStatus(): Promise<HarvestStatus | null> {
  try {
    const raw = await storage.get(STATUS_KEY)
    if (raw && typeof raw === "object" && "status" in (raw as object)) {
      return raw as HarvestStatus
    }
    if (typeof raw === "string") {
      return JSON.parse(raw) as HarvestStatus
    }
  } catch { /* corrupted or missing */ }
  return null
}

async function writeStatus(s: HarvestStatus): Promise<void> {
  await storage.set(STATUS_KEY, s)
}

/**
 * POST /api/admin/alpha-ledger/harvest
 *
 * Admin-only (x-ops-password header).
 * Harvests signal outcomes into the Alpha Ledger.
 *
 * Hardening:
 *  1) Single-flight lock (KV set-if-not-exists, 120s TTL)
 *  2) Structured status lifecycle (STARTED -> OK | ERROR) with try/finally
 *  3) Stale STARTED reaper (>15 min -> rewrite to ERROR, allow new run)
 *  4) Hard 60s timeout (throws harvest_timeout)
 */
/** GET wrapper so the harvest can be triggered from a browser address bar. */
export async function GET(req: Request) {
  return POST(req)
}

export async function POST(request: Request) {
  // ── Auth: accept EITHER ops password OR internal job token ──
  const opsOk = verifyOpsPasswordFromHeader(request)
  const internalOk = isInternalJob(request)
  const whichAuthUsed: "ops" | "internal" | "none" = opsOk ? "ops" : internalOk ? "internal" : "none"

  // Debug output when ?debug=1
  const reqUrl = new URL(request.url)
  const isDebug = reqUrl.searchParams.get("debug") === "1"
  if (isDebug) {
    console.log("[HARVEST AUTH DEBUG]", {
      hasOpsHeader: !!request.headers.get("x-ops-password"),
      hasInternalHeader: !!request.headers.get("x-internal-job-token"),
      hasInternalEnv: !!process.env.INTERNAL_JOB_TOKEN,
      internalTokenLength: process.env.INTERNAL_JOB_TOKEN?.length || 0,
      whichAuthUsed,
    })
  }

  if (whichAuthUsed === "none") {
    const body: Record<string, unknown> = { ok: false, error: "Unauthorized" }
    if (isDebug) {
      body.debug = {
        hasOpsHeader: !!request.headers.get("x-ops-password"),
        hasInternalHeader: !!request.headers.get("x-internal-job-token"),
        hasInternalEnv: !!process.env.INTERNAL_JOB_TOKEN,
        internalTokenLength: process.env.INTERNAL_JOB_TOKEN?.length || 0,
        whichAuthUsed,
      }
    }
    return NextResponse.json(body, { status: 401 })
  }

  const t0 = Date.now()
  let stage = "init"

  async function setStage(s: string) {
    stage = s
    await storage.set(STAGE_KEY, `${s} @ ${new Date().toISOString()}`)
  }

  // ── Task 4: Stale STARTED reaper ─────────────────────────────────
  const prevStatus = await readStatus()
  if (
    prevStatus &&
    prevStatus.status === "STARTED" &&
    typeof prevStatus.startedAtMs === "number" &&
    Date.now() - prevStatus.startedAtMs > STALE_STARTED_MS
  ) {
    const reaped: HarvestStatus = {
      status: "ERROR",
      runId: prevStatus.runId,
      startedAtISO: prevStatus.startedAtISO,
      startedAtMs: prevStatus.startedAtMs,
      finishedAtISO: new Date().toISOString(),
      lastSuccessISO: prevStatus.lastSuccessISO ?? null,
      processedCount: 0,
      error: { message: "stale_started_reaped" },
    }
    await writeStatus(reaped)
    // Also release any stale lock so we can proceed
    await storage.del(LOCK_KEY).catch(() => {})
    console.warn(`[alpha-harvest] Reaped stale STARTED from runId=${prevStatus.runId}`)
  }

  // ── Task 2: Single-flight lock ───────────────────────────────────
  const lockAcquired = await acquireLock()
  if (!lockAcquired) {
    // Return current status so caller can see what's happening
    const currentStatus = await readStatus()
    return NextResponse.json({
      ok: true,
      locked: true,
      reason: "harvest_already_running",
      currentStatus,
    })
  }

  // ── Task 3: Structured status lifecycle ──────────────────────────
  const runId = makeRunId()
  const startedAtISO = new Date().toISOString()
  const startedAtMs = Date.now()
  const previousLastSuccessISO = prevStatus?.lastSuccessISO ?? null

  // Write STARTED immediately
  await writeStatus({
    status: "STARTED",
    runId,
    startedAtISO,
    startedAtMs,
  })

  // ── Task 5: Hard 60s timeout ─────────────────────────────────────
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("harvest_timeout")), DEADLINE_MS)
  })

  async function run(): Promise<NextResponse> {
    const origin = new URL(request.url).origin
    const ops = request.headers.get("x-ops-password") ?? ""

    // ── Step 1: Read before-state ──
    await setStage("read_before_state")
    const [metaBefore, telRunAt, telSuccessAt, telStatus] = await Promise.all([
      readMeta(),
      storage.get(`${STATUS_KEY}:last_run_at`),
      storage.get(`${STATUS_KEY}:last_success_at`),
      storage.get(`${STATUS_KEY}:last_run_status`),
    ])

    const telemetryBefore = {
      last_run_at: telRunAt ?? null,
      last_success_at: telSuccessAt ?? null,
      last_run_status: telStatus ?? null,
    }

    // ── Step 2: Get signal outcomes (direct in-process call, no HTTP) ──
    await setStage("fetch_signals")
    console.log("[HARVEST] Calling getSignalOutcomes directly (no fetch)")

    const data = await getSignalOutcomes({ limit: 100, minScore: 70 })

    await setStage("signals_fetched")

    if (!data.ok) {
      console.error("[HARVEST] getSignalOutcomes returned ok=false", { count: data.count })
      throw new Error(`getSignalOutcomes returned ok=false`)
    }

    const signals: SignalOutcomeRow[] = data.signals ?? []

    // ── Step 3: Validate and convert entries ──
    await setStage("normalize_entries")
    let skippedInvalid = 0
    const invalidReasonCounts: Record<string, number> = {}
    const invalidSamples: Array<{ tokenSymbol?: string; mint?: string; detectedAt?: unknown; reason: string }> = []
    const MAX_INVALID_SAMPLES = 5

    function trackInvalid(s: SignalOutcomeRow, reason: string) {
      skippedInvalid++
      invalidReasonCounts[reason] = (invalidReasonCounts[reason] || 0) + 1
      if (invalidSamples.length < MAX_INVALID_SAMPLES) {
        invalidSamples.push({
          tokenSymbol: (s as Record<string, unknown>).tokenSymbol as string | undefined,
          mint: s.mint,
          detectedAt: s.detectedAt,
          reason,
        })
      }
    }

    const entries = signals
      .filter((s: SignalOutcomeRow) => {
        if (s.mint == null || s.mint === undefined) { trackInvalid(s, "missing_mint"); return false }
        if (typeof s.mint !== "string" || !s.mint.trim()) { trackInvalid(s, "invalid_mint_format"); return false }
        if (s.detectedAt == null || s.detectedAt === undefined) { trackInvalid(s, "missing_detectedAt"); return false }
        if (!Number.isFinite(s.detectedAt) || s.detectedAt <= 0) { trackInvalid(s, "invalid_detectedAt"); return false }
        return true
      })
      .map(signalOutcomeToEntry)

    await setStage("entries_ready")

    // ── Step 4: Append ──
    await setStage("append_entries")
    let result = { added: 0, skipped: 0 }
    if (entries.length > 0) {
      result = await appendEntries(entries)
    } else {
      const nowISO = new Date().toISOString()
      const existingMeta = await readMeta()
      const refreshedMeta = existingMeta
        ? { ...existingMeta, lastWriteAt: nowISO }
        : {
            trackedSince: nowISO,
            lastWriteAt: nowISO,
            totalEntries: 0,
            totalVoided: 0,
          }
      await storage.set(META_KEY, JSON.stringify(refreshedMeta))
    }
    await setStage("append_done")

    // ── Step 5: Read after-state ──
    const metaAfter = await readMeta()

    // ── Step 6: Write OK status ──
    const finishedAtISO = new Date().toISOString()
    const processedCount = result.added
    const okStatus: HarvestStatus = {
      status: "OK",
      runId,
      startedAtISO,
      startedAtMs,
      finishedAtISO,
      lastSuccessISO: finishedAtISO,
      processedCount,
      error: null,
    }
    await writeStatus(okStatus)

    // Also write legacy telemetry keys for backward compat
    await Promise.allSettled([
      storage.set(`${STATUS_KEY}:last_run_at`, startedAtMs),
      storage.set(`${STATUS_KEY}:last_run_status`, `OK (added=${result.added}, deduped=${result.skipped}, invalid=${skippedInvalid})`),
      storage.set(`${STATUS_KEY}:last_success_at`, Date.now()),
      storage.set(`${STATUS_KEY}:last_processed_count`, result.added),
    ])

    const telemetryAfter = {
      last_run_at: startedAtMs,
      last_success_at: Date.now(),
      last_run_status: `OK (added=${result.added}, deduped=${result.skipped}, invalid=${skippedInvalid})`,
    }

    await setStage("done")
    const durationMs = Date.now() - t0

    return NextResponse.json({
      ok: true,
      runId,
      harvested: signals.length,
      added: result.added,
      skipped: result.skipped,
      skippedInvalid,
      invalidReasonCounts,
      invalidSamples,
      durationMs,
      stage,
      metaKeyUsed: META_KEY,
      source: "internal",
      metaBefore,
      metaAfter,
      telemetryBefore,
      telemetryAfter,
      })
  }

  // Helper: tag response with x-internal-auth when internal token was used
  function tagResponse(res: NextResponse): NextResponse {
    if (whichAuthUsed === "internal") {
      res.headers.set("x-internal-auth", "1")
    }
    return res
  }

  let harvestSucceeded = false

  try {
    console.log("[HARVEST START]", { runId, startedAtISO })
    const response = await Promise.race([run(), timeout])
    harvestSucceeded = true
    console.log("[HARVEST SUCCESS]", { runId, durationMs: Date.now() - t0 })
    return tagResponse(response as NextResponse)
  } catch (error) {
    const durationMs = Date.now() - t0
    const errMsg = error instanceof Error ? error.message : "Unknown"
    const errStack = error instanceof Error ? error.stack : undefined
    const isTimeout = errMsg === "harvest_timeout"
    console.error("[HARVEST ERROR]", { runId, stage, durationMs, error: errMsg })

    // ── Write ERROR status ──
    try {
      const finishedAtISO = new Date().toISOString()
      const errorStatus: HarvestStatus = {
        status: "ERROR",
        runId,
        startedAtISO,
        startedAtMs,
        finishedAtISO,
        lastSuccessISO: previousLastSuccessISO,
        processedCount: 0,
        error: { message: errMsg.slice(0, 500), stack: errStack?.slice(0, 1000) },
      }
      await writeStatus(errorStatus)
    } catch (statusErr) {
      console.error("[HARVEST ERROR] Failed to write ERROR status to KV:", statusErr)
    }

    // Legacy telemetry (best-effort)
    await Promise.allSettled([
      storage.set(`${STATUS_KEY}:last_run_status`, `ERROR (${stage}): ${errMsg.slice(0, 200)}`),
      storage.set(`${STATUS_KEY}:last_error_at`, Date.now()),
      setStage(`error_${stage}`),
    ])

    return tagResponse(NextResponse.json(
      {
        ok: false,
        runId,
        error: isTimeout ? `Harvest timed out after ${DEADLINE_MS}ms at stage "${stage}"` : errMsg,
        stage,
        durationMs,
        metaKeyUsed: META_KEY,
      },
      { status: isTimeout ? 504 : 500 },
    ))
  } finally {
    // ── CRITICAL: guarantee no stuck STARTED ──
    // If neither try (success) nor catch (error) wrote a terminal status,
    // force ERROR now before releasing the lock.
    if (!harvestSucceeded) {
      try {
        const currentStatus = await readStatus()
        if (currentStatus?.status === "STARTED" && currentStatus.runId === runId) {
          console.error("[HARVEST FINALLY] Status still STARTED after exit -- forcing ERROR", { runId })
          await writeStatus({
            status: "ERROR",
            runId,
            startedAtISO,
            startedAtMs,
            finishedAtISO: new Date().toISOString(),
            lastSuccessISO: previousLastSuccessISO,
            processedCount: 0,
            error: { message: "unexpected_exit: finally block forced ERROR" },
          })
        }
      } catch (finallyErr) {
        console.error("[HARVEST FINALLY] Failed to force ERROR status:", finallyErr)
      }
    }

    // ALWAYS release the lock
    await storage.del(LOCK_KEY).catch(() => {})
  }
}

// ── Lock helpers ──────────────────────────────────────────────────────

/**
 * Attempt to acquire the single-flight lock.
 * Uses KV get-then-set (best-effort CAS). Returns true if acquired.
 * If an existing lock is older than LOCK_TTL_SEC, it is considered stale
 * and forcefully reclaimed (guards against TTL auto-expiry failure).
 */
async function acquireLock(): Promise<boolean> {
  try {
    const existing = await storage.get(LOCK_KEY)
    if (existing) {
      // Check lock age -- reclaim if stale (> LOCK_TTL_SEC)
      if (typeof existing === "string" && existing.startsWith("locked:")) {
        const lockTime = new Date(existing.replace("locked:", "")).getTime()
        if (Number.isFinite(lockTime) && Date.now() - lockTime > LOCK_TTL_SEC * 1000) {
          console.warn("[HARVEST] Reclaiming stale lock", { existing, ageMs: Date.now() - lockTime })
          await storage.del(LOCK_KEY).catch(() => {})
          // Fall through to acquire
        } else {
          return false // lock is valid and fresh
        }
      } else {
        return false // unrecognized lock format, respect it
      }
    }
    await storage.set(LOCK_KEY, `locked:${new Date().toISOString()}`, { ex: LOCK_TTL_SEC })
    return true
  } catch {
    // If KV is unreachable, proceed (fail-open)
    return true
  }
}
