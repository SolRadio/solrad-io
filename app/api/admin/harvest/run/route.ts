import { NextResponse } from "next/server"
import { verifyOpsPasswordFromHeader } from "@/lib/auth-helpers"
import { storage } from "@/lib/storage"
import { POST as harvestPOST } from "@/app/api/admin/alpha-ledger/harvest/route"

// Use the same lock key as the inner harvest route -- single-flight across
// both the wrapper and the core route.
const LOCK_KEY = "solrad:alpha:harvest:lock"
const LOCK_TTL_SEC = 120

/**
 * POST /api/admin/harvest/run
 * Admin-only (x-ops-password header).
 *
 * Triggers the same harvest routine as POST /api/admin/alpha-ledger/harvest.
 * Uses direct in-process function call (NOT HTTP fetch) to avoid Vercel
 * Deployment Protection 401 errors.
 * Uses a KV lock to prevent concurrent runs.
 *
 * Returns: { ok, started, nowISO, note?, reason? }
 */
export async function POST(request: Request) {
  if (!verifyOpsPasswordFromHeader(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const nowISO = new Date().toISOString()

  // ── Check lock ──
  try {
    const existing = await storage.get(LOCK_KEY)
    if (existing) {
      return NextResponse.json({
        ok: true,
        started: false,
        nowISO,
        reason: "already_running",
        lockValue: existing,
      })
    }
  } catch {
    // KV read failed -- proceed anyway, lock is best-effort
  }

  // ── Acquire lock ──
  try {
    await storage.set(LOCK_KEY, `started:${nowISO}`, { ex: LOCK_TTL_SEC })
  } catch {
    // If lock write fails, still proceed (best-effort)
  }

  // ── Call harvest handler directly (in-process, no HTTP) ──
  try {
    console.log("[HARVEST RUN] Calling harvestPOST directly (no fetch)")

    // Forward the original request so the harvest handler can read
    // the x-ops-password header for its own auth check
    const response = await harvestPOST(request)
    const data = await response.json().catch(() => ({}))

    // ── Release lock ──
    await storage.del(LOCK_KEY).catch(() => {})

    if (response.status >= 400) {
      return NextResponse.json({
        ok: false,
        started: true,
        nowISO,
        source: "internal",
        note: `Harvest returned HTTP ${response.status}`,
        harvestResult: data,
      }, { status: response.status })
    }

    return NextResponse.json({
      ok: true,
      started: true,
      nowISO,
      source: "internal",
      note: `Harvest completed: added=${data.added ?? 0}, skipped=${data.skipped ?? 0}, harvested=${data.harvested ?? 0}`,
      harvestResult: data,
    })
  } catch (e: unknown) {
    // ── Release lock on error ──
    await storage.del(LOCK_KEY).catch(() => {})
    const msg = e instanceof Error ? e.message : String(e ?? "Unknown error")

    return NextResponse.json({
      ok: false,
      started: true,
      nowISO,
      source: "internal",
      note: `Harvest failed: ${msg}`,
    }, { status: 500 })
  }
}
