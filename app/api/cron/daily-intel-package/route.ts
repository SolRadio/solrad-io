import { NextResponse } from "next/server"
import { storage } from "@/lib/storage"

/**
 * GET /api/cron/daily-intel-package
 * Runs daily at 08:00 UTC via Vercel cron.
 * Also callable manually for testing (GENERATE NOW button).
 *
 * 1. Fetches top tokens from KV (solrad:latest)
 * 2. Fetches alpha-ledger wins (last 7d)
 * 3. Fetches score-velocity surges (last 24h)
 * 4. Calls OpenAI GPT-4o-mini to produce tweet thread + telegram + proof post
 * 5. Saves complete package to KV as solrad:daily-package:{date}
 */

// ── helpers ──
function todayStr() {
  return new Date().toISOString().split("T")[0]
}

const PKG_KEY = (d: string) => `solrad:daily-package:${d}`
const PKG_LATEST = "solrad:daily-package:latest"
const PKG_TTL = 60 * 60 * 48 // 48 h

interface DailyPackage {
  date: string
  generatedAt: number
  status: "ready" | "posted"
  topTokens: Array<{
    symbol: string
    mint: string
    score: number
    priceChange24h: number
    liquidity: number
    volume24h: number
    signalState?: string
  }>
  surges: Array<{
    symbol: string
    mint: string
    oldScore: number
    newScore: number
    delta: number
    ts: number
  }>
  alphaWins: Array<{
    symbol: string
    mint: string
    detectedAt: string
    outcome: string
    resultPct?: number
  }>
  tweets: string[]
  telegramPacket: string
  proofPost: string
  imageGenerated: boolean
  twitterPosted: boolean
  twitterPostedAt?: number
  telegramPosted: boolean
  telegramPostedAt?: number
}

// ── GPT call ──
async function generateWithGPT(
  topTokens: DailyPackage["topTokens"],
  surges: DailyPackage["surges"],
  alphaWins: DailyPackage["alphaWins"],
): Promise<{ tweets: string[]; telegramPacket: string; proofPost: string }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    // Fallback: generate without AI
    return fallbackGenerate(topTokens, surges, alphaWins)
  }

  const hasRealData = topTokens.length > 0

  const systemPrompt = `You are SOLRAD, a Solana on-chain intelligence system trusted by serious traders.
Generate exactly 6 tweets. Return ONLY a JSON object with format: { "tweets": ["t1","t2","t3","t4","t5","t6"], "telegramPacket": "...", "proofPost": "..." }

VOICE: Data-first degen. Sharp. Confident. Specific numbers always.
NEVER say: "stay sharp", "stay vigilant", "be ready", "great opportunities", "keep an eye out"
ALWAYS include: specific $ amounts, scores out of 100, percentage changes, time references

${hasRealData ? `
TWEET 1 (Hook - best signal): Lead with the highest scoring token. Include score, vol, liq, 24h change. End with solrad.io
TWEET 2 (Score Surge): Biggest score jump in 24h. Include before/after score and what it means.
TWEET 3 (Alpha Proof): Best alpha ledger win. Include % gain, how early SOLRAD detected it.
TWEET 4 (Top 3 ranked): Score + one killer stat each. Fast and punchy.
TWEET 5 (Risk note): Any tokens with thin liquidity, high vol/liq ratio, or warning signs from the data.
TWEET 6 (CTA): What to watch tonight/tomorrow based on the data patterns. End with solrad.io
` : `
No token data available today. Generate 6 tweets about:
TWEET 1: Why on-chain scoring matters more than price action in 2026
TWEET 2: How lead-time detection works — explain SOLRAD's edge in degen terms
TWEET 3: What vol/liq ratio actually tells you (most traders ignore this)
TWEET 4: The difference between EARLY and STRONG signal states
TWEET 5: Why most Solana scanners show you what already happened
TWEET 6: CTA — SOLRAD tracks what others miss. solrad.io
Each tweet must be sharp, specific, and educational. No fluff.`}

FORMAT EXAMPLE:
"$PUNCH 85.3/100. $9.3M vol on $728K liq = 12.8x ratio. SOLRAD flagged it 24 min before the move. Score surged +17pts in one cycle. This is what early detection looks like. solrad.io"

Max 260 chars per tweet. telegramPacket uses HTML formatting. proofPost summarizes alpha wins.`

  const userPrompt = hasRealData ? `LIVE DATA ${new Date().toDateString()}:

TOP TOKENS:
${topTokens.slice(0, 5).map(t =>
  `${t.symbol}: ${t.score}/100 | ${t.signalState || "N/A"} | Vol $${(t.volume24h / 1000).toFixed(0)}K | Liq $${(t.liquidity / 1000).toFixed(0)}K | 24h ${t.priceChange24h?.toFixed(1)}%`
).join("\n")}

SCORE SURGES:
${surges.length > 0 ? surges.slice(0, 3).map(s =>
  `${s.symbol}: +${s.delta?.toFixed(1)}pts (${s.oldScore.toFixed(1)} -> ${s.newScore.toFixed(1)})`
).join("\n") : "None detected"}

ALPHA WINS (7d):
${alphaWins.length > 0 ? alphaWins.slice(0, 3).map(a =>
  `${a.symbol}: ${a.outcome} ${a.resultPct ? "+" + a.resultPct.toFixed(1) + "%" : "N/A"} detected ${a.detectedAt}`
).join("\n") : "None confirmed"}
` : "No live token data available today — use educational content format."

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    })

    if (!res.ok) {
      console.error("[v0] GPT call failed:", res.status)
      return fallbackGenerate(topTokens, surges, alphaWins)
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return fallbackGenerate(topTokens, surges, alphaWins)

    const parsed = JSON.parse(content)
    return {
      tweets: Array.isArray(parsed.tweets) ? parsed.tweets.slice(0, 6) : [],
      telegramPacket: parsed.telegramPacket || "",
      proofPost: parsed.proofPost || "",
    }
  } catch (err) {
    console.error("[v0] GPT generation failed:", err)
    return fallbackGenerate(topTokens, surges, alphaWins)
  }
}

function fallbackGenerate(
  topTokens: DailyPackage["topTokens"],
  surges: DailyPackage["surges"],
  alphaWins: DailyPackage["alphaWins"],
) {
  const top3 = topTokens.slice(0, 3)
  const tweets = [
    `SOLRAD Daily Intel\n\n${top3.map((t, i) => `${i + 1}. $${t.symbol} (${t.score}/100) ${t.priceChange24h > 0 ? "+" : ""}${t.priceChange24h.toFixed(1)}%`).join("\n")}\n\nsolrad.io`,
    ...top3.map(t => `$${t.symbol} | Score: ${t.score} | Vol: $${(t.volume24h / 1e6).toFixed(2)}M | Liq: $${(t.liquidity / 1e6).toFixed(2)}M\n\nsolrad.io`),
    surges.length > 0
      ? `Score Surges\n\n${surges.slice(0, 3).map(s => `$${s.symbol}: ${s.oldScore} -> ${s.newScore} (+${s.delta})`).join("\n")}\n\nsolrad.io`
      : `Monitoring ${topTokens.length} tokens. No major surges today.\n\nsolrad.io`,
    `Live tracking at solrad.io\n\nSignal intelligence for Solana.\n\nsolrad.io`,
  ]

  const telegramPacket = `<b>SOLRAD Daily Intel</b>\n\n${top3.map((t, i) => `${i + 1}. <b>$${t.symbol}</b> (${t.score}/100)\n   ${t.priceChange24h > 0 ? "+" : ""}${t.priceChange24h.toFixed(1)}% | $${(t.liquidity / 1e6).toFixed(2)}M liq`).join("\n\n")}\n\nhttps://solrad.io`

  const proofPost = alphaWins.length > 0
    ? `SOLRAD Alpha Proof\n\n${alphaWins.slice(0, 3).map(w => `$${w.symbol}: ${w.outcome} (${w.resultPct ? w.resultPct.toFixed(1) + "%" : "N/A"}) — Detected ${w.detectedAt}`).join("\n")}\n\nVerifiable on-chain. solrad.io`
    : "No confirmed alpha wins this period. Building signal history.\n\nsolrad.io"

  return { tweets, telegramPacket, proofPost }
}

// ── Main handler ──
export async function GET() {
  const date = todayStr()
  console.log("[v0] Daily intel package: Starting for", date)

  try {
    // 1. Fetch top tokens from KV
    const rawTokens = (await storage.get("solrad:latest")) as Array<Record<string, unknown>> | null
    const allTokens = Array.isArray(rawTokens) ? rawTokens : []
    const topTokens: DailyPackage["topTokens"] = allTokens
      .sort((a, b) => ((b.totalScore as number) || 0) - ((a.totalScore as number) || 0))
      .slice(0, 5)
      .map(t => ({
        symbol: (t.symbol as string) || "???",
        mint: (t.mint as string) || (t.address as string) || "",
        score: (t.totalScore as number) || 0,
        priceChange24h: (t.priceChange24h as number) || 0,
        liquidity: (t.liquidity as number) || 0,
        volume24h: (t.volume24h as number) || 0,
        signalState: (t.signalState as string) || undefined,
      }))

    console.log("[v0] Daily intel: Got", topTokens.length, "top tokens")

    // 2. Fetch alpha-ledger wins (last 7d)
    let alphaWins: DailyPackage["alphaWins"] = []
    try {
      const alphaRaw = (await storage.get("solrad:alpha-ledger")) as Array<Record<string, unknown>> | null
      if (Array.isArray(alphaRaw)) {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
        alphaWins = alphaRaw
          .filter(e => {
            const ts = new Date((e.detectedAt as string) || 0).getTime()
            return ts > sevenDaysAgo && (e.outcome === "win" || e.outcome === "neutral")
          })
          .slice(0, 3)
          .map(e => ({
            symbol: (e.symbol as string) || "???",
            mint: (e.mint as string) || "",
            detectedAt: (e.detectedAt as string) || "",
            outcome: (e.outcome as string) || "neutral",
            resultPct: (e.resultPct as number) || undefined,
          }))
      }
    } catch (err) {
      console.error("[v0] Alpha ledger fetch failed:", err)
    }

    // 3. Fetch score surges (last 24h)
    let surges: DailyPackage["surges"] = []
    try {
      const surgeRaw = (await storage.get("solrad:score-velocity")) as Array<Record<string, unknown>> | null
      if (Array.isArray(surgeRaw)) {
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
        surges = surgeRaw
          .filter(s => ((s.ts as number) || 0) > oneDayAgo)
          .sort((a, b) => ((b.delta as number) || 0) - ((a.delta as number) || 0))
          .slice(0, 5)
          .map(s => ({
            symbol: (s.symbol as string) || "???",
            mint: (s.mint as string) || "",
            oldScore: (s.oldScore as number) || 0,
            newScore: (s.newScore as number) || 0,
            delta: (s.delta as number) || 0,
            ts: (s.ts as number) || Date.now(),
          }))
      }
    } catch (err) {
      console.error("[v0] Score velocity fetch failed:", err)
    }

    // 4. Generate with GPT
    console.log("[v0] Daily intel: Calling GPT...")
    const { tweets, telegramPacket, proofPost } = await generateWithGPT(topTokens, surges, alphaWins)

    // 5. Build + save package
    const pkg: DailyPackage = {
      date,
      generatedAt: Date.now(),
      status: "ready",
      topTokens,
      surges,
      alphaWins,
      tweets,
      telegramPacket,
      proofPost,
      imageGenerated: false,
      twitterPosted: false,
      telegramPosted: false,
    }

    await storage.set(PKG_KEY(date), pkg, { ex: PKG_TTL })
    await storage.set(PKG_LATEST, pkg, { ex: PKG_TTL })

    console.log("[v0] Daily intel package: Saved for", date)

    return NextResponse.json({ ok: true, date, tweetsCount: tweets.length })
  } catch (error) {
    console.error("[v0] Daily intel package failed:", error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export const dynamic = "force-dynamic"
export const maxDuration = 60
