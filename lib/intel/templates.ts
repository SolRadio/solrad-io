/**
 * SOLRAD Intel Tweet Templates
 *
 * Pure functions that format IntelCandidate data into tweet drafts.
 * No server-only imports, no AI -- safe for client-side use.
 * Each template returns 6 tweets matching the existing tweetDrafts shape.
 */

// ── Types (subset of IntelCandidate, avoids server imports) ──

export interface TemplateCandidate {
  symbol: string
  mint: string
  score: number
  priceChange24h: number
  liquidity: number
  volume24h: number
  volumeChange24h?: number
  reasonTags: string[]
}

export type TemplateName = "intel-drop" | "short-alpha" | "risk-note" | "market-pulse"

export interface TemplateOption {
  id: TemplateName
  label: string
  description: string
}

export const TEMPLATE_OPTIONS: TemplateOption[] = [
  { id: "intel-drop", label: "Intel Drop (Default)", description: "Full 6-tweet thread: tape, news, structure, risk, winners, action watch" },
  { id: "short-alpha", label: "Short Alpha", description: "3 punchy tweets: top signal, risk flag, CTA. Fast publishing." },
  { id: "risk-note", label: "Risk Note", description: "Risk-first framing: flags, low-liq warnings, caution signals." },
  { id: "market-pulse", label: "Market Pulse", description: "Market-wide overview: avg score, signal distribution, momentum." },
]

// ── Helpers ──

function fmtLiq(liq: number): string {
  if (liq >= 1_000_000) return `$${(liq / 1_000_000).toFixed(1)}M`
  if (liq >= 1_000) return `$${(liq / 1_000).toFixed(0)}K`
  return `$${liq.toFixed(0)}`
}

function pctSign(v: number): string {
  return v > 0 ? `+${v.toFixed(1)}%` : `${v.toFixed(1)}%`
}

// ── Template Implementations ──

function intelDrop(candidates: TemplateCandidate[]): string[] {
  const top3 = candidates.slice(0, 3)
  const top5 = candidates.slice(0, 5)

  return [
    // 1. Market Tape
    `SOLRAD Daily Intel\n\n${top3.map((c, i) => `${i + 1}. $${c.symbol} (${c.score}/100)\n   ${c.priceChange24h > 0 ? "Up" : "Down"} ${pctSign(c.priceChange24h)} | ${fmtLiq(c.liquidity)} liq`).join("\n\n")}\n\nLive radar: solrad.io`,

    // 2. Trending
    `Trending on SOLRAD\n\n${top5.map((c, i) => `${i + 1}. $${c.symbol} | ${c.score}/100 | ${pctSign(c.priceChange24h)}`).join("\n")}\n\nsolrad.io`,

    // 3. Market Structure
    top3[0]
      ? `Market Structure\n\n$${top3[0].symbol}\nScore: ${top3[0].score}/100\nLiquidity: ${fmtLiq(top3[0].liquidity)}\n24h: ${pctSign(top3[0].priceChange24h)}\n\nsolrad.io`
      : `Market Structure\n\nTracking ${candidates.length} signals\nAnalysis in progress\n\nsolrad.io`,

    // 4. Risk Desk Note
    (() => {
      const highRisk = candidates.filter(c => c.score >= 70 && c.liquidity < 100000)
      if (highRisk.length > 0) {
        return `Risk Desk Note\n\n${highRisk.length} high-scoring tokens with liquidity <$100K\n\nHigh score does not equal safety\nVerify depth before entry\n\nsolrad.io`
      }
      return `Risk Desk Note\n\nNo major red flags detected\nStandard caution applies\n\nsolrad.io`
    })(),

    // 5. Winners
    `Top SOLRAD Performers\n\n${top3.map(c => `$${c.symbol} | ${c.score}/100 | ${pctSign(c.priceChange24h)}`).join("\n")}\n\nsolrad.io`,

    // 6. Action Watch
    (() => {
      const watchlist = top3.filter(c => c.score >= 75 && c.liquidity > 50000)
      if (watchlist.length > 0) {
        return `Action Watch\n\n${watchlist.map(c => `$${c.symbol} (${c.score}/100)`).join("\n")}\n\nConfirmation:\n- Volume sustains\n- Liquidity stable\n- Score holds\n\nsolrad.io`
      }
      return `Action Watch\n\nNo confirmed setups yet\nMonitoring ${candidates.length} signals\n\nsolrad.io`
    })(),
  ]
}

function shortAlpha(candidates: TemplateCandidate[]): string[] {
  const top = candidates[0]
  const runner = candidates[1]
  const avgScore = candidates.length > 0
    ? Math.round(candidates.reduce((s, c) => s + c.score, 0) / candidates.length)
    : 0

  const tweet1 = top
    ? `SOLRAD Alpha\n\n$${top.symbol} | Score ${top.score}/100\n${pctSign(top.priceChange24h)} | ${fmtLiq(top.liquidity)} liq\n\nTop signal right now.\nsolrad.io`
    : `SOLRAD Alpha\n\nNo high-conviction signals yet.\nMonitoring.\n\nsolrad.io`

  const tweet2 = (() => {
    const lowLiq = candidates.filter(c => c.liquidity < 50000)
    if (lowLiq.length > 0) {
      return `Risk Flag\n\n${lowLiq.length} token${lowLiq.length > 1 ? "s" : ""} scoring well but liquidity under $50K.\nApproach with caution.\n\nsolrad.io`
    }
    return `Risk Flag\n\nAll tracked tokens have adequate liquidity.\nStandard due diligence applies.\n\nsolrad.io`
  })()

  const tweet3 = `${runner ? `Runner-up: $${runner.symbol} at ${runner.score}/100\n\n` : ""}${candidates.length} tokens tracked | Avg score ${avgScore}/100\n\nFull radar: solrad.io`

  return [tweet1, tweet2, tweet3, "", "", ""]
}

function riskNote(candidates: TemplateCandidate[]): string[] {
  const lowLiq = candidates.filter(c => c.liquidity < 100000)
  const dumping = candidates.filter(c => c.priceChange24h < -20)
  const highVol = candidates.filter(c => c.volumeChange24h !== undefined && c.volumeChange24h > 200)
  const top3 = candidates.slice(0, 3)

  const tweet1 = `SOLRAD Risk Report\n\n${lowLiq.length} tokens with liq <$100K\n${dumping.length} tokens down >20% (24h)\n${highVol.length} with volume surge >200%\n\nDetails below.\nsolrad.io`

  const tweet2 = lowLiq.length > 0
    ? `Low Liquidity Alert\n\n${lowLiq.slice(0, 3).map(c => `$${c.symbol} | ${fmtLiq(c.liquidity)} | Score ${c.score}`).join("\n")}\n\nThin depth = slippage risk.\nsolrad.io`
    : `Low Liquidity Alert\n\nAll tracked tokens above $100K liquidity.\nNo immediate depth concerns.\n\nsolrad.io`

  const tweet3 = dumping.length > 0
    ? `Drawdown Watch\n\n${dumping.slice(0, 3).map(c => `$${c.symbol} | ${pctSign(c.priceChange24h)} | Score ${c.score}`).join("\n")}\n\nMonitor for reversal or exit.\nsolrad.io`
    : `Drawdown Watch\n\nNo tokens down more than 20%.\nMarket conditions stable.\n\nsolrad.io`

  const tweet4 = `Safe Zone (Top Scored)\n\n${top3.map(c => `$${c.symbol} | ${c.score}/100 | ${fmtLiq(c.liquidity)}`).join("\n")}\n\nsolrad.io`

  return [tweet1, tweet2, tweet3, tweet4, "", ""]
}

function marketPulse(candidates: TemplateCandidate[]): string[] {
  const avgScore = candidates.length > 0
    ? Math.round(candidates.reduce((s, c) => s + c.score, 0) / candidates.length)
    : 0
  const avgLiq = candidates.length > 0
    ? candidates.reduce((s, c) => s + c.liquidity, 0) / candidates.length
    : 0
  const greenCount = candidates.filter(c => c.priceChange24h > 0).length
  const redCount = candidates.filter(c => c.priceChange24h <= 0).length
  const top = candidates[0]
  const top5 = candidates.slice(0, 5)

  const tweet1 = `SOLRAD Market Pulse\n\n${candidates.length} tokens tracked\nAvg Score: ${avgScore}/100\nAvg Liquidity: ${fmtLiq(avgLiq)}\n\n${greenCount} green | ${redCount} red (24h)\n\nsolrad.io`

  const tweet2 = top
    ? `Top Signal\n\n$${top.symbol}\nScore: ${top.score}/100\n24h: ${pctSign(top.priceChange24h)}\nLiq: ${fmtLiq(top.liquidity)}\nVol: ${fmtLiq(top.volume24h)}\n\nsolrad.io`
    : `Top Signal\n\nNo standout signal today.\nMonitoring.\n\nsolrad.io`

  const tweet3 = `Leaderboard\n\n${top5.map((c, i) => `${i + 1}. $${c.symbol} | ${c.score} | ${pctSign(c.priceChange24h)}`).join("\n")}\n\nsolrad.io`

  const tweet4 = (() => {
    const momentum = greenCount > redCount ? "Bullish bias" : greenCount < redCount ? "Bearish lean" : "Neutral"
    return `Momentum: ${momentum}\n\n${greenCount}/${candidates.length} tokens positive (24h)\nAvg move: ${candidates.length > 0 ? pctSign(candidates.reduce((s, c) => s + c.priceChange24h, 0) / candidates.length) : "N/A"}\n\nsolrad.io`
  })()

  return [tweet1, tweet2, tweet3, tweet4, "", ""]
}

// ── Public API ──

/**
 * Apply a named template to candidates, returning 6 tweet strings.
 * Empty strings at the end indicate the template produces fewer than 6 tweets.
 */
export function applyTemplate(name: TemplateName, candidates: TemplateCandidate[]): string[] {
  switch (name) {
    case "intel-drop":
      return intelDrop(candidates)
    case "short-alpha":
      return shortAlpha(candidates)
    case "risk-note":
      return riskNote(candidates)
    case "market-pulse":
      return marketPulse(candidates)
    default:
      return intelDrop(candidates)
  }
}
