/**
 * Signal State Engine for SOLRAD
 * 
 * Computes deterministic signal states from token metrics and tracks transitions.
 * States: EARLY | CAUTION | STRONG
 */

import { storage, CACHE_KEYS } from "./storage"
import type { TokenScore, RiskLabel } from "./types"
import { emitSignalStateAlert } from "./emit-signal-state-alert" // Import emitSignalStateAlert

// Storage key for signal state alerts (must match route.ts)
export const SIGNAL_STATE_ALERTS_KEY = "solrad:signalStateAlerts"

// Dedupe key for tracking recent alert emissions
const SIGNAL_ALERT_DEDUPE_KEY = (mint: string, fromState: string, toState: string) =>
  `solrad:signalAlertDedupe:${mint}:${fromState}:${toState}`

// Signal state types
export type SignalState = "EARLY" | "CAUTION" | "STRONG"

export interface SignalStateData {
  state: SignalState
  updatedAt: number
}

export interface SignalTransition {
  mint: string
  symbol: string
  fromState: SignalState
  toState: SignalState
  timestamp: number
  score: number
  confidence: number
}

// Adjustable thresholds (constants)
const THRESHOLDS = {
  STRONG_SCORE_MIN: 70,
  STRONG_CONFIDENCE_MIN: 70,
  CAUTION_SCORE_MIN: 70,
  CAUTION_CONFIDENCE_MAX: 50,
  EARLY_SCORE_MAX: 70,
  EARLY_CONFIDENCE_MAX: 50,
} as const

// Cache keys for signal state
export const SIGNAL_STATE_KEYS = {
  STATE: (mint: string) => `solrad:signalState:${mint}`,
  TRANSITIONS: "solrad:signalTransitions",
  TRANSITIONS_BY_TOKEN: (mint: string) => `solrad:signalTransitions:${mint}`,
}

// TTL for signal state data (7 days)
const SIGNAL_STATE_TTL = 604800

/**
 * Compute confidence from token data
 * (Matches existing drawer logic)
 */
export function computeConfidence(token: TokenScore, snapshots?: { solradScore: number; ts: number }[]): number {
  let confidence = 0
  
  // Data completeness (30 points)
  let dataPoints = 0
  if (token.liquidity > 0) dataPoints++
  if (token.volume24h > 0) dataPoints++
  if (token.txns24h && token.txns24h > 0) dataPoints++
  if (token.holders && token.holders > 0) dataPoints++
  if (token.heliusData?.holderCount) dataPoints++
  if (token.marketCap && token.marketCap > 0) dataPoints++
  if (token.priceChange24h !== undefined) dataPoints++
  if (token.tokenAgeHours !== undefined) dataPoints++
  if (token.scoreBreakdown) dataPoints++
  confidence += Math.min(30, dataPoints * 3.5)
  
  // Score stability via snapshots (30 points)
  if (snapshots && snapshots.length >= 3) {
    const scores = snapshots.slice(-8).map(s => s.solradScore)
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length
    const stdDev = Math.sqrt(variance)
    const stabilityBonus = Math.max(0, 30 - stdDev * 2)
    confidence += stabilityBonus
  }
  
  // Age maturity (20 points)
  const ageHours = token.tokenAgeHours || 0
  if (ageHours >= 168) confidence += 20 // 7+ days
  else if (ageHours >= 72) confidence += 15 // 3+ days
  else if (ageHours >= 24) confidence += 10 // 1+ day
  else if (ageHours >= 6) confidence += 5
  
  // Holder distribution (20 points)
  const topHolderPct = token.heliusData?.topHolderPercentage || 0
  if (topHolderPct > 0 && topHolderPct < 30) confidence += 20
  else if (topHolderPct < 50) confidence += 12
  else if (topHolderPct < 70) confidence += 5
  
  return Math.max(0, Math.min(100, Math.round(confidence)))
}

/**
 * Compute signal state from token data
 */
export function computeSignalState(
  token: TokenScore,
  confidence: number,
  snapshots?: { solradScore: number; ts: number }[]
): SignalState {
  const score = token.totalScore
  const riskLabel = token.riskLabel
  
  // HIGH RISK tokens are always CAUTION (overrides everything)
  if (riskLabel === "HIGH RISK") {
    return "CAUTION"
  }
  
  // Check for score trend if we have history
  let scoreTrendNegative = false
  if (snapshots && snapshots.length >= 3) {
    const recentScores = snapshots.slice(-4).map(s => s.solradScore)
    if (recentScores.length >= 2) {
      const trend = recentScores[recentScores.length - 1] - recentScores[0]
      scoreTrendNegative = trend < -10 // Significant decline
    }
  }
  
  // STRONG: High score + high confidence + no escalating risk + stable/positive trend
  if (
    score >= THRESHOLDS.STRONG_SCORE_MIN &&
    confidence >= THRESHOLDS.STRONG_CONFIDENCE_MIN &&
    !scoreTrendNegative
  ) {
    return "STRONG"
  }
  
  // CAUTION: Risk flags, conflicting signals, or unstable confidence
  if (
    riskLabel === "MEDIUM RISK" ||
    (score >= THRESHOLDS.CAUTION_SCORE_MIN && confidence < THRESHOLDS.CAUTION_CONFIDENCE_MAX) ||
    scoreTrendNegative
  ) {
    return "CAUTION"
  }
  
  // EARLY: Default for emerging activity, incomplete data, or below thresholds
  return "EARLY"
}

/**
 * Get stored signal state for a token
 */
export async function getSignalState(mint: string): Promise<SignalStateData | null> {
  try {
    const data = await storage.get(SIGNAL_STATE_KEYS.STATE(mint))
    return data as SignalStateData | null
  } catch {
    return null
  }
}

/**
 * Store signal state and track transitions
 */
export async function updateSignalState(
  token: TokenScore,
  newState: SignalState,
  confidence: number
): Promise<SignalTransition | null> {
  const mint = token.address
  const now = Date.now()
  
  // Get previous state
  const prevData = await getSignalState(mint)
  const prevState = prevData?.state
  
  // Store new state
  const stateData: SignalStateData = {
    state: newState,
    updatedAt: now,
  }
  await storage.set(SIGNAL_STATE_KEYS.STATE(mint), stateData, { ex: SIGNAL_STATE_TTL })
  
  // If state changed, record transition
  if (prevState && prevState !== newState) {
    const transition: SignalTransition = {
      mint,
      symbol: token.symbol,
      fromState: prevState,
      toState: newState,
      timestamp: now,
      score: token.totalScore,
      confidence,
    }
    
    // Append to global transitions list (keep last 500)
    try {
      const existingTransitions = (await storage.get(SIGNAL_STATE_KEYS.TRANSITIONS)) as SignalTransition[] || []
      const updatedTransitions = [transition, ...existingTransitions].slice(0, 500)
      await storage.set(SIGNAL_STATE_KEYS.TRANSITIONS, updatedTransitions, { ex: SIGNAL_STATE_TTL })
    } catch {
      // Non-critical, continue
    }
    
    // Also store per-token history (keep last 20)
    try {
      const tokenTransitions = (await storage.get(SIGNAL_STATE_KEYS.TRANSITIONS_BY_TOKEN(mint))) as SignalTransition[] || []
      const updatedTokenTransitions = [transition, ...tokenTransitions].slice(0, 20)
      await storage.set(SIGNAL_STATE_KEYS.TRANSITIONS_BY_TOKEN(mint), updatedTokenTransitions, { ex: SIGNAL_STATE_TTL })
    } catch {
      // Non-critical, continue
    }
    
    // Emit alert for the transition (with dedupe)
    try {
      await emitSignalStateAlert(token, prevState, newState, confidence)
    } catch {
      // Non-critical, continue
    }
    
    return transition
  }
  
  return null
}

/**
 * Get recent transitions (global)
 */
export async function getRecentTransitions(limit = 50): Promise<SignalTransition[]> {
  try {
    const transitions = (await storage.get(SIGNAL_STATE_KEYS.TRANSITIONS)) as SignalTransition[] || []
    return transitions.slice(0, limit)
  } catch {
    return []
  }
}

/**
 * Get transitions for a specific token
 */
export async function getTokenTransitions(mint: string): Promise<SignalTransition[]> {
  try {
    const transitions = (await storage.get(SIGNAL_STATE_KEYS.TRANSITIONS_BY_TOKEN(mint))) as SignalTransition[] || []
    return transitions
  } catch {
    return []
  }
}

/**
 * Process a token and update its signal state
 * Returns the computed state and any transition that occurred
 */
export async function processTokenSignalState(
  token: TokenScore,
  snapshots?: { solradScore: number; ts: number }[]
): Promise<{ state: SignalState; transition: SignalTransition | null }> {
  const confidence = computeConfidence(token, snapshots)
  const state = computeSignalState(token, confidence, snapshots)
  const transition = await updateSignalState(token, state, confidence)
  
  return { state, transition }
}
