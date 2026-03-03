import { NextResponse } from "next/server"
import { ingestTokenData } from "@/lib/ingestion"

/**
 * GET /api/bootstrap
 * 
 * Emergency bootstrap endpoint to trigger initial ingestion
 * Only works if system has 0 tokens - prevents abuse
 * No auth required for first-time setup
 */
export async function GET() {
  console.log("[v0] /api/bootstrap: Bootstrap ingestion requested")
  
  try {
    // Check if system already has tokens
    const { getTokenIndexCached } = await import("@/lib/intel/tokenIndex")
    const indexCache = await getTokenIndexCached()
    
    if (indexCache.tokens && indexCache.tokens.length > 0) {
      console.log("[v0] /api/bootstrap: System already has tokens - use /api/refresh instead")
      return NextResponse.json({
        success: false,
        error: "System already initialized. Use Force Refresh button or /api/refresh endpoint.",
        tokensInSystem: indexCache.tokens.length
      }, { status: 400 })
    }
    
    console.log("[v0] /api/bootstrap: System has 0 tokens - starting bootstrap ingestion...")
    
    // Trigger ingestion with force=true
    const result = await ingestTokenData(true)
    
    if (result.success) {
      console.log("[v0] /api/bootstrap: Success! Ingested", result.tokensProcessed, "tokens")
      return NextResponse.json({
        success: true,
        message: "Bootstrap ingestion completed successfully",
        tokensProcessed: result.tokensProcessed,
        duration: result.duration,
        nextSteps: "Refresh the page to see tokens. System will auto-refresh every 5 minutes."
      })
    } else {
      console.error("[v0] /api/bootstrap: Ingestion failed:", result.error)
      return NextResponse.json({
        success: false,
        error: result.error || "Ingestion failed",
        tokensProcessed: result.tokensProcessed,
        duration: result.duration
      }, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] /api/bootstrap: Exception:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// Also allow POST for consistency
export async function POST() {
  return GET()
}
