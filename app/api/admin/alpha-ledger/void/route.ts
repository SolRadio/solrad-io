import { NextResponse } from "next/server"
import { verifyOpsPasswordFromHeader } from "@/lib/auth-helpers"
import { voidEntry } from "@/lib/alpha-ledger"

/**
 * POST /api/admin/alpha-ledger/void
 * Admin-only (x-ops-password header).
 * Body: { entryId: string, reason: string }
 */
export async function POST(request: Request) {
  if (!verifyOpsPasswordFromHeader(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { entryId: eid, reason } = await request.json()

    if (!eid || typeof eid !== "string") {
      return NextResponse.json({ ok: false, error: "entryId required" }, { status: 400 })
    }
    if (!reason || typeof reason !== "string") {
      return NextResponse.json({ ok: false, error: "reason required" }, { status: 400 })
    }

    const result = await voidEntry(eid, reason)

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[alpha-ledger] void error:", error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    )
  }
}
