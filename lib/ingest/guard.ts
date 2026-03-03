import { storage } from "../storage"
import type { SourceToken } from "./sources"

const SEEN_TTL = 86400 // 24 hours in seconds
const FRESH_TTL = 900 // 15 minutes in seconds

export interface MergedToken extends SourceToken {
  sources: string[] // Which sources found this mint
}

/**
 * Merge and deduplicate tokens from multiple sources
 * Groups by canonical mint address and tracks which sources found each token
 */
export function mergeAndDedupe(sources: SourceToken[][]): MergedToken[] {
  const mintMap = new Map<string, MergedToken>()
  
  for (const sourceList of sources) {
    for (const token of sourceList) {
      const existing = mintMap.get(token.mint)
      
      if (existing) {
        // Merge: add source and prefer tokens with more data
        existing.sources.push(token.source)
        
        // Prefer DexScreener data (has prices, liquidity)
        if (token.source === "dex") {
          existing.pairAddress = token.pairAddress || existing.pairAddress
          existing.dexUrl = token.dexUrl || existing.dexUrl
          existing.symbol = token.symbol || existing.symbol
          existing.name = token.name || existing.name
          existing.priceUsd = token.priceUsd || existing.priceUsd
          existing.liquidityUsd = token.liquidityUsd || existing.liquidityUsd
          existing.volume24h = token.volume24h || existing.volume24h
          existing.info = token.info || existing.info
        }
        
        // Use earliest createdAt
        if (token.createdAt && (!existing.createdAt || token.createdAt < existing.createdAt)) {
          existing.createdAt = token.createdAt
        }
      } else {
        // New mint
        mintMap.set(token.mint, {
          ...token,
          sources: [token.source],
        })
      }
    }
  }
  
  return Array.from(mintMap.values())
}

/**
 * Filter tokens for Fresh Signals injection
 * Only includes tokens that aren't already "fresh" (within 15-minute window)
 * Always marks tokens as "seen" (24-hour window)
 */
export async function filterNewFresh(merged: MergedToken[]): Promise<MergedToken[]> {
  const freshCandidates: MergedToken[] = []
  const now = Date.now()
  
  for (const token of merged) {
    // Check if already fresh
    const freshKey = `fresh:mint:${token.mint}`
    const isFresh = await storage.get(freshKey)
    
    if (!isFresh) {
      // Not in fresh window - candidate for injection
      freshCandidates.push(token)
      
      // Mark as fresh (15-minute TTL)
      await storage.set(freshKey, now, { ex: FRESH_TTL })
    }
    
    // Always mark as seen (24-hour TTL)
    const seenKey = `seen:mint:${token.mint}`
    const seen = await storage.get(seenKey)
    
    if (!seen) {
      await storage.set(seenKey, now, { ex: SEEN_TTL })
    }
  }
  
  console.log(`[v0] Fresh filter: ${freshCandidates.length}/${merged.length} are new fresh candidates`)
  return freshCandidates
}

/**
 * Ensure Fresh Signals has minimum count
 * Backfills with newest mints if below threshold
 */
export async function ensureFreshMinimum(
  currentFresh: MergedToken[],
  allMints: MergedToken[],
  min = 5
): Promise<MergedToken[]> {
  if (currentFresh.length >= min) {
    return currentFresh
  }
  
  console.log(`[v0] Fresh backfill: Current ${currentFresh.length}, need ${min}`)
  
  // Sort all mints by creation time (newest first)
  const sorted = [...allMints].sort((a, b) => {
    const timeA = a.createdAt || 0
    const timeB = b.createdAt || 0
    return timeB - timeA
  })
  
  // Add newest mints until we reach minimum
  const needed = min - currentFresh.length
  const backfill = sorted.slice(0, needed)
  
  console.log(`[v0] Fresh backfill: Adding ${backfill.length} newest mints`)
  
  return [...currentFresh, ...backfill]
}

/**
 * Get current Fresh Signals list from KV
 * Automatically removes stale entries (older than 15 minutes)
 */
export async function getFreshList(): Promise<MergedToken[]> {
  const list = await storage.get<MergedToken[]>("fresh:list") || []
  const now = Date.now()
  const fifteenMinutesAgo = now - (15 * 60 * 1000)
  
  // Filter out stale entries
  const fresh = list.filter(token => {
    const age = token.createdAt || 0
    return age > fifteenMinutesAgo
  })
  
  if (fresh.length !== list.length) {
    console.log(`[v0] Fresh list: Removed ${list.length - fresh.length} stale entries`)
  }
  
  return fresh
}

/**
 * Save Fresh Signals list to KV
 * Automatically sorts by creation time (newest first)
 */
export async function saveFreshList(tokens: MergedToken[]): Promise<void> {
  // Sort by creation time (newest first)
  const sorted = [...tokens].sort((a, b) => {
    const timeA = a.createdAt || 0
    const timeB = b.createdAt || 0
    return timeB - timeA
  })
  
  await storage.set("fresh:list", sorted, { ex: 3600 }) // 1 hour TTL for the list itself
  console.log(`[v0] Fresh list: Saved ${sorted.length} tokens`)
}
