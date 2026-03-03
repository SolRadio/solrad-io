/**
 * OpenAI Integration for Research Lab Report Generation
 * Generates readable narratives from real computed metrics with strict safety constraints
 */

import { env } from "@/lib/env"

interface DailyReportInput {
  date: string
  totalTokens: number
  totalVolume: number
  avgSolradScore: number
  trendingTokens: Array<{ symbol: string; volumeChange: number }>
  riskyTokenCount: number
  topPerformers: Array<{ symbol: string; score: number; volume: number }>
}

interface WeeklyReportInput {
  week: string
  totalTokens: number
  totalVolume: number
  avgScore: number
  topGainers: Array<{ symbol: string; volumeChange: number; volume: number }>
  topPerformers: Array<{ symbol: string; score: number; volume: number }>
  emergingTokens: Array<{ symbol: string; score: number; volume: number }>
}

interface GeneratedNarrative {
  title: string
  summary: string
  sections: Array<{
    heading: string
    bullets: string[]
  }>
  tags: string[]
}

/**
 * Call OpenAI with strict JSON schema validation
 */
async function callOpenAI(systemPrompt: string, userPrompt: string): Promise<GeneratedNarrative | null> {
  const apiKey = env.OPENAI_API_KEY
  const model = env.OPENAI_MODEL || "gpt-4o-mini"
  const useOpenAI = env.USE_OPENAI_REPORTS !== "false"

  if (!useOpenAI || !apiKey) {
    console.log("[v0] OpenAI disabled or API key missing, using fallback")
    return null
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      console.error(`[v0] OpenAI API error: ${response.status}`)
      return null
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      console.error("[v0] OpenAI returned no content")
      return null
    }

    const parsed = JSON.parse(content) as GeneratedNarrative

    // Validate structure
    if (!parsed.title || !parsed.summary || !Array.isArray(parsed.sections) || !Array.isArray(parsed.tags)) {
      console.error("[v0] OpenAI response missing required fields")
      return null
    }

    console.log("[v0] OpenAI generation successful")
    return parsed
  } catch (error) {
    console.error("[v0] OpenAI call failed:", error)
    return null
  }
}

/**
 * Generate daily report narrative from real metrics
 */
export async function generateDailyReportNarrative(input: DailyReportInput): Promise<GeneratedNarrative | null> {
  const systemPrompt = `You are a professional crypto market analyst writing for SOLRAD, a Solana token intelligence platform.

STRICT CONSTRAINTS:
- Only use numbers and data explicitly provided in the input
- Never invent metrics, partnerships, or "insider" information
- Describe trends as observations only, not predictions
- No "buy" or "sell" language - this is educational content only
- Keep tone professional and factual
- Output must be valid JSON matching this schema:
{
  "title": "string (concise, includes date)",
  "summary": "string (1-2 sentences max)",
  "sections": [{"heading": "string", "bullets": ["string"]}],
  "tags": ["string"]
}

STYLE:
- Use clear, concise language
- Bullet points should be complete sentences
- Include specific numbers from the input
- Focus on what the data shows, not what might happen`

  const userPrompt = `Generate a daily market report for ${input.date} using this data:

Total Tokens Tracked: ${input.totalTokens}
24h Trading Volume: $${(input.totalVolume / 1_000_000).toFixed(2)}M
Average SOLRAD Score: ${input.avgSolradScore.toFixed(1)}/100
High-Risk Tokens: ${input.riskyTokenCount} (score < 30)
Trending Tokens (20%+ volume increase): ${input.trendingTokens.map((t) => `${t.symbol} (+${t.volumeChange.toFixed(1)}%)`).join(", ") || "None"}

Top Performers:
${input.topPerformers.map((t) => `${t.symbol}: Score ${t.score}/100, Volume $${(t.volume / 1_000_000).toFixed(2)}M`).join("\n")}

Create a structured daily report with sections like "Market Overview", "Key Metrics", "Risk Assessment". Use ONLY the numbers provided above.`

  return callOpenAI(systemPrompt, userPrompt)
}

/**
 * Generate weekly report narrative from real metrics
 */
export async function generateWeeklyReportNarrative(input: WeeklyReportInput): Promise<GeneratedNarrative | null> {
  const systemPrompt = `You are a professional crypto market analyst writing for SOLRAD, a Solana token intelligence platform.

STRICT CONSTRAINTS:
- Only use numbers and data explicitly provided in the input
- Never invent metrics, partnerships, or "insider" information  
- Describe trends as observations only, not predictions
- No "buy" or "sell" language - this is educational content only
- Keep tone professional and factual
- Output must be valid JSON matching this schema:
{
  "title": "string (concise, includes week)",
  "summary": "string (1-2 sentences max)",
  "sections": [{"heading": "string", "bullets": ["string"]}],
  "tags": ["string"]
}

STYLE:
- Use clear, concise language
- Bullet points should be complete sentences
- Include specific numbers from the input
- Focus on what the data shows, not what might happen`

  const userPrompt = `Generate a weekly market insights report for ${input.week} using this data:

Total Tokens Tracked: ${input.totalTokens}
Total Volume: $${(input.totalVolume / 1_000_000).toFixed(2)}M
Average Market Score: ${input.avgScore.toFixed(1)}/100

Top Gainers:
${input.topGainers.map((t) => `${t.symbol}: +${t.volumeChange.toFixed(1)}% volume change, $${(t.volume / 1_000_000).toFixed(2)}M volume`).join("\n")}

Top Performers (by SOLRAD Score):
${input.topPerformers.map((t) => `${t.symbol}: ${t.score}/100 score, $${(t.volume / 1_000_000).toFixed(2)}M volume`).join("\n")}

Emerging Opportunities (70+ score, $100K-$1M volume):
${input.emergingTokens.length > 0 ? input.emergingTokens.map((t) => `${t.symbol}: ${t.score}/100 score, $${(t.volume / 1_000_000).toFixed(2)}M volume`).join("\n") : "None identified this week"}

Create a structured weekly report with sections like "Market Overview", "Top Gainers Analysis", "Emerging Opportunities". Use ONLY the numbers provided above.`

  return callOpenAI(systemPrompt, userPrompt)
}
