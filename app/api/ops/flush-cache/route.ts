import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

/**
 * POST /api/ops/flush-cache
 * Flushes all SOLRAD token caches to force fresh ingestion
 * Requires ADMIN_PASSWORD or OPS_PASSWORD
 */
export async function POST(request: Request) {
  try {
    // Auth check
    const adminPassword = process.env.ADMIN_PASSWORD || process.env.OPS_PASSWORD
    const authHeader = request.headers.get("x-admin-password")

    if (!adminPassword || authHeader !== adminPassword) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    console.log("[v0] Cache flush requested - clearing all SOLRAD keys...")

    // Get all SOLRAD keys
    const keys = await kv.keys("solrad:*")
    console.log(`[v0] Found ${keys.length} SOLRAD keys to delete`)

    // Delete all keys
    let deletedCount = 0
    for (const key of keys) {
      await kv.del(key)
      deletedCount++
    }

    console.log(`[v0] Cache flush complete - deleted ${deletedCount} keys`)

    return NextResponse.json({
      success: true,
      deletedKeys: deletedCount,
      message: "All SOLRAD caches flushed. Next ingestion will rebuild from scratch.",
    })
  } catch (error) {
    console.error("[v0] Cache flush error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/ops/flush-cache
 * Shows cache status
 */
export async function GET() {
  try {
    const keys = await kv.keys("solrad:*")
    return NextResponse.json({
      totalKeys: keys.length,
      keys: keys.slice(0, 20), // Show first 20
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
