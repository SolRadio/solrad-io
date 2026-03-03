/**
 * Token Score Resolution Utility
 * Defensively extracts SOLRAD score from various token shapes
 */

/**
 * Safely extract SOLRAD score from any token object
 * Tries multiple field candidates in priority order
 * Returns number or null (never NaN, never invalid range)
 */
export function getSolradScore(token: any): number | null {
  if (!token) return null

  // Priority order of score field candidates
  const candidates = [
    token.solradScore,
    token.score,
    token.totalScore, // Added this since we've been using it
    token.solrad?.score,
    token.scores?.solrad,
    token.scoring?.total,
    token.scoreData?.total,
    token.metrics?.solradScore,
    token.badges?.solradScore,
    token.breakdown?.total,
  ]

  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined) continue

    // Handle string values
    const parsed = typeof candidate === "string" ? Number.parseFloat(candidate) : candidate

    // Validate parsed number
    if (Number.isNaN(parsed)) continue
    if (!Number.isFinite(parsed)) continue

    // Range validation: reject out-of-range scores
    if (parsed < 0 || parsed > 100) return null

    return parsed
  }

  return null
}

/**
 * Format score for display (one decimal place)
 */
export function formatSolradScore(score: number | null): string {
  if (score === null) return "—"
  return score.toFixed(1)
}

/**
 * Get score metadata (label + className for styling)
 */
export function getSolradScoreMeta(score: number | null): {
  label: string
  className: string
} {
  if (score === null) {
    return {
      label: "—",
      className: "text-muted-foreground",
    }
  }

  // Score-based styling
  let className = "text-primary"
  if (score >= 80) className = "text-green-500"
  else if (score >= 60) className = "text-primary"
  else if (score >= 40) className = "text-yellow-500"
  else className = "text-orange-500"

  return {
    label: formatSolradScore(score),
    className,
  }
}
