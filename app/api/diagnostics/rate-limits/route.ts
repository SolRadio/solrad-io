import { NextResponse } from "next/server"
import { storage, CACHE_KEYS } from "@/lib/storage"

/**
 * GET /api/diagnostics/rate-limits
 * Read-only diagnostics for rate limit status and cache health
 * No authentication required (read-only data)
 * 
 * Returns snapshot of:
 * - DexScreener status
 * - TokenIndex cache metadata
 */
export async function GET() {
  try {
    const now = new Date().toISOString()
    
    // Read ingestion status for rate limit info
    let ingestionStatus: any = null
    try {
      ingestionStatus = await storage.get(CACHE_KEYS.INGESTION_STATUS)
    } catch {
      // Ignore errors
    }

    // Extract rate limit flags from ingestion status
    let dexscreenerStatus = { ok: true, lastError: null, last429At: null }
    
    if (ingestionStatus?.errors && Array.isArray(ingestionStatus.errors)) {
      const errors = ingestionStatus.errors as string[]
      
      // Check for DexScreener 429 errors
      const dex429Error = errors.find((e: string) => e.includes("429") || e.includes("rate limit"))
      if (dex429Error) {
        dexscreenerStatus = {
          ok: false,
          lastError: dex429Error,
          last429At: ingestionStatus.timestamp || now,
        }
      }
    }

    // Read TokenIndex cache metadata
    let indexMeta = {
      servedFrom: "unknown" as const,
      cacheAgeSeconds: 0,
      tokenCount: 0,
    }
    
    try {
      const TOKEN_INDEX_KEY = "solrad:tokenIndex:v1"
      const cached = await storage.get(TOKEN_INDEX_KEY)
      
      if (cached) {
        let parsedCache: any
        
        if (typeof cached === "string") {
          try {
            parsedCache = JSON.parse(cached)
          } catch {
            // Ignore parse errors
          }
        } else {
          parsedCache = cached
        }
        
        if (parsedCache?.generatedAt && parsedCache?.tokens) {
          const ageMs = Date.now() - parsedCache.generatedAt
          const ageSeconds = Math.round(ageMs / 1000)
          
          // Determine served from based on age
          let servedFrom: "cache" | "fallback_1h" | "fallback_blob" = "cache"
          if (ageSeconds > 3600) {
            servedFrom = "fallback_blob"
          } else if (ageSeconds > 300) {
            servedFrom = "fallback_1h"
          }
          
          indexMeta = {
            servedFrom,
            cacheAgeSeconds: ageSeconds,
            tokenCount: Array.isArray(parsedCache.tokens) ? parsedCache.tokens.length : 0,
          }
        }
      }
    } catch {
      // Ignore errors reading cache
    }

    // Declare birdeyeStatus variable
    let birdeyeStatus = { ok: true, lastError: null, last429At: null }

    return NextResponse.json({
      now,
      dexscreener: dexscreenerStatus,
      index: indexMeta,
      ingestionStatus: ingestionStatus?.status || "unknown",
    })
  } catch (error) {
    console.error("[v0] Diagnostics error:", error)
    return NextResponse.json(
      {
        now: new Date().toISOString(),
        error: "Failed to fetch diagnostics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export const runtime = "edge"
export const dynamic = "force-dynamic"
