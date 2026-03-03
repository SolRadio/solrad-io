import "server-only"
import { SOLANA_NEWS_SOURCES, NEWS_FETCH_TIMEOUT } from "./newsSources"

export interface NewsItem {
  title: string
  url: string
  source: string
  publishedAt: number // Unix timestamp
}

/**
 * Parse RSS/XML to extract news items
 */
function parseRSS(xmlText: string, sourceName: string): NewsItem[] {
  const items: NewsItem[] = []
  
  try {
    // Simple regex-based extraction (no XML parser needed)
    const itemRegex = /<item>[\s\S]*?<\/item>/gi
    const itemMatches = xmlText.match(itemRegex) || []
    
    for (const itemXml of itemMatches.slice(0, 5)) {
      // Extract title
      const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i)
      const title = titleMatch ? titleMatch[1].trim() : ""
      
      // Extract link
      const linkMatch = itemXml.match(/<link>(.*?)<\/link>/i)
      const url = linkMatch ? linkMatch[1].trim() : ""
      
      // Extract pubDate
      const dateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/i)
      let publishedAt = Date.now()
      if (dateMatch) {
        try {
          publishedAt = new Date(dateMatch[1]).getTime()
        } catch {
          // Keep current time as fallback
        }
      }
      
      if (title && url) {
        items.push({ title, url, source: sourceName, publishedAt })
      }
    }
  } catch (err) {
    console.error(`[v0] RSS parse error for ${sourceName}:`, err)
  }
  
  return items
}

/**
 * Fetch news from a single source with timeout
 */
async function fetchFromSource(source: typeof SOLANA_NEWS_SOURCES[0]): Promise<NewsItem[]> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), NEWS_FETCH_TIMEOUT)
    
    const response = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SOLRAD-Intel/1.0',
      },
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      console.error(`[v0] News fetch failed for ${source.name}: ${response.status}`)
      return []
    }
    
    const text = await response.text()
    
    if (source.type === "rss") {
      return parseRSS(text, source.name)
    }
    
    return []
  } catch (err) {
    console.error(`[v0] News fetch error for ${source.name}:`, err)
    return []
  }
}

/**
 * Fetch latest Solana news from all sources
 * Returns top 1-2 items from last 24 hours
 */
export async function fetchLatestSolanaNews(): Promise<NewsItem[]> {
  console.log("[v0] Fetching Solana news from sources...")
  
  // Fetch from all sources in parallel
  const results = await Promise.all(
    SOLANA_NEWS_SOURCES.map(source => fetchFromSource(source))
  )
  
  // Flatten and dedupe by URL
  const allItems = results.flat()
  const uniqueItems = Array.from(
    new Map(allItems.map(item => [item.url, item])).values()
  )
  
  // Filter to last 24 hours
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
  const recentItems = uniqueItems.filter(item => item.publishedAt >= oneDayAgo)
  
  // Sort by recency
  const sorted = recentItems.sort((a, b) => b.publishedAt - a.publishedAt)
  
  console.log(`[v0] Found ${sorted.length} recent Solana news items`)
  
  // Return top 2
  return sorted.slice(0, 2)
}
