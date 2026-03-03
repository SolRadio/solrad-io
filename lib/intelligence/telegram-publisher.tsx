export interface TelegramPublishResult {
  ok: boolean
  messageId?: number
  error?: string
}

export interface BreakoutSignalForTelegram {
  mint: string
  symbol: string
  name: string
  score: number
  breakoutScore: number
  reasons: string[]
  priceUsd: number
  volume24h: number
  liquidity: number
  priceChange1h: number
  priceChange5m: number
  priceChange6h: number
  marketCap: number
  imageUrl: string | null
  pairUrl: string
  detectedAt: string
}

function formatSignalMessage(signal: BreakoutSignalForTelegram): string {
  const tierEmoji = signal.breakoutScore >= 80 ? "\u{1F534}"
    : signal.breakoutScore >= 60 ? "\u{1F7E0}"
    : "\u{1F7E1}"

  const priceFormatted = signal.priceUsd < 0.001
    ? signal.priceUsd.toExponential(3)
    : signal.priceUsd.toFixed(6)

  const volFormatted = signal.volume24h >= 1_000_000
    ? `$${(signal.volume24h / 1_000_000).toFixed(1)}M`
    : `$${(signal.volume24h / 1000).toFixed(0)}K`

  const liqFormatted = signal.liquidity >= 1_000_000
    ? `$${(signal.liquidity / 1_000_000).toFixed(1)}M`
    : `$${(signal.liquidity / 1000).toFixed(0)}K`

  const mcapFormatted = signal.marketCap >= 1_000_000
    ? `$${(signal.marketCap / 1_000_000).toFixed(2)}M`
    : `$${(signal.marketCap / 1000).toFixed(0)}K`

  const reasonsList = signal.reasons.map(r => `  \u2022 ${r}`).join("\n")

  return `${tierEmoji} <b>SOLRAD SIGNAL</b>

<b>$${signal.symbol}</b> | Score: ${signal.score} | Confidence: ${signal.breakoutScore}/100

${reasonsList}

\u{1F4B0} Price: $${priceFormatted}
\u{1F4CA} Vol/24h: ${volFormatted}
\u{1F4A7} Liquidity: ${liqFormatted}
\u{1F4C8} MCap: ${mcapFormatted}
\u{1F4C9} 1h: ${signal.priceChange1h >= 0 ? "+" : ""}${signal.priceChange1h.toFixed(1)}% | 5m: ${signal.priceChange5m >= 0 ? "+" : ""}${signal.priceChange5m.toFixed(1)}%

\u{1F517} <a href="${signal.pairUrl}">DexScreener</a> | <a href="https://solrad.io">SOLRAD</a>

<i>Detected by SOLRAD Intelligence Engine</i>`
}

export async function publishToTelegram(
  signal: BreakoutSignalForTelegram
): Promise<TelegramPublishResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const channelId = process.env.TELEGRAM_ALERTS_CHAT_ID
    ?? process.env.TELEGRAM_CHANNEL_ID

  if (!botToken || !channelId) {
    return {
      ok: false,
      error: `Missing env vars: botToken=${!!botToken} channelId=${!!channelId}`,
    }
  }

  try {
    const message = formatSignalMessage(signal)
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: channelId,
          text: message,
          parse_mode: "HTML",
          disable_web_page_preview: false,
        }),
      }
    )

    const data = await res.json()
    if (!data.ok) {
      return { ok: false, error: data.description ?? "Telegram API error" }
    }

    return { ok: true, messageId: data.result.message_id }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
