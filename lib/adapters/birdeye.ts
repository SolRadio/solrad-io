/**
 * Birdeye API adapter for Solana token discovery
 * Free tier - no API key required for basic endpoints
 * Fetches trending tokens with volume and liquidity filters
 */

import type { TokenData, Token } from "../types"

const BIRDEYE_API_BASE = "https://public-api.birdeye.so"

interface BirdeyeToken {
  address: string
  symbol?: string
  name?: string
  decimals?: number
  logoURI?: string
  v24hUSD?: number
  liquidity?: number
  mc?: number
}

interface BirdeyeResponse {
  success: boolean
  data?: {
    tokens?: BirdeyeToken[]
    updateUnixTime?: number
  }
}

/**
 * Fetch trending tokens from Birdeye
 * Uses public token list sorted by 24h volume
 */
export async function fetchBirdeyeTokens(): Promise<TokenData[]> {
  try {
    console.log("[v0] Birdeye: Fetching trending tokens...")
    
    // Use Birdeye's public token list endpoint (trending by volume)
    const url = `${BIRDEYE_API_BASE}/defi/tokenlist?sort_by=v24hUSD&sort_type=desc&offset=0&limit=50`
    
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
    })

    if (!response.ok) {
      console.error(`[v0] Birdeye: HTTP ${response.status} - ${response.statusText}`)
      return []
    }

    const json = await response.json() as BirdeyeResponse

    if (!json.success || !json.data?.tokens) {
      console.error("[v0] Birdeye: Invalid response format")
      return []
    }

    const tokens: TokenData[] = json.data.tokens
      .filter(t => {
        // Filter for quality: require min liquidity and volume
        const hasMinLiquidity = (t.liquidity ?? 0) >= 5000
        const hasMinVolume = (t.v24hUSD ?? 0) >= 1000
        return t.address && t.symbol && hasMinLiquidity && hasMinVolume
      })
      .map(t => ({
        address: t.address,
        symbol: t.symbol || "???",
        name: t.name || t.symbol || "Unknown",
        chain: "solana",
        priceUsd: 0, // Will be fetched separately
        priceChange24h: 0,
        volume24h: t.v24hUSD ?? 0,
        liquidity: t.liquidity ?? 0,
        marketCap: t.mc,
        imageUrl: t.logoURI,
        source: "birdeye" as const,
        sourceUpdatedAt: Date.now(),
      }))

    console.log(`[v0] Birdeye: Found ${tokens.length} quality tokens (filtered by liquidity ≥$5k, volume ≥$1k)`)
    return tokens
  } catch (error) {
    console.error("[v0] Birdeye: Error fetching tokens", error instanceof Error ? error.message : "Unknown error")
    return []
  }
}
