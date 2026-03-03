import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

/**
 * GET /api/cron/outcome-refresh
 * Re-evaluates outcomes for alpha ledger entries that are still "neutral"
 * and are older than 48 hours (price has had time to move).
 *
 * Runs hourly via cron.
 * Protected by CRON_SECRET.
 */
export async function GET(request: Request) {
  const isVercelCron = request.headers.get("x-vercel-cron") === "1"
  const cronSecret = process.env.CRON_SECRET ?? process.env.SOLRAD_CRON_SECRET
  const authHeader = request.headers.get("authorization")
  const opsPassword = process.env.OPS_PASSWORD || process.env.ADMIN_PASSWORD
  const providedOps = request.headers.get("x-ops-password")
  const isAuthorized =
    isVercelCron ||
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (opsPassword && providedOps === opsPassword) ||
    process.env.NODE_ENV === "development"

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Load full ledger
    const ledger = (await kv.get<any[]>("solrad:alpha:ledger")) ?? []
    const now = Date.now()
    const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000
    const WIN_THRESHOLD = 15 // +15% = win
    const LOSS_THRESHOLD = -15 // -15% = loss

    // Find neutral entries older than 48h that need re-evaluation
    const staleNeutral = ledger.filter((entry) => {
      if (entry.outcome !== "neutral") return false
      if (entry.voided) return false
      const age = now - new Date(entry.detectedAt).getTime()
      return age > FORTY_EIGHT_HOURS
    })

    if (staleNeutral.length === 0) {
      return NextResponse.json({
        ok: true,
        refreshed: 0,
        message: "No stale neutral entries",
      })
    }

    // Fetch current prices for stale neutral entries
    // Process in batches of 20 to avoid DexScreener rate limits
    const BATCH_SIZE = 20
    let refreshed = 0
    let failed = 0

    const updatedLedger = [...ledger]

    for (let i = 0; i < staleNeutral.length; i += BATCH_SIZE) {
      const batch = staleNeutral.slice(i, i + BATCH_SIZE)

      await Promise.allSettled(
        batch.map(async (entry) => {
          try {
            // Fetch current price from DexScreener
            const res = await fetch(
              `https://api.dexscreener.com/latest/dex/tokens/${entry.mint}`,
              {
                headers: { "User-Agent": "SOLRAD/1.0" },
                signal: AbortSignal.timeout(8000),
              }
            )
            if (!res.ok) return

            const data = await res.json()
            const pairs = (data.pairs ?? []).filter(
              (p: any) => p.chainId === "solana"
            )
            if (pairs.length === 0) return

            // Pick highest liquidity pair
            const pair = pairs.sort(
              (a: any, b: any) =>
                (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
            )[0]

            const currentPrice = parseFloat(pair.priceUsd || "0")
            if (!currentPrice || !entry.priceAtSignal) return

            // Calculate actual return since detection
            const pctSinceSignal =
              ((currentPrice - entry.priceAtSignal) / entry.priceAtSignal) * 100

            // Derive outcome
            const outcome =
              pctSinceSignal >= WIN_THRESHOLD
                ? "win"
                : pctSinceSignal <= LOSS_THRESHOLD
                  ? "loss"
                  : "neutral"

            // Only update if outcome changed from neutral
            if (outcome !== "neutral") {
              const idx = updatedLedger.findIndex((e) => e.id === entry.id)
              if (idx !== -1) {
                updatedLedger[idx] = {
                  ...updatedLedger[idx],
                  priceNow: currentPrice,
                  pct24h: pctSinceSignal,
                  outcome,
                  outcomeUpdatedAt: new Date().toISOString(),
                  outcomeSource: "outcome-refresh-cron",
                }
                refreshed++
              }
            }
          } catch {
            failed++
          }
        })
      )

      // Delay between batches
      if (i + BATCH_SIZE < staleNeutral.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    // Write updated ledger back if any changes
    if (refreshed > 0) {
      await kv.set("solrad:alpha:ledger", updatedLedger)
      console.log(
        `[OUTCOME-REFRESH] Updated ${refreshed} entries from neutral to win/loss`
      )
    }

    return NextResponse.json({
      ok: true,
      staleNeutralFound: staleNeutral.length,
      refreshed,
      failed,
      message: `Re-evaluated ${staleNeutral.length} stale neutral entries`,
    })
  } catch (error) {
    console.error("[OUTCOME-REFRESH] Error:", error)
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    )
  }
}

export const dynamic = "force-dynamic"
export const maxDuration = 300
