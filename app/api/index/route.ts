import { NextResponse } from "next/server"
import { getTokenIndexCached } from "@/lib/intel/tokenIndex"
import { getTrending, getActiveTrading, getNewEarly, getFreshSignals } from "@/lib/intel/queries"
import { storage, CACHE_KEYS } from "@/lib/storage"
import { toCanonicalToken, joinCanonicalFlags } from "@/lib/canonical/canonicalToken"
import { getBlobState } from "@/lib/blob-storage"
import { getTrackedMints } from "@/lib/snapshotLogger"
import { filterSuppressed } from "@/lib/suppress"

// PART B: Stale threshold constants
const STALE_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes
const HIGH_STALE_THRESHOLD_MS = 30 * 60 * 1000 // 30 minutes

/**
 * GET /api/index
 * Returns the canonical TokenIndex with pre-computed column queries
 * Server is source of truth for filtering/sorting
 * Returns status "warming" if 0 tokens or error occurs
 * Returns status "degraded" if ingestion detected source issues but kept last-good cache
 * 
 * TASK D: Supports ?debug=1 for smaller response preview in browser
 * CACHE CONTROL: Supports ?bypassCache=1 to skip cache and serve fresh build
 */
export async function GET(request: Request) {
  // Parse URL to check for debug mode and cache bypass
  const url = new URL(request.url)
  const debugMode = url.searchParams.get("debug") === "1"
  const bypassCache = url.searchParams.get("bypassCache") === "1"
  // Read lastIngestAt and ingestion status from storage
  let lastIngestAt: string | null = null
  let ingestionStatus: any = null
  
  try {
    const lastIngest = await storage.get(CACHE_KEYS.LAST_INGEST_TIME)
    if (typeof lastIngest === "number") {
      lastIngestAt = new Date(lastIngest).toISOString()
    }
  } catch {
    // Ignore errors reading lastIngestAt
  }

  try {
    ingestionStatus = await storage.get(CACHE_KEYS.INGESTION_STATUS)
  } catch {
    // Ignore errors reading ingestion status
  }

  try {
    // CACHE DIAGNOSTICS: Track where data is served from
    let servedFrom: "cache" | "fresh" | "fallback_1h" | "fallback_blob" = "cache"
    let cacheAgeSeconds = 0
    let tokenCountBeforePostProcessing = 0
    
    // If bypassCache=1, build fresh and skip cache read/write
    let indexCache
    if (bypassCache) {
      console.log("[v0] /api/index: bypassCache=1, building fresh index...")
      const { buildTokenIndex } = await import("@/lib/intel/tokenIndex")
      const tokens = await buildTokenIndex()
      indexCache = {
        tokens,
        generatedAt: Date.now(),
        version: "v1",
      }
      servedFrom = "fresh"
      tokenCountBeforePostProcessing = tokens.length
    } else {
      indexCache = await getTokenIndexCached()
      cacheAgeSeconds = Math.round((Date.now() - indexCache.generatedAt) / 1000)
      tokenCountBeforePostProcessing = indexCache.tokens.length
      
      // Determine where data was served from based on cache age
      if (cacheAgeSeconds < 300) { // < 5 minutes
        servedFrom = "cache"
      } else if (cacheAgeSeconds < 3600) { // < 1 hour
        servedFrom = "fallback_1h"
      } else {
        servedFrom = "fallback_blob"
      }
    }
    
    // If 0 tokens, return warming status
    if (!indexCache.tokens || indexCache.tokens.length === 0) {
      console.log("[v0] /api/index: 0 tokens - returning warming status")
      const warmingResponse = NextResponse.json({
        status: "warming",
        updatedAt: new Date().toISOString(),
        refreshMs: 300000,
        lastIngestAt,
        all: [],
        trending: [],
        active: [],
        newEarly: [],
        freshSignals: [],
        stale: false,
        staleSeverity: null,
        cacheAgeMs: 0,
        meta: {
          counts: { total: 0, trending: 0, active: 0, newEarly: 0, freshSignals: 0 },
          filters: {},
        },
      })
      
      // Sprint 3: Don't cache warming state - retry quickly
      warmingResponse.headers.set(
        "Cache-Control",
        "public, s-maxage=10, stale-while-revalidate=30"
      )
      
      return warmingResponse
    }
    
    // Suppress rugged/unsafe tokens (view-layer filter only)
    const unsuppressedTokens = await filterSuppressed(indexCache.tokens)

    // Compute column queries server-side (uses filtered list)
    const trending = getTrending(unsuppressedTokens)
    const active = getActiveTrading(unsuppressedTokens)
    const newEarly = getNewEarly(unsuppressedTokens)
    const freshSignals = getFreshSignals(unsuppressedTokens)
    
    // Normalize tokens to canonical format and add flags
    const canonicalTokens = unsuppressedTokens.map(toCanonicalToken)
    
    // Fetch lightweight mint sets for flag joins.
    // snapshotMints: prefer KV snap:index (source of truth), fall back to Blob.
    let poolMints: string[] = []
    let signalMints: string[] = []
    let snapshotMints: string[] = []
    
    try {
      const [blobState, kvTrackedMints] = await Promise.all([
        getBlobState().catch(() => ({ archiveByMint: {}, history: {} } as any)),
        getTrackedMints().catch(() => [] as string[]),
      ])
      poolMints = Object.keys(blobState.archiveByMint || {})
      
      // Use KV snap:index as primary source for snapshot mints.
      // Fall back to Blob history only if KV returns empty.
      // Sanitize: KV smembers can return non-string values (null, objects).
      const safeKvMints = kvTrackedMints.filter(
        (m): m is string => typeof m === "string" && m.length > 0
      )
      if (safeKvMints.length > 0) {
        snapshotMints = safeKvMints
      } else {
        snapshotMints = Object.keys(blobState.history || {}).filter(
          mint => blobState.history[mint] && blobState.history[mint].length > 0
        )
      }
    } catch (error) {
      console.warn("[v0] Failed to fetch canonical flags:", error)
    }
    
    // Apply flags to all tokens
    const tokensWithFlags = joinCanonicalFlags(canonicalTokens, {
      poolMints,
      signalMints,
      snapshotMints,
    })
    
    // PART G: Debug logs for column counts
    console.log("[v0] /api/index counts:", {
      all: indexCache.tokens.length,
      trending: trending.length,
      active: active.length,
      newEarly: newEarly.length,
      freshSignals: freshSignals.length,
      poolMints: poolMints.length,
      snapshotMints: snapshotMints.length,
    })
    
    // PART 7: Debug - log 3 sample New/Early tokens to verify age gating
    if (newEarly.length > 0) {
      console.log("[v0] New/Early samples (first 3):")
      newEarly.slice(0, 3).forEach((sample, i) => {
        const ageDays = sample.pairCreatedAt 
          ? Math.round((Date.now() - sample.pairCreatedAt) / (1000 * 60 * 60 * 24))
          : null
        console.log(`[v0]   ${i + 1}. ${sample.symbol}:`, {
          pairCreatedAt: sample.pairCreatedAt ? new Date(sample.pairCreatedAt).toISOString() : "MISSING",
          ageDays,
          liquidity: sample.liquidityUsd ? `$${(sample.liquidityUsd / 1000).toFixed(0)}k` : null,
          score: sample.score,
        })
      })
    } else {
      console.log("[v0] New/Early: 0 tokens qualified (check pairCreatedAt availability)")
    }
    
    // PART C: Calculate staleness
    const cacheAgeMs = Date.now() - indexCache.generatedAt
    const stale = cacheAgeMs > STALE_THRESHOLD_MS
    const staleSeverity: "low" | "high" | null = stale 
      ? (cacheAgeMs > HIGH_STALE_THRESHOLD_MS ? "high" : "low")
      : null
    
    if (staleSeverity === "high") {
      console.warn(`[v0] /api/index: HIGH STALE - cache age ${Math.round(cacheAgeMs / 60000)}m`)
    }
    
    // Determine final status based on ingestion health
    let finalStatus: "ready" | "degraded" = "ready"
    let degradedReason: string | undefined
    let lastGoodIngestAt: string | undefined

    if (ingestionStatus?.status === "degraded") {
      finalStatus = "degraded"
      degradedReason = ingestionStatus.reason
      if (ingestionStatus.lastGoodIngestAt) {
        lastGoodIngestAt = new Date(ingestionStatus.lastGoodIngestAt).toISOString()
      }
    }

    // TASK D: If debug mode, return smaller payload for browser preview
    if (debugMode) {
      const sampleMints = indexCache.tokens.slice(0, 5).map(t => t.address)
      const debugResponse = NextResponse.json({
        status: finalStatus,
        updatedAt: new Date(indexCache.generatedAt).toISOString(),
        lastIngestAt,
        stale,
        staleSeverity,
        counts: {
          total: indexCache.tokens.length,
          trending: trending.length,
          active: active.length,
          newEarly: newEarly.length,
          freshSignals: freshSignals.length,
        },
        sampleMints,
        debugMessage: "Debug mode - showing counts and 5 sample mints only. Remove ?debug=1 for full data.",
      })
      debugResponse.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120")
      return debugResponse
    }
    
    // Detect rate limit flags from ingestion status if available
    let rateLimitFlags = { dexscreener429: false }
    if (ingestionStatus?.errors) {
      const errors = Array.isArray(ingestionStatus.errors) ? ingestionStatus.errors : []
      rateLimitFlags.dexscreener429 = errors.some((e: string) => e.includes("429") || e.includes("rate limit"))
    }
    
    // Get source enablement from adapter config (dynamic based on enabled adapters)
    const { adapters } = await import("@/lib/adapters")
    const sourcesEnabled = adapters.filter(a => a.enabled !== false).map(a => a.name)
    
    // Sprint 3: Add Cache-Control headers to reduce latency and server load
    const response = NextResponse.json({
      status: finalStatus,
      degradedReason,
      lastGoodIngestAt,
      updatedAt: new Date(indexCache.generatedAt).toISOString(),
      refreshMs: 300000, // 5 minutes
      lastIngestAt,
      // Return suppression-filtered tokens (not canonical) to maintain backward compatibility
      // Pages can map to canonical themselves if needed
      all: unsuppressedTokens,
      trending,
      active,
      newEarly,
      freshSignals,
      // PART C: Stale indicators
      stale,
      staleSeverity,
      cacheAgeMs,
      // Top-level count to distinguish "no tokens" from "tokens exist but filtered"
      totalTokenCount: indexCache.tokens.length,
      meta: {
        asOf: new Date().toISOString(),
        poolCount: poolMints.length,
        signalCount: signalMints.length,
        snapshotCount: snapshotMints.length,
        counts: {
          total: indexCache.tokens.length,
          trending: trending.length,
          active: active.length,
          newEarly: newEarly.length,
          freshSignals: freshSignals.length,
        },
        filters: {
          trending: { minLiquidity: 25000 },
          active: { minLiquidity: 25000, minVolume: 500000 },
          newEarly: { minLiquidity: 100000, maxAgeDays: 30, minScore: 70 },
          freshSignals: { 
            change5m: 8, 
            change1h: 15, 
            volLiqRatio: 6, 
            minVolume: 200000,
            washThreshold: 70,
          },
        },
        // CACHE DIAGNOSTICS: Added for monitoring and debugging
        cache: {
          servedFrom,
          cacheAgeSeconds,
          tokenCountBeforePostProcessing,
          tokenCountAfterBuild: indexCache.tokens.length,
          sourcesEnabled,
          lastIngestAt: lastIngestAt || null,
          rateLimitFlags,
          bypassedCache: bypassCache,
        },
      },
    })
    
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    )
    
    return response
  } catch (error) {
    console.error("[v0] Error in /api/index:", error)
    
    // Return warming status on error
    const errorResponse = NextResponse.json({
      status: "warming",
      updatedAt: new Date().toISOString(),
      refreshMs: 300000,
      lastIngestAt,
      all: [],
      trending: [],
      active: [],
      newEarly: [],
      freshSignals: [],
      stale: false,
      staleSeverity: null,
      cacheAgeMs: 0,
      meta: {
        counts: { total: 0, trending: 0, active: 0, newEarly: 0, freshSignals: 0 },
        filters: {},
      },
      error: "System warming up",
    })
    
    // Sprint 3: Don't cache error state - retry quickly
    errorResponse.headers.set(
      "Cache-Control",
      "public, s-maxage=10, stale-while-revalidate=30"
    )
    
    return errorResponse
  }
}

// Enable edge runtime for fast responses
export const runtime = "edge"
export const dynamic = "force-dynamic"
