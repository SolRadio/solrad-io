export type SourceType = "dexscreener" | "helius" | "jupiter"

export interface TokenData {
  address: string // Canonical Solana mint (normalized, no "pump" suffix)
  dexTokenAddress?: string // Raw DexScreener token id (may end with "pump")
  symbol: string
  name: string
  chain: string
  priceUsd: number
  priceChange5m?: number
  priceChange1h?: number
  priceChange6h?: number
  priceChange24h: number
  volume24h: number
  liquidity: number
  marketCap?: number
  fdv?: number
  txns24h?: number
  pairCreatedAt?: number
  dexId?: string
  pairUrl?: string
  pairAddress?: string // PART A: Track pair address for direct refresh
  imageUrl?: string
  boostSources?: string[] // ["BOOST_TOP", "BOOST_LATEST"]
  boostAmount?: number
  boostTotalAmount?: number
  // PART A: Data freshness tracking
  source?: "dexscreener"
  sourceUpdatedAt?: number // Timestamp when data was fetched from source
  dataFetchedAt?: number // Timestamp when volatile data (price/vol/liq) was last fetched
}

export interface HeliusEnrichment {
  holderCount?: number
  topHolderPercentage?: number
  mintAuthority?: string | null
  freezeAuthority?: string | null
  tokenAge?: number
}

export interface SourceMetrics {
  source: SourceType
  rank?: number
  priceChange24h: number
  volume24h: number
  liquidity: number
  timestamp: number
}

export type RiskLabel = "LOW RISK" | "MEDIUM RISK" | "HIGH RISK"

// PART 3: Badge system
export type TokenBadge = {
  key: "RAD" | "GEM" | "TRASH" | "WARNING" | "HELD" | "SMART_FLOW" | "WASH"
  icon: string // emoji
  label: string
  detail?: string
}

export interface WashTradingInfo {
  suspected: boolean
  adjustedVolume24h?: number
  confidence?: "LOW" | "MEDIUM" | "HIGH"
  notes?: string
}

export interface TokenScore {
  address: string // Canonical Solana mint (normalized, no "pump" suffix)
  dexTokenAddress?: string // Raw DexScreener token id (may end with "pump")
  symbol: string
  name: string
  chain: string
  trendingRank: number // Rank from DexScreener order
  totalScore: number
  riskLabel: RiskLabel
  priceUsd: number
  priceChange5m?: number
  priceChange1h?: number
  priceChange6h?: number
  priceChange24h: number
  volume24h: number
  liquidity: number
  marketCap?: number
  fdv?: number
  txns24h?: number
  holders?: number
  imageUrl?: string
  dexId?: string
  pairUrl?: string
  boostSources?: string[]
  boostAmount?: number
  heliusData?: HeliusEnrichment
  aiExplanation?: string
  pairCreatedAt?: number // Timestamp when pair was created
  tokenAgeHours?: number // Computed age in hours
  sources?: SourceMetrics[] // Multi-source data tracking
  scoreBreakdown: {
    liquidityScore: number
    volumeScore: number
    activityScore: number
    ageScore: number
    healthScore: number
    boostScore: number // New: boost presence score
  }
  lastUpdated: number
  isPinned?: boolean
  tag?: string
  // PART 3: Badge + Intel fields
  badges?: TokenBadge[]
  whyFlagged?: string
  scoreDebug?: string
  tokenInsight?: string
  washTrading?: WashTradingInfo
  // PART A: Data freshness tracking
  source?: "dexscreener"
  sourceUpdatedAt?: number
  dataFetchedAt?: number // Timestamp when volatile data (price/vol/liq) was last fetched
  pairAddress?: string
  // PART D: Canonical dexUrl for consistent Dex links
  dexUrl?: string
  // Fresh Signals: why this token was flagged (max 3 reasons)
  signalReasons?: string[]
  // Signal State Engine: computed signal state
  signalState?: "EARLY" | "CAUTION" | "STRONG"
  signalStateUpdatedAt?: number
  // Phase C1: Signal Clarity - derived rationale (UI-only, not persisted)
  _rationale?: string
  // Lead-Time Proof: observed on-chain behavior before market reaction (UI-only)
  _leadTimeBlocks?: number
  _leadTimeConfidence?: "LOW" | "MEDIUM" | "HIGH"
}

export interface ScoringWeights {
  sourceCount: number
  volume: number
  liquidity: number
  priceChange: number
  recency: number
}

export interface CachedTokenData {
  updatedAt: number
  tokens: TokenScore[]
  sourceMeta?: SourceMeta // Added source metadata
}

export interface SourceMeta {
  totalTokens: number
  dexscreenerCount: number
  jupiterCount: number // Added Jupiter count to source metadata
  heliusEnriched: number
  errors: string[]
}

export interface TokenSnapshot {
  mint: string
  symbol: string
  name: string
  score: number
  label: RiskLabel
  volume24h: number
  liquidity: number
  rank: number
  imageUrl?: string
}

export interface DailySnapshot {
  ts: number
  tokens: TokenSnapshot[]
}

export interface TrackerMetrics {
  mint: string
  symbol: string
  name: string
  imageUrl?: string
  appearances: number
  consistency: number
  scoreDelta: number
  latestScore: number
  latestLabel: RiskLabel
  latestRank: number
  firstSeen: number
  lastSeen: number
}

export interface TimeSeriesPoint {
  t: number // timestamp
  score: number
  priceUsd: number
  liquidityUsd: number
  volume24h: number
  sources: string[] // boost sources at this time
}

export interface TokenTimeSeries {
  mint: string
  points: TimeSeriesPoint[]
}

// ==========================================
// MASTERPIECE SCORING SYSTEM TYPES
// ==========================================

export interface TokenSnapshot {
  id: string
  createdAt: number
  mint: string
  symbol: string
  name: string
  price: number
  liquidityUsd: number
  volume24hUsd: number
  priceChange24h: number
  riskLabel: RiskLabel
  solradScore: number
  signalScore: number | null
  gemScore: number | null
  activityRatio: number | null
  tokenAgeHours: number | null
}

export interface SnapshotSummary {
  mint: string
  symbol: string
  latestSnapshot: TokenSnapshot
  price6hAgo: number | null
  price24hAgo: number | null
  return6h: number | null
  return24h: number | null
  solradScore: number
  signalScore: number | null
  gemScore: number | null
}

// ==========================================
// PERSISTENT TOKEN ARCHIVE
// ==========================================

export interface ArchivedToken {
  address: string
  symbol: string
  name: string
  lastScore: number
  maxScore: number
  lastSeenAt: number
  firstSeenAt: number
  // Last known metrics
  priceUsd?: number
  volume24h?: number
  liquidity?: number
  priceChange24h?: number
  riskLabel?: RiskLabel
  imageUrl?: string
  dexUrl?: string
}
