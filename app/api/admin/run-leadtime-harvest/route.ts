import { NextResponse } from "next/server"
import { verifyOpsPasswordFromHeader } from "@/lib/auth-helpers"
import { storage } from "@/lib/storage"
import { getTrackedTokens } from "@/lib/get-tracked-tokens"
import { processLeadTimeProofs } from "@/lib/lead-time/writer"
import { getRecentLeadTimeProofs } from "@/lib/lead-time/storage"

export const dynamic = "force-dynamic"

const LOCK_KEY = "solrad:leadtime-harvest:run_lock"
const LOCK_TTL_SEC = 120

/**
 * POST /api/admin/run-leadtime-harvest
 * Admin-only (x-ops-password header).
 * Triggers the lead-time writer pipeline (same logic as ingestion).
 * Uses a KV lock to prevent concurrent runs.
 */
export async function POST(request: Request) {
  if (!verifyOpsPasswordFromHeader(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const nowISO = new Date().toISOString()

  // Lock check
  try {
    const existing = await storage.get(LOCK_KEY)
    if (existing) {
      return NextResponse.json({
        ok: true, started: false, nowISO,
        reason: "already_running",
      })
    }
  } catch { /* best-effort */ }

  // Acquire lock
  try {
    await storage.set(LOCK_KEY, `started:${nowISO}`, { ex: LOCK_TTL_SEC })
  } catch { /* best-effort */ }

  try {
    // Get recent proof count before run for delta tracking
    const beforeProofs = await getRecentLeadTimeProofs(50)
    const beforeCount = beforeProofs.length

    // Get tracked tokens (same source as ingestion pipeline)
    const tokens = await getTrackedTokens()
    if (tokens.length === 0) {
      await storage.del(LOCK_KEY).catch(() => {})
      return NextResponse.json({
        ok: true, started: true, nowISO,
        note: "No tracked tokens available",
        tokensScanned: 0, proofsCreated: 0,
      })
    }

    // Build a signal states map from token scores
    // processLeadTimeProofs expects a Map<string, { state, confidence }>
    const signalStates = new Map<string, { state: "EARLY" | "CAUTION" | "STRONG"; confidence: number }>()
    for (const t of tokens) {
      const score = (t as any).totalScore ?? (t as any).score ?? 0
      const state: "EARLY" | "CAUTION" | "STRONG" =
        score >= 80 ? "STRONG" : score >= 60 ? "CAUTION" : "EARLY"
      const confidence = Math.min(100, Math.max(0, score))
      signalStates.set(t.address, { state, confidence })
    }

    // Run the lead-time writer pipeline (returns diagnostics)
    const result = await processLeadTimeProofs(tokens as any, signalStates)

    // Get recent proof count after run
    const afterProofs = await getRecentLeadTimeProofs(50)
    const afterCount = afterProofs.length
    const proofsCreated = Math.max(0, afterCount - beforeCount)

    await storage.del(LOCK_KEY).catch(() => {})

    // Write shared telemetry (same keys as cron route)
    await Promise.allSettled([
      storage.set("solrad:proof:lastRunAt", nowISO),
      storage.set("solrad:proof:lastStatus", "OK"),
      storage.del("solrad:proof:lastError"),
    ])

    return NextResponse.json({
      ok: true,
      started: true,
      nowISO,
      proofsGenerated: result.wroteCount,
      tokensProcessed: tokens.length,
      signalStateCount: signalStates.size,
      rejections: {
        noSignalState: result.rejection.noSignalState,
        lowConfidence: result.rejection.lowConfidence,
        dedupBlocked: result.rejection.existingObservation,
        noScoreJump: result.rejection.noScoreJump,
        noReaction: result.rejection.noReaction,
        expired: result.rejection.expiredObservation,
        errors: result.rejection.errors,
      },
      // Extended diagnostics
      recentProofsCount: afterCount,
      observationsCreated: result.producedCount - result.wroteCount,
      sampleRejections: result.sampleRejections,
      mvpFallbackCount: result.mvpFallbackCount,
      mvpModeEnabled: process.env.MVP_MODE === "1",
      writeOk: result.writeOk,
      recentKey: result.recentKey,
      durationMs: result.durationMs,
    })
  } catch (e: unknown) {
    await storage.del(LOCK_KEY).catch(() => {})
    const msg = e instanceof Error ? e.message : String(e ?? "Unknown error")

    // Write shared error telemetry (same keys as cron route)
    await Promise.allSettled([
      storage.set("solrad:proof:lastRunAt", nowISO),
      storage.set("solrad:proof:lastStatus", `ERROR: ${msg.slice(0, 200)}`),
      storage.set(
        "solrad:proof:lastError",
        JSON.stringify({ time: nowISO, message: msg.slice(0, 500) }),
        { ex: 86400 * 7 }
      ),
    ])

    return NextResponse.json({
      ok: false, started: true, nowISO, note: `Failed: ${msg}`,
    }, { status: 500 })
  }
}
