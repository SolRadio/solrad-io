import { NextResponse } from "next/server"
import { verifyOpsPasswordFromHeader } from "@/lib/auth-helpers"
import { storage } from "@/lib/storage"

/**
 * GET /api/admin/intel/package?date=YYYY-MM-DD
 * Returns the daily intel package for the given date (or today).
 */
export async function GET(request: Request) {
  if (!verifyOpsPasswordFromHeader(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0]
  const key = `solrad:daily-package:${date}`

  try {
    const pkg = await storage.get(key)
    return NextResponse.json({ ok: true, package: pkg || null, date })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
