import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

/**
 * POST /api/admin/recover-null-scores
 * Recovers tokens with null/missing scores by re-fetching from DexScreener
 * and re-computing scores. Protected by OPS_PASSWORD.
 */

const DEXSCREENER_BASE = "https://api.dexscreener.com/latest/dex/tokens"
const BATCH_SIZE = 10
const BATCH_DELAY_MS = 1000
const SCORE_TTL = 3600 // 1 hour
const BG_TOKEN_TTL = 604800 // 7 days

function computeQuickScore(pair: any): number {
  const liq = pair.liquidity?.usd || 0
  const vol = pair.volume?.h24 || 0
  const txns = (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0)
  const age = pair.pairCreatedAt
    ? (Date.now() - pair.pairCreatedAt) / (1000 * 60 * 60)
    : 999
  const liquidityScore = Math.min(100, (liq / 50000) * 100)
  const volumeScore = Math.min(100, (vol / 100000) * 100)
  const activityScore = Math.min(100, (txns / 500) * 100)
  const ageScore =
    age < 1 ? 100 : age < 6 ? 80 : age < 24 ? 60 : age < 72 ? 40 : 20
  return Math.round(
    liquidityScore * 0.25 +
      volumeScore * 0.35 +
      activityScore * 0.25 +
      ageScore * 0.15
  )
}

export async function POST(request: Request) {
  // Auth check
  const opsPassword = process.env.OPS_PASSWORD
  const provided = request.headers.get("x-ops-password")
  if (!opsPassword || provided !== opsPassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Load all tracked mints
    const allMints =
      (await kv.get<string[]>("solrad:auto-tracked-mints")) ?? []

    if (allMints.length === 0) {
      return NextResponse.json({
        recovered: 0,
        skipped: 0,
        failed: 0,
        total: 0,
        message: "No tracked mints found",
      })
    }

    // Identify mints with null/missing scores
    const nullMints: string[] = []
    for (const mint of allMints) {
      const score = await kv.get(`solrad:token:score:${mint}`)
      if (score === null || score === undefined) {
        nullMints.push(mint)
      }
    }

    console.log(
      `[RECOVER] Found ${nullMints.length} null-score mints out of ${allMints.length} total`
    )

    if (nullMints.length === 0) {
      return NextResponse.json({
        recovered: 0,
        skipped: 0,
        failed: 0,
        total: 0,
        message: "All mints already have scores",
      })
    }

    let recovered = 0
    let skipped = 0
    let failed = 0

    // Process in batches
    for (let i = 0; i < nullMints.length; i += BATCH_SIZE) {
      const batch = nullMints.slice(i, i + BATCH_SIZE)

      await Promise.allSettled(
        batch.map(async (mint) => {
          try {
            const res = await fetch(`${DEXSCREENER_BASE}/${mint}`, {
              signal: AbortSignal.timeout(8000),
            })
            if (!res.ok) {
              failed++
              return
            }

            const json = await res.json()
            const pairs = json.pairs || []

            // Pick highest-liquidity Solana pair
            const solanaPairs = pairs.filter(
              (p: any) =>
                p.chainId === "solana" && (p.liquidity?.usd ?? 0) > 0
            )
            if (solanaPairs.length === 0) {
              skipped++
              return
            }

            const pair = solanaPairs.reduce((best: any, p: any) =>
              (p.liquidity?.usd ?? 0) > (best.liquidity?.usd ?? 0) ? p : best
            )

            const liq = pair.liquidity?.usd ?? 0
            const vol = pair.volume?.h24 ?? 0

            // Filter: skip if liquidity < $500 OR volume24h < $200
            if (liq < 500 || vol < 200) {
              skipped++
              return
            }

            const score = computeQuickScore(pair)

            const now = Date.now()
            const tokenData = {
              address: mint,
              symbol: pair.baseToken?.symbol || "???",
              name: pair.baseToken?.name || "Unknown",
              priceUsd: parseFloat(pair.priceUsd || "0"),
              volume24h: vol,
              liquidity: liq,
              marketCap: pair.marketCap || 0,
              txns24h:
                (pair.txns?.h24?.buys ?? 0) + (pair.txns?.h24?.sells ?? 0),
              imageUrl: pair.info?.imageUrl || null,
              pairAddress: pair.pairAddress || "",
              pairUrl: pair.url || "",
              totalScore: score,
              source: "recovery",
              recoveredAt: now,
              lastUpdated: now,
            }

            const signalState = score >= 85 ? "PEAK"
              : score >= 75 ? "STRONG"
              : score >= 65 ? "CAUTION"
              : score >= 50 ? "EARLY"
              : "DETECTED"

            // Write score + signalState + background token data to KV
            await Promise.all([
              kv.set(`solrad:token:score:${mint}`, score, { ex: SCORE_TTL }),
              kv.set(`solrad:signalState:${mint}`, signalState, { ex: SCORE_TTL }),
              kv.set(`solrad:background:token:${mint}`, tokenData, {
                ex: BG_TOKEN_TTL,
              }),
            ])

            recovered++
          } catch {
            failed++
          }
        })
      )

      // Delay between batches to avoid rate limits
      if (i + BATCH_SIZE < nullMints.length) {
        await new Promise((r) => setTimeout(r, BATCH_DELAY_MS))
      }
    }

    console.log(
      `[RECOVER] Complete: ${recovered} recovered, ${skipped} skipped, ${failed} failed out of ${nullMints.length}`
    )

    return NextResponse.json({
      recovered,
      skipped,
      failed,
      total: nullMints.length,
    })
  } catch (err) {
    console.error("[RECOVER] Fatal error:", err)
    return NextResponse.json(
      { error: "Recovery failed", message: (err as Error).message },
      { status: 500 }
    )
  }
}

export const dynamic = "force-dynamic"
export const maxDuration = 300
