import { normalizeMint } from "../solana/validateMint"

export interface SourceToken {
  mint: string
  source: "dex" | "pump" | "helius"
  pairAddress?: string
  dexUrl?: string
  symbol?: string
  name?: string
  priceUsd?: number
  liquidityUsd?: number
  volume24h?: number
  createdAt?: number
  info?: {
    website?: string
    twitter?: string
    telegram?: string
  }
}

const FETCH_TIMEOUT = 7000 // 7 seconds

/**
 * Fetch latest pairs from DexScreener
 * Returns tokens from trending/new pairs with fallback handling
 */
export async function fetchDexLatestPairs(): Promise<SourceToken[]> {
  const TIMEOUT = 7000
  const mintMap = new Map<string, SourceToken>()

  // Helper to fetch with timeout
  async function fetchWithTimeout(url: string): Promise<any> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT)
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "SOLRAD/1.0" },
        signal: controller.signal,
      })
      clearTimeout(timer)
      if (!res.ok) return null
      return await res.json()
    } catch {
      clearTimeout(timer)
      return null
    }
  }

  // Source 1: Token boosts (newest boosted tokens — high signal, fresh)
  try {
    const data = await fetchWithTimeout(
      "https://api.dexscreener.com/token-boosts/latest/v1"
    )
    const items = Array.isArray(data) ? data : []
    for (const item of items.slice(0, 50)) {
      if (item.chainId !== "solana") continue
      const mint = normalizeMint(item.tokenAddress)
      if (!mint || mintMap.has(mint)) continue
      mintMap.set(mint, {
        mint,
        source: "dex",
        symbol: item.description?.split(" ")?.[0] || "???",
        name: item.description || "Unknown",
        dexUrl: item.url,
      })
    }
    console.log(`[sources] Boosts: ${mintMap.size} tokens`)
  } catch (e) {
    console.warn("[sources] Boosts fetch failed:", e)
  }

  // Source 2: Latest token profiles (newest tokens listed on DexScreener)
  try {
    const data = await fetchWithTimeout(
      "https://api.dexscreener.com/token-profiles/latest/v1"
    )
    const items = Array.isArray(data) ? data : []
    const beforeSize = mintMap.size
    for (const item of items.slice(0, 50)) {
      if (item.chainId !== "solana") continue
      const mint = normalizeMint(item.tokenAddress)
      if (!mint || mintMap.has(mint)) continue
      mintMap.set(mint, {
        mint,
        source: "dex",
        symbol: item.symbol || "???",
        name: item.name || "Unknown",
        dexUrl: item.url,
      })
    }
    console.log(`[sources] Profiles: ${mintMap.size - beforeSize} new tokens`)
  } catch (e) {
    console.warn("[sources] Profiles fetch failed:", e)
  }

  // Source 3: Trending Solana pairs (existing logic, kept as fallback)
  try {
    const data = await fetchWithTimeout(
      "https://api.dexscreener.com/latest/dex/search?q=solana"
    )
    const pairs = data?.pairs || []
    const beforeSize = mintMap.size
    for (const pair of pairs.slice(0, 100)) {
      if (pair.chainId !== "solana") continue
      const mint = normalizeMint(pair.baseToken?.address)
      if (!mint || mintMap.has(mint)) continue
      mintMap.set(mint, {
        mint,
        source: "dex",
        pairAddress: pair.pairAddress,
        dexUrl: pair.url,
        symbol: pair.baseToken?.symbol || "???",
        name: pair.baseToken?.name || "Unknown",
        priceUsd: pair.priceUsd ? parseFloat(pair.priceUsd) : 0,
        liquidityUsd: pair.liquidity?.usd || 0,
        volume24h: pair.volume?.h24 || 0,
        createdAt: pair.pairCreatedAt,
      })
    }
    console.log(`[sources] Trending: ${mintMap.size - beforeSize} new tokens`)
  } catch (e) {
    console.warn("[sources] Trending fetch failed:", e)
  }

  const tokens = Array.from(mintMap.values())
  console.log(`[sources] Total unique tokens: ${tokens.length}`)
  return tokens
}

/**
 * Fetch new mints from Pump.fun
 * Uses existing /api/ingest/new-mints endpoint as internal source
 */
export async function fetchPumpNewMints(baseUrl = ""): Promise<SourceToken[]> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
  
  try {
    // Call internal new-mints endpoint (Helius-based)
    const url = `${baseUrl}/api/ingest/new-mints?limit=50&minutesBack=15`
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "x-admin-password": process.env.ADMIN_PASSWORD || process.env.OPS_PASSWORD || "",
      },
      signal: controller.signal,
    })
    
    clearTimeout(timeout)
    
    if (!response.ok) {
      console.warn(`[v0] Pump.fun fetch failed: ${response.status}`)
      return []
    }
    
    const data = await response.json()
    
    // If rate limited, return empty array gracefully
    if (data.rateLimited) {
      console.warn("[v0] Pump.fun: Rate limited, skipping this cycle")
      return []
    }
    
    const tokens: SourceToken[] = []
    const newMints = data.newMints || []
    
    for (const rawMint of newMints) {
      const mint = normalizeMint(rawMint)
      if (!mint) continue
      
      tokens.push({
        mint,
        source: "pump",
        createdAt: Date.now(), // Approximate
      })
    }
    
    console.log(`[v0] Pump.fun: Fetched ${tokens.length} new mints`)
    return tokens
    
  } catch (error) {
    clearTimeout(timeout)
    console.warn("[v0] Pump.fun fetch error:", error instanceof Error ? error.message : "Unknown")
    return []
  }
}

/**
 * Fetch new mints from Helius
 * Polling method using existing /api/ingest/new-mints endpoint
 */
export async function fetchHeliusNewMints(baseUrl = ""): Promise<SourceToken[]> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
  
  try {
    // Call internal new-mints endpoint (Helius-based)
    const url = `${baseUrl}/api/ingest/new-mints?limit=50&minutesBack=15`
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "x-admin-password": process.env.ADMIN_PASSWORD || process.env.OPS_PASSWORD || "",
      },
      signal: controller.signal,
    })
    
    clearTimeout(timeout)
    
    if (!response.ok) {
      console.warn(`[v0] Helius fetch failed: ${response.status}`)
      return []
    }
    
    const data = await response.json()
    
    // If rate limited, return empty array gracefully
    if (data.rateLimited) {
      console.warn("[v0] Helius: Rate limited, skipping this cycle")
      return []
    }
    
    const tokens: SourceToken[] = []
    const newMints = data.newMints || []
    
    for (const rawMint of newMints) {
      const mint = normalizeMint(rawMint)
      if (!mint) continue
      
      tokens.push({
        mint,
        source: "helius",
        createdAt: Date.now(), // Approximate
      })
    }
    
    console.log(`[v0] Helius: Fetched ${tokens.length} new mints`)
    return tokens
    
  } catch (error) {
    clearTimeout(timeout)
    console.warn("[v0] Helius fetch error:", error instanceof Error ? error.message : "Unknown")
    return []
  }
}
