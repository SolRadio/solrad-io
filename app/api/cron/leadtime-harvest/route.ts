import { NextResponse } from "next/server"
import { storage } from "@/lib/storage"
import { getTrackedTokens } from "@/lib/get-tracked-tokens"
import { processLeadTimeProofs } from "@/lib/lead-time/writer"
import { getRecentLeadTimeProofs } from "@/lib/lead-time/storage"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const LOCK_KEY = "solrad:leadtime-harvest:cron_lock"
const LOCK_TTL_SEC = 120
const THROTTLE_MS = 20 * 60 * 1000 // 20 min minimum gap

// Telemetry keys (run-level)
const TEL_LAST_RUN = "solrad:proof:lastRunAt"
const TEL_LAST_ERROR = "solrad:proof:lastError"
const TEL_LAST_STATUS = "solrad:proof:lastStatus"
const TEL_LAST_RESULT = "solrad:proof:lastResult"

// Telemetry keys (hit-level -- written on EVERY request, even auth failures)
const HIT_PREFIX = "solrad:cron:leadtime"
const HIT_LAST_AT = `${HIT_PREFIX}:lastHitAt`
const HIT_LAST_STATUS = `${HIT_PREFIX}:lastHitStatus`
const HIT_LAST_ERROR = `${HIT_PREFIX}:lastHitError`

/** Best-effort write of hit telemetry. Fire-and-forget. */
async function writeHit(status: string, error?: string) {
  await Promise.allSettled([
    storage.set(HIT_LAST_AT, new Date().toISOString(), { ex: 86400 }),
    storage.set(HIT_LAST_STATUS, status, { ex: 86400 }),
    error
      ? storage.set(HIT_LAST_ERROR, error.slice(0, 300), { ex: 86400 * 7 })
      : storage.del(HIT_LAST_ERROR),
  ])
}

/**
 * GET /api/cron/leadtime-harvest
 * Vercel Cron (CRON_SECRET) protected.
 * Runs the lead-time proof writer pipeline on a schedule.
 */
export async function GET(request: Request) {
  const t0 = Date.now()
  const nowISO = new Date().toISOString()

  // ── Auth ──
  // Canonical secret: CRON_SECRET, fallback: SOLRAD_CRON_SECRET (backward compat)
  const cronSecret = process.env.CRON_SECRET ?? process.env.SOLRAD_CRON_SECRET
  const NO_STORE = { headers: { "Cache-Control": "no-store" } }

  // 1) Vercel Cron UA bypass – Vercel sends User-Agent: vercel-cron/1.0
  const ua = request.headers.get("user-agent") ?? ""
  const isVercelCron = ua.includes("vercel-cron")

  if (!isVercelCron) {
    // Manual / external request – require secret
    if (!cronSecret) {
      await writeHit("500", "CRON_SECRET missing")
      return NextResponse.json(
        { ok: false, error: "CRON_SECRET missing" },
        { status: 500, ...NO_STORE }
      )
    }

    // Accept secret from (in priority order):
    // 1) Authorization: Bearer <secret>
    // 2) x-cron-secret: <secret>
    // 3) ?secret= query param (only if ALLOW_CRON_QUERY_SECRET=1 OR not production)
    const authHeader = request.headers.get("authorization")
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
    const headerSecret = request.headers.get("x-cron-secret")

    const allowQuerySecret =
      process.env.ALLOW_CRON_QUERY_SECRET === "1" ||
      process.env.VERCEL_ENV !== "production"
    const url = new URL(request.url)
    const querySecret = allowQuerySecret ? url.searchParams.get("secret") : null

    // Determine which source provided the secret (for telemetry)
    let providedSecret: string | null = null
    let secretSource = "none"
    if (bearerToken) { providedSecret = bearerToken; secretSource = "Authorization Bearer" }
    else if (headerSecret) { providedSecret = headerSecret; secretSource = "x-cron-secret header" }
    else if (querySecret) { providedSecret = querySecret; secretSource = "?secret= query param" }

    if (!providedSecret) {
      await writeHit("401", "no secret provided (checked: Bearer, x-cron-secret, query)")
      return NextResponse.json(
        { ok: false, error: "no secret provided" },
        { status: 401, ...NO_STORE }
      )
    }

    if (providedSecret !== cronSecret) {
      await writeHit("401", `secret mismatch via ${secretSource}`)
      return NextResponse.json(
        { ok: false, error: `secret mismatch (source: ${secretSource})` },
        { status: 401, ...NO_STORE }
      )
    }
  }

  // ── Throttle guard ──
  try {
    const lastRun = await storage.get(TEL_LAST_RUN)
    if (typeof lastRun === "string") {
      const lastMs = new Date(lastRun).getTime()
      if (Number.isFinite(lastMs) && Date.now() - lastMs < THROTTLE_MS) {
        const agoMin = Math.round((Date.now() - lastMs) / 60_000)
        await writeHit("200-throttled")
        return NextResponse.json({
          ok: true,
          throttled: true,
          reason: `Last run was ${agoMin}m ago, minimum gap is ${Math.round(THROTTLE_MS / 60_000)}m`,
          lastRunAt: lastRun,
        }, NO_STORE)
      }
    }
  } catch {
    // Best-effort throttle check
  }

  // ── Lock guard ──
  try {
    const existing = await storage.get(LOCK_KEY)
    if (existing) {
      return NextResponse.json({
        ok: true,
        throttled: true,
        reason: "already_running",
      }, NO_STORE)
    }
  } catch {
    // Best-effort lock check
  }

  // ── Acquire lock ──
  try {
    await storage.set(LOCK_KEY, `started:${nowISO}`, { ex: LOCK_TTL_SEC })
  } catch {
    // Best-effort lock set
  }

  try {
    // Get proof count before run (for delta tracking)
    const beforeProofs = await getRecentLeadTimeProofs(50)
    const beforeCount = beforeProofs.length

    // Get tokens from last ingest cycle (has live score data)
    const recentTokens = await getTrackedTokens()
    const recentMints = new Set(recentTokens.map(t => (t.address ?? "").toLowerCase()))

    // Supplement with ALL tracked mints from auto-tracked pool
    let missingTokenCount = 0
    const missingTokens: typeof recentTokens = []
    try {
      const allTrackedMints = (await storage.get("solrad:auto-tracked-mints") as string[] | null) ?? []
      const missingMints = allTrackedMints.filter(m => !recentMints.has(m.toLowerCase()))

      // Fetch missing mints from per-token score cache (written by snapshot cron)
      const missingResults = await Promise.all(
        missingMints.slice(0, 150).map(async (mint) => {
          try {
            const cached = await storage.get(`solrad:token:score:${mint}`) as Record<string, unknown> | null
            if (cached && typeof cached.totalScore === "number") {
              return {
                address: mint,
                symbol: (cached.symbol as string) ?? mint.slice(0, 6),
                name: (cached.name as string) ?? "",
                totalScore: cached.totalScore as number,
                priceUsd: (cached.priceUsd as number) ?? 0,
                volume24h: (cached.volume24h as number) ?? 0,
                liquidity: (cached.liquidity as number) ?? 0,
                imageUrl: (cached.imageUrl as string) ?? "",
              }
            }
            return null
          } catch { return null }
        })
      )
      for (const t of missingResults) {
        if (t) { missingTokens.push(t as any); missingTokenCount++ }
      }
    } catch (err) {
      console.warn("[leadtime-cron] Failed to fetch supplemental tracked mints:", err)
    }

    // Combine both lists
    const tokens = [...recentTokens, ...missingTokens]

    console.log(`[leadtime-cron] Scanning ${tokens.length} tokens (${recentTokens.length} recent + ${missingTokenCount} from full pool)`)

    if (tokens.length === 0) {
      const result = {
        ok: true,
        tokensScanned: 0,
        proofsCreated: 0,
        note: "No tracked tokens available",
        durationMs: Date.now() - t0,
      }
      await Promise.allSettled([
        storage.del(LOCK_KEY),
        storage.set(TEL_LAST_RUN, nowISO),
        storage.set(TEL_LAST_STATUS, "OK (0 tokens)"),
        storage.set(TEL_LAST_RESULT, JSON.stringify(result), { ex: 86400 }),
      ])
      return NextResponse.json(result, NO_STORE)
    }

    // Build signal states map from token scores
    const signalStates = new Map<
      string,
      { state: "EARLY" | "CAUTION" | "STRONG"; confidence: number }
    >()
    for (const t of tokens) {
      const score = (t as any).totalScore ?? (t as any).score ?? 0
      const state: "EARLY" | "CAUTION" | "STRONG" =
        score >= 80 ? "STRONG" : score >= 60 ? "CAUTION" : "EARLY"
      const confidence = Math.min(100, Math.max(0, score))
      signalStates.set(t.address, { state, confidence })
    }

    // Run the lead-time writer pipeline
    const writerResult = await processLeadTimeProofs(tokens as any, signalStates)

    // Get proof count after run
    const afterProofs = await getRecentLeadTimeProofs(50)
    const afterCount = afterProofs.length
    const proofsCreated = Math.max(0, afterCount - beforeCount)

    const durationMs = Date.now() - t0
    const result = {
      ok: true,
      tokensScanned: tokens.length,
      proofsCreated,
      recentProofsCount: afterCount,
      scannedCount: writerResult.scannedCount,
      producedCount: writerResult.producedCount,
      wroteCount: writerResult.wroteCount,
      writeOk: writerResult.writeOk,
      mvpFallbackCount: writerResult.mvpFallbackCount,
      durationMs,
    }

    console.log(
      `[leadtime-cron] harvest done: ${tokens.length} scanned, ${writerResult.wroteCount} wrote, ${proofsCreated} new proofs (${durationMs}ms)`
    )

    // Write success telemetry + hit telemetry
    await Promise.allSettled([
      storage.del(LOCK_KEY),
      storage.set(TEL_LAST_RUN, nowISO),
      storage.set(TEL_LAST_STATUS, "OK"),
      storage.set(TEL_LAST_RESULT, JSON.stringify(result), { ex: 86400 }),
      storage.del(TEL_LAST_ERROR),
      writeHit("200"),
    ])

    return NextResponse.json(result, NO_STORE)
  } catch (e: unknown) {
    const durationMs = Date.now() - t0
    const msg = e instanceof Error ? e.message : String(e ?? "Unknown error")
    console.error(`[leadtime-cron] harvest error (${durationMs}ms):`, e)

    // Write failure telemetry + hit telemetry
    await Promise.allSettled([
      storage.del(LOCK_KEY),
      storage.set(TEL_LAST_RUN, nowISO),
      storage.set(TEL_LAST_STATUS, `ERROR: ${msg.slice(0, 200)}`),
      storage.set(
        TEL_LAST_ERROR,
        JSON.stringify({ time: nowISO, message: msg.slice(0, 500), durationMs }),
        { ex: 86400 * 7 }
      ),
      writeHit("500", msg.slice(0, 200)),
    ])

    return NextResponse.json(
      { ok: false, error: msg, durationMs },
      { status: 500, ...NO_STORE }
    )
  }
}
