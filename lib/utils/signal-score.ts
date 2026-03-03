import type { TokenScore } from "@/lib/types"

export function computeSignalScore(token: TokenScore): number {
  let score = 0

  // Volume/Liquidity ratio (0-3 points)
  if (token.liquidity > 0) {
    const volLiqRatio = token.volume24h / token.liquidity
    if (volLiqRatio >= 0.5 && volLiqRatio <= 3.0) {
      score += 3
    } else if (volLiqRatio > 0.1 && volLiqRatio < 5.0) {
      score += 1
    }
  }

  // Activity presence (0-2 points)
  if (token.volume24h > 10000) {
    score += 2
  } else if (token.volume24h > 1000) {
    score += 1
  }

  // Token age (0-2 points)
  if (token.scoreBreakdown.ageScore >= 60) {
    score += 2
  } else if (token.scoreBreakdown.ageScore >= 30) {
    score += 1
  }

  // Risk label (0-3 points)
  if (token.riskLabel === "LOW RISK") {
    score += 3
  } else if (token.riskLabel === "MEDIUM RISK") {
    score += 1
  }

  return Math.min(10, score)
}
