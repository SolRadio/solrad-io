import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { postDailyDigest } from "@/lib/intelligence/twitter-publisher"

export const maxDuration = 60
export const dynamic = "force-dynamic"

/**
 * GET /api/cron/twitter-digest
 * Posts a daily signal digest to Twitter/X.
 *
 * Called twice daily:
 * - 8AM UTC: morning digest of top overnight signals
 * - 2PM UTC: afternoon update of active signals
 *
 * Protected by CRON_SECRET / x-vercel-cron / x-ops-password.
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
    const now = new Date()
    const utcHour = now.getUTCHours()
    const digestType = utcHour < 12 ? "morning" : "afternoon"
    const date = now.toISOString().split("T")[0]

    // Dedup guard — only post once per digest type per day
    const dedupKey = `solrad:twitter:digest:${date}:${digestType}`
    const alreadyPosted = await kv.get(dedupKey)
    if (alreadyPosted) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: `${digestType} digest already posted for ${date}`,
      })
    }

    // Load background tokens to find current top signals
    const bgMints = (await kv.get<string[]>("solrad:background:mints")) ?? []

    const tokenDataResults = await Promise.allSettled(
      bgMints.slice(0, 200).map(async (mint) => {
        const data = await kv.get<Record<string, unknown>>(
          `solrad:background:token:${mint}`
        )
        return data
      })
    )

    const candidates = tokenDataResults
      .filter(
        (r): r is PromiseFulfilledResult<Record<string, unknown>> =>
          r.status === "fulfilled" && r.value !== null
      )
      .map((r) => r.value)

    // Run breakout detection to get fresh scores
    const { detectBreakouts } = await import(
      "@/lib/intelligence/breakout-detector"
    )
    const signals = detectBreakouts(candidates)

    if (signals.length === 0) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "No qualifying signals found",
        digestType,
        candidatesScanned: candidates.length,
      })
    }

    // Build digest data from top 3 signals (filter negative momentum)
    const filtered =
      digestType === "morning"
        ? signals.filter((s) => s.priceChange1h > 0)
        : signals.filter((s) => s.priceChange6h > 0)

    const digestData = {
      signals: filtered.slice(0, 3).map((s) => ({
        symbol: s.symbol,
        score: s.score,
        breakoutScore: s.breakoutScore,
        reasons: s.reasons,
        priceChange1h: s.priceChange1h,
        priceChange6h: s.priceChange6h,
        volume24h: s.volume24h,
        pairUrl: s.pairUrl,
      })),
      digestType: digestType as "morning" | "afternoon",
      date,
    }

    // Post to Twitter
    const result = await postDailyDigest(digestData)

    if (result.ok) {
      // Mark as posted — 25 hour TTL to prevent double posting
      await kv.set(
        dedupKey,
        {
          postedAt: new Date().toISOString(),
          tweetId: result.tweetId,
          tweetUrl: result.tweetUrl,
          signalCount: digestData.signals.length,
        },
        { ex: 25 * 60 * 60 }
      )

      console.log(
        `[TWITTER-DIGEST] Posted ${digestType} digest: ${result.tweetUrl}`
      )
    } else {
      console.error(`[TWITTER-DIGEST] Failed: ${result.error}`)
    }

    return NextResponse.json({
      ok: result.ok,
      digestType,
      date,
      tweetUrl: result.tweetUrl,
      signalCount: digestData.signals.length,
      topSignals: digestData.signals.map((s) => s.symbol),
      error: result.error,
    })
  } catch (error) {
    console.error("[TWITTER-DIGEST] Error:", error)
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    )
  }
}
