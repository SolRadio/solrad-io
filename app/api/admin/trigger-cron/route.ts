import { NextRequest, NextResponse } from "next/server"
import { requireInternalJobOrOps } from "@/lib/internal-auth"

const ALLOWED_CRONS: Record<string, string> = {
  "publish-proof": "/api/cron/publish-proof",
  snapshot: "/api/cron/snapshot",
  ingest: "/api/cron/ingest",
  "background-alerts": "/api/cron/background-alerts",
  "alpha-ledger": "/api/cron/alpha-ledger",
  "score-velocity": "/api/cron/score-velocity",
  "leadtime-harvest": "/api/cron/leadtime-harvest",
  "daily-intel-package": "/api/cron/daily-intel-package",
  cron: "/api/cron",
  "data-audit": "/api/debug/data-audit",
  "backfill-proofs": "/api/admin/backfill-proof-lookups",
  "push-alerts": "/api/cron/push-alerts",
}

export async function POST(request: NextRequest) {
  // Auth: reuse the existing ops-password / internal-job-token check
  const authResult = requireInternalJobOrOps(request)
  if (!authResult.ok) {
    return NextResponse.json(authResult.body, { status: authResult.status })
  }

  try {
    const body = await request.json()
    const cronName = body?.name as string

    if (!cronName || !ALLOWED_CRONS[cronName]) {
      return NextResponse.json(
        { error: "Invalid cron name", allowed: Object.keys(ALLOWED_CRONS) },
        { status: 400 }
      )
    }

    const cronPath = ALLOWED_CRONS[cronName]
    const cronSecret = process.env.CRON_SECRET ?? ""

    // Build absolute URL from request origin
    const url = new URL(cronPath, request.nextUrl.origin)

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-ops-password": process.env.OPS_PASSWORD || "",
        "x-internal-token": process.env.CRON_SECRET || "",
        Authorization: "Bearer " + (process.env.CRON_SECRET || ""),
      },
    })

    const data = await res
      .json()
      .catch(() => ({ status: res.status, statusText: res.statusText }))

    return NextResponse.json({
      cron: cronName,
      status: res.status,
      ok: res.ok,
      result: data,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
