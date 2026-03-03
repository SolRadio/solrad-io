import { NextResponse } from "next/server"
import { readMeta } from "@/lib/alpha-ledger"

/**
 * GET /api/alpha-ledger/hash
 * Returns the current ledger hash, entry count, and last update time.
 * Read-only, no auth required (public verification endpoint).
 */
export async function GET() {
  try {
    const meta = await readMeta()

    // Contract: { ok, ledgerHash, hashUpdatedAt, hashEntryCount, error?, message? }
    return NextResponse.json(
      {
        ok: true,
        ledgerHash: meta?.ledgerHash ?? null,
        hashUpdatedAt: meta?.hashUpdatedAt ?? null,
        hashEntryCount: meta?.hashEntryCount ?? null,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    )
  } catch (error) {
    console.error("[alpha-ledger/hash] read error:", error)
    return NextResponse.json(
      {
        ok: false,
        ledgerHash: null,
        hashUpdatedAt: null,
        hashEntryCount: null,
        error: "Failed to read ledger meta",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
