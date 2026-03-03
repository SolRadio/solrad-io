import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

/**
 * GET /api/analytics/win-rate
 * Computes win rate statistics from the alpha ledger.
 *
 * Query params:
 * - minScore: number (default 0 — include all scores)
 * - scoreMin/scoreMax: number (score range filter)
 * - detectionType: "FIRST_SEEN" | "SCORE_UPDATE" | "all" (default "all")
 * - days: number (look back N days, default all time)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const minScore = parseInt(searchParams.get("minScore") ?? "0")
    const scoreMin = parseInt(searchParams.get("scoreMin") ?? "0")
    const scoreMax = parseInt(searchParams.get("scoreMax") ?? "100")
    const detectionType = searchParams.get("detectionType") ?? "all"
    const days = parseInt(searchParams.get("days") ?? "0")

    const ledger = (await kv.get<any[]>("solrad:alpha:ledger")) ?? []
    const now = Date.now()
    const cutoff = days > 0 ? now - days * 24 * 60 * 60 * 1000 : 0

    // Filter entries
    const filtered = ledger.filter((entry) => {
      if (entry.voided) return false
      if (entry.scoreAtSignal < Math.max(minScore, scoreMin)) return false
      if (entry.scoreAtSignal > scoreMax) return false
      if (detectionType !== "all" && entry.detectionType !== detectionType) return false
      if (cutoff > 0 && new Date(entry.detectedAt).getTime() < cutoff) return false
      return true
    })

    // Compute overall stats
    const wins = filtered.filter((e) => e.outcome === "win").length
    const losses = filtered.filter((e) => e.outcome === "loss").length
    const neutrals = filtered.filter((e) => e.outcome === "neutral").length
    const decided = wins + losses
    const winRate = decided > 0 ? ((wins / decided) * 100).toFixed(1) : null

    // Compute stats by score tier
    const tiers = [
      { label: "EARLY (50-64)", min: 50, max: 64 },
      { label: "CAUTION (65-74)", min: 65, max: 74 },
      { label: "STRONG (75-84)", min: 75, max: 84 },
      { label: "PEAK (85+)", min: 85, max: 100 },
    ]

    const byTier = tiers.map((tier) => {
      const tierEntries = filtered.filter(
        (e) => e.scoreAtSignal >= tier.min && e.scoreAtSignal <= tier.max
      )
      const tierWins = tierEntries.filter((e) => e.outcome === "win").length
      const tierLosses = tierEntries.filter((e) => e.outcome === "loss").length
      const tierDecided = tierWins + tierLosses
      return {
        tier: tier.label,
        total: tierEntries.length,
        wins: tierWins,
        losses: tierLosses,
        neutral: tierEntries.length - tierDecided,
        winRate:
          tierDecided > 0
            ? parseFloat(((tierWins / tierDecided) * 100).toFixed(1))
            : null,
        avgPct:
          tierEntries.length > 0
            ? parseFloat(
                (
                  tierEntries.reduce((s, e) => s + (e.pct24h ?? 0), 0) /
                  tierEntries.length
                ).toFixed(1)
              )
            : null,
      }
    })

    // Best performing tokens
    const winners = filtered
      .filter((e) => e.outcome === "win")
      .sort((a, b) => (b.pct24h ?? 0) - (a.pct24h ?? 0))
      .slice(0, 10)
      .map((e) => ({
        symbol: e.symbol,
        mint: e.mint,
        scoreAtSignal: e.scoreAtSignal,
        pct24h: e.pct24h,
        detectedAt: e.detectedAt,
        detectionType: e.detectionType,
      }))

    // Detection type breakdown
    const firstSeenEntries = filtered.filter(
      (e) => e.detectionType === "FIRST_SEEN"
    )
    const firstSeenWins = firstSeenEntries.filter(
      (e) => e.outcome === "win"
    ).length
    const firstSeenDecided =
      firstSeenWins +
      firstSeenEntries.filter((e) => e.outcome === "loss").length

    const scoreUpdateEntries = filtered.filter(
      (e) => e.detectionType === "SCORE_UPDATE"
    )
    const scoreUpdateWins = scoreUpdateEntries.filter(
      (e) => e.outcome === "win"
    ).length
    const scoreUpdateDecided =
      scoreUpdateWins +
      scoreUpdateEntries.filter((e) => e.outcome === "loss").length

    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      filters: { minScore, scoreMin, scoreMax, detectionType, days },
      summary: {
        total: filtered.length,
        wins,
        losses,
        neutral: neutrals,
        decided,
        winRate: winRate ? parseFloat(winRate) : null,
        avgPct24h:
          filtered.length > 0
            ? parseFloat(
                (
                  filtered.reduce((s, e) => s + (e.pct24h ?? 0), 0) /
                  filtered.length
                ).toFixed(1)
              )
            : null,
      },
      byTier,
      byDetectionType: {
        FIRST_SEEN: {
          total: firstSeenEntries.length,
          wins: firstSeenWins,
          winRate:
            firstSeenDecided > 0
              ? parseFloat(
                  ((firstSeenWins / firstSeenDecided) * 100).toFixed(1)
                )
              : null,
        },
        SCORE_UPDATE: {
          total: scoreUpdateEntries.length,
          wins: scoreUpdateWins,
          winRate:
            scoreUpdateDecided > 0
              ? parseFloat(
                  ((scoreUpdateWins / scoreUpdateDecided) * 100).toFixed(1)
                )
              : null,
        },
      },
      topWinners: winners,
    })
  } catch (error) {
    console.error("[WIN-RATE] Error:", error)
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
