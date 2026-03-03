import { NextResponse } from "next/server"
import { storage } from "@/lib/storage"
import { getHolderConcentration, type HolderConcentrationData } from "@/lib/quicknode"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"

// PART D: Single token refresh endpoint
// Fetches fresh data for a specific mint from Dexscreener
// Caches per-mint for 30 seconds to avoid spamming

const MINT_CACHE_PREFIX = "solrad:mint:"
const MINT_CACHE_TTL = 30 // 30 seconds

interface DexScreenerPair {
  chainId: string
  dexId: string
  url: string
  pairAddress: string
  baseToken: {
    address: string
    name: string
    symbol: string
  }
  priceUsd?: string
  priceNative?: string
  priceChange?: {
    m5?: number
    h1?: number
    h6?: number
    h24?: number
  }
  volume?: {
    h24?: number
  }
  liquidity?: {
    usd?: number
  }
  txns?: {
    h24?: {
      buys?: number
      sells?: number
    }
  }
  fdv?: number
  marketCap?: number
  pairCreatedAt?: number
  info?: {
    imageUrl?: string
    websites?: Array<{ label?: string; url: string }>
    socials?: Array<{ type: string; url: string }>
  }
}

interface TokensResponse {
  schemaVersion: string
  pairs: DexScreenerPair[] | null
}

interface FreshTokenData {
  mint: string
  symbol: string
  name: string
  priceUsd: number
  priceChange24h: number
  volume24h: number
  liquidityUsd: number
  fdv?: number
  mcap?: number
  pairAddress?: string
  pairUrl?: string
  dexUrl?: string // PART D: Canonical dexUrl
  dexId?: string
  imageUrl?: string
  pairCreatedAt?: number
  buys24h?: number
  sells24h?: number
  txns24h?: number
  website?: string
  twitter?: string
  telegram?: string
  discord?: string
  source: "dexscreener"
  sourceUpdatedAt: number
  holders?: HolderConcentrationData | null
}

function isValidSolanaMint(mint: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint)
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ mint: string }> }
) {
  const { mint } = await params

  if (!mint || !isValidSolanaMint(mint)) {
    return NextResponse.json(
      { error: "Invalid mint address" },
      { status: 400 }
    )
  }

  // Rate limit: 30 requests per minute per IP
  const ip = getClientIdentifier(request)
  const { allowed, remaining } = await rateLimit(`token:${ip}`, 30, 60)
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "60", "X-RateLimit-Remaining": "0" } }
    )
  }

  try {
    // Check cache first
    const cacheKey = `${MINT_CACHE_PREFIX}${mint.toLowerCase()}`
    const cached = await storage.get(cacheKey)
    
    if (cached) {
      const data = typeof cached === "string" ? JSON.parse(cached) : cached
      
      // Only return cached data if holders are populated — otherwise fall through to fresh fetch
      const hasValidHolders = data.holders !== null && data.holders !== undefined && data.holders.totalHolders > 0
      if (!hasValidHolders) {
        console.log("[TOKEN-API] Cache bypassed — holders null, fetching fresh from QuickNode")
      } else {
        // PART E: Dev debug log
        if (process.env.NODE_ENV === "development") {
          console.log("[v0] Fresh token (cached):", {
            mint: data.mint,
            priceUsd: data.priceUsd,
            pairUrl: data.pairUrl,
            sourceUpdatedAt: data.sourceUpdatedAt,
          })
        }
        // PART 1: Always include updatedAt
        return NextResponse.json({
          ...data,
          cached: true,
          cacheAgeMs: Date.now() - data.sourceUpdatedAt,
          updatedAt: new Date(data.sourceUpdatedAt).toISOString(),
          stale: false,
          rateLimited: false,
        })
      }
    }

    // Fetch fresh from Dexscreener
    let res: Response
    try {
      res = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${mint}`,
        {
          headers: { "User-Agent": "SOLRAD/1.0" },
          signal: AbortSignal.timeout(10000), // 10s timeout
        }
      )
    } catch (fetchErr) {
      console.error("[v0] /api/token/[mint]: Fetch error:", fetchErr)
      return NextResponse.json(
        { error: "Failed to fetch from upstream", fetchError: true },
        { status: 502 }
      )
    }

    // PART B: Handle 429 / non-JSON responses - DO NOT call res.json() blindly
    if (!res.ok) {
      const statusCode = res.status
      let bodySnippet = ""
      try {
        const textBody = await res.text()
        bodySnippet = textBody.slice(0, 120)
      } catch {
        // Ignore
      }
      
      // PART G: Log rate limit events
      console.warn("[v0] /api/token/[mint]: Upstream error", { 
        statusCode, 
        bodySnippet,
        mint: mint.slice(0, 8),
      })

      if (statusCode === 429) {
        // PART 1: Return cached data if available on 429
        if (cached) {
          return NextResponse.json({
            ...cached,
            stale: true,
            rateLimited: true,
            updatedAt: new Date(cached.sourceUpdatedAt).toISOString(),
          })
        }
        return NextResponse.json(
          { 
            error: "Rate limited by upstream", 
            rateLimited: true,
            updatedAt: new Date().toISOString(),
          },
          { status: 429 }
        )
      }
      
      // PART 1: Return cached data if available on other errors
      if (cached) {
        return NextResponse.json({
          ...cached,
          stale: true,
          rateLimited: false,
          updatedAt: new Date(cached.sourceUpdatedAt).toISOString(),
        })
      }
      
      return NextResponse.json(
        { 
          error: "Failed to fetch from Dexscreener", 
          statusCode,
          updatedAt: new Date().toISOString(),
        },
        { status: 502 }
      )
    }

    // PART 1 & PART B: Only parse JSON if content-type includes "application/json"
    const contentType = res.headers.get("content-type") || ""
    if (!contentType.includes("application/json")) {
      const textBody = await res.text()
      console.warn("[v0] /api/token/[mint]: Non-JSON response", {
        contentType,
        bodySnippet: textBody.slice(0, 120),
      })
      
      // PART 1: Return cached data if available
      if (cached) {
        return NextResponse.json({
          ...cached,
          stale: true,
          rateLimited: false,
          updatedAt: new Date(cached.sourceUpdatedAt).toISOString(),
        })
      }
      
      return NextResponse.json(
        { 
          error: "Non-JSON response from upstream",
          updatedAt: new Date().toISOString(),
        },
        { status: 502 }
      )
    }

    const data = (await res.json()) as TokensResponse

    if (!data.pairs || data.pairs.length === 0) {
      return NextResponse.json(
        { error: "Token not found on Dexscreener" },
        { status: 404 }
      )
    }

    // Filter to Solana pairs and pick highest liquidity
    const solanaPairs = data.pairs.filter((p) => p.chainId === "solana")
    
    if (solanaPairs.length === 0) {
      return NextResponse.json(
        { error: "No Solana pairs found" },
        { status: 404 }
      )
    }

    const bestPair = solanaPairs.sort(
      (a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
    )[0]

    // PART E: Ensure we use priceUsd, NOT priceNative
    // Extract social links from bestPair.info
    const websites = bestPair.info?.websites || []
    const socials = bestPair.info?.socials || []
    
    const website = websites.length > 0 ? websites[0].url : undefined
    const twitter = socials.find(s => 
      s.type.toLowerCase() === 'twitter' || 
      s.url.includes('twitter.com') || 
      s.url.includes('x.com')
    )?.url
    const telegram = socials.find(s => 
      s.type.toLowerCase() === 'telegram' || 
      s.url.includes('t.me')
    )?.url
    const discord = socials.find(s => 
      s.type.toLowerCase() === 'discord' || 
      s.url.includes('discord.com') ||
      s.url.includes('discord.gg')
    )?.url
    
    const freshData: FreshTokenData = {
      mint: bestPair.baseToken.address,
      symbol: bestPair.baseToken.symbol || "UNKNOWN",
      name: bestPair.baseToken.name || "Unknown Token",
      priceUsd: Number.parseFloat(bestPair.priceUsd || "0"), // ALWAYS use priceUsd
      priceChange24h: bestPair.priceChange?.h24 || 0,
      volume24h: bestPair.volume?.h24 || 0,
      liquidityUsd: bestPair.liquidity?.usd || 0,
      fdv: bestPair.fdv,
      mcap: bestPair.marketCap,
      pairAddress: bestPair.pairAddress,
      pairUrl: bestPair.url,
      dexUrl: bestPair.url, // PART D: Canonical dexUrl (same as pairUrl from Dexscreener)
      dexId: bestPair.dexId,
      imageUrl: bestPair.info?.imageUrl,
      pairCreatedAt: bestPair.pairCreatedAt,
      buys24h: bestPair.txns?.h24?.buys,
      sells24h: bestPair.txns?.h24?.sells,
      txns24h: (bestPair.txns?.h24?.buys || 0) + (bestPair.txns?.h24?.sells || 0),
      website,
      twitter,
      telegram,
      discord,
      source: "dexscreener",
      sourceUpdatedAt: Date.now(),
    }

    // Fetch holder concentration from QuickNode (non-blocking — don't fail the whole response)
    try {
      const holderData = await getHolderConcentration(mint)
      console.log("[TOKEN-API] holder result:", JSON.stringify(holderData))
      freshData.holders = holderData
    } catch (holderErr) {
      console.warn("[v0] /api/token/[mint]: Holder fetch failed:", holderErr)
      freshData.holders = null
    }

    // PART E: Dev debug log
    if (process.env.NODE_ENV === "development") {
      console.log("[v0] Fresh token (fetched):", {
        mint: freshData.mint,
        priceUsd: freshData.priceUsd,
        pairUrl: freshData.pairUrl,
        sourceUpdatedAt: freshData.sourceUpdatedAt,
        holdersTotal: freshData.holders?.totalHolders,
      })
    }

    // Cache the result
    await storage.set(cacheKey, freshData, { ex: MINT_CACHE_TTL })

    // PART 1: Always include updatedAt in ISO string format
    return NextResponse.json({
      ...freshData,
      cached: false,
      cacheAgeMs: 0,
      updatedAt: new Date(freshData.sourceUpdatedAt).toISOString(),
      stale: false,
      rateLimited: false,
    })
  } catch (error) {
    console.error("[v0] /api/token/[mint] error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
