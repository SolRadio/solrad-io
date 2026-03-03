import { getSolradScore } from "@/lib/token-score"
import type { TokenScore } from "@/lib/types"

export function getScorePercentile(score: number, allScores: number[]): number {
  if (allScores.length === 0) return 50
  const below = allScores.filter((s) => s < score).length
  return Math.round((below / allScores.length) * 100)
}

export function formatPercentile(percentile: number): string {
  if (percentile >= 95) return "Top 5%"
  if (percentile >= 90) return "Top 10%"
  if (percentile >= 75) return "Top 25%"
  if (percentile >= 50) return "Top 50%"
  return "Below avg"
}

/** Extract all SOLRAD scores from a token array for percentile calculations */
export function extractAllScores(tokens: TokenScore[]): number[] {
  return tokens.map((t) => getSolradScore(t)).filter((s) => s > 0)
}
