export type ConvictionLevel =
  | "HIGH_CONVICTION"
  | "MODERATE"
  | "SPECULATIVE"
  | "AVOID"

export interface ConvictionResult {
  level: ConvictionLevel
  label: string
  color: "green" | "yellow" | "orange" | "red"
  summary: string
}

/**
 * Derives a conviction label from existing token data.
 * Pure function -- no external fetching, no side effects.
 * Uses score + riskLevel as primary inputs; volume/liquidity/holderCount
 * are reserved for future refinement but do not affect output today.
 */
export function getConviction({
  score,
  riskLevel,
}: {
  score: number
  riskLevel?: string
  volume24h?: number
  liquidity?: number
  holderCount?: number
}): ConvictionResult {
  if (score >= 85 && (riskLevel === "LOW" || riskLevel === "MEDIUM")) {
    return {
      level: "HIGH_CONVICTION",
      label: "High Conviction",
      color: "green",
      summary: "Strong setup with momentum and stable conditions",
    }
  }

  if (score >= 70) {
    return {
      level: "MODERATE",
      label: "Moderate Setup",
      color: "yellow",
      summary: "Decent setup but requires confirmation",
    }
  }

  if (score >= 50) {
    return {
      level: "SPECULATIVE",
      label: "Speculative",
      color: "orange",
      summary: "Higher risk, early or unstable conditions",
    }
  }

  return {
    level: "AVOID",
    label: "Avoid",
    color: "red",
    summary: "Weak structure or high risk signals",
  }
}
