/**
 * Lead-Time Proof Writer v1
 * 
 * Generates real lead-time proofs from existing ingestion data.
 * Called after scoring + signal state computation, before cache write.
 * 
 * OBSERVATION RULE:
 * - scoreJump >= +3 in last 60m OR signal state upgrade (EARLY->CAUTION, CAUTION->STRONG, CAUTION->EARLY recovery)
 * - AND confidence >= 40
 * - No duplicate observation within last 4 hours
 * 
 * REACTION RULE:
 * - After observation: volume24h >= +15% OR liquidity >= +10% within 4h
 * - Compute leadSeconds (leadBlocks optional in v1)
 */

import type { TokenScore } from "@/lib/types"
import type { SignalState } from "@/lib/signal-state"
import type { ObservationEvent, ReactionEvent } from "./types"
import { getTimeSeriesForToken } from "@/lib/time-series"
import { getSignalState } from "@/lib/signal-state"
import { saveLeadTimeProof, createLeadTimeProof, addToRecentProofs } from "./storage"
import { storage } from "@/lib/storage"
import { logger } from "@/lib/logger"
import { normalizeMint } from "./normalize-mint"

// Observation tracking key format
const OBSERVATION_KEY = (mint: string) => `solrad:leadtime:observation:${normalizeMint(mint)}`
const OBSERVATION_TTL = 60 * 60 * 4 // 4 hours

interface PendingObservation {
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

/**
 * Check if a significant score jump occurred in last 60 minutes
 */
async function detectScoreJump(token: TokenScore): Promise<number> {
  const ts = await getTimeSeriesForToken(token.address)
  if (!ts || ts.points.length < 2) return 0

  const now = Date.now()
  const oneHourAgo = now - 60 * 60 * 1000

  // Find earliest point in the 60m window
  const historicalPoints = ts.points.filter((p) => p.t >= oneHourAgo && p.t <= now)
  if (historicalPoints.length < 2) return 0

  // Compare oldest point in window to current score
  const oldestScore = historicalPoints[0].score
  const currentScore = token.totalScore

  return currentScore - oldestScore
}

/**
 * Check if signal state upgraded
 */
async function detectSignalUpgrade(
  token: TokenScore,
  currentState: SignalState
): Promise<{ upgraded: boolean; fromState: SignalState | null }> {
  const prevData = await getSignalState(token.address)
  if (!prevData) return { upgraded: false, fromState: null }

  const prevState = prevData.state
  const upgrades: Record<SignalState, SignalState[]> = {
    EARLY: ["CAUTION", "STRONG"],
    CAUTION: ["STRONG", "EARLY"], // CAUTION->EARLY = recovery signal (was struggling, now climbing)
    STRONG: [],
  }

  const isUpgrade = upgrades[prevState]?.includes(currentState)
  return { upgraded: isUpgrade, fromState: prevState }
}

/**
 * Process tokens and generate observations
 * Called during ingestion after scoring is complete
 */
export async function processLeadTimeObservations(
  tokens: TokenScore[],
  signalStates: Map<string, { state: SignalState; confidence: number }>
): Promise<void> {
  const now = Date.now()

  for (const token of tokens) {
    try {
      const mint = normalizeMint(token.address)
      if (!mint) continue // Skip invalid mints
      
      const stateData = signalStates.get(token.address)
      if (!stateData) continue

      const { state: currentState, confidence } = stateData

      // Skip if confidence too low
      if (confidence < 40) continue

      // Check for existing observation within last 6 hours
      const existingObs = (await storage.get(OBSERVATION_KEY(mint))) as PendingObservation | null
      if (existingObs) continue

      // Detect score jump
      const scoreJump = await detectScoreJump(token)

      // Detect signal upgrade
      const { upgraded, fromState } = await detectSignalUpgrade(token, currentState)

      // Create observation if conditions met
      if (scoreJump >= 3 || upgraded) {
        const observationType = upgraded
          ? `signal_upgrade_${fromState}_to_${currentState}`
          : `score_jump_+${Math.round(scoreJump)}`

        const observationConfidence: "LOW" | "MEDIUM" | "HIGH" =
          confidence >= 80 ? "HIGH" : confidence >= 65 ? "MEDIUM" : "LOW"

        const observation: PendingObservation = {
          mint,
          observedAt: now,
          blockNumber: 0, // Block number optional in v1
          observationType,
          confidence: observationConfidence,
          baseline: {
            score: token.totalScore,
            volume24h: token.volume24h || 0,
            liquidity: token.liquidity || 0,
          },
        }

        // Store observation
        await storage.set(OBSERVATION_KEY(mint), observation, { ex: OBSERVATION_TTL })

        logger.log(
          `[lead-time] Observation: ${token.symbol} ${observationType} (${observationConfidence})`
        )
      }
    } catch (error) {
      logger.error(`[lead-time] Failed to process observation for ${token.symbol}:`, error)
    }
  }
}

/**
 * Check for reactions to pending observations
 * Called during ingestion after new data is available
 */
export async function processLeadTimeReactions(tokens: TokenScore[]): Promise<void> {
  const now = Date.now()

  for (const token of tokens) {
    try {
      const mint = normalizeMint(token.address)
      if (!mint) continue // Skip invalid mints
      
      const observation = (await storage.get(OBSERVATION_KEY(mint))) as PendingObservation | null
      if (!observation) continue

      // Check if observation is within reaction window (4 hours)
      const timeSinceObservation = now - observation.observedAt
      if (timeSinceObservation > 4 * 60 * 60 * 1000) {
        // Observation expired without reaction - clean up
        await storage.del(OBSERVATION_KEY(mint))
        continue
      }

      // Calculate changes since observation
      const currentVolume = token.volume24h || 0
      const currentLiquidity = token.liquidity || 0
      const baselineVolume = observation.baseline.volume24h
      const baselineLiquidity = observation.baseline.liquidity

      const volumeChange =
        baselineVolume > 0 ? ((currentVolume - baselineVolume) / baselineVolume) * 100 : 0
      const liquidityChange =
        baselineLiquidity > 0
          ? ((currentLiquidity - baselineLiquidity) / baselineLiquidity) * 100
          : 0

      // Check for reaction conditions (lowered thresholds for v1)
      const hasVolumeReaction = volumeChange >= 15
      const hasLiquidityReaction = liquidityChange >= 10

      if (hasVolumeReaction || hasLiquidityReaction) {
        // Create reaction event
        const reactionType = hasVolumeReaction ? "volume_expansion" : "liquidity_expansion"
        const magnitude = hasVolumeReaction ? volumeChange / 100 : liquidityChange / 100

        const observationEvent: ObservationEvent = {
          mint,
          blockNumber: observation.blockNumber || 0,
          blockTimestamp: observation.observedAt,
          observationType: observation.observationType,
          confidence: observation.confidence,
          details: `Observed ${observation.observationType.replace(/_/g, " ")} at score ${observation.baseline.score}`,
        }

        const reactionEvent: ReactionEvent = {
          mint,
          blockNumber: 0, // Block number optional in v1
          blockTimestamp: now,
          reactionType,
          magnitude: Math.round(magnitude * 100) / 100,
          details: hasVolumeReaction
            ? `Volume increased ${volumeChange.toFixed(1)}% ($${observation.baseline.volume24h.toFixed(0)} → $${currentVolume.toFixed(0)})`
            : `Liquidity increased ${liquidityChange.toFixed(1)}% ($${observation.baseline.liquidity.toFixed(0)} → $${currentLiquidity.toFixed(0)})`,
        }

        // Create and save proof
        const proof = createLeadTimeProof(
          observationEvent,
          reactionEvent,
          {
            symbol: token.symbol,
            name: token.name || token.symbol,
          },
          false // isPro = false for v1
        )

        if (proof) {
          await saveLeadTimeProof(proof)
          
          // Also add to recent proofs list
          await addToRecentProofs(proof)
          
          logger.log(
            `[lead-time] Proof: ${token.symbol} +${proof.leadSeconds}s (${proof.confidence})`
          )
        }

        // Clean up observation
        await storage.del(OBSERVATION_KEY(mint))
      }
    } catch (error) {
      logger.error(`[lead-time] Failed to process reaction for ${token.symbol}:`, error)
    }
  }
}

/**
 * Main entry point: Process both observations and reactions
 * Called from ingestion pipeline after scoring + signal states are computed
 */
/** A single rejection sample for debugging */
export interface RejectionSample {
  mint: string
  reason: string
  details?: string
}

/** Diagnostic counters returned by processLeadTimeProofs */
export interface LeadTimeWriterResult {
  scannedCount: number
  producedCount: number
  wroteCount: number
  writeOk: boolean
  recentKey: string
  rejection: {
    noSignalState: number
    lowConfidence: number
    existingObservation: number
    noScoreJump: number
    noReaction: number
    expiredObservation: number
    errors: number
  }
  sampleRejections: RejectionSample[]
  mvpFallbackCount: number
  durationMs: number
}

export async function processLeadTimeProofs(
  tokens: TokenScore[],
  signalStates: Map<string, { state: SignalState; confidence: number }>
): Promise<LeadTimeWriterResult> {
  const startTime = Date.now()
  const runAt = new Date().toISOString()
  let scannedTokens = 0
  let scannedPending = 0
  let createdPending = 0
  let createdProofs = 0
  let errorsCount = 0

  // Rejection counters (observation pass)
  let rejNoSignalState = 0
  let rejLowConfidence = 0
  let rejExistingObs = 0
  let rejNoScoreJump = 0
  // Rejection counters (reaction pass)
  let rejNoReaction = 0
  let rejExpiredObs = 0

  const RECENT_KEY = "solrad:leadtime:recent"
  let writeOk = true
  const MAX_SAMPLES = 5
  const sampleRejections: RejectionSample[] = []
  let mvpFallbackCount = 0

  function addRejSample(mint: string, reason: string, details?: string) {
    if (sampleRejections.length < MAX_SAMPLES) {
      sampleRejections.push({ mint: mint.slice(0, 12) + "...", reason, ...(details ? { details } : {}) })
    }
  }
  
  try {
    // Write run timestamp immediately
    try {
      await storage.set("leadtime:last_writer_run_at", runAt, { ex: 60 * 60 * 24 })
    } catch {
      // Don't throw - instrumentation should not break the writer
    }

    // ── First pass: Observations ──
    // Instead of calling processLeadTimeObservations directly, inline counters
    const obsStartCount = await countPendingObservations()
    scannedTokens = tokens.length

    for (const token of tokens) {
      try {
        const mint = normalizeMint(token.address)
        if (!mint) continue
        const stateData = signalStates.get(token.address)
        if (!stateData) { rejNoSignalState++; addRejSample(mint, "noSignalState", `No entry in signalStates map for ${token.symbol}`); continue }
        if (stateData.confidence < 40) { rejLowConfidence++; addRejSample(mint, "lowConfidence", `confidence=${stateData.confidence} < 40`); continue }
        const existingObs = await storage.get(OBSERVATION_KEY(mint))
        if (existingObs) { rejExistingObs++; addRejSample(mint, "existingObservation", `Active obs exists for ${token.symbol}`); continue }
        const scoreJump = await detectScoreJump(token)
        const { upgraded, fromState } = await detectSignalUpgrade(token, stateData.state)
        if (scoreJump < 3 && !upgraded) { rejNoScoreJump++; addRejSample(mint, "noScoreJump", `jump=${scoreJump.toFixed(1)}, upgraded=${upgraded}, state=${stateData.state}`); continue }

        // Create observation
        const observationType = upgraded
          ? `signal_upgrade_${fromState}_to_${stateData.state}`
          : `score_jump_+${Math.round(scoreJump)}`
        const observationConfidence: "LOW" | "MEDIUM" | "HIGH" =
          stateData.confidence >= 80 ? "HIGH" : stateData.confidence >= 65 ? "MEDIUM" : "LOW"
        const observation = {
          mint,
          observedAt: Date.now(),
          blockNumber: 0,
          observationType,
          confidence: observationConfidence,
          baseline: {
            score: token.totalScore,
            volume24h: token.volume24h || 0,
            liquidity: token.liquidity || 0,
          },
        }
        await storage.set(OBSERVATION_KEY(mint), observation, { ex: OBSERVATION_TTL })
        createdPending++
      } catch {
        errorsCount++
      }
    }

    const obsEndCount = await countPendingObservations()
    scannedPending = obsStartCount

    // ── Second pass: Reactions ──
    const proofStartCount = await getRecentProofCount()
    for (const token of tokens) {
      try {
        const mint = normalizeMint(token.address)
        if (!mint) continue
        const observation = (await storage.get(OBSERVATION_KEY(mint))) as any
        if (!observation) continue
        const timeSinceObs = Date.now() - observation.observedAt
        if (timeSinceObs > 4 * 60 * 60 * 1000) {
          await storage.del(OBSERVATION_KEY(mint))
          rejExpiredObs++
          addRejSample(mint, "expiredObservation", `age=${Math.round(timeSinceObs / 60000)}min > 240min`)
          continue
        }
        const currentVolume = token.volume24h || 0
        const currentLiquidity = token.liquidity || 0
        const volumeChange = observation.baseline.volume24h > 0
          ? ((currentVolume - observation.baseline.volume24h) / observation.baseline.volume24h) * 100
          : 0
        const liquidityChange = observation.baseline.liquidity > 0
          ? ((currentLiquidity - observation.baseline.liquidity) / observation.baseline.liquidity) * 100
          : 0
        if (volumeChange < 15 && liquidityChange < 10) {
          rejNoReaction++
          addRejSample(mint, "noReaction", `vol=${volumeChange.toFixed(1)}%(<15), liq=${liquidityChange.toFixed(1)}%(<10)`)
          continue
        }
        const reactionType = volumeChange >= 30 ? "volume_expansion" : "liquidity_expansion"
        const magnitude = volumeChange >= 30 ? volumeChange / 100 : liquidityChange / 100
        const obsEvt: ObservationEvent = {
          mint,
          blockNumber: observation.blockNumber || 0,
          blockTimestamp: observation.observedAt,
          observationType: observation.observationType,
          confidence: observation.confidence,
          details: `Observed ${observation.observationType.replace(/_/g, " ")} at score ${observation.baseline.score}`,
        }
        const reactionEvt: ReactionEvent = {
          mint,
          blockNumber: 0,
          blockTimestamp: Date.now(),
          reactionType,
          magnitude: Math.round(magnitude * 100) / 100,
          details: volumeChange >= 30
            ? `Volume increased ${volumeChange.toFixed(1)}%`
            : `Liquidity increased ${liquidityChange.toFixed(1)}%`,
        }
        const proof = createLeadTimeProof(obsEvt, reactionEvt, {
          symbol: token.symbol,
          name: token.name || token.symbol,
        }, false)
        if (proof) {
          await saveLeadTimeProof(proof)
          await addToRecentProofs(proof)
          createdProofs++
        }
        await storage.del(OBSERVATION_KEY(mint))
      } catch {
        errorsCount++
      }
    }

    // ── MVP_MODE fallback: DISABLED — synthetic proofs pollute the proof record ──
    // Real proofs will come as the token pool grows with the supplemental harvest fix
    const isMvpMode = false // was: process.env.MVP_MODE === "1"
    if (isMvpMode && createdProofs === 0 && createdPending === 0 && tokens.length > 0) {
      // Pick up to 10 tokens with the highest scores as fallback candidates
      const sorted = [...tokens]
        .filter(t => (t.totalScore ?? 0) > 0)
        .sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0))
        .slice(0, 10)

      for (const token of sorted) {
        const mint = normalizeMint(token.address)
        if (!mint) continue
        const stateData = signalStates.get(token.address)
        const candidateProof: any = {
          mint,
          symbol: token.symbol,
          name: token.name || token.symbol,
          observationEvent: {
            mint,
            blockNumber: 0,
            blockTimestamp: Date.now(),
            observationType: "MVP_FALLBACK",
            confidence: "LOW",
            details: `MVP fallback: score=${token.totalScore}, state=${stateData?.state ?? "unknown"}`,
          },
          reactionEvent: {
            mint,
            blockNumber: 0,
            blockTimestamp: Date.now(),
            reactionType: "volume_expansion",
            magnitude: 0,
            details: "No reaction detected -- MVP placeholder",
          },
          leadBlocks: 0,
          leadSeconds: 0,
          proofCreatedAt: Date.now(),
          confidence: "LOW",
          isPro: false,
          _mvpFallback: true,
          _mvpReason: "MVP_FALLBACK",
        }
        try {
          await addToRecentProofs(candidateProof)
          mvpFallbackCount++
        } catch {
          errorsCount++
        }
      }

      if (mvpFallbackCount > 0) {
        logger.log(`[lead-time] MVP_MODE: stored ${mvpFallbackCount} fallback candidate proofs`)
      }
    }

    // Write stats to KV
    const stats = {
      runAt,
      scannedTokens,
      scannedPending,
      createdPending,
      createdProofs,
      errorsCount,
      rejection: {
        noSignalState: rejNoSignalState,
        lowConfidence: rejLowConfidence,
        existingObservation: rejExistingObs,
        noScoreJump: rejNoScoreJump,
        noReaction: rejNoReaction,
        expiredObservation: rejExpiredObs,
        errors: errorsCount,
      },
      sampleRejections,
      mvpFallbackCount,
      recentKey: RECENT_KEY,
      durationMs: Date.now() - startTime,
    }

    try {
      await storage.set("leadtime:last_writer_stats", JSON.stringify(stats), { ex: 60 * 60 * 24 })
    } catch {
      // Don't throw - instrumentation should not break the writer
    }

    const duration = Date.now() - startTime
    logger.log(
      `[lead-time] Cycle complete: ${scannedTokens} tokens scanned, ${createdPending} observations created, ${createdProofs} proofs created (${duration}ms)`
    )
  } catch (error) {
    errorsCount++
    writeOk = false
    logger.error("[lead-time] Failed to process lead-time proofs:", error)
    
    // Write error to KV
    try {
      const errorData = {
        at: new Date().toISOString(),
        message: error instanceof Error ? error.message : String(error),
        where: "processLeadTimeProofs",
      }
      await storage.set("leadtime:last_error", JSON.stringify(errorData), { ex: 60 * 60 * 24 })
    } catch {
      // Don't throw - instrumentation should not break the writer
    }
  }

  return {
    scannedCount: scannedTokens,
    producedCount: createdPending + createdProofs,
    wroteCount: createdProofs,
    writeOk,
    recentKey: RECENT_KEY,
    rejection: {
      noSignalState: rejNoSignalState,
      lowConfidence: rejLowConfidence,
      existingObservation: rejExistingObs,
      noScoreJump: rejNoScoreJump,
      noReaction: rejNoReaction,
      expiredObservation: rejExpiredObs,
      errors: errorsCount,
    },
    sampleRejections,
    mvpFallbackCount,
    durationMs: Date.now() - startTime,
  }
}

/**
 * Get recent proof count for stats tracking
 */
async function getRecentProofCount(): Promise<number> {
  try {
    const proofs = await storage.get("solrad:leadtime:recent")
    return Array.isArray(proofs) ? proofs.length : 0
  } catch {
    return 0
  }
}

/**
 * Count pending observations for logging
 */
async function countPendingObservations(): Promise<number> {
  try {
    // This is approximate - we'd need to scan all keys to get exact count
    // For now, return 0 as placeholder
    return 0
  } catch {
    return 0
  }
}
