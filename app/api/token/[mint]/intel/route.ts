import { NextRequest, NextResponse } from "next/server"
import { storage } from "@/lib/storage"

const INTEL_CACHE_TTL = 900 // 15 minutes

interface IntelCache {
  insight: string
  generatedAt: string
  metrics: { label: string; value: string }[]
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ mint: string }> }
) {
  const { mint } = await params
  if (!mint || mint.length < 30) {
    return NextResponse.json({ error: "Invalid mint" }, { status: 400 })
  }

  const cacheKey = `token:${mint}:intel`

  // Check cache first
  try {
    const cached = (await storage.get(cacheKey)) as IntelCache | null
    if (cached?.insight) {
      return NextResponse.json(cached, {
        headers: { "Cache-Control": "private, max-age=60" },
      })
    }
  } catch {
    // Cache miss, continue to generate
  }

  // Fetch token data from our own API
  let tokenData: Record<string, unknown> = {}
  try {
    const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://www.solrad.io"
    const res = await fetch(`${origin}/api/token/${mint}`, {
      headers: { "x-internal-job-token": process.env.INTERNAL_JOB_TOKEN || "" },
    })
    if (res.ok) {
      tokenData = await res.json()
    }
  } catch {
    // Proceed with empty data — OpenAI can still provide general analysis
  }

  const priceChange24h = tokenData.priceChange24h ?? tokenData.priceChange?.h24 ?? "N/A"
  const volume24h = tokenData.volume24h ?? tokenData.volume?.h24 ?? "N/A"
  const liquidityUsd = tokenData.liquidity ?? tokenData.liquidityUsd ?? "N/A"
  const fdv = tokenData.fdv ?? tokenData.marketCap ?? "N/A"
  const score = tokenData.totalScore ?? tokenData.score ?? "N/A"
  const riskLevel = tokenData.riskLabel ?? tokenData.riskLevel ?? "unknown"

  // Calculate pair age in days
  const pairCreatedAt = tokenData.pairCreatedAt as number | undefined
  const ageDays = pairCreatedAt
    ? Math.floor((Date.now() - pairCreatedAt) / 86400000)
    : "N/A"

  const formatMetric = (v: unknown): string => {
    if (v === "N/A" || v === null || v === undefined) return "N/A"
    const n = Number(v)
    if (isNaN(n)) return String(v)
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
    return n < 1 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "Intel unavailable" }, { status: 503 })
  }

  try {
    const volLiqRatio = (typeof volume24h === "number" && typeof liquidityUsd === "number" && liquidityUsd > 0)
      ? (volume24h / liquidityUsd).toFixed(2)
      : "N/A"
    const priceStr = typeof priceChange24h === "number"
      ? `${priceChange24h > 0 ? "+" : ""}${priceChange24h.toFixed(1)}%`
      : String(priceChange24h)
    const riskStr = String(riskLevel).toLowerCase().replace(" risk", "")
    const userMessage = `SOLRAD Score: ${score}/100. Price 24h: ${priceStr}. Volume: ${formatMetric(volume24h)}. Liquidity: ${formatMetric(liquidityUsd)}. Pair age: ${ageDays}d. Risk: ${riskStr}. Volume/Liquidity ratio: ${volLiqRatio}. Write 2 sentences: what stands out in this data right now, and the one number that will tell you if this token is gaining or losing momentum.`

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are SOLRAD's on-chain signal analyst. You write like a trader, not a journalist. Be specific and blunt. Max 2 sentences. No filler words. No 'it is important to note'. No 'this indicates potential'. State what the data shows, then state what to watch.",
          },
          { role: "user", content: userMessage },
        ],
        max_tokens: 150,
        temperature: 0.3,
      }),
    })

    if (!openaiRes.ok) {
      return NextResponse.json({ error: "Intel unavailable" }, { status: 503 })
    }

    const data = await openaiRes.json()
    const insight = data.choices?.[0]?.message?.content?.trim() || ""

    if (!insight) {
      return NextResponse.json({ error: "Intel unavailable" }, { status: 503 })
    }

    // Pick 3 most relevant metrics
    const metrics: { label: string; value: string }[] = []
    if (volume24h !== "N/A") metrics.push({ label: "VOL", value: formatMetric(volume24h) })
    if (liquidityUsd !== "N/A") metrics.push({ label: "LIQ", value: formatMetric(liquidityUsd) })
    if (ageDays !== "N/A") metrics.push({ label: "AGE", value: `${ageDays}d` })
    if (fdv !== "N/A" && metrics.length < 3) metrics.push({ label: "FDV", value: formatMetric(fdv) })
    if (typeof priceChange24h === "number" && metrics.length < 4) {
      metrics.push({ label: "24H", value: `${priceChange24h > 0 ? "+" : ""}${priceChange24h.toFixed(1)}%` })
    }
    if (volLiqRatio !== "N/A" && metrics.length < 4) {
      metrics.push({ label: "V/L", value: `${volLiqRatio}x` })
    }

    const result: IntelCache = {
      insight,
      generatedAt: new Date().toISOString(),
      metrics: metrics.slice(0, 4),
    }

    // Cache with 15 min TTL
    try {
      await storage.set(cacheKey, result, { ex: INTEL_CACHE_TTL })
    } catch {
      // Non-fatal — still return the result
    }

    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, max-age=60" },
    })
  } catch {
    return NextResponse.json({ error: "Intel unavailable" }, { status: 503 })
  }
}
