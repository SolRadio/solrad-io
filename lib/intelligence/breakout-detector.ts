export interface BreakoutSignal {
  mint: string
  symbol: string
  name: string
  score: number
  breakoutScore: number
  reasons: string[]
  priceUsd: number
  volume24h: number
  liquidity: number
  priceChange1h: number
  priceChange5m: number
  priceChange6h: number
  marketCap: number
  imageUrl: string | null
  pairUrl: string
  detectedAt: string
}

export interface TokenCandidate {
  address: string
  symbol?: string
  name?: string
  totalScore?: number
  priceUsd?: number
  volume24h?: number
  liquidity?: number
  marketCap?: number
  priceChange5m?: number
  priceChange1h?: number
  priceChange6h?: number
  priceChange24h?: number
  txns24h?: number
  imageUrl?: string
  pairUrl?: string
  tokenAgeHours?: number
  scoreBreakdown?: {
    liquidityScore?: number
    volumeScore?: number
    activityScore?: number
    ageScore?: number
    healthScore?: number
    boostScore?: number
  }
  backgroundTrackedAt?: number
  lastUpdated?: number
}

/**
 * Compute breakout probability for a single token.
 * Returns null if token doesn't meet minimum criteria.
 *
 * Algorithm based on historical win-rate analysis:
 * - FIRST_SEEN + score 65-80 is highest value range
 * - Volume acceleration is the strongest predictor
 * - Avoid tokens scoring 85+ (already extended)
 * - Age < 72h sweet spot for breakout potential
 */
export function computeBreakoutScore(token: TokenCandidate): BreakoutSignal | null {
  const score = token.totalScore ?? 0
  const volume = token.volume24h ?? 0
  const liquidity = token.liquidity ?? 0
  const price1h = token.priceChange1h ?? 0
  const price5m = token.priceChange5m ?? 0
  const price6h = token.priceChange6h ?? 0
  const age = token.tokenAgeHours ?? 999
  const txns = token.txns24h ?? 0

  // Hard filters -- skip immediately
  if (score < 55) return null
  if (score > 84) return null
  if (liquidity < 5000) return null
  if (volume < 10000) return null
  if (!token.address) return null

  // Cap extreme price changes (bad DexScreener data on new tokens)
  const safe6h = Math.abs(price6h) > 2000 ? 0 : price6h
  const safe1h = Math.abs(price1h) > 500 ? 0 : price1h
  const safe5m = Math.abs(price5m) > 100 ? 0 : price5m

  const reasons: string[] = []
  let breakoutScore = 0

  // === VOLUME ACCELERATION (most predictive) ===
  const volLiqRatio = liquidity > 0 ? volume / liquidity : 0
  if (volLiqRatio >= 10) {
    breakoutScore += 30
    reasons.push(`Volume ${volLiqRatio.toFixed(1)}x liquidity`)
  } else if (volLiqRatio >= 5) {
    breakoutScore += 20
    reasons.push(`Volume ${volLiqRatio.toFixed(1)}x liquidity`)
  } else if (volLiqRatio >= 3) {
    breakoutScore += 10
    reasons.push(`Vol/liq ratio elevated`)
  }

  // === SHORT-TERM PRICE MOMENTUM ===
  if (safe5m >= 15) {
    breakoutScore += 25
    reasons.push(`+${safe5m.toFixed(1)}% in 5m`)
  } else if (safe5m >= 8) {
    breakoutScore += 15
    reasons.push(`+${safe5m.toFixed(1)}% in 5m`)
  } else if (safe5m >= 3) {
    breakoutScore += 8
    reasons.push(`+${safe5m.toFixed(1)}% in 5m`)
  }

  // 1h momentum -- confirms move
  if (safe1h >= 30) {
    breakoutScore += 20
    reasons.push(`+${safe1h.toFixed(1)}% in 1h`)
  } else if (safe1h >= 15) {
    breakoutScore += 12
    reasons.push(`+${safe1h.toFixed(1)}% in 1h`)
  } else if (safe1h >= 8) {
    breakoutScore += 6
    reasons.push(`+${safe1h.toFixed(1)}% in 1h`)
  }

  // === TOKEN AGE (sweet spot: 6-72h) ===
  if (age >= 6 && age <= 24) {
    breakoutScore += 15
    reasons.push(`New listing (${age.toFixed(0)}h old)`)
  } else if (age > 24 && age <= 72) {
    breakoutScore += 10
    reasons.push(`Early stage (${age.toFixed(0)}h old)`)
  } else if (age > 72 && age <= 168) {
    breakoutScore += 5
  }

  // === SCORE SWEET SPOT (65-80 based on historical data) ===
  if (score >= 70 && score <= 80) {
    breakoutScore += 15
    reasons.push(`Signal score ${score} (sweet spot)`)
  } else if (score >= 65 && score < 70) {
    breakoutScore += 8
  } else if (score > 80 && score <= 84) {
    breakoutScore += 5
  }

  // === ACTIVITY ===
  if (txns >= 5000) {
    breakoutScore += 10
    reasons.push(`${txns.toLocaleString()} txns/24h`)
  } else if (txns >= 2000) {
    breakoutScore += 5
    reasons.push(`${txns.toLocaleString()} txns/24h`)
  }

  // === 6h TREND CONFIRMATION ===
  if (safe6h >= 50) {
    breakoutScore += 10
    reasons.push(`+${safe6h.toFixed(0)}% in 6h`)
  } else if (safe6h >= 20) {
    breakoutScore += 5
  }

  // Minimum breakout score to qualify
  if (breakoutScore < 50) return null
  if (reasons.length < 2) return null

  return {
    mint: token.address,
    symbol: token.symbol ?? "???",
    name: token.name ?? "Unknown",
    score,
    breakoutScore: Math.min(100, breakoutScore),
    reasons,
    priceUsd: token.priceUsd ?? 0,
    volume24h: volume,
    liquidity,
    priceChange1h: price1h,
    priceChange5m: price5m,
    priceChange6h: price6h,
    marketCap: token.marketCap ?? 0,
    imageUrl: token.imageUrl ?? null,
    pairUrl: token.pairUrl ?? "",
    detectedAt: new Date().toISOString(),
  }
}

/**
 * Scan all candidates and return breakout signals sorted by breakoutScore desc.
 */
export function detectBreakouts(candidates: TokenCandidate[]): BreakoutSignal[] {
  return candidates
    .map(computeBreakoutScore)
    .filter((s): s is BreakoutSignal => s !== null)
    .sort((a, b) => b.breakoutScore - a.breakoutScore)
}
