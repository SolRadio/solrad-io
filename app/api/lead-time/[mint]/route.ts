/**
 * Lead-Time Proof API
 * 
 * GET /api/lead-time/[mint]
 * Returns lead-time proofs and stats for a specific token
 * 
 * Monetization: Free users see delayed proofs, Pro users see real-time
 */

import { NextRequest, NextResponse } from "next/server"
import { getLeadTimeProofs, getLeadTimeStats, getPendingObservation, isPro } from "@/lib/lead-time/storage"
import type { LeadTimeProof, LeadTimeStats, PendingObservation } from "@/lib/lead-time/types"
import { normalizeMint } from "@/lib/lead-time/normalize-mint"

export const dynamic = "force-dynamic"

interface LeadTimeResponse {
  ok: boolean
  mintEcho: string | null // Debug field to verify mint parameter parsing
  proofs: LeadTimeProof[]
  stats: LeadTimeStats | null
  pendingObservation: PendingObservation | null
  isPro: boolean
  delayMinutes: number // How delayed the data is for free users
}

// QA Seed Mode: Hardcoded test mints for visual verification
const QA_SEED_MINTS = [
  "jupyiwryjfskupiha7hker8vutaefosbkedznsdvcn", // Jupiter (lowercase)
  "so11111111111111111111111111111111111111112", // Wrapped SOL (lowercase)
  "epjfwdd5aufqssqem2qn1xzybapC8G4wEGGkZwyTDt1v".toLowerCase(), // USDC
]

function generateQASeedData(mint: string): {
  proofs: LeadTimeProof[]
  stats: LeadTimeStats
} {
  const now = Date.now()
  const proofs: LeadTimeProof[] = [
    {
      mint,
      symbol: "TEST",
      name: "Test Token",
      observationEvent: {
        mint,
        blockNumber: 1000,
        blockTimestamp: now - 3600000,
        observationType: "accumulation_spike",
        confidence: "HIGH",
        details: "Observed wallet accumulation spike 45 blocks before volume reaction",
      },
      reactionEvent: {
        mint,
        blockNumber: 1045,
        blockTimestamp: now - 3600000 + 18000,
        reactionType: "volume_expansion",
        magnitude: 3.5,
        details: "24h volume increased 3.5x, appeared on DexScreener trending",
      },
      leadBlocks: 45,
      leadSeconds: 18,
      proofCreatedAt: now - 3600000,
      confidence: "HIGH",
      isPro: false,
    },
    {
      mint,
      symbol: "TEST",
      name: "Test Token",
      observationEvent: {
        mint,
        blockNumber: 800,
        blockTimestamp: now - 7200000,
        observationType: "liquidity_probe",
        confidence: "MEDIUM",
        details: "Detected small liquidity adds testing pool depth",
      },
      reactionEvent: {
        mint,
        blockNumber: 835,
        blockTimestamp: now - 7200000 + 14000,
        reactionType: "liquidity_expansion",
        magnitude: 2.1,
        details: "Liquidity pool expanded 2.1x",
      },
      leadBlocks: 35,
      leadSeconds: 14,
      proofCreatedAt: now - 7200000,
      confidence: "MEDIUM",
      isPro: false,
    },
  ]

  const stats: LeadTimeStats = {
    mint,
    totalProofs: 2,
    averageLeadBlocks: 40,
    averageLeadSeconds: 16,
    minLeadBlocks: 35,
    maxLeadBlocks: 45,
    lastProofAt: now - 3600000,
  }

  return { proofs, stats }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ mint: string }> }
) {
  try {
    const { mint } = await params

    if (!mint) {
      return NextResponse.json({ ok: false, error: "Missing mint parameter", mintEcho: null, proofs: [], stats: null, pendingObservation: null, isPro: false, delayMinutes: 0 }, { status: 400 })
    }

    // Normalize mint using canonical function
    const normalizedMint = normalizeMint(mint)
    if (!normalizedMint) {
      return NextResponse.json({ ok: false, error: "Invalid mint address", mintEcho: mint, proofs: [], stats: null, pendingObservation: null, isPro: false, delayMinutes: 0 }, { status: 400 })
    }

    // QA Seed Mode: Return mocked data for ANY mint when QA mode enabled
    if (process.env.LEAD_TIME_QA_SEED === "1") {
      const { proofs, stats } = generateQASeedData(normalizedMint)
      return NextResponse.json(
        {
          ok: true,
          mintEcho: normalizedMint,
          proofs,
          stats,
          pendingObservation: null,
          isPro: false,
          delayMinutes: 0, // Show immediately in QA mode
        },
        {
          headers: {
            "X-Lead-Time-Route": "ok",
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        }
      )
    }

    // Get lead-time data
    const proofs = await getLeadTimeProofs(normalizedMint)
    const stats = await getLeadTimeStats(normalizedMint)

    // Check Pro status
    const isProUser = isPro()

    // Pro users can see pending observations
    const pendingObservation = isProUser ? await getPendingObservation(normalizedMint) : null

    // Free users see data with 15-minute delay
    const delayMinutes = isProUser ? 0 : 15
    const delayMs = delayMinutes * 60 * 1000

    // Filter proofs based on user tier
    const filteredProofs = proofs.filter((proof) => {
      if (isProUser) return true
      // Free users only see proofs older than 15 minutes
      return Date.now() - proof.proofCreatedAt >= delayMs
    })

    // Contract: { ok, mintEcho, proofs, stats, pendingObservation, isPro, delayMinutes, error?, message? }
    const response: LeadTimeResponse = {
      ok: true,
      mintEcho: normalizedMint,
      proofs: filteredProofs,
      stats,
      pendingObservation,
      isPro: isProUser,
      delayMinutes,
    }

    return NextResponse.json(response, {
      headers: {
        "X-Lead-Time-Route": "ok",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    })
  } catch (error) {
    console.error("[lead-time/mint]", error)
    return NextResponse.json(
      { ok: false, error: "lead-time-failed", message: error instanceof Error ? error.message : "Unknown error", mintEcho: null, proofs: [], stats: null, pendingObservation: null, isPro: false, delayMinutes: 0 },
      { status: 500 }
    )
  }
}
