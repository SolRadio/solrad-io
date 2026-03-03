import type { TokenScore } from "./types"

/**
 * SCORING V2: MASTERPIECE SCORING SYSTEM
 * Better distribution and independent from SOLRAD score
 */

export function computeActivityRatio(token: TokenScore): number | null {
  const liquidity = Number(token.liquidity) || 0
  const volume = Number(token.volume24h) || 0
  
  if (liquidity === 0) return null
  return volume / liquidity
}

/**
 * SIGNAL SCORE V2 (0-10)
 * Now derived from readiness score for more meaningful signal
 */
export function computeSignalScoreV2(token: TokenScore): number | null {
  const readiness = computeReadinessScore(token)
  return computeSignalFromReadiness(readiness)
}

/**
 * QUALITY SCORE (0-100)
 * Uses existing score component fields with explicit weights:
 * - liquidityComponent: 35%
 * - healthComponent: 30%
 * - ageComponent: 20%
 * - volumeComponent: 15%
 */
export function computeQualityScore(token: TokenScore): number {
  const sb = token.scoreBreakdown
  
  // Get components from existing breakdown (each 0-100)
  const liquidityComponent = sb?.liquidityScore ?? 0
  const healthComponent = sb?.healthScore ?? 50 // Neutral default
  const ageComponent = sb?.ageScore ?? 50 // Neutral default
  const volumeComponent = sb?.volumeScore ?? 0
  
  // Apply weights
  const quality =
    liquidityComponent * 0.35 +
    healthComponent * 0.30 +
    ageComponent * 0.20 +
    volumeComponent * 0.15
  
  return Math.max(0, Math.min(100, Math.round(quality)))
}

/**
 * READINESS SCORE (0-100)
 * Weights:
 * - activityRatioComponent: 45%
 * - volumeComponent: 35%
 * - priceActionComponent: 20%
 */
export function computeReadinessScore(token: TokenScore): number {
  // Activity ratio component (0-100)
  const ratio = computeActivityRatio(token)
  let activityComponent = 50 // Neutral default
  if (ratio !== null) {
    if (ratio >= 0.5 && ratio <= 3.0) {
      activityComponent = 100
    } else if (ratio >= 0.3 && ratio <= 5.0) {
      activityComponent = 60
    } else if (ratio < 0.1 || ratio > 10) {
      activityComponent = 0
    }
  }
  
  // Volume component (0-100)
  const sb = token.scoreBreakdown
  const volumeComponent = sb?.volumeScore ?? 0
  
  // Price action component (0-100)
  // Favor stable price movements
  const priceChange = Math.abs(Number(token.priceChange24h) || 0)
  let priceActionComponent = 0
  if (priceChange <= 10) {
    priceActionComponent = 100
  } else if (priceChange <= 25) {
    priceActionComponent = 70
  } else if (priceChange <= 50) {
    priceActionComponent = 40
  } else if (priceChange <= 100) {
    priceActionComponent = 20
  }
  
  // Apply weights
  const readiness =
    activityComponent * 0.45 +
    volumeComponent * 0.35 +
    priceActionComponent * 0.20
  
  return Math.max(0, Math.min(100, Math.round(readiness)))
}

/**
 * GEM SCORE (0-100)
 * Weighted: 60% quality + 40% readiness
 */
export function computeGemScore(token: TokenScore): number {
  const quality = computeQualityScore(token)
  const readiness = computeReadinessScore(token)
  
  const gem = quality * 0.6 + readiness * 0.4
  return Math.max(0, Math.min(100, Math.round(gem)))
}

/**
 * Convert readiness score to 0-10 SIGNAL score
 */
export function computeSignalFromReadiness(readiness: number): number {
  return Math.max(0, Math.min(10, Math.round(readiness / 10)))
}

// Backward compatibility alias
export const computeSignalScore = computeSignalScoreV2
