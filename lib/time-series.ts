import type { TokenScore, TimeSeriesPoint, TokenTimeSeries } from "./types"
import { storage, CACHE_KEYS, CACHE_TTL } from "./storage"

export async function saveTimeSeriesPoints(tokens: TokenScore[]): Promise<void> {
  const now = Date.now()
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

  for (const token of tokens) {
    try {
      const key = CACHE_KEYS.TIME_SERIES(token.address)
      const existingData = await storage.get(key)

      let timeSeries: TokenTimeSeries
      if (existingData) {
        timeSeries = existingData as TokenTimeSeries
      } else {
        timeSeries = { mint: token.address, points: [] }
      }

      // Add new point
      const newPoint: TimeSeriesPoint = {
        t: now,
        score: token.totalScore,
        priceUsd: token.priceUsd,
        liquidityUsd: token.liquidity,
        volume24h: token.volume24h,
        sources: token.boostSources || [],
      }

      timeSeries.points.push(newPoint)

      // Trim to last 7 days
      const cutoff = now - SEVEN_DAYS_MS
      timeSeries.points = timeSeries.points.filter((p) => p.t >= cutoff)

      // Save back (store native object, not stringified)
      await storage.set(key, timeSeries, { ex: CACHE_TTL.TIME_SERIES })
    } catch (error) {
      console.warn(`[v0] Failed to save time series for ${token.address}:`, error)
    }
  }
}

export async function getTimeSeriesForToken(mint: string): Promise<TokenTimeSeries | null> {
  try {
    const key = CACHE_KEYS.TIME_SERIES(mint)
    const data = await storage.get(key)
    if (!data) return null
    return data as TokenTimeSeries
  } catch {
    return null
  }
}

export async function getTokensInTimeRange(
  tokens: TokenScore[],
  hours: number,
): Promise<Array<TokenScore & { scoreDelta: number }>> {
  const now = Date.now()
  const rangeMs = hours * 60 * 60 * 1000

  const results = await Promise.all(
    tokens.map(async (token) => {
      const ts = await getTimeSeriesForToken(token.address)
      if (!ts || ts.points.length === 0) {
        return { ...token, scoreDelta: 0 }
      }

      // Find earliest point in range
      const earliestPoint = ts.points.find((p) => p.t >= now - rangeMs)
      if (!earliestPoint) {
        return { ...token, scoreDelta: 0 }
      }

      const scoreDelta = token.totalScore - earliestPoint.score
      return { ...token, scoreDelta }
    }),
  )

  // Sort by score delta descending (biggest gains first)
  return results.sort((a, b) => b.scoreDelta - a.scoreDelta)
}
