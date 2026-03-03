import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/health/quicknode-lastrun
 * 
 * Returns the last QuickNode mint discovery execution receipt from KV.
 * This provides proof-of-execution for monitoring credit usage.
 * 
 * Protected by CRON_SECRET (same as other admin endpoints) for production.
 * In preview/dev, accessible without auth for easier debugging.
 */
export async function GET(request: Request) {
  // Auth check - cron secret or open in preview
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  const isProd = process.env.VERCEL_ENV === "production"
  
  const isCron = authHeader === `Bearer ${cronSecret}`
  
  // In production, require auth. In preview/dev, allow open access.
  if (isProd && !isCron) {
    return NextResponse.json(
      { error: "Unauthorized - Bearer token required in production" },
      { status: 401 }
    )
  }
  
  try {
    const receipt = await kv.get("solrad:quicknode:lastRun")
    
    if (!receipt) {
      return NextResponse.json({
        ok: false,
        message: "No QuickNode execution receipt found yet",
        hint: "Trigger /api/refresh or /api/cron/ingest to generate a receipt"
      })
    }
    
    return NextResponse.json({
      ok: true,
      receipt,
    })
    
  } catch (error) {
    console.error("[v0] /api/health/quicknode-lastrun: KV read error", error)
    return NextResponse.json(
      { 
        ok: false,
        error: "Failed to read receipt from KV",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
