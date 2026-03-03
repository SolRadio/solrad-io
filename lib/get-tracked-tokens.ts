import "server-only"
import { getCachedTokens, ingestTokenData } from "@/lib/ingestion"
import { getBlobState } from "@/lib/blob-storage"
import type { TokenScore } from "@/lib/types"
import { ensureRiskLabel } from "@/lib/utils/normalize-risk"
import { getRiskLabel } from "@/lib/scoring"

/**
 * SAFE metadata fields that can be overlaid from stored/blob tokens
 * These do NOT include live metrics that come from Dexscreener
 */
const SAFE_METADATA_FIELDS = [
  "notes",
  "isPinned",
  "tag",
  "firstSeenAt",
  "watchlist",
  "userLabels",
  "customTags",
] as const

/**
 * Merge stored metadata into live token WITHOUT overwriting live metrics
 * Always prefer live price/volume/liquidity from cached ingestion
 */
function mergeStoredMetadataIntoLive(live: TokenScore, stored: any): TokenScore {
  // Start with live token (source of truth for metrics)
  const merged = { ...live }
  
  // Only overlay SAFE metadata fields from stored
  for (const field of SAFE_METADATA_FIELDS) {
    if (stored[field] !== undefined) {
      (merged as any)[field] = stored[field]
    }
  }
  
  // Special handling: keep firstSeenAt if stored has it and live doesn't
  if (stored.firstSeenAt && !live.pairCreatedAt) {
    merged.pairCreatedAt = stored.firstSeenAt
  }
  
  return merged
}

/**
 * Server-only function to get all tracked tokens from cache + blob storage
 * Used by both /api/tokens route and sitemap generation
 * 
 * CRITICAL: Live metrics (price, volume, liquidity) ALWAYS come from cached ingestion
 * Blob storage only provides user metadata (notes, pins, tags)
 */
export async function getTrackedTokens(): Promise<TokenScore[]> {
  try {
    let cachedData = await getCachedTokens()
    let blobState = await getBlobState()

    // SMARTER COLLAPSE GUARD: Only ignore blob if it's dramatically smaller than cache
    // This preserves manually tracked tokens (1-19) when cache is also small
    const cachedCount = cachedData?.tokens?.length ?? 0
    const blobTokenCount = Object.keys(blobState?.tokensByMint ?? {}).length
    const looksCollapsed =
      blobTokenCount > 0 &&
      blobTokenCount < 20 &&
      cachedCount >= 80 &&
      blobTokenCount < Math.floor(cachedCount * 0.1)

    console.log("[v0] getTrackedTokens:", { cachedCount, blobTokenCount, looksCollapsed })

    if (looksCollapsed) {
      console.warn(`[v0] Ignoring collapsed blob state (${blobTokenCount} tokens vs ${cachedCount} cached)`)
      blobState = { ...blobState, tokensByMint: {} }
    }

    // If no cached data or cache is empty, try ingestion once
    // BUT check if cache was JUST updated (within 60 seconds) to avoid duplicate ingestion
    if (!cachedData || cachedData.tokens.length === 0) {
      const { getLastUpdateTime } = await import("./ingestion")
      const lastUpdate = await getLastUpdateTime()
      const now = Date.now()
      const cacheAge = lastUpdate ? now - lastUpdate : Infinity
      
      // Only trigger ingestion if cache is stale (> 60 seconds old)
      if (cacheAge > 60000) {
        console.log("[v0] getTrackedTokens: No cached tokens, attempting ingestion...")
        const result = await ingestTokenData()

        if (result.success) {
          cachedData = await getCachedTokens()
        } else {
          console.log("[v0] getTrackedTokens: Ingestion failed or locked, using blob fallback")
        }
      } else {
        console.log(`[v0] getTrackedTokens: Cache recently updated (${Math.round(cacheAge / 1000)}s ago), skipping duplicate ingestion`)
      }
    }

    // Build map of live tokens (source of truth for metrics)
    const allTokens = new Map<string, TokenScore>()

    // POLICY: Use KV cache as primary source, Blob as fallback ONLY when cache is empty
    if (cachedCount > 0) {
      // KV_ONLY policy: Return cached tokens only, no blob merge
      console.log("[v0] getTrackedTokens policy: KV_ONLY")
      
      // Add auto-ingested tokens - these have LIVE metrics
      if (cachedData?.tokens && Array.isArray(cachedData.tokens)) {
        for (const token of cachedData.tokens) {
          token.riskLabel = ensureRiskLabel(token, (t) =>
            getRiskLabel(t.liquidity, t.volume24h, t.fdv, undefined, t.heliusData),
          )
          allTokens.set(token.address.toLowerCase(), token)
        }
      }
      
      // Merge metadata ONLY from blob (do not add new tokens from blob)
      const storedTokens = blobState.tokensByMint || {}
      for (const [mint, storedToken] of Object.entries(storedTokens)) {
        const mintLower = mint.toLowerCase()
        const liveToken = allTokens.get(mintLower)
        
        if (liveToken) {
          // Live token exists - merge ONLY metadata from stored
          const merged = mergeStoredMetadataIntoLive(liveToken, storedToken)
          allTokens.set(mintLower, merged)
        }
        // REMOVED: Do not add blob tokens as fallback when cache exists
      }
    } else if (blobTokenCount > 0) {
      // BLOB_FALLBACK policy: Cache is empty, use blob tokens as fallback
      console.log("[v0] getTrackedTokens policy: BLOB_FALLBACK")
      
      const storedTokens = blobState.tokensByMint || {}
      for (const [mint, storedToken] of Object.entries(storedTokens)) {
        const mintLower = mint.toLowerCase()
        const fallbackToken = storedToken as TokenScore
        fallbackToken.riskLabel = ensureRiskLabel(fallbackToken, (t) =>
          getRiskLabel(t.liquidity, t.volume24h, t.fdv, undefined, t.heliusData),
        )
        allTokens.set(mintLower, fallbackToken)
      }
    } else {
      // Both cache and blob are empty
      console.log("[v0] getTrackedTokens policy: NO_DATA")
    }

    const mergedTokens = Array.from(allTokens.values()).sort((a, b) => b.totalScore - a.totalScore)

    // Debug log with exact counts
    console.log("[v0] getTrackedTokens result:", { 
      kvCount: cachedCount, 
      blobCount: blobTokenCount, 
      returnedCount: mergedTokens.length 
    })
    
    return mergedTokens
  } catch (error) {
    console.error("[v0] getTrackedTokens: Error fetching tokens:", error)
    
    // Final fallback: try blob only
    try {
      const blobState = await getBlobState()
      const blobTokenCount = blobState?.tokensByMint ? Object.keys(blobState.tokensByMint).length : 0
      
      // Skip if blob is collapsed
      if (blobTokenCount > 0 && blobTokenCount < 20) {
        console.warn(`[v0] Skipping collapsed blob fallback (${blobTokenCount} tokens)`)
        return []
      }
      
      const fallbackTokens = Object.values(blobState.tokensByMint) as TokenScore[]
      
      if (fallbackTokens.length > 0) {
        console.log("[v0] getTrackedTokens: Using blob-only fallback with", fallbackTokens.length, "tokens")
        
        for (const token of fallbackTokens) {
          token.riskLabel = ensureRiskLabel(token, (t) =>
            getRiskLabel(t.liquidity, t.volume24h, t.fdv, undefined, t.heliusData),
          )
        }
        
        return fallbackTokens.sort((a, b) => b.totalScore - a.totalScore)
      }
    } catch (blobError) {
      console.error("[v0] getTrackedTokens: Blob fallback also failed:", blobError)
    }

    // Absolute fallback: empty array
    return []
  }
}
