import { NextResponse } from "next/server"
import { buildTokenIndex } from "@/lib/intel/tokenIndex"
import { storage } from "@/lib/storage"

const TOKEN_INDEX_KEY = "solrad:tokenIndex:v1"
const CACHE_TTL_SECONDS = 300 // 5 minutes

/**
 * POST /api/intel/rebuild
 * Force rebuild TokenIndex cache (admin use)
 * Protected by simple password mechanism
 */
export async function POST(request: Request) {
  try {
    // Password protection -- env-only, no fallback
    const adminPassword = process.env.ADMIN_PASSWORD
    if (!adminPassword) {
      return NextResponse.json(
        { error: "ADMIN_PASSWORD not configured" },
        { status: 401 }
      )
    }
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.includes(adminPassword)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    console.log("[v0] Admin rebuild triggered")
    
    const startTime = Date.now()
    const tokens = await buildTokenIndex()
    
    const cache = {
      tokens,
      generatedAt: Date.now(),
      version: "v1" as const,
    }
    
    // Force cache update
    await storage.set(TOKEN_INDEX_KEY, cache, { ex: CACHE_TTL_SECONDS })
    
    const duration = Date.now() - startTime
    
    console.log("[v0] Admin rebuild complete:", tokens.length, "tokens,", duration, "ms")
    
    return NextResponse.json({
      success: true,
      tokensProcessed: tokens.length,
      duration,
      generatedAt: cache.generatedAt,
    })
  } catch (error) {
    console.error("[v0] Error in /api/intel/rebuild:", error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 })
  }
}
