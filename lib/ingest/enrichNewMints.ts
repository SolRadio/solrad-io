import { kv } from "@vercel/kv"

/**
 * enrichNewMints — fetches DexScreener data for newly discovered mints,
 * scores them, and writes qualifying tokens (score >= 50) into the
 * background tracking index so they appear on the radar.
 */

const DEXSCREENER_BASE = "https://api.dexscreener.com/latest/dex/tokens"
const BATCH_SIZE = 20
const BATCH_DELAY_MS = 500
const FETCH_TIMEOUT_MS = 8000

const MIN_LIQUIDITY = 1000
const MIN_VOLUME = 500
const QUALIFY_SCORE = 50

const BG_TOKEN_TTL = 604800 // 7 days
const SCORE_CACHE_TTL = 3600 // 1 hour

// ---------------------------------------------------------------------------
// Inline scoring — mirrors ingestion.ts formula but kept independent
// ---------------------------------------------------------------------------
function computeQuickScore(pair: any): {
  total: number
  breakdown: { liquidityScore: number; volumeScore: number; activityScore: number; ageScore: number }
} {
  const liq = pair.liquidity?.usd || 0
  const vol = pair.volume?.h24 || 0
  const txns = (pair.txns?.h24?.buys ?? 0) + (pair.txns?.h24?.sells ?? 0)
  const age = pair.pairCreatedAt
    ? (Date.now() - pair.pairCreatedAt) / (1000 * 60 * 60)
    : 999

  const liquidityScore = Math.min(100, (liq / 50000) * 100)
  const volumeScore = Math.min(100, (vol / 100000) * 100)
  const activityScore = Math.min(100, (txns / 500) * 100)
  const ageScore = age < 1 ? 100 : age < 6 ? 80 : age < 24 ? 60 : age < 72 ? 40 : 20

  const total = Math.round(
    liquidityScore * 0.25 +
    volumeScore * 0.35 +
    activityScore * 0.25 +
    ageScore * 0.15,
  )

  return { total, breakdown: { liquidityScore, volumeScore, activityScore, ageScore } }
}

// ---------------------------------------------------------------------------
// Fetch a single mint from DexScreener with timeout
// ---------------------------------------------------------------------------
async function fetchDexScreener(mint: string): Promise<any | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(`${DEXSCREENER_BASE}/${mint}`, { signal: controller.signal })
    if (!res.ok) return null
    const json = await res.json()
    return json
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

// ---------------------------------------------------------------------------
// Pick the highest-liquidity Solana pair
// ---------------------------------------------------------------------------
function pickBestSolanaPair(pairs: any[]): any | null {
  if (!pairs || pairs.length === 0) return null
  const solanaPairs = pairs.filter(
    (p: any) => p.chainId === "solana" && (p.liquidity?.usd ?? 0) > 0,
  )
  if (solanaPairs.length === 0) return null
  return solanaPairs.reduce((best: any, p: any) =>
    (p.liquidity?.usd ?? 0) > (best.liquidity?.usd ?? 0) ? p : best,
  )
}

// ---------------------------------------------------------------------------
// Main enrichment function
// ---------------------------------------------------------------------------
export async function enrichNewMints(
  newMints: string[],
): Promise<{ enriched: number; scored: number; qualified: number; skipped: number }> {
  const stats = { enriched: 0, scored: 0, qualified: 0, skipped: 0 }

  if (newMints.length === 0) return stats

  console.log(`[enrichNewMints] starting: ${newMints.length}`)

  const qualifiedMints: string[] = []

  // Process in batches of BATCH_SIZE
  for (let i = 0; i < newMints.length; i += BATCH_SIZE) {
    const batch = newMints.slice(i, i + BATCH_SIZE)

    const results = await Promise.allSettled(batch.map((mint) => fetchDexScreener(mint)))

    for (let j = 0; j < batch.length; j++) {
      const mint = batch[j]
      const result = results[j]

      if (result.status !== "fulfilled" || !result.value) {
        stats.skipped++
        continue
      }

      const pair = pickBestSolanaPair(result.value.pairs)
      if (!pair) {
        stats.skipped++
        continue
      }

      const liq = pair.liquidity?.usd ?? 0
      const vol = pair.volume?.h24 ?? 0

      // Filter out tokens with insufficient liquidity or volume
      if (liq < MIN_LIQUIDITY || vol < MIN_VOLUME) {
        stats.skipped++
        continue
      }

      stats.enriched++

      // Score the token
      const { total, breakdown } = computeQuickScore(pair)
      stats.scored++

      const now = Date.now()
      const tokenData = {
        address: mint,
        symbol: pair.baseToken?.symbol || "???",
        name: pair.baseToken?.name || "Unknown",
        priceUsd: parseFloat(pair.priceUsd || "0"),
        volume24h: vol,
        liquidity: liq,
        marketCap: pair.marketCap || 0,
        txns24h: (pair.txns?.h24?.buys ?? 0) + (pair.txns?.h24?.sells ?? 0),
        imageUrl: pair.info?.imageUrl || null,
        pairAddress: pair.pairAddress || "",
        pairUrl: pair.url || "",
        totalScore: total,
        scoreBreakdown: breakdown,
        source: "dexscreener" as const,
        backgroundTrackedAt: now,
        lastUpdated: now,
      }

      // Write enriched token data + score to KV
      await Promise.all([
        kv.set(`solrad:background:token:${mint}`, tokenData, { ex: BG_TOKEN_TTL }),
        kv.set(`solrad:token:score:${mint}`, total, { ex: SCORE_CACHE_TTL }),
      ])

      if (total >= QUALIFY_SCORE) {
        qualifiedMints.push(mint)
        stats.qualified++
      }
    }

    // Delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < newMints.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS))
    }
  }

  // Add qualified mints to the background index
  if (qualifiedMints.length > 0) {
    const bgIndex = (await kv.get<string[]>("solrad:background:mints")) || []
    const bgSet = new Set(bgIndex)
    qualifiedMints.forEach((m) => bgSet.add(m))
    const newIndex = Array.from(bgSet).slice(0, 1000)
    await kv.set("solrad:background:mints", newIndex)
    console.log(`[enrichNewMints] qualified: ${qualifiedMints.length}`)
  }

  console.log(
    `[enrichNewMints] complete: ${stats.enriched} enriched, ${stats.scored} scored, ${stats.qualified} qualified, ${stats.skipped} skipped`,
  )

  return stats
}
