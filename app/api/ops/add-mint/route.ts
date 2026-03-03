import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { isValidSolanaMint } from "@/lib/utils/solana"
import { getBlobState, addTrackedMint } from "@/lib/blob-storage"
import { enrichWithHelius } from "@/lib/adapters/helius"
import { calculateTokenScore } from "@/lib/scoring"
import type { TokenData, TokenScore } from "@/lib/types"
import { storage, CACHE_KEYS } from "@/lib/storage"

async function fetchTokenFromDexScreener(mint: string): Promise<TokenData | null> {
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`, {
      headers: { "User-Agent": "SOLRAD/1.0" },
    })

    if (!response.ok) return null

    const data = await response.json()
    if (!data.pairs || !Array.isArray(data.pairs) || data.pairs.length === 0) {
      return null
    }

    // Pick pair with highest liquidity
    const bestPair = data.pairs
      .filter((p: { chainId: string }) => p.chainId === "solana")
      .sort(
        (a: { liquidity?: { usd?: number } }, b: { liquidity?: { usd?: number } }) =>
          (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0),
      )[0]

    if (!bestPair) return null

    return {
      address: bestPair.baseToken.address,
      symbol: bestPair.baseToken.symbol || "UNKNOWN",
      name: bestPair.baseToken.name || "Unknown Token",
      chain: "solana",
      priceUsd: Number.parseFloat(bestPair.priceUsd || "0"),
      priceChange24h: bestPair.priceChange?.h24 || 0,
      volume24h: bestPair.volume?.h24 || 0,
      liquidity: bestPair.liquidity?.usd || 0,
      fdv: bestPair.fdv,
      marketCap: bestPair.marketCap,
      txns24h: (bestPair.txns?.h24?.buys || 0) + (bestPair.txns?.h24?.sells || 0),
      pairCreatedAt: bestPair.pairCreatedAt,
      imageUrl: bestPair.info?.imageUrl,
      dexId: bestPair.dexId,
      pairUrl: bestPair.url,
    }
  } catch (error) {
    console.error("[v0] DexScreener fetch error:", error)
    return null
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Auth check
    const cookieStore = await cookies()
    const opsCookie = cookieStore.get("solrad_ops")
    if (opsCookie?.value !== "1") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { mint } = body

    // INTAKE QUEUE: Step 1 - Validate mint address
    if (!mint || typeof mint !== "string") {
      console.log("[OPS] add-mint", mint, "ok=false (missing)")
      return NextResponse.json({ ok: false, error: "Mint address required" }, { status: 400 })
    }

    const trimmedMint = mint.trim()
    if (!trimmedMint) {
      console.log("[OPS] add-mint (empty after trim) ok=false")
      return NextResponse.json({ ok: false, error: "Mint address required" }, { status: 400 })
    }

    if (!isValidSolanaMint(trimmedMint)) {
      console.log("[OPS] add-mint", trimmedMint, "ok=false (invalid format)")
      return NextResponse.json(
        { ok: false, error: "Invalid Solana mint address (must be a base58 public key)." },
        { status: 400 }
      )
    }

    // INTAKE QUEUE: Step 2 - Check for duplicates
    const state = await getBlobState()
    const normalizedMint = trimmedMint.toLowerCase()
    if (state.trackedMints.includes(normalizedMint)) {
      console.log("[OPS] add-mint", normalizedMint, "ok=false (duplicate)")
      return NextResponse.json({ ok: false, error: "Token already tracked" }, { status: 400 })
    }

    console.log(`[v0] INTAKE PROCESSING: ${normalizedMint}`)

    // INTAKE QUEUE: Step 3 - Resolve token via DexScreener
    const tokenData = await fetchTokenFromDexScreener(trimmedMint)
    if (!tokenData) {
      console.log(`[v0] INTAKE FAILED: Token not found on DexScreener: ${normalizedMint}`)
      return NextResponse.json(
        { 
          ok: false,
          error: "Token not indexed on DexScreener yet. It must have at least one trading pair with liquidity." 
        }, 
        { status: 404 }
      )
    }

    // Validate token has minimum viable data
    if (!tokenData.symbol || !tokenData.liquidity || tokenData.liquidity < 100) {
      console.log(`[v0] INTAKE FAILED: Token lacks minimum viable data: ${normalizedMint}`)
      return NextResponse.json(
        { 
          ok: false,
          error: "Token lacks minimum requirements (symbol, liquidity ≥$100)" 
        }, 
        { status: 400 }
      )
    }

    // INTAKE QUEUE: Step 4 - Enrich with Helius (optional, non-blocking)
    let heliusData: Awaited<ReturnType<typeof enrichWithHelius>> = null
    if (process.env.HELIUS_API_KEY) {
      try {
        console.log(`[v0] INTAKE: Enriching with Helius: ${normalizedMint}`)
        heliusData = await enrichWithHelius(trimmedMint)
        if (heliusData) {
          console.log(`[v0] INTAKE: Helius enrichment successful (${heliusData.holderCount} holders)`)
        }
      } catch (error) {
        console.warn("[v0] INTAKE: Helius enrichment failed (continuing without it):", error)
        // Continue without Helius data - not critical
      }
    }

    // INTAKE QUEUE: Step 5 - Apply scoring system (same as auto-loaded tokens)
    const tokenMap = new Map([[normalizedMint, [tokenData]]])
    const heliusMap = heliusData ? new Map([[normalizedMint, heliusData]]) : new Map()
    const scored = calculateTokenScore(tokenMap, heliusMap)

    if (scored.length === 0) {
      console.log(`[v0] INTAKE FAILED: Scoring failed for: ${normalizedMint}`)
      return NextResponse.json({ ok: false, error: "Failed to score token" }, { status: 500 })
    }

    const token: TokenScore = scored[0]

    // INTAKE QUEUE: Step 6 - Publish to tracked mints (only after successful resolution)
    await addTrackedMint(normalizedMint, token)

    // Invalidate cache so token appears immediately
    await storage.del(CACHE_KEYS.TOKENS)

    const duration = Date.now() - startTime
    console.log("[OPS] add-mint", normalizedMint, "ok=true", `symbol=${token.symbol}`, `score=${token.totalScore}`)

    return NextResponse.json({
      ok: true,
      success: true,
      mint: normalizedMint,
      added: normalizedMint,
      name: token.name,
      symbol: token.symbol,
      savedToBlob: true,
      token: {
        symbol: token.symbol,
        name: token.name,
        address: token.address,
        score: token.totalScore,
        riskLabel: token.riskLabel,
        liquidity: token.liquidity,
        volume24h: token.volume24h,
      },
      message: `Token added successfully. Scored ${token.totalScore} with ${token.riskLabel} risk label.`,
      processingTime: duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("[OPS] add-mint error:", error)
    
    return NextResponse.json(
      { 
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error occurred during intake",
        processingTime: duration,
      },
      { status: 500 },
    )
  }
}
