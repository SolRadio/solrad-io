import type { TokenScore } from "@/lib/types"

export function buildWhyFlagged(token: TokenScore): string | null {
  const reasons: string[] = []

  // Liquidity depth
  if (token.liquidity > 100000) {
    reasons.push("Strong liquidity depth")
  }

  // Volume/Liquidity ratio
  if (token.liquidity > 0) {
    const volLiqRatio = token.volume24h / token.liquidity
    if (volLiqRatio >= 0.5 && volLiqRatio <= 3.0) {
      reasons.push("Healthy volume-to-liquidity ratio indicates real activity")
    }
  }

  // Price stability
  const priceChange = Math.abs(token.priceChange24h ?? 0)
  if (priceChange > 5 && priceChange < 50) {
    reasons.push("Price action shows structure")
  }

  // Risk label
  if (token.riskLabel === "LOW RISK") {
    reasons.push("Safer token setup with renounced authorities")
  }

  // Return top 2 reasons
  if (reasons.length === 0) return null
  return reasons.slice(0, 2).join(". ") + "."
}
