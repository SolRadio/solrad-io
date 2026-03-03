import { NextResponse } from "next/server"
import { verifyOpsPasswordFromHeader } from "@/lib/auth-helpers"
import { getLatestIntelReport } from "@/lib/intel/storage"

/**
 * GET /api/admin/intel/latest
 * Returns latest stored intel report
 * Protected by x-ops-password header
 */
export async function GET(request: Request) {
  // Auth check
  if (!verifyOpsPasswordFromHeader(request)) {
    console.error("[v0] Intel latest: Auth failed")
    return NextResponse.json(
      { 
        ok: false, 
        error: "Unauthorized",
        details: "Invalid or missing x-ops-password header"
      }, 
      { status: 401 }
    )
  }

  try {
    console.log("[v0] Intel latest: Fetching report...")
    const report = await getLatestIntelReport()

    console.log("[v0] Intel latest: Success", { 
      hasReport: !!report,
      date: report?.date 
    })

    return NextResponse.json({
      ok: true,
      report: report || null,
    })
  } catch (error) {
    console.error("[v0] Failed to get latest intel:", error)
    return NextResponse.json(
      { 
        ok: false, 
        error: "Failed to fetch report",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

export const dynamic = "force-dynamic"
