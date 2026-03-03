/**
 * Lead-Time Ledger Aggregation API
 *
 * GET /api/leadtime-ledger
 * Normalizes lead-time proofs into flat ledger rows for the Proof Engine.
 *
 * Query params:
 *   range       = "24h" | "7d" | "30d"  (default "7d")
 *   confidence  = "HIGH" | "MEDIUM" | "MED" | "LOW"  (optional enum filter, omit for all)
 *   limit       = number                (default 100, cap 250)
 *   q           = string                (optional search)
 */

import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"
export const dynamic = "force-dynamic"

const CONFIDENCE_MAP: Record<string, number> = { LOW: 30, MED: 60, MEDIUM: 60, HIGH: 90 }

interface LeadTimeLedgerRow {
  id: string
  mint: string
  symbol: string
  name: string
  logo: string | null
  observedAt: string
  observationEvent: string
  reactionEvent: string
  leadSeconds: number
  leadBlocks: number
  confidence: number
  // On-chain evidence (optional, passed through from raw proof)
  observationSlot?: number
  observationBlockTime?: number
  reactionSlot?: number
  reactionBlockTime?: number
  sourceRpc?: string
}

// Normalize confidence string: accept HIGH, MEDIUM, MED, LOW (case-insensitive)
function normalizeConfidence(raw: string): string {
  const v = raw.toUpperCase().trim()
  if (v === "MED") return "MEDIUM"
  if (v === "HIGH" || v === "MEDIUM" || v === "LOW") return v
  return "" // unknown → no filter
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rawRange = searchParams.get("range") ?? "30d"
    const rawConf = searchParams.get("confidence") ?? ""
    const limit = Math.max(1, Math.min(250, Number(searchParams.get("limit") ?? "100")))
    const q = (searchParams.get("q") ?? "").toLowerCase().trim()

    // Safe range: unknown values fall back to 30d
    const rangeMs: Record<string, number> = {
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    }
    const rangeUsed = rangeMs[rawRange] ? rawRange : "30d"
    const cutoff = Date.now() - (rangeMs[rangeUsed] ?? rangeMs["30d"])

    // Confidence: enum-based, empty string means no filter
    const confidenceUsed = normalizeConfidence(rawConf)
    const minConfidence = confidenceUsed ? (CONFIDENCE_MAP[confidenceUsed] ?? 0) : 0

    // Fetch proofs from existing endpoint
    const origin = new URL(request.url).origin
    const res = await fetch(`${origin}/api/lead-time/recent?limit=250`, {
      headers: { accept: "application/json" },
      cache: "no-store",
    })

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: `Lead-time API returned ${res.status}` },
        { status: 502 },
      )
    }

    const data = await res.json()
    const proofs: Array<{
      mint: string
      symbol?: string
      name?: string
      observationEvent: { observationType: string; blockTimestamp: number; blockNumber?: number }
      reactionEvent: { reactionType: string; blockTimestamp: number; blockNumber?: number }
      leadBlocks: number
      leadSeconds: number
      proofCreatedAt: number
      confidence: string
      sourceRpc?: string
    }> = data.proofs ?? []

    // Normalize into rows
    let rows: LeadTimeLedgerRow[] = proofs.map((p, i) => {
      const confNum = CONFIDENCE_MAP[p.confidence] ?? 50
      const row: LeadTimeLedgerRow = {
        id: `lt-${p.mint.slice(0, 8)}-${i}`,
        mint: p.mint,
        symbol: p.symbol ?? p.mint.slice(0, 6),
        name: p.name ?? "",
        logo: null,
        observedAt: new Date(p.observationEvent.blockTimestamp).toISOString(),
        observationEvent: p.observationEvent.observationType,
        reactionEvent: p.reactionEvent.reactionType,
        leadSeconds: p.leadSeconds,
        leadBlocks: p.leadBlocks,
        confidence: confNum,
      }
      // Attach on-chain evidence if present
      if (p.observationEvent.blockNumber) row.observationSlot = p.observationEvent.blockNumber
      if (p.observationEvent.blockTimestamp) row.observationBlockTime = p.observationEvent.blockTimestamp
      if (p.reactionEvent.blockNumber) row.reactionSlot = p.reactionEvent.blockNumber
      if (p.reactionEvent.blockTimestamp) row.reactionBlockTime = p.reactionEvent.blockTimestamp
      if (p.sourceRpc) row.sourceRpc = p.sourceRpc
      return row
    })

    // Filter by range
    rows = rows.filter((r) => {
      const ts = new Date(r.observedAt).getTime()
      return Number.isFinite(ts) && ts >= cutoff
    })
    const afterRangeCount = rows.length

    // Filter by confidence
    rows = rows.filter((r) => r.confidence >= minConfidence)
    const afterConfidenceCount = rows.length

    // Filter by search query
    if (q) {
      rows = rows.filter((r) =>
        (typeof r.symbol === "string" && r.symbol.toLowerCase().includes(q)) ||
        (typeof r.name === "string" && r.name.toLowerCase().includes(q)) ||
        (typeof r.mint === "string" && r.mint.toLowerCase().includes(q)),
      )
    }
    const afterSearchCount = rows.length

    // Try to enrich with logos from token index
    try {
      const uniqueMints = [...new Set(rows.map((r) => r.mint))]
      if (uniqueMints.length > 0 && uniqueMints.length <= 50) {
        const batchRes = await fetch(`${origin}/api/tokens/batch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mints: uniqueMints }),
          cache: "no-store",
        })
        if (batchRes.ok) {
          const batchData = await batchRes.json()
          const tokenMap = new Map<string, { symbol: string; name: string; imageUrl?: string }>()
          for (const t of batchData.tokens ?? []) {
            tokenMap.set(t.address?.toLowerCase(), t)
          }
          rows = rows.map((r) => {
            const t = tokenMap.get(r.mint.toLowerCase())
            if (t) {
              return {
                ...r,
                symbol: t.symbol || r.symbol,
                name: t.name || r.name,
                logo: t.imageUrl || null,
              }
            }
            return r
          })
        }
      }
    } catch (_) {
      void _
      // Non-critical: logos are optional
    }

    const total = rows.length
    rows = rows.slice(0, limit)

    return NextResponse.json(
      {
        ok: true,
        rows,
        total,
        meta: {
          range: rangeUsed,
          confidence: confidenceUsed || "ALL",
          generatedAt: new Date().toISOString(),
        },
        _debug: {
          totalBeforeFilters: proofs.length,
          afterRange: afterRangeCount,
          afterConfidence: afterConfidenceCount,
          afterSearch: afterSearchCount,
          rangeUsed,
          confidenceUsed: confidenceUsed || "ALL",
          minConfidence,
        },
      },
      {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      },
    )
  } catch (error) {
    console.error("[v0] leadtime-ledger error:", error)
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 },
    )
  }
}
