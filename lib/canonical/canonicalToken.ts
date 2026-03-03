/**
 * Canonical Token Record (CTR) System
 * 
 * Provides consistent token normalization across all SOLRAD pages.
 * This module ONLY normalizes data - it does NOT filter or change existing logic.
 */

export interface CanonicalToken {
  mint: string
  symbol: string
  name: string
  imageUrl?: string
  liquidity?: number
  marketCap?: number
  volume24h?: number
  priceUsd?: number
  priceChange24h?: number
  holders?: number
  firstSeenAt?: number
  lastUpdatedAt?: number
  source: string
  validMint?: boolean
}

/**
 * Normalize any token-like object to CanonicalToken
 * Safely extracts mint address from various token object shapes
 */
export function toCanonicalToken(input: any): CanonicalToken {
  if (!input) {
    return { mint: "", validMint: false }
  }

  // Extract mint address with validation
  const mintCandidate = 
    input.mint || 
    input.address || 
    input.baseToken?.address

  let mint: string
  let validMint: boolean

  if (!mintCandidate || typeof mintCandidate !== "string") {
    mint = ""
    validMint = false
  } else {
    mint = mintCandidate
    validMint = true
  }

  // Extract symbol and name
  const symbol = input.symbol || input.baseToken?.symbol
  const name = input.name || input.baseToken?.name

  // Extract score - check multiple possible field names
  const scoreNow = 
    input.score ?? 
    input.totalScore ?? 
    input.solradScore ?? 
    input.scoring?.total

  // Extract and normalize timestamps to numbers
  const firstSeenAtRaw = input.pairCreatedAt || input.createdAt || input.firstSeenAt
  const lastUpdatedAtRaw = input.lastUpdated || input.updatedAt || input.lastSeenAt

  const firstSeenAt = typeof firstSeenAtRaw === "number" ? firstSeenAtRaw : Number(firstSeenAtRaw)
  const lastUpdatedAt = typeof lastUpdatedAtRaw === "number" ? lastUpdatedAtRaw : Number(lastUpdatedAtRaw)

  // Extract signal score if present
  const scoreAtSignal = input.scoreAtSignal

  return {
    mint,
    symbol,
    name,
    scoreNow,
    firstSeenAt: Number.isNaN(firstSeenAt) ? undefined : firstSeenAt,
    lastUpdatedAt: Number.isNaN(lastUpdatedAt) ? undefined : lastUpdatedAt,
    scoreAtSignal,
    validMint,
  }
}

/**
 * Join canonical tokens with membership flags
 * Adds inPool, hasSignal, hasSnapshot flags based on mint sets
 */
export function joinCanonicalFlags(
  tokens: CanonicalToken[],
  opts: {
    poolMints?: string[]
    signalMints?: string[]
    snapshotMints?: string[]
  }
): CanonicalToken[] {
  // Sanitize: KV smembers can return non-string values (null, objects, undefined)
  const safeStrings = (arr: unknown[] | undefined): string[] =>
    (arr || []).filter((m): m is string => typeof m === "string" && m.length > 0)

  // Create lowercase lookup sets for case-insensitive matching
  const poolSet = new Set(
    safeStrings(opts.poolMints).map(m => m.toLowerCase())
  )
  const signalSet = new Set(
    safeStrings(opts.signalMints).map(m => m.toLowerCase())
  )
  const snapshotSet = new Set(
    safeStrings(opts.snapshotMints).map(m => m.toLowerCase())
  )

  return tokens.map(token => {
    // Safe lowercase conversion - handle empty mints from validMint=false tokens
    const tokenMintLower = (token.mint || "").toLowerCase()
    
    return {
      ...token,
      inPool: poolSet.has(tokenMintLower),
      hasSignal: signalSet.has(tokenMintLower),
      hasSnapshot: snapshotSet.has(tokenMintLower),
    }
  })
}
