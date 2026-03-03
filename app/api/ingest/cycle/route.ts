import { NextResponse } from "next/server"
import { storage } from "@/lib/storage"
import {
  fetchDexLatestPairs,
  fetchPumpNewMints,
  fetchHeliusNewMints,
} from "@/lib/ingest/sources"
import {
  mergeAndDedupe,
  filterNewFresh,
  ensureFreshMinimum,
  getFreshList,
  saveFreshList,
} from "@/lib/ingest/guard"
import type { MergedToken } from "@/lib/ingest/guard"

export interface IngestionHealth {
  lastMintSeen?: { timestamp: number; mint: string }
  lastDexUpdate?: number
  lastHeliusEvent?: number
  ingestionLatencyMs: number
  freshCount: number
  lastRunAt: number
  sources: {
    dexCount: number
    pumpCount: number
    heliusCount: number
    mergedCount: number
    insertedFreshCount: number
    skippedSeenCount: number
  }
  errors: string[]
}

/**
 * POST /api/ingest/cycle
 * 
 * Runs one complete ingestion cycle:
 * 1. Fetch from DexScreener + Pump.fun + Helius (with fallbacks)
 * 2. Merge and deduplicate by canonical mint
 * 3. Filter for new "fresh" tokens (not in 15-minute window)
 * 4. Inject into Fresh Signals list
 * 5. Ensure Fresh list has minimum 5 tokens (backfill if needed)
 * 6. Update ingestion health metrics
 * 
 * Designed for client polling (every 30s) from dashboard
 */
export async function POST(request: Request) {
  const startTime = Date.now()
  const errors: string[] = []
  
  try {
    console.log("[v0] Ingestion cycle: Starting...")
    
    // Get base URL for internal API calls
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : (process.env.NEXT_PUBLIC_SITE_URL || "")
    
    // STEP 1: Fetch from all sources (parallel with fallbacks)
    const [dexTokens, pumpTokens, heliusTokens] = await Promise.all([
      fetchDexLatestPairs().catch(err => {
        errors.push(`DexScreener: ${err.message}`)
        return []
      }),
      fetchPumpNewMints(baseUrl).catch(err => {
        errors.push(`Pump.fun: ${err.message}`)
        return []
      }),
      fetchHeliusNewMints(baseUrl).catch(err => {
        errors.push(`Helius: ${err.message}`)
        return []
      }),
    ])
    
    console.log(`[v0] Ingestion cycle: Fetched ${dexTokens.length} dex, ${pumpTokens.length} pump, ${heliusTokens.length} helius`)
    
    // STEP 2: Merge and deduplicate
    const merged = mergeAndDedupe([dexTokens, pumpTokens, heliusTokens])
    console.log(`[v0] Ingestion cycle: Merged to ${merged.length} unique tokens`)
    
    if (merged.length === 0) {
      console.warn("[v0] Ingestion cycle: No tokens fetched from any source")
      
      // Update health with failure
      const health: IngestionHealth = {
        ingestionLatencyMs: Date.now() - startTime,
        freshCount: 0,
        lastRunAt: Date.now(),
        sources: {
          dexCount: 0,
          pumpCount: 0,
          heliusCount: 0,
          mergedCount: 0,
          insertedFreshCount: 0,
          skippedSeenCount: 0,
        },
        errors,
      }
      
      await storage.set("ingest:health", health, { ex: 3600 })
      
      return NextResponse.json({
        ok: false,
        error: "No tokens fetched from any source",
        health,
      }, { status: 502 })
    }
    
    // STEP 3: Filter for new fresh tokens
    const freshCandidates = await filterNewFresh(merged)
    const skippedSeenCount = merged.length - freshCandidates.length
    
    // STEP 4: Get current fresh list and append new candidates
    const currentFresh = await getFreshList()
    const updatedFresh = [...currentFresh, ...freshCandidates]
    
    // STEP 5: Ensure minimum count (backfill if needed)
    const finalFresh = await ensureFreshMinimum(updatedFresh, merged, 5)
    
    // STEP 6: Save fresh list
    await saveFreshList(finalFresh)
    
    // STEP 7: Cache individual token objects for quick retrieval
    // Store top tokens (by liquidity/volume) for fast access
    const tokensToCache = merged
      .filter(t => t.source === "dex" && (t.liquidityUsd || 0) > 100) // Only cache tokens with liquidity
      .slice(0, 100) // Top 100 only
    
    for (const token of tokensToCache) {
      const key = `token:${token.mint}`
      await storage.set(key, token, { ex: 3600 }) // 1 hour cache
    }
    
    console.log(`[v0] Ingestion cycle: Cached ${tokensToCache.length} token objects`)
    
    // STEP 8: Update health metrics
    const latestMint = merged.find(t => t.createdAt)
    const health: IngestionHealth = {
      lastMintSeen: latestMint ? {
        timestamp: latestMint.createdAt || Date.now(),
        mint: latestMint.mint,
      } : undefined,
      lastDexUpdate: dexTokens.length > 0 ? Date.now() : undefined,
      lastHeliusEvent: heliusTokens.length > 0 ? Date.now() : undefined,
      ingestionLatencyMs: Date.now() - startTime,
      freshCount: finalFresh.length,
      lastRunAt: Date.now(),
      sources: {
        dexCount: dexTokens.length,
        pumpCount: pumpTokens.length,
        heliusCount: heliusTokens.length,
        mergedCount: merged.length,
        insertedFreshCount: freshCandidates.length,
        skippedSeenCount,
      },
      errors,
    }
    
    await storage.set("ingest:health", health, { ex: 3600 })
    
    console.log("[v0] Ingestion cycle: Complete", {
      merged: merged.length,
      fresh: finalFresh.length,
      latency: health.ingestionLatencyMs,
    })
    
    return NextResponse.json({
      ok: true,
      health,
      insertedFreshCount: freshCandidates.length,
      mergedCount: merged.length,
    })
    
  } catch (error) {
    console.error("[v0] Ingestion cycle error:", error)
    
    const health: IngestionHealth = {
      ingestionLatencyMs: Date.now() - startTime,
      freshCount: 0,
      lastRunAt: Date.now(),
      sources: {
        dexCount: 0,
        pumpCount: 0,
        heliusCount: 0,
        mergedCount: 0,
        insertedFreshCount: 0,
        skippedSeenCount: 0,
      },
      errors: [error instanceof Error ? error.message : "Unknown error"],
    }
    
    await storage.set("ingest:health", health, { ex: 3600 })
    
    return NextResponse.json({
      ok: false,
      error: "Ingestion cycle failed",
      details: error instanceof Error ? error.message : "Unknown error",
      health,
    }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
export const maxDuration = 30
