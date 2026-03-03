import "server-only"
import { storage } from "@/lib/storage"
import { getRecentTransitions } from "@/lib/signal-state"
import type { TokenScore, SignalTransition } from "@/lib/types"

export interface TodayWinner {
  symbol: string
  mint: string
  score: number
  priceChange24h: number
  signalStrength: "STRONG" | "EARLY" | "CAUTION"
  liquidity: number
}

/**
 * Get start of today (UTC)
 */
function getStartOfTodayUTC(): number {
  const now = new Date()
  const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
  return utcDate.getTime()
}

/**
 * Get top 5 winners TODAY ONLY
 * Strict freshness: only tokens with signal transitions today
 */
export async function getTop5WinnersToday(): Promise<TodayWinner[]> {
  console.log("[v0] Getting top 5 winners for today...")
  
  const startOfToday = getStartOfTodayUTC()
  console.log("[v0] Start of today (UTC):", new Date(startOfToday).toISOString())
  
  // Get recent signal transitions
  const transitions = await getRecentTransitions(200)
  
  // Filter to TODAY ONLY
  const todayTransitions = transitions.filter(t => t.timestamp >= startOfToday)
  console.log(`[v0] Found ${todayTransitions.length} transitions today`)
  
  if (todayTransitions.length === 0) {
    return []
  }
  
  // Get latest token scores
  const tokens = ((await storage.get("solrad:latest")) as TokenScore[]) || []
  const tokenMap = new Map(tokens.map(t => [t.address, t]))
  
  // Match transitions to current token data
  const candidates: TodayWinner[] = []
  const seen = new Set<string>()
  
  for (const transition of todayTransitions) {
    // Skip if already processed
    if (seen.has(transition.mint)) continue
    seen.add(transition.mint)
    
    const token = tokenMap.get(transition.mint)
    if (!token) continue
    
    // STRICT FILTERS
    // Must have decent liquidity
    if (!token.liquidity || token.liquidity < 25000) continue
    
    // Must have positive score
    if (token.totalScore < 60) continue
    
    // Prefer positive price action
    if (token.priceChange24h && token.priceChange24h < -20) continue
    
    candidates.push({
      symbol: token.symbol,
      mint: token.address,
      score: token.totalScore,
      priceChange24h: token.priceChange24h || 0,
      signalStrength: transition.toState,
      liquidity: token.liquidity,
    })
  }
  
  // Sort by priority:
  // 1. Signal strength (STRONG > EARLY > CAUTION)
  // 2. Score
  // 3. Liquidity stability
  const signalOrder = { STRONG: 3, EARLY: 2, CAUTION: 1 }
  
  candidates.sort((a, b) => {
    // Signal strength first
    const strengthDiff = (signalOrder[b.signalStrength] || 0) - (signalOrder[a.signalStrength] || 0)
    if (strengthDiff !== 0) return strengthDiff
    
    // Then score
    const scoreDiff = b.score - a.score
    if (scoreDiff !== 0) return scoreDiff
    
    // Then liquidity
    return b.liquidity - a.liquidity
  })
  
  console.log(`[v0] Found ${candidates.length} qualified winners, returning top 5`)
  
  return candidates.slice(0, 5)
}

/**
 * Generate tweet text for top 5 winners
 */
export function generateWinnersTweet(winners: TodayWinner[]): string {
  if (winners.length === 0) {
    return "🏆 Top SOLRAD Performers Today\n\nNo clean winners yet today. Market still forming.\n\nLive tracking: solrad.io"
  }
  
  const lines = winners.map((w, i) => {
    const changeSymbol = w.priceChange24h > 0 ? "+" : ""
    return `${i + 1}. $${w.symbol} — ${w.score}/100 — ${changeSymbol}${w.priceChange24h.toFixed(1)}%`
  })
  
  return `🏆 Top ${winners.length} SOLRAD Performers Today\n\n${lines.join("\n")}\n\nTracked live on solrad.io`
}

/**
 * Generate Telegram section for winners
 */
export function generateWinnersTelegram(winners: TodayWinner[]): string {
  if (winners.length === 0) {
    return "**🏆 Top Performers Today:**\nNo clear winners yet. Market still forming."
  }
  
  const lines = winners.map((w, i) => {
    const changeSymbol = w.priceChange24h > 0 ? "+" : ""
    return `${i + 1}. **$${w.symbol}** (${w.score}/100) ${changeSymbol}${w.priceChange24h.toFixed(1)}% • ${w.signalStrength}`
  })
  
  return `**🏆 Top ${winners.length} Performers Today:**\n${lines.join("\n")}`
}
