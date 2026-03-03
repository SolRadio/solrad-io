import { NextResponse } from "next/server"
import { getTrackedMints, getSnapshotHistory, type TokenSnapshot, getSnapshotsLast24h } from "@/lib/snapshotLogger"
import type { SnapshotSummary } from "@/lib/types"

export async function GET() {
  try {
    // Get all tracked mints from KV
    const mints = await getTrackedMints()
    
    // Get snapshot history for each mint (last 200 snapshots per mint)
    const byMint = new Map<string, TokenSnapshot[]>()
    const allSnapshots: TokenSnapshot[] = []
    
    for (const mint of mints) {
      const history = await getSnapshotHistory(mint, 200)
      if (history.length > 0) {
        byMint.set(mint, history)
        allSnapshots.push(...history)
      }
    }
    
    // Filter to last 24h
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000
    const snapshots = allSnapshots.filter(s => s.ts >= twentyFourHoursAgo)

    // Build summaries
    const summaries: SnapshotSummary[] = []
    for (const [mint, snaps] of byMint.entries()) {
      if (snaps.length === 0) continue
      
      // Sort by timestamp (KV uses `ts` field)
      snaps.sort((a, b) => a.ts - b.ts)

      const latest = snaps[snaps.length - 1]
      const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000
      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000

      // Find closest snapshots
      const snap6h = snaps.find((s) => s.ts <= sixHoursAgo)
      const snap24h = snaps.find((s) => s.ts <= twentyFourHoursAgo)

      const return6h = snap6h ? (latest.price / snap6h.price - 1) * 100 : null
      const return24h = snap24h ? (latest.price / snap24h.price - 1) * 100 : null

      summaries.push({
        mint,
        symbol: latest.symbol,
        latestSnapshot: {
          id: `${mint}-${latest.ts}`,
          createdAt: latest.ts,
          mint: latest.mint,
          symbol: latest.symbol,
          name: latest.name,
          price: latest.price,
          liquidityUsd: latest.liquidityUsd,
          volume24hUsd: latest.volume24hUsd,
          priceChange24h: 0, // Not tracked in KV snapshots
          riskLabel: latest.riskLabel as any,
          solradScore: latest.solradScore,
          signalScore: latest.signalScore,
          gemScore: latest.gemScore,
          activityRatio: latest.activityRatio,
          tokenAgeHours: null,
        },
        price6hAgo: snap6h?.price || null,
        price24hAgo: snap24h?.price || null,
        return6h,
        return24h,
        solradScore: latest.solradScore,
        signalScore: latest.signalScore,
        gemScore: latest.gemScore,
      })
    }

    // Calculate win rates for SIGNAL buckets
    const highSignal = summaries.filter((s) => s.signalScore !== null && s.signalScore >= 8)
    const medSignal = summaries.filter((s) => s.signalScore !== null && s.signalScore >= 6 && s.signalScore < 8)
    const lowSignal = summaries.filter((s) => s.signalScore !== null && s.signalScore < 6)

    const highWins = highSignal.filter((s) => s.return6h !== null && s.return6h >= 30).length
    const medWins = medSignal.filter((s) => s.return6h !== null && s.return6h >= 30).length
    const lowWins = lowSignal.filter((s) => s.return6h !== null && s.return6h >= 30).length

    const winRates = {
      high: {
        total: highSignal.length,
        wins: highWins,
        winRate: highSignal.length > 0 ? (highWins / highSignal.length) * 100 : 0,
      },
      medium: {
        total: medSignal.length,
        wins: medWins,
        winRate: medSignal.length > 0 ? (medWins / medSignal.length) * 100 : 0,
      },
      low: {
        total: lowSignal.length,
        wins: lowWins,
        winRate: lowSignal.length > 0 ? (lowWins / lowSignal.length) * 100 : 0,
      },
    }

    // Top 10 winners
    const winners = summaries
      .filter((s) => s.return24h !== null)
      .sort((a, b) => (b.return24h || 0) - (a.return24h || 0))
      .slice(0, 10)

    return NextResponse.json({
      summaries: summaries.sort((a, b) => (b.signalScore || 0) - (a.signalScore || 0)),
      winRates,
      topWinners: winners,
      totalSnapshots: snapshots.length,
      uniqueTokens: byMint.size,
    })
  } catch (error) {
    console.error("[v0] Score Lab error:", error)
    return NextResponse.json(
      {
        error: "Failed to load score lab data",
        summaries: [],
        winRates: { high: { total: 0, wins: 0, winRate: 0 }, medium: { total: 0, wins: 0, winRate: 0 }, low: { total: 0, wins: 0, winRate: 0 } },
        topWinners: [],
        totalSnapshots: 0,
        uniqueTokens: 0,
      },
      { status: 500 }
    )
  }
}
