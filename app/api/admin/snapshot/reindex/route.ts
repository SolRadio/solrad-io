import { NextRequest, NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { PublicKey } from "@solana/web3.js"
import { verifyOpsPasswordFromHeader } from "@/lib/auth-helpers"
import { getTrackedTokens } from "@/lib/get-tracked-tokens"
import { getTrackedMints, getSnapshotHistory } from "@/lib/snapshotLogger"

/** Check if a string is a valid Solana pubkey (base58 -> 32 bytes) */
function isValidPubkey(v: string): boolean {
  try { return new PublicKey(v).toBytes().length === 32 } catch { return false }
}

export const dynamic = "force-dynamic"

/**
 * POST /api/admin/snapshot/reindex
 *
 * Repairs the snap:index set so every mint that has snapshot data is indexed.
 * Two-phase approach:
 *   Phase 1: Add all token mints from getTrackedTokens() (the cron source).
 *   Phase 2: For each existing index member, also add the normalized variant
 *            (and vice-versa) so both raw and normalized keys are covered.
 *
 * Safe: only adds to snap:index. Never deletes keys or snapshot data.
 * Auth: requires x-ops-password header.
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
    // Phase 1: Get all token addresses from the same source the cron uses
    const tokens = await getTrackedTokens()
    const existingIndex = await getTrackedMints()
    const existingSet = new Set(existingIndex)

    let addedCount = 0
    const sampleAdded: string[] = []
    const errors: string[] = []

    // Helper: add a mint to index if not already present
    async function ensureIndexed(mint: string, source: string) {
      if (!mint || typeof mint !== "string" || mint.length < 10) return
      if (existingSet.has(mint)) return // already indexed
      try {
        await kv.sadd("snap:index", mint)
        existingSet.add(mint)
        addedCount++
        if (sampleAdded.length < 20) {
          sampleAdded.push(`${mint} (${source})`)
        }
      } catch (err) {
        if (errors.length < 5) {
          errors.push(`sadd failed for ${mint}: ${String(err)}`)
        }
      }
    }

    // Phase 1: For each tracked token, add raw address AND check if history exists
    for (const token of tokens) {
      if (!token.address) continue
      await ensureIndexed(token.address, "tracked_token_raw")
      // Also check if history exists (covers mints stored with pump suffix etc.)
      const history = await getSnapshotHistory(token.address, 1)
      if (history.length > 0) {
        await ensureIndexed(token.address, "tracked_token_with_history")
      }
    }

    // Phase 2: For each existing index member, try normalized variant
    // (batch the original index snapshot, don't re-read the updated one)
    for (const rawMint of existingIndex) {
      const trimmed = rawMint.trim()
      if (trimmed !== rawMint) {
        await ensureIndexed(trimmed, "trimmed")
      }

      // Try to strip .pump / bare pump suffix, but ONLY if the result
      // is still a valid Solana pubkey (base58 -> 32 bytes).
      // Many pump.fun mints end in "pump" as part of their actual base58 encoding.
      let normalized = trimmed
      if (normalized.toLowerCase().endsWith(".pump") && normalized.length > 5 + 32) {
        const candidate = normalized.slice(0, -5)
        if (isValidPubkey(candidate)) normalized = candidate
      } else if (normalized.toLowerCase().endsWith("pump") && normalized.length > 4 + 32) {
        const candidate = normalized.slice(0, -4)
        if (isValidPubkey(candidate)) normalized = candidate
      }

      if (normalized !== trimmed) {
        // Add normalized variant
        await ensureIndexed(normalized, "normalized_from_index")
        // Also check if normalized key has history, and if so, verify it's indexed
        const normHistory = await getSnapshotHistory(normalized, 1)
        if (normHistory.length > 0) {
          await ensureIndexed(normalized, "normalized_with_history")
        }
        // And check if original raw key has history
        const rawHistory = await getSnapshotHistory(rawMint, 1)
        if (rawHistory.length > 0) {
          await ensureIndexed(rawMint, "raw_with_history")
        }
      }
    }

    const durationMs = Date.now() - t0
    const finalIndex = await getTrackedMints()

    return NextResponse.json({
      ok: true,
      durationMs,
      phase1TokensScanned: tokens.length,
      phase2IndexScanned: existingIndex.length,
      indexBefore: existingIndex.length,
      indexAfter: finalIndex.length,
      addedCount,
      sampleAdded: sampleAdded.slice(0, 20),
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: String(error), durationMs: Date.now() - t0 },
      { status: 500 }
    )
  }
}
