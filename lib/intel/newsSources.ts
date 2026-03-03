import "server-only"

/**
 * Whitelisted Solana-related news sources
 * Simple public feeds - no scraping
 */

export interface NewsSource {
  name: string
  url: string
  type: "rss" | "json"
}

/**
 * Curated list of real Solana news sources
 */
export const SOLANA_NEWS_SOURCES: NewsSource[] = [
  {
    name: "Solana Foundation Blog",
    url: "https://solana.com/rss.xml",
    type: "rss",
  },
  {
    name: "CoinDesk Solana",
    url: "https://www.coindesk.com/arc/outboundfeeds/rss/solana/",
    type: "rss",
  },
  {
    name: "Decrypt Solana",
    url: "https://decrypt.co/feed/solana",
    type: "rss",
  },
]

export const NEWS_FETCH_TIMEOUT = 5000 // 5 second timeout per source
