import type { TokenScore } from "./types"

/**
 * Compute a 0-10 signal score representing trade readiness right now
 * Returns null if required fields are missing
 */
export function computeSignalScore(token: TokenScore): number | null {
  const base100 =
    Number(token.totalScore ?? (token as any).score ?? (token as any).solradScore ?? (token as any).total_score ?? 0) ||
    0

  // If no score at all, return null
  if (base100 === 0) return null

  // Normalize to 0-10
  let base = Math.round((base100 / 100) * 10)

  const liquidity = Number(token.liquidity ?? (token as any).liquidityUsd ?? 0) || 0
  const volume24h = Number(token.volume24h ?? (token as any).volume24hUsd ?? (token as any).volume ?? 0) || 0

  // Add +1 if liquidity >= 100k
  if (liquidity >= 100000) {
    base += 1
  }

  const ratio = liquidity > 0 ? volume24h / liquidity : null

  // Add +1 if volume/liquidity ratio between 0.5-3.0
  if (ratio !== null && ratio >= 0.5 && ratio <= 3.0) {
    base += 1
  }

  const riskStr = String(token.riskLabel ?? (token as any).risk ?? "").toLowerCase()

  // Subtract -2 if HIGH RISK
  if (riskStr.includes("high") || riskStr.includes("trash")) {
    base -= 2
  }

  // Subtract -1 if token age < 6 hours (if age exists)
  if (token.pairCreatedAt) {
    const ageHours = (Date.now() - token.pairCreatedAt) / (1000 * 60 * 60)
    if (ageHours < 6) {
      base -= 1
    }
  }

  // Clamp between 0-10
  return Math.max(0, Math.min(10, base))
}

/**
 * Compute a 0-10 cluster score (gem readiness proxy)
 * Based on liquidity tier, activity, age, and health signals
 */
export function computeClusterScore(token: TokenScore): number | null {
  // Require minimum data to compute
  if (!token.liquidity || !token.volume24h) {
    return null
  }

  let score = 0

  // Liquidity tier (0-3 points)
  if (token.liquidity >= 1000000) score += 3
  else if (token.liquidity >= 500000) score += 2
  else if (token.liquidity >= 100000) score += 1

  // Activity ratio tier (0-3 points)
  const volLiqRatio = token.volume24h / token.liquidity
  if (volLiqRatio >= 1.0 && volLiqRatio <= 2.5) score += 3
  else if (volLiqRatio >= 0.5 && volLiqRatio <= 3.5) score += 2
  else if (volLiqRatio >= 0.3 && volLiqRatio <= 5.0) score += 1

  // Age maturity (0-2 points) - if pairCreatedAt is available
  if (token.pairCreatedAt) {
    const ageHours = (Date.now() - token.pairCreatedAt) / (1000 * 60 * 60)
    if (ageHours >= 24 && ageHours <= 336)
      score += 2 // 1-14 days
    else if (ageHours >= 6) score += 1
  }

  // Health signals (0-2 points)
  if (token.riskLabel === "LOW RISK") score += 2
  else if (token.riskLabel === "MEDIUM RISK") score += 1

  return Math.min(10, score)
}
