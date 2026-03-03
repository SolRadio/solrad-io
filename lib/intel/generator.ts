import "server-only"
import { storage } from "@/lib/storage"
import type { TokenScore } from "@/lib/types"
import { fetchLatestSolanaNews } from "./newsFetch"
import { generateNewsBrief } from "./newsSummarize"
import { getTop5WinnersToday, generateWinnersTweet, generateWinnersTelegram } from "./winnersToday"

export interface IntelCandidate {
  symbol: string
  mint: string
  score: number
  priceChange24h: number
  liquidity: number
  volume24h: number
  volumeChange24h?: number
  reasonTags: string[]
}

export interface IntelReport {
  generatedAt: number
  date: string
  signals: {
    topCandidates: number
    rotationProxies: number
    avgScore: number
  }
  tweetDrafts: string[]
  tweetTrendingTop10: string
  telegramPacket: string
  candidates: IntelCandidate[]
  aiVoiceUsed?: boolean
  newsIncluded?: boolean
  winnersIncluded?: boolean
}

const STORAGE_KEYS = {
  LATEST: "intel:latest",
  DAILY: (date: string) => `intel:daily:${date}`,
  NEWS_LATEST: "intel:news:latest",
  NEWS_DAILY: (date: string) => `intel:news:${date}`,
}

/**
 * Generate intel report from provided or cached token scores
 */
export async function generateIntelReport(
  providedTokens?: TokenScore[],
  options?: { aiVoice?: boolean; seedOverride?: string }
): Promise<IntelReport> {
  // Use provided tokens or fetch from cache
  const tokens = providedTokens || ((await storage.get("solrad:latest")) as TokenScore[]) || []

  // Filter and sort top candidates
  const candidates: IntelCandidate[] = tokens
    .filter((t) => t.totalScore >= 60) // Min score threshold
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 15) // Top 15
    .map((t) => ({
      symbol: t.symbol,
      mint: t.mint,
      score: t.totalScore,
      priceChange24h: t.priceChange24h || 0,
      liquidity: t.liquidity || 0,
      volume24h: t.volume24h || 0,
      volumeChange24h: t.volumeChange24h,
      reasonTags: generateReasonTags(t),
    }))

  // Fetch Solana news (with timeout protection)
  let newsItems: Awaited<ReturnType<typeof fetchLatestSolanaNews>> = []
  let newsBrief = ""
  try {
    newsItems = await fetchLatestSolanaNews()
    newsBrief = await generateNewsBrief(newsItems)
  } catch (err) {
    console.error("[v0] News fetch failed, using fallback:", err)
    newsBrief = "Solana News:\n• No recent updates available"
  }

  // Get today's top 5 winners
  let winnersToday: Awaited<ReturnType<typeof getTop5WinnersToday>> = []
  let winnersTweet = ""
  try {
    winnersToday = await getTop5WinnersToday()
    winnersTweet = generateWinnersTweet(winnersToday)
  } catch (err) {
    console.error("[v0] Winners fetch failed, using fallback:", err)
    winnersTweet = "🏆 Top SOLRAD Performers Today\n\nNo data available yet.\n\nLive tracking: solrad.io"
  }

  // Generate tweet drafts (6 tweets with new structure)
  const tweetDrafts = generateTweetDrafts(candidates.slice(0, 10), newsBrief, winnersTweet)

  // Generate trending top 10 tweet
  const trendingTop10 = generateTrendingTop10Tweet(candidates.slice(0, 10))

  // Generate Telegram packet (now includes news + winners)
  const telegramPacket = generateTelegramPacket(candidates.slice(0, 10), newsBrief, generateWinnersTelegram(winnersToday))

  const date = new Date().toISOString().split("T")[0]
  const report: IntelReport = {
    generatedAt: Date.now(),
    date,
    signals: {
      topCandidates: candidates.length,
      rotationProxies: 0,
      avgScore: candidates.length > 0 
        ? Math.round(candidates.reduce((sum, c) => sum + c.score, 0) / candidates.length) 
        : 0,
    },
    tweetDrafts,
    tweetTrendingTop10: trendingTop10,
    telegramPacket,
    candidates,
    aiVoiceUsed: options?.aiVoice || false,
    newsIncluded: newsItems.length > 0,
    winnersIncluded: winnersToday.length > 0,
  }

  // Store in KV
  await storage.set(STORAGE_KEYS.LATEST, report, { ex: 86400 }) // 24h TTL
  await storage.set(STORAGE_KEYS.DAILY(date), report, { ex: 604800 }) // 7d TTL
  
  // Store news snapshot separately
  if (newsItems.length > 0) {
    await storage.set(STORAGE_KEYS.NEWS_LATEST, newsItems, { ex: 86400 })
    await storage.set(STORAGE_KEYS.NEWS_DAILY(date), newsItems, { ex: 604800 })
  }

  return report
}

/**
 * Get latest intel report
 */
export async function getLatestIntelReport(): Promise<IntelReport | null> {
  return (await storage.get(STORAGE_KEYS.LATEST)) as IntelReport | null
}

/**
 * Generate reason tags for a token
 */
function generateReasonTags(token: TokenScore): string[] {
  const tags: string[] = []

  if (token.totalScore >= 80) tags.push("HIGH_SCORE")
  if (token.priceChange24h && token.priceChange24h > 50) tags.push("PUMPING")
  if (token.priceChange24h && token.priceChange24h < -30) tags.push("DUMPING")
  if (token.volumeChange24h && token.volumeChange24h > 100) tags.push("VOL_SURGE")
  if (token.liquidity && token.liquidity > 500000) tags.push("HIGH_LIQ")
  if (token.velocity && token.velocity > 0.7) tags.push("FAST_MOVING")

  return tags.length > 0 ? tags : ["RADAR"]
}

/**
 * Generate 6 tweet drafts with new structure:
 * 1. Intel Drop (market tape)
 * 2. Solana News Brief (AI-assisted, sourced)
 * 3. Market Structure Insight (liquidity vs price)
 * 4. Risk Desk Note (data-backed only)
 * 5. Top 5 Winners TODAY ONLY
 * 6. Action Watch (1-3 tokens + confirmation conditions)
 */
function generateTweetDrafts(candidates: IntelCandidate[], newsBrief: string, winnersTweet: string): string[] {
  const top3 = candidates.slice(0, 3)
  const top5 = candidates.slice(0, 5)

  return [
    // Tweet 1: Intel Drop (market tape)
    `☀️ SOLRAD Daily Intel\n\n${top3.map((c, i) => `${i + 1}. $${c.symbol} (${c.score}/100)\n   ${c.priceChange24h > 0 ? "📈" : "📉"} ${c.priceChange24h.toFixed(1)}% • ${formatLiq(c.liquidity)} liq`).join("\n\n")}\n\nLive radar: solrad.io`,

    // Tweet 2: Solana News Brief (AI-assisted with sources)
    newsBrief.substring(0, 280), // Ensure Twitter char limit

    // Tweet 3: Market Structure Insight (liquidity vs price)
    top3[0] && top3[0].liquidity > 100000
      ? `💧 Market Structure\n\n$${top3[0].symbol}\nScore: ${top3[0].score}/100\nLiquidity: ${formatLiq(top3[0].liquidity)}\n24h: ${top3[0].priceChange24h > 0 ? "+" : ""}${top3[0].priceChange24h.toFixed(1)}%\n\nDeep liquidity detected.\nsolrad.io`
      : `💧 Market Structure\n\nTracking ${candidates.length} signals\nLiquidity analysis in progress\n\nsolrad.io`,

    // Tweet 4: Risk Desk Note (data-backed only)
    (() => {
      const highRisk = candidates.filter(c => c.reasonTags.includes("HIGH_SCORE") && c.liquidity < 100000)
      if (highRisk.length > 0) {
        return `⚠️ Risk Desk Note\n\n${highRisk.length} high-scoring tokens with liquidity <$100K\n\nHigh score ≠ safety\nVerify depth before entry\n\nsolrad.io`
      }
      return `⚠️ Risk Desk Note\n\nNo major red flags detected\nStandard caution applies\n\nsolrad.io`
    })(),

    // Tweet 5: Top 5 Winners TODAY ONLY
    winnersTweet,

    // Tweet 6: Action Watch (1-3 tokens + confirmation conditions)
    (() => {
      const watchlist = top3.filter(c => c.score >= 75 && c.liquidity > 50000)
      if (watchlist.length > 0) {
        return `🎯 Action Watch\n\n${watchlist.map(c => `$${c.symbol} (${c.score}/100)`).join("\n")}\n\nConfirmation:\n• Volume sustains\n• Liquidity stable\n• Score holds\n\nsolrad.io`
      }
      return `🎯 Action Watch\n\nNo confirmed setups yet\nMonitoring ${candidates.length} signals\n\nsolrad.io`
    })(),
  ]
}

/**
 * Generate trending top 10 tweet
 */
function generateTrendingTop10Tweet(candidates: IntelCandidate[]): string {
  const top10 = candidates.slice(0, 10)
  return `🔥 Top 10 Trending on SOLRAD\n\n${top10.map((c, i) => `${i + 1}. $${c.symbol} • ${c.score}/100 • ${c.priceChange24h > 0 ? "+" : ""}${c.priceChange24h.toFixed(0)}%`).join("\n")}\n\nLive scoring at solrad.io`
}

/**
 * Generate Telegram content packet
 * Now includes: Intel summary, News brief, Top 3 radar, Winners, Alpha watch
 */
function generateTelegramPacket(candidates: IntelCandidate[], newsBrief: string, winnersTelegram: string): string {
  const top3 = candidates.slice(0, 3)
  
  // Intel Summary
  const intelSummary = `🛰️ **SOLRAD Intelligence Report**\n📅 ${new Date().toLocaleDateString()}\n\n**Market Tape:**\n${top3.map((c, i) => `${i + 1}. **$${c.symbol}** (${c.score}/100)\n   📊 ${c.priceChange24h > 0 ? "+" : ""}${c.priceChange24h.toFixed(1)}% • 💧 ${formatLiq(c.liquidity)}`).join("\n\n")}`
  
  // News Brief (formatted for Telegram)
  const newsSection = `\n\n📰 **${newsBrief.split("\n")[0]}**\n${newsBrief.split("\n").slice(1, 3).join("\n")}`
  
  // Winners section
  const winnersSection = `\n\n${winnersTelegram}`
  
  // Alpha Watch (top signals with confirmation)
  const alphaWatch = top3.filter(c => c.score >= 75 && c.liquidity > 50000)
  const alphaSection = alphaWatch.length > 0
    ? `\n\n**🎯 Alpha Watch:**\n${alphaWatch.map(c => `• **$${c.symbol}** — ${c.score}/100 — Confirm: volume sustains, depth holds`).join("\n")}`
    : `\n\n**🎯 Alpha Watch:**\nNo confirmed setups yet. Monitoring ${candidates.length} signals.`
  
  return `${intelSummary}${newsSection}${winnersSection}${alphaSection}\n\n🔗 https://solrad.io\n\n_Observed conditions, not predictions. DYOR._`
}

/**
 * Format liquidity in human-readable form
 */
function formatLiq(liq: number): string {
  if (liq >= 1000000) return `$${(liq / 1000000).toFixed(1)}M`
  if (liq >= 1000) return `$${(liq / 1000).toFixed(0)}K`
  return `$${liq.toFixed(0)}`
}
