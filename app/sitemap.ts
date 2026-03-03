import { MetadataRoute } from 'next'
import { getTrackedTokens } from '@/lib/get-tracked-tokens'
import { getTokenIndexCache } from '@/lib/intel/tokenIndex'

const TOKENS_PER_CHUNK = 500

/**
 * Sitemap Index - delegates to chunked sitemaps for scalability
 * Dynamically generates token sitemap chunks based on indexable token count
 * 
 * CRITICAL: Only counts tokens with score >= 75 (respects noindex rules)
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.solrad.io'
  
  // Get stable lastModified from token index cache
  let lastModified: Date
  try {
    const indexCache = await getTokenIndexCache()
    lastModified = indexCache?.generatedAt ? new Date(indexCache.generatedAt) : new Date()
  } catch {
    lastModified = new Date()
  }
  
  const entries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/sitemap-static.xml`,
      lastModified,
    },
  ]
  
  // Generate dynamic token sitemap chunks based on indexable token count
  try {
    const allTokens = await getTrackedTokens()
    
    // CRITICAL: Only count indexable tokens (score >= 75) for chunk calculation
    const indexableTokens = allTokens.filter((token) => token.totalScore >= 75)
    const numChunks = Math.ceil(indexableTokens.length / TOKENS_PER_CHUNK)
    
    console.log('[v0] Sitemap index generation:', {
      totalTokens: allTokens.length,
      indexableTokens: indexableTokens.length,
      numChunks,
    })
    
    for (let i = 0; i < numChunks; i++) {
      entries.push({
        url: `${baseUrl}/sitemap-tokens-${i}.xml`,
        lastModified,
      })
    }
  } catch (error) {
    console.error('[v0] Error generating sitemap index:', error)
    // Fallback to at least chunk 0
    entries.push({
      url: `${baseUrl}/sitemap-tokens-0.xml`,
      lastModified,
    })
  }
  
  return entries
}
