import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { extractMintsFromParsedTx } from "@/lib/solana/extractMintsFromParsedTx"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

// HARD CAPS: Prevent excessive QuickNode credit usage
const MAX_SIGNATURES = 40 // Maximum signatures to fetch per run
const MAX_TX = 40 // Maximum transactions to parse per run

// Rate limiting: Track last call time to prevent excessive API usage (same as Helius)
let lastQuickNodeCallTime = 0
const MIN_QUICKNODE_CALL_INTERVAL = 60000 // Minimum 60 seconds between QuickNode RPC calls

// PART B: Enhanced mint tracking schema
interface DiscoveredMint {
  mint: string
  firstSeenAt: number
  lastCheckedAt: number
  source: "quicknode"
  pairAddress?: string
  dexUrl?: string
  pairCreatedAt?: number
  symbol?: string
  name?: string
  resolved: boolean
}

/**
 * POST /api/ingest/new-mints-qn?limit=100&minutesBack=60
 * QuickNode-based mint discovery (alternative to Helius)
 * Protected by CRON_SECRET for scheduled execution
 * 
 * Query params:
 * - limit: max mints to discover (default 100)
 * - minutesBack: how far back to search (default 60)
 * 
 * This endpoint:
 * 1. Queries QuickNode RPC for recent SPL token program transactions
 * 2. Identifies new mint initialization events from parsed instructions
 * 3. Stores discovered mints in KV with stable schema (same as Helius route)
 * 4. Attempts to resolve BEST DEX pair from Dexscreener (highest liquidity)
 * 5. Handles 429 gracefully by stopping resolution and returning cached progress
 */
export async function POST(request: Request) {
  // Kill switch: Must be explicitly enabled
  const discoveryEnabled = process.env.QUICKNODE_MINT_DISCOVERY_ENABLED === 'true'
  const rpcUrlPresent = !!process.env.QUICKNODE_SOLANA_RPC_URL
  
  // Log initial configuration (NO sensitive data)
  console.log("[v0] QN Mint Discovery Configuration:", {
    provider: "QuickNode",
    discoveryEnabled,
    rpcUrlPresent,
    maxSignatures: MAX_SIGNATURES,
    maxTransactions: MAX_TX,
  })
  
  if (!discoveryEnabled) {
    return NextResponse.json({
      ok: false,
      disabled: true,
      message: "QuickNode mint discovery is disabled. Set QUICKNODE_MINT_DISCOVERY_ENABLED=true to enable.",
    })
  }

  try {
    // Auth check - cron or admin protected
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET
    const adminPassword = process.env.ADMIN_PASSWORD || process.env.OPS_PASSWORD
    
    const isCron = authHeader === `Bearer ${cronSecret}`
    const isAdmin = request.headers.get("x-admin-password") === adminPassword
    
    if (!isCron && !isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const quicknodeUrl = process.env.QUICKNODE_SOLANA_RPC_URL
    if (!quicknodeUrl) {
      console.error("[v0] QN Mint Discovery: QUICKNODE_SOLANA_RPC_URL is missing")
      return NextResponse.json({
        ok: false,
        error: "QUICKNODE_SOLANA_RPC_URL not configured",
        message: "QuickNode RPC URL is required. Please set QUICKNODE_SOLANA_RPC_URL environment variable.",
      })
    }
    
    const now = Date.now()
    
    // Rate limit check: Prevent excessive QuickNode RPC usage (same protection as Helius)
    const timeSinceLastCall = now - lastQuickNodeCallTime
    if (timeSinceLastCall < MIN_QUICKNODE_CALL_INTERVAL) {
      const waitTime = Math.ceil((MIN_QUICKNODE_CALL_INTERVAL - timeSinceLastCall) / 1000)
      console.warn(`[v0] QN Mint ingestion: Rate limited. Wait ${waitTime}s before next call.`)
      return NextResponse.json({
        ok: false,
        rateLimited: true,
        message: `Rate limited. Please wait ${waitTime} seconds before trying again.`,
        waitSeconds: waitTime,
      })
    }
    
    // Parse query params with SAFE DEFAULTS and enforce HARD CAPS
    const { searchParams } = new URL(request.url)
    const requestedLimit = Number.parseInt(searchParams.get("limit") || "40")
    const requestedMinutesBack = Number.parseInt(searchParams.get("minutesBack") || "30")
    
    // Enforce hard caps
    const limit = Math.min(requestedLimit, MAX_SIGNATURES)
    const minutesBack = Math.min(requestedMinutesBack, 1440) // Cap at 24h
    
    console.log("[v0] QN Mint ingestion: Starting with safe parameters", { 
      limit, 
      minutesBack,
      hardCap: MAX_SIGNATURES,
    })
    
    // Update last call time to enforce rate limit
    lastQuickNodeCallTime = now
    
    const searchBackMs = minutesBack * 60 * 1000
    const targetTime = Math.floor((now - searchBackMs) / 1000) // Unix seconds
    
    // Step 1: Get recent signatures for SPL Token Program
    const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
    
    const signaturesResponse = await fetch(quicknodeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getSignaturesForAddress",
        params: [
          TOKEN_PROGRAM,
          {
            limit: Math.min(limit, 200), // QuickNode may have limits
          }
        ]
      })
    })
    
    if (!signaturesResponse.ok) {
      console.error("[v0] QN signatures fetch error:", signaturesResponse.status)
      return NextResponse.json(
        { error: "Failed to fetch signatures from QuickNode", status: signaturesResponse.status },
        { status: 502 }
      )
    }
    
    const signaturesData = await signaturesResponse.json()
    if (signaturesData.error) {
      console.error("[v0] QN RPC error:", signaturesData.error)
      return NextResponse.json(
        { error: "QuickNode RPC error", details: signaturesData.error },
        { status: 502 }
      )
    }
    
    const signatures = signaturesData.result || []
    console.log("[v0] QN Mint ingestion: Received", signatures.length, "signatures")
    
    // Step 2: Fetch parsed transactions and filter by time + extract mints
    const discoveredMints = new Set<string>()
    let processedCount = 0
    
    for (const sig of signatures) {
      // Enforce MAX_TX hard cap to prevent excessive RPC usage
      if (processedCount >= MAX_TX) {
        console.log("[v0] QN Mint ingestion: Reached MAX_TX cap", MAX_TX)
        break
      }
      
      // Check if transaction is within time window
      if (sig.blockTime && sig.blockTime < targetTime) {
        continue // Too old, skip
      }
      
      try {
        const txResponse = await fetch(quicknodeUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: processedCount + 2,
            method: "getTransaction",
            params: [
              sig.signature,
              {
                encoding: "jsonParsed",
                maxSupportedTransactionVersion: 0
              }
            ]
          })
        })
        
        if (!txResponse.ok) continue
        
        const txData = await txResponse.json()
        if (txData.error || !txData.result) continue
        
        // Extract mints from parsed transaction
        const mints = extractMintsFromParsedTx(txData.result)
        mints.forEach(mint => discoveredMints.add(mint))
        
        processedCount++
      } catch (error) {
        // Ignore individual transaction fetch errors
        continue
      }
    }
    
    console.log("[v0] QN Mint ingestion: Found", discoveredMints.size, "unique mints from", processedCount, "transactions")
    
    // Step 3: Store in KV and attempt pair resolution (same logic as Helius route)
    const MAX_RESOLUTION_ATTEMPTS = 10 // Only resolve first 10 mints per cycle
    const newMints: string[] = []
    const existingMints: string[] = []
    let resolvedCount = 0
    let rateLimited = false
    let resolutionAttempts = 0
    
    for (const mint of discoveredMints) {
      if (rateLimited || resolutionAttempts >= MAX_RESOLUTION_ATTEMPTS) {
        break
      }
      
      const key = `mint:${mint}`
      const existing = await kv.get<DiscoveredMint>(key)
      
      if (!existing) {
        // New mint - store it
        const mintData: DiscoveredMint = {
          mint,
          firstSeenAt: now,
          lastCheckedAt: now,
          source: "quicknode",
          resolved: false,
        }
        
        await kv.set(key, mintData, { ex: 60 * 60 * 24 * 90 }) // Keep for 90 days
        newMints.push(mint)
        
        // Try to resolve BEST DEX pair immediately (highest liquidity, prefer Solana)
        resolutionAttempts++
        try {
          const dexRes = await fetch(
            `https://api.dexscreener.com/latest/dex/tokens/${mint}`,
            {
              headers: { "User-Agent": "SOLRAD/1.0" },
              signal: AbortSignal.timeout(5000),
            }
          )
          
          // Handle 429 gracefully
          if (dexRes.status === 429) {
            console.warn("[v0] QN Mint ingestion: Hit 429 rate limit, stopping resolution")
            rateLimited = true
            break
          }
          
          if (dexRes.ok) {
            const dexData = await dexRes.json()
            
            if (dexData.pairs && dexData.pairs.length > 0) {
              // Select BEST pair using priority: liquidity desc, then volume desc, prefer Solana
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
                mintData.pairAddress = bestPair.pairAddress
                mintData.dexUrl = bestPair.url
                mintData.pairCreatedAt = bestPair.pairCreatedAt
                mintData.symbol = bestPair.baseToken?.symbol
                mintData.name = bestPair.baseToken?.name
                mintData.resolved = true
                mintData.lastCheckedAt = now
                
                await kv.set(key, mintData, { ex: 60 * 60 * 24 * 90 })
                resolvedCount++
                
                console.log("[v0] QN Mint ingestion: Resolved pair for", mint.slice(0, 8), bestPair.baseToken?.symbol)
              }
            }
          }
        } catch (resolveError) {
          // Ignore resolution errors - can retry later
          if (resolveError instanceof Error && resolveError.message.includes("429")) {
            rateLimited = true
            break
          }
        }
      } else {
        existingMints.push(mint)
        
        // If existing but not resolved OR last checked >48h ago, try to resolve again
        const hoursSinceCheck = (now - existing.lastCheckedAt) / (1000 * 60 * 60)
        if ((!existing.resolved || hoursSinceCheck > 48) && resolutionAttempts < MAX_RESOLUTION_ATTEMPTS) {
          resolutionAttempts++
          try {
            const dexRes = await fetch(
              `https://api.dexscreener.com/latest/dex/tokens/${mint}`,
              {
                headers: { "User-Agent": "SOLRAD/1.0" },
                signal: AbortSignal.timeout(5000),
              }
            )
            
            // Handle 429
            if (dexRes.status === 429) {
              console.warn("[v0] QN Mint ingestion: Hit 429 rate limit, stopping resolution")
              rateLimited = true
              break
            }
            
            if (dexRes.ok) {
              const dexData = await dexRes.json()
              
              if (dexData.pairs && dexData.pairs.length > 0) {
                // Select BEST pair
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
                  existing.pairAddress = bestPair.pairAddress
                  existing.dexUrl = bestPair.url
                  existing.pairCreatedAt = bestPair.pairCreatedAt
                  existing.symbol = bestPair.baseToken?.symbol
                  existing.name = bestPair.baseToken?.name
                  existing.resolved = true
                  existing.lastCheckedAt = now
                  
                  await kv.set(key, existing, { ex: 60 * 60 * 24 * 90 })
                  resolvedCount++
                  
                  console.log("[v0] QN Mint ingestion: Re-resolved pair for", mint.slice(0, 8), bestPair.baseToken?.symbol)
                }
              }
            }
          } catch {
            // Ignore - can retry later
          }
        }
      }
    }
    
    // Final comprehensive log with all metrics
    console.log("[v0] QN Mint ingestion: Complete", {
      provider: "QuickNode",
      signaturesFetched: signatures.length,
      transactionsFetched: processedCount,
      mintsDiscovered: discoveredMints.size,
      minutesBack,
      limit,
      new: newMints.length,
      existing: existingMints.length,
      resolved: resolvedCount,
      rateLimited,
    })
    
    // PROOF OF EXECUTION: Write KV receipt for monitoring
    const receipt = {
      at: Date.now(),
      ok: true,
      enabled: discoveryEnabled,
      rpcUrlPresent,
      signaturesFetched: signatures.length,
      transactionsFetched: processedCount,
      mintsDiscovered: discoveredMints.size,
      new: newMints.length,
      existing: existingMints.length,
      resolved: resolvedCount,
      rateLimited,
    }
    
    try {
      await kv.set("solrad:quicknode:lastRun", receipt, { ex: 60 * 60 * 24 * 7 }) // Keep for 7 days
    } catch (kvError) {
      console.error("[v0] QN Mint ingestion: Failed to write KV receipt", kvError)
      // Don't fail the request if KV write fails
    }
    
    return NextResponse.json({
      ok: true,
      provider: "QuickNode",
      signaturesFetched: signatures.length,
      transactionsFetched: processedCount,
      discovered: discoveredMints.size,
      new: newMints.length,
      existing: existingMints.length,
      resolved: resolvedCount,
      rateLimited,
      newMints: newMints.slice(0, 5), // Return sample
    })
    
  } catch (error) {
    console.error("[v0] QN Mint ingestion error:", error)
    
    // PROOF OF EXECUTION: Write error receipt for monitoring
    const errorReceipt = {
      at: Date.now(),
      ok: false,
      enabled: discoveryEnabled,
      rpcUrlPresent,
      signaturesFetched: 0,
      transactionsFetched: 0,
      mintsDiscovered: 0,
      new: 0,
      existing: 0,
      resolved: 0,
      rateLimited: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
    
    try {
      await kv.set("solrad:quicknode:lastRun", errorReceipt, { ex: 60 * 60 * 24 * 7 })
    } catch (kvError) {
      console.error("[v0] QN Mint ingestion: Failed to write error receipt", kvError)
    }
    
    return NextResponse.json(
      { 
        error: "Ingestion failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
