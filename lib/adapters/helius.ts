import type { HeliusEnrichment } from "../types"
import { isValidSolanaAddress } from "../utils/solana"
import { logger } from "../logger"
import { getServerEnv } from "../env"
import { storage } from "../storage"

// Cache Helius enrichment data for 24 hours to reduce API usage
const HELIUS_CACHE_PREFIX = "helius:enrich:"
const HELIUS_CACHE_TTL = 86400 // 24 hours

interface HeliusTokenAccount {
  mint: string
  owner: string
  amount: string
}

interface HeliusTokenMetadata {
  account: string
  onChainAccountInfo?: {
    accountInfo?: {
      data?: {
        parsed?: {
          info?: {
            mintAuthority?: string | null
            freezeAuthority?: string | null
            supply?: string
          }
        }
      }
    }
  }
}

export async function enrichWithHelius(tokenAddress: string): Promise<HeliusEnrichment | null> {
  // Helius enrichment is DISABLED by default to reduce API usage
  // Set HELIUS_ENRICHMENT_ENABLED='true' to enable
  const enrichmentEnabled = getServerEnv('HELIUS_ENRICHMENT_ENABLED', 'false')
  if (enrichmentEnabled.toLowerCase() !== 'true') {
    logger.log('[v0] Helius enrichment is disabled (set HELIUS_ENRICHMENT_ENABLED=true to enable)')
    return null
  }

  const apiKey = getServerEnv('HELIUS_API_KEY')
  if (!apiKey) {
    return null
  }

  if (!isValidSolanaAddress(tokenAddress)) {
    logger.log(`[v0] Skipping Helius enrichment for invalid address: ${tokenAddress}`)
    return null
  }

  // Check cache first to reduce API calls
  const cacheKey = `${HELIUS_CACHE_PREFIX}${tokenAddress}`
  try {
    const cached = await storage.get<HeliusEnrichment & { _cached: number }>(cacheKey)
    if (cached && typeof cached === 'object') {
      const cacheAge = (Date.now() - cached._cached) / 1000
      logger.log(`[v0] Helius cache hit for ${tokenAddress.slice(0, 8)} (age: ${Math.floor(cacheAge)}s)`)
      return cached
    }
  } catch (cacheError) {
    // Ignore cache errors, proceed with API call
  }

  try {
    // Fetch token accounts to get holder info
    const holdersRes = await fetch(`https://api.helius.xyz/v0/addresses/${tokenAddress}/balances?api-key=${apiKey}`)

    let holderCount = 0
    let topHolderPercentage = 0

    if (holdersRes.ok) {
      const holdersData = (await holdersRes.json()) as { tokens?: HeliusTokenAccount[] }
      const holders = holdersData.tokens || []
      holderCount = holders.length

      if (holders.length > 0) {
        const totalSupply = holders.reduce((sum, h) => sum + BigInt(h.amount || "0"), BigInt(0))
        const topHolder = holders.sort((a, b) => Number(BigInt(b.amount) - BigInt(a.amount)))[0]
        if (totalSupply > 0) {
          topHolderPercentage = Number((BigInt(topHolder.amount) * BigInt(100)) / totalSupply)
        }
      }
    }

    // Fetch mint info for authorities
    const mintRes = await fetch(`https://api.helius.xyz/v0/token-metadata?api-key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mintAccounts: [tokenAddress],
      }),
    })

    let mintAuthority: string | null = null
    let freezeAuthority: string | null = null

    if (mintRes.ok) {
      const mintData = (await mintRes.json()) as HeliusTokenMetadata[]
      const tokenData = mintData[0]
      if (tokenData?.onChainAccountInfo?.accountInfo?.data?.parsed?.info) {
        const info = tokenData.onChainAccountInfo.accountInfo.data.parsed.info
        mintAuthority = info.mintAuthority || null
        freezeAuthority = info.freezeAuthority || null
      }
    }

    const result: HeliusEnrichment = {
      holderCount,
      topHolderPercentage,
      mintAuthority,
      freezeAuthority,
    }

    // Cache the result for 24 hours to reduce API usage
    try {
      await storage.set(
        cacheKey,
        { ...result, _cached: Date.now() },
        { ex: HELIUS_CACHE_TTL }
      )
      logger.log(`[v0] Cached Helius enrichment for ${tokenAddress.slice(0, 8)}`)
    } catch (cacheError) {
      // Ignore cache errors
    }

    return result
  } catch (error) {
    console.warn(`[v0] Helius enrichment failed for ${tokenAddress}:`, error instanceof Error ? error.message : error)
    return null
  }
}
