import "server-only"
import type { TokenScore, SourceMetrics } from "./types"
import { getTrackedTokens } from "./get-tracked-tokens"
import { getBlobState } from "./blob-storage"
import { normalizeMint } from "./solana/normalizeMint"

export type TokenSource = "active" | "archive" | "pool" | "external" | "missing"

/**
 * Ensure token has a populated sources array based on existing data
 * Phase-A: Uses ONLY existing data, no new fetches
 */
function ensureTokenSources(token: TokenScore): TokenScore {
  // If sources already populated, return as-is
  if (token.sources && token.sources.length > 0) {
    return token
  }

  const sources: SourceMetrics[] = []

  // Rule 1: If token has market data (price/liquidity/volume), include dexscreener
  const hasMarketData = 
    (token.priceUsd && token.priceUsd > 0) ||
    (token.liquidity && token.liquidity > 0) ||
    (token.volume24h && token.volume24h > 0) ||
    token.pairUrl ||
    token.dexUrl

  if (hasMarketData) {
    sources.push({
      source: "dexscreener",
      priceChange24h: token.priceChange24h || 0,
      volume24h: token.volume24h || 0,
      liquidity: token.liquidity || 0,
      timestamp: Date.now(),
    })
  }

  // Rule 2: Check if token object has explicit source field
  if (token.source) {
    // Ensure we don't duplicate dexscreener
    if (token.source !== "dexscreener") {
      sources.push({
        source: token.source as any,
        priceChange24h: token.priceChange24h || 0,
        volume24h: token.volume24h || 0,
        liquidity: token.liquidity || 0,
        timestamp: token.sourceUpdatedAt || Date.now(),
      })
    }
  }

  // If we have market data but no sources, default to dexscreener
  if (sources.length === 0 && hasMarketData) {
    sources.push({
      source: "dexscreener",
      priceChange24h: token.priceChange24h || 0,
      volume24h: token.volume24h || 0,
      liquidity: token.liquidity || 0,
      timestamp: Date.now(),
    })
  }

  return {
    ...token,
    sources,
  }
}

export interface ResolvedToken {
  token: TokenScore | null
  source: TokenSource
  reason?: string
}

/**
 * Canonical token resolver for detail pages
 * Checks all local sources in priority order before attempting external fallback
 * 
 * Resolution priority:
 * 1. Active/indexed tokens (from getTrackedTokens - live metrics)
 * 2. Archive tokens (from blob archive)
 * 3. Pool tokens (same as active but explicit check)
 * 4. External fallback (not implemented - return missing)
 */
export async function resolveTokenByAddress(address: string): Promise<ResolvedToken> {
  // Normalize the address
  const normalizedAddress = normalizeMint(address).toLowerCase()
  
  if (!normalizedAddress) {
    return {
      token: null,
      source: "missing",
      reason: "Invalid address format",
    }
  }

  try {
    // Priority 1: Check active/tracked tokens (includes cached + blob user tokens)
    // This is the same dataset used by the dashboard
    console.log("[v0] Resolving token:", normalizedAddress)
    const trackedTokens = await getTrackedTokens()
    
    const activeToken = trackedTokens.find(
      (t) => t.address?.toLowerCase() === normalizedAddress
    )
    
    if (activeToken) {
      console.log("[v0] Token resolved from active/tracked tokens")
      
      // Populate sources array if not present or empty
      const tokenWithSources = ensureTokenSources(activeToken)
      
      return {
        token: tokenWithSources,
        source: "active",
        reason: "Found in active tracked tokens",
      }
    }

    // Priority 2: Check archive tokens (persistent blob storage)
    console.log("[v0] Not found in active tokens, checking archive...")
    const blobState = await getBlobState()
    const archiveToken = blobState.archiveByMint?.[normalizedAddress]
    
    if (archiveToken) {
      console.log("[v0] Token resolved from archive")
      // Convert archive format to TokenScore format
      const convertedToken: TokenScore = {
        address: archiveToken.address,
        symbol: archiveToken.symbol,
        name: archiveToken.name,
        chain: "solana",
        trendingRank: 0,
        totalScore: archiveToken.lastScore,
        riskLabel: archiveToken.riskLabel || "MEDIUM RISK",
        priceUsd: archiveToken.priceUsd || 0,
        priceChange24h: archiveToken.priceChange24h || 0,
        volume24h: archiveToken.volume24h || 0,
        liquidity: archiveToken.liquidity || 0,
        imageUrl: archiveToken.imageUrl,
        dexUrl: archiveToken.dexUrl,
        scoreBreakdown: {
          liquidityScore: 0,
          volumeScore: 0,
          activityScore: 0,
          ageScore: 0,
          healthScore: 0,
          boostScore: 0,
        },
        lastUpdated: archiveToken.lastSeenAt,
        badges: archiveToken.badges || [],
        sources: [],
        pairCreatedAt: archiveToken.lastSeenAt,
      }
      
      // Populate sources for archive token
      const tokenWithSources = ensureTokenSources(convertedToken)
      
      return {
        token: tokenWithSources,
        source: "archive",
        reason: "Found in persistent archive",
      }
    }

    // Priority 3: Pool tokens (already covered by active tokens check above, but explicit for clarity)
    console.log("[v0] Not found in archive either")

    // Priority 4: External fallback (not implemented yet - would fetch from Dexscreener/Birdeye)
    // For now, we return missing if not found in any local source
    console.log("[v0] Token not found in any local source")
    
    return {
      token: null,
      source: "missing",
      reason: "Token not found in tracked, archive, or pool sources",
    }
  } catch (error) {
    console.error("[v0] Error in resolveTokenByAddress:", error)
    return {
      token: null,
      source: "missing",
      reason: `Resolution error: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}
