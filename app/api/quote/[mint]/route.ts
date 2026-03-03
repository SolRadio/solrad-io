import { NextResponse } from "next/server"
import { storage } from "@/lib/storage"
import { getTokenIndexCached } from "@/lib/intel/tokenIndex"

/**
 * PART B: Robust quote fetching with caching + 429 handling
 * 
 * - Looks up TokenIndex to get canonical pairAddress + dexUrl
 * - Attempts to fetch fresh quote from Dexscreener
 * - Handles 429 / non-JSON responses gracefully
 * - Returns cached quote with { stale: true } if rate limited
 */

const QUOTE_CACHE_PREFIX = "solrad:quote:"
const QUOTE_CACHE_TTL = 30 // 30 seconds

interface CachedQuote {
  mint: string
  pairAddress: string | null
  dexUrl: string | null
  priceUsd: number
  change24hPct: number
  volume24h: number
  liquidityUsd: number
  updatedAt: number
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ mint: string }> }
) {
  const { mint } = await params
  
  if (!mint || mint.length < 32) {
    return NextResponse.json(
      { error: "Invalid mint address", ok: false },
      { status: 400 }
    )
  }

  const mintLower = mint.toLowerCase()
  const cacheKey = `${QUOTE_CACHE_PREFIX}${mintLower}`

  try {
    // Step 1: Look up TokenIndex for canonical pairAddress + dexUrl
    let canonicalPairAddress: string | null = null
    let canonicalDexUrl: string | null = null
    
    try {
      const indexCache = await getTokenIndexCached()
      const tokenIntel = indexCache.tokens.find(
        (t) => t.mint.toLowerCase() === mintLower
      )
      if (tokenIntel) {
        canonicalPairAddress = tokenIntel.pairAddress ?? null
        canonicalDexUrl = tokenIntel.dexUrl ?? null
      }
    } catch (err) {
      // TokenIndex lookup failed - continue without canonical data
      console.warn("[v0] /api/quote: TokenIndex lookup failed:", err)
    }

    // Step 2: Check cache first
    let cached: CachedQuote | null = null
    try {
      const cachedData = await storage.get(cacheKey)
      if (cachedData) {
        cached = typeof cachedData === "string" ? JSON.parse(cachedData) : cachedData
      }
    } catch (err) {
      // Cache read failed - continue
    }

    // If cache is fresh (< 30s), return it
    if (cached && (Date.now() - cached.updatedAt) < QUOTE_CACHE_TTL * 1000) {
      // Sprint 3: Cache fresh quote responses
      const response = NextResponse.json({
        ...cached,
        updatedAt: new Date(cached.updatedAt).toISOString(), // PART 1: ISO string format
        stale: false,
        cached: true,
        rateLimited: false,
        ok: true,
      })
      
      response.headers.set(
        "Cache-Control",
        "public, s-maxage=30, stale-while-revalidate=120"
      )
      
      return response
    }

    // Step 3: Fetch fresh from Dexscreener
    // Use pairAddress if available for more accurate/faster lookup
    const fetchUrl = canonicalPairAddress
      ? `https://api.dexscreener.com/latest/dex/pairs/solana/${canonicalPairAddress}`
      : `https://api.dexscreener.com/latest/dex/tokens/${mint}`

    // PART G: Debug log
    console.log("[v0] /api/quote: Fetching", { mint, fetchUrl: fetchUrl.slice(0, 80) })

    let res: Response
    try {
      res = await fetch(fetchUrl, {
        headers: { "User-Agent": "SOLRAD/1.0" },
        signal: AbortSignal.timeout(10000), // 10s timeout
      })
    } catch (fetchErr) {
      // Network error - return cached if available
      console.error("[v0] /api/quote: Fetch error:", fetchErr)
      if (cached) {
        return NextResponse.json({
          ...cached,
          updatedAt: new Date(cached.updatedAt).toISOString(), // PART 1
          stale: true,
          cached: true,
          rateLimited: false,
          fetchError: true,
          ok: true,
        })
      }
      return NextResponse.json(
        { 
          error: "Failed to fetch quote", 
          ok: false, 
          fetchError: true,
          updatedAt: new Date().toISOString(), // PART 1
        },
        { status: 502 }
      )
    }

    // PART B: Handle 429 / non-JSON responses
    if (!res.ok) {
      // PART G: Log rate limit events
      const statusCode = res.status
      let bodySnippet = ""
      try {
        const textBody = await res.text()
        bodySnippet = textBody.slice(0, 120)
      } catch {
        // Ignore
      }
      
      console.warn("[v0] /api/quote: Upstream error", { 
        statusCode, 
        bodySnippet,
        mint: mint.slice(0, 8),
      })

      // If rate limited (429), return cached quote as stale
      if (statusCode === 429) {
        if (cached) {
          return NextResponse.json({
            ...cached,
            updatedAt: new Date(cached.updatedAt).toISOString(), // PART 1
            stale: true,
            cached: true,
            rateLimited: true,
            ok: true,
          })
        }
        return NextResponse.json(
          { 
            error: "Rate limited", 
            ok: false, 
            rateLimited: true,
            updatedAt: new Date().toISOString(), // PART 1
          },
          { status: 429 }
        )
      }

      // Other errors - return cached if available
      if (cached) {
        return NextResponse.json({
          ...cached,
          updatedAt: new Date(cached.updatedAt).toISOString(), // PART 1
          stale: true,
          cached: true,
          rateLimited: false,
          ok: true,
        })
      }
      return NextResponse.json(
        { 
          error: "Upstream error", 
          ok: false,
          updatedAt: new Date().toISOString(), // PART 1
        },
        { status: statusCode }
      )
    }

    // PART B: Only parse JSON if content-type includes "application/json"
    const contentType = res.headers.get("content-type") || ""
    if (!contentType.includes("application/json")) {
      const textBody = await res.text()
      console.warn("[v0] /api/quote: Non-JSON response", {
        contentType,
        bodySnippet: textBody.slice(0, 120),
      })
      
      if (cached) {
        return NextResponse.json({
          ...cached,
          updatedAt: new Date(cached.updatedAt).toISOString(), // PART 1
          stale: true,
          cached: true,
          rateLimited: false,
          nonJsonResponse: true,
          ok: true,
        })
      }
      return NextResponse.json(
        { 
          error: "Non-JSON response from upstream", 
          ok: false,
          updatedAt: new Date().toISOString(), // PART 1
        },
        { status: 502 }
      )
    }

    // Parse JSON
    const data = await res.json()

    // Extract best pair
    let bestPair: any = null
    if (canonicalPairAddress && data.pair) {
      // Direct pair lookup
      bestPair = data.pair
    } else if (data.pairs && Array.isArray(data.pairs)) {
      // Token lookup - filter to Solana and pick highest liquidity
      const solanaPairs = data.pairs.filter((p: any) => p.chainId === "solana")
      if (solanaPairs.length > 0) {
        bestPair = solanaPairs.sort(
          (a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
        )[0]
      }
    }

    if (!bestPair) {
      if (cached) {
        return NextResponse.json({
          ...cached,
          updatedAt: new Date(cached.updatedAt).toISOString(), // PART 1
          stale: true,
          cached: true,
          rateLimited: false,
          ok: true,
        })
      }
      return NextResponse.json(
        { 
          error: "No pairs found", 
          ok: false,
          updatedAt: new Date().toISOString(), // PART 1
        },
        { status: 404 }
      )
    }

    // Build fresh quote
    const freshQuote: CachedQuote = {
      mint: bestPair.baseToken?.address || mint,
      pairAddress: bestPair.pairAddress || canonicalPairAddress,
      dexUrl: bestPair.url || canonicalDexUrl || `https://dexscreener.com/solana/${bestPair.pairAddress || mint}`,
      priceUsd: parseFloat(bestPair.priceUsd || "0"),
      change24hPct: bestPair.priceChange?.h24 || 0,
      volume24h: bestPair.volume?.h24 || 0,
      liquidityUsd: bestPair.liquidity?.usd || 0,
      updatedAt: Date.now(),
    }

    // Cache the fresh quote
    try {
      await storage.set(cacheKey, freshQuote, { ex: QUOTE_CACHE_TTL })
    } catch (cacheErr) {
      // Cache write failed - continue
      console.warn("[v0] /api/quote: Cache write failed:", cacheErr)
    }

    // PART 1: Always include updatedAt in ISO format
    // Sprint 3: Cache fresh quote responses
    const response = NextResponse.json({
      ...freshQuote,
      updatedAt: new Date(freshQuote.updatedAt).toISOString(),
      stale: false,
      cached: false,
      rateLimited: false,
      ok: true,
    })
    
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=30, stale-while-revalidate=120"
    )
    
    return response
  } catch (error) {
    console.error("[v0] /api/quote error:", error)
    return NextResponse.json(
      { error: "Internal server error", ok: false },
      { status: 500 }
    )
  }
}
