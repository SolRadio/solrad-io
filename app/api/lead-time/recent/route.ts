/**
 * Recent Lead-Time Proofs API
 * 
 * GET /api/lead-time/recent
 * Returns recently created lead-time proofs across all tokens
 * 
 * For /lead-time-proof page
 */

import { NextRequest, NextResponse } from "next/server"
import { getRecentLeadTimeProofs } from "@/lib/lead-time/storage"
import type { LeadTimeProof } from "@/lib/lead-time/types"

export const dynamic = "force-dynamic"

function generateMockedRecentProofs(limit: number): LeadTimeProof[] {
  const now = Date.now()
  const mockMints = [
    "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    "So11111111111111111111111111111111111111112",
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",
    "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
    "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3",
    "MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5",
    "ZEUS1aR7aX8DFFJf5QjWj2ftDDdNTroMNGo8YoQm3Gq",
    "5z3EqYQo9HiCEs3R84RCDMu2n7anpDMxRhdK8PSWmrRC",
  ]

  return mockMints.slice(0, limit).map((mint, idx) => ({
    mint: mint.toLowerCase(),
    symbol: `TOKEN${idx + 1}`,
    name: `Test Token ${idx + 1}`,
    observationEvent: {
      mint: mint.toLowerCase(),
      blockNumber: 1000 + idx * 10,
      blockTimestamp: now - (idx + 1) * 600000, // Staggered by 10min intervals
      observationType: idx % 2 === 0 ? "accumulation_spike" : "liquidity_probe",
      confidence: idx % 3 === 0 ? "HIGH" : "MEDIUM",
      details: `Observed on-chain activity ${30 + idx * 5} blocks early`,
    },
    reactionEvent: {
      mint: mint.toLowerCase(),
      blockNumber: 1000 + idx * 10 + 30 + idx * 5,
      blockTimestamp: now - (idx + 1) * 600000 + (30 + idx * 5) * 400,
      reactionType: idx % 2 === 0 ? "volume_expansion" : "liquidity_expansion",
      magnitude: 2.0 + idx * 0.3,
      details: `Market reacted ${30 + idx * 5} blocks later`,
    },
    leadBlocks: 30 + idx * 5,
    leadSeconds: (30 + idx * 5) * 0.4,
    proofCreatedAt: now - (idx + 1) * 600000,
    confidence: idx % 3 === 0 ? "HIGH" : "MEDIUM",
    isPro: false,
  }))
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") ?? "20", 10)

    const scannedAt = new Date().toISOString()

    // QA Seed Mode: Return mocked recent proofs for any tokens
    if (process.env.LEAD_TIME_QA_SEED === "1") {
      const proofs = generateMockedRecentProofs(Math.min(limit, 10))
      return NextResponse.json(
        {
          ok: true,
          proofs,
          isPro: false,
          delayMinutes: 0,
          scannedAt,
        },
        {
          headers: {
            "X-Lead-Time-Route": "ok",
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        }
      )
    }

    const RECENT_KEY = "solrad:leadtime:recent"
    const FALLBACK_KEY = "solrad:leadtime:recent:lastknown"
    let proofs = await getRecentLeadTimeProofs(limit)
    let source: "live" | "fallback" = "live"

    // If live proofs are empty, try last-known-good fallback from KV
    if (proofs.length === 0) {
      try {
        const { storage } = await import("@/lib/storage")
        const fallback = (await storage.get(FALLBACK_KEY)) as LeadTimeProof[] | null
        if (fallback && fallback.length > 0) {
          proofs = fallback.slice(0, limit)
          source = "fallback"
        }
      } catch {
        // Fallback read failed -- continue with empty
      }
    }

    // When live proofs exist, persist them as the fallback snapshot (30 day TTL)
    if (source === "live" && proofs.length > 0) {
      try {
        const { storage } = await import("@/lib/storage")
        await storage.set(FALLBACK_KEY, proofs.slice(0, 50), { ex: 60 * 60 * 24 * 30 })
      } catch {
        // Non-critical -- don't fail the response
      }
    }

    // TODO: Apply Pro/Free filtering here as well
    const isPro = false
    const delayMinutes = isPro ? 0 : 15
    const delayMs = delayMinutes * 60 * 1000

    const filteredProofs = proofs
      .filter((proof) => {
        if (isPro) return true
        return Date.now() - proof.proofCreatedAt >= delayMs
      })
      .map((proof) => ({
        ...proof,
        // Ensure confidence is always surfaced (may be missing in old proofs)
        confidence: proof.confidence ?? "MEDIUM",
      }))

    // Diagnostics: include key alignment info so admin can verify read path
    const debug = searchParams.get("debug") === "1"

    // Contract: { ok, proofs, isPro, delayMinutes, scannedAt, source, recentKey, readCount, readOk, error?, message? }
    return NextResponse.json(
      {
        ok: true,
        proofs: filteredProofs,
        isPro,
        delayMinutes,
        scannedAt,
        source,
        recentKey: RECENT_KEY,
        readCount: proofs.length,
        readOk: true,
        ...(debug ? {
          diagnostics: {
            rawReadCount: proofs.length,
            filteredCount: filteredProofs.length,
            delayMs,
            newestProofAt: proofs.length > 0
              ? new Date(Math.max(...proofs.map(p => p.proofCreatedAt))).toISOString()
              : null,
            oldestProofAt: proofs.length > 0
              ? new Date(Math.min(...proofs.map(p => p.proofCreatedAt))).toISOString()
              : null,
          },
        } : {}),
      },
      {
        headers: {
          "X-Lead-Time-Route": "ok",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    )
  } catch (error) {
    console.error("[lead-time/recent]", error)
    return NextResponse.json(
      // Contract: { ok, proofs, isPro, delayMinutes, scannedAt, source, recentKey, readCount, readOk, error?, message? }
      {
        ok: false,
        error: "lead-time-recent-failed",
        message: error instanceof Error ? error.message : "Unknown error",
        proofs: [],
        isPro: false,
        delayMinutes: 0,
        scannedAt: new Date().toISOString(),
        source: "error" as const,
        recentKey: "solrad:leadtime:recent",
        readCount: 0,
        readOk: false,
      },
      { status: 500 }
    )
  }
}
