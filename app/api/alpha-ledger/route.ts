import { NextResponse } from "next/server"
import { readLedger, readMeta, computeMetrics, normalizeMint, isValidMintStr, computeEntryHash } from "@/lib/alpha-ledger"

/**
 * GET /api/alpha-ledger
 * Public endpoint - returns ledger entries + derived metrics.
 *
 * Query params:
 *   range     = 24h | 7d | 30d | all (default: all)
 *   outcome   = win | loss | neutral
 *   type      = FIRST_SEEN | CROSS | manual | etc
 *   minScore  = number
 *   q         = search string (symbol/name)
 *   limit     = number (default 200, max 500)
 *   includeVoided = true (default: false)
 */
export async function GET(request: Request) {
  const requestId = `al-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get("range") || "all"
    const outcomeFilter = searchParams.get("outcome")
    const typeFilter = searchParams.get("type")
    const minScoreRaw = searchParams.get("minScore")
    const minScore = minScoreRaw ? Number(minScoreRaw) : null
    const q = searchParams.get("q")?.toLowerCase()
    const limit = Math.min(Number(searchParams.get("limit") || "200"), 500)
    const includeVoided = searchParams.get("includeVoided") === "true"

    const [rawEntries, meta] = await Promise.all([readLedger(), readMeta()])

    // Normalize mints at read-time (safe against object mints)
    // Also backfill entryHash for entries saved before hashing was added
    let invalidMintCount = 0
    const allEntries = rawEntries.map((e) => {
      const safe = normalizeMint(e.mint)
      if (!isValidMintStr(safe)) invalidMintCount++
      const withMint = { ...e, mint: safe }
      if (!withMint.entryHash) {
        withMint.entryHash = computeEntryHash(withMint)
      }
      return withMint
    })

    // Filter voided
    let entries = includeVoided ? allEntries : allEntries.filter((e) => !e.voided)

    // Range filter (unknown ranges default to 30d, not zero-results)
    if (range !== "all") {
      const now = Date.now()
      const ms: Record<string, number> = {
        "24h": 24 * 60 * 60 * 1000,
        "7d": 7 * 24 * 60 * 60 * 1000,
        "30d": 30 * 24 * 60 * 60 * 1000,
      }
      const rangeMs = ms[range] ?? ms["30d"]
      const cutoff = now - rangeMs
      entries = entries.filter((e) => {
        const ts = new Date(e.detectedAt).getTime()
        return Number.isFinite(ts) && ts >= cutoff
      })
    }

    // Outcome filter
    if (outcomeFilter && ["win", "loss", "neutral"].includes(outcomeFilter)) {
      entries = entries.filter((e) => e.outcome === outcomeFilter)
    }

    // Detection type filter
    if (typeFilter) {
      entries = entries.filter((e) => e.detectionType === typeFilter)
    }

    // Min score filter
    if (minScore !== null && Number.isFinite(minScore)) {
      entries = entries.filter((e) => (e.scoreAtSignal ?? 0) >= minScore)
    }

    // Search filter (safe: coerce fields to string before toLowerCase)
    if (q) {
      entries = entries.filter(
        (e) =>
          (typeof e.symbol === "string" && e.symbol.toLowerCase().includes(q)) ||
          (typeof e.name === "string" && e.name.toLowerCase().includes(q)) ||
          (typeof e.mint === "string" && e.mint.toLowerCase().includes(q)),
      )
    }

    // Compute metrics from filtered set
    const metrics = computeMetrics(entries, meta)

    // Apply limit
    const limited = entries.slice(0, limit)

    return NextResponse.json({
      ok: true,
      requestId,
      entries: limited,
      totalFiltered: entries.length,
      metrics,
      _debug: {
        totalInKV: allEntries.length,
        afterVoidFilter: (includeVoided ? allEntries : allEntries.filter((e) => !e.voided)).length,
        afterRangeFilter: entries.length,
        rangeUsed: range,
        sampleEntry: allEntries[0] ? { id: allEntries[0].id, mint: typeof allEntries[0].mint, detectedAt: allEntries[0].detectedAt, outcome: allEntries[0].outcome, entryHash: allEntries[0].entryHash } : null,
      },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    console.error("[alpha-ledger]", requestId, msg, error)
    return NextResponse.json(
      { ok: false, error: "alpha-ledger-failed", message: msg, requestId, entries: [], metrics: null },
      { status: 500 },
    )
  }
}
