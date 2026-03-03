/**
 * SOLRAD Intelligence Engine v1 - Volume Integrity & Wash Trading Detection
 * Conservative heuristics using existing on-chain data
 */

import type { TokenIntel } from "./types"
import type { TokenScore } from "@/lib/types"

interface IntegrityResult {
  washScore: number
  repeatTradeSizeRatio?: number
  cleanVolume24hUsd?: number
}

/**
 * Compute wash trading score (0-100) using conservative heuristics
 * Only uses data already available in the codebase
 */
export function computeWashScore(token: TokenIntel | TokenScore, raw?: any): IntegrityResult {
  let washScore = 0
  
  const liquidity = token.liquidityUsd ?? (token as TokenScore).liquidity ?? 0
  const volume24h = token.volume24hUsd ?? (token as TokenScore).volume24h ?? 0
  const fdv = token.marketCapUsd ?? (token as TokenScore).fdv ?? 0
  
  // Heuristic 1: Extremely high volume relative to liquidity (pump-and-dump pattern)
  if (liquidity > 0) {
    const volLiqRatio = volume24h / liquidity
    
    // Suspicious: Volume > 50x liquidity (likely artificial volume)
    if (volLiqRatio > 50) {
      washScore += 35
    } else if (volLiqRatio > 30) {
      washScore += 25
    } else if (volLiqRatio > 15) {
      washScore += 15
    }
    
    // Also suspicious: Volume < 0.05x liquidity (dead/manipulated)
    if (volLiqRatio < 0.05 && volume24h > 1000) {
      washScore += 10
    }
  }
  
  // Heuristic 2: Extremely high price change with low liquidity (rug risk)
  const change24h = token.change24hPct ?? (token as TokenScore).priceChange24h ?? 0
  
  if (liquidity < 50000 && Math.abs(change24h) > 100) {
    // >100% change on <$50k liquidity is suspicious
    washScore += 25
  } else if (liquidity < 25000 && Math.abs(change24h) > 50) {
    washScore += 15
  }
  
  // Heuristic 3: Massive FDV with tiny liquidity (honeypot pattern)
  if (liquidity > 0 && fdv > 0) {
    const fdvLiqRatio = fdv / liquidity
    
    if (fdvLiqRatio > 1000) {
      // FDV 1000x liquidity = major red flag
      washScore += 30
    } else if (fdvLiqRatio > 500) {
      washScore += 20
    } else if (fdvLiqRatio > 200) {
      washScore += 10
    }
  }
  
  // Heuristic 4: Check Helius data if available (insider risk)
  const heliusData = (token as TokenScore).heliusData
  if (heliusData) {
    // High holder concentration = insider manipulation risk
    if (heliusData.topHolderPercentage && heliusData.topHolderPercentage >= 50) {
      washScore += 20
    } else if (heliusData.topHolderPercentage && heliusData.topHolderPercentage >= 35) {
      washScore += 10
    }
    
    // Mint/freeze authorities still active = control risk
    if (heliusData.mintAuthority !== null || heliusData.freezeAuthority !== null) {
      washScore += 15
    }
  }
  
  // Cap at 100
  washScore = Math.min(100, washScore)
  
  // Estimate clean volume (conservative downgrade if wash score is high)
  let cleanVolume24hUsd = volume24h
  if (washScore >= 70) {
    // Heavily suspected - assume 70% is wash
    cleanVolume24hUsd = volume24h * 0.3
  } else if (washScore >= 50) {
    // Moderately suspected - assume 40% is wash
    cleanVolume24hUsd = volume24h * 0.6
  } else if (washScore >= 30) {
    // Slightly suspected - assume 20% is wash
    cleanVolume24hUsd = volume24h * 0.8
  }
  
  return {
    washScore,
    cleanVolume24hUsd,
  }
}
