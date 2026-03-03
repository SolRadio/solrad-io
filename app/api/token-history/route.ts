import { NextResponse } from "next/server"
import { getSnapshotHistory, type TokenSnapshot } from "@/lib/snapshotLogger"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const mint = searchParams.get("mint")
    const limitParam = searchParams.get("limit")
    const window = searchParams.get("window") as "6h" | "24h" | "7d" | null

    // Validate required params
    if (!mint) {
      return NextResponse.json(
        { error: "Missing required parameter: mint" },
        { status: 400 }
      )
    }

    // Parse limit (default 80, max 200)
    const limit = Math.min(parseInt(limitParam || "80", 10), 200)

    // Fetch snapshot history from KV
    const rawSnapshots = await getSnapshotHistory(mint, limit)

    // Normalize and sort by timestamp ascending
    const sortedSnapshots = rawSnapshots
      .filter((s) => s && typeof s.ts === "number")
      .sort((a, b) => a.ts - b.ts)

    // Filter by time window if provided
    let filteredSnapshots = sortedSnapshots
    if (window) {
      const now = Date.now()
      const windowMs = window === "6h" ? 6 * 60 * 60 * 1000 :
                       window === "7d" ? 7 * 24 * 60 * 60 * 1000 :
                       24 * 60 * 60 * 1000 // default 24h

      const cutoff = now - windowMs
      filteredSnapshots = sortedSnapshots.filter((s) => s.ts >= cutoff)
    }

    // Return response - always return 200 OK even if empty (graceful degradation)
    return NextResponse.json({
      mint,
      count: filteredSnapshots.length,
      window: window || "24h",
      snapshots: filteredSnapshots.map((s) => ({
        ts: s.ts,
        price: s.price,
        solradScore: s.solradScore,
        signalScore: s.signalScore,
        liquidityUsd: s.liquidityUsd,
        volume24hUsd: s.volume24hUsd,
        riskLabel: s.riskLabel,
      })),
    })
  } catch (error) {
    console.error("[v0] Token history API error:", error)
    // Return empty data gracefully (no 500 error)
    return NextResponse.json({
      mint: null,
      count: 0,
      window: "24h",
      snapshots: [],
    })
  }
}
