import { NextResponse } from "next/server"

/**
 * /api/news/solana
 * 
 * Multi-source RSS/Atom feed aggregator for Solana news.
 * Returns real headlines when available, fallback messages on failure.
 * NEVER throws - always returns HTTP 200.
 */

interface NewsItem {
  title: string
  url: string
  source: string
  publishedAt: string
}

interface NewsResponse {
  items: NewsItem[]
  source: string
  updatedAt: number
  stale?: boolean
  error?: string
}

interface FetchResult {
  ok: boolean
  reason?: string
  status?: number
  contentType?: string
  text?: string
}

// Working RSS/Atom feeds for Solana news (solana.com/rss.xml removed - it 404s)
const RSS_FEEDS = [
  "https://cointelegraph.com/rss/tag/solana", // Cointelegraph Solana tag
  "https://decrypt.co/feed?tag=solana", // Decrypt Solana tag
  "https://thedefiant.io/api/feed", // The Defiant (covers Solana)
]

// Fallback messages when all feeds fail
const FALLBACK_MESSAGES = [
  "SOLRAD: read-only intel - no wallet connection required",
  "Top Performers refresh ~ every 10 minutes",
  "Watching: volume surges - liquidity rotation - smart flow",
  "Badge signals: Safe - Treasure - Smart Flow - Held 1H/6H/24H",
  "Tip: Sort by Score, then check 'Why SOLRAD Flagged This'",
  "Risk labels are heuristics - always DYOR",
  "New: Gem Finder mode filters for low-cap high-potential tokens",
  "Pro tip: Tap any token row to see full details and charts",
]

/**
 * Safe fetch - NEVER throws, returns structured result object
 */
async function safeFetch(url: string, timeout = 8000): Promise<FetchResult> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 
        "User-Agent": "Mozilla/5.0 (compatible; SOLRAD/1.0)",
        "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml",
      },
      next: { revalidate: 600 }, // Cache for 10 minutes
    })

    clearTimeout(timeoutId)

    const status = res.status
    const contentType = res.headers.get("content-type") || ""

    // Rule 1: Status must be 200
    if (status !== 200) {
      return { ok: false, reason: "non_200_status", status, contentType }
    }

    // Rule 2: Content-type must be XML/RSS/Atom related
    const isValidContentType = 
      contentType.includes("xml") || 
      contentType.includes("rss") || 
      contentType.includes("atom") ||
      contentType.includes("text/xml") ||
      contentType.includes("application/xml")
    
    if (!isValidContentType && contentType.length > 0) {
      return { ok: false, reason: "invalid_content_type", status, contentType }
    }

    const body = await res.text()
    
    // Rule 3: Body must NOT contain HTML markers
    const bodyLower = body.toLowerCase()
    const hasHtmlMarkers = 
      bodyLower.includes("<html") ||
      bodyLower.includes("__next_error__") ||
      bodyLower.includes("<title>404")
    
    if (hasHtmlMarkers) {
      return { ok: false, reason: "html_detected", status, contentType }
    }

    // Rule 4: Body must have valid RSS/Atom markers
    const hasValidFeedMarker = 
      body.includes("<rss") || 
      body.includes("<feed") || 
      body.includes("<channel")
    
    if (!hasValidFeedMarker) {
      return { ok: false, reason: "no_feed_markers", status, contentType }
    }

    return { ok: true, text: body, status, contentType }
  } catch (error) {
    // Never throw - return structured failure
    return { 
      ok: false, 
      reason: error instanceof Error ? error.message : "unknown_error",
      status: 0,
    }
  }
}

// Parse RSS and Atom feeds
function parseFeed(xml: string, source: string): NewsItem[] {
  const items: NewsItem[] = []
  
  // Try RSS format: <item>
  const rssItemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi
  let match: RegExpExecArray | null
  
  while ((match = rssItemRegex.exec(xml)) !== null && items.length < 10) {
    const content = match[1]
    const item = parseRSSItem(content, source)
    if (item) items.push(item)
  }
  
  // Try Atom format: <entry>
  if (items.length === 0) {
    const atomEntryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/gi
    while ((match = atomEntryRegex.exec(xml)) !== null && items.length < 10) {
      const content = match[1]
      const item = parseAtomEntry(content, source)
      if (item) items.push(item)
    }
  }
  
  return items
}

// Parse RSS <item>
function parseRSSItem(content: string, source: string): NewsItem | null {
  const titleMatch = /<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i.exec(content)
  const linkMatch = /<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i.exec(content)
  const pubDateMatch = /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i.exec(content)
  
  const title = titleMatch?.[1]?.trim().replace(/<!\[CDATA\[|\]\]>|<[^>]+>/g, "").trim()
  if (!title) return null
  
  const url = linkMatch?.[1]?.trim().replace(/<!\[CDATA\[|\]\]>/g, "").trim() || "https://www.solrad.io"
  const publishedAt = pubDateMatch?.[1]?.trim() || new Date().toISOString()
  
  return { title, url, source, publishedAt }
}

// Parse Atom <entry>
function parseAtomEntry(content: string, source: string): NewsItem | null {
  const titleMatch = /<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i.exec(content)
  const linkHrefMatch = /<link[^>]*href=["']([^"']+)["']/i.exec(content)
  const updatedMatch = /<updated[^>]*>([\s\S]*?)<\/updated>/i.exec(content)
  
  const title = titleMatch?.[1]?.trim().replace(/<!\[CDATA\[|\]\]>|<[^>]+>/g, "").trim()
  if (!title) return null
  
  const url = linkHrefMatch?.[1]?.trim() || "https://www.solrad.io"
  const publishedAt = updatedMatch?.[1]?.trim() || new Date().toISOString()
  
  return { title, url, source, publishedAt }
}

export async function GET() {
  let allItems: NewsItem[] = []

  // Try each RSS feed - continue on failures
  for (const feedUrl of RSS_FEEDS) {
    const result = await safeFetch(feedUrl)
    
    // Only process if fetch succeeded and we got valid XML
    if (result.ok && result.text) {
      try {
        const sourceName = new URL(feedUrl).hostname.replace("www.", "")
        const items = parseFeed(result.text, sourceName)
        if (items.length > 0) {
          allItems.push(...items)
        }
      } catch {
        // Parse failure - continue to next feed
        continue
      }
    }
    // If result.ok is false, continue to next feed
  }

  // If we got real news, return it (HTTP 200)
  if (allItems.length > 0) {
    const response: NewsResponse = {
      items: allItems.slice(0, 15), // Limit to 15 items
      source: "aggregated",
      updatedAt: Date.now(),
    }
    
    const res = NextResponse.json(response)
    res.headers.set("Cache-Control", "s-maxage=600, stale-while-revalidate=86400")
    return res
  }

  // All feeds failed - return fallback messages (HTTP 200, stale: true)
  const fallbackItems: NewsItem[] = FALLBACK_MESSAGES.map(text => ({
    title: text,
    url: "https://www.solrad.io",
    source: "SOLRAD",
    publishedAt: new Date().toISOString(),
  }))

  const response: NewsResponse = {
    items: fallbackItems,
    source: "fallback",
    updatedAt: Date.now(),
    stale: true,
    error: "feed_unavailable",
  }

  const res = NextResponse.json(response, { status: 200 })
  res.headers.set("Cache-Control", "s-maxage=600, stale-while-revalidate=86400")
  return res
}
