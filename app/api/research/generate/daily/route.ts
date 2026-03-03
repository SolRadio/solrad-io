import { NextRequest, NextResponse } from "next/server"
import { put, head } from "@vercel/blob"
import { getTrackedTokens } from "@/lib/get-tracked-tokens"
import type { ResearchReport } from "@/lib/types/research"
import { env } from "@/lib/env"
import { generateDailyReportNarrative } from "@/lib/research/openai"

export const runtime = "edge"
export const dynamic = "force-dynamic"

/**
 * POST /api/research/generate/daily
 * Auto-generates daily market report and publishes to Blob
 * Protected by CRON_SECRET for Vercel Cron Jobs
 */
export async function POST(request: NextRequest) {
  try {
    // Security: Validate CRON_SECRET
    const authHeader = request.headers.get("authorization")
    const expectedSecret = env.CRON_SECRET || env.RESEARCH_GENERATE_SECRET

    if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
      console.log("[v0] Unauthorized daily report generation attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get today's date
    const today = new Date()
    const dateStr = today.toISOString().split("T")[0] // YYYY-MM-DD

    // Check if today's report already exists (idempotency)
    const blobPath = `research/daily/${dateStr}.json`
    try {
      const existing = await head(blobPath)
      if (existing) {
        console.log(`[v0] Daily report for ${dateStr} already exists, skipping`)
        return NextResponse.json({
          success: true,
          message: "Report already exists",
          date: dateStr,
          url: existing.url,
        })
      }
    } catch {
      // File doesn't exist, continue generation
    }

    console.log(`[v0] Generating daily report for ${dateStr}`)

    // Fetch market data
    const tokens = await getTrackedTokens()
    const topTokens = tokens.slice(0, 10)

    // Calculate market stats
    const totalVolume = tokens.reduce((sum, t) => sum + (t.volume24h || 0), 0)
    const avgSolradScore = tokens.reduce((sum, t) => sum + (t.solradScore || 0), 0) / tokens.length

    const trendingTokens = tokens
      .filter((t) => (t.volumeChange24h || 0) > 20)
      .slice(0, 5)
      .map((t) => t.symbol)

    const riskyTokens = tokens.filter((t) => (t.solradScore || 0) < 30).length

    // Try OpenAI generation first
    const aiNarrative = await generateDailyReportNarrative({
      date: today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      totalTokens: tokens.length,
      totalVolume,
      avgSolradScore,
      trendingTokens: trendingTokens.map((symbol, idx) => ({
        symbol,
        volumeChange: tokens.find((t) => t.symbol === symbol)?.volumeChange24h || 0,
      })),
      riskyTokenCount: riskyTokens,
      topPerformers: topTokens.map((t) => ({
        symbol: t.symbol,
        score: t.solradScore || 0,
        volume: t.volume24h || 0,
      })),
    })

    // Generate content (OpenAI or fallback)
    let title: string
    let summary: string
    let content: string
    let tags: string[]
    let report: ResearchReport

    if (aiNarrative) {
      // Use OpenAI-generated narrative
      title = aiNarrative.title
      summary = aiNarrative.summary
      tags = aiNarrative.tags
      content = `${aiNarrative.sections
        .map(
          (section) => `## ${section.heading}\n\n${section.bullets.map((bullet) => `- ${bullet}`).join("\n")}`
        )
        .join("\n\n")}`

      report = {
        title,
        summary,
        content,
        tags,
        insights: [
          {
            title: "Market Sentiment",
            description: `${avgSolradScore >= 60 ? "Bullish market conditions with strong token fundamentals." : avgSolradScore >= 40 ? "Neutral market with mixed signals across tokens." : "Bearish sentiment, exercise caution."}`,
          },
          {
            title: "Volume Analysis",
            description: `Total 24h volume of $${(totalVolume / 1_000_000).toFixed(2)}M ${totalVolume > 50_000_000 ? "indicates high market activity" : "suggests moderate trading interest"}.`,
          },
          {
            title: "Risk Outlook",
            description: `${riskyTokens} tokens flagged as high-risk. ${riskyTokens > 20 ? "Elevated caution advised." : "Relatively stable risk profile."}`,
          },
        ],
        keyMetrics: [
          { label: "Tokens Tracked", value: tokens.length.toString() },
          { label: "24h Volume", value: `$${(totalVolume / 1_000_000).toFixed(1)}M` },
          { label: "Avg Score", value: avgSolradScore.toFixed(1) },
          { label: "High Risk", value: riskyTokens.toString() },
        ],
      }
    } else {
      // Fallback to deterministic template
      console.log("[v0] Using fallback deterministic content")
      title = `Solana Market Daily: ${today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
      summary = `Daily market analysis covering ${tokens.length} Solana tokens with $${(totalVolume / 1_000_000).toFixed(1)}M 24h volume. ${trendingTokens.length} tokens showing strong momentum.`
      tags = ["daily", "market-analysis", "solana"]
      content = `## Market Overview

Today's Solana ecosystem shows **${tokens.length} tracked tokens** with a combined 24-hour trading volume of **$${(totalVolume / 1_000_000).toFixed(2)}M**.

### Key Metrics

- **Average SOLRAD Score**: ${avgSolradScore.toFixed(1)}/100
- **High-Risk Tokens**: ${riskyTokens} tokens scored below 30
- **Trending Tokens**: ${trendingTokens.length} tokens with 20%+ volume increase

### Top Performers by SOLRAD Score

${topTokens.map((t, i) => `${i + 1}. **${t.symbol}** - Score: ${t.solradScore || 0}/100, Volume: $${((t.volume24h || 0) / 1_000_000).toFixed(2)}M`).join("\n")}

### Trending Now

${trendingTokens.length > 0 ? trendingTokens.map((symbol) => `- ${symbol}`).join("\n") : "No significant trending tokens today."}

### Risk Assessment

Our automated risk checker identified **${riskyTokens} high-risk tokens** in today's scan. Always verify contract security and liquidity before trading.

---

*This report was automatically generated by SOLRAD's market intelligence system. Data reflects conditions as of ${today.toISOString()}.*
      `.trim()

      report = {
        title,
        summary,
        content,
        tags,
        insights: [
          {
            title: "Market Sentiment",
            description: `${avgSolradScore >= 60 ? "Bullish market conditions with strong token fundamentals." : avgSolradScore >= 40 ? "Neutral market with mixed signals across tokens." : "Bearish sentiment, exercise caution."}`,
          },
          {
            title: "Volume Analysis",
            description: `Total 24h volume of $${(totalVolume / 1_000_000).toFixed(2)}M ${totalVolume > 50_000_000 ? "indicates high market activity" : "suggests moderate trading interest"}.`,
          },
          {
            title: "Risk Outlook",
            description: `${riskyTokens} tokens flagged as high-risk. ${riskyTokens > 20 ? "Elevated caution advised." : "Relatively stable risk profile."}`,
          },
        ],
        keyMetrics: [
          { label: "Tokens Tracked", value: tokens.length.toString() },
          { label: "24h Volume", value: `$${(totalVolume / 1_000_000).toFixed(1)}M` },
          { label: "Avg Score", value: avgSolradScore.toFixed(1) },
          { label: "High Risk", value: riskyTokens.toString() },
        ],
      }
    }

    // Publish to Blob
    const blob = await put(blobPath, JSON.stringify(report, null, 2), {
      access: "public",
      contentType: "application/json",
    })

    console.log(`[v0] Daily report published: ${blob.url}`)

    // Update index (call internal publish endpoint)
    try {
      await fetch(`${new URL(request.url).origin}/api/research/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report, secret: expectedSecret }),
      })
    } catch (indexError) {
      console.error("[v0] Failed to update index:", indexError)
    }

    return NextResponse.json({
      success: true,
      date: dateStr,
      url: blob.url,
      report,
    })
  } catch (error) {
    console.error("[v0] Daily report generation failed:", error)
    return NextResponse.json(
      { error: "Generation failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
