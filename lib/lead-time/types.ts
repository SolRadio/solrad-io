/**
 * Lead-Time Proof Engine Types
 * 
 * Measures how many Solana blocks SOLRAD observed on-chain activity
 * BEFORE market reaction occurred.
 * 
 * Trust-First Language:
 * - "Observed on-chain behavior"
 * - NO "signals", "predictions", or "guarantees"
 * - Read-only, observational data only
 */

export interface ObservationEvent {
  mint: string
  blockNumber: number
  blockTimestamp: number
  observationType:
    | "accumulation_spike" // Sudden increase in holder accumulation velocity
    | "wallet_clustering" // Multiple wallets from same source accumulating
    | "liquidity_probe" // Small liquidity adds testing the pool
    | "signal_upgrade_EARLY_to_CAUTION" // Signal state upgraded from EARLY to CAUTION
    | "signal_upgrade_EARLY_to_STRONG" // Signal state upgraded from EARLY to STRONG
    | "signal_upgrade_CAUTION_to_STRONG" // Signal state upgraded from CAUTION to STRONG
    | string // Allow dynamic types like "score_jump_+15"
  confidence: "LOW" | "MEDIUM" | "HIGH"
  details: string // Human-readable explanation
}

export interface ReactionEvent {
  mint: string
  blockNumber: number
  blockTimestamp: number
  reactionType:
    | "volume_expansion" // 24h volume increased significantly
    | "liquidity_expansion" // Liquidity pool size increased
    | "dexscreener_visibility" // Token appeared on DexScreener trending
  magnitude: number // Multiplier or percentage change
  details: string
}

export interface LeadTimeProof {
  mint: string
  symbol: string
  name: string
  observationEvent: ObservationEvent
  reactionEvent: ReactionEvent
  leadBlocks: number // Number of blocks between observation and reaction
  leadSeconds: number // Time difference in seconds
  proofCreatedAt: number // When this proof was computed
  confidence: "LOW" | "MEDIUM" | "HIGH" // Overall confidence in the proof
  isPro: boolean // Whether this is a Pro-tier proof (real-time vs delayed)
}

export interface LeadTimeStats {
  mint: string
  totalProofs: number
  averageLeadBlocks: number
  averageLeadSeconds: number
  minLeadBlocks: number
  maxLeadBlocks: number
  lastProofAt: number
}

export interface PendingObservation {
  mint: string
  observedAt: number
  blockNumber: number
  observationType: string
  confidence: "LOW" | "MEDIUM" | "HIGH"
  baseline: {
    score: number
    volume24h: number
    liquidity: number
  }
}
