import type { TokenScore } from "./types"

/**
 * Default scoreBreakdown for tokens without complete data
 * (e.g., watchlist placeholder tokens not in current radar)
 */
const DEFAULT_SCORE_BREAKDOWN = {
  liquidityScore: 0,
  volumeScore: 0,
  activityScore: 0,
  ageScore: 0,
  healthScore: 0,
  boostScore: 0,
}

/**
 * Normalizes a token to ensure all required fields exist
 * Prevents "Cannot read properties of undefined" errors throughout the app
 * 
 * @param token - Potentially incomplete token data
 * @returns Fully normalized TokenScore with all required fields
 */
export function normalizeToken(token: Partial<TokenScore>): TokenScore {
  return {
    // Core identifiers (required)
    address: token.address || "",
    symbol: token.symbol || "???",
    name: token.name || "Unknown Token",
    chain: token.chain || "solana",
    
    // Scores (use defaults if missing)
    trendingRank: token.trendingRank ?? 0,
    totalScore: token.totalScore ?? 0,
    riskLabel: token.riskLabel || "HIGH RISK",
    scoreBreakdown: token.scoreBreakdown || DEFAULT_SCORE_BREAKDOWN,
    
    // Market data (safe defaults)
    priceUsd: token.priceUsd ?? 0,
    priceChange24h: token.priceChange24h ?? 0,
    volume24h: token.volume24h ?? 0,
    liquidity: token.liquidity ?? 0,
    
    // Timestamps
    lastUpdated: token.lastUpdated ?? Date.now(),
    
    // Optional fields (preserve if present)
    dexTokenAddress: token.dexTokenAddress,
    priceChange5m: token.priceChange5m,
    priceChange1h: token.priceChange1h,
    priceChange6h: token.priceChange6h,
    marketCap: token.marketCap,
    fdv: token.fdv,
    txns24h: token.txns24h,
    holders: token.holders,
    imageUrl: token.imageUrl,
    dexId: token.dexId,
    pairUrl: token.pairUrl,
    boostSources: token.boostSources,
    boostAmount: token.boostAmount,
    heliusData: token.heliusData,
    aiExplanation: token.aiExplanation,
    pairCreatedAt: token.pairCreatedAt,
    tokenAgeHours: token.tokenAgeHours,
    sources: token.sources,
    isPinned: token.isPinned,
    tag: token.tag,
    badges: token.badges,
    whyFlagged: token.whyFlagged,
    scoreDebug: token.scoreDebug,
    tokenInsight: token.tokenInsight,
    washTrading: token.washTrading,
    source: token.source,
    sourceUpdatedAt: token.sourceUpdatedAt,
    pairAddress: token.pairAddress,
    dexUrl: token.dexUrl,
    signalReasons: token.signalReasons,
  }
}

/**
 * Normalizes an array of tokens
 * Useful for processing watchlist or other token collections
 */
export function normalizeTokens(tokens: Array<Partial<TokenScore>>): TokenScore[] {
  return tokens.map(normalizeToken)
}
