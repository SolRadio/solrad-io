import { NextResponse } from "next/server"
import { verifyOpsPasswordFromHeader } from "@/lib/auth-helpers"
import { getPublishAuditLog, recordPublishAction } from "@/lib/intel/storage"

/**
 * GET /api/admin/intel/audit
 * Returns the publish audit log (last 50 entries).
 */
export async function GET(request: Request) {
  if (!verifyOpsPasswordFromHeader(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const log = await getPublishAuditLog()
    return NextResponse.json({ ok: true, log })
  } catch (error) {
    console.error("[v0] Failed to get audit log:", error)
    return NextResponse.json(
      { ok: false, error: "Failed to fetch audit log" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/intel/audit
 * Record a publish action.
 * Body: { channel, reportDate, content, tweetIndex? }
 */
export async function POST(request: Request) {
  if (!verifyOpsPasswordFromHeader(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { channel, reportDate, content, tweetIndex } = body

    if (!channel || !reportDate || !content) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields: channel, reportDate, content" },
        { status: 400 }
      )
    }

    const entry = await recordPublishAction(
      { channel, reportDate, tweetIndex },
      content
    )

    return NextResponse.json({ ok: true, entry })
  } catch (error) {
    console.error("[v0] Failed to record audit:", error)
    return NextResponse.json(
      { ok: false, error: "Failed to record audit entry" },
      { status: 500 }
    )
  }
}

export const dynamic = "force-dynamic"
