import { NextRequest, NextResponse } from "next/server"
import { verifyOpsPasswordFromHeader } from "@/lib/auth-helpers"
import { getTrackedTokens } from "@/lib/get-tracked-tokens"
import { logSnapshots, getSnapshotHistory } from "@/lib/snapshotLogger"

export const dynamic = "force-dynamic"

/**
 * POST /api/admin/snapshot/run
 * Admin-only (x-ops-password header).
 * Triggers the same snapshot logging as the cron, returns diagnostics.
 */
export async function POST(request: NextRequest) {
  if (!verifyOpsPasswordFromHeader(request)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    )
  }

  const t0 = Date.now()

  try {
    // 1. Fetch tokens (same source as cron/snapshot and dashboard)
    const tokens = await getTrackedTokens()

    if (tokens.length === 0) {
      return NextResponse.json({
        ok: true,
        attempted: 0,
        written: 0,
        skipped: 0,
        durationMs: Date.now() - t0,
        topWrittenMints: [],
        message: "No tokens available from getTrackedTokens()",
      }, {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      })
    }

    // 2. Snapshot latest values for all mints BEFORE writing
    const mintsBefore = new Map<string, number>()
    const sampleBefore = tokens.slice(0, 10)
    for (const token of sampleBefore) {
      const history = await getSnapshotHistory(token.address, 1)
      mintsBefore.set(token.address, history.length > 0 ? (history[0]?.ts ?? 0) : 0)
    }

    // 3. Run the exact same snapshot write as the cron
    await logSnapshots(tokens)

    // 4. Check which mints got new snapshots
    const topWrittenMints: Array<{
      mint: string
      symbol: string
      beforeNewestTs: number
      afterNewestTs: number
      written: boolean
    }> = []

    let written = 0
    let skipped = 0

    for (const token of sampleBefore) {
      const history = await getSnapshotHistory(token.address, 1)
      const afterTs = history.length > 0 ? (history[0]?.ts ?? 0) : 0
      const beforeTs = mintsBefore.get(token.address) ?? 0
      const wasWritten = afterTs > beforeTs

      if (wasWritten) written++
      else skipped++

      topWrittenMints.push({
        mint: token.address,
        symbol: token.symbol,
        beforeNewestTs: beforeTs,
        afterNewestTs: afterTs,
        written: wasWritten,
      })
    }

    // Estimate for remaining tokens (beyond sampled 10)
    const remainingEstimate = tokens.length - sampleBefore.length
    const writeRate = sampleBefore.length > 0 ? written / sampleBefore.length : 0
    const estimatedWritten = written + Math.round(remainingEstimate * writeRate)
    const estimatedSkipped = skipped + Math.round(remainingEstimate * (1 - writeRate))

    const durationMs = Date.now() - t0

    return NextResponse.json({
      ok: true,
      attempted: tokens.length,
      written: estimatedWritten,
      skipped: estimatedSkipped,
      sampled: sampleBefore.length,
      sampledWritten: written,
      sampledSkipped: skipped,
      durationMs,
      topWrittenMints,
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    })
  } catch (err) {
    return NextResponse.json({
      ok: false,
      attempted: 0,
      written: 0,
      skipped: 0,
      durationMs: Date.now() - t0,
      topWrittenMints: [],
      error: err instanceof Error ? err.message : String(err),
    }, {
      status: 500,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    })
  }
}
