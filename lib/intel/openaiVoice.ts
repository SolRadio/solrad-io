import "server-only"
import type { IntelCandidate } from "@/lib/intel/types"

/**
 * OpenAI Voice Layer for SOLRAD Intel
 * 
 * RULES:
 * - Must use structured outputs (JSON schema enforcement)
 * - Model CANNOT invent facts
 * - Must fail safe: if OpenAI errors, fallback to deterministic
 * - Forbidden phrases: "smart wallet flows", "wallet inflows", "insider wallets"
 * - Only rewrite, never create new data points
 */

export interface TruthPack {
  date: string
  marketSnapshot: {
    rotationCount: number
    avgLiquidity: string
    momentum: string
  }
  topRadar: Array<{
    symbol: string
    score: number
    priceChange: number
    liquidity: string
  }>
  alphaCandidate?: {
    symbol: string
    mint: string
    score: number
    priceChange: number
    liquidity: string
    reasonTags: string[]
  }
  links: {
    dashboard: string
    token?: string
  }
}

export interface VoiceOutput {
  tweets: string[]
  telegram: string
}

/**
 * Rewrite intel using OpenAI with strict fact-checking
 */
export async function rewriteIntelWithOpenAI({
  truthPack,
  seed,
  mode = "balanced",
}: {
  truthPack: TruthPack
  seed: string
  mode?: "balanced" | "punchy" | "analytical"
}): Promise<VoiceOutput | null> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    console.warn("[v0] OPENAI_API_KEY not configured, skipping AI voice")
    return null
  }

  try {
    const systemPrompt = buildSystemPrompt(mode)
    const userPrompt = buildUserPrompt(truthPack, seed)

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 2000,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "intel_voice_output",
            strict: true,
            schema: {
              type: "object",
              properties: {
                tweets: {
                  type: "array",
                  items: { type: "string" },
                  description: "Array of 3-6 tweet strings",
                },
                telegram: {
                  type: "string",
                  description: "Telegram message (5-10 lines max, NO tweet labels)",
                },
              },
              required: ["tweets", "telegram"],
              additionalProperties: false,
            },
          },
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("[v0] OpenAI API error:", error)
      return null
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      console.error("[v0] No content in OpenAI response")
      return null
    }

    const parsed: VoiceOutput = JSON.parse(content)

    // Validate output
    if (!parsed.tweets || !Array.isArray(parsed.tweets) || parsed.tweets.length < 3) {
      console.error("[v0] Invalid tweets array from OpenAI")
      return null
    }

    if (!parsed.telegram || typeof parsed.telegram !== "string") {
      console.error("[v0] Invalid telegram string from OpenAI")
      return null
    }

    // Forbidden phrase check
    const forbiddenPhrases = [
      "smart wallet flow",
      "wallet inflow",
      "insider wallet",
      "whale wallet tracked",
      "wallet accumulation",
    ]

    const allText = [...parsed.tweets, parsed.telegram].join(" ").toLowerCase()
    const hasForbidden = forbiddenPhrases.some((phrase) =>
      allText.includes(phrase)
    )

    if (hasForbidden) {
      console.error("[v0] OpenAI output contains forbidden phrases, rejecting")
      return null
    }

    return parsed
  } catch (error) {
    console.error("[v0] OpenAI voice layer error:", error)
    return null
  }
}

/**
 * Build system prompt with strict constraints
 */
function buildSystemPrompt(mode: string): string {
  const baseInstructions = `You are a professional crypto intelligence writer for SOLRAD, a Solana token research platform.

ABSOLUTE RULES:
1. You MUST ONLY rewrite the provided facts. DO NOT invent new data points.
2. NEVER mention: "smart wallet flows", "wallet inflows", "insider wallets", or any wallet-level tracking claims.
3. The smartFlow badge means "healthy volume/liquidity ratio" — nothing about wallet tracking.
4. If a fact is missing from the Truth Pack, DO NOT include it.
5. Output MUST match the JSON schema exactly.

TELEGRAM FORMAT:
- 5-10 lines max
- NO labels like "Tweet 1" or "Thread"
- Start with "📡 SOLRAD INTEL DROP — {date}"
- Keep it scannable and professional
- Must include market snapshot, top radar (up to 3 tokens), optional alpha candidate, links

TWEET THREAD:
- 3-6 tweets
- First tweet: Market signal opener
- Include data from Truth Pack only
- Natural voice, not robotic
- Professional trading desk tone`

  const toneGuidance = {
    balanced: "Tone: Professional, data-driven, no hype",
    punchy: "Tone: Sharp, direct, slightly edgy but factual",
    analytical: "Tone: Academic, detailed, systematic",
  }

  return `${baseInstructions}\n\n${toneGuidance[mode as keyof typeof toneGuidance] || toneGuidance.balanced}`
}

/**
 * Build user prompt with Truth Pack
 */
function buildUserPrompt(truthPack: TruthPack, seed: string): string {
  return `TRUTH PACK (rewrite these facts ONLY):

Date: ${truthPack.date}
Seed: ${seed} (use this for phrasing variety, but keep facts intact)

Market Snapshot:
- Rotation signals: ${truthPack.marketSnapshot.rotationCount} tokens
- Avg liquidity: ${truthPack.marketSnapshot.avgLiquidity}
- Momentum status: ${truthPack.marketSnapshot.momentum}

Top Radar (up to 3):
${truthPack.topRadar
  .map(
    (t, i) =>
      `${i + 1}) $${t.symbol} — Score ${t.score} — ${t.priceChange > 0 ? "+" : ""}${t.priceChange.toFixed(1)}% — ${t.liquidity}`
  )
  .join("\n")}

${
  truthPack.alphaCandidate
    ? `Alpha Candidate:
$${truthPack.alphaCandidate.symbol}
Score: ${truthPack.alphaCandidate.score}/100
24h: ${truthPack.alphaCandidate.priceChange > 0 ? "+" : ""}${truthPack.alphaCandidate.priceChange.toFixed(1)}%
Liquidity: ${truthPack.alphaCandidate.liquidity}
Why it matters: ${truthPack.alphaCandidate.reasonTags.join(", ")}
Token link: ${truthPack.links.token}`
    : "No high-confidence alpha candidate today"
}

Dashboard link: ${truthPack.links.dashboard}

TASK: Rewrite into natural, professional intel drop. Follow JSON schema. NO new facts.`
}

/**
 * Generate daily seed from date
 */
export function generateDailySeed(date: string): string {
  // Create deterministic seed from date
  const hash = simpleHash(date)
  return `seed_${hash}`
}

/**
 * Simple hash function for seed generation
 */
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}
