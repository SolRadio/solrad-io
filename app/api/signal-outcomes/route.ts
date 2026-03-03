import { NextResponse } from "next/server"
import { requireInternalJobOrOps } from "@/lib/internal-auth"
import { getSignalOutcomes } from "@/lib/signal-outcomes"

/**
 * GET /api/signal-outcomes
 *
 * Thin HTTP wrapper around the shared getSignalOutcomes() function.
 * All business logic lives in /lib/signal-outcomes.ts.
 */
export async function GET(request: Request) {
  // Auth gate: require internal job token OR ops password
  const auth = requireInternalJobOrOps(request)
  const _isInternal = auth.ok && auth.mode === "internal"

  try {
    const { searchParams } = new URL(request.url)
    const sort = (searchParams.get("sort") || "priceChangePct24h") as "priceChangePct24h" | "detectedAt" | "scoreAtSignal"
    const limit = parseInt(searchParams.get("limit") || "50", 10)
    const minScore = parseInt(searchParams.get("minScore") || "75", 10)
    const debug = searchParams.get("debug") === "1"
    const debugMint = searchParams.get("debugMint")?.trim() || null

    const data = await getSignalOutcomes({ sort, limit, minScore, debug, debugMint })

    const response = NextResponse.json(data)

    // Prevent any caching -- must always reflect live KV state
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")

    // Debug breadcrumb: mark if internal auth was used
    if (_isInternal) {
      response.headers.set("x-internal-auth", "1")
    }

    return response
  } catch (error) {
    console.error("[signal-outcomes] API error:", error)
    // Return empty gracefully (no 500 errors)
    return NextResponse.json({
      updatedAt: Date.now(),
      minScore: 75,
      count: 0,
      signals: [],
      nearCount: 0,
      nearSignals: [],
      tokensAnalyzed: 0,
      debug: {
        minScore: 75,
        tokensAnalyzed: 0,
        tokensWithAnyHistory: 0,
        tokensWithWindowHistory: 0,
        tokensWith2PlusSnapshots: 0,
        tokensCrossingThreshold: 0,
        tokensFirstSeenAboveThreshold: 0,
        tokensAnySnapshotAboveThreshold: 0,
        pushedSignalsCount: 0,
        pushedNearSignalsCount: 0,
        droppedInsufficientSnapshots: 0,
        droppedNoEvent: 0,
        exampleCross: null,
        exampleFirstSeen: null,
        sampleSnapshotKeys: [],
        newestSnapshotTs: null,
        oldestSnapshotTs: null,
        reasonIfEmpty: `API Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? null,
        gitSha: null,
        maxScoreInWindow: 0,
        exampleMaxScoreMint: null,
        exampleMaxScoreValue: null,
        exampleMaxScoreTs: null,
        exampleMaxScoreRawKeys: [],
      },
    })
  }
}
