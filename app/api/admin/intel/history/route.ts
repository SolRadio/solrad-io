import { NextResponse } from "next/server"
import { verifyOpsPasswordFromHeader } from "@/lib/auth-helpers"
import { getIntelReportByDate } from "@/lib/intel/storage"

/**
 * GET /api/admin/intel/history?days=14
 * Returns past daily intel reports from KV (capped at 14 keys).
 * Protected by x-ops-password header.
 */
export async function GET(request: Request) {
  if (!verifyOpsPasswordFromHeader(request)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const daysParam = parseInt(searchParams.get("days") || "14", 10)
    const days = Math.min(Math.max(daysParam, 1), 14) // Clamp 1-14

    // Build date strings for the last N days (YYYY-MM-DD)
    const dates: string[] = []
    const now = new Date()
    for (let i = 0; i < days; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      dates.push(d.toISOString().split("T")[0])
    }

    // Fetch all in parallel (max 14 KV reads)
    const results = await Promise.all(
      dates.map(async (date) => {
        const report = await getIntelReportByDate(date)
        return report ? { date, report } : null
      })
    )

    // Filter nulls and return only dates that have reports
    const reports = results.filter(Boolean) as Array<{
      date: string
      report: {
        generatedAt: number
        date: string
        signals: { topCandidates: number; rotationProxies: number; avgScore: number }
        candidates: Array<{
          symbol: string
          mint: string
          score: number
          priceChange24h: number
          liquidity: number
          volume24h: number
          volumeChange24h?: number
          reasonTags: string[]
        }>
        tweetDrafts: string[]
        tweetTrendingTop10: string
        telegramPacket: string
        aiVoiceUsed?: boolean
        newsIncluded?: boolean
        winnersIncluded?: boolean
      }
    }>

    return NextResponse.json({
      ok: true,
      days,
      reports,
    })
  } catch (error) {
    console.error("[v0] Failed to fetch intel history:", error)
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to fetch history",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export const dynamic = "force-dynamic"
