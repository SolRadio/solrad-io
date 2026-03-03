import { NextResponse } from "next/server"
import { verifyOpsPasswordFromHeader } from "@/lib/auth-helpers"
import { storage } from "@/lib/storage"

export const dynamic = "force-dynamic"

const LOCK_KEY = "solrad:snapshot-ingest:run_lock"
const LOCK_TTL_SEC = 180

/**
 * POST /api/admin/run-snapshot-ingest
 * Admin-only (x-ops-password header).
 * Delegates to POST /api/admin/snapshot/run (same logic as cron/snapshot).
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
        ok: true,
        started: false,
        nowISO,
        reason: "already_running",
      })
    }
  } catch { /* best-effort */ }

  // Acquire lock
  try {
    await storage.set(LOCK_KEY, `started:${nowISO}`, { ex: LOCK_TTL_SEC })
  } catch { /* best-effort */ }

  try {
    const origin = new URL(request.url).origin
    const ops = request.headers.get("x-ops-password") ?? ""

    const res = await fetch(`${origin}/api/admin/snapshot/run`, {
      method: "POST",
      headers: { "x-ops-password": ops, accept: "application/json" },
      cache: "no-store",
    })

    const data = await res.json().catch(() => ({}))
    await storage.del(LOCK_KEY).catch(() => {})

    if (!res.ok) {
      return NextResponse.json({
        ok: false, started: true, nowISO,
        note: `Snapshot ingest returned HTTP ${res.status}`,
        result: data,
      }, { status: res.status })
    }

    return NextResponse.json({
      ok: true, started: true, nowISO,
      note: `Ingest done: ${data.attempted ?? 0} attempted, ${data.written ?? 0} written, ${data.skipped ?? 0} skipped`,
      result: data,
    })
  } catch (e: unknown) {
    await storage.del(LOCK_KEY).catch(() => {})
    const msg = e instanceof Error ? e.message : String(e ?? "Unknown error")
    return NextResponse.json({
      ok: false, started: true, nowISO, note: `Failed: ${msg}`,
    }, { status: 500 })
  }
}
