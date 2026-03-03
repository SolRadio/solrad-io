import { NextResponse } from "next/server"
import { getBlobState } from "@/lib/blob-storage"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/tokens/archive/health
 * Health check for token archive system
 */
export async function GET() {
  try {
    const state = await getBlobState()
    const archiveCount = Object.keys(state.archiveByMint || {}).length
    const hasBlob = !!state.meta
    const updatedAt = state.meta?.updatedAt || null

    return NextResponse.json({
      status: "ok",
      archiveCount,
      hasBlob,
      runtime: "nodejs",
      updatedAt,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Archive health check failed:", error)
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        archiveCount: 0,
        hasBlob: false,
        runtime: "nodejs",
        updatedAt: null,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
