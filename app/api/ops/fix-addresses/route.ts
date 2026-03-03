import { NextRequest, NextResponse } from "next/server"
import { storage } from "@/lib/storage"
import { ingestTokenData } from "@/lib/ingestion"

/**
 * POST /api/ops/fix-addresses
 * Flushes all cached token data and triggers fresh ingestion
 * This forces re-ingestion with corrected case-sensitive mint addresses
 */
export async function POST(req: NextRequest) {
  try {
    // Verify admin password
    const adminPassword = req.headers.get("x-admin-password")
    const expectedPassword = process.env.ADMIN_PASSWORD || process.env.OPS_PASSWORD

    if (!expectedPassword || adminPassword !== expectedPassword) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] /api/ops/fix-addresses: Starting cache flush...")

    // Flush all token-related caches
    const keysToDelete = [
      "solrad:latest",
      "solrad:lastUpdated",
      "solrad:sourceMeta",
      "solrad:lastIngestTime",
      "solrad:ingestionStatus",
      "solrad:source:dexscreener",
    ]

    let deletedCount = 0
    for (const key of keysToDelete) {
      try {
        await storage.del(key)
        deletedCount++
        console.log(`[v0] Deleted cache key: ${key}`)
      } catch (error) {
        console.warn(`[v0] Failed to delete ${key}:`, error)
      }
    }

    console.log(`[v0] Cache flush complete: ${deletedCount} keys deleted`)

    // Trigger fresh ingestion directly (bypass rate limits)
    console.log("[v0] Triggering fresh ingestion with bypass flag...")
    
    try {
      const ingestResult = await ingestTokenData(true) // true = bypass rate limits
      
      console.log("[v0] Fresh ingestion completed:", {
        success: ingestResult.success,
        tokensProcessed: ingestResult.tokensProcessed,
        duration: ingestResult.duration,
      })

      return NextResponse.json({
        success: true,
        message: "Cache flushed and fresh ingestion completed",
        deleted: deletedCount,
        ingestion: {
          tokensProcessed: ingestResult.tokensProcessed,
          duration: ingestResult.duration,
          sourcesUsed: ingestResult.sourcesUsed,
        },
      })
    } catch (ingestError) {
      console.error("[v0] Ingestion failed:", ingestError)
      return NextResponse.json({
        success: false,
        message: "Cache flushed but ingestion failed",
        deleted: deletedCount,
        ingestionError: ingestError instanceof Error ? ingestError.message : String(ingestError),
      }, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] /api/ops/fix-addresses error:", error)
    return NextResponse.json(
      {
        error: "Failed to flush cache",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
