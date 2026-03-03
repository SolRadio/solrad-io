/**
 * QuickNode Solana RPC + Pump Fun API integration
 * Enriches tokens with on-chain holder data and metadata
 */

import { storage } from "@/lib/storage"

// ─── Types ───────────────────────────────────────────────

interface HolderEntry {
  address: string
  pct: number
}

export interface TokenHolderData {
  holderCount: number
  topHolders: HolderEntry[]
  top10Concentration: number
}

export interface TokenMetadataQN {
  name: string
  symbol: string
  totalSupply: number
  decimals: number
  holderCount: number
}

export interface PumpLaunch {
  mint: string
  name: string
  symbol: string
  createdAt: string
  initialLiquidity: number
}

// ─── Helpers ─────────────────────────────────────────────

const QN_RPC_URL = () => process.env.QUICKNODE_SOLANA_RPC_URL ?? ""
const QN_PUMP_URL = () => process.env.QUICKNODE_PUMP_FUN_URL ?? ""

async function rpcPost(method: string, params: unknown[]): Promise<unknown> {
  const url = QN_RPC_URL()
  if (!url) throw new Error("QUICKNODE_SOLANA_RPC_URL not set")

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) {
    throw new Error(`QuickNode RPC ${method}: HTTP ${res.status}`)
  }

  const json = (await res.json()) as { result?: unknown; error?: { message: string } }
  if (json.error) {
    throw new Error(`QuickNode RPC ${method}: ${json.error.message}`)
  }
  return json.result
}

// ─── getTokenHolders ─────────────────────────────────────

export async function getTokenHolders(mint: string): Promise<TokenHolderData | null> {
  const cacheKey = `qn:holders:v4:${mint}`

  try {
    // Check cache (5 min TTL)
    const cached = await storage.get(cacheKey)
    if (cached && typeof cached === "object" && (cached as TokenHolderData).holderCount > 0) {
      return cached as TokenHolderData
    }

    const rpcUrl = process.env.QUICKNODE_SOLANA_RPC_URL
    if (!rpcUrl) {
      console.error("[QuickNode] QUICKNODE_SOLANA_RPC_URL not set")
      return null
    }

    // Fire both RPC calls in parallel
    console.log(`[QuickNode] Fetching holder data for ${mint.slice(0, 8)}...`)

    const [largestRes, supplyRes] = await Promise.all([
      fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getTokenLargestAccounts", params: [mint] }),
      }),
      fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "getTokenSupply", params: [mint] }),
      }),
    ])

    if (!largestRes.ok || !supplyRes.ok) {
      console.error(`[QuickNode] HTTP error: largest=${largestRes.status}, supply=${supplyRes.status}`)
      return null
    }

    const [largestJson, supplyJson] = await Promise.all([
      largestRes.json() as Promise<{ result?: { value?: Array<{ address: string; amount: string; uiAmount: number | null; decimals: number }> }; error?: { message: string } }>,
      supplyRes.json() as Promise<{ result?: { value?: { amount: string; uiAmount: number | null; decimals: number } }; error?: { message: string } }>,
    ])

    console.log("[QuickNode] largestAccounts:", JSON.stringify(largestJson).slice(0, 400))
    console.log("[QuickNode] supply:", JSON.stringify(supplyJson).slice(0, 200))

    if (largestJson.error) {
      console.error("[QuickNode] getTokenLargestAccounts error:", largestJson.error.message)
      return null
    }
    if (supplyJson.error) {
      console.error("[QuickNode] getTokenSupply error:", supplyJson.error.message)
      return null
    }

    const accounts = largestJson.result?.value
    const supplyValue = supplyJson.result?.value

    if (!accounts || accounts.length === 0) {
      console.log("[QN] No holder accounts returned for mint:", mint)
      return null
    }

    if (!supplyValue) {
      console.warn(`[QuickNode] Missing supply data for ${mint.slice(0, 8)}`)
      return null
    }

    // Use raw `amount` strings to avoid null `uiAmount` issues.
    // Both amounts share the same decimals, so they cancel out in the ratio.
    const totalSupplyRaw = Number(supplyValue.amount)
    if (!totalSupplyRaw || totalSupplyRaw === 0) {
      console.warn(`[QuickNode] Supply is 0 for ${mint.slice(0, 8)}`)
      return null
    }

    const top10 = accounts.slice(0, 10)
    const topHolders: HolderEntry[] = top10.map((a) => ({
      address: a.address,
      pct: Number(((Number(a.amount) / totalSupplyRaw) * 100).toFixed(2)),
    }))

    const top10Concentration = Number(topHolders.reduce((s, h) => s + h.pct, 0).toFixed(2))

    const data: TokenHolderData = {
      holderCount: accounts.length,
      topHolders,
      top10Concentration,
    }

    console.log("[QN-FINAL] accounts array length:", accounts?.length)
    console.log("[QN-FINAL] first account raw:", JSON.stringify(accounts?.[0]))
    console.log("[QN-FINAL] supply raw:", totalSupplyRaw)
    console.log("[QN-FINAL] computed top10Pct:", top10Concentration)
    await storage.set(cacheKey, data, { ex: 300 })
    return data
  } catch (err) {
    console.error(`[QuickNode] getTokenHolders(${mint.slice(0, 8)}):`, err)
    return null
  }
}

// ─── HolderConcentrationData (used by token API + drawer) ─

export interface HolderConcentrationData {
  totalHolders: number
  top10Pct: number
  topWalletPct: number
  devWalletPct: number | null
  dataAvailable: boolean
}

export async function getHolderConcentration(mint: string): Promise<HolderConcentrationData> {
  const data = await getTokenHolders(mint)
  if (!data) {
    // Return partial result so the UI can distinguish "no data" from "fetch error"
    return {
      totalHolders: 0,
      top10Pct: 0,
      topWalletPct: 0,
      devWalletPct: 0,
      dataAvailable: false,
    }
  }

  const topWalletPct = data.topHolders.length > 0 ? data.topHolders[0].pct : 0
  const devWalletPct = topWalletPct > 10 ? topWalletPct : 0

  return {
    totalHolders: data.holderCount,
    top10Pct: data.top10Concentration,
    topWalletPct,
    devWalletPct,
    dataAvailable: true,
  }
}

// ─── getTokenMetadata ────────────────────────────────────

export async function getTokenMetadata(mint: string): Promise<TokenMetadataQN | null> {
  const cacheKey = `qn:meta:${mint}`

  try {
    const cached = await storage.get(cacheKey)
    if (cached && typeof cached === "object") {
      return cached as TokenMetadataQN
    }

    const result = (await rpcPost("qn_getTokenMetadataByCAAddress", [mint])) as {
      name?: string
      symbol?: string
      totalSupply?: number
      decimals?: number
      holderCount?: number
    } | null

    if (!result) return null

    const data: TokenMetadataQN = {
      name: result.name ?? "",
      symbol: result.symbol ?? "",
      totalSupply: result.totalSupply ?? 0,
      decimals: result.decimals ?? 0,
      holderCount: result.holderCount ?? 0,
    }

    await storage.set(cacheKey, data, { ex: 1800 }) // 30 min
    return data
  } catch (err) {
    console.error(`[quicknode] getTokenMetadata(${mint.slice(0, 8)}):`, err)
    return null
  }
}

// ─── getNewPumpFunTokens (discovery for ingest pipeline) ─

export async function getNewPumpFunTokens(): Promise<string[]> {
  const url = process.env.QUICKNODE_PUMP_FUN_URL
  if (!url) return []

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "qn_getTokenMetadataByContractAddress",
        params: [],
      }),
    })

    const text = await res.text()

    // Guard: empty response
    if (!text || text.trim().length === 0) {
      console.log("[QuickNode PumpFun] Empty response, skipping")
      return []
    }

    // Guard: HTML response (404/redirect page)
    if (text.trim().startsWith("<")) {
      console.log("[QuickNode PumpFun] HTML response, skipping")
      return []
    }

    const data = JSON.parse(text)
    return (data.result ?? [])
      .map((t: { mint?: string; address?: string }) => t.mint ?? t.address)
      .filter(Boolean) as string[]
  } catch (e) {
    console.log("[QuickNode PumpFun] Skipping:", (e as Error).message)
    return []
  }
}

// ─── getNewMintsFromRPC (Part 1 — Pump.fun on-chain discovery) ─

const PUMP_FUN_PROGRAM = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"
const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
const RPC_DISCOVERY_CACHE_KEY = "qn:new-mints:cache"
const RPC_DISCOVERY_TTL = 240 // 4 minutes
const MAX_TX_TO_PROCESS = 50

export async function getNewMintsFromRPC(minutesBack = 10): Promise<string[]> {
  try {
    // Check cache first to avoid redundant RPC calls between 5-min cron cycles
    const cached = await storage.get(RPC_DISCOVERY_CACHE_KEY)
    if (cached && Array.isArray(cached)) {
      console.log(`[QN-DISCOVERY] Returning ${cached.length} cached mints`)
      return cached as string[]
    }

    const rpcUrl = QN_RPC_URL()
    if (!rpcUrl) {
      console.warn("[QN-DISCOVERY] QUICKNODE_SOLANA_RPC_URL not set")
      return []
    }

    // Step 1: Get recent signatures for the Pump.fun program
    const signatures = (await rpcPost("getSignaturesForAddress", [
      PUMP_FUN_PROGRAM,
      { limit: 100, commitment: "confirmed" },
    ])) as Array<{ signature: string; blockTime?: number }> | null

    if (!signatures || signatures.length === 0) {
      console.log("[QN-DISCOVERY] No signatures found for Pump.fun program")
      await storage.set(RPC_DISCOVERY_CACHE_KEY, [], { ex: RPC_DISCOVERY_TTL })
      return []
    }

    const cutoff = Math.floor(Date.now() / 1000) - minutesBack * 60
    const recentSigs = signatures
      .filter((s) => s.blockTime && s.blockTime >= cutoff)
      .slice(0, MAX_TX_TO_PROCESS)

    if (recentSigs.length === 0) {
      console.log(`[QN-DISCOVERY] No signatures within last ${minutesBack} min`)
      await storage.set(RPC_DISCOVERY_CACHE_KEY, [], { ex: RPC_DISCOVERY_TTL })
      return []
    }

    // Step 2: Fetch transactions and extract mint addresses
    const mintSet = new Set<string>()

    for (const sig of recentSigs) {
      try {
        const tx = (await rpcPost("getTransaction", [
          sig.signature,
          { maxSupportedTransactionVersion: 0 },
        ])) as {
          meta?: {
            postTokenBalances?: Array<{ mint: string; owner: string }>
          }
          transaction?: {
            message?: {
              accountKeys?: string[]
            }
          }
        } | null

        if (!tx) continue

        // Extract mints from postTokenBalances (most reliable for SPL tokens)
        if (tx.meta?.postTokenBalances) {
          for (const bal of tx.meta.postTokenBalances) {
            if (bal.mint && bal.mint !== TOKEN_PROGRAM && bal.mint !== PUMP_FUN_PROGRAM) {
              mintSet.add(bal.mint)
            }
          }
        }
      } catch {
        // Skip individual transaction errors
        continue
      }
    }

    const mints = Array.from(mintSet)
    console.log(`[QN-DISCOVERY] Found ${mints.length} new mints via RPC in last ${minutesBack} min`)

    // Cache result with 4-min TTL
    await storage.set(RPC_DISCOVERY_CACHE_KEY, mints, { ex: RPC_DISCOVERY_TTL })
    return mints
  } catch (err) {
    console.error("[QN-DISCOVERY] getNewMintsFromRPC failed:", err)
    return []
  }
}

// ─── prefetchHolderDataBatch (Part 2 — cache-warming) ────

const PREFETCH_BATCH_SIZE = 5
const PREFETCH_BATCH_DELAY = 200

export async function prefetchHolderDataBatch(mints: string[]): Promise<void> {
  let fetched = 0

  for (let i = 0; i < mints.length; i += PREFETCH_BATCH_SIZE) {
    const batch = mints.slice(i, i + PREFETCH_BATCH_SIZE)

    await Promise.allSettled(
      batch.map(async (mint) => {
        try {
          await getTokenHolders(mint)
          fetched++
        } catch {
          // Never throws — skip individual failures
        }
      })
    )

    // Delay between batches
    if (i + PREFETCH_BATCH_SIZE < mints.length) {
      await new Promise((r) => setTimeout(r, PREFETCH_BATCH_DELAY))
    }
  }

  console.log(`[QN-PREFETCH] Holder data prefetched for ${fetched}/${mints.length} mints`)
}

// ─── getRecentPumpLaunches ───────────────────────────────

export async function getRecentPumpLaunches(): Promise<PumpLaunch[]> {
  const cacheKey = "qn:pump:latest"

  try {
    const cached = await storage.get(cacheKey)
    if (cached && Array.isArray(cached)) {
      return cached as PumpLaunch[]
    }

    const url = QN_PUMP_URL()
    if (!url) return []

    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      throw new Error(`Pump Fun API: HTTP ${res.status}`)
    }

    const json = (await res.json()) as Array<{
      mint?: string
      name?: string
      symbol?: string
      created_timestamp?: string
      createdAt?: string
      initial_liquidity?: number
      initialLiquidity?: number
    }>

    const launches: PumpLaunch[] = (json || []).slice(0, 20).map((item) => ({
      mint: item.mint ?? "",
      name: item.name ?? "",
      symbol: item.symbol ?? "",
      createdAt: item.created_timestamp ?? item.createdAt ?? "",
      initialLiquidity: item.initial_liquidity ?? item.initialLiquidity ?? 0,
    }))

    await storage.set(cacheKey, launches, { ex: 120 }) // 2 min
    return launches
  } catch (err) {
    console.error("[quicknode] getRecentPumpLaunches:", err)
    return []
  }
}
