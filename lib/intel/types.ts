/**
 * SOLRAD Intelligence Engine v1 - Core Types
 * Normalized token representation with badges, integrity scores, and explanations
 */

export type TokenIntel = {
  mint: string
  symbol: string
  name: string
  image?: string
  // PART A: Canonical pair tracking
  pairAddress?: string // canonical pair used for pricing
  dexUrl?: string // built from pairAddress - clicking "Dex" uses this
  priceUsd?: number
  change24hPct?: number
  change5mPct?: number
  change1hPct?: number
  change6hPct?: number
  volume24hUsd?: number
  liquidityUsd?: number
  marketCapUsd?: number
  txns24h?: number
  pairCreatedAt?: number // unix ms if available
  firstSeenAt?: number // when SOLRAD first indexed it (unix ms)
  score: number
  riskLabel: "LOW" | "MEDIUM" | "HIGH"
  badges: {
    rad?: boolean // Top tier, high score, solid metrics
    gem?: boolean // Early opportunity with strong fundamentals
    trash?: boolean // Red flags detected
    held24h?: boolean // Persisted in top listings for 24+ hours
    smartFlow?: boolean // Healthy volume/liquidity ratio
    liquidityRotation?: boolean // Unusual liquidity patterns
    insiderRiskHigh?: boolean // Concerning holder concentration
    washVolume?: boolean // Suspected wash trading activity
  }
  explain: {
    whyFlagged: string // Why SOLRAD highlighted this token
    scoreDebug: string[] // Breakdown of score components
    tokenInsight: string[] // Additional context and insights
  }
  integrity: {
    washScore: number // 0 clean → 100 very suspicious
    repeatTradeSizeRatio?: number
    uniqueBuyers10m?: number
    uniqueSellers10m?: number
    cleanVolume24hUsd?: number
  }
  signalReasons?: string[] // Fresh Signals: why this token was flagged (max 3)
}

export interface TokenIndexCache {
  tokens: TokenIntel[]
  generatedAt: number
  version: "v1"
}

// Intel Report Types (shared between client and server)
export interface IntelCandidate {
  symbol: string
  mint: string
  score: number
  priceChange24h: number
  liquidity: number
  volume24h: number
  volumeChange24h?: number
  reasonTags: string[]
}

export interface IntelReport {
  generatedAt: number
  date: string
  signals: {
    topCandidates: number
    rotationProxies: number
    avgScore: number
  }
  tweetDrafts: string[]
  tweetTrendingTop10: string
  telegramPacket: string
  candidates: IntelCandidate[]
  aiVoiceUsed?: boolean
  newsIncluded?: boolean
  winnersIncluded?: boolean
}
