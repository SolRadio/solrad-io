import type { TokenScore } from "./types"

/**
 * Build a deterministic "Why SOLRAD Flagged This" explanation
 * Returns null if no compelling reason
 */
export function buildWhyFlagged(token: TokenScore): string | null {
  const reasons: string[] = []

  // Strong liquidity
  if (token.liquidity >= 500000) {
    reasons.push(`$${(token.liquidity / 1000000).toFixed(2)}M deep liquidity`)
  }

  // Healthy vol/liquidity ratio
  const volLiqRatio = token.liquidity > 0 ? token.volume24h / token.liquidity : 0
  if (volLiqRatio >= 0.5 && volLiqRatio <= 3.0) {
    reasons.push("healthy trading activity")
  }

  // Good SOLRAD score
  if (token.totalScore >= 70) {
    reasons.push(`strong SOLRAD score (${token.totalScore})`)
  }

  // Low risk
  if (token.riskLabel === "LOW RISK") {
    reasons.push("low risk flags")
  }

  // Multi-source confirmation
  const sources = token.sources?.length || 0
  if (sources > 1) {
    reasons.push("multi-source confirmation")
  }

  if (reasons.length === 0) return null

  return `SOLRAD flagged this token for: ${reasons.join(", ")}.`
}
