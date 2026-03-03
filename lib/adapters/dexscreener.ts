import type { TokenData } from "../types"
import { storage } from "../storage"
import { normalizeMint } from "../solana/normalizeMint"
import { PublicKey } from "@solana/web3.js"
import { logger } from "../logger"
import { getServerEnv } from "../env"

/**
 * Strictly validate a Solana mint address using PublicKey
 * Returns the validated address string or null if invalid
 */
function validateMintAddress(address: string | undefined | null): string | null {
  if (!address || typeof address !== "string") {
    return null
  }
  
  // Normalize first (strip pump suffix, query params, etc.)
  const normalized = normalizeMint(address)
  if (!normalized) {
    return null
  }
  
  // Strict validation: must be a valid Solana PublicKey
  try {
    const pubkey = new PublicKey(normalized)
    // Verify it's on the ed25519 curve (real address, not random bytes)
    return pubkey.toBase58()
  } catch {
    return null
  }
}

const DS_CACHE_KEY = "solrad:source:dexscreener"
const DS_CACHE_TTL = 180 // 3 minutes for volatile price/volume/liquidity data

/**
 * Safe extractor: given any unknown response body, return an array of valid
 * Solana mint strings (>= 32 chars). Handles every shape the new-mints
 * endpoint has ever returned, plus direct arrays and object-of-objects.
 */
function extractMints(input: unknown): string[] {
  let raw: unknown[] = []

  if (Array.isArray(input)) {
    raw = input
  } else if (input && typeof input === "object") {
    const obj = input as Record<string, unknown>
    // Try known keys in priority order
    for (const key of ["mints", "discovered", "data"]) {
      if (Array.isArray(obj[key])) {
        raw = obj[key] as unknown[]
        break
      }
    }
    // data might be Array<{ mint?, address?, id? }>
    if (raw.length === 0 && Array.isArray(obj.data)) {
      raw = obj.data as unknown[]
    }
  }

  const strings: string[] = []
  for (const item of raw) {
    if (typeof item === "string") {
      strings.push(item)
    } else if (item && typeof item === "object") {
      const record = item as Record<string, unknown>
      const val = record.mint ?? record.address ?? record.id
      if (typeof val === "string") strings.push(val)
    }
  }

  // Filter: must look like a Solana address (>= 32 chars) + deduplicate
  const unique = [...new Set(strings.filter(s => s.length >= 32))]
  return unique
}

/**
 * Fetch wrapper that detects DexScreener 429 / "Too Many Requests" responses.
 * - Checks status code, content-type, and body text for rate limiting
 * - Retries up to MAX_RETRIES times with exponential backoff (250ms, 750ms)
 * - Returns null on confirmed 429 (caller should handle gracefully)
 */
const DS_MAX_RETRIES = 2
const DS_BACKOFF = [250, 750] // ms

async function dsFetchWithRetry(
  url: string,
  init?: RequestInit,
): Promise<{ response: Response; body: unknown } | null> {
  for (let attempt = 0; attempt <= DS_MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        ...init,
        headers: { "User-Agent": "SOLRAD/1.0", ...init?.headers },
      })

      // Explicit 429
      if (res.status === 429) {
        logger.warn(`[DexScreener] 429 on ${url} (attempt ${attempt + 1}/${DS_MAX_RETRIES + 1})`)
        if (attempt < DS_MAX_RETRIES) {
          await new Promise(r => setTimeout(r, DS_BACKOFF[attempt]))
          continue
        }
        return null
      }

      // Check content-type: if not JSON, likely an HTML rate-limit page
      const ct = res.headers.get("content-type") || ""
      if (!ct.includes("application/json") && !ct.includes("text/json")) {
        const snippet = (await res.text()).slice(0, 120)
        if (snippet.includes("Too Many") || snippet.includes("rate limit") || snippet.startsWith("<")) {
          logger.warn(`[DexScreener] Non-JSON 429 on ${url}: "${snippet}" (attempt ${attempt + 1})`)
          if (attempt < DS_MAX_RETRIES) {
            await new Promise(r => setTimeout(r, DS_BACKOFF[attempt]))
            continue
          }
          return null
        }
        // Non-JSON but not rate-limited (unexpected)
        logger.warn(`[DexScreener] Non-JSON response (${res.status}) on ${url}: "${snippet}"`)
        return null
      }

      // Parse JSON safely
      let body: unknown
      try {
        body = await res.json()
      } catch {
        // Body parsing failed - could be "Too Many Requests" text that slipped through
        logger.warn(`[DexScreener] JSON parse failed on ${url} (status=${res.status})`)
        if (attempt < DS_MAX_RETRIES) {
          await new Promise(r => setTimeout(r, DS_BACKOFF[attempt]))
          continue
        }
        return null
      }

      return { response: res, body }
    } catch (fetchError) {
      logger.warn(`[DexScreener] Fetch error on ${url} (attempt ${attempt + 1}):`, fetchError)
      if (attempt < DS_MAX_RETRIES) {
        await new Promise(r => setTimeout(r, DS_BACKOFF[attempt]))
        continue
      }
      return null
    }
  }
  return null
}

interface BoostCandidate {
  chainId: string
  tokenAddress: string
  amount: number
  totalAmount: number
  url: string
  sources: string[] // Track which boost endpoints found this
}

interface DexScreenerPair {
  chainId: string
  dexId: string
  url: string
  pairAddress: string
  baseToken: {
    address: string
    name: string
    symbol: string
  }
  priceUsd?: string
  priceChange?: {
    m5?: number
    h1?: number
    h6?: number
    h24?: number
  }
  volume?: {
    h24?: number
  }
  liquidity?: {
    usd?: number
  }
  txns?: {
    h24?: {
      buys?: number
      sells?: number
    }
  }
  fdv?: number
  marketCap?: number
  pairCreatedAt?: number
  info?: {
    imageUrl?: string
    websites?: Array<{ label?: string; url: string }>
    socials?: Array<{ type: string; url: string }>
  }
}

interface TokensResponse {
  schemaVersion: string
  pairs: DexScreenerPair[] | null
}

export async function fetchDexScreener(): Promise<TokenData[]> {
  try {
    // Check cache first
    const cached = await storage.get(DS_CACHE_KEY)
    if (cached) {
      // Handle both string and already-parsed formats
      if (Array.isArray(cached)) {
        logger.log("[v0] DexScreener: cache hit (array), count:", cached.length)
        return cached as TokenData[]
      }
      if (typeof cached === "string") {
        try {
          const parsed = JSON.parse(cached) as TokenData[]
          logger.log("[v0] DexScreener: cache hit (string), count:", parsed.length)
          return parsed
        } catch (parseError) {
          logger.warn("[v0] DexScreener: cache parse failed, ignoring cache:", parseError)
          // Fall through to fetch fresh data
        }
      }
      if (typeof cached === "object" && cached !== null) {
        // Attempt to treat as TokenData[] if it looks like an array-like payload
        logger.log("[v0] DexScreener: cache hit (object), treating as array")
        return cached as TokenData[]
      }
    }

    logger.log("[v0] DexScreener: fetching token boosts...")

    // A) Candidate discovery - fetch from both boost endpoints
    const candidates = new Map<string, BoostCandidate>()

    // Fetch top boosts (with 429 retry)
    try {
      const topResult = await dsFetchWithRetry("https://api.dexscreener.com/token-boosts/top/v1")
      
      if (!topResult) {
        logger.warn("[v0] DexScreener: top boosts 429'd, checking cache")
        const cachedFallback = await storage.get(DS_CACHE_KEY)
        if (cachedFallback) {
          logger.log("[v0] DexScreener: Returning cached data due to 429")
          return Array.isArray(cachedFallback) ? cachedFallback as TokenData[] : []
        }
        return []
      }
      
      if (topResult.response.ok) {
        const topBoosts = topResult.body
        if (Array.isArray(topBoosts)) {
          for (const boost of topBoosts) {
            if (boost.chainId === "solana" && boost.tokenAddress) {
              const addr = boost.tokenAddress.toLowerCase()
              if (!candidates.has(addr)) {
                candidates.set(addr, {
                  chainId: boost.chainId,
                  tokenAddress: boost.tokenAddress,
                  amount: boost.amount || 0,
                  totalAmount: boost.totalAmount || 0,
                  url: boost.url || "",
                  sources: ["BOOST_TOP"],
                })
              } else {
                candidates.get(addr)!.sources.push("BOOST_TOP")
              }
            }
          }
        }
      }
    } catch (error) {
      logger.warn("[v0] DexScreener top boosts failed:", error)
    }

    // Fetch trending pairs from DexScreener (with 429 retry)
    try {
      const trendingResult = await dsFetchWithRetry("https://api.dexscreener.com/latest/dex/search?q=solana")
      
      if (!trendingResult) {
        logger.warn("[v0] DexScreener: trending 429'd, checking cache")
        const cachedFallback = await storage.get(DS_CACHE_KEY)
        if (cachedFallback) {
          logger.log("[v0] DexScreener: Returning cached data due to 429")
          return Array.isArray(cachedFallback) ? cachedFallback as TokenData[] : []
        }
        return []
      }
      
      if (trendingResult.response.ok) {
        const trendingData = trendingResult.body as { pairs?: DexScreenerPair[] }
        if (trendingData.pairs && Array.isArray(trendingData.pairs)) {
          for (const pair of trendingData.pairs.slice(0, 100)) { // Take top 100 trending
            if (pair.chainId === "solana" && pair.baseToken?.address) {
              const addr = pair.baseToken.address.toLowerCase()
              if (!candidates.has(addr)) {
                candidates.set(addr, {
                  chainId: pair.chainId,
                  tokenAddress: pair.baseToken.address,
                  description: pair.info?.header || "",
                  totalAmount: 0,
                  url: pair.url || "",
                  sources: ["TRENDING"],
                })
              } else {
                candidates.get(addr)!.sources.push("TRENDING")
              }
            }
          }
          logger.log(`[v0] DexScreener: Added ${trendingData.pairs.length} trending pairs`)
        }
      }
    } catch (error) {
      logger.warn("[v0] DexScreener trending pairs failed:", error)
    }

    // Fetch pump.fun trending pairs (with 429 retry)
    try {
      const pumpResult = await dsFetchWithRetry("https://api.dexscreener.com/latest/dex/search?q=pump")
      if (pumpResult?.response.ok) {
        const pumpData = pumpResult.body as { pairs?: DexScreenerPair[] }
        if (pumpData.pairs && Array.isArray(pumpData.pairs)) {
          for (const pair of pumpData.pairs.slice(0, 100)) {
            if (pair.chainId === "solana" && pair.baseToken?.address) {
              const addr = pair.baseToken.address.toLowerCase()
              if (!candidates.has(addr)) {
                candidates.set(addr, {
                  chainId: pair.chainId,
                  tokenAddress: pair.baseToken.address,
                  amount: 0,
                  totalAmount: 0,
                  url: pair.url || "",
                  sources: ["PUMP_SEARCH"],
                })
              } else {
                candidates.get(addr)!.sources.push("PUMP_SEARCH")
              }
            }
          }
          logger.log(`[v0] DexScreener: Added pump.fun search pairs (${pumpData.pairs.length})`)
        }
      }
    } catch (error) {
      logger.warn("[v0] DexScreener pump search failed:", error)
    }

    // Fetch H6 trending pairs (with 429 retry)
    try {
      const h6Result = await dsFetchWithRetry("https://api.dexscreener.com/latest/dex/search?q=solana&rankBy=trendingScoreH6")
      if (h6Result?.response.ok) {
        const h6Data = h6Result.body as { pairs?: DexScreenerPair[] }
        if (h6Data.pairs && Array.isArray(h6Data.pairs)) {
          for (const pair of h6Data.pairs.slice(0, 100)) {
            if (pair.chainId === "solana" && pair.baseToken?.address) {
              const addr = pair.baseToken.address.toLowerCase()
              if (!candidates.has(addr)) {
                candidates.set(addr, {
                  chainId: pair.chainId,
                  tokenAddress: pair.baseToken.address,
                  amount: 0,
                  totalAmount: 0,
                  url: pair.url || "",
                  sources: ["H6_TRENDING"],
                })
              } else {
                candidates.get(addr)!.sources.push("H6_TRENDING")
              }
            }
          }
          logger.log(`[v0] DexScreener: Added H6 trending pairs (${h6Data.pairs.length})`)
        }
      }
    } catch (error) {
      logger.warn("[v0] DexScreener H6 trending failed:", error)
    }

    // Fetch latest boosts (with 429 retry)
    try {
      const latestResult = await dsFetchWithRetry("https://api.dexscreener.com/token-boosts/latest/v1")
      
      if (!latestResult) {
        logger.warn("[v0] DexScreener: latest boosts 429'd, checking cache")
        const cachedFallback = await storage.get(DS_CACHE_KEY)
        if (cachedFallback) {
          logger.log("[v0] DexScreener: Returning cached data due to 429")
          return Array.isArray(cachedFallback) ? cachedFallback as TokenData[] : []
        }
        return []
      }
      
      if (latestResult.response.ok) {
        const latestBoosts = latestResult.body
        if (Array.isArray(latestBoosts)) {
          for (const boost of latestBoosts) {
            if (boost.chainId === "solana" && boost.tokenAddress) {
              const addr = boost.tokenAddress.toLowerCase()
              if (!candidates.has(addr)) {
                candidates.set(addr, {
                  chainId: boost.chainId,
                  tokenAddress: boost.tokenAddress,
                  amount: boost.amount || 0,
                  totalAmount: boost.totalAmount || 0,
                  url: boost.url || "",
                  sources: ["BOOST_LATEST"],
                })
              } else {
                candidates.get(addr)!.sources.push("BOOST_LATEST")
              }
            }
          }
        }
      }
    } catch (error) {
      logger.warn("[v0] DexScreener latest boosts failed:", error)
    }

    let candidateAddresses = Array.from(candidates.values()).map((c) => c.tokenAddress)
    logger.log(`[v0] DexScreener: found ${candidateAddresses.length} Solana token candidates from boosts`)

    // FALLBACK DISCOVERY: If we have too few candidates, supplement with new-mints
    const MIN_CANDIDATES = 80
    if (candidateAddresses.length < MIN_CANDIDATES) {
      logger.log(`[v0] DexScreener: Boost discovery returned < ${MIN_CANDIDATES} tokens (${candidateAddresses.length}). Activating fallback discovery...`)
      
      try {
        // Derive base URL: VERCEL_URL > NEXT_PUBLIC_SITE_URL > hardcoded production domain
        const fallbackBaseUrl = process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : getServerEnv('NEXT_PUBLIC_SITE_URL') || "https://solrad.io"

        // Build the final URL and hard-block any localhost/127.0.0.1 fetches
        const finalUrl = `${fallbackBaseUrl}/api/ingest/new-mints?limit=150&minutesBack=120`

        if (/localhost|127\.0\.0\.1/i.test(finalUrl)) {
          console.warn("[DexScreener] Blocked localhost fetch", {
            finalUrl,
            vercelEnv: process.env.VERCEL_ENV,
            vercelUrl: process.env.VERCEL_URL,
            siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
            baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
          })
          // Skip fallback entirely -- do NOT fetch localhost
        } else {
        const adminPassword = getServerEnv('ADMIN_PASSWORD') || getServerEnv('OPS_PASSWORD')

        const newMintsRes = await fetch(finalUrl, {
          method: "POST",
          headers: {
            "x-admin-password": adminPassword || "",
          },
        })
        
        if (newMintsRes.ok) {
          const newMintsBody: unknown = await newMintsRes.json()
          const fallbackMints = extractMints(newMintsBody)

          if (fallbackMints.length === 0) {
            logger.warn("[DexScreener] Fallback discovery: no valid mints parsed (skipping)")
            // Continue with boost-only candidates -- do NOT inject empty arrays
          } else {
            logger.log(
              `[DexScreener] Fallback discovery: parsed ${fallbackMints.length} mints` +
              ` (sample: ${fallbackMints.slice(0, 3).join(", ")})`
            )

            // Dedupe against existing candidates and append
            const existingAddrs = new Set(candidateAddresses.map(a => a.toLowerCase()))
            const newAddrs = fallbackMints.filter(m => !existingAddrs.has(m.toLowerCase()))

            candidateAddresses = [...candidateAddresses, ...newAddrs]
            logger.log(`[DexScreener] After fallback, total candidates: ${candidateAddresses.length}`)
          }
        } else {
          logger.warn(`[DexScreener] Fallback new-mints responded ${newMintsRes.status}`)
        }
        } // end else (not localhost)
      } catch (fallbackError) {
        const resolvedUrl = process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : getServerEnv('NEXT_PUBLIC_SITE_URL') || "https://solrad.io"
        const finalUrl = `${resolvedUrl}/api/ingest/new-mints?limit=150&minutesBack=120`
        console.warn("[DexScreener] Fallback discovery failed", {
          finalUrl,
          error: String(fallbackError),
        })
        // Continue with whatever candidates we have
      }
    }

    if (candidateAddresses.length === 0) {
      logger.warn("[v0] DexScreener: No candidates after boost + fallback discovery")
      return []
    }

    // B) Batch enrichment - fetch market data in chunks of 30
    const tokens: TokenData[] = []
    const BATCH_SIZE = 30

    for (let i = 0; i < candidateAddresses.length; i += BATCH_SIZE) {
      const batch = candidateAddresses.slice(i, i + BATCH_SIZE)
      const addressParam = batch.join(",")

      try {
        const result = await dsFetchWithRetry(`https://api.dexscreener.com/latest/dex/tokens/${addressParam}`)
        
        if (!result) {
          logger.warn(`[DexScreener] Batch ${i / BATCH_SIZE} skipped (429 / non-JSON)`)
          continue
        }

        if (result.response.ok) {
          const enrichData = result.body as TokensResponse

          if (enrichData.pairs && Array.isArray(enrichData.pairs)) {
            // Group pairs by token address
            const pairsByToken = new Map<string, DexScreenerPair[]>()

            for (const pair of enrichData.pairs) {
              if (pair.chainId !== "solana") continue

              const addr = pair.baseToken.address.toLowerCase()
              if (!pairsByToken.has(addr)) {
                pairsByToken.set(addr, [])
              }
              pairsByToken.get(addr)!.push(pair)
            }

            // For each token, pick the pair with highest liquidity
            for (const [addr, pairs] of pairsByToken.entries()) {
              const bestPair = pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0]

              const candidate = candidates.get(addr)
              if (!candidate) continue

              // STRICT VALIDATION: baseToken.address MUST exist and be valid
              const rawBaseTokenAddress = bestPair.baseToken?.address
              if (!rawBaseTokenAddress) {
                logger.warn(`[v0] DexScreener: SKIPPING - missing baseToken.address for pair ${bestPair.pairAddress}`)
                continue
              }

              // Validate using PublicKey - this is the SPL token mint address
              const validatedMint = validateMintAddress(rawBaseTokenAddress)
              if (!validatedMint) {
                logger.warn(`[v0] DexScreener: SKIPPING - invalid mint address: ${rawBaseTokenAddress}`)
                continue
              }

              // Final safety check: ensure we have a real mint, not a wallet/pair address
              if (validatedMint === bestPair.pairAddress) {
                logger.warn(`[v0] DexScreener: SKIPPING - mint equals pairAddress (likely wrong): ${validatedMint}`)
                continue
              }

              tokens.push({
                address: validatedMint, // STRICTLY VALIDATED SPL token mint address (case-preserved)
                dexTokenAddress: rawBaseTokenAddress, // Raw DexScreener baseToken.address (before normalization)
                symbol: bestPair.baseToken.symbol || "UNKNOWN",
                name: bestPair.baseToken.name || "Unknown Token",
                chain: "solana",
                priceUsd: Number.parseFloat(bestPair.priceUsd || "0"),
                priceChange5m: bestPair.priceChange?.m5,
                priceChange1h: bestPair.priceChange?.h1,
                priceChange6h: bestPair.priceChange?.h6,
                priceChange24h: bestPair.priceChange?.h24 || 0,
                volume24h: bestPair.volume?.h24 || 0,
                liquidity: bestPair.liquidity?.usd || 0,
                fdv: bestPair.fdv,
                marketCap: bestPair.marketCap,
                txns24h: (bestPair.txns?.h24?.buys || 0) + (bestPair.txns?.h24?.sells || 0),
                pairCreatedAt: bestPair.pairCreatedAt,
                dexId: bestPair.dexId,
                pairUrl: bestPair.url,
                pairAddress: bestPair.pairAddress,
                imageUrl: bestPair.info?.imageUrl,
                boostSources: candidate.sources,
                boostAmount: candidate.amount,
                boostTotalAmount: candidate.totalAmount,
                source: "dexscreener",
                sourceUpdatedAt: Date.now(),
                dataFetchedAt: Date.now(),
              })
            }
          }
        }

        // Rate limit: small delay between batches
        if (i + BATCH_SIZE < candidateAddresses.length) {
          await new Promise((resolve) => setTimeout(resolve, 200))
        }
      } catch (error) {
        logger.warn(`[v0] DexScreener batch enrichment failed for batch ${i / BATCH_SIZE}:`, error)
      }
    }

    logger.log(`[v0] DexScreener: enriched ${tokens.length} tokens with market data`)

    // C) Token profiles enrichment - fill missing imageUrls
    try {
      const profilesResult = await dsFetchWithRetry("https://api.dexscreener.com/token-profiles/latest/v1")
      if (profilesResult?.response.ok) {
        const profiles = profilesResult.body
        const list = Array.isArray(profiles) ? profiles : ((profiles as Record<string, unknown>)?.data || []) as Array<Record<string, unknown>>
        const profileMap = new Map<string, string>()
        for (const p of (list as Array<Record<string, unknown>>).slice(0, 100)) {
          if (p.chainId !== "solana") continue
          const addr = ((p.tokenAddress || p.address) as string)?.toLowerCase()
          const icon = (p.icon || p.header) as string | undefined
          if (addr && icon) profileMap.set(addr, icon)
        }
        let enriched = 0
        for (const token of tokens) {
          if (!token.imageUrl) {
            const icon = profileMap.get(token.address.toLowerCase())
            if (icon) { token.imageUrl = icon; enriched++ }
          }
        }
        if (enriched > 0) logger.log(`[v0] DexScreener: token-profiles enriched ${enriched} imageUrls`)
      }
    } catch (error) {
      logger.warn("[v0] DexScreener token-profiles enrichment failed:", error)
    }

    // Cache the results (store native object, not stringified)
    await storage.set(DS_CACHE_KEY, tokens, { ex: DS_CACHE_TTL })
    logger.log("[v0] DexScreener: cached", tokens.length, "tokens")

    return tokens
  } catch (error) {
    logger.error("[v0] DexScreener fetch error:", error)
    return []
  }
}
