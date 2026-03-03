import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

interface HeliusEnhancedTransaction {
  signature: string
  timestamp: number
  tokenTransfers?: Array<{
    mint: string
    tokenStandard?: string
  }>
  nativeTransfers?: Array<{
    fromUserAccount?: string
    toUserAccount?: string
    amount: number
  }>
  type: string
  description: string
}

// PART B: Enhanced mint tracking schema
interface DiscoveredMint {
  mint: string
  firstSeenAt: number
  lastCheckedAt: number
  source: "helius"
  pairAddress?: string
  dexUrl?: string
  pairCreatedAt?: number
  symbol?: string
  name?: string
  resolved: boolean
}

// Rate limiting: Track last call time to prevent excessive API usage
let lastHeliusCallTime = 0
const MIN_HELIUS_CALL_INTERVAL = 60000 // Minimum 60 seconds between Helius API calls

/**
 * POST /api/ingest/new-mints?limit=100&minutesBack=60
 * PART B: Discovers new SPL token mints using Helius API
 * Protected by CRON_SECRET for scheduled execution
 * 
 * Query params:
 * - limit: max mints to discover (default 100)
 * - minutesBack: how far back to search (default 60)
 * 
 * This endpoint:
 * 1. Queries Helius for recent token program transactions
 * 2. Identifies new mint initialization events
 * 3. Stores discovered mints in KV with stable schema
 * 4. Attempts to resolve BEST DEX pair from Dexscreener (highest liquidity)
 * 5. Handles 429 gracefully by stopping resolution and returning cached progress
 * 6. Rate limits Helius calls to minimum 60s intervals
 */
export async function POST(request: Request) {
  // HELIUS API DISABLED - This endpoint is disabled to reduce API usage
  // Set HELIUS_MINT_DISCOVERY_ENABLED='true' to re-enable
  const discoveryEnabled = process.env.HELIUS_MINT_DISCOVERY_ENABLED === 'true'
  if (!discoveryEnabled) {
    return NextResponse.json({
      ok: false,
      disabled: true,
      message: "Helius mint discovery is disabled. Set HELIUS_MINT_DISCOVERY_ENABLED=true to enable.",
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
    
    const heliusApiKey = process.env.HELIUS_API_KEY
    if (!heliusApiKey) {
      return NextResponse.json(
        { error: "HELIUS_API_KEY not configured" },
        { status: 500 }
      )
    }

    const now = Date.now() // Declare now here

    // Rate limit check: Prevent excessive Helius API usage
    const timeSinceLastCall = now - lastHeliusCallTime
    if (timeSinceLastCall < MIN_HELIUS_CALL_INTERVAL) {
      const waitTime = Math.ceil((MIN_HELIUS_CALL_INTERVAL - timeSinceLastCall) / 1000)
      console.warn(`[v0] Mint ingestion: Rate limited. Wait ${waitTime}s before next call.`)
      return NextResponse.json({
        ok: false,
        rateLimited: true,
        message: `Rate limited. Please wait ${waitTime} seconds before trying again.`,
        waitSeconds: waitTime,
      })
    }
    
    // PART B: Parse query params
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "100"), 200) // Cap at 200
    const minutesBack = Math.min(Number.parseInt(searchParams.get("minutesBack") || "60"), 1440) // Cap at 24h
    
    console.log("[v0] Mint ingestion: Starting...", { limit, minutesBack })
    
    // Get recent transactions from Helius Enhanced API
    const searchBackMs = minutesBack * 60 * 1000
    const searchFrom = Math.floor((now - searchBackMs) / 1000) // Unix seconds
    
    // Update last call time to enforce rate limit
    lastHeliusCallTime = now
    
    const heliusUrl = `https://api.helius.xyz/v0/addresses/TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA/transactions?api-key=${heliusApiKey}`
    
    const response = await fetch(heliusUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: {
          types: ["TOKEN_MINT"],
          startTime: searchFrom,
        },
        options: {
          limit, // Use query param
        },
      }),
    })
    
    if (!response.ok) {
      console.error("[v0] Helius API error:", response.status)
      return NextResponse.json(
        { error: "Failed to fetch from Helius", status: response.status },
        { status: 502 }
      )
    }
    
    const data = await response.json()
    const transactions = data as HeliusEnhancedTransaction[]
    
    console.log("[v0] Mint ingestion: Received", transactions.length, "transactions")
    
    // Extract unique mints
    const discoveredMints = new Set<string>()
    
    for (const tx of transactions) {
      if (tx.tokenTransfers) {
        for (const transfer of tx.tokenTransfers) {
          if (transfer.mint && transfer.mint.length >= 32) {
            discoveredMints.add(transfer.mint)
          }
        }
      }
    }
    
    console.log("[v0] Mint ingestion: Found", discoveredMints.size, "unique mints")
    
    // PART B: Store in KV and attempt pair resolution with 429 handling
    // Limit resolution attempts to reduce API usage
    const MAX_RESOLUTION_ATTEMPTS = 10 // Only resolve first 10 mints per cycle
    const newMints: string[] = []
    const existingMints: string[] = []
    let resolvedCount = 0
    let rateLimited = false
    let resolutionAttempts = 0
    
    for (const mint of discoveredMints) {
      if (rateLimited || resolutionAttempts >= MAX_RESOLUTION_ATTEMPTS) {
        // Stop resolution if we hit rate limit or max attempts
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
          source: "helius",
          resolved: false,
        }
        
        await kv.set(key, mintData, { ex: 60 * 60 * 24 * 90 }) // Keep for 90 days
        newMints.push(mint)
        
        // PART B: Try to resolve BEST DEX pair immediately (highest liquidity, prefer Solana)
        resolutionAttempts++
        try {
          const dexRes = await fetch(
            `https://api.dexscreener.com/latest/dex/tokens/${mint}`,
            {
              headers: { "User-Agent": "SOLRAD/1.0" },
              signal: AbortSignal.timeout(5000),
            }
          )
          
          // PART B: Handle 429 gracefully
          if (dexRes.status === 429) {
            console.warn("[v0] Mint ingestion: Hit 429 rate limit, stopping resolution")
            rateLimited = true
            break
          }
          
          if (dexRes.ok) {
            const dexData = await dexRes.json()
            
            if (dexData.pairs && dexData.pairs.length > 0) {
              // PART B: Select BEST pair using priority: liquidity desc, then volume desc, prefer Solana
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
                
                console.log("[v0] Mint ingestion: Resolved pair for", mint.slice(0, 8), bestPair.baseToken?.symbol)
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
        
        // PART B: If existing but not resolved OR last checked >48h ago, try to resolve again
        // Reduced re-resolution frequency to save API calls
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
            
            // PART B: Handle 429
            if (dexRes.status === 429) {
              console.warn("[v0] Mint ingestion: Hit 429 rate limit, stopping resolution")
              rateLimited = true
              break
            }
            
            if (dexRes.ok) {
              const dexData = await dexRes.json()
              
              if (dexData.pairs && dexData.pairs.length > 0) {
                // PART B: Select BEST pair
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
                  
                  console.log("[v0] Mint ingestion: Re-resolved pair for", mint.slice(0, 8), bestPair.baseToken?.symbol)
                }
              }
            }
          } catch {
            // Ignore - can retry later
          }
        }
      }
    }
    
    console.log("[v0] Mint ingestion: Complete", {
      total: discoveredMints.size,
      new: newMints.length,
      existing: existingMints.length,
      resolved: resolvedCount,
      rateLimited,
    })
    
    return NextResponse.json({
      ok: true,
      discovered: discoveredMints.size,
      new: newMints.length,
      existing: existingMints.length,
      resolved: resolvedCount,
      rateLimited,
      newMints: newMints.slice(0, 5), // Return sample
    })
    
  } catch (error) {
    console.error("[v0] Mint ingestion error:", error)
    return NextResponse.json(
      { 
        error: "Ingestion failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

export const dynamic = "force-dynamic"
export const maxDuration = 60 // Allow up to 60s for ingestion
