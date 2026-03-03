import { NextRequest, NextResponse } from "next/server"
import { storage } from "@/lib/storage"
import { getBackgroundTokens } from "@/lib/background-tracker"

export const maxDuration = 30

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronHeader = req.headers.get("x-vercel-cron")

  if (authHeader !== "Bearer " + process.env.CRON_SECRET && !cronHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const tokens = await getBackgroundTokens()
    const alerts: {
      mint: string
      symbol: string
      score: number
      prevScore: number
      delta: number
      alertType: string
    }[] = []

    for (const token of tokens) {
      const mint = token.address as string
      if (!mint) continue

      const prevScoreKey = "solrad:background:prev-score:" + mint
      const prevScore = ((await storage.get(prevScoreKey)) as number) || 0
      const currentScore = (token.totalScore as number) || 0

      const scoreDelta = currentScore - prevScore

      // Alert if score jumped 10+ points and now >= 60
      if (scoreDelta >= 10 && currentScore >= 60) {
        alerts.push({
          mint,
          symbol: (token.symbol as string) || "???",
          score: currentScore,
          prevScore,
          delta: scoreDelta,
          alertType: "SCORE_SURGE",
        })
        console.log(
          "[background-alert] Score surge:",
          token.symbol,
          prevScore + " -> " + currentScore
        )
      }

      // Update previous score (24h TTL)
      await storage.set(prevScoreKey, currentScore, { ex: 60 * 60 * 24 })
    }

    // Store alerts for push notification system
    if (alerts.length > 0) {
      await storage.set("solrad:background:pending-alerts", alerts, {
        ex: 60 * 60, // 1 hour TTL
      })
    }

    return NextResponse.json({
      checked: tokens.length,
      alerts: alerts.length,
      alertDetails: alerts,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error("[background-alerts]", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
