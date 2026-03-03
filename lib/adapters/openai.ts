import type { TokenScore } from "../types"
import { logger } from "../logger"
import { getServerEnv } from "../env"

export async function generateAIExplanation(token: TokenScore): Promise<string | undefined> {
  const apiKey = getServerEnv('OPENAI_API_KEY')
  if (!apiKey) {
    return undefined
  }

  try {
    const prompt = `You are a crypto analyst. Provide a brief 1-2 sentence explanation for this Solana token:

Symbol: ${token.symbol}
Name: ${token.name}
Score: ${token.totalScore}/100
Risk: ${token.riskLabel}
Volume 24h: $${(token.volume24h / 1000000).toFixed(2)}M
Liquidity: $${(token.liquidity / 1000000).toFixed(2)}M
Price Change: ${token.priceChange24h.toFixed(2)}%

Keep it concise and actionable.`

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a crypto analyst providing brief, actionable token insights.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      logger.warn("[v0] OpenAI API error:", response.status)
      return undefined
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }

    return data.choices?.[0]?.message?.content?.trim()
  } catch (error) {
    logger.error("[v0] OpenAI enrichment error:", error)
    return undefined
  }
}
