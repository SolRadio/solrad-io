import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { detectBreakouts } from "@/lib/intelligence/breakout-detector"
import { publishToTelegram } from "@/lib/intelligence/telegram-publisher"

export const maxDuration = 300

/**
 * GET /api/cron/intelligence
 * Runs every 5 minutes. Scans background-tracked tokens for breakout
 * signals and publishes high-confidence ones to Telegram.
 *
 * Deduplication: tracks published mints in KV with 4-hour cooldown
 * so the same token isn't spammed repeatedly.
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

  // Real Vercel cron sets x-vercel-cron header
  // Manual admin triggers do not -- treat as dry run
  const isRealCron = request.headers.get("x-vercel-cron") === "1"
  const isDryRun = !isRealCron

  try {
    // Load all background-tracked tokens
    const bgMints = (await kv.get<string[]>("solrad:background:mints")) ?? []

    if (bgMints.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "No background tokens",
        signals: 0,
      })
    }

    // Load token data for all mints
    const tokenDataResults = await Promise.allSettled(
      bgMints.slice(0, 300).map(async (mint) => {
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

    // Run breakout detection
    const signals = detectBreakouts(candidates as any[])

    const qualifiedSignals = signals.filter(s => s.breakoutScore >= 60)
    if (qualifiedSignals.length === 0) {
      return NextResponse.json({
        ok: true,
        scanned: candidates.length,
        signals: 0,
        message: "No qualifying signals (score >= 60) detected this cycle",
      })
    }
    const topSignals = qualifiedSignals.slice(0, 3)

    // Deduplicate -- don't re-publish same token within 2 hours
    const COOLDOWN_TTL = 2 * 60 * 60 // seconds
    const published: string[] = []
    const skipped: string[] = []
    const telegramEnabled = !!(
      process.env.TELEGRAM_BOT_TOKEN && (process.env.TELEGRAM_ALERTS_CHAT_ID ?? process.env.TELEGRAM_CHANNEL_ID)
    )

    for (const signal of topSignals) {
      try {
        const cooldownKey = `solrad:intel:published:${signal.mint}`

        // Only check/set cooldown on real cron runs
        if (!isDryRun) {
          const lastPublished = await kv.get<number>(cooldownKey)
          if (lastPublished && Date.now() - lastPublished < COOLDOWN_TTL * 1000) {
            skipped.push(signal.symbol)
            continue
          }
        }

        if (!isDryRun) {
          // Store signal in intelligence history
          await kv.set(
            `solrad:intel:signal:${signal.mint}:${Date.now()}`,
            signal,
            { ex: 60 * 60 * 24 * 7 } // 7 day TTL
          )

          // Mark as published with cooldown
          await kv.set(cooldownKey, Date.now(), { ex: COOLDOWN_TTL })

          // Publish to Telegram if configured
          if (telegramEnabled) {
            const result = await publishToTelegram(signal)
            if (!result.ok) {
              console.warn(
                `[INTEL] Telegram publish failed for ${signal.symbol}:`,
                result.error
              )
            }
          }
        }

        published.push(signal.symbol)
        console.log(
          `[INTEL] Signal: ${signal.symbol} | Score: ${signal.score} | Breakout: ${signal.breakoutScore} | ${signal.reasons.join(", ")}`
        )
      } catch (err) {
        console.warn(`[INTEL] Error processing ${signal.symbol}:`, err)
      }
    }

    // Store last run summary
    await kv.set(
      "solrad:intel:last-run",
      {
        runAt: new Date().toISOString(),
        scanned: candidates.length,
        detected: signals.length,
        published: published.length,
        topSignal: signals[0] ?? null,
      },
      { ex: 60 * 60 }
    )

    return NextResponse.json({
      ok: true,
      dryRun: isDryRun,
      scanned: candidates.length,
      detected: signals.length,
      published: published.length,
      skipped: skipped.length,
      telegramEnabled,
      topSignals: signals.slice(0, 5).map((s) => ({
        symbol: s.symbol,
        score: s.score,
        breakoutScore: s.breakoutScore,
        reasons: s.reasons,
      })),
    })
  } catch (error) {
    console.error("[INTEL] Error:", error)
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
