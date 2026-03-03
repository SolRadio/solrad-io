/**
 * Telegram Alerts Utility (Server-Only)
 * 
 * SETUP:
 * 1. Create a Telegram bot via @BotFather and get TELEGRAM_BOT_TOKEN
 * 2. Add bot as admin to your channel
 * 3. Set TELEGRAM_ALERTS_CHAT_ID to @channelusername or numeric channel ID
 * 
 * USAGE:
 * - Direct calls: Use sendTelegramMessage() from any server component/route
 * - Internal trigger: POST /api/telegram/internal-trigger with x-solrad-internal-secret header
 * - Admin panel: POST /api/telegram/alert with ADMIN_ALERTS_PASSWORD
 * 
 * SECURITY:
 * - Never import this on client side
 * - TELEGRAM_BOT_TOKEN must remain server-only
 * - Use SOLRAD_INTERNAL_SECRET for internal API calls
 */

interface TelegramMessageOptions {
  text: string
  parseMode?: "HTML" | "Markdown"
  disableWebPreview?: boolean
}

interface TelegramResponse {
  ok: boolean
  result?: any
  error?: string
}

/**
 * Send a message to the configured Telegram channel
 * @throws Error if TELEGRAM_BOT_TOKEN or TELEGRAM_ALERTS_CHAT_ID is not configured
 */
export async function sendTelegramMessage({
  text,
  parseMode = "HTML",
  disableWebPreview = true,
}: TelegramMessageOptions): Promise<TelegramResponse> {
  // Validate environment variables
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_ALERTS_CHAT_ID

  if (!botToken) {
    throw new Error(
      "TELEGRAM_BOT_TOKEN is not configured. Set it in your environment variables."
    )
  }

  if (!chatId) {
    throw new Error(
      "TELEGRAM_ALERTS_CHAT_ID is not configured. Set it to @channelusername or numeric channel ID."
    )
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: parseMode,
          disable_web_page_preview: disableWebPreview,
        }),
      }
    )

    const data = await response.json()

    if (!response.ok || !data.ok) {
      return {
        ok: false,
        error: data.description || `HTTP ${response.status}`,
      }
    }

    return {
      ok: true,
      result: data.result,
    }
  } catch (error) {
    console.error("[v0] Telegram API error:", error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
