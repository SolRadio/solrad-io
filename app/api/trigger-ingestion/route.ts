import { type NextRequest, NextResponse } from "next/server"
import { ingestTokenData } from "@/lib/ingestion"

/**
 * Manual trigger endpoint for forcing fresh token ingestion
 * Public endpoint - no auth required for testing
 * Use: https://solrad.io/api/trigger-ingestion
 */
export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Manual Trigger: Starting FORCED ingestion with Birdeye + DexScreener")
    
    const startTime = Date.now()
    
    // Force fresh ingestion (bypasses cache)
    const result = await ingestTokenData(true)
    
    const duration = Date.now() - startTime
    
    if (result.success) {
      console.log(`[v0] Manual Trigger: SUCCESS - ${result.tokensProcessed} tokens in ${duration}ms`)
      
      return NextResponse.json({
        success: true,
        message: "Fresh ingestion completed successfully",
        tokensProcessed: result.tokensProcessed,
        duration,
        timestamp: new Date().toISOString(),
      })
    } else {
      console.error(`[v0] Manual Trigger: FAILED - ${result.error}`)
      
      return NextResponse.json({
        success: false,
        error: result.error,
        duration,
        timestamp: new Date().toISOString(),
      }, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] Manual Trigger: Error", error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
