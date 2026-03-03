import { NextResponse } from "next/server"
import { verifyOpsPasswordFromHeader } from "@/lib/auth-helpers"
import { getTrackedTokens } from "@/lib/get-tracked-tokens"
import { generateIntelReport } from "@/lib/intel/generator"
import { saveIntelReport } from "@/lib/intel/storage"

/**
 * POST /api/admin/intel/generate
 * Generates new intel report from tracked tokens
 * Protected by x-ops-password header
 * 
 * Body params:
 * - aiVoice?: boolean (enable AI Voice Layer)
 * - seedOverride?: string (for preview shuffles)
 * - preview?: boolean (if true, don't save to storage)
 */
export async function POST(request: Request) {
  // Auth check
  if (!verifyOpsPasswordFromHeader(request)) {
    console.error("[v0] Intel generate: Auth failed")
    return NextResponse.json(
      { 
        ok: false, 
        error: "Unauthorized",
        details: "Invalid or missing x-ops-password header"
      }, 
      { status: 401 }
    )
  }

  try {
    console.log("[v0] Admin intel generate: Starting...")

    // Parse body
    const body = await request.json().catch(() => ({}))
    const { aiVoice = false, seedOverride, preview = false } = body

    console.log("[v0] Intel generate: Config", { aiVoice, preview, hasSeedOverride: !!seedOverride })

    // Fetch tracked tokens
    const tokens = await getTrackedTokens()

    if (tokens.length === 0) {
      console.error("[v0] Intel generate: No tracked tokens")
      return NextResponse.json(
        {
          ok: false,
          error: "No tracked tokens available",
          details: "The tracked tokens pool is empty. Check token ingestion."
        },
        { status: 500 }
      )
    }

    console.log("[v0] Intel generate: Processing", { tokenCount: tokens.length })

    // Generate report
    const report = await generateIntelReport(tokens, {
      aiVoice,
      seedOverride,
    })

    // Save to storage (unless preview mode)
    if (!preview) {
      console.log("[v0] Intel generate: Saving to storage...")
      await saveIntelReport(report)
    }

    console.log("[v0] Admin intel generate: Complete", {
      date: report.date,
      candidates: report.candidates.length,
      avgScore: report.signals.avgScore,
      aiVoiceUsed: report.aiVoiceUsed,
      preview,
    })

    return NextResponse.json({
      ok: true,
      report,
    })
  } catch (error) {
    console.error("[v0] Failed to generate intel:", error)
    return NextResponse.json(
      { 
        ok: false, 
        error: "Failed to generate report",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

export const dynamic = "force-dynamic"
export const maxDuration = 60
