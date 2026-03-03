import { NextResponse } from "next/server"
import { getTokenIndexCached } from "@/lib/intel/tokenIndex"

/**
 * GET /api/token/live?mint=X
 * Lightweight endpoint for live price refresh
 * Uses canonical pairAddress from TokenIndex for consistent pricing
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mint = searchParams.get("mint")
  
  if (!mint || mint.length < 32) {
    return NextResponse.json(
      { error: "Invalid or missing mint address" },
      { status: 400 }
    )
  }
  
  try {
    // Get cached TokenIndex to find canonical pairAddress
    const indexCache = await getTokenIndexCached()
    const token = indexCache.tokens.find(
      (t) => t.mint.toLowerCase() === mint.toLowerCase()
    )
    
    // If not in index, fetch directly from Dexscreener
    if (!token) {
      const res = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${mint}`,
        {
          headers: { "User-Agent": "SOLRAD/1.0" },
          next: { revalidate: 30 },
        }
      )
      
      if (!res.ok) {
        return NextResponse.json(
          { error: "Token not found" },
          { status: 404 }
        )
      }
      
      const data = await res.json()
      const pairs = data.pairs?.filter((p: any) => p.chainId === "solana") || []
      
      if (pairs.length === 0) {
        return NextResponse.json(
          { error: "No Solana pairs found" },
          { status: 404 }
        )
      }
      
      // Pick highest liquidity pair
      const bestPair = pairs.sort(
        (a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
      )[0]
      
      return NextResponse.json({
        mint: bestPair.baseToken.address,
        pairAddress: bestPair.pairAddress,
        priceUsd: Number.parseFloat(bestPair.priceUsd || "0"),
        liquidityUsd: bestPair.liquidity?.usd || 0,
        volume24hUsd: bestPair.volume?.h24 || 0,
        change24hPct: bestPair.priceChange?.h24 || 0,
        dexUrl: bestPair.url,
        updatedAt: Date.now(),
        source: "dexscreener-direct",
      })
    }
    
    // Use canonical pairAddress from index
    const pairAddress = token.pairAddress
    
    // Fetch fresh price using pair endpoint if we have pairAddress
    if (pairAddress) {
      const res = await fetch(
        `https://api.dexscreener.com/latest/dex/pairs/solana/${pairAddress}`,
        {
          headers: { "User-Agent": "SOLRAD/1.0" },
          next: { revalidate: 30 },
        }
      )
      
      if (res.ok) {
        const data = await res.json()
        const pair = data.pair || data.pairs?.[0]
        
        if (pair) {
          return NextResponse.json({
            mint: token.mint,
            pairAddress: pair.pairAddress,
            priceUsd: Number.parseFloat(pair.priceUsd || "0"),
            liquidityUsd: pair.liquidity?.usd || 0,
            volume24hUsd: pair.volume?.h24 || 0,
            change24hPct: pair.priceChange?.h24 || 0,
            dexUrl: pair.url || token.dexUrl,
            updatedAt: Date.now(),
            source: "dexscreener-pair",
          })
        }
      }
    }
    
    // Fallback: return cached data from index
    return NextResponse.json({
      mint: token.mint,
      pairAddress: token.pairAddress,
      priceUsd: token.priceUsd || 0,
      liquidityUsd: token.liquidityUsd || 0,
      volume24hUsd: token.volume24hUsd || 0,
      change24hPct: token.change24hPct || 0,
      dexUrl: token.dexUrl,
      updatedAt: indexCache.generatedAt,
      source: "index-cached",
    })
  } catch (error) {
    console.error("[v0] /api/token/live error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export const runtime = "edge"
