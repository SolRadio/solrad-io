export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

// PART B: Response shape compatible with use-sol-price hook
interface PriceResponse {
  price: number
  change24h: number
  updatedAt: number
  stale: boolean
  source: "dexscreener" | "cache"
}

// KV cache key and TTL
const CACHE_VERSION = "v3" // Increment to bust cache (removed Jupiter)
const KV_KEY = `solrad:sol:price:${CACHE_VERSION}`
const KV_TTL_SECONDS = 300 // 5 minutes (increased to reduce API calls)

// In-memory fallback cache (for when KV is unavailable)
let memoryCache: PriceResponse | null = null

// Next.js route revalidation
export const revalidate = 300 // Match KV TTL

// Provider URLs (DexScreener only - Jupiter removed)
const DEXSCREENER_URL = "https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112" // Wrapped SOL

// Safe fetch helper with cache: no-store
async function safeFetch(url: string, timeout = 5000): Promise<{ ok: boolean; data?: unknown; status?: number }> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json", "User-Agent": "SOLRAD/1.0" },
      cache: "no-store",
    })

    clearTimeout(timeoutId)

    // PART B: Check content-type before parsing JSON
    const contentType = res.headers.get("content-type") || ""
    if (!contentType.includes("application/json")) {
      const text = await res.text()
      console.warn(`[sol-price] Non-JSON response from ${url}: ${text.slice(0, 100)}`)
      return { ok: false, status: res.status }
    }

    if (!res.ok) {
      const text = await res.text()
      console.warn(`[sol-price] Error ${res.status} from ${url}: ${text.slice(0, 100)}`)
      return { ok: false, status: res.status }
    }

    const data = await res.json()
    return { ok: true, data }
  } catch (error) {
    console.warn(`[sol-price] Fetch failed for ${url}:`, error)
    return { ok: false }
  }
}

// DexScreener provider (only SOL price source)
async function fetchFromDexScreener(): Promise<PriceResponse | null> {
  try {
    const result = await safeFetch(DEXSCREENER_URL)
    if (!result.ok || !result.data) return null

    const data = result.data as {
      pairs?: Array<{
        priceUsd?: string
        priceChange?: { h24?: number }
        quoteToken?: { symbol?: string }
        liquidity?: { usd?: number }
      }>
    }

    if (!data?.pairs || data.pairs.length === 0) return null

    // Find best pair: prefer USDC/USDT/USD quote tokens, sort by liquidity
    const stableQuotes = ["USDC", "USDT", "USD"]
    
    const stablePairs = data.pairs.filter((pair) => {
      const quoteSymbol = pair.quoteToken?.symbol?.toUpperCase()
      return quoteSymbol && stableQuotes.includes(quoteSymbol)
    })

    const pairsToConsider = stablePairs.length > 0 ? stablePairs : data.pairs

    // Sort by liquidity descending
    const sortedPairs = pairsToConsider.sort((a, b) => {
      const liqA = a.liquidity?.usd ?? 0
      const liqB = b.liquidity?.usd ?? 0
      return liqB - liqA
    })

    const bestPair = sortedPairs[0]
    if (!bestPair?.priceUsd) return null

    const price = Number(bestPair.priceUsd)

    // Sanity check: SOL price should be between $5 and $2000
    if (Number.isNaN(price) || price <= 0 || price < 5 || price > 2000) {
      if (process.env.NODE_ENV !== "production") {
        console.log("[v0] DexScreener: Price out of range", { price })
      }
      return null
    }

    const change24h = bestPair.priceChange?.h24 ?? 0

    if (process.env.NODE_ENV !== "production") {
      console.log("[v0] DexScreener: Best pair selected", {
        quoteToken: bestPair.quoteToken?.symbol,
        liquidityUsd: bestPair.liquidity?.usd,
        priceUsd: price,
      })
    }

    return {
      price,
      change24h,
      updatedAt: Date.now(),
      stale: false,
      source: "dexscreener",
    }
  } catch (error) {
    console.warn("[sol-price] DexScreener fetch failed:", error)
    return null
  }
}

// Get cached price from KV
async function getCachedPrice(): Promise<PriceResponse | null> {
  try {
    const cached = await kv.get<PriceResponse>(KV_KEY)
    if (cached) return cached
  } catch (e) {
    console.warn("[sol-price] KV read failed:", e)
  }
  return memoryCache
}

// PART B: Save price to KV
async function setCachedPrice(price: PriceResponse): Promise<void> {
  memoryCache = price
  try {
    await kv.set(KV_KEY, price, { ex: KV_TTL_SECONDS })
  } catch (e) {
    console.warn("[sol-price] KV write failed:", e)
  }
}

export async function GET() {
  // CACHE-FIRST: Check if we have valid cached data before making any API calls
  // This prevents rate limiting by only fetching when cache is expired
  const cached = await getCachedPrice()
  
  if (cached && Date.now() - cached.updatedAt < KV_TTL_SECONDS * 1000) {
    // Cache is still valid - return it without hitting external APIs
    const response = NextResponse.json(cached)
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    )
    return response
  }

  // Cache expired or missing - fetch fresh data from DexScreener only
  const priceData = await fetchFromDexScreener()

  // If we got fresh data, cache it and return
  if (priceData) {
    await setCachedPrice(priceData)
    
    const response = NextResponse.json(priceData)
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    )
    return response
  }

  // DexScreener failed - return stale cache if available
  if (cached) {
    const staleResponse: PriceResponse = {
      ...cached,
      stale: true,
      source: "cache",
    }
    
    const response = NextResponse.json(staleResponse)
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    )
    return response
  }

  // No cache available - return zeros (never throw, always 200)
  const fallbackResponse: PriceResponse = {
    price: 0,
    change24h: 0,
    updatedAt: Date.now(),
    stale: true,
    source: "cache",
  }

  const response = NextResponse.json(fallbackResponse)
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=300"
  )
  return response
}
