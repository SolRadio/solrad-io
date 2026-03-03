import { NextResponse } from "next/server"
import { verifyOpsPasswordFromHeader } from "@/lib/auth-helpers"
import { getLatestIntelReport, recordPublishAction } from "@/lib/intel/storage"
import { sendTelegramMessage } from "@/lib/telegram"

/**
 * POST /api/admin/intel/send
 * Sends latest intel report to Telegram
 * Protected by x-ops-password header
 */
export async function POST(request: Request) {
  // Auth check
  if (!verifyOpsPasswordFromHeader(request)) {
    console.error("[v0] Intel send: Auth failed")
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
    console.log("[v0] Admin intel send: Starting...")

    // Get latest report
    const report = await getLatestIntelReport()

    if (!report) {
      console.error("[v0] Intel send: No report available")
      return NextResponse.json({
        ok: false,
        error: "No intel report available. Generate one first.",
        details: "Storage returned null for latest report"
      }, { status: 400 })
    }

    console.log("[v0] Intel send: Sending to Telegram", { date: report.date })

    // Send to Telegram
    const result = await sendTelegramMessage({
      text: report.telegramPacket,
      parseMode: "HTML",
      disableWebPreview: false,
    })

    if (!result.ok) {
      console.error("[v0] Telegram send failed:", result.error)
      return NextResponse.json({
        ok: false,
        error: result.error || "Failed to send to Telegram",
        details: "Check Telegram bot token and chat ID configuration"
      }, { status: 500 })
    }

    // Record audit log entry
    await recordPublishAction(
      { channel: "telegram", reportDate: report.date },
      report.telegramPacket
    )

    console.log("[v0] Admin intel send: Success", {
      date: report.date,
    })

    return NextResponse.json({
      ok: true,
      sent: true,
      date: report.date,
    })
  } catch (error) {
    console.error("[v0] Failed to send intel:", error)
    return NextResponse.json(
      { 
        ok: false, 
        error: "Failed to send report",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

export const dynamic = "force-dynamic"
