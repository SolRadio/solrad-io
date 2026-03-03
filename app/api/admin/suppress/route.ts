import { NextRequest, NextResponse } from "next/server"
import { verifyOpsPasswordFromHeader } from "@/lib/auth-helpers"
import {
  addSuppressed,
  removeSuppressed,
  getSuppressedList,
} from "@/lib/suppress"

/**
 * GET  /api/admin/suppress         -> list all suppressed mints
 * POST /api/admin/suppress         -> add a mint { mint, reason }
 * DELETE /api/admin/suppress       -> remove a mint { mint }
 *
 * All require x-ops-password header.
 */

function unauthorized() {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
}

// ── GET: list ──────────────────────────────────────────────
export async function GET(request: NextRequest) {
  if (!verifyOpsPasswordFromHeader(request)) return unauthorized()

  try {
    const list = await getSuppressedList()
    return NextResponse.json({ ok: true, count: list.length, entries: list })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to list" },
      { status: 500 },
    )
  }
}

// ── POST: add ──────────────────────────────────────────────
export async function POST(request: NextRequest) {
  if (!verifyOpsPasswordFromHeader(request)) return unauthorized()

  try {
    const body = await request.json()
    const mint = (body.mint ?? "").trim()
    const reason = (body.reason ?? "").trim()

    if (!mint || mint.length < 20) {
      return NextResponse.json(
        { ok: false, error: "Invalid mint address" },
        { status: 400 },
      )
    }
    if (!reason) {
      return NextResponse.json(
        { ok: false, error: "Reason is required" },
        { status: 400 },
      )
    }

    await addSuppressed(mint, reason)
    return NextResponse.json({ ok: true, action: "added", mint, reason })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to add" },
      { status: 500 },
    )
  }
}

// ── DELETE: remove ─────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  if (!verifyOpsPasswordFromHeader(request)) return unauthorized()

  try {
    const body = await request.json()
    const mint = (body.mint ?? "").trim()

    if (!mint) {
      return NextResponse.json(
        { ok: false, error: "Mint address required" },
        { status: 400 },
      )
    }

    await removeSuppressed(mint)
    return NextResponse.json({ ok: true, action: "removed", mint })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to remove" },
      { status: 500 },
    )
  }
}
