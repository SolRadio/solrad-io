import type { TokenScore } from "@/lib/types"

/**
 * Phase C1: Signal Clarity
 * 
 * Derives a human-readable rationale string for why a token is notable
 * using ONLY existing fields. No new data sources or scoring.
 * 
 * Pure, deterministic logic based on token properties.
 */
export function deriveSignalRationale(token: TokenScore): string {
  // Early exit if no token
  if (!token) return ""
  
  const {
    totalScore,
    priceChange5m = 0,
    priceChange1h = 0,
    priceChange6h = 0,
    priceChange24h = 0,
    volume24h = 0,
    liquidity = 0,
    tokenAgeHours,
    signalState,
    scoreBreakdown,
  } = token
  
  // Priority 1: Fresh signal with score momentum
  if (signalState === "STRONG" && priceChange1h > 10) {
    return "Fresh signal (score ↑)"
  }
  
  // Priority 2: Rising momentum (price + score improving)
  if (priceChange1h > 8 && priceChange5m > 5 && totalScore >= 70) {
    return "Rising momentum"
  }
  
  // Priority 3: Liquidity surge (high liquidity score component)
  if (scoreBreakdown?.liquidityScore >= 20 && liquidity >= 100000) {
    return "Liquidity surge"
  }
  
  // Priority 4: Unusual volume (high volume relative to liquidity)
  const volLiqRatio = liquidity > 0 ? volume24h / liquidity : 0
  if (volLiqRatio >= 6 && volume24h >= 200000) {
    return "Unusual volume"
  }
  
  // Priority 5: New listing (< 48h old with decent score)
  if (tokenAgeHours !== undefined && tokenAgeHours < 48 && totalScore >= 60) {
    return "New listing"
  }
  
  // Priority 6: Active & stable (high activity score, low volatility)
  if (
    scoreBreakdown?.activityScore >= 15 && 
    Math.abs(priceChange24h) < 30 && 
    volume24h >= 500000
  ) {
    return "Active & stable"
  }
  
  // Priority 7: Early stage opportunity (young + high score)
  if (tokenAgeHours !== undefined && tokenAgeHours < 168 && totalScore >= 70) {
    return "Early stage"
  }
  
  // Priority 8: Strong fundamentals (high health score)
  if (scoreBreakdown?.healthScore >= 15 && liquidity >= 50000) {
    return "Strong fundamentals"
  }
  
  // Priority 9: Price action (significant price change)
  if (priceChange24h >= 50) {
    return "Price breakout"
  }
  if (priceChange24h <= -30) {
    return "Price decline"
  }
  
  // Priority 10: High quality signal (SOLRAD score threshold)
  if (totalScore >= 80) {
    return "High quality"
  }
  
  // Priority 11: Emerging signal (decent score, building momentum)
  if (totalScore >= 60 && priceChange6h > 5) {
    return "Emerging signal"
  }
  
  // Default: Return empty string (no rationale needed)
  return ""
}

/**
 * Enriches an array of tokens with signal rationale
 * Mutates tokens by adding _rationale property
 */
export function enrichTokensWithRationale<T extends TokenScore>(tokens: T[]): T[] {
  if (!Array.isArray(tokens)) return tokens
  
  return tokens.map(token => ({
    ...token,
    _rationale: deriveSignalRationale(token),
  }))
}
