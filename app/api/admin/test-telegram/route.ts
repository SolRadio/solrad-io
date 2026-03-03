import { NextResponse } from "next/server"

/**
 * POST /api/admin/test-telegram
 * Sends a test message to the configured Telegram channel.
 * Protected by OPS_PASSWORD (same as recover-null-scores).
 */
export async function POST(request: Request) {
  // Auth check — same pattern as recover-null-scores
  const opsPassword = process.env.OPS_PASSWORD
  const provided = request.headers.get("x-ops-password")
  if (!opsPassword || provided !== opsPassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const channelId = process.env.TELEGRAM_ALERTS_CHAT_ID ?? process.env.TELEGRAM_CHANNEL_ID

  if (!botToken || !channelId) {
    return NextResponse.json({
      ok: false,
      error: "Missing env vars",
      hasBotToken: !!botToken,
      hasChannelId: !!channelId,
    })
  }

  const testMessage = `\u{1F7E2} <b>SOLRAD Intelligence Engine</b>

\u2705 Telegram connection confirmed.

This channel will receive real-time breakout signals from SOLRAD's intelligence engine \u2014 scanning 200+ Solana tokens every 5 minutes.

<i>Test message from SOLRAD admin</i>`

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: channelId,
          text: testMessage,
          parse_mode: "HTML",
        }),
      }
    )

    const data = await res.json()

    return NextResponse.json({
      ok: data.ok ?? false,
      telegramStatus: res.status,
      telegramResponse: data,
    })
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
