import { NextResponse } from "next/server"
import {
  appendEntries,
  readMeta,
  signalOutcomeToEntry,
  type SignalOutcomeRow,
} from "@/lib/alpha-ledger"
import { storage } from "@/lib/storage"
import { getSignalOutcomes } from "@/lib/signal-outcomes"

// ── Keys ──────────────────────────────────────────────────────────────
const META_KEY = "solrad:alpha:ledger:meta"
const STATUS_KEY = "solrad:alpha:harvest"        // structured status object
const LOCK_KEY = "solrad:alpha:harvest:lock"      // single-flight lock

// ── Tunables ──────────────────────────────────────────────────────────
const LOCK_TTL_SEC = 120          // lock auto-expires after 2 min
const DEADLINE_MS = 60_000        // hard timeout for harvest execution
const STALE_STARTED_MS = 15 * 60 * 1000 // 15 min: reap stale STARTED
const THROTTLE_MS = 60 * 60 * 1000      // 60 min minimum gap between cron runs

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
 * GET /api/cron/alpha-ledger
 * CRON_SECRET protected. Auto-harvests signal outcomes into the ledger.
 *
 * Hardening:
 *  1) Single-flight lock (KV, 120s TTL)
 *  2) Structured status lifecycle (STARTED -> OK | ERROR) with try/finally
 *  3) Stale STARTED reaper (>15 min -> rewrite to ERROR, allow new run)
 *  4) Hard 60s timeout
 *  5) Throttle: skips if last success < 60 min ago
 */
export async function GET(request: Request) {
  const t0 = Date.now()

  // ── Auth ──
  const ua = request.headers.get("user-agent") ?? ""
  const isVercelCron = ua.includes("vercel-cron")
  const cronSecret = process.env.CRON_SECRET ?? process.env.SOLRAD_CRON_SECRET

  if (!isVercelCron) {
    const authHeader = request.headers.get("authorization")
    if (!cronSecret) {
      return NextResponse.json({ ok: false, error: "CRON_SECRET not configured" }, { status: 500 })
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }
  }

  // ── Throttle guard ──
  try {
    const meta = await readMeta()
    if (meta?.lastWriteAt) {
      const lastWrite = new Date(meta.lastWriteAt).getTime()
      if (Number.isFinite(lastWrite) && Date.now() - lastWrite < THROTTLE_MS) {
        const agoMin = Math.round((Date.now() - lastWrite) / 60_000)
        return NextResponse.json({
          ok: true,
          throttled: true,
          reason: `Last harvest was ${agoMin}m ago, minimum gap is 60m`,
          lastWriteAt: meta.lastWriteAt,
        })
      }
    }
  } catch { /* best-effort */ }

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
    await storage.del(LOCK_KEY).catch(() => {})
    console.warn(`[alpha-harvest-cron] Reaped stale STARTED from runId=${prevStatus.runId}`)
  }

  // ── Task 2: Single-flight lock ───────────────────────────────────
  const lockAcquired = await acquireLock()
  if (!lockAcquired) {
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
    // ── Get signal outcomes (direct in-process call, no HTTP) ──
    console.log("[HARVEST] Calling getSignalOutcomes directly (cron, no fetch)")

    const data = await getSignalOutcomes({ limit: 100, minScore: 70 })

    if (!data.ok) {
      console.error("[HARVEST] getSignalOutcomes returned ok=false (cron)", { count: data.count })
      throw new Error(`getSignalOutcomes returned ok=false`)
    }

    const signals: SignalOutcomeRow[] = data.signals ?? []

    // ── Validate + convert ──
    let skippedInvalid = 0
    const entries = signals
      .filter((s: SignalOutcomeRow) => {
        if (typeof s.mint !== "string" || !s.mint.trim()) { skippedInvalid++; return false }
        if (!s.detectedAt || !Number.isFinite(s.detectedAt) || s.detectedAt <= 0) { skippedInvalid++; return false }
        return true
      })
      .map(signalOutcomeToEntry)

    // ── Append or refresh meta ──
    let result = { added: 0, skipped: 0 }
    if (entries.length > 0) {
      result = await appendEntries(entries)
    } else {
      // 0 valid entries: refresh meta.lastWriteAt so health sees a fresh timestamp
      const nowISO = new Date().toISOString()
      const existingMeta = await readMeta()
      const refreshedMeta = existingMeta
        ? { ...existingMeta, lastWriteAt: nowISO }
        : { trackedSince: nowISO, lastWriteAt: nowISO, totalEntries: 0, totalVoided: 0 }
      await storage.set(META_KEY, JSON.stringify(refreshedMeta))
    }

    // ── Write OK status ──
    const finishedAtISO = new Date().toISOString()
    const okStatus: HarvestStatus = {
      status: "OK",
      runId,
      startedAtISO,
      startedAtMs,
      finishedAtISO,
      lastSuccessISO: finishedAtISO,
      processedCount: result.added,
      error: null,
    }
    await writeStatus(okStatus)

    // Legacy telemetry keys for backward compat with proof-engine-health
    await Promise.allSettled([
      storage.set(`${STATUS_KEY}:last_run_at`, startedAtMs),
      storage.set(`${STATUS_KEY}:last_run_status`, "OK"),
      storage.set(`${STATUS_KEY}:last_success_at`, Date.now()),
      storage.set(`${STATUS_KEY}:last_processed_count`, result.added),
    ])

    const durationMs = Date.now() - t0
    console.log(
      `[alpha-harvest-cron] runId=${runId}: ${result.added} added, ${result.skipped} deduped, ${skippedInvalid} invalid, ${signals.length} total (${durationMs}ms)`
    )

    return NextResponse.json({
      ok: true,
      runId,
      harvested: signals.length,
      ...result,
      skippedInvalid,
      durationMs,
      source: "internal",
      })
  }

  let harvestSucceeded = false

  try {
    console.log("[HARVEST START]", { runId, startedAtISO, source: "cron" })
    const response = await Promise.race([run(), timeout])
    harvestSucceeded = true
    console.log("[HARVEST SUCCESS]", { runId, durationMs: Date.now() - t0, source: "cron" })
    return response
  } catch (error) {
    const durationMs = Date.now() - t0
    const errMsg = error instanceof Error ? error.message : "Unknown"
    const errStack = error instanceof Error ? error.stack : undefined
    const isTimeout = errMsg === "harvest_timeout"
    console.error("[HARVEST ERROR]", { runId, durationMs, source: "cron", error: errMsg })

    // Write ERROR status (preserves previousLastSuccessISO)
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
      storage.set(`${STATUS_KEY}:last_run_status`, `ERROR: ${errMsg.slice(0, 200)}`),
      storage.set(`${STATUS_KEY}:last_error_at`, Date.now()),
    ])

    return NextResponse.json(
      { ok: false, runId, error: isTimeout ? `Harvest timed out after ${DEADLINE_MS}ms` : errMsg, durationMs },
      { status: isTimeout ? 504 : 500 },
    )
  } finally {
    // ── CRITICAL: guarantee no stuck STARTED ──
    if (!harvestSucceeded) {
      try {
        const currentStatus = await readStatus()
        if (currentStatus?.status === "STARTED" && currentStatus.runId === runId) {
          console.error("[HARVEST FINALLY] Status still STARTED after exit -- forcing ERROR", { runId, source: "cron" })
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

async function acquireLock(): Promise<boolean> {
  try {
    const existing = await storage.get(LOCK_KEY)
    if (existing) {
      // Reclaim stale locks (> LOCK_TTL_SEC) in case TTL auto-expiry failed
      if (typeof existing === "string" && existing.startsWith("locked:")) {
        const lockTime = new Date(existing.replace("locked:", "")).getTime()
        if (Number.isFinite(lockTime) && Date.now() - lockTime > LOCK_TTL_SEC * 1000) {
          console.warn("[HARVEST] Reclaiming stale lock (cron)", { existing, ageMs: Date.now() - lockTime })
          await storage.del(LOCK_KEY).catch(() => {})
          // Fall through to acquire
        } else {
          return false
        }
      } else {
        return false
      }
    }
    await storage.set(LOCK_KEY, `locked:${new Date().toISOString()}`, { ex: LOCK_TTL_SEC })
    return true
  } catch {
    return true // fail-open
  }
}
