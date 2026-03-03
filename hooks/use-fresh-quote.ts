"use client"

import { useState, useEffect, useCallback } from "react"

interface FreshQuote {
  mint: string
  priceUsd: number | null
  priceChange24h: number | null
  volume24h: number | null
  liquidityUsd: number | null
  fdv: number | null
  mcap: number | null
  pairAddress: string | null
  dexUrl: string | null
  updatedAt: number
  stale?: boolean
  rateLimited?: boolean
}

interface UseFreshQuoteOptions {
  /** Whether to enable polling */
  enabled?: boolean
  /** Polling interval in ms (default 30000 = 30s) */
  pollInterval?: number
}

// P0-02: Module-level shared cache and polling registry
// This prevents N×30s polling storm when multiple drawers open
type QuoteCache = Map<string, FreshQuote>
type PollingRegistry = Map<string, { interval: NodeJS.Timeout; listenerCount: number }>
type ListenerMap = Map<string, Set<(quote: FreshQuote | null) => void>>

const quoteCache: QuoteCache = new Map()
const pollingRegistry: PollingRegistry = new Map()
const listeners: ListenerMap = new Map()

// Fetch quote and update all listeners for a mint
async function fetchAndBroadcast(mint: string) {
  // Ensure listeners Map exists
  if (!listeners.has(mint)) {
    listeners.set(mint, new Set())
  }
  
  const mintListeners = listeners.get(mint)!
  
  try {
    // Use AbortController with 6s timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000)
    
    const res = await fetch(`/api/quote/${encodeURIComponent(mint)}`, {
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    
    // If response not ok, broadcast null and return
    if (!res.ok) {
      quoteCache.delete(mint) // Clear stale cache
      mintListeners.forEach(listener => listener(null))
      return
    }
    
    // Parse JSON
    const data = await res.json()
    
    let quote: FreshQuote | null = null
    
    if (data.ok && data.mint) {
      quote = {
        mint: data.mint,
        priceUsd: data.priceUsd,
        priceChange24h: data.change24hPct,
        volume24h: data.volume24h,
        liquidityUsd: data.liquidityUsd,
        fdv: null,
        mcap: null,
        pairAddress: data.pairAddress,
        dexUrl: data.dexUrl,
        updatedAt: data.updatedAt ?? Date.now(),
        stale: data.stale,
        rateLimited: data.rateLimited,
      }
      quoteCache.set(mint, quote)
    } else {
      // Invalid data, clear cache
      quoteCache.delete(mint)
    }
    
    // Broadcast parsed data to all listeners
    mintListeners.forEach(listener => listener(quote))
  } catch (err) {
    console.error("[v0] Failed to fetch quote:", err)
    // Broadcast null on error
    mintListeners.forEach(listener => listener(null))
  }
}

// Start polling for a mint (singleton - only one interval per mint)
function startPolling(mint: string, interval: number) {
  const existing = pollingRegistry.get(mint)
  
  if (existing) {
    // Already polling, just increment listener count
    existing.listenerCount++
    return
  }
  
  // Start new polling interval
  const timer = setInterval(() => fetchAndBroadcast(mint), interval)
  pollingRegistry.set(mint, { interval: timer, listenerCount: 1 })
  
  // Fetch immediately on first start
  fetchAndBroadcast(mint)
}

// Stop polling for a mint (only when no listeners left)
function stopPolling(mint: string) {
  const entry = pollingRegistry.get(mint)
  if (!entry) return
  
  entry.listenerCount--
  
  if (entry.listenerCount <= 0) {
    clearInterval(entry.interval)
    pollingRegistry.delete(mint)
    // Clean up empty listener Set to avoid memory leak
    if (listeners.has(mint)) {
      const mintListeners = listeners.get(mint)!
      if (mintListeners.size === 0) {
        listeners.delete(mint)
      }
    }
    // Clean up cache for unmounted mints
    quoteCache.delete(mint)
  }
}

/**
 * P0-02: Rewritten to use shared cache and singleton polling
 * Multiple components using same mint share ONE polling interval
 * Prevents N×30s polling storm when multiple drawers open
 */
export function useFreshQuote(
  mint: string | undefined,
  options: UseFreshQuoteOptions = {}
) {
  const { enabled = true, pollInterval = 30000 } = options
  
  const [quote, setQuote] = useState<FreshQuote | null>(() => {
    // Initialize from cache if available
    return mint ? quoteCache.get(mint) || null : null
  })
  const [rateLimited, setRateLimited] = useState(false)

  useEffect(() => {
    if (!enabled || !mint) {
      return
    }
    
    // Register listener for this mint
    if (!listeners.has(mint)) {
      listeners.set(mint, new Set())
    }
    
    const listener = (newQuote: FreshQuote | null) => {
      setQuote(newQuote)
      setRateLimited(newQuote?.rateLimited || false)
    }
    
    listeners.get(mint)!.add(listener)
    
    // If cache has data, use it immediately
    const cached = quoteCache.get(mint)
    if (cached) {
      setQuote(cached)
      setRateLimited(cached.rateLimited || false)
    }
    
    // Start polling (singleton - only starts if not already polling)
    // This will call fetchAndBroadcast immediately on first mount
    startPolling(mint, pollInterval)
    
    return () => {
      // Unregister listener
      const mintListeners = listeners.get(mint)
      if (mintListeners) {
        mintListeners.delete(listener)
        if (mintListeners.size === 0) {
          listeners.delete(mint)
        }
      }
      
      // Stop polling if no more listeners
      stopPolling(mint)
    }
  }, [enabled, mint, pollInterval])

  // Time since last update
  const ageMinutes = quote?.updatedAt 
    ? Math.round((Date.now() - quote.updatedAt) / 60000)
    : null

  return {
    quote,
    loading: false, // Loading state not needed with shared cache
    error: null, // Error handling done in fetchAndBroadcast
    ageMinutes,
    rateLimited,
    refetch: () => mint && fetchAndBroadcast(mint),
  }
}
