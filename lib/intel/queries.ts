/**
 * SOLRAD Intelligence Engine v1 - Clean Column Query Functions
 * Pure functions that derive Trending, Active Trading, and New/Early lists from TokenIndex
 */

import type { TokenIntel } from "./types"

// ==========================================
// CONFIGURATION CONSTANTS (easy tuning)
// ==========================================

const CONFIG = {
  // Trending Tokens
  TRENDING_MIN_LIQUIDITY: 25000,
  TRENDING_MOMENTUM_BOOST_WEIGHT: 0.1, // Mild momentum boost to score
  
  // Active Trading
  ACTIVE_MIN_LIQUIDITY: 25000,
  ACTIVE_MIN_VOLUME: 500000, // $500k minimum volume to be "active"
  
  // New/Early
  NEW_MIN_LIQUIDITY: 100000, // $100k hard requirement for New/Early
  NEW_MAX_AGE_DAYS: 30,
  NEW_MIN_SCORE: 70, // Must have decent score to qualify
  NEW_MAX_WASH_SCORE: 70, // Exclude if wash score too high
  
  // Fresh Signals - Real-time anomaly detection (P0-01: Lowered thresholds)
  FRESH_CHANGE_5M_THRESHOLD: 5, // +/- 5% in 5 minutes (lowered from 8)
  FRESH_CHANGE_1H_THRESHOLD: 10, // +/- 10% in 1 hour (lowered from 15)
  FRESH_VOL_LIQ_RATIO: 3, // volume/liquidity >= 3x (lowered from 6)
  FRESH_MIN_VOLUME: 100000, // $100k minimum volume (lowered from 200k)
  FRESH_MIN_LIQUIDITY: 25000, // $25k minimum liquidity
  FRESH_WASH_THRESHOLD: 70, // Wash score >= 70
  FRESH_RISK_MIN_VOLUME: 100000, // $100k min volume for HIGH RISK signals
}

/**
 * Trending Tokens - Score-dominant with mild momentum boost
 * Filters: liquidityUsd >= 25k
 * Sort: score desc (with slight momentum bias from price change and volume)
 */
export function getTrending(tokens: TokenIntel[]): TokenIntel[] {
  return tokens
    .filter((token) => {
      const liquidity = token.liquidityUsd ?? 0
      return liquidity >= CONFIG.TRENDING_MIN_LIQUIDITY
    })
    .map((token) => {
      // Add mild momentum boost to score for sorting
      const change24h = token.change24hPct ?? 0
      const volume = token.volume24hUsd ?? 0
      
      // Momentum factor: positive change + high volume slightly boosts ranking
      const momentumBoost = 
        (change24h > 0 ? Math.min(change24h / 100, 0.5) : 0) + // Max +0.5 from price
        (volume > 1000000 ? 0.3 : 0) // +0.3 if volume > $1M
      
      const adjustedScore = token.score + (momentumBoost * CONFIG.TRENDING_MOMENTUM_BOOST_WEIGHT * 10)
      
      return { ...token, _sortScore: adjustedScore }
    })
    .sort((a, b) => (b as any)._sortScore - (a as any)._sortScore)
    .map(({ _sortScore, ...token }: any) => token) // Remove temp sort field
}

/**
 * Active Trading - Volume-dominant, excludes HIGH RISK
 * Filters: liquidityUsd >= 25k, volume >= 500k OR significant price movement
 * Sort: volume24hUsd desc
 */
export function getActiveTrading(tokens: TokenIntel[]): TokenIntel[] {
  return tokens
    .filter((token) => {
      // Exclude HIGH RISK tokens
      if (token.riskLabel === "HIGH") return false
      
      const liquidity = token.liquidityUsd ?? 0
      if (liquidity < CONFIG.ACTIVE_MIN_LIQUIDITY) return false
      
      const volume = token.volume24hUsd ?? 0
      const change1h = token.change24hPct ?? 0 // Using 24h as fallback since 1h might not be available
      
      // Must have significant volume OR price movement
      return volume >= CONFIG.ACTIVE_MIN_VOLUME || Math.abs(change1h) >= 10
    })
    .sort((a, b) => {
      const volA = a.volume24hUsd ?? 0
      const volB = b.volume24hUsd ?? 0
      return volB - volA
    })
}

/**
 * New/Early - Young tokens with safe structure heuristics
 * UPGRADED: Uses pairCreatedAt with firstSeenAt fallback for age determination
 * Filters: 
 *   - liquidityUsd >= 100k (hard requirement)
 *   - age <= 30 days (from pairCreatedAt OR firstSeenAt fallback)
 *   - score >= 70 (must have decent fundamentals)
 *   - riskLabel !== "HIGH"
 *   - washScore < 70
 *   - !insiderRiskHigh badge
 * Sort: newest first (pairCreatedAt/firstSeenAt desc), then score desc
 */
export function getNewEarly(tokens: TokenIntel[]): TokenIntel[] {
  const now = Date.now()
  const maxAgeMs = CONFIG.NEW_MAX_AGE_DAYS * 24 * 60 * 60 * 1000
  
  return tokens
    .filter((token) => {
      // Use pairCreatedAt if available, fallback to firstSeenAt
      const tokenAge = token.pairCreatedAt || token.firstSeenAt
      if (!tokenAge) return false // Must have some age indicator
      
      const tokenAgeMs = now - tokenAge
      if (tokenAgeMs > maxAgeMs) return false // Too old (> 30 days)
      
      // Hard liquidity requirement
      const liquidity = token.liquidityUsd ?? 0
      if (liquidity < CONFIG.NEW_MIN_LIQUIDITY) return false
      
      // Exclude HIGH RISK
      if (token.riskLabel === "HIGH") return false
      
      // Must have decent score
      if (token.score < CONFIG.NEW_MIN_SCORE) return false
      
      // Safe structure heuristics - exclude TRASH tokens
      if (token.badges.trash) return false
      if (token.integrity.washScore >= CONFIG.NEW_MAX_WASH_SCORE) return false
      if (token.badges.insiderRiskHigh) return false
      
      return true
    })
    .sort((a, b) => {
      // Primary: GEM badge first
      const aGem = a.badges.gem ? 1 : 0
      const bGem = b.badges.gem ? 1 : 0
      if (bGem !== aGem) return bGem - aGem
      
      // Secondary: newest first (pairCreatedAt OR firstSeenAt desc)
      const ageA = a.pairCreatedAt || a.firstSeenAt || 0
      const ageB = b.pairCreatedAt || b.firstSeenAt || 0
      if (ageB !== ageA) return ageB - ageA // Newer tokens first
      
      // Tertiary: score desc
      if (b.score !== a.score) {
        return b.score - a.score
      }
      // Quaternary: liquidity desc
      const liqA = a.liquidityUsd ?? 0
      const liqB = b.liquidityUsd ?? 0
      return liqB - liqA
    })
}

/**
 * Fresh Signals - Real-time anomaly and momentum detection
 * Catches: momentum bursts (5m/1h), volume spikes, wash warnings, risk warnings
 * Filters: At least one signal must be triggered
 * Sort: By urgency score (most urgent first)
 */
export function getFreshSignals(tokens: TokenIntel[]): TokenIntel[] {
  const candidates = tokens
    .map((token) => {
      const change5m = token.change5mPct ?? 0
      const change1h = token.change1hPct ?? 0
      const volume = token.volume24hUsd ?? 0
      const liquidity = token.liquidityUsd ?? 0
      const washScore = token.integrity?.washScore ?? 0
      const riskLabel = token.riskLabel
      
      // Signal detection flags
      const hasMomentum5m = Math.abs(change5m) >= CONFIG.FRESH_CHANGE_5M_THRESHOLD
      const hasMomentum1h = Math.abs(change1h) >= CONFIG.FRESH_CHANGE_1H_THRESHOLD
      // P0-01: Removed vol/liq ratio requirement - too strict for pump.fun tokens
      const hasVolSpike = 
        volume >= CONFIG.FRESH_MIN_VOLUME &&
        liquidity >= CONFIG.FRESH_MIN_LIQUIDITY
      const hasWashWarning = 
        washScore >= CONFIG.FRESH_WASH_THRESHOLD &&
        liquidity >= CONFIG.FRESH_MIN_LIQUIDITY
      const hasRiskWarning = 
        riskLabel === "HIGH" &&
        volume >= CONFIG.FRESH_RISK_MIN_VOLUME
      
      // Must trigger at least one signal
      const qualifies = hasMomentum5m || hasMomentum1h || hasVolSpike || hasWashWarning || hasRiskWarning
      
      if (!qualifies) return null
      
      // Helper: Format money compactly
      const formatMoney = (amount: number): string => {
        if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}m`
        if (amount >= 1000) return `$${Math.round(amount / 1000)}k`
        return `$${Math.round(amount)}`
      }
      
      // Build signal reasons array (max 3 most important)
      const signalReasons: string[] = []
      
      // Priority order: momentum > volume spike > wash > risk
      if (hasMomentum5m) {
        const direction = change5m >= 0 ? "Momentum" : "Dump"
        signalReasons.push(`5m ${direction} ${change5m >= 0 ? "+" : ""}${change5m.toFixed(1)}%`)
      }
      if (hasMomentum1h) {
        signalReasons.push(`1h Momentum ${change1h >= 0 ? "+" : ""}${change1h.toFixed(1)}%`)
      }
      if (hasVolSpike) {
        const volLiqRatio = volume / liquidity
        signalReasons.push(`Vol/Liq ${volLiqRatio.toFixed(1)} (Vol ${formatMoney(volume)} / Liq ${formatMoney(liquidity)})`)
      }
      if (hasWashWarning && signalReasons.length < 3) {
        signalReasons.push(`Wash Warning ${Math.round(washScore)}`)
      }
      if (hasRiskWarning && signalReasons.length < 3) {
        signalReasons.push(`Risk HIGH (Vol ${formatMoney(volume)})`)
      }
      
      // Limit to top 3 reasons
      const topReasons = signalReasons.slice(0, 3)
      
      // Compute urgency score for sorting (higher = more urgent)
      let urgencyScore = 0
      
      // Momentum weight (price movement is most urgent)
      if (hasMomentum5m) urgencyScore += Math.abs(change5m) * 2 // 5m gets 2x weight
      if (hasMomentum1h) urgencyScore += Math.abs(change1h) * 1 // 1h gets 1x weight
      
      // Volume spike weight
      if (hasVolSpike) {
        const volLiqRatio = volume / liquidity
        urgencyScore += Math.min(volLiqRatio, 20) * 2 // Cap at 20x, multiply by 2
      }
      
      // Wash warning weight
      if (hasWashWarning) {
        urgencyScore += (washScore / 100) * 10 // 0-10 points based on wash score
      }
      
      // Risk warning weight
      if (hasRiskWarning) {
        urgencyScore += 8 // Fixed weight for HIGH RISK
      }
      
      return { ...token, _urgencyScore: urgencyScore, signalReasons: topReasons }
    })
    .filter((token): token is TokenIntel & { _urgencyScore: number; signalReasons: string[] } => token !== null)
  
  // Sort by urgency score descending (most urgent first)
  return candidates
    .sort((a, b) => b._urgencyScore - a._urgencyScore)
    .map(({ _urgencyScore, ...token }) => token) // Remove temp sort field, keep signalReasons
}
