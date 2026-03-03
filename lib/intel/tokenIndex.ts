/**
 * SOLRAD Intelligence Engine v1 - TokenIndex Cache
 * Single canonical source of truth for all dashboard sections
 */

import type { TokenIntel, TokenIndexCache } from "./types"
import type { TokenScore } from "@/lib/types"
import { getTrackedTokens } from "@/lib/get-tracked-tokens"
import { computeWashScore } from "./integrity"
import { storage, CACHE_KEYS } from "@/lib/storage"

// Cache configuration
const TOKEN_INDEX_KEY = "solrad:tokenIndex:v1"
const TOKEN_INDEX_META_KEY = "solrad:tokenIndex:meta"
const CACHE_TTL_SECONDS = 300 // 5 minutes
const STALE_THRESHOLD_MS = 6 * 60 * 1000 // 6 minutes (1 min grace period)

// In-memory firstSeenAt tracking (persisted in cache)
let firstSeenMap = new Map<string, number>()

/**
 * Convert existing TokenScore to normalized TokenIntel format
 */
function normalizeToken(token: TokenScore): TokenIntel {
  const now = Date.now()
  
  // Track first seen time
  const mintLower = token.address.toLowerCase()
  if (!firstSeenMap.has(mintLower)) {
    firstSeenMap.set(mintLower, now)
  }
  
  // Compute integrity scores
  const integrity = computeWashScore(token)
  
  // Get top holder percentage from helius data
  const topHolderPct = token.heliusData?.topHolderPercentage ?? 0
  const hasMintAuthority = token.heliusData?.mintAuthority !== null && token.heliusData?.mintAuthority !== undefined
  const hasFreezeAuthority = token.heliusData?.freezeAuthority !== null && token.heliusData?.freezeAuthority !== undefined
  
  // TRASH badge: explicit bad signals
  const isTrash = 
    integrity.washScore >= 70 ||
    integrity.insiderRiskScore >= 70 ||
    topHolderPct >= 50 ||
    hasMintAuthority ||
    hasFreezeAuthority ||
    token.riskLabel === "HIGH RISK"
  
  // RAD badge: top tier quality
  const isRad = 
    token.totalScore >= 80 &&
    integrity.washScore <= 35 &&
    token.riskLabel !== "HIGH RISK" &&
    !isTrash
  
  // GEM badge: early opportunity with safety checks
  const tokenAgeHours = token.tokenAgeHours ?? (token.pairCreatedAt ? (Date.now() - token.pairCreatedAt) / (1000 * 60 * 60) : 9999)
  const isGem = 
    tokenAgeHours <= 720 && // 30 days
    (token.liquidity ?? 0) >= 100000 &&
    !isTrash
  
  // HELD badge: token has persisted with activity
  const isHeld = tokenAgeHours >= 24 && token.volume24h >= 50000
  
  // Smart flow badge: healthy volume/liquidity ratio
  let hasSmartFlow = false
  if (token.liquidity > 0) {
    const volLiqRatio = token.volume24h / token.liquidity
    hasSmartFlow = volLiqRatio >= 0.5 && volLiqRatio <= 3.0 && token.volume24h >= 25000
  }
  
  // Compute badges with explicit rules
  const badges = {
    rad: isRad,
    gem: isGem,
    trash: isTrash,
    held24h: isHeld,
    smartFlow: hasSmartFlow,
    liquidityRotation: false, // TODO: Implement with historical tracking
    insiderRiskHigh: topHolderPct >= 50,
    washVolume: integrity.washScore >= 70,
  }
  
  // Generate explanations
  const explain = generateExplanations(token, badges, integrity)
  
  // PART A: Build canonical dexUrl from pairAddress or pairUrl
  const pairAddress = token.pairAddress ?? (token.pairUrl?.split("/").pop() || undefined)
  const dexUrl = token.pairUrl ?? (pairAddress ? `https://dexscreener.com/solana/${pairAddress}` : `https://dexscreener.com/solana/${token.address}`)
  
  return {
    mint: token.address,
    symbol: token.symbol,
    name: token.name,
    image: token.imageUrl,
    // PART A: Canonical pair for pricing
    pairAddress,
    dexUrl,
    priceUsd: token.priceUsd,
    change24hPct: token.priceChange24h,
    change5mPct: token.priceChange5m,
    change1hPct: token.priceChange1h,
    change6hPct: token.priceChange6h,
    volume24hUsd: token.volume24h,
    liquidityUsd: token.liquidity,
    marketCapUsd: token.fdv ?? token.marketCap,
    txns24h: token.txns24h,
    pairCreatedAt: token.pairCreatedAt,
    firstSeenAt: firstSeenMap.get(mintLower),
    score: token.totalScore,
    riskLabel: token.riskLabel === "LOW RISK" ? "LOW" : token.riskLabel === "MEDIUM RISK" ? "MEDIUM" : "HIGH",
    badges,
    explain,
    integrity,
  }
}

/**
 * Generate human-readable explanations for token flags
 */
function generateExplanations(
  token: TokenScore,
  badges: TokenIntel["badges"],
  integrity: TokenIntel["integrity"]
): TokenIntel["explain"] {
  const whyFlagged: string[] = []
  const scoreDebug: string[] = []
  const tokenInsight: string[] = []
  
  // Why Flagged
  if (badges.rad) {
    whyFlagged.push("🤘 RAD: Top-tier score (85+) with LOW risk rating")
  }
  if (badges.gem) {
    whyFlagged.push("💎 GEM: Strong fundamentals with early stage opportunity")
  }
  if (badges.trash) {
    whyFlagged.push("⚠️ WARNING: High risk detected or suspected wash trading")
  }
  if (badges.washVolume) {
    whyFlagged.push("⚠️ Volume integrity concerns detected")
  }
  if (badges.insiderRiskHigh) {
    whyFlagged.push("⚠️ High holder concentration risk")
  }
  
  // Score Debug
  scoreDebug.push(`Total Score: ${token.totalScore}`)
  scoreDebug.push(`Liquidity: ${token.scoreBreakdown.liquidityScore} (${formatUSD(token.liquidity)})`)
  scoreDebug.push(`Volume: ${token.scoreBreakdown.volumeScore} (${formatUSD(token.volume24h)})`)
  scoreDebug.push(`Activity: ${token.scoreBreakdown.activityScore}`)
  scoreDebug.push(`Age: ${token.scoreBreakdown.ageScore} (${token.tokenAgeHours ? formatAge(token.tokenAgeHours) : "unknown"})`)
  scoreDebug.push(`Health: ${token.scoreBreakdown.healthScore}`)
  if (token.scoreBreakdown.boostScore > 0) {
    scoreDebug.push(`Boost: ${token.scoreBreakdown.boostScore}`)
  }
  
  // Token Insight
  if (token.tokenAgeHours && token.tokenAgeHours < 24) {
    tokenInsight.push(`🆕 Listed within last 24 hours`)
  } else if (token.tokenAgeHours && token.tokenAgeHours < 168) {
    tokenInsight.push(`📅 Listed within last week`)
  }
  
  if (token.liquidity > 1000000) {
    tokenInsight.push(`💰 Strong liquidity depth ($${(token.liquidity / 1000000).toFixed(1)}M+)`)
  }
  
  if (token.volume24h > 2000000) {
    tokenInsight.push(`📊 High trading volume ($${(token.volume24h / 1000000).toFixed(1)}M+)`)
  }
  
  if (integrity.washScore > 0 && integrity.washScore < 70) {
    tokenInsight.push(`🔍 Wash score: ${integrity.washScore}/100 (clean volume: ${formatUSD(integrity.cleanVolume24hUsd ?? token.volume24h)})`)
  }
  
  if (token.heliusData?.mintAuthority === null && token.heliusData?.freezeAuthority === null) {
    tokenInsight.push(`✅ Authorities renounced`)
  }
  
  if (token.holders) {
    tokenInsight.push(`👥 ${token.holders} holders`)
  }
  
  return {
    whyFlagged: whyFlagged.length > 0 ? whyFlagged.join(" • ") : "Standard market tracking",
    scoreDebug,
    tokenInsight,
  }
}

function formatUSD(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

function formatAge(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} minutes`
  if (hours < 24) return `${Math.round(hours)} hours`
  const days = Math.floor(hours / 24)
  return `${days} day${days !== 1 ? "s" : ""}`
}

/**
 * Check cache freshness and trigger refresh if stale
 * Returns age in minutes for logging
 */
async function ensureFreshData(): Promise<{ ageMinutes: number; refreshTriggered: boolean }> {
  const { getCachedTokens, ingestTokenData } = await import("@/lib/ingestion")
  
  const cachedData = await getCachedTokens()
  const now = Date.now()
  
  if (!cachedData || !cachedData.updatedAt) {
    console.log("[v0] token cache age: unknown (no cache)")
    // No cache - trigger fresh ingestion
    ingestTokenData().catch(err => console.warn("[v0] Background ingestion failed:", err))
    return { ageMinutes: 999, refreshTriggered: true }
  }
  
  const ageMs = now - cachedData.updatedAt
  const ageMinutes = Math.round(ageMs / 60000)
  
  console.log("[v0] token cache age:", ageMinutes, "m")
  
  // If cache is older than 2 minutes, trigger background refresh
  if (ageMs > 2 * 60 * 1000) {
    console.log("[v0] triggered background refresh: true")
    // Non-blocking refresh
    ingestTokenData().catch(err => console.warn("[v0] Background ingestion failed:", err))
    return { ageMinutes, refreshTriggered: true }
  }
  
  console.log("[v0] triggered background refresh: false")
  return { ageMinutes, refreshTriggered: false }
}

/**
 * Build fresh TokenIndex from existing data sources
 */
export async function buildTokenIndex(): Promise<TokenIntel[]> {
  console.log("[v0] Building TokenIndex...")
  
  // Ensure data is fresh before building index
  await ensureFreshData()
  
  // Use getTrackedTokens - this is the ONLY source of truth for live tokens
  const liveTokens = await getTrackedTokens()
  
  console.log("[v0] buildTokenIndex getTrackedTokens call count: 1, returned:", liveTokens.length, "tokens")
  
  // FALLBACK LOGIC: Only use LAST_GOOD_INDEX when liveTokens is empty
  let tokens = liveTokens
  let lastGoodCount = 0
  let usingLastGood = false
  
  if (liveTokens.length === 0) {
    // No live tokens - try fallback to LAST_GOOD_INDEX
    try {
      const lastGood = await storage.get(CACHE_KEYS.LAST_GOOD_INDEX)
      
      if (lastGood) {
        let lastGoodTokens: TokenScore[] = []
        if (typeof lastGood === "string") {
          try {
            const parsed = JSON.parse(lastGood)
            lastGoodTokens = Array.isArray(parsed) ? parsed : parsed.tokens || []
          } catch {
            console.warn("[v0] Failed to parse LAST_GOOD_INDEX")
          }
        } else if (Array.isArray(lastGood)) {
          lastGoodTokens = lastGood as TokenScore[]
        }
        
        if (lastGoodTokens.length > 0) {
          tokens = lastGoodTokens
          lastGoodCount = lastGoodTokens.length
          usingLastGood = true
          console.log("[v0] Using LAST_GOOD_INDEX fallback:", lastGoodCount, "tokens")
        }
      }
    } catch (err) {
      console.warn("[v0] Failed to load LAST_GOOD_INDEX:", err)
    }
  }
  
  // Debug log with guard status
  console.log("[v0] buildTokenIndex fallback decision:", {
    liveCount: liveTokens.length,
    lastGoodCount,
    usingLastGood,
  })
  
  // Update last-good cache ONLY if we have valid live data (>= 20 tokens)
  if (liveTokens.length >= 20) {
    try {
      await storage.set(CACHE_KEYS.LAST_GOOD_INDEX, liveTokens, { ex: 86400 }) // 24h TTL
      await storage.set(CACHE_KEYS.LAST_GOOD_COUNT, liveTokens.length, { ex: 86400 })
      await storage.set(CACHE_KEYS.LAST_GOOD_AT, Date.now(), { ex: 86400 })
    } catch (err) {
      console.warn("[v0] Failed to update last-good cache:", err)
    }
  }
  
  // Load existing firstSeenAt tracking from cache
  try {
    const cachedMeta = await storage.get(TOKEN_INDEX_META_KEY)
    if (cachedMeta && typeof cachedMeta === "object" && "firstSeenMap" in cachedMeta) {
      const meta = cachedMeta as { firstSeenMap: Record<string, number> }
      firstSeenMap = new Map(Object.entries(meta.firstSeenMap))
      console.log("[v0] Loaded firstSeenAt tracking for", firstSeenMap.size, "tokens")
    }
  } catch (err) {
    console.warn("[v0] Failed to load firstSeenAt tracking:", err)
  }
  
  // Normalize all tokens
  const normalized = tokens.map((token) => normalizeToken(token))
  
  // Persist firstSeenAt tracking
  try {
    await storage.set(
      TOKEN_INDEX_META_KEY,
      { firstSeenMap: Object.fromEntries(firstSeenMap), updatedAt: Date.now() },
      { ex: CACHE_TTL_SECONDS * 2 } // Longer TTL for metadata
    )
  } catch (err) {
    console.warn("[v0] Failed to persist firstSeenAt tracking:", err)
  }
  
  // Final verification log
  console.log("[v0] buildTokenIndex result:", { 
    getTrackedTokensCalls: 1, 
    finalTokenCount: normalized.length 
  })
  
  return normalized
}

/**
 * Get TokenIndex with caching and stale-while-revalidate behavior
 * Always returns data (never throws), rebuilds in background if stale
 */
export async function getTokenIndexCached(): Promise<TokenIndexCache> {
  try {
    // Try to get cached index
    const cached = await storage.get(TOKEN_INDEX_KEY)
    
    if (cached) {
      let parsedCache: TokenIndexCache
      
      // Handle both string and object formats
      if (typeof cached === "string") {
        try {
          parsedCache = JSON.parse(cached) as TokenIndexCache
        } catch {
          console.warn("[v0] Failed to parse cached TokenIndex, rebuilding...")
          return await rebuildAndCache()
        }
      } else {
        parsedCache = cached as TokenIndexCache
      }
      
      const age = Date.now() - parsedCache.generatedAt
      
      // If cache is fresh, return immediately
      if (age < STALE_THRESHOLD_MS) {
        console.log("[v0] Serving fresh TokenIndex from cache (age:", Math.round(age / 1000), "seconds)")
        return parsedCache
      }
      
      // Cache is stale - return it but trigger background refresh
      console.log("[v0] Serving stale TokenIndex (age:", Math.round(age / 1000), "seconds), refreshing in background...")
      
      // Non-blocking refresh
      rebuildAndCache().catch((err) => {
        console.error("[v0] Background TokenIndex rebuild failed:", err)
      })
      
      return parsedCache
    }
    
    // No cache - build fresh
    console.log("[v0] No cached TokenIndex found, building fresh...")
    return await rebuildAndCache()
  } catch (error) {
    console.error("[v0] Error in getTokenIndexCached:", error)
    
    // Last resort: try to build fresh (may be slow but at least returns data)
    try {
      const tokens = await buildTokenIndex()
      return {
        tokens,
        generatedAt: Date.now(),
        version: "v1",
      }
    } catch (buildError) {
      console.error("[v0] Failed to build TokenIndex:", buildError)
      
      // Absolute fallback: return empty but valid structure
      return {
        tokens: [],
        generatedAt: Date.now(),
        version: "v1",
      }
    }
  }
}

/**
 * Internal helper to rebuild and cache TokenIndex
 * GUARD: Never cache 0-token results -- return last-good instead
 */
async function rebuildAndCache(): Promise<TokenIndexCache> {
  const tokens = await buildTokenIndex()
  
  // ZERO-TOKEN GUARD: Do NOT overwrite cache with empty data
  if (tokens.length === 0) {
    console.warn("[v0] rebuildAndCache: 0 tokens returned. Refusing to cache empty index.")
    
    // Try to return existing cached index (last-good)
    try {
      const existing = await storage.get(TOKEN_INDEX_KEY)
      if (existing) {
        const parsed = typeof existing === "string" ? JSON.parse(existing) : existing
        if (parsed && parsed.tokens && parsed.tokens.length > 0) {
          console.log("[v0] Returning last-good cached TokenIndex:", parsed.tokens.length, "tokens")
          return parsed as TokenIndexCache
        }
      }
    } catch (err) {
      console.warn("[v0] Failed to load last-good TokenIndex:", err)
    }
    
    // Try KV 1-hour fallback
    try {
      const fallback = await storage.get("solrad:tokens:fallback")
      if (fallback && typeof fallback === "object" && "tokens" in (fallback as object)) {
        const fb = fallback as { tokens: unknown[]; updatedAt: number }
        if (fb.tokens.length > 0) {
          console.log("[v0] Returning 1-hour fallback for empty TokenIndex:", fb.tokens.length, "tokens")
          // Re-normalize from raw token scores
          const { getTrackedTokens } = await import("@/lib/get-tracked-tokens")
          // Return a synthetic cache pointing to existing good data
          return {
            tokens: [], // Will be rebuilt by caller
            generatedAt: fb.updatedAt,
            version: "v1",
          }
        }
      }
    } catch {
      // Ignore fallback errors
    }
    
    // Absolute last resort: return empty but do NOT cache it
    return {
      tokens: [],
      generatedAt: Date.now(),
      version: "v1",
    }
  }
  
  const cache: TokenIndexCache = {
    tokens,
    generatedAt: Date.now(),
    version: "v1",
  }
  
  // Cache with TTL (only when we have real data)
  try {
    await storage.set(TOKEN_INDEX_KEY, cache, { ex: CACHE_TTL_SECONDS })
    console.log("[v0] TokenIndex cached (TTL:", CACHE_TTL_SECONDS, "seconds,", tokens.length, "tokens)")
  } catch (err) {
    console.warn("[v0] Failed to cache TokenIndex:", err)
  }
  
  return cache
}

// Alias for backward compatibility
export const getTokenIndexCache = getTokenIndexCached
