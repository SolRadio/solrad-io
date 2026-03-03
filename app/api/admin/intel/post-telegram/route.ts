import { NextResponse } from "next/server"
import { verifyOpsPasswordFromHeader } from "@/lib/auth-helpers"
import { storage } from "@/lib/storage"
import { sendTelegramMessage } from "@/lib/telegram"

/**
 * POST /api/admin/intel/post-telegram
 * Body: { date: string }
 *
 * Reads daily package from KV, sends telegramPacket to the configured channel,
 * updates package with telegramPosted: true.
 */

const PKG_KEY = (d: string) => `solrad:daily-package:${d}`
const PKG_LATEST = "solrad:daily-package:latest"

export async function POST(request: Request) {
  if (!verifyOpsPasswordFromHeader(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const date = body.date || new Date().toISOString().split("T")[0]

    // Read package from KV
    const pkg = (await storage.get(PKG_KEY(date))) as Record<string, unknown> | null
    if (!pkg || typeof pkg.telegramPacket !== "string" || !pkg.telegramPacket) {
      return NextResponse.json({
        success: false,
        error: "NO_PACKAGE",
        details: `No package found for ${date} or telegramPacket is empty`,
      })
    }

    console.log("[v0] Telegram post: Sending to channel for", date)

    const result = await sendTelegramMessage({
      text: pkg.telegramPacket as string,
      parseMode: "HTML",
      disableWebPreview: false,
    })

    if (!result.ok) {
      return NextResponse.json({
        success: false,
        error: "TELEGRAM_SEND_FAILED",
        details: result.error || "Unknown Telegram error",
      }, { status: 500 })
    }

    // Update package in KV
    const updated = {
      ...pkg,
      telegramPosted: true,
      telegramPostedAt: Date.now(),
      status: (pkg.twitterPosted ? "posted" : pkg.status),
    }
    await storage.set(PKG_KEY(date), updated, { ex: 60 * 60 * 48 })
    await storage.set(PKG_LATEST, updated, { ex: 60 * 60 * 48 })

    console.log("[v0] Telegram post: Success for", date)

    return NextResponse.json({ success: true, date })
  } catch (error) {
    console.error("[v0] Telegram post failed:", error)
    return NextResponse.json({
      success: false,
      error: "TELEGRAM_POST_FAILED",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
