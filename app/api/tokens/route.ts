import { NextRequest, NextResponse } from "next/server"
import { getCachedTokens } from "@/lib/ingestion"
import { storage, CACHE_KEYS } from "@/lib/storage"
import { getBlobState } from "@/lib/blob-storage"
import { getTrackedTokens } from "@/lib/get-tracked-tokens"
import { recordSnapshotIfNeeded } from "@/lib/tracker"
import { filterSuppressed } from "@/lib/suppress"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"

// PART B: Stale threshold constants
const STALE_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes
const HIGH_STALE_THRESHOLD_MS = 30 * 60 * 1000 // 30 minutes

export async function GET(request: NextRequest) {
  // Rate limit: 20 requests per minute per IP
  const ip = getClientIdentifier(request)
  const { allowed } = await rateLimit(`tokens:${ip}`, 20, 60)
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "60", "X-RateLimit-Remaining": "0" } }
    )
  }

  try {
    // Use shared function to get all tracked tokens
    let mergedTokens: any[] = []
    let cachedData = null
    let blobState = null
    let stale = false
    let staleSeverity: "low" | "high" | null = null
    let cacheAgeMs = 0
    let fetchFailed = false
    
    try {
      mergedTokens = await getTrackedTokens()
    } catch (err) {
      console.error("[v0] getTrackedTokens failed:", err)
      fetchFailed = true
      // Continue - will try other sources
    }
    
    // If no tokens, try cached data as fallback
    if (mergedTokens.length === 0) {
      try {
        cachedData = await getCachedTokens()
        if (cachedData?.tokens?.length > 0) {
          console.log("[v0] Blob unavailable, serving cached tokens")
          mergedTokens = cachedData.tokens
          fetchFailed = true // Mark as stale since we're using fallback
        }
      } catch (err) {
        console.error("[v0] getCachedTokens failed:", err)
      }
    }

    // Record snapshot (throttled, best effort) - never throw
    recordSnapshotIfNeeded(mergedTokens, "fresh").catch((err) => {
      console.error("[v0] Snapshot recording failed:", err)
    })

    // Get metadata for response - wrapped in try-catch
    try {
      if (!cachedData) {
        cachedData = await getCachedTokens()
      }
    } catch (err) {
      console.warn("[v0] Failed to get cached data for metadata:", err)
    }
    
    try {
      blobState = await getBlobState()
    } catch (err) {
      console.warn("[v0] Failed to get blob state for metadata:", err)
    }
    
    let sourceMeta
    try {
      sourceMeta = await storage.get(CACHE_KEYS.SOURCE_META)
    } catch (err) {
      console.warn("[v0] Failed to get source meta:", err)
    }

    const lastUpdated = blobState?.meta?.updatedAt 
      ? Date.parse(blobState.meta.updatedAt)
      : Date.now()
    
    const effectiveUpdatedAt = Math.max(cachedData?.updatedAt || 0, lastUpdated)
    
    // PART B: Calculate staleness
    cacheAgeMs = Date.now() - effectiveUpdatedAt
    
    if (fetchFailed || cacheAgeMs > STALE_THRESHOLD_MS) {
      stale = true
      staleSeverity = cacheAgeMs > HIGH_STALE_THRESHOLD_MS ? "high" : "low"
      
      if (staleSeverity === "high") {
        console.warn(`[v0] /api/tokens: HIGH STALE - cache age ${Math.round(cacheAgeMs / 60000)}m`)
      }
    }

    // Suppress rugged/unsafe tokens (view-layer filter only)
    const publicTokens = await filterSuppressed(mergedTokens)

    const response = NextResponse.json({
      tokens: publicTokens,
      updatedAt: effectiveUpdatedAt,
      sourceMeta: cachedData?.sourceMeta || sourceMeta || undefined,
      source: mergedTokens.length > 0 ? (stale ? "stale" : "live") : "fallback",
      // PART B: Stale indicators
      stale,
      staleSeverity,
      cacheAgeMs,
    })
    
    // SEO: Add Cache-Control headers for crawl acceleration
    response.headers.set(
      "Cache-Control",
      "public, max-age=3600, stale-while-revalidate=86400"
    )
    
    return response
  } catch (error) {
    console.error("[v0] Error in /api/tokens:", error)

    // Final fallback - return empty but valid response
    const errorResponse = NextResponse.json({
      tokens: [],
      updatedAt: Date.now(),
      source: "error",
      stale: true,
      staleSeverity: "high",
      cacheAgeMs: 0,
    })
    
    // SEO: Add Cache-Control even for error responses
    errorResponse.headers.set(
      "Cache-Control",
      "public, max-age=60, stale-while-revalidate=300"
    )
    
    return errorResponse
  }
}
