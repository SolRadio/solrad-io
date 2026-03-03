import { NextRequest, NextResponse } from "next/server"
import { requireInternalJobOrOps } from "@/lib/internal-auth"
import { storage } from "@/lib/storage"

export async function GET(request: NextRequest) {
  const authResult = requireInternalJobOrOps(request)
  if (!authResult.ok) {
    return NextResponse.json(authResult.body, { status: authResult.status })
  }

  const hash = request.nextUrl.searchParams.get("hash")

  if (!hash) {
    return NextResponse.json(
      { error: "Missing ?hash= query param" },
      { status: 400 }
    )
  }

  try {
    const byHash = await storage.get(`solrad:proof:signal:byHash:${hash}`)
    const bySignal = await storage.get(`solrad:proof:signal:${hash}`)

    const fieldReport = (obj: unknown): string[] | null => {
      if (!obj || typeof obj !== "object") return null
      return Object.keys(obj as Record<string, unknown>)
    }

    return NextResponse.json({
      query: hash,
      byHashKey: `solrad:proof:signal:byHash:${hash}`,
      byHashExists: byHash !== null,
      byHashFields: fieldReport(byHash),
      byHashRaw: byHash,
      bySignalKey: `solrad:proof:signal:${hash}`,
      bySignalExists: bySignal !== null,
      bySignalFields: fieldReport(bySignal),
      bySignalRaw: bySignal,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
