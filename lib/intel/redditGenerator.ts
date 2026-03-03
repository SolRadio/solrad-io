import type { IntelReport } from "@/lib/intel/types"

/**
 * Generate Reddit-style analysis post from intel report
 * Tone: Analytical, data-driven, no hype
 */
export function generateRedditPost(report: IntelReport): string {
  const { date, candidates, signals } = report

  let post = `**SOLRAD Daily Analysis - ${date}**\n\n`

  post += `Today's intelligence scan identified ${signals.topCandidates} tokens meeting threshold criteria (score ≥ 50). `
  post += `Average quality score: ${signals.avgScore}/100. `
  post += `Rotation proxy count: ${signals.rotationProxies}.\n\n`

  if (candidates.length > 0) {
    post += `**Top Signals:**\n\n`

    candidates.slice(0, 3).forEach((c, i) => {
      post += `${i + 1}. **$${c.symbol}** - Score: ${c.score}/100\n`
      post += `   - Price Change (24h): ${c.priceChange24h > 0 ? "+" : ""}${c.priceChange24h.toFixed(1)}%\n`
      post += `   - Liquidity: $${(c.liquidity / 1_000_000).toFixed(2)}M\n`
      post += `   - Volume (24h): $${(c.volume24h / 1_000_000).toFixed(2)}M\n`
      if (c.reasonTags && c.reasonTags.length > 0) {
        post += `   - Signals: ${c.reasonTags.join(", ")}\n`
      }
      post += `\n`
    })

    post += `**Methodology:**\n\n`
    post += `SOLRAD operates as a read-only intelligence platform scanning Solana on-chain data in real-time. Scores are derived from liquidity depth, volume patterns, holder distribution, and structural health metrics. This is research data, not financial advice.\n\n`

    post += `**Data Sources:** Solana RPC nodes, DEX aggregators, on-chain indexers.\n\n`

    post += `[View full dashboard](https://www.solrad.io)\n\n`

    post += `---\n\n`
    post += `*This analysis is generated from SOLRAD's automated intelligence engine. All data is read-only and publicly verifiable. No wallet connection required. DYOR.*`
  } else {
    post += `No tokens met quality threshold today. Market conditions may be unfavorable or signals are below baseline.\n\n`
    post += `[SOLRAD Dashboard](https://www.solrad.io)`
  }

  return post
}
