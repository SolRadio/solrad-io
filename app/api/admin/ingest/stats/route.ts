import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { verifyOpsPasswordFromHeader } from "@/lib/auth-helpers"

/**
 * GET /api/admin/ingest/stats
 * PART A: Returns ingestion statistics for admin dashboard
 * Protected with OPS_PASSWORD - same auth as /admin pages
 */
export async function GET(request: NextRequest) {
  // Auth check using helper
  if (!verifyOpsPasswordFromHeader(request)) {
    console.warn("[v0] /api/admin/ingest/stats: Unauthorized attempt")
    return NextResponse.json(
      { error: "Access denied" },
      { status: 401 }
    )
  }
  
  try {
    
    // Scan all mint: keys
    const allMints: any[] = []
    let cursor = "0"
    
    do {
      const [nextCursor, keys] = await kv.scan(cursor, {
        match: "mint:*",
        count: 100,
      })
      
      cursor = nextCursor
      
      // Get values for these keys
      if (keys.length > 0) {
        const values = await Promise.all(
          keys.map(key => kv.get(key))
        )
        
        allMints.push(...values.filter(Boolean))
      }
    } while (cursor !== "0")
    
    // Calculate stats
    const totalMints = allMints.length
    const resolved = allMints.filter((m: any) => m.resolved).length
    const unresolved = totalMints - resolved
    
    // Get last run time from KV
    const lastRunTime = await kv.get<number>("ingest:lastRunTime")
    const lastError = await kv.get<string>("ingest:lastError")
    
    return NextResponse.json({
      totalMints,
      resolved,
      unresolved,
      lastRunTime: lastRunTime || undefined,
      lastError: lastError || undefined,
    })
  } catch (error) {
    console.error("[v0] Error getting ingest stats:", error)
    // Safe error response - no stack traces
    return NextResponse.json(
      { error: "Failed to retrieve statistics. Please try again." },
      { status: 500 }
    )
  }
}

export const dynamic = "force-dynamic"
