import type { TokenData } from "../types"
import { fetchDexScreener } from "./dexscreener"
import { fetchPumpFun } from "./pumpfun"
import { logger } from "../logger"

export interface SourceAdapter {
  name: string
  fetch: () => Promise<TokenData[]>
  enabled?: boolean
}

export const adapters: SourceAdapter[] = [
  { name: "dexscreener", fetch: fetchDexScreener, enabled: true },
  { name: "pumpfun", fetch: fetchPumpFun, enabled: true },
]

export async function fetchAllSources(): Promise<Map<string, TokenData[]>> {
  // Only fetch from enabled adapters
  const enabledAdapters = adapters.filter((adapter) => adapter.enabled !== false)
  
  logger.log(`[v0] fetchAllSources: Starting with ${enabledAdapters.length} enabled adapters: ${enabledAdapters.map(a => a.name).join(", ")}`)
  
  const results = await Promise.allSettled(enabledAdapters.map((adapter) => adapter.fetch()))

  const allTokens: TokenData[] = []

  results.forEach((result, idx) => {
    if (result.status === "fulfilled") {
      const adapterName = enabledAdapters[idx].name
      const tokenCount = result.value.length
      logger.log(`[v0] ${adapterName}: fetched ${tokenCount} tokens`)
      allTokens.push(...result.value)
    } else {
      const adapterName = enabledAdapters[idx].name
      const errorMsg = result.reason instanceof Error ? result.reason.message : String(result.reason)
      logger.error(`[v0] ${adapterName}: FAILED - ${errorMsg}`)
    }
  })

  // Accept ALL Solana SPL tokens with sufficient liquidity ($5K minimum)
  const MIN_LIQUIDITY_USD = 5000
  const solanaTokens = allTokens.filter((token) => {
    if (token.chain !== "solana" || !token.address) return false
    // Apply minimum liquidity floor to exclude ultra-thin tokens
    const liq = token.liquidity ?? 0
    return liq >= MIN_LIQUIDITY_USD || liq === 0 // liq === 0 means data not yet enriched, keep for enrichment
  })
  
  logger.log(`[v0] fetchAllSources: ${allTokens.length} total tokens, ${solanaTokens.length} Solana SPL tokens (>=$${MIN_LIQUIDITY_USD} liquidity)`)

  return aggregateByAddress(solanaTokens)
}

function aggregateByAddress(tokens: TokenData[]): Map<string, TokenData[]> {
  const grouped = new Map<string, TokenData[]>()

  for (const token of tokens) {
    if (!token.address || !token.chain) {
      continue
    }

    // Use lowercase for deduplication, but preserve original case in TokenData
    const key = token.address.toLowerCase()
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(token)
  }

  logger.log(`[v0] aggregateByAddress: ${tokens.length} tokens → ${grouped.size} unique addresses`)
  
  return grouped
}
