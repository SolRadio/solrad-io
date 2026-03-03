/**
 * Lead-Time Proof Storage
 * 
 * Persists lead-time proofs in KV storage.
 * Key format: solrad:leadtime:{mint}
 */

import { storage } from "@/lib/storage"
import type { LeadTimeProof, LeadTimeStats, ObservationEvent, ReactionEvent, PendingObservation } from "./types"
import { logger } from "@/lib/logger"
import { normalizeMint } from "./normalize-mint"

const LEAD_TIME_PREFIX = "solrad:leadtime:"
const LEAD_TIME_STATS_PREFIX = "solrad:leadtime:stats:"
const LEAD_TIME_RECENT_KEY = "solrad:leadtime:recent"
const OBSERVATION_PREFIX = "solrad:leadtime:obs:"
const MINIMUM_LEAD_BLOCKS = 0 // Minimum blocks to qualify as valid proof (0 for v1 since blocks are optional)
const MINIMUM_LEAD_SECONDS = 0 // Accept all proofs in v1 (block-level precision not yet available)

/**
 * Check if user is Pro (stub using env flag for now)
 */
export function isPro(): boolean {
  return process.env.SOLRAD_PRO_MODE === "1"
}

/**
 * Create a lead-time proof from observation and reaction events
 */
export function createLeadTimeProof(
  observation: ObservationEvent,
  reaction: ReactionEvent,
  tokenMeta: { symbol: string; name: string },
  isPro: boolean = false
): LeadTimeProof | null {
  const leadBlocks = reaction.blockNumber - observation.blockNumber
  const leadSeconds = Math.floor((reaction.blockTimestamp - observation.blockTimestamp) / 1000)

  // Enforce minimum lead-time requirement (seconds, since blocks are optional in v1)
  if (leadSeconds < MINIMUM_LEAD_SECONDS) {
    logger.log(
      `[lead-time] Proof rejected: ${tokenMeta.symbol} only ${leadSeconds}s (min ${MINIMUM_LEAD_SECONDS}s)`
    )
    return null
  }

  // Compute overall confidence based on observation confidence and lead-time magnitude
  let confidence: "LOW" | "MEDIUM" | "HIGH" = observation.confidence
  
  // Boost confidence for longer lead times
  if (leadSeconds >= 1800) confidence = "HIGH" // 30+ minutes
  else if (leadSeconds >= 900 && observation.confidence !== "LOW") confidence = "HIGH" // 15+ minutes
  else if (leadSeconds >= 300) confidence = "MEDIUM" // 5+ minutes

  return {
    mint: observation.mint,
    symbol: tokenMeta.symbol,
    name: tokenMeta.name,
    observationEvent: observation,
    reactionEvent: reaction,
    leadBlocks,
    leadSeconds,
    proofCreatedAt: Date.now(),
    confidence,
    isPro,
  }
}

/**
 * Save lead-time proof to KV storage
 */
export async function saveLeadTimeProof(proof: LeadTimeProof): Promise<void> {
  try {
    const normalizedMint = normalizeMint(proof.mint)
    if (!normalizedMint) {
      logger.error(`[lead-time] Invalid mint for proof:`, proof.mint)
      return
    }
    
    const key = `${LEAD_TIME_PREFIX}${normalizedMint}`
    
    // Get existing proofs for this mint
    const existing = (await storage.get(key)) as LeadTimeProof[] | null
    const proofs = existing ? [...existing, proof] : [proof]

    // Keep only last 50 proofs per token
    if (proofs.length > 50) {
      proofs.splice(0, proofs.length - 50)
    }

    await storage.set(key, proofs, { ex: 60 * 60 * 24 * 30 }) // 30 days TTL
    
    // Update stats
    await updateLeadTimeStats(proof.mint, proofs)
  } catch (error) {
    logger.error(`[v0] Failed to save lead-time proof:`, error)
  }
}

/**
 * Get lead-time proofs for a specific mint
 */
export async function getLeadTimeProofs(mint: string): Promise<LeadTimeProof[]> {
  try {
    const normalizedMint = normalizeMint(mint)
    if (!normalizedMint) {
      logger.error(`[lead-time] Invalid mint for getLeadTimeProofs:`, mint)
      return []
    }
    
    const key = `${LEAD_TIME_PREFIX}${normalizedMint}`
    const proofs = (await storage.get(key)) as LeadTimeProof[] | null
    return proofs ?? []
  } catch (error) {
    logger.error(`[v0] Failed to get lead-time proofs for ${mint}:`, error)
    return []
  }
}

/**
 * Get lead-time stats for a mint
 */
export async function getLeadTimeStats(mint: string): Promise<LeadTimeStats | null> {
  try {
    const normalizedMint = normalizeMint(mint)
    if (!normalizedMint) {
      logger.error(`[lead-time] Invalid mint for getLeadTimeStats:`, mint)
      return null
    }
    
    const key = `${LEAD_TIME_STATS_PREFIX}${normalizedMint}`
    const stats = (await storage.get(key)) as LeadTimeStats | null
    return stats
  } catch (error) {
    logger.error(`[v0] Failed to get lead-time stats for ${mint}:`, error)
    return null
  }
}

/**
 * Update lead-time stats for a mint
 */
async function updateLeadTimeStats(mint: string, proofs: LeadTimeProof[]): Promise<void> {
  if (proofs.length === 0) return
  
  const normalizedMint = normalizeMint(mint)
  if (!normalizedMint) return

  const totalLeadBlocks = proofs.reduce((sum, p) => sum + p.leadBlocks, 0)
  const totalLeadSeconds = proofs.reduce((sum, p) => sum + p.leadSeconds, 0)
  const leadBlocks = proofs.map((p) => p.leadBlocks)

  const stats: LeadTimeStats = {
    mint: normalizedMint,
    totalProofs: proofs.length,
    averageLeadBlocks: Math.round(totalLeadBlocks / proofs.length),
    averageLeadSeconds: Math.round(totalLeadSeconds / proofs.length),
    minLeadBlocks: Math.min(...leadBlocks),
    maxLeadBlocks: Math.max(...leadBlocks),
    lastProofAt: proofs[proofs.length - 1].proofCreatedAt,
  }

  const key = `${LEAD_TIME_STATS_PREFIX}${normalizedMint}`
  await storage.set(key, stats, { ex: 60 * 60 * 24 * 30 }) // 30 days TTL
}

/**
 * Get latest lead-time proof for a mint (for badge display)
 */
export async function getLatestLeadTimeProof(mint: string): Promise<LeadTimeProof | null> {
  const proofs = await getLeadTimeProofs(mint)
  return proofs.length > 0 ? proofs[proofs.length - 1] : null
}

/**
 * Add a proof to the recent proofs list
 */
export async function addToRecentProofs(proof: LeadTimeProof): Promise<void> {
  try {
    const existing = (await storage.get(LEAD_TIME_RECENT_KEY)) as LeadTimeProof[] | null
    const recentProofs = existing || []
    
    // Add new proof to the beginning
    recentProofs.unshift(proof)
    
    // Keep only last 50 proofs
    if (recentProofs.length > 50) {
      recentProofs.splice(50)
    }
    
    // Save with 7 day TTL
    await storage.set(LEAD_TIME_RECENT_KEY, recentProofs, { ex: 60 * 60 * 24 * 7 })
  } catch (error) {
    logger.error("[lead-time] Failed to add to recent proofs:", error)
  }
}

/**
 * Get all recent lead-time proofs across all tokens (for /lead-time-proof page)
 */
export async function getRecentLeadTimeProofs(limit: number = 20): Promise<LeadTimeProof[]> {
  try {
    const proofs = (await storage.get(LEAD_TIME_RECENT_KEY)) as LeadTimeProof[] | null
    if (!proofs) return []
    
    // Filter out MVP_FALLBACK entries — only show real proofs
    const realProofs = proofs.filter(
      (p) => !(p as any)._mvpFallback && p.observationEvent?.observationType !== "MVP_FALLBACK"
    )
    
    return realProofs.slice(0, limit)
  } catch (error) {
    logger.error("[lead-time] Failed to get recent proofs:", error)
    return []
  }
}

/**
 * Get pending observation for a mint (Pro feature)
 */
export async function getPendingObservation(mint: string): Promise<PendingObservation | null> {
  try {
    const normalizedMint = normalizeMint(mint)
    if (!normalizedMint) {
      logger.error(`[lead-time] Invalid mint for getPendingObservation:`, mint)
      return null
    }
    
    const key = `${OBSERVATION_PREFIX}${normalizedMint}`
    const observation = (await storage.get(key)) as PendingObservation | null
    return observation
  } catch (error) {
    logger.error("[lead-time] Failed to get pending observation:", error)
    return null
  }
}
