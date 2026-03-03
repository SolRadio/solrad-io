import { NextResponse } from "next/server"
import { getTrackedTokens } from "@/lib/get-tracked-tokens"
import { generateIntelReport } from "@/lib/intel/generator"
import { saveIntelReport } from "@/lib/intel/storage"
import { sendTelegramMessage } from "@/lib/telegram"

/**
 * GET /api/intel/generate/daily
 * Daily cron job to generate and send intel report
 * Protected by CRON_SECRET via Authorization: Bearer header
 */
export async function GET(request: Request) {
  try {
    // Auth check - CRON_SECRET
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      return NextResponse.json(
        { error: "CRON_SECRET not configured" },
        { status: 500 }
      )
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Daily intel cron: Starting...")
    const startTime = Date.now()

    // Fetch tracked tokens
    const tokens = await getTrackedTokens()

    if (tokens.length === 0) {
      console.warn("[v0] Daily intel cron: No tracked tokens available")
      return NextResponse.json({
        ok: false,
        error: "No tracked tokens available",
      }, { status: 500 })
    }

    // Generate report
    const report = generateIntelReport(tokens)

    // Save to storage
    await saveIntelReport(report)

    // Auto-send to Telegram
    const telegramResult = await sendTelegramMessage({
      text: report.telegramPacket,
      parseMode: "HTML",
      disableWebPreview: false,
    })

    const duration = Date.now() - startTime

    if (!telegramResult.ok) {
      console.error("[v0] Daily intel cron: Telegram send failed", telegramResult.error)
      return NextResponse.json({
        ok: true,
        generated: true,
        sent: false,
        error: telegramResult.error,
        date: report.date,
        durationMs: duration,
      })
    }

    console.log("[v0] Daily intel cron: Complete", {
      date: report.date,
      candidates: report.candidates.length,
      avgScore: report.signals.avgScore,
      sent: true,
      durationMs: duration,
    })

    return NextResponse.json({
      ok: true,
      generated: true,
      sent: true,
      date: report.date,
      candidates: report.candidates.length,
      durationMs: duration,
    })
  } catch (error) {
    console.error("[v0] Daily intel cron error:", error)
    return NextResponse.json(
      { ok: false, error: "Intel generation failed" },
      { status: 500 }
    )
  }
}

export const dynamic = "force-dynamic"
export const maxDuration = 120
