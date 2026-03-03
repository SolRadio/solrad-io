import { MetadataRoute } from 'next'
import { getTrackedTokens } from '@/lib/get-tracked-tokens'
import { normalizeMint } from '@/lib/solana/normalizeMint'

const TOKENS_PER_CHUNK = 500

/**
 * Dynamic token sitemap chunks
 * Only includes tokens with score >= 75 (indexable per SEO rules)
 * 
 * Routes:
 * - /sitemap-tokens-0.xml (tokens 0-499)
 * - /sitemap-tokens-1.xml (tokens 500-999)
 * - etc.
 */
export async function generateStaticParams() {
  try {
    const allTokens = await getTrackedTokens()
    // Filter to only indexable tokens (score >= 75)
    const indexableTokens = allTokens.filter((token) => token.totalScore >= 75)
    const numChunks = Math.ceil(indexableTokens.length / TOKENS_PER_CHUNK)
    
    console.log('[v0] Token sitemap chunks:', {
      totalTokens: allTokens.length,
      indexableTokens: indexableTokens.length,
      numChunks,
    })
    
    return Array.from({ length: Math.max(1, numChunks) }, (_, i) => ({
      chunk: String(i),
    }))
  } catch (error) {
    console.error('[v0] Error generating sitemap params:', error)
    // Fallback to at least chunk 0
    return [{ chunk: '0' }]
  }
}

export default async function sitemapTokensChunk({
  params,
}: {
  params: { chunk: string }
}): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.solrad.io'
  const chunkIndex = Number.parseInt(params.chunk, 10)
  
  if (Number.isNaN(chunkIndex) || chunkIndex < 0) {
    console.error('[v0] Invalid chunk index:', params.chunk)
    return []
  }
  
  try {
    // Get all tracked tokens
    const allTokens = await getTrackedTokens()
    
    // CRITICAL: Only include tokens with score >= 75 (respects noindex rules)
    const indexableTokens = allTokens.filter((token) => token.totalScore >= 75)
    
    // Calculate chunk boundaries
    const startIndex = chunkIndex * TOKENS_PER_CHUNK
    const endIndex = startIndex + TOKENS_PER_CHUNK
    const tokensInChunk = indexableTokens.slice(startIndex, endIndex)
    
    console.log('[v0] Generating sitemap chunk', chunkIndex, {
      totalIndexable: indexableTokens.length,
      chunkSize: tokensInChunk.length,
      startIndex,
      endIndex,
    })
    
    // Generate sitemap entries with canonical URLs
    const entries: MetadataRoute.Sitemap = tokensInChunk.map((token) => {
      // Use normalizeMint to ensure canonical mint format
      const canonicalMint = normalizeMint(token.address)
      
      return {
        url: `${baseUrl}/token/${canonicalMint}`,
        lastModified: new Date(),
        changeFrequency: 'hourly' as const,
        priority: 0.6,
      }
    })
    
    return entries
  } catch (error) {
    console.error('[v0] Error generating token sitemap chunk:', error)
    return []
  }
}

// Enable static generation at build time
export const dynamic = 'force-static'
export const revalidate = 3600 // Revalidate every hour
