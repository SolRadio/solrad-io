import { NextResponse } from 'next/server'
import { getTrackedTokens } from '@/lib/get-tracked-tokens'
import { getTokenIndexCache } from '@/lib/intel/tokenIndex'

const TOKENS_PER_CHUNK = 500
const CHUNK_INDEX = 0

export async function GET() {
  const baseUrl = 'https://www.solrad.io'

  try {
    // Get token index cache for timestamp
    const indexCache = await getTokenIndexCache()
    const indexTimestamp = indexCache?.generatedAt ? new Date(indexCache.generatedAt).toISOString() : new Date().toISOString()

    // Get all tracked tokens
    const allTokens = await getTrackedTokens()
    
    // Filter to high-quality tokens only (score >= 75) for sitemap inclusion
    const eligibleTokens = allTokens.filter(token => {
      if (typeof token === 'string') return false // Exclude string-only tokens (unknown score)
      return (token.totalScore ?? 0) >= 75
    })
    
    // Get this chunk's tokens (0-499)
    const startIdx = CHUNK_INDEX * TOKENS_PER_CHUNK
    const endIdx = startIdx + TOKENS_PER_CHUNK
    const tokens = eligibleTokens.slice(startIdx, endIdx)

    const urls = tokens
      .map((token) => {
        const tokenMint = typeof token === 'string' ? token : (token.address || token.mint || '')
        
        // Skip if invalid mint
        if (!tokenMint || typeof tokenMint !== 'string' || tokenMint.length < 32) {
          return ''
        }
        
        const slug = typeof token === 'string' ? 'token' : (token.symbol?.toLowerCase() || 'token')
        
        // Use token's updatedAt if available, fallback to index generatedAt
        const lastMod = (typeof token !== 'string' && token.lastUpdate) 
          ? new Date(token.lastUpdate).toISOString() 
          : indexTimestamp

        return `  <url>
    <loc>${baseUrl}/token/${tokenMint}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/insights/why-is-${slug}-trending</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/insights/is-${slug}-safe</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/insights/${slug}-wallet-behavior-analysis</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`
      })
      .filter(Boolean)
      .join('\n')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('[v0] Error generating token sitemap chunk 0:', error)
    
    // Return empty sitemap on error
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
      },
    })
  }
}
