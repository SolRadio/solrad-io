import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

interface VelocityAlert {
  mint: string
  symbol: string
  scoreDelta: number
  currentScore: number
  previousScore: number
  priceUsd: number
  volume24h: number
  liquidityUsd: number
  pairAgeDays: number
  detectedAt: number
  surgeDetectedAt?: number
}

export async function GET() {
  try {
    const raw = (await kv.get<VelocityAlert[]>("score-velocity:alerts").catch(() => null)) ?? []

    // Safety-net dedup by mint: keep highest scoreDelta per mint
    const deduped = Object.values(
      raw.reduce((acc, signal) => {
        const key = signal.mint
        if (!acc[key] || signal.scoreDelta > acc[key].scoreDelta) {
          acc[key] = signal
        }
        return acc
      }, {} as Record<string, VelocityAlert>)
    )

    // Filter out dead tokens: require minimum delta of 5 and volume >= $1000
    const alerts = deduped
      .filter(a => a.scoreDelta >= 5)
      .filter(a => (a.volume24h ?? 0) >= 1000)
      .filter(a => a.currentScore !== a.previousScore)

    // Sort by scoreDelta descending (most significant surges first)
    alerts.sort((a, b) => b.scoreDelta - a.scoreDelta)

    return NextResponse.json(alerts, {
      headers: { "Cache-Control": "private, max-age=60" },
    })
  } catch {
    return NextResponse.json([], {
      headers: { "Cache-Control": "private, max-age=30" },
    })
  }
}
