import { NextResponse } from "next/server"
import { storage } from "@/lib/storage"
import type { IngestionHealth } from "../cycle/route"

/**
 * GET /api/ingest/health
 * 
 * Returns current ingestion health metrics
 * Shows live feed status, latest mints, source counts, and errors
 */
export async function GET() {
  try {
    const health = await storage.get<IngestionHealth>("ingest:health")
    
    if (!health) {
      return NextResponse.json({
        status: "UNKNOWN",
        message: "No ingestion data available yet",
      })
    }
    
    const now = Date.now()
    const lastRunAge = health.lastRunAt ? now - health.lastRunAt : Infinity
    const isStale = lastRunAge > 60000 // > 60 seconds
    
    return NextResponse.json({
      status: isStale ? "STALE" : "ACTIVE",
      lastRunAgo: lastRunAge,
      ...health,
    })
    
  } catch (error) {
    console.error("[v0] Health check error:", error)
    return NextResponse.json({
      status: "ERROR",
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
