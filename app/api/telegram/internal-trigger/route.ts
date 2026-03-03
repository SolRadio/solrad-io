import { NextRequest, NextResponse } from "next/server"
import { sendTelegramMessage } from "@/lib/telegram"
import { timingSafeEqual } from "crypto"

type AlertType = "TRENDING" | "GEM" | "RISK" | "DAILY" | "CUSTOM"

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

interface InternalAlertRequest {
  type: AlertType
  payload: AlertPayload
}

function buildMessage(type: AlertType, payload: AlertPayload): string {
  switch (type) {
    case "TRENDING": {
      const symbol = payload.symbol || "UNKNOWN"
      const score = payload.score || 0
      const volume = payload.volume || "N/A"
      const liquidity = payload.liquidity || "N/A"
      return `🚀 <b>TRENDING ALERT</b>\n\nToken: $${symbol}\nScore: ${score}/100\nVolume: ${volume}\nLiquidity: ${liquidity}\n\n🔗 https://solrad.io`
    }

    case "GEM": {
      const symbol = payload.symbol || "UNKNOWN"
      const score = payload.score || 0
      const momentum = payload.momentum || "Strong"
      const liquidity = payload.liquidity || "N/A"
      return `💎 <b>GEM DETECTED</b>\n\nToken: $${symbol}\nScore: ${score}/100\nMomentum: ${momentum}\nLiquidity: ${liquidity}\n\n🔗 https://solrad.io`
    }

    case "RISK": {
      const symbol = payload.symbol || "UNKNOWN"
      const riskLevel = payload.riskLevel || "MED"
      const reason = payload.reason || "Unusual activity detected"
      return `⚠️ <b>RISK ALERT</b>\n\nToken: $${symbol}\nRisk Level: ${riskLevel}\nReason: ${reason}\n\nDYOR.\n🔗 https://solrad.io`
    }

    case "DAILY": {
      const topTrending = payload.topTrending || ["AAA", "BBB", "CCC"]
      const topGems = payload.topGems || [
        { symbol: "XXX", score: 91 },
        { symbol: "YYY", score: 89 },
        { symbol: "ZZZ", score: 87 },
      ]
      const trendingList = topTrending
        .slice(0, 3)
        .map((s, i) => `${i + 1}) $${s}`)
        .join("\n")
      const gemsList = topGems
        .slice(0, 3)
        .map((g) => `💎 $${g.symbol} — ${g.score}`)
        .join("\n")
      return `📡 <b>SOLRAD DAILY SCAN</b>\n\nTop Trending:\n${trendingList}\n\nTop Gem Scores:\n${gemsList}\n\n🔗 https://solrad.io`
    }

    case "CUSTOM":
      return payload.customText || "Custom alert"

    default:
      throw new Error("Invalid alert type")
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify internal secret header
    const expectedSecret = process.env.SOLRAD_INTERNAL_SECRET
    if (!expectedSecret) {
      return NextResponse.json({ ok: false, error: "Internal secret not configured" }, { status: 500 })
    }

    const providedSecret = request.headers.get("x-solrad-internal-secret") || ""
    if (!timingSafeCompare(providedSecret, expectedSecret)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    const body: InternalAlertRequest = await request.json()

    // Validate type
    if (!["TRENDING", "GEM", "RISK", "DAILY", "CUSTOM"].includes(body.type)) {
      return NextResponse.json({ ok: false, error: "Invalid alert type" }, { status: 400 })
    }

    // Build message
    const message = buildMessage(body.type, body.payload)

    // Send to Telegram
    const result = await sendTelegramMessage({ text: message })

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error || "Failed to send message" },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, result: result.result })
  } catch (error) {
    console.error("[v0] Internal trigger error:", error)
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    )
  }
}
