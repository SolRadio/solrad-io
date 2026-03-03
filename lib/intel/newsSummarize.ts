import "server-only"
import type { NewsItem } from "./newsFetch"

/**
 * Summarize news items using OpenAI (gpt-4o-mini)
 * Server-side only, with graceful fallback
 */
export async function summarizeSolanaNews(items: NewsItem[]): Promise<string> {
  if (items.length === 0) {
    return "No recent Solana news available."
  }
  
  // Fallback: If OpenAI fails, use raw headlines
  const fallbackSummary = items
    .map(item => `• ${item.title} (${item.source})`)
    .join("\n")
  
  // Check for API key
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.warn("[v0] OpenAI API key not found, using fallback summary")
    return fallbackSummary
  }
  
  try {
    console.log("[v0] Summarizing news with OpenAI...")
    
    // Construct prompt
    const headlinesText = items
      .map(item => `${item.title} (source: ${item.source})`)
      .join("\n")
    
    const prompt = `You are a crypto trading analyst. Summarize these Solana news headlines for traders.

Headlines:
${headlinesText}

Instructions:
- One concise sentence per headline
- Explain why it matters for Solana traders
- Be factual, no hype
- Keep total under 200 characters
- Format as bullet points`

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a concise crypto analyst focused on actionable trader insights.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    })
    
    if (!response.ok) {
      console.error("[v0] OpenAI API error:", response.status)
      return fallbackSummary
    }
    
    const data = await response.json()
    const summary = data.choices?.[0]?.message?.content?.trim()
    
    if (!summary) {
      console.warn("[v0] OpenAI returned empty summary")
      return fallbackSummary
    }
    
    console.log("[v0] OpenAI summary generated successfully")
    return summary
    
  } catch (err) {
    console.error("[v0] OpenAI summarization error:", err)
    return fallbackSummary
  }
}

/**
 * Generate news brief for tweets/telegram
 * Includes source links
 */
export async function generateNewsBrief(items: NewsItem[]): Promise<string> {
  if (items.length === 0) {
    return "Solana News:\n• No major developments in the last 24h"
  }
  
  const summary = await summarizeSolanaNews(items)
  
  // Add source links
  const links = items.map(item => `${item.source}: ${item.url}`).join("\n")
  
  return `Solana News:\n${summary}\n\nSources:\n${links}`
}
