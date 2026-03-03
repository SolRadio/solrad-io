import { storage } from "@/lib/storage"

const BACKGROUND_INDEX_KEY = "solrad:background:mints"
const BACKGROUND_TOKEN_PREFIX = "solrad:background:token:"
const MAX_BACKGROUND_TOKENS = 1000

export async function addToBackgroundTracking(
  mint: string,
  tokenScore: Record<string, unknown>
): Promise<void> {
  try {
    const existing = (await storage.get(BACKGROUND_INDEX_KEY) as string[]) || []

    if (existing.includes(mint)) {
      // Already tracked -- just update the score
      await storage.set(
        BACKGROUND_TOKEN_PREFIX + mint,
        { ...tokenScore, backgroundTrackedAt: Date.now() },
        { ex: 60 * 60 * 24 * 7 } // 7 day TTL
      )
      return
    }

    if (existing.length >= MAX_BACKGROUND_TOKENS) {
      console.log("[background] Cap reached:", MAX_BACKGROUND_TOKENS)
      return
    }

    const updated = [...existing, mint]
    await Promise.all([
      storage.set(BACKGROUND_INDEX_KEY, updated),
      storage.set(
        BACKGROUND_TOKEN_PREFIX + mint,
        {
          ...tokenScore,
          backgroundTrackedAt: Date.now(),
        },
        { ex: 60 * 60 * 24 * 7 }
      ),
    ])

    console.log("[background] Now tracking:", mint.slice(0, 8), "score:", (tokenScore as { totalScore?: number }).totalScore)
  } catch (err) {
    console.error("[background] addToBackgroundTracking:", err)
  }
}

export async function removeFromBackgroundTracking(
  mint: string
): Promise<void> {
  try {
    const existing = (await storage.get(BACKGROUND_INDEX_KEY) as string[]) || []

    const updated = existing.filter((m) => m !== mint)
    await Promise.all([
      storage.set(BACKGROUND_INDEX_KEY, updated),
      storage.set(BACKGROUND_TOKEN_PREFIX + mint, null),
    ])

    console.log("[background] Removed:", mint.slice(0, 8))
  } catch (err) {
    console.error("[background] removeFromBackgroundTracking:", err)
  }
}

export async function getBackgroundTokens(): Promise<Record<string, unknown>[]> {
  try {
    const mints = (await storage.get(BACKGROUND_INDEX_KEY) as string[]) || []

    const tokens = await Promise.all(
      mints.map((mint) => storage.get(BACKGROUND_TOKEN_PREFIX + mint))
    )

    return tokens.filter(Boolean) as Record<string, unknown>[]
  } catch (err) {
    console.error("[background] getBackgroundTokens:", err)
    return []
  }
}

export async function getBackgroundCount(): Promise<number> {
  try {
    const mints = (await storage.get(BACKGROUND_INDEX_KEY) as string[]) || []
    return mints.length
  } catch {
    return 0
  }
}
