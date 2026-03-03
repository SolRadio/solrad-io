import "server-only"
import { put, list } from "@vercel/blob"
import type { TokenScore, ArchivedToken } from "./types"
import { storage, CACHE_TTL } from "./storage"

// ── Blob Rate-Limit Cooldown ──────────────────────────────────────────
const BLOB_COOLDOWN_KEY = "solrad:blob:cooldown"

/** Check if blob writes are in cooldown (rate-limited). */
async function isBlobCooldown(): Promise<boolean> {
  try {
    const v = await storage.get(BLOB_COOLDOWN_KEY)
    return v !== null
  } catch {
    return false // fail-open: allow writes if KV is unreachable
  }
}

/** Set blob cooldown after a rate-limit hit. */
async function setBlobCooldown(): Promise<void> {
  try {
    await storage.set(BLOB_COOLDOWN_KEY, Date.now(), { ex: CACHE_TTL.BLOB_COOLDOWN })
    console.log("[blob] cooldown set (10m) due to rate limit")
  } catch {
    // non-fatal
  }
}

export interface BlobState {
  trackedMints: string[]
  tokensByMint: Record<string, TokenScore>
  history: Record<
    string,
    Array<{
      ts: number
      score: number
      priceUsd?: number
      volume24h?: number
      liquidityUsd?: number
    }>
  >
  pins: string[]
  tags: Record<string, string>
  archiveByMint: Record<string, ArchivedToken>
  meta: {
    createdAt: string
    updatedAt: string
    version: number
  }
}

const BLOB_PATHNAME = "solrad/state.json"
const MAX_RETRIES = 3

// In-memory TTL caching
let memoryState: BlobState | null = null
let blobUrlCache: { url: string | null; expiresAt: number } | null = null
let memoryStateFreshness: number = 0
const BLOB_URL_TTL = 5 * 60 * 1000 // 5 minutes
const MEMORY_STATE_TTL = 30 * 1000 // 30 seconds

/**
 * NUCLEAR OPTION: Clear the in-memory cache
 * Used when we need to force a complete refresh (e.g., after deleting blob storage)
 */
export function clearBlobMemoryCache(): void {
  memoryState = null
  memoryStateFreshness = 0
  blobUrlCache = null
  console.log("[v0] Blob memory cache cleared")
}

function getDefaultState(): BlobState {
  return {
    trackedMints: [],
    tokensByMint: {},
    history: {},
    pins: [],
    tags: {},
    archiveByMint: {},
    meta: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    },
  }
}

async function findBlobUrl(): Promise<string | null> {
  const now = Date.now()
  
  // Return cached URL if still valid
  if (blobUrlCache && blobUrlCache.expiresAt > now) {
    return blobUrlCache.url
  }
  
  try {
    const { blobs } = await list({ prefix: "solrad/" })
    const stateBlob = blobs.find((b) => b.pathname === BLOB_PATHNAME)
    const url = stateBlob?.url || null
    
    // Cache the result
    blobUrlCache = {
      url,
      expiresAt: now + BLOB_URL_TTL,
    }
    
    return url
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    
    // Check if this is a rate limit error
    const isRateLimit = errorMsg.toLowerCase().includes("too many") || 
                        errorMsg.toLowerCase().includes("rate limit") ||
                        errorMsg.toLowerCase().includes("429")
    
    if (isRateLimit) {
      console.warn("[v0] Blob list() rate limited, using stale cache")
    } else {
      console.warn("[v0] Blob list() failed:", errorMsg)
    }
    
    // Return stale cache if available
    if (blobUrlCache) {
      return blobUrlCache.url
    }
    
    return null
  }
}

export async function getBlobState(): Promise<BlobState> {
  const now = Date.now()
  
  // Return fresh memory state if available and recent
  if (memoryState && memoryStateFreshness && (now - memoryStateFreshness) < MEMORY_STATE_TTL) {
    return memoryState
  }
  
  // Step 1: Try to find and read existing blob
  const blobUrl = await findBlobUrl()

  if (blobUrl) {
    // Retry logic with exponential backoff
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 10000)
        
        const response = await fetch(blobUrl, { signal: controller.signal })
        clearTimeout(timeout)
        
        // Handle rate limiting (429/403) or server errors (5xx)
        if (response.status === 429 || response.status === 403 || response.status >= 500) {
          if (attempt < 2) {
            const backoffMs = attempt === 0 ? 250 : 750
            await new Promise((resolve) => setTimeout(resolve, backoffMs))
            continue
          }
          // Last attempt failed, fall through to fallback
          break
        }
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        // Read response text first
        const text = await response.text()
        
        if (!text || text.trim().length === 0) {
          throw new Error("Empty response")
        }
        
        const trimmedText = text.trim()
        
        // Check for HTML error page (starts with < OR contains "Too Many")
        if (trimmedText.startsWith("<") || trimmedText.includes("Too Many")) {
          // Rate limited - return null to trigger fallback
          if (memoryState) {
            console.log("[v0] Blob unavailable (rate limited), using fallback cache")
            return memoryState
          }
          break
        }
        
        // Only parse if it starts with JSON
        if (!trimmedText.startsWith("{") && !trimmedText.startsWith("[")) {
          throw new Error("Non-JSON response")
        }
        
        // Safe JSON parsing
        let state: BlobState
        try {
          state = JSON.parse(trimmedText) as BlobState
        } catch (parseError) {
          throw new Error(`JSON parse failed`)
        }
        
        // Validate state structure
        if (!state || typeof state !== "object" || !state.meta) {
          throw new Error("Invalid state structure")
        }
        
        // Success - update cache
        memoryState = state
        memoryStateFreshness = now
        console.log("[v0] Loaded state from Blob:", Object.keys(state.tokensByMint || {}).length, "tokens")
        return state
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        const isRetryable = errorMsg.includes("429") || 
                           errorMsg.toLowerCase().includes("timeout") ||
                           errorMsg.toLowerCase().includes("rate limit") ||
                           errorMsg.toLowerCase().includes("aborted")
        
        if (attempt < 2 && isRetryable) {
          const backoffMs = attempt === 0 ? 250 : 750
          await new Promise((resolve) => setTimeout(resolve, backoffMs))
          continue
        }
        
        // Last attempt or non-retryable error
        break
      }
    }
    
    // All retries failed - use fallback cache
    if (memoryState) {
      console.log("[v0] Blob unavailable (rate limited), using fallback cache")
      return memoryState
    }
  }

  // Step 2: Blob not found - return default state
  const defaultState = getDefaultState()
  
  // If we couldn't find a blob URL, try to initialize with allowOverwrite
  if (!blobUrl) {
    try {
      await put(BLOB_PATHNAME, JSON.stringify(defaultState), {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      })
      console.log("[v0] Initialized new Blob state file")
      memoryState = defaultState
      memoryStateFreshness = now
      return defaultState
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.warn("[v0] Blob init failed:", errorMsg)
    }
  }
  
  // Final fallback - always return valid state, never throw
  console.log("[v0] Returning default state (blob unavailable)")
  memoryState = defaultState
  memoryStateFreshness = now
  return defaultState
}

export async function saveBlobState(state: BlobState, retries = MAX_RETRIES): Promise<boolean> {
  if (!state.meta) {
    state.meta = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    }
  } else {
    state.meta.updatedAt = new Date().toISOString()
  }

  // Always update memory regardless of blob write outcome
  memoryState = state
  memoryStateFreshness = Date.now()

  // ── Cooldown gate: skip blob put() entirely while rate-limited ──
  if (await isBlobCooldown()) {
    console.log("[blob] cooldown active, skipping blob write")
    return false
  }

  // Try to save to Blob with retries
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await put(BLOB_PATHNAME, JSON.stringify(state), {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      })
      console.log("[v0] Saved state to Blob:", Object.keys(state.tokensByMint).length, "tokens")
      
      // Invalidate blob URL cache to force refresh on next read
      blobUrlCache = null
      
      return true
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      const isRateLimit = errorMsg.toLowerCase().includes("rate limit") || 
                          errorMsg.toLowerCase().includes("too many") ||
                          errorMsg.includes("429")
      
      console.warn(
        `[v0] Blob save attempt ${attempt + 1}/${retries + 1} failed:`,
        errorMsg,
        isRateLimit ? "(rate limited)" : ""
      )
      
      if (isRateLimit) {
        // Set cooldown immediately -- no more retries or blob writes for 10 min
        await setBlobCooldown()
        return false
      }
      
      // Retry with exponential backoff for non-rate-limit errors only
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)))
      }
    }
  }

  console.warn("[v0] Blob save failed after retries, state only in memory")
  return false
}

export async function addTrackedMint(mint: string, token: TokenScore): Promise<void> {
  const state = await getBlobState()

  if (!state.meta) {
    state.meta = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    }
  }
  if (!state.tokensByMint) {
    state.tokensByMint = {}
  }
  if (!state.trackedMints) {
    state.trackedMints = []
  }
  if (!state.history) {
    state.history = {}
  }
  if (!state.pins) {
    state.pins = []
  }
  if (!state.tags) {
    state.tags = {}
  }

  // Dedupe
  if (!state.trackedMints.includes(mint)) {
    state.trackedMints.push(mint)
  }

  // Add or update token
  state.tokensByMint[mint] = token

  // Initialize history if missing
  if (!state.history[mint]) {
    state.history[mint] = []
  }

  // Add history point
  state.history[mint].push({
    ts: Date.now(),
    score: token.totalScore,
    priceUsd: token.priceUsd,
    volume24h: token.volume24h,
    liquidityUsd: token.liquidity,
  })

  // Keep only last 200 points per token
  if (state.history[mint].length > 200) {
    state.history[mint] = state.history[mint].slice(-200)
  }

  await saveBlobState(state)
}

export async function removeTrackedMint(mint: string): Promise<void> {
  const state = await getBlobState()

  if (!state.meta) {
    state.meta = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    }
  }

  state.trackedMints = state.trackedMints.filter((m) => m !== mint)
  delete state.tokensByMint[mint]
  delete state.history[mint]
  delete state.tags[mint]
  state.pins = state.pins.filter((m) => m !== mint)
  state.meta.updatedAt = new Date().toISOString()

  await saveBlobState(state)
}

export async function togglePinMint(mint: string): Promise<boolean> {
  const state = await getBlobState()

  if (!state.meta) {
    state.meta = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    }
  }

  const isPinned = state.pins.includes(mint)
  if (isPinned) {
    state.pins = state.pins.filter((m) => m !== mint)
  } else {
    state.pins.push(mint)
  }
  state.meta.updatedAt = new Date().toISOString()

  await saveBlobState(state)
  return !isPinned
}

export async function setMintTag(mint: string, tag: string): Promise<void> {
  const state = await getBlobState()

  if (!state.meta) {
    state.meta = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    }
  }

  if (tag.trim()) {
    state.tags[mint] = tag.trim()
  } else {
    delete state.tags[mint]
  }
  state.meta.updatedAt = new Date().toISOString()

  await saveBlobState(state)
}

/**
 * Upsert eligible tokens into persistent archive
 * Called during ingestion to ensure tokens don't disappear from "All Tokens"
 */
export async function upsertArchiveTokens(tokens: TokenScore[], thresholdScore = 50): Promise<void> {
  try {
    const state = await getBlobState()

    if (!state.archiveByMint) {
      state.archiveByMint = {}
    }

    const now = Date.now()
    const eligibleTokens = tokens.filter(t => t.totalScore >= thresholdScore && t.address)

    for (const token of eligibleTokens) {
      const mint = token.address.toLowerCase()
      const existing = state.archiveByMint[mint]

      const archived: ArchivedToken = {
        address: token.address,
        symbol: token.symbol || "",
        name: token.name || "",
        lastScore: token.totalScore,
        maxScore: existing ? Math.max(existing.maxScore, token.totalScore) : token.totalScore,
        lastSeenAt: now,
        firstSeenAt: existing?.firstSeenAt || now,
        priceUsd: token.priceUsd,
        volume24h: token.volume24h,
        liquidity: token.liquidity,
        priceChange24h: token.priceChange24h,
        riskLabel: token.riskLabel,
        imageUrl: token.imageUrl,
        dexUrl: token.dexUrl || token.pairUrl,
      }

      state.archiveByMint[mint] = archived
    }

    // Eviction policy: Keep max 5000 tokens
    // Remove tokens with lastSeenAt > 30 days AND maxScore < 60
    const archiveArray = Object.entries(state.archiveByMint)
    if (archiveArray.length > 5000) {
      const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000)
      
      const toRemove = archiveArray
        .filter(([_, token]) => token.lastSeenAt < thirtyDaysAgo && token.maxScore < 60)
        .sort((a, b) => a[1].lastSeenAt - b[1].lastSeenAt) // Oldest first
        .slice(0, archiveArray.length - 5000) // Remove excess

      for (const [mint] of toRemove) {
        delete state.archiveByMint[mint]
      }

      if (toRemove.length > 0) {
        console.log(`[v0] Archive eviction: removed ${toRemove.length} stale tokens`)
      }
    }

    await saveBlobState(state)
    console.log(`[v0] Archive updated: ${eligibleTokens.length} tokens upserted, ${Object.keys(state.archiveByMint).length} total archived`)
  } catch (error) {
    console.warn("[v0] Archive upsert failed:", error)
    // Don't throw - archive failure should never break ingestion
  }
}
