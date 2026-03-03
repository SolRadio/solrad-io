import { NextResponse } from "next/server"
import { storage } from "@/lib/storage"
import { isValidSolanaAddress } from "@/lib/utils/solana"

// Helius metadata enrichment endpoint
// Provides on-chain metadata + authorities
// Cached for 48 hours per mint to reduce API usage

const ENRICH_CACHE_PREFIX = "token:enrich:"
const ENRICH_CACHE_TTL = 172800 // 48 hours (increased from 6 hours)

interface HeliusMetadata {
  onChainMetadata?: {
    metadata?: {
      data?: {
        name?: string
        symbol?: string
        uri?: string
      }
    }
  }
  onChainAccountInfo?: {
    accountInfo?: {
      data?: {
        parsed?: {
          info?: {
            mintAuthority?: string | null
            freezeAuthority?: string | null
            supply?: string
          }
        }
      }
    }
  }
  offChainMetadata?: {
    metadata?: {
      name?: string
      symbol?: string
      image?: string
      description?: string
      external_url?: string
      attributes?: Array<{ trait_type?: string; value?: string }>
    }
    uri?: string
  }
  legacyMetadata?: {
    name?: string
    symbol?: string
    uri?: string
    image?: string
    description?: string
  }
}

interface TokenEnrichmentData {
  mint: string
  metadata: {
    image?: string
    description?: string
    website?: string
    twitter?: string
    telegram?: string
  }
  authorities: {
    mintAuthorityRevoked: boolean
    freezeAuthorityRevoked: boolean
    mintAuthority?: string | null
    freezeAuthority?: string | null
  }
  cached: boolean
  cacheAge?: number
}

async function fetchHeliusMetadata(mint: string): Promise<HeliusMetadata | null> {
  const apiKey = process.env.HELIUS_API_KEY
  if (!apiKey) {
    console.warn("[v0] HELIUS_API_KEY not configured")
    return null
  }

  try {
    const res = await fetch(`https://api.helius.xyz/v0/token-metadata?api-key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mintAccounts: [mint],
        includeOffChain: true,
        disableCache: false,
      }),
    })

    if (!res.ok) {
      console.warn(`[v0] Helius metadata fetch failed: ${res.status} ${res.statusText}`)
      return null
    }

    const data = (await res.json()) as HeliusMetadata[]
    return data[0] || null
  } catch (error) {
    console.warn(`[v0] Helius metadata error for ${mint}:`, error instanceof Error ? error.message : error)
    return null
  }
}

function extractSocialLinks(metadata: HeliusMetadata): {
  website?: string
  twitter?: string
  telegram?: string
} {
  const offChain = metadata.offChainMetadata?.metadata
  const legacy = metadata.legacyMetadata

  // Try external_url first (often the website)
  const website = offChain?.external_url || undefined

  // Look for social links in attributes or extensions
  const attributes = offChain?.attributes || []
  let twitter: string | undefined
  let telegram: string | undefined

  for (const attr of attributes) {
    const trait = attr.trait_type?.toLowerCase() || ""
    const value = attr.value

    if (trait.includes("twitter") && value) {
      twitter = value.toString().startsWith("http")
        ? value.toString()
        : `https://twitter.com/${value.toString().replace(/^@/, "")}`
    }

    if (trait.includes("telegram") && value) {
      telegram = value.toString().startsWith("http") ? value.toString() : `https://t.me/${value.toString().replace(/^@/, "")}`
    }
  }

  return { website, twitter, telegram }
}

export async function GET(request: Request, { params }: { params: Promise<{ mint: string }> }) {
  const { mint } = await params

  // Validate mint address
  if (!isValidSolanaAddress(mint)) {
    return NextResponse.json({ error: "Invalid mint address" }, { status: 400 })
  }

  try {
    // Check cache first
    const cacheKey = `${ENRICH_CACHE_PREFIX}${mint}`
    const cached = await storage.get<TokenEnrichmentData>(cacheKey)

    if (cached && typeof cached === "object") {
      const cacheAge = Math.floor((Date.now() - (cached as any).cachedAt) / 1000)
      return NextResponse.json({
        ...cached,
        cached: true,
        cacheAge,
      })
    }

    // Fetch fresh data from Helius
    const heliusData = await fetchHeliusMetadata(mint)

    if (!heliusData) {
      return NextResponse.json(
        {
          error: "Unable to fetch metadata from Helius",
        },
        { status: 503 },
      )
    }

    // Extract metadata
    const offChain = heliusData.offChainMetadata?.metadata
    const legacy = heliusData.legacyMetadata
    const onChainInfo = heliusData.onChainAccountInfo?.accountInfo?.data?.parsed?.info

    const image = offChain?.image || legacy?.image
    const description = offChain?.description || legacy?.description
    const socials = extractSocialLinks(heliusData)

    // Extract authorities
    const mintAuthority = onChainInfo?.mintAuthority !== undefined ? onChainInfo.mintAuthority : undefined
    const freezeAuthority = onChainInfo?.freezeAuthority !== undefined ? onChainInfo.freezeAuthority : undefined

    const enrichmentData: TokenEnrichmentData = {
      mint,
      metadata: {
        image,
        description,
        website: socials.website,
        twitter: socials.twitter,
        telegram: socials.telegram,
      },
      authorities: {
        mintAuthorityRevoked: mintAuthority === null,
        freezeAuthorityRevoked: freezeAuthority === null,
        mintAuthority,
        freezeAuthority,
      },
      cached: false,
    }

    // Cache the result
    await storage.set(
      cacheKey,
      {
        ...enrichmentData,
        cachedAt: Date.now(),
      },
      { ex: ENRICH_CACHE_TTL },
    )

    return NextResponse.json(enrichmentData)
  } catch (error) {
    console.error(`[v0] Token enrichment error for ${mint}:`, error)
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
