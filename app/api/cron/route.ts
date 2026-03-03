import { type NextRequest, NextResponse } from "next/server"
import { ingestTokenData } from "@/lib/ingestion"

/**
 * Safe parser for snapshot index data from storage.
 * Handles: array (use as-is), string (parse JSON or CSV-like), or unknown (default to [])
 */
function safeParseIndex(value: unknown): string[] {
  // Already an array - use as-is
  if (Array.isArray(value)) {
    console.log(`[v0] Cron: index is array, length=${value.length}`)
    return value
  }

  // String - try JSON parse, fallback to CSV-like split
  if (typeof value === "string") {
    console.log(`[v0] Cron: index is string, length=${value.length}`)
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        console.log(`[v0] Cron: JSON parsed successfully, length=${parsed.length}`)
        return parsed
      }
      console.log(`[v0] Cron: JSON parsed but not array, type=${typeof parsed}`)
    } catch {
      // Failed to parse as JSON - try CSV-like split
      console.log("[v0] Cron: JSON parse failed, trying CSV-like split")
      const split = value
        .split(/[\n,]/)
        .map(s => s.trim())
        .filter(Boolean)
      console.log(`[v0] Cron: CSV split result, length=${split.length}`)
      return split
    }
  }

  // Unknown type - default to empty array
  console.log(`[v0] Cron: index is unknown type=${typeof value}, defaulting to []`)
  return []
}

/**
 * Merge newly discovered tokens into the existing rolling window index.
 * Enforces rolling cap and deduplicates by mint address.
 */
async function updateTokenIndex(newTokenMints: string[]): Promise<{
  indexSizeBefore: number
  indexSizeAfter: number
  discoveredCount: number
}> {
  const { storage, CACHE_KEYS } = await import("@/lib/storage")
  const ROLLING_CAP = 1000 // Keep newest 1000 tokens
  
  // Get existing index
  const indexData = await storage.get(CACHE_KEYS.SNAPSHOTS_INDEX)
  const existingIndex = safeParseIndex(indexData)
  
  const indexSizeBefore = existingIndex.length
  console.log(`[v0] Cron: Index before merge: ${indexSizeBefore} tokens`)
  
  // Create set for deduplication (case-insensitive)
  const existingSet = new Set(existingIndex.map(m => m.toLowerCase()))
  
  // Filter new tokens (only add those not already tracked)
  const trulyNewMints = newTokenMints.filter(mint => !existingSet.has(mint.toLowerCase()))
  const discoveredCount = trulyNewMints.length
  
  console.log(`[v0] Cron: Discovered ${discoveredCount} new tokens (${newTokenMints.length} total from source)`)
  
  // Merge: existing + new tokens
  const mergedIndex = [...existingIndex, ...trulyNewMints]
  
  // Enforce rolling cap: keep newest N tokens (assuming newest are at the end)
  const cappedIndex = mergedIndex.slice(-ROLLING_CAP)
  const indexSizeAfter = cappedIndex.length
  
  // Write updated index back to storage
  await storage.set(CACHE_KEYS.SNAPSHOTS_INDEX, cappedIndex, { ex: 86400 }) // 24 hour TTL
  
  console.log(`[v0] Cron: Index after merge: ${indexSizeAfter} tokens (cap: ${ROLLING_CAP})`)
  
  return {
    indexSizeBefore,
    indexSizeAfter,
    discoveredCount,
  }
}

export async function GET(request: NextRequest) {
  try {
    // Auth: allow Vercel Cron UA bypass, then fallback to secret check
    const ua = request.headers.get("user-agent") ?? ""
    const isVercelCron = ua.includes("vercel-cron")
    const cronSecret = process.env.CRON_SECRET ?? process.env.SOLRAD_CRON_SECRET

    if (!isVercelCron) {
      const authHeader = request.headers.get("authorization")
      if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    console.log("[v0] Cron: Starting scheduled ingestion with token discovery (FORCED)")

    // Run ingestion to discover new tokens - FORCE fresh ingestion to pull new tokens every 5 min
    const result = await ingestTokenData(true)

    if (result.success) {
      // Extract newly discovered token mints from ingestion result
      const { getCachedTokens } = await import("@/lib/ingestion")
      const { kv } = await import("@vercel/kv")
      const cachedData = await getCachedTokens()
      const newTokenMints: string[] = []

      // Write score + signalState for every token before adding to index
      for (const token of (cachedData?.tokens ?? [])) {
        if (!token.address) continue
        newTokenMints.push(token.address)

        if (typeof token.totalScore === "number") {
          try {
            const signalState = token.totalScore >= 85 ? "PEAK"
              : token.totalScore >= 75 ? "STRONG"
              : token.totalScore >= 65 ? "CAUTION"
              : token.totalScore >= 50 ? "EARLY"
              : "DETECTED"

            await kv.set(`solrad:token:score:${token.address}`, {
              totalScore: token.totalScore,
              signalState,
              lastUpdated: Date.now(),
            }, { ex: 3600 })

            await kv.set(`solrad:signalState:${token.address}`, signalState, { ex: 3600 })
          } catch {
            // Non-critical, continue
          }
        }
      }
      
      console.log(`[v0] Cron: Ingestion completed - ${result.tokensProcessed} tokens processed, ${newTokenMints.length} scored`)
      
      // Update the rolling token index
      const indexStats = await updateTokenIndex(newTokenMints)
      
      console.log(`[v0] Cron: Token Index Update:`)
      console.log(`  - discoveredCount: ${indexStats.discoveredCount}`)
      console.log(`  - indexSizeBefore: ${indexStats.indexSizeBefore}`)
      console.log(`  - indexSizeAfter: ${indexStats.indexSizeAfter}`)
      console.log(`[v0] Cron: Success - ${result.tokensProcessed} tokens, ${result.duration}ms`)
      
      return NextResponse.json({
        success: true,
        message: "Ingestion completed successfully",
        savedSnapshots: true,
        windowIndexSize: indexStats.indexSizeAfter,
        discoveredCount: indexStats.discoveredCount,
        indexSizeBefore: indexStats.indexSizeBefore,
        indexSizeAfter: indexStats.indexSizeAfter,
        ...result,
      })
    } else {
      // Even on ingestion failure, try to maintain index
      console.error(`[v0] Cron: Ingestion failed - ${result.error}`)
      
      // Return 200 with error details (as per requirement: "Cron must always return 200")
      return NextResponse.json({
        success: false,
        error: result.error,
        windowIndexSize: 0,
        discoveredCount: 0,
        indexSizeBefore: 0,
        indexSizeAfter: 0,
      })
    }
  } catch (error) {
    console.error("[v0] Cron: Error", error)
    
    // Always return 200 (as per requirement)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      windowIndexSize: 0,
      discoveredCount: 0,
      indexSizeBefore: 0,
      indexSizeAfter: 0,
    })
  }
}
