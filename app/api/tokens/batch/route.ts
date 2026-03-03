import { NextRequest, NextResponse } from "next/server"
import { storage } from "@/lib/storage"
import { getTrackedTokens } from "@/lib/get-tracked-tokens"
import { fetchAllSources } from "@/lib/adapters"
import { calculateTokenScore } from "@/lib/scoring"
import { normalizeMint } from "@/lib/solana/normalizeMint"
import type { TokenScore, TokenData } from "@/lib/types"

const BATCH_CACHE_PREFIX = "solrad:batch:token:"
const BATCH_CACHE_TTL = 300 // 5 minutes

interface BatchRequest {
  mints: string[]
}

interface BatchResponse {
  tokens: TokenScore[]
  missing: string[]
}

/**
 * POST /api/tokens/batch
 * Fetches and scores multiple tokens in batch
 * - First checks cached index
 * - Falls back to fresh data fetching + scoring for missing tokens
 * - Returns fully-scored TokenScore objects
 */
export async function POST(request: NextRequest) {
  try {
    const body: BatchRequest = await request.json()
    
    if (!body.mints || !Array.isArray(body.mints)) {
      return NextResponse.json(
        { error: "Invalid request: mints array required" },
        { status: 400 }
      )
    }

    // Normalize and deduplicate mints
    const uniqueMints = Array.from(
      new Set(body.mints.map((m) => normalizeMint(m).toLowerCase()))
    )

    if (uniqueMints.length === 0) {
      return NextResponse.json({ tokens: [], missing: [] })
    }

    // Try fast path first: check cached index
    const cachedTokens = await getTrackedTokens()
    const cachedMap = new Map<string, TokenScore>()
    
    for (const token of cachedTokens) {
      const normalizedAddress = normalizeMint(token.address).toLowerCase()
      cachedMap.set(normalizedAddress, token)
    }

    const foundTokens: TokenScore[] = []
    const missingMints: string[] = []

    // Check which tokens we found in cache
    for (const mint of uniqueMints) {
      const cached = cachedMap.get(mint)
      if (cached) {
        foundTokens.push(cached)
      } else {
        missingMints.push(mint)
      }
    }

    // For missing tokens, try per-mint cache then fetch fresh
    const hydratedTokens: TokenScore[] = []
    const stillMissing: string[] = []

    for (const mint of missingMints) {
      try {
        // Check 5-minute mint-level cache
        const cacheKey = `${BATCH_CACHE_PREFIX}${mint}`
        const cachedMintData = await storage.get(cacheKey)
        
        if (cachedMintData) {
          hydratedTokens.push(cachedMintData as TokenScore)
          continue
        }

        // Fetch fresh data for this mint
        const rawData = await fetchAllSources([mint])
        
        if (!rawData || rawData.size === 0) {
          stillMissing.push(mint)
          continue
        }

        // Score the token using existing scoring logic
        const scored = calculateTokenScore(rawData)
        
        if (scored.length > 0) {
          const tokenScore = scored[0]
          
          // Cache for 5 minutes
          await storage.set(cacheKey, tokenScore, BATCH_CACHE_TTL)
          
          hydratedTokens.push(tokenScore)
        } else {
          stillMissing.push(mint)
        }
      } catch (error) {
        console.error(`[v0] Failed to hydrate token ${mint}:`, error)
        stillMissing.push(mint)
      }
    }

    const response: BatchResponse = {
      tokens: [...foundTokens, ...hydratedTokens],
      missing: stillMissing,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] Batch endpoint error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
