import type { TokenData, TokenScore, RiskLabel, HeliusEnrichment } from "./types"
import { ensureRiskLabel } from "./utils/normalize-risk"

export function calculateTokenScore(
  tokenDataMap: Map<string, TokenData[]>,
  heliusData?: Map<string, HeliusEnrichment>,
): TokenScore[] {
  const scores: TokenScore[] = []
  let rank = 1

  for (const [_lowercaseKey, dataPoints] of tokenDataMap.entries()) {
    if (dataPoints.length === 0) continue

    const merged = dataPoints[0] // Only one source now (DexScreener)
    
    // CRITICAL: Use original case from merged.address, not the lowercased map key
    // Solana addresses are case-sensitive for display/explorers
    const canonicalAddress = merged.address
    const helius = heliusData?.get(_lowercaseKey)

    // Calculate individual score components (0-100 each)
    const liquidityScore = scoreLiquidity(merged.liquidity)
    const volumeScore = scoreVolume(merged.volume24h)
    const activityScore = scoreActivity(merged.volume24h, merged.liquidity, merged.txns24h)
    const ageScore = scoreAge(merged.pairCreatedAt)
    const healthScore = scoreHealth(merged.fdv, merged.liquidity, helius)
    const boostScore = scoreBoost(merged.boostSources, merged.boostAmount)

    // Weighted average
    const totalScore =
      liquidityScore * 0.25 +
      volumeScore * 0.2 +
      activityScore * 0.15 +
      ageScore * 0.15 +
      healthScore * 0.15 +
      boostScore * 0.1

    const tokenAgeHours = merged.pairCreatedAt ? (Date.now() - merged.pairCreatedAt) / (1000 * 60 * 60) : undefined

    const computedRiskLabel = getRiskLabel(merged.liquidity, merged.volume24h, merged.fdv, tokenAgeHours, helius)

    const tokenScore: TokenScore = {
      address: canonicalAddress, // FIXED: Use original case from TokenData, not lowercased key
      dexTokenAddress: merged.dexTokenAddress, // Raw DexScreener token id
      symbol: merged.symbol,
      name: merged.name,
      chain: "solana",
      trendingRank: rank++,
      totalScore: Math.round(totalScore * 10) / 10,
      riskLabel: computedRiskLabel, // Use computed value directly
      priceUsd: merged.priceUsd,
      priceChange5m: merged.priceChange5m,
      priceChange1h: merged.priceChange1h,
      priceChange6h: merged.priceChange6h,
      priceChange24h: merged.priceChange24h,
      volume24h: merged.volume24h,
      liquidity: merged.liquidity,
      marketCap: merged.marketCap,
      fdv: merged.fdv,
      txns24h: merged.txns24h,
      holders: helius?.holderCount,
      imageUrl: merged.imageUrl,
      dexId: merged.dexId,
      pairUrl: merged.pairUrl,
      pairAddress: merged.pairAddress, // Pair address for DexScreener pair operations
      boostSources: merged.boostSources,
      boostAmount: merged.boostAmount,
      heliusData: helius,
      pairCreatedAt: merged.pairCreatedAt, // Include pair creation timestamp
      tokenAgeHours: tokenAgeHours, // Include computed age in hours
      scoreBreakdown: {
        liquidityScore: Math.round(liquidityScore * 10) / 10,
        volumeScore: Math.round(volumeScore * 10) / 10,
        activityScore: Math.round(activityScore * 10) / 10,
        ageScore: Math.round(ageScore * 10) / 10,
        healthScore: Math.round(healthScore * 10) / 10,
        boostScore: Math.round(boostScore * 10) / 10,
      },
      lastUpdated: Date.now(),
      source: merged.source,
      sourceUpdatedAt: merged.sourceUpdatedAt,
      dataFetchedAt: merged.dataFetchedAt ?? merged.sourceUpdatedAt ?? Date.now(),
    }

    tokenScore.riskLabel = ensureRiskLabel(tokenScore, () => computedRiskLabel)

    scores.push(tokenScore)
  }

  return scores.sort((a, b) => b.totalScore - a.totalScore)
}

function scoreBoost(sources?: string[], amount?: number): number {
  if (!sources || sources.length === 0) return 0

  let score = 0

  // Base score for being boosted
  score += 40

  // Bonus for top boosts vs latest
  if (sources.includes("BOOST_TOP")) {
    score += 40
  } else if (sources.includes("BOOST_LATEST")) {
    score += 20
  }

  // Small bonus for boost amount
  if (amount && amount > 100) {
    score += Math.min(20, amount / 100)
  }

  return Math.min(100, score)
}

function scoreLiquidity(liquidity: number): number {
  if (liquidity < 1000) return 0 // Too low
  if (liquidity < 10000) return 20
  if (liquidity < 50000) return 40
  if (liquidity < 100000) return 60
  if (liquidity < 500000) return 80
  return 100
}

function scoreVolume(volume: number): number {
  if (volume < 1000) return 0
  if (volume < 10000) return 20
  if (volume < 100000) return 40
  if (volume < 500000) return 60
  if (volume < 2000000) return 80
  return 100
}

function scoreActivity(volume: number, liquidity: number, txns?: number): number {
  if (liquidity === 0) return 0

  const volLiqRatio = volume / liquidity
  let score = 0

  // Healthy ratio is 0.5-3.0
  if (volLiqRatio >= 0.5 && volLiqRatio <= 3.0) {
    score += 50
  } else if (volLiqRatio > 0.1 && volLiqRatio < 10) {
    score += 25
  }

  // Bonus for high transaction count
  if (txns) {
    if (txns > 1000) score += 50
    else if (txns > 500) score += 30
    else if (txns > 100) score += 15
  } else {
    score += 25 // Neutral if no txn data
  }

  return Math.min(100, score)
}

function scoreAge(pairCreatedAt?: number): number {
  if (!pairCreatedAt) return 50 // Neutral if unknown

  const ageHours = (Date.now() - pairCreatedAt) / (1000 * 60 * 60)

  if (ageHours < 1) return 0 // Too new, risky
  if (ageHours < 6) return 30
  if (ageHours < 24) return 60
  if (ageHours < 168) return 80 // < 1 week
  return 100
}

function scoreHealth(fdv?: number, liquidity?: number, helius?: HeliusEnrichment): number {
  let score = 50 // Start neutral

  // FDV/Liquidity ratio check
  if (fdv && liquidity && liquidity > 0) {
    const fdvLiqRatio = fdv / liquidity
    if (fdvLiqRatio < 10) score += 25
    else if (fdvLiqRatio < 50) score += 15
    else if (fdvLiqRatio > 500) score -= 25
  }

  // Helius enrichment checks
  if (helius) {
    // Mint/freeze authority check
    if (helius.mintAuthority === null && helius.freezeAuthority === null) {
      score += 25 // Renounced authorities = safer
    } else {
      score -= 10 // Authorities present = risk
    }

    // Holder concentration check
    if (helius.topHolderPercentage && helius.topHolderPercentage > 50) {
      score -= 15 // High concentration = risk
    }
  }

  return Math.max(0, Math.min(100, score))
}

export function getRiskLabel(
  liquidity: number,
  volume24h: number,
  fdv?: number,
  tokenAgeHours?: number,
  helius?: HeliusEnrichment,
): RiskLabel {
  let riskPoints = 0

  // Liquidity checks
  if (liquidity < 50000) riskPoints += 2
  if (liquidity < 10000) riskPoints += 2 // Total +4 if under $10k

  // Volume checks
  if (volume24h < 25000) riskPoints += 1
  if (volume24h < 10000) riskPoints += 1 // Total +2 if under $10k

  // FDV/Liquidity ratio checks
  if (fdv && liquidity > 0) {
    const fdvLiqRatio = fdv / liquidity
    if (fdvLiqRatio > 150) riskPoints += 2
    if (fdvLiqRatio > 300) riskPoints += 2 // Total +4 if over 300
  }

  // Token age checks
  if (tokenAgeHours !== undefined) {
    if (tokenAgeHours < 24) riskPoints += 2
    if (tokenAgeHours < 6) riskPoints += 2 // Total +4 if under 6 hours
  }

  // Helius enrichment checks
  if (helius) {
    // Holder concentration
    if (helius.topHolderPercentage) {
      if (helius.topHolderPercentage >= 35) riskPoints += 2
      if (helius.topHolderPercentage >= 50) riskPoints += 2 // Total +4 if over 50%
    }

    // Authority status (mint/freeze still enabled = risky)
    if (helius.mintAuthority !== null || helius.freezeAuthority !== null) {
      riskPoints += 3
    }
  }

  // Map risk points to labels
  if (riskPoints >= 7) return "HIGH RISK"
  if (riskPoints >= 3) return "MEDIUM RISK"
  return "LOW RISK"
}
