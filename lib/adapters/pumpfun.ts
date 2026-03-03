import type { TokenData } from "../types"
import { logger } from "../logger"

/**
 * Pump.fun Real-time Data API Adapter
 * 
 * Fetches recently created pump.fun tokens to supplement DexScreener data
 * and get proper SPL token mint addresses for pump.fun tokens
 * 
 * API Docs: https://pumpportal.fun/data-api
 */

const PUMPFUN_API_BASE = "https://pumpportal.fun/api"

interface PumpFunToken {
  mint: string // SPL token mint address (NOT bonding curve address)
  name: string
  symbol: string
  description?: string
  image_uri?: string
  metadata_uri?: string
  twitter?: string
  telegram?: string
  bonding_curve: string
  associated_bonding_curve: string
  creator: string
  created_timestamp: number
  raydium_pool?: string
  complete: boolean // true if migrated to Raydium
  virtual_sol_reserves?: number
  virtual_token_reserves?: number
  total_supply?: number
  website?: string
  show_name?: boolean
  king_of_the_hill_timestamp?: number
  market_cap?: number
  reply_count?: number
  last_reply?: number
  nsfw?: boolean
  market_id?: string
  inverted?: boolean
  is_currently_live?: boolean
  username?: string
  profile_image?: string
  usd_market_cap?: number
}

/**
 * Fetch recently created tokens from Pump.fun
 * Returns tokens created in the last 24 hours sorted by creation time
 */
async function fetchWithRetry(
  url: string,
  maxRetries = 3
): Promise<Response | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "SOLRAD/1.0" },
      })

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("Retry-After") || "0", 10)
        const delay = retryAfter > 0 ? retryAfter * 1000 : attempt * 2000
        logger.warn(
          `[v0] Pump.fun: 429 rate limited, retry ${attempt}/${maxRetries} in ${delay}ms`
        )
        await new Promise((r) => setTimeout(r, delay))
        continue
      }

      if (!res.ok) {
        logger.warn(`[v0] Pump.fun API returned ${res.status}`)
        return null
      }

      return res
    } catch (err) {
      logger.warn(`[v0] Pump.fun fetch attempt ${attempt} failed:`, err)
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, attempt * 1500))
      }
    }
  }
  return null
}

export async function fetchPumpFun(): Promise<TokenData[]> {
  try {
    logger.log("[v0] Pump.fun: fetching recent tokens...")
    
    const response = await fetchWithRetry(
      `${PUMPFUN_API_BASE}/tokens/recent?limit=100&timeframe=24h`
    )

    if (!response) return []

    const text = await response.text()
    let data: unknown
    try {
      data = JSON.parse(text)
    } catch {
      logger.warn("[v0] Pump.fun: invalid JSON response:", text.slice(0, 120))
      return []
    }
    
    if (!Array.isArray(data)) {
      logger.warn("[v0] Pump.fun: unexpected response format")
      return []
    }

    const tokens: TokenData[] = []

    for (const token of data as PumpFunToken[]) {
      // Skip tokens without mint address
      if (!token.mint || typeof token.mint !== "string") {
        continue
      }

      // Skip NSFW tokens
      if (token.nsfw === true) {
        continue
      }

      // Calculate approximate metrics from bonding curve data
      const liquidityUsd = token.virtual_sol_reserves 
        ? token.virtual_sol_reserves * 150 // Rough SOL price estimate
        : 0

      const marketCap = token.usd_market_cap || token.market_cap || 0

      tokens.push({
        address: token.mint, // Use proper SPL token mint, not bonding curve address
        symbol: token.symbol || "UNKNOWN",
        name: token.name || "Unknown Token",
        chain: "solana",
        priceUsd: marketCap && token.total_supply ? marketCap / token.total_supply : 0,
        priceChange24h: 0, // Pump.fun doesn't provide price history
        volume24h: 0, // Would need to aggregate from trade events
        liquidity: liquidityUsd,
        marketCap: marketCap,
        txns24h: 0, // Would need to count from trade events
        pairCreatedAt: token.created_timestamp 
          ? new Date(token.created_timestamp * 1000).toISOString()
          : new Date().toISOString(),
        dexId: "pumpfun",
        pairAddress: token.bonding_curve,
        imageUrl: token.image_uri,
        socials: {
          twitter: token.twitter,
          telegram: token.telegram,
          website: token.website,
        },
        // Pump.fun specific metadata
        metadata: {
          complete: token.complete,
          raydiumPool: token.raydium_pool,
          creator: token.creator,
        },
      })
    }

    logger.log(`[v0] Pump.fun: fetched ${tokens.length} tokens`)
    return tokens

  } catch (error) {
    logger.error("[v0] Pump.fun fetch failed:", error)
    return []
  }
}
