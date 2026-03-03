import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { verifyOpsPasswordFromHeader } from "@/lib/auth-helpers"

interface DiscoveredMint {
  mint: string
  firstSeenAt: number
  lastCheckedAt: number
  source: "helius"
  pairAddress?: string
  dexUrl?: string
  pairCreatedAt?: number
  symbol?: string
  name?: string
  resolved: boolean
}

/**
 * POST /api/admin/ingest/retry-resolution
 * PART A: Retry pair resolution for unresolved mints
 * Protected with OPS_PASSWORD - same auth as /admin pages
 */
export async function POST(request: NextRequest) {
  // Auth check using helper
  if (!verifyOpsPasswordFromHeader(request)) {
    console.warn("[v0] /api/admin/ingest/retry-resolution: Unauthorized attempt")
    return NextResponse.json(
      { error: "Access denied" },
      { status: 401 }
    )
  }
  
  try {
    
    console.log("[v0] Retry resolution: Starting...")
    
    // Scan all mint: keys
    const unresolvedMints: DiscoveredMint[] = []
    let cursor = "0"
    
    do {
      const [nextCursor, keys] = await kv.scan(cursor, {
        match: "mint:*",
        count: 100,
      })
      
      cursor = nextCursor
      
      // Get values for these keys
      if (keys.length > 0) {
        const values = await Promise.all(
          keys.map(key => kv.get<DiscoveredMint>(key))
        )
        
        // Filter to unresolved only
        for (const mint of values) {
          if (mint && !mint.resolved) {
            unresolvedMints.push(mint)
          }
        }
      }
    } while (cursor !== "0")
    
    console.log("[v0] Retry resolution: Found", unresolvedMints.length, "unresolved mints")
    
    // Attempt resolution for each
    let resolvedCount = 0
    let rateLimited = false
    const now = Date.now()
    
    for (const mint of unresolvedMints) {
      if (rateLimited) break
      
      try {
        const dexRes = await fetch(
          `https://api.dexscreener.com/latest/dex/tokens/${mint.mint}`,
          {
            headers: { "User-Agent": "SOLRAD/1.0" },
            signal: AbortSignal.timeout(5000),
          }
        )
        
        if (dexRes.status === 429) {
          console.warn("[v0] Retry resolution: Hit 429 rate limit")
          rateLimited = true
          break
        }
        
        if (dexRes.ok) {
          const dexData = await dexRes.json()
          
          if (dexData.pairs && dexData.pairs.length > 0) {
            const bestPair = dexData.pairs
              .filter((p: any) => p.chainId === "solana")
              .sort((a: any, b: any) => {
                const liqA = a.liquidity?.usd || 0
                const liqB = b.liquidity?.usd || 0
                if (liqB !== liqA) return liqB - liqA
                
                const volA = a.volume?.h24 || 0
                const volB = b.volume?.h24 || 0
                return volB - volA
              })[0]
            
            if (bestPair) {
              mint.pairAddress = bestPair.pairAddress
              mint.dexUrl = bestPair.url
              mint.pairCreatedAt = bestPair.pairCreatedAt
              mint.symbol = bestPair.baseToken?.symbol
              mint.name = bestPair.baseToken?.name
              mint.resolved = true
              mint.lastCheckedAt = now
              
              await kv.set(`mint:${mint.mint}`, mint, { ex: 60 * 60 * 24 * 90 })
              resolvedCount++
              
              console.log("[v0] Retry resolution: Resolved", mint.mint.slice(0, 8), bestPair.baseToken?.symbol)
            }
          }
        }
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        // Continue to next mint
      }
    }
    
    console.log("[v0] Retry resolution: Complete", {
      attempted: unresolvedMints.length,
      resolved: resolvedCount,
      rateLimited,
    })
    
    return NextResponse.json({
      ok: true,
      attempted: unresolvedMints.length,
      resolved: resolvedCount,
      rateLimited,
    })
  } catch (error) {
    console.error("[v0] Retry resolution error:", error)
    // Safe error response - no stack traces
    return NextResponse.json(
      { error: "Resolution process failed. Please try again." },
      { status: 500 }
    )
  }
}

export const dynamic = "force-dynamic"
export const maxDuration = 300 // Allow up to 5 minutes for resolution
