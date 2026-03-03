import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { recordSnapshotIfNeeded } from "@/lib/tracker"
import { getTrackedTokens } from "@/lib/get-tracked-tokens"

/**
 * Cron endpoint to automatically record token snapshots
 * Called by Vercel Cron every 10 minutes
 * 
 * Protected by CRON_SECRET env var
 */
export async function GET(request: Request) {
  const ts = Date.now()
  
  try {
    // 1. Verify authorization – allow Vercel Cron UA bypass
    const ua = request.headers.get("user-agent") ?? ""
    const isVercelCron = ua.includes("vercel-cron")
    const cronSecret = process.env.CRON_SECRET ?? process.env.SOLRAD_CRON_SECRET

    if (!isVercelCron) {
      if (!cronSecret) {
        console.log("[v0] Cron snapshot: CRON_SECRET not configured, skipping")
        return NextResponse.json(
          { ok: false, error: "CRON_SECRET not configured", ts },
          { status: 200 }
        )
      }

      const authHeader = request.headers.get("authorization")
      if (authHeader !== `Bearer ${cronSecret}`) {
        console.warn("[v0] Cron snapshot: Unauthorized request")
        return NextResponse.json(
          { ok: false, error: "Unauthorized", ts },
          { status: 401 }
        )
      }
    }
    
    console.log("[CRON-SNAPSHOT] Starting at", new Date().toISOString())
    await kv.set("solrad:cron-snapshot-started", Date.now())
    
    // 2. Fetch tokens using the same source as dashboard
    const tokens = await getTrackedTokens()
    
    if (tokens.length === 0) {
      console.log("[v0] Cron snapshot: No tokens to record")
      return NextResponse.json({
        ok: true,
        recorded: false,
        count: 0,
        reason: "No tokens available",
        ts,
      })
    }

    // Augment with background-tracked tokens that aren't in the main list
    try {
      const bgIndex = await kv.get<string[]>("solrad:background:mints") ?? []
      const mainAddresses = new Set(tokens.map(t => t.address?.toLowerCase()))
      const missingFromBg = bgIndex.filter(m => !mainAddresses.has(m.toLowerCase()))

      if (missingFromBg.length > 0) {
        const bgTokens = await Promise.allSettled(
          missingFromBg.slice(0, 200).map(async (mint) => {
            const data = await kv.get<any>(`solrad:background:token:${mint}`)
            return data || null
          })
        )
        const validBgTokens = bgTokens
          .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled" && r.value !== null)
          .map(r => r.value)
        tokens.push(...validBgTokens)
        console.log(`[CRON-SNAPSHOT] Augmented with ${validBgTokens.length} background tokens, total: ${tokens.length}`)
      }
    } catch (bgErr) {
      console.warn("[CRON-SNAPSHOT] Background augmentation failed (non-fatal):", bgErr)
    }
    
    // 3. Record snapshot (respects 10-min throttle internally)
    await recordSnapshotIfNeeded(tokens, "fresh")
    
    // 4. Write per-token score cache for audit/lead-time reads
    let perTokenWrites = 0
    for (const token of tokens) {
      if (token.address && typeof token.totalScore === "number") {
        try {
          await kv.set(
            `solrad:token:score:${token.address}`,
            {
              totalScore: token.totalScore,
              signalState: (token as Record<string, unknown>).signalState ?? null,
              priceUsd: token.priceUsd,
              volume24h: token.volume24h,
              liquidity: token.liquidity,
              lastUpdated: Date.now(),
            },
            { ex: 60 * 60 * 2 } // 2 hour TTL
          )
          perTokenWrites++
        } catch {
          // Non-critical, continue
        }
      }
    }
    
    // Write completion timestamp for freshness monitoring
    await kv.set("solrad:last-snapshot-time", Date.now())
    console.log("[CRON-SNAPSHOT] Completed successfully at", new Date().toISOString(), `for ${tokens.length} tokens, ${perTokenWrites} per-token scores cached`)
    
    return NextResponse.json({
      ok: true,
      recorded: true,
      count: tokens.length,
      ts,
    })
    
  } catch (error) {
    console.error("[CRON-SNAPSHOT] FAILED:", error instanceof Error ? error.message : error)
    await kv.set("solrad:cron-snapshot-error", {
      error: error instanceof Error ? error.message : "Unknown error",
      time: Date.now(),
    }).catch(() => {})
    
    // Return 200 even on error to avoid breaking cron
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
        ts,
      },
      { status: 200 }
    )
  }
}
