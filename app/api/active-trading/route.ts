import { NextResponse } from "next/server"
import { filterSuppressed } from "@/lib/suppress"

// Simple in-memory cache
let cachedData: { tokens: any[]; updatedAt: string } | null = null
let cacheTimestamp = 0
const CACHE_TTL = 60000 // 60 seconds

export async function GET() {
  try {
    // Check feature flag
    const isEnabled = process.env.NEXT_PUBLIC_ACTIVE_TRADING_ENABLED === "true"
    
    if (!isEnabled) {
      return NextResponse.json({
        tokens: [],
        updatedAt: new Date().toISOString(),
        source: "disabled",
      })
    }

    // Check cache
    const now = Date.now()
    if (cachedData && now - cacheTimestamp < CACHE_TTL) {
      return NextResponse.json(cachedData)
    }

    // Fetch top boosted tokens from Dexscreener
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout

    try {
      // First, get boosted token addresses
      const boostResponse = await fetch(
        "https://api.dexscreener.com/token-boosts/top/v1",
        {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "User-Agent": "SOLRAD/1.0",
          },
        }
      )

      clearTimeout(timeoutId)

      if (!boostResponse.ok) {
        throw new Error(`Dexscreener API error: ${boostResponse.status}`)
      }

      const boosts = await boostResponse.json()
      
      // Filter for Solana tokens only and get addresses
      const solanaBoosts = Array.isArray(boosts) 
        ? boosts.filter((b: any) => b.chainId === "solana").slice(0, 20)
        : []

      if (solanaBoosts.length === 0) {
        cachedData = {
          tokens: [],
          updatedAt: new Date().toISOString(),
        }
        cacheTimestamp = now
        return NextResponse.json(cachedData)
      }

      // Get token addresses
      const addresses = solanaBoosts.map((b: any) => b.tokenAddress).filter(Boolean)
      
      // Fetch detailed token data in batches of 30
      const BATCH_SIZE = 30
      const allTokens: any[] = []

      for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
        const batch = addresses.slice(i, i + BATCH_SIZE)
        const addressParam = batch.join(",")
        
        const detailResponse = await fetch(
          `https://api.dexscreener.com/latest/dex/tokens/${addressParam}`,
          {
            headers: {
              Accept: "application/json",
              "User-Agent": "SOLRAD/1.0",
            },
          }
        )

        if (detailResponse.ok) {
          const detailData = await detailResponse.json()
          
          if (detailData.pairs && Array.isArray(detailData.pairs)) {
            // Group pairs by token and pick best liquidity
            const pairsByToken = new Map<string, any[]>()
            
            for (const pair of detailData.pairs) {
              if (pair.chainId !== "solana") continue
              const addr = pair.baseToken.address.toLowerCase()
              if (!pairsByToken.has(addr)) {
                pairsByToken.set(addr, [])
              }
              pairsByToken.get(addr)!.push(pair)
            }

            // For each token, use pair with highest liquidity
            for (const [addr, pairs] of pairsByToken.entries()) {
              const bestPair = pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0]
              allTokens.push(bestPair)
            }
          }
        }

        // Small delay between batches
        if (i + BATCH_SIZE < addresses.length) {
          await new Promise((resolve) => setTimeout(resolve, 200))
        }
      }

      // Transform to our format
      const tokens = allTokens.slice(0, 20).map((pair: any, index: number) => ({
        address: pair.baseToken?.address || "",
        symbol: pair.baseToken?.symbol || "UNKNOWN",
        name: pair.baseToken?.name || "Unknown Token",
        chain: "solana",
        trendingRank: index + 1,
        priceUsd: parseFloat(pair.priceUsd || "0"),
        priceChange24h: pair.priceChange?.h24 || 0,
        volume24h: pair.volume?.h24 || 0,
        liquidity: pair.liquidity?.usd || 0,
        txns24h: (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0),
        imageUrl: pair.info?.imageUrl,
        pairUrl: pair.url,
        dexId: pair.dexId,
      }))

      // suppression filter
      const publicTokens = await filterSuppressed(tokens)

      cachedData = {
        tokens: publicTokens,
        updatedAt: new Date().toISOString(),
      }
      cacheTimestamp = now

      return NextResponse.json(cachedData)
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      // Return cached data if available, even if stale
      if (cachedData) {
        return NextResponse.json({
          ...cachedData,
          warning: "Using stale data due to API error",
        })
      }

      // Return empty with error
      return NextResponse.json({
        tokens: [],
        updatedAt: new Date().toISOString(),
        error: fetchError.name === "AbortError" ? "Request timeout" : "API unavailable",
      })
    }
  } catch (error: any) {
    console.error("[v0] Active trading route error:", error)
    
    // Always return 200 with empty tokens
    return NextResponse.json({
      tokens: [],
      updatedAt: new Date().toISOString(),
      error: error.message || "Unknown error",
    })
  }
}
