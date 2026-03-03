import { NextRequest, NextResponse } from "next/server"
import { sendTelegramMessage } from "@/lib/telegram"
import { timingSafeEqual } from "crypto"

type AlertType = "TRENDING" | "GEM" | "RISK" | "DAILY" | "CUSTOM"

interface AlertPayload {
  symbol?: string
  score?: number
  volume?: string
  liquidity?: string
  momentum?: string
  riskLevel?: "HIGH" | "MED" | "LOW"
  reason?: string
  topTrending?: string[]
  topGems?: Array<{ symbol: string; score: number }>
  customText?: string
}

interface AlertRequest {
  type: AlertType
  payload?: AlertPayload
}

function timingSafeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "utf8")
    const bufB = Buffer.from(b, "utf8")
    if (bufA.length !== bufB.length) return false
    return timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

function buildTrendingMessage(payload: AlertPayload = {}): string {
  const symbol = payload.symbol || "UNKNOWN"
  const score = payload.score || 0
  const volume = payload.volume || "N/A"
  const liquidity = payload.liquidity || "N/A"

  return `🚀 <b>TRENDING ALERT</b>

Token: $${symbol}
Score: ${score}/100
Volume: ${volume}
Liquidity: ${liquidity}

🔗 https://solrad.io`
}

function buildGemMessage(payload: AlertPayload = {}): string {
  const symbol = payload.symbol || "UNKNOWN"
  const score = payload.score || 0
  const momentum = payload.momentum || "Strong"
  const liquidity = payload.liquidity || "N/A"

  return `💎 <b>GEM DETECTED</b>

Token: $${symbol}
Score: ${score}/100
Momentum: ${momentum}
Liquidity: ${liquidity}

🔗 https://solrad.io`
}

function buildRiskMessage(payload: AlertPayload = {}): string {
  const symbol = payload.symbol || "UNKNOWN"
  const riskLevel = payload.riskLevel || "MED"
  const reason = payload.reason || "Unusual activity detected"

  return `⚠️ <b>RISK ALERT</b>

Token: $${symbol}
Risk Level: ${riskLevel}
Reason: ${reason}

DYOR.
🔗 https://solrad.io`
}

function buildDailyMessage(payload: AlertPayload = {}): string {
  const topTrending = payload.topTrending || ["AAA", "BBB", "CCC"]
  const topGems = payload.topGems || [
    { symbol: "XXX", score: 91 },
    { symbol: "YYY", score: 89 },
    { symbol: "ZZZ", score: 87 },
  ]

  const trendingList = topTrending
    .slice(0, 3)
    .map((symbol, i) => `${i + 1}) $${symbol}`)
    .join("\n")

  const gemsList = topGems
    .slice(0, 3)
    .map((gem) => `💎 $${gem.symbol} — ${gem.score}`)
    .join("\n")

  return `📡 <b>SOLRAD DAILY SCAN</b>

Top Trending:
${trendingList}

Top Gem Scores:
${gemsList}

🔗 https://solrad.io`
}

export async function POST(request: NextRequest) {
  try {
    // Check password via header
    const adminPassword = process.env.ADMIN_ALERTS_PASSWORD
    if (!adminPassword) {
      return NextResponse.json(
        { ok: false, error: "Admin alerts not configured" },
        { status: 500 }
      )
    }

    const providedPassword = request.headers.get("x-admin-password") || ""
    if (!timingSafeCompare(providedPassword, adminPassword)) {
      return NextResponse.json({ ok: false, error: "Invalid password" }, { status: 401 })
    }

    // Parse request body
    const body: AlertRequest = await request.json()

    // Validate type
    if (!["TRENDING", "GEM", "RISK", "DAILY", "CUSTOM"].includes(body.type)) {
      return NextResponse.json({ ok: false, error: "Invalid alert type" }, { status: 400 })
    }

    // Build message based on type
    let message: string
    switch (body.type) {
      case "TRENDING":
        message = buildTrendingMessage(body.payload)
        break
      case "GEM":
        message = buildGemMessage(body.payload)
        break
      case "RISK":
        message = buildRiskMessage(body.payload)
        break
      case "DAILY":
        message = buildDailyMessage(body.payload)
        break
      case "CUSTOM":
        message = body.payload?.customText || "Custom alert"
        break
      default:
        return NextResponse.json({ ok: false, error: "Invalid alert type" }, { status: 400 })
    }

    // Send to Telegram
    const result = await sendTelegramMessage({ text: message })

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error || "Failed to send message" },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[v0] Telegram alert error:", error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    )
  }
}
