/**
 * Convert TokenIntel to TokenScore for compatibility with existing UI components
 * Maps badges properly and includes wash trading + tooltip content
 */

import type { TokenIntel } from "./types"
import type { TokenScore, TokenBadge, RiskLabel, WashTradingInfo } from "@/lib/types"
import { normalizeMint } from "@/lib/solana/normalizeMint"

// Score calculation helpers (matching lib/scoring.ts logic)
function calculateLiquidityScore(liquidity: number): number {
  if (liquidity < 1000) return 0
  if (liquidity < 10000) return 20
  if (liquidity < 50000) return 40
  if (liquidity < 100000) return 60
  if (liquidity < 500000) return 80
  return 100
}

function calculateVolumeScore(volume: number): number {
  if (volume < 1000) return 0
  if (volume < 10000) return 20
  if (volume < 100000) return 40
  if (volume < 500000) return 60
  if (volume < 2000000) return 80
  return 100
}

function calculateActivityScore(volume: number, liquidity: number, txns?: number): number {
  if (liquidity === 0) return 0
  
  const volLiqRatio = volume / liquidity
  let score = 0
  
  if (volLiqRatio >= 0.5 && volLiqRatio <= 3.0) {
    score += 50
  } else if (volLiqRatio > 0.1 && volLiqRatio < 10) {
    score += 25
  }
  
  if (txns) {
    if (txns > 1000) score += 50
    else if (txns > 500) score += 30
    else if (txns > 100) score += 15
  } else {
    score += 25
  }
  
  return Math.min(100, score)
}

function calculateAgeScore(pairCreatedAt?: number): number {
  if (!pairCreatedAt) return 50
  
  const ageHours = (Date.now() - pairCreatedAt) / (1000 * 60 * 60)
  
  if (ageHours < 1) return 0
  if (ageHours < 6) return 30
  if (ageHours < 24) return 60
  if (ageHours < 168) return 80
  return 100
}

function calculateHealthScore(fdv?: number, liquidity?: number): number {
  let score = 50
  
  if (fdv && liquidity && liquidity > 0) {
    const fdvLiqRatio = fdv / liquidity
    if (fdvLiqRatio < 10) score += 25
    else if (fdvLiqRatio < 50) score += 15
    else if (fdvLiqRatio > 500) score -= 25
  }
  
  return Math.max(0, Math.min(100, score))
}

// Badge definitions with icons and labels
export const BADGE_DEFINITIONS: Record<string, { icon: string; label: string; detail: string }> = {
  RAD: { icon: "🤘", label: "RAD", detail: "Top tier with solid metrics and strong fundamentals" },
  GEM: { icon: "💎", label: "GEM", detail: "Early opportunity with strong fundamentals" },
  TRASH: { icon: "⚠️", label: "WARNING", detail: "Elevated risk signals detected — caution advised" },
  WARNING: { icon: "⚠️", label: "WARNING", detail: "Elevated risk signals detected — caution advised" },
  HELD: { icon: "🕛", label: "HELD", detail: "Persisted in top listings for 24+ hours" },
  SMART_FLOW: { icon: "⚡", label: "SMART FLOW", detail: "Healthy volume/liquidity ratio (0.8-2.5x)" },
  WASH: { icon: "🚿", label: "WASH", detail: "Suspected wash trading activity detected" },
}

export function convertIntelToScore(intel: TokenIntel): TokenScore {
  // Map risk label format
  const riskLabel: RiskLabel = intel.riskLabel === "LOW" ? "LOW RISK" : intel.riskLabel === "MEDIUM" ? "MEDIUM RISK" : "HIGH RISK"
  
  // Build badges array from Intel flags
  const badges: TokenBadge[] = []
  if (intel.badges) {
    if (intel.badges.rad) badges.push({ key: "RAD", ...BADGE_DEFINITIONS.RAD })
    if (intel.badges.gem) badges.push({ key: "GEM", ...BADGE_DEFINITIONS.GEM })
    if (intel.badges.trash || intel.badges.insiderRiskHigh) badges.push({ key: "TRASH", ...BADGE_DEFINITIONS.TRASH })
    if (intel.badges.held24h) badges.push({ key: "HELD", ...BADGE_DEFINITIONS.HELD })
    if (intel.badges.smartFlow) badges.push({ key: "SMART_FLOW", ...BADGE_DEFINITIONS.SMART_FLOW })
    if (intel.badges.washVolume) badges.push({ key: "WASH", ...BADGE_DEFINITIONS.WASH })
  }
  
  // Derive badges from score/risk if intel badges not present
  if (badges.length === 0) {
    if (intel.score >= 80 && riskLabel === "LOW RISK") {
      badges.push({ key: "RAD", ...BADGE_DEFINITIONS.RAD })
    } else if (riskLabel === "HIGH RISK" || (intel.integrity?.washScore ?? 0) > 60) {
      badges.push({ key: "TRASH", ...BADGE_DEFINITIONS.TRASH })
    }
    // Check for smart flow
    const vol = intel.volume24hUsd ?? 0
    const liq = intel.liquidityUsd ?? 1
    const ratio = vol / liq
    if (ratio >= 0.8 && ratio <= 2.5 && vol >= 50000) {
      badges.push({ key: "SMART_FLOW", ...BADGE_DEFINITIONS.SMART_FLOW })
    }
  }
  
  // Build wash trading info
  const washTrading: WashTradingInfo | undefined = intel.integrity?.washScore !== undefined ? {
    suspected: (intel.integrity.washScore ?? 0) > 40,
    adjustedVolume24h: intel.integrity.cleanVolume24hUsd,
    confidence: (intel.integrity.washScore ?? 0) > 70 ? "HIGH" : (intel.integrity.washScore ?? 0) > 40 ? "MEDIUM" : "LOW",
    notes: (intel.integrity.washScore ?? 0) > 40 
      ? "SOLRAD reduces volume weight when trades look patterned (same sizes, repeated wallets, circular flow)."
      : undefined,
  } : undefined
  
  // Create TokenScore compatible object
  return {
    address: intel.mint,
    symbol: intel.symbol,
    name: intel.name,
    chain: "solana",
    trendingRank: 0,
    totalScore: intel.score,
    riskLabel,
    priceUsd: intel.priceUsd ?? 0,
    priceChange5m: intel.change5mPct,
    priceChange1h: intel.change1hPct,
    priceChange6h: intel.change6hPct,
    priceChange24h: intel.change24hPct ?? 0,
    volume24h: intel.volume24hUsd ?? 0,
    liquidity: intel.liquidityUsd ?? 0,
    marketCap: intel.marketCapUsd,
    fdv: intel.marketCapUsd,
    txns24h: intel.txns24h,
    holders: undefined,
    imageUrl: intel.image,
    dexId: undefined,
    pairUrl: undefined,
    boostSources: undefined,
    boostAmount: undefined,
    heliusData: undefined,
    aiExplanation: intel.explain?.whyFlagged ?? "",
    pairCreatedAt: intel.pairCreatedAt,
    tokenAgeHours: intel.pairCreatedAt ? (Date.now() - intel.pairCreatedAt) / (1000 * 60 * 60) : undefined,
    scoreBreakdown: intel.scoreBreakdown ?? {
      liquidityScore: calculateLiquidityScore(intel.liquidityUsd ?? 0),
      volumeScore: calculateVolumeScore(intel.volume24hUsd ?? 0),
      activityScore: calculateActivityScore(intel.volume24hUsd ?? 0, intel.liquidityUsd ?? 0, intel.txns24h),
      ageScore: calculateAgeScore(intel.pairCreatedAt),
      healthScore: calculateHealthScore(intel.marketCapUsd, intel.liquidityUsd),
      boostScore: 0, // Intel doesn't have boost data
    },
    lastUpdated: Date.now(),
    // PART 3: Mapped badge + intel fields
    badges,
    whyFlagged: intel.explain?.whyFlagged ?? "",
    scoreDebug: intel.explain?.scoreDebug?.join(" | ") ?? "",
    tokenInsight: intel.explain?.tokenInsight?.join(" | ") ?? "",
    washTrading,
    // PART A: Data freshness tracking (passed through from Intel)
    source: (intel as any).source ?? "dexscreener",
    sourceUpdatedAt: (intel as any).sourceUpdatedAt ?? Date.now(),
    pairAddress: intel.pairAddress,
    // PART D: Canonical dexUrl for consistent Dex links
    dexUrl: intel.dexUrl,
    // Fresh Signals: pass through signalReasons
    signalReasons: intel.signalReasons,
  } as TokenScore
}

/**
 * Generate share text for X (Twitter) post - PART 6
 */
export function generateShareText(token: TokenScore): string {
  // Build badge string from token.badges array
  const badgeEmojis = (token.badges ?? [])
    .filter(b => b.key !== "TRASH" && b.key !== "WARNING" && b.key !== "WASH") // Don't include negative badges in share
    .map(b => b.icon)
    .slice(0, 3)
  
  const vol = token.volume24h >= 1000000 
    ? `$${(token.volume24h / 1000000).toFixed(1)}M` 
    : `$${(token.volume24h / 1000).toFixed(0)}k`
  
  const liq = token.liquidity >= 1000000 
    ? `$${(token.liquidity / 1000000).toFixed(1)}M` 
    : `$${(token.liquidity / 1000).toFixed(0)}k`
  
  const change = token.priceChange24h >= 0 ? `+${token.priceChange24h.toFixed(1)}%` : `${token.priceChange24h.toFixed(1)}%`
  const riskShort = token.riskLabel.replace(" RISK", "")
  const why = token.whyFlagged ?? ""
  const whyShort = why.length > 80 ? why.slice(0, 80) + "..." : why
  
  // Normalize mint address to handle pump.fun suffixes
  const normalizedMint = normalizeMint(token.address)
  const shareUrl = normalizedMint ? `https://www.solrad.io/token/${normalizedMint}` : "https://www.solrad.io/"
  
  return `${badgeEmojis.length > 0 ? badgeEmojis.join("") + " " : ""}SOLRAD Intel: $${token.symbol} (${token.name})
Score: ${token.totalScore}/100 | Risk: ${riskShort}
Vol24h: ${vol} | Liq: ${liq} | 24h: ${change}${whyShort ? `\nWhy: ${whyShort}` : ""}

${shareUrl}`
}
