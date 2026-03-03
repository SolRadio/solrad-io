import { type NextRequest, NextResponse } from "next/server"
import { getTrackerMetrics } from "@/lib/tracker"
import { toCanonicalToken, joinCanonicalFlags } from "@/lib/canonical/canonicalToken"
import { getBlobState } from "@/lib/blob-storage"

export const dynamic = "force-dynamic"
export const revalidate = 30

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const window = (searchParams.get("window") || "24h") as "1h" | "4h" | "6h" | "24h" | "7d"
    const mode = (searchParams.get("mode") || "treasure") as "treasure" | "all"

    const result = await getTrackerMetrics(window, mode)

    // Normalize tracker metrics with canonical fields
    const canonicalMetrics = result.metrics.map(metric => {
      const canonical = toCanonicalToken({
        mint: metric.mint,
        symbol: metric.symbol,
        name: metric.name,
        scoreNow: metric.currentScore,
        firstSeenAt: metric.firstSeen,
        lastUpdatedAt: metric.lastSeen,
      })
      
      return {
        ...metric,
        _canonical: { ...canonical, hasSnapshot: true }, // All tracked tokens have snapshots
      }
    })
    
    const canonicalPreQualified = result.preQualified.map(metric => {
      const canonical = toCanonicalToken({
        mint: metric.mint,
        symbol: metric.symbol,
        name: metric.name,
        scoreNow: metric.currentScore,
        firstSeenAt: metric.firstSeen,
        lastUpdatedAt: metric.lastSeen,
      })
      
      return {
        ...metric,
        _canonical: { ...canonical, hasSnapshot: true },
      }
    })
    
    // Fetch pool mints for inPool flag
    let poolMints: string[] = []
    let archiveByMint: Record<string, any> = {}
    try {
      const blobState = await getBlobState()
      archiveByMint = blobState.archiveByMint || {}
      poolMints = Object.keys(archiveByMint)
    } catch (error) {
      console.warn("[v0] Failed to fetch pool mints for tracker:", error)
    }

    // Enrich metrics with imageUrl from archive for tokens that lack it
    console.log("[v0] Archive mint count:", Object.keys(archiveByMint).length)
    console.log("[v0] Pre-enrich sample:", JSON.stringify({
      symbol: canonicalMetrics[0]?.symbol,
      imageUrl: canonicalMetrics[0]?.imageUrl,
      mint: canonicalMetrics[0]?.mint?.slice(0, 8),
      archiveHit: !!archiveByMint[canonicalMetrics[0]?.mint],
      archiveImageUrl: archiveByMint[canonicalMetrics[0]?.mint]?.imageUrl?.slice(0, 40),
    }))

    const enrichImage = (metric: any) => {
      if (!metric.imageUrl && archiveByMint[metric.mint]) {
        metric.imageUrl = archiveByMint[metric.mint].imageUrl
      }
      return metric
    }
    canonicalMetrics.forEach(enrichImage)
    canonicalPreQualified.forEach(enrichImage)

    console.log("[v0] Post-enrich sample:", JSON.stringify({
      symbol: canonicalMetrics[0]?.symbol,
      imageUrl: canonicalMetrics[0]?.imageUrl?.slice(0, 50),
      hasImage: !!canonicalMetrics[0]?.imageUrl,
      totalWithImages: canonicalMetrics.filter((m: any) => !!m.imageUrl).length,
      totalMetrics: canonicalMetrics.length,
    }))
    
    // Apply inPool flags to metrics
    const metricsWithFlags = joinCanonicalFlags(
      canonicalMetrics.map(m => m._canonical!),
      { poolMints }
    )
    
    const preQualifiedWithFlags = joinCanonicalFlags(
      canonicalPreQualified.map(m => m._canonical!),
      { poolMints }
    )
    
    // Merge flags back into metrics
    canonicalMetrics.forEach((metric, i) => {
      if (metric._canonical && metricsWithFlags[i]) {
        metric._canonical.inPool = metricsWithFlags[i].inPool
      }
    })
    
    canonicalPreQualified.forEach((metric, i) => {
      if (metric._canonical && preQualifiedWithFlags[i]) {
        metric._canonical.inPool = preQualifiedWithFlags[i].inPool
      }
    })

    return NextResponse.json({
      ...result,
      metrics: canonicalMetrics,
      preQualified: canonicalPreQualified,
      meta: {
        asOf: new Date().toISOString(),
        snapshotCount: result.totalSnapshots,
        tokensTracked: result.tokensTracked,
        poolCount: poolMints.length,
        window,
        mode,
      },
    }, {
      headers: {
        "Cache-Control": "s-maxage=30, stale-while-revalidate=60",
      },
    })
  } catch (error) {
    console.error("[v0] Tracker API error:", error)
    return NextResponse.json({ error: "Failed to fetch tracker data" }, { status: 500 })
  }
}
