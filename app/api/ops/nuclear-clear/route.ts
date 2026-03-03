import { NextRequest, NextResponse } from "next/server"
import { storage } from "@/lib/storage"
import { del, list } from "@vercel/blob"
import { ingestTokenData } from "@/lib/ingestion"

/**
 * POST /api/ops/nuclear-clear
 * NUCLEAR OPTION: Completely destroys all cached data including blob storage
 * Forces 100% fresh ingestion with no cached data
 */
export async function POST(req: NextRequest) {
  try {
    // Verify admin password
    const adminPassword = req.headers.get("x-admin-password")
    const expectedPassword = process.env.ADMIN_PASSWORD || process.env.OPS_PASSWORD

    if (!expectedPassword || adminPassword !== expectedPassword) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] NUCLEAR CLEAR: Starting complete cache destruction...")

    // Step 1: Delete ALL KV cache keys
    const kvKeys = [
      "solrad:latest",
      "solrad:lastUpdated",
      "solrad:sourceMeta",
      "solrad:lastIngestTime",
      "solrad:ingestionStatus",
      "solrad:source:dexscreener",
      "solrad:tokenIndex",
      "solrad:firstSeenAt",
    ]

    let kvDeleted = 0
    for (const key of kvKeys) {
      try {
        await storage.del(key)
        kvDeleted++
        console.log(`[v0] NUCLEAR: Deleted KV key: ${key}`)
      } catch (error) {
        console.warn(`[v0] NUCLEAR: Failed to delete KV ${key}:`, error)
      }
    }

    // Step 2: Delete ALL blob storage files (this is the nuclear part)
    console.log("[v0] NUCLEAR: Listing and deleting ALL blobs with corrupted lowercase addresses...")
    
    let blobsDeleted = 0
    try {
      // List ALL blobs and delete them one by one
      const { blobs } = await list()
      console.log(`[v0] NUCLEAR: Found ${blobs.length} blobs to delete`)
      
      for (const blob of blobs) {
        try {
          await del(blob.url)
          blobsDeleted++
          console.log(`[v0] NUCLEAR: Deleted blob: ${blob.pathname}`)
        } catch (deleteError) {
          console.warn(`[v0] NUCLEAR: Failed to delete blob ${blob.pathname}:`, deleteError)
        }
      }
      
      console.log(`[v0] NUCLEAR: ${blobsDeleted} blobs deleted successfully`)
    } catch (error) {
      console.log("[v0] NUCLEAR: No blobs to delete or listing failed (OK):", error)
    }

    // CRITICAL: Clear in-memory blob cache so old data isn't served
    const { clearBlobMemoryCache } = await import("@/lib/blob-storage")
    clearBlobMemoryCache()

    console.log(`[v0] NUCLEAR CLEAR complete: ${kvDeleted} KV keys deleted, blob storage cleared, memory cache flushed`)

    // Step 3: Trigger FRESH ingestion with bypass flag
    console.log("[v0] NUCLEAR: Starting 100% fresh ingestion...")
    
    try {
      const ingestResult = await ingestTokenData(true) // bypass rate limits
      
      console.log("[v0] NUCLEAR: Fresh ingestion completed:", {
        success: ingestResult.success,
        tokensProcessed: ingestResult.tokensProcessed,
        duration: ingestResult.duration,
      })

      // Step 4: CRITICAL - Rebuild TokenIndex IMMEDIATELY with fresh data
      // This ensures the page reload hits fresh cached data, not old blob fallback
      console.log("[v0] NUCLEAR: Rebuilding TokenIndex with fresh data...")
      const { getTokenIndexCached } = await import("@/lib/intel/tokenIndex")
      await getTokenIndexCached()
      console.log("[v0] NUCLEAR: TokenIndex rebuilt and cached with fresh data")

      return NextResponse.json({
        success: true,
        message: "NUCLEAR CLEAR complete - all cache destroyed, fresh data ingested and cached",
        deleted: {
          kvKeys: kvDeleted,
          blobs: blobsDeleted,
        },
        ingestion: {
          tokensProcessed: ingestResult.tokensProcessed,
          duration: ingestResult.duration,
          sourcesUsed: ingestResult.sourcesUsed,
        },
      })
    } catch (ingestError) {
      console.error("[v0] NUCLEAR: Fresh ingestion failed:", ingestError)
      return NextResponse.json({
        success: false,
        message: "Cache destroyed but fresh ingestion failed",
        deleted: {
          kvKeys: kvDeleted,
          blobs: blobsDeleted,
        },
        ingestionError: ingestError instanceof Error ? ingestError.message : String(ingestError),
      }, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] NUCLEAR CLEAR error:", error)
    return NextResponse.json(
      {
        error: "Nuclear clear failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
