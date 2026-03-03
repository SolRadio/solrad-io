import { NextResponse } from "next/server"
import { verifyOpsPasswordFromHeader } from "@/lib/auth-helpers"
import {
  appendEntries,
  entryId,
  deriveOutcome,
  signalOutcomeToEntry,
  type AlphaLedgerEntry,
  type SignalOutcomeRow,
} from "@/lib/alpha-ledger"

/**
 * POST /api/admin/alpha-ledger/append
 * Admin-only (x-ops-password header).
 *
 * Body shapes (pick one):
 *   { entries: AlphaLedgerEntry[] }          -- manual add
 *   { signalOutcomes: SignalOutcomeRow[] }   -- promote from signal-outcomes
 */
export async function POST(request: Request) {
  if (!verifyOpsPasswordFromHeader(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()

    let toAppend: AlphaLedgerEntry[] = []

    // Path A: raw entries
    if (Array.isArray(body.entries)) {
      toAppend = body.entries.map((e: Partial<AlphaLedgerEntry>) => ({
        ...e,
        id: e.id || entryId(e.mint ?? "", e.detectedAt ?? "", e.detectionType ?? "manual"),
        outcome: e.outcome || deriveOutcome(e.pct24h, e.pct7d),
        source: e.source || "manual",
        createdAt: e.createdAt || new Date().toISOString(),
      })) as AlphaLedgerEntry[]
    }

    // Path B: promote from signal outcomes payload
    if (Array.isArray(body.signalOutcomes)) {
      const converted = (body.signalOutcomes as SignalOutcomeRow[]).map(signalOutcomeToEntry)
      toAppend = [...toAppend, ...converted]
    }

    if (toAppend.length === 0) {
      return NextResponse.json({ ok: false, error: "No entries provided" }, { status: 400 })
    }

    const result = await appendEntries(toAppend)

    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error("[alpha-ledger] append error:", error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    )
  }
}
