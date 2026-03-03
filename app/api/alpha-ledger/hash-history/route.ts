import { NextResponse } from "next/server"
import { readMeta, readHashHistory } from "@/lib/alpha-ledger"

/**
 * GET /api/alpha-ledger/hash-history
 * Returns hash history (last 50) and current ledger hash state.
 * Read-only, no auth required (public verification endpoint).
 */
export async function GET() {
  const requestId = `hh-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

  try {
    const [meta, history] = await Promise.all([readMeta(), readHashHistory()])

    // Return last 50 records, newest first
    const recent = [...history].reverse().slice(0, 50)

    return NextResponse.json(
      {
        ok: true,
        requestId,
        current: {
          ledgerHash: meta?.ledgerHash ?? null,
          hashUpdatedAt: meta?.hashUpdatedAt ?? null,
          hashEntryCount: meta?.hashEntryCount ?? null,
        },
        history: recent,
        totalHistoryRecords: history.length,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      },
    )
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    console.error("[alpha-ledger/hash-history]", requestId, msg)
    return NextResponse.json(
      {
        ok: false,
        requestId,
        error: "hash-history-failed",
        message: msg,
        current: { ledgerHash: null, hashUpdatedAt: null, hashEntryCount: null },
        history: [],
        totalHistoryRecords: 0,
      },
      { status: 500 },
    )
  }
}
