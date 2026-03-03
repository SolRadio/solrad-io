import type { CachedTokenData, SourceMeta, TokenScore } from "./types"
import { fetchAllSources } from "./adapters"
import { calculateTokenScore } from "./scoring"
import { storage, CACHE_KEYS, CACHE_TTL } from "./storage"
import { enrichWithHelius } from "./adapters/helius"
import { generateAIExplanation } from "./adapters/openai"
import { isValidSolanaMint, normalizeMint } from "./utils/solana"
import pLimit from "p-limit"
import { saveSnapshot } from "./tracker"
import { saveTimeSeriesPoints } from "./time-series"
import { logger } from "./logger"
import { computeConfidence, computeSignalState, updateSignalState } from "./signal-state"

export interface IngestionResult {
  success: boolean
  tokensProcessed: number
  sourcesUsed: number
  duration: number
  error?: string
  degraded?: boolean
  degradedReason?: string
}

// Ingestion guard constants
const MIN_TOKENS = 15 // Minimum tokens to accept fresh ingestion (lowered to accept smaller datasets)
const MIN_HEALTHY_TOKENS_RATIO = 0.3 // At least 30% should have valid price/liquidity/volume (lowered for pump.fun tokens)

export async function ingestTokenData(force = false): Promise<IngestionResult> {
  const startTime = Date.now()

  try {
    // Check if we have valid cached data
    const cachedData = await getCachedTokens()
    const hasFreshCache = cachedData && (Date.now() - cachedData.updatedAt) < (CACHE_TTL.TOKENS * 1000)

    // If cache is fresh and not forced, save snapshot from cache and return early
    if (hasFreshCache && !force) {
      logger.log("[v0] Using cached token data, saving snapshot...")
      
      // Merge cached tokens with blob storage tokens (manual tokens)
      const { getBlobState } = await import("./blob-storage")
      const blobState = await getBlobState()
      const manualTokens = Object.values(blobState.tokensByMint)
      
      // Merge: auto-ingested + manual tokens
      const allTokens = new Map<string, typeof cachedData.tokens[0]>()
      cachedData.tokens.forEach(t => allTokens.set(t.address.toLowerCase(), t))
      manualTokens.forEach((t: any) => allTokens.set(t.address.toLowerCase(), t))
      
      const mergedTokens = Array.from(allTokens.values())
      
      // Save snapshot from cached data
      await saveSnapshot(mergedTokens)
      logger.log("[v0] Snapshot saved:", { count: mergedTokens.length, source: "cached" })
      
      return {
        success: true,
        tokensProcessed: mergedTokens.length,
        sourcesUsed: 0, // Using cache
        duration: Date.now() - startTime,
      }
    }

    // Rate limit check (only for fresh ingestion)
    const lastIngestTime = await storage.get(CACHE_KEYS.LAST_INGEST_TIME)
    if (lastIngestTime && !force) {
      const timeSinceLastIngest = Date.now() - (lastIngestTime as number)
      if (timeSinceLastIngest < CACHE_TTL.RATE_LIMIT * 1000) {
        const retryAfter = Math.ceil((CACHE_TTL.RATE_LIMIT * 1000 - timeSinceLastIngest) / 1000)
        return {
          success: false,
          tokensProcessed: 0,
          sourcesUsed: 0,
          duration: Date.now() - startTime,
          error: `Rate limited. Retry after ${retryAfter} seconds`,
        }
      }
    }

    const lock = await storage.get(CACHE_KEYS.INGESTION_LOCK)
    if (lock && !force) {
      logger.log("[v0] Ingestion lock active (single-flight). Returning last-good data.")
      // Return last-good cached tokens instead of failing
      const lastGood = await getCachedTokens()
      const lastGoodCount = lastGood?.tokens?.length ?? 0
      return {
        success: true,
        tokensProcessed: lastGoodCount,
        sourcesUsed: 0,
        duration: Date.now() - startTime,
        degraded: lastGoodCount === 0,
        degradedReason: lastGoodCount === 0 ? "lock_held_no_cache" : undefined,
        error: lastGoodCount === 0 ? "Ingestion locked and no cached data" : undefined,
      }
    }

    await storage.set(CACHE_KEYS.INGESTION_LOCK, true, { ex: CACHE_TTL.LOCK })
    await storage.set(CACHE_KEYS.LAST_INGEST_TIME, Date.now())

    logger.log("[v0] Starting token ingestion...")

    const tokenDataMap = await fetchAllSources()
    const errors: string[] = []

    const dexscreenerCount = Array.from(tokenDataMap.values()).flat().length

    // CRITICAL FIX: Validate using ORIGINAL token addresses, not lowercase map keys
    // The map keys are lowercase for deduplication, but validation needs proper case
    // RETURN the properly-cased original addresses for all downstream use (Helius, display, etc.)
    const validAddresses = Array.from(tokenDataMap.entries())
      .filter(([lowercaseKey, tokens]) => {
        if (tokens.length === 0) return false
        // Use the actual token.address which has proper case, not the lowercase key
        const originalAddress = tokens[0].address
        const isValid = isValidSolanaMint(originalAddress)
        if (!isValid) {
          logger.log(`[v0] Filtered invalid mint address: ${originalAddress} (map key: ${lowercaseKey})`)
        }
        return isValid
      })
      .map(([lowercaseKey, tokens]) => tokens[0].address) // Return ORIGINAL properly-cased addresses!

    const topTokenAddresses = validAddresses.slice(0, 15)
    const heliusData = new Map()
    let heliusEnrichedCount = 0

    if (process.env.HELIUS_API_KEY && topTokenAddresses.length > 0) {
      logger.log(`[v0] Enriching top ${topTokenAddresses.length} tokens with Helius...`)

      const limit = pLimit(3)
      const enrichmentPromises = topTokenAddresses.map((address) =>
        limit(async () => {
          try {
            const enrichment = await enrichWithHelius(address)
            if (enrichment) {
              // Store with lowercase key for consistent lookup in scoring.ts
              heliusData.set(address.toLowerCase(), enrichment)
              heliusEnrichedCount++
            }
          } catch (error) {
            console.warn(`[v0] Helius enrichment failed for ${address}:`, error)
          }
        }),
      )

      await Promise.all(enrichmentPromises)
    }

    const scores = calculateTokenScore(tokenDataMap, heliusData)

    // Ensure dexTokenAddress is set for all tokens
    for (const token of scores) {
      if (!token.dexTokenAddress && token.address) {
        token.dexTokenAddress = token.address
      }
    }

    // Filter out any invalid tokens (addresses must be 32-48 chars for standard/pump.fun tokens)
    const validScores = scores.filter(t => t.address && t.address.length >= 32 && t.address.length <= 48)

    // AUTO-EXPAND TRACKING: tokens scoring >=50 get auto-added, <40 for 3 runs get auto-removed
    const MAX_TRACKED = 1000
    try {
      const autoTracked = (await storage.get("solrad:auto-tracked-mints") as string[] | null) ?? []
      const lowScoreCounter = (await storage.get("solrad:low-score-counter") as Record<string, number> | null) ?? {}
      const autoTrackedSet = new Set(autoTracked)
      let autoAddedCount = 0

      // Auto-add: score >= 50 and not already tracked
      for (const token of validScores) {
        if (token.totalScore >= 50 && !autoTrackedSet.has(token.address) && autoTrackedSet.size < MAX_TRACKED) {
          autoTrackedSet.add(token.address)
          autoAddedCount++
        }
      }

      // Auto-remove: score < 40 for 3 consecutive snapshots
      const currentScoreMap = new Map(validScores.map(t => [t.address, t.totalScore]))
      for (const mint of autoTrackedSet) {
        const currentScore = currentScoreMap.get(mint)
        if (currentScore !== undefined && currentScore < 40) {
          lowScoreCounter[mint] = (lowScoreCounter[mint] ?? 0) + 1
          if (lowScoreCounter[mint] >= 3) {
            autoTrackedSet.delete(mint)
            delete lowScoreCounter[mint]
          }
        } else {
          // Reset counter if score recovered
          delete lowScoreCounter[mint]
        }
      }

      await storage.set("solrad:auto-tracked-mints", Array.from(autoTrackedSet), { ex: 86400 })
      await storage.set("solrad:low-score-counter", lowScoreCounter, { ex: 86400 })
      await storage.set("solrad:auto-added-count", autoAddedCount)
      await storage.set("solrad:auto-tracking-count", autoTrackedSet.size)
      logger.log(`[v0] Auto-tracking: ${autoTrackedSet.size} total, ${autoAddedCount} newly added this run`)

      // BACKGROUND TRACKING: track ALL scored tokens for historical monitoring
      // Uses a separate index so we can track tokens even if they're also on the dashboard
      try {
        const { addToBackgroundTracking, removeFromBackgroundTracking } = await import("./background-tracker")
        let bgAdded = 0
        let bgRemoved = 0

        for (const token of validScores) {
          const score = token.totalScore ?? 0

          if (score >= 50) {
            await addToBackgroundTracking(token.address, token)
            bgAdded++
          } else if (score < 30) {
            await removeFromBackgroundTracking(token.address)
            bgRemoved++
          }
        }

        logger.log(`[BG-TRACK] Checked ${validScores.length} tokens, autoTrackedSet: ${autoTrackedSet.size}, added: ${bgAdded}, removed: ${bgRemoved}`)
      } catch (bgErr) {
        console.warn("[v0] Background tracking failed (non-fatal):", bgErr)
      }
    } catch (autoTrackErr) {
      console.warn("[v0] Auto-expand tracking failed (non-fatal):", autoTrackErr)
    }
    
    // ZERO-TOKEN WRITE GUARD: Prevent overwriting good cache with empty/minimal data
    const MINIMUM_TOKEN_THRESHOLD = 5 // Absolute minimum to consider valid
    if (validScores.length < MINIMUM_TOKEN_THRESHOLD) {
      const previousCachedData = await getCachedTokens()
      
      if (previousCachedData && previousCachedData.tokens.length > 0) {
        console.log(`[INGEST GUARD] Skipped write due to zero-token failure (${validScores.length} tokens). Preserving last-good cache (${previousCachedData.tokens.length} tokens)`)
        
        // Set ingestion status to reflect rate limiting
        await storage.set(CACHE_KEYS.INGESTION_STATUS, {
          status: "rate_limited",
          reason: "Empty or minimal data from source - likely rate limited",
          lastGoodIngestAt: previousCachedData.updatedAt,
          lastGoodCount: previousCachedData.tokens.length,
          tokenCount: validScores.length,
        }, { ex: 3600 }) // 1 hour
        
        await storage.del(CACHE_KEYS.INGESTION_LOCK)
        
        return {
          success: true,
          tokensProcessed: previousCachedData.tokens.length,
          sourcesUsed: 0,
          duration: Date.now() - startTime,
          degraded: true,
          degradedReason: "rate_limited_zero_tokens",
        }
      }
    }
    
    // Process signal states for all tokens (with rate limiting)
    logger.log(`[v0] Computing signal states for ${validScores.length} tokens...`)
    const signalStateLimit = pLimit(10)
    const signalStateMap = new Map<string, { state: import("./signal-state").SignalState; confidence: number }>()
    const signalStatePromises = validScores.map((token, idx) =>
      signalStateLimit(async () => {
        try {
          const confidence = computeConfidence(token)
          const state = computeSignalState(token, confidence)
          // Update storage and track transitions
          await updateSignalState(token, state, confidence)
          // Attach to token object
          validScores[idx].signalState = state
          validScores[idx].signalStateUpdatedAt = Date.now()
          // Store for lead-time processing
          signalStateMap.set(token.address, { state, confidence })
        } catch (err) {
          // Non-fatal: continue without signal state
          console.warn(`[v0] Signal state failed for ${token.symbol}:`, err)
        }
      })
    )
    await Promise.all(signalStatePromises)
    logger.log("[v0] Signal states computed")

    // Process lead-time proofs (observations + reactions)
    try {
      const { processLeadTimeProofs } = await import("./lead-time/writer")
      await processLeadTimeProofs(validScores, signalStateMap)
    } catch (leadTimeError) {
      console.warn("[v0] Lead-time processing failed (non-fatal):", leadTimeError)
    }

    if (process.env.OPENAI_API_KEY && validScores.length > 0) {
      logger.log("[v0] Generating AI explanations for top 5 tokens...")
      const limit = pLimit(2)
      const aiPromises = validScores.slice(0, 5).map((token, i) =>
        limit(async () => {
          try {
            const explanation = await generateAIExplanation(token)
            if (explanation) {
              validScores[i].aiExplanation = explanation
            }
          } catch (error) {
            console.warn(
              `[v0] Failed to generate AI explanation for ${token.symbol}:`,
              error instanceof Error ? error.message : error,
            )
          }
        }),
      )

      await Promise.all(aiPromises)
    }

    // INGESTION GUARD: Validate new data before overwriting cache
    const healthyTokens = validScores.filter(t => {
      const hasPrice = (t.priceUsd ?? 0) > 0
      const hasLiquidity = (t.liquidity ?? 0) > 0
      const hasVolume = (t.volume24h ?? 0) > 0
      return hasPrice && hasLiquidity && hasVolume
    })

    const healthyRatio = validScores.length > 0 ? healthyTokens.length / validScores.length : 0
    const previousCachedData = await getCachedTokens()

    // Check if new ingestion is degraded
    const isDegraded = 
      validScores.length < MIN_TOKENS || 
      healthyRatio < MIN_HEALTHY_TOKENS_RATIO

    if (isDegraded && previousCachedData && previousCachedData.tokens.length > 0) {
      // Don't overwrite - keep previous cache
      console.log(`[INGEST GUARD] Skipped write due to degraded data (${validScores.length} tokens, ${(healthyRatio * 100).toFixed(0)}% healthy). Preserving last-good cache (${previousCachedData.tokens.length} tokens)`)
      
      // Set degraded metadata
      await storage.set(CACHE_KEYS.INGESTION_STATUS, {
        status: "degraded",
        reason: validScores.length < MIN_TOKENS ? "source_shrink" : "unhealthy_data",
        lastGoodIngestAt: previousCachedData.updatedAt,
        lastGoodCount: previousCachedData.tokens.length,
        tokenCount: validScores.length,
        healthyRatio,
      }, { ex: 3600 }) // 1 hour

      await storage.del(CACHE_KEYS.INGESTION_LOCK)

      return {
        success: true, // Still "success" but degraded
        tokensProcessed: previousCachedData.tokens.length,
        sourcesUsed: 1,
        duration: Date.now() - startTime,
        degraded: true,
        degradedReason: validScores.length < MIN_TOKENS ? "source_shrink" : "unhealthy_data",
      }
    }

    // Ingestion looks healthy - proceed with cache update
    const sourceMeta: SourceMeta = {
      totalTokens: validScores.length,
      dexscreenerCount,
      jupiterCount: 0, // No Jupiter anymore
      heliusEnriched: heliusEnrichedCount,
      errors,
    }

    const cacheData: CachedTokenData = {
      updatedAt: Date.now(),
      tokens: validScores,
      sourceMeta,
    }

    // Storage adapter handles JSON serialization internally
    await storage.set(CACHE_KEYS.TOKENS, cacheData, { ex: CACHE_TTL.TOKENS })
    await storage.set(CACHE_KEYS.SOURCE_META, sourceMeta, { ex: CACHE_TTL.TOKENS })
    
    // Store individual token snapshots for lead-time harvest lookup
    // This allows the harvest to find tokens not in the current DexScreener trending results
    const perTokenLimit = pLimit(10)
    let perTokenWrites = 0
    await Promise.all(
      validScores.slice(0, 200).map(token =>
        perTokenLimit(async () => {
          const mint = token.address
          if (!mint) return
          try {
            await storage.set(
              `solrad:token:score:${mint}`,
              {
                totalScore: token.totalScore,
                signalState: token.signalState ?? null,
                symbol: token.symbol,
                name: token.name,
                priceUsd: token.priceUsd,
                volume24h: token.volume24h,
                liquidity: token.liquidity,
                imageUrl: token.imageUrl,
                lastUpdated: Date.now(),
              },
              { ex: 60 * 60 * 4 } // 4 hour TTL (longer than snapshot's 2h)
            )
            perTokenWrites++
          } catch { /* non-critical */ }
        })
      )
    )
    if (perTokenWrites > 0) {
      logger.log(`[v0] Stored ${perTokenWrites} per-token score snapshots for harvest lookup`)
    }

    // PERSISTENT FALLBACK: Save to longer-lived key for recovery when main cache expires
    // This prevents "warming radar" state when cache expires and new ingestion fails
    await storage.set("solrad:tokens:fallback", cacheData, { ex: 3600 }) // 1 hour TTL
    logger.log("[v0] Saved fallback token cache with 1-hour TTL")
    
    // LONG-TERM FALLBACK: Save top tokens to blob storage (4-hour TTL)
    // This provides recovery even when both KV caches expire
    await storage.set("solrad:tokens:blob-fallback", {
      tokens: validScores.slice(0, 100), // Top 100 tokens only to stay within blob limits
      updatedAt: Date.now(),
    }, { ex: 14400 }) // 4 hours
    logger.log(`[v0] Saved blob fallback: ${Math.min(100, validScores.length)} tokens with 4-hour TTL`)
    
    // Clear degraded status on successful ingestion
    await storage.set(CACHE_KEYS.INGESTION_STATUS, {
      status: "ready",
      lastGoodIngestAt: Date.now(),
    }, { ex: 3600 })

    // Merge fresh ingestion with blob storage tokens before saving
    const { getBlobState } = await import("./blob-storage")
    const blobState = await getBlobState()
    const manualTokens = Object.values(blobState.tokensByMint)
    
    // Merge: freshly scored + manual tokens
    const allTokens = new Map<string, typeof validScores[0]>()
    validScores.forEach(t => allTokens.set(t.address.toLowerCase(), t))
    manualTokens.forEach((t: any) => allTokens.set(t.address.toLowerCase(), t))
    
    const mergedScores = Array.from(allTokens.values())

    // Save time series points for historical tracking
    await saveTimeSeriesPoints(mergedScores)

    // Save snapshot with merged tokens (auto + manual)
    await saveSnapshot(mergedScores)
    logger.log("[v0] Snapshot saved:", { count: mergedScores.length, source: "fresh" })

    // PERSISTENCE: Upsert eligible tokens to archive (score >= 50)
    try {
      const { upsertArchiveTokens } = await import("./blob-storage")
      await upsertArchiveTokens(validScores, 50)
    } catch (archiveError) {
      console.warn("[v0] Archive upsert failed (non-fatal):", archiveError)
    }

    await storage.del(CACHE_KEYS.INGESTION_LOCK)

    const duration = Date.now() - startTime

    logger.log(`[v0] Ingestion complete: ${scores.length} tokens, ${duration}ms`)

    return {
      success: true,
      tokensProcessed: scores.length,
      sourcesUsed: 1, // Only DexScreener now
      duration,
    }
  } catch (error) {
    await storage.del(CACHE_KEYS.INGESTION_LOCK)

    console.error("[v0] Ingestion error:", error)

    return {
      success: false,
      tokensProcessed: 0,
      sourcesUsed: 0,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function getCachedTokens(): Promise<CachedTokenData | null> {
  // Try main cache first (15-minute TTL)
  let data = await storage.get<CachedTokenData>(CACHE_KEYS.TOKENS)
  
  // If main cache expired, try fallback cache (1-hour TTL)
  if (!data) {
    logger.log("[v0] Main token cache empty, checking 1-hour fallback...")
    data = await storage.get<CachedTokenData>("solrad:tokens:fallback")
    if (data) {
      logger.log(`[v0] Using 1-hour fallback: ${data.tokens.length} tokens`)
    }
  }
  
  // If both expired, try long-term blob fallback (4-hour TTL)
  if (!data) {
    logger.log("[v0] 1-hour fallback empty, checking 4-hour blob fallback...")
    const blobData = await storage.get<{ tokens: TokenScore[]; updatedAt: number }>("solrad:tokens:blob-fallback")
    if (blobData && blobData.tokens && blobData.tokens.length > 0) {
      logger.log(`[v0] Using 4-hour blob fallback: ${blobData.tokens.length} tokens`)
      data = {
        tokens: blobData.tokens,
        updatedAt: blobData.updatedAt,
        sourceMeta: {
          totalTokens: blobData.tokens.length,
          dexscreenerCount: blobData.tokens.length,
          jupiterCount: 0,
          heliusEnriched: 0,
          errors: [],
        },
      }
    }
  }
  
  return data
}

export async function getLastUpdateTime(): Promise<number | null> {
  const cached = await storage.get(CACHE_KEYS.TOKENS)
  if (!cached) return null

  try {
    let cacheData: CachedTokenData
    
    // Storage adapter already parses JSON, handle both formats
    if (typeof cached === "string") {
      cacheData = JSON.parse(cached) as CachedTokenData
    } else {
      cacheData = cached as CachedTokenData
    }
    
    return cacheData.updatedAt
  } catch {
    return null
  }
}
