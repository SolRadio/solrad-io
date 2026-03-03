/**
 * Lead-Time Observation Detector
 * 
 * Detects early on-chain signals that precede market reactions.
 * Uses QuickNode RPC/WebSocket to monitor transaction patterns.
 * 
 * STRICT RULES:
 * - Read-only observations only
 * - No predictions or guarantees
 * - Minimum 10 blocks lead time to qualify as proof
 */

import type { TokenScore } from "@/lib/types"
import type { ObservationEvent, ReactionEvent } from "./types"
import { logger } from "@/lib/logger"

/**
 * Detect accumulation velocity spikes
 * Looks for rapid increases in holder count or transaction frequency
 */
export function detectAccumulationSpike(
  token: TokenScore,
  previousSnapshot?: TokenScore
): ObservationEvent | null {
  if (!previousSnapshot) return null

  const holderIncrease = (token.holders ?? 0) - (previousSnapshot.holders ?? 0)
  const timeWindowHours = (token.lastUpdated - previousSnapshot.lastUpdated) / (1000 * 60 * 60)

  // Significant holder increase in short time window
  if (holderIncrease >= 50 && timeWindowHours <= 1) {
    return {
      mint: token.address,
      blockNumber: 0, // Will be populated by block monitor
      blockTimestamp: Date.now(),
      observationType: "accumulation_spike",
      confidence: holderIncrease >= 100 ? "HIGH" : holderIncrease >= 75 ? "MEDIUM" : "LOW",
      details: `+${holderIncrease} holders in ${timeWindowHours.toFixed(1)}h`,
    }
  }

  return null
}

/**
 * Detect wallet clustering patterns
 * Identifies multiple wallets from same source accumulating the token
 * 
 * NOTE: Requires transaction history analysis - placeholder for now
 */
export function detectWalletClustering(
  token: TokenScore
): ObservationEvent | null {
  // Placeholder: Would require analyzing transaction patterns
  // to detect wallets funded from same source
  return null
}

/**
 * Detect liquidity probe patterns
 * Small liquidity adds that test pool depth before larger moves
 */
export function detectLiquidityProbe(
  token: TokenScore,
  previousSnapshot?: TokenScore
): ObservationEvent | null {
  if (!previousSnapshot) return null

  const liquidityChange = (token.liquidity ?? 0) - (previousSnapshot.liquidity ?? 0)
  const liquidityChangePercent = (liquidityChange / (previousSnapshot.liquidity ?? 1)) * 100

  // Small liquidity increase (1-10%) could be a probe
  if (
    liquidityChange > 0 &&
    liquidityChange < 50000 && // Less than $50k
    liquidityChangePercent >= 1 &&
    liquidityChangePercent <= 10
  ) {
    return {
      mint: token.address,
      blockNumber: 0,
      blockTimestamp: Date.now(),
      observationType: "liquidity_probe",
      confidence: liquidityChangePercent >= 5 ? "MEDIUM" : "LOW",
      details: `+$${(liquidityChange / 1000).toFixed(1)}k liquidity (+${liquidityChangePercent.toFixed(1)}%)`,
    }
  }

  return null
}

/**
 * Detect reaction events - market moves after observation
 */
export function detectVolumeExpansion(
  token: TokenScore,
  previousSnapshot?: TokenScore
): ReactionEvent | null {
  if (!previousSnapshot) return null

  const volumeChange = (token.volume24h ?? 0) - (previousSnapshot.volume24h ?? 0)
  const volumeMultiplier = (token.volume24h ?? 0) / (previousSnapshot.volume24h ?? 1)

  // Significant volume increase (2x+ or $500k+)
  if (volumeMultiplier >= 2 || volumeChange >= 500000) {
    return {
      mint: token.address,
      blockNumber: 0,
      blockTimestamp: Date.now(),
      reactionType: "volume_expansion",
      magnitude: volumeMultiplier,
      details: `Volume ${volumeMultiplier.toFixed(1)}x ($${(volumeChange / 1000000).toFixed(2)}M increase)`,
    }
  }

  return null
}

export function detectLiquidityExpansion(
  token: TokenScore,
  previousSnapshot?: TokenScore
): ReactionEvent | null {
  if (!previousSnapshot) return null

  const liquidityChange = (token.liquidity ?? 0) - (previousSnapshot.liquidity ?? 0)
  const liquidityMultiplier = (token.liquidity ?? 0) / (previousSnapshot.liquidity ?? 1)

  // Significant liquidity increase (1.5x+ or $100k+)
  if (liquidityMultiplier >= 1.5 || liquidityChange >= 100000) {
    return {
      mint: token.address,
      blockNumber: 0,
      blockTimestamp: Date.now(),
      reactionType: "liquidity_expansion",
      magnitude: liquidityMultiplier,
      details: `Liquidity ${liquidityMultiplier.toFixed(1)}x ($${(liquidityChange / 1000000).toFixed(2)}M increase)`,
    }
  }

  return null
}

export function detectDexScreenerVisibility(
  token: TokenScore,
  previousSnapshot?: TokenScore
): ReactionEvent | null {
  // Token newly appeared on DexScreener (has source now but didn't before)
  const hasDexSource = token.sources?.some((s) => s.source === "dexscreener")
  const hadDexSource = previousSnapshot?.sources?.some((s) => s.source === "dexscreener")

  if (hasDexSource && !hadDexSource) {
    return {
      mint: token.address,
      blockNumber: 0,
      blockTimestamp: Date.now(),
      reactionType: "dexscreener_visibility",
      magnitude: 1,
      details: "Token appeared on DexScreener",
    }
  }

  return null
}

/**
 * Main detector: Checks for all observation and reaction patterns
 */
export function detectLeadTimeEvents(
  currentToken: TokenScore,
  previousSnapshot?: TokenScore
): {
  observations: ObservationEvent[]
  reactions: ReactionEvent[]
} {
  const observations: ObservationEvent[] = []
  const reactions: ReactionEvent[] = []

  // Detect observation events
  const accumulationSpike = detectAccumulationSpike(currentToken, previousSnapshot)
  if (accumulationSpike) observations.push(accumulationSpike)

  const liquidityProbe = detectLiquidityProbe(currentToken, previousSnapshot)
  if (liquidityProbe) observations.push(liquidityProbe)

  // Detect reaction events
  const volumeExpansion = detectVolumeExpansion(currentToken, previousSnapshot)
  if (volumeExpansion) reactions.push(volumeExpansion)

  const liquidityExpansion = detectLiquidityExpansion(currentToken, previousSnapshot)
  if (liquidityExpansion) reactions.push(liquidityExpansion)

  const dexVisibility = detectDexScreenerVisibility(currentToken, previousSnapshot)
  if (dexVisibility) reactions.push(dexVisibility)

  if (observations.length > 0 || reactions.length > 0) {
    logger.log(
      `[v0] Lead-time detector: ${currentToken.symbol} - ${observations.length} observations, ${reactions.length} reactions`
    )
  }

  return { observations, reactions }
}
