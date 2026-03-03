/**
 * Centralized SEO Utilities
 * Enterprise-grade title, description, and canonical URL builders
 */

const BASE_URL = "https://www.solrad.io"
const SITE_NAME = "SOLRAD"

export interface SEOConfig {
  title?: string
  description?: string
  path?: string
  noIndex?: boolean
  keywords?: string[]
}

/**
 * Title Template Builder
 * Automatically appends site name and enforces length limits
 */
export function buildTitle(title: string, template?: "default" | "short"): string {
  const maxLength = 60
  
  if (template === "short") {
    // Short template: just title (for very long titles)
    return title.length > maxLength ? `${title.substring(0, maxLength - 3)}...` : title
  }
  
  // Default template: "Page Title | SOLRAD"
  const fullTitle = `${title} | ${SITE_NAME}`
  
  if (fullTitle.length <= maxLength) {
    return fullTitle
  }
  
  // Truncate title to fit with site name
  const availableLength = maxLength - ` | ${SITE_NAME}`.length - 3 // -3 for "..."
  return `${title.substring(0, availableLength)}... | ${SITE_NAME}`
}

/**
 * Description Template Builder
 * Enforces meta description length limits (150-160 chars optimal)
 */
export function buildDescription(description: string, suffix?: string): string {
  const maxLength = 160
  const fullDescription = suffix ? `${description} ${suffix}` : description
  
  if (fullDescription.length <= maxLength) {
    return fullDescription
  }
  
  return `${fullDescription.substring(0, maxLength - 3)}...`
}

/**
 * Canonical URL Builder
 * Ensures consistent canonical URLs across the site
 */
export function buildCanonical(path: string): string {
  // Remove trailing slashes except for root
  const cleanPath = path === "/" ? path : path.replace(/\/$/, "")
  
  // Remove query parameters and fragments
  const pathWithoutParams = cleanPath.split("?")[0].split("#")[0]
  
  return `${BASE_URL}${pathWithoutParams}`
}

/**
 * OG Image URL Builder
 * Generates Open Graph image URLs with fallback logic
 */
export function buildOGImageURL(path?: string, tokenSymbol?: string): string {
  // Token-specific OG image (future enhancement)
  if (tokenSymbol) {
    return `${BASE_URL}/api/og?token=${encodeURIComponent(tokenSymbol)}`
  }
  
  // Page-specific OG image (future enhancement)
  if (path && path !== "/") {
    return `${BASE_URL}/brand/og-1200x630.png`
  }
  
  // Default OG image
  return `${BASE_URL}/brand/og-1200x630.png`
}

/**
 * Robots Meta Tag Builder
 * Generates X-Robots-Tag header values
 */
export function buildRobotsTag(config: { 
  noIndex?: boolean
  noFollow?: boolean
  noArchive?: boolean
  noSnippet?: boolean
}): string {
  const directives: string[] = []
  
  if (config.noIndex) directives.push("noindex")
  else directives.push("index")
  
  if (config.noFollow) directives.push("nofollow")
  else directives.push("follow")
  
  if (config.noArchive) directives.push("noarchive")
  if (config.noSnippet) directives.push("nosnippet")
  
  // Add standard directives for rich results
  directives.push("max-image-preview:large")
  directives.push("max-snippet:-1")
  directives.push("max-video-preview:-1")
  
  return directives.join(", ")
}

/**
 * Keywords Builder
 * Merges page-specific keywords with site-wide keywords
 */
export function buildKeywords(pageKeywords: string[]): string {
  const siteKeywords = [
    "Solana",
    "token scanner",
    "market intelligence",
    "blockchain analytics",
  ]
  
  const allKeywords = [...new Set([...pageKeywords, ...siteKeywords])]
  return allKeywords.join(", ")
}

/**
 * Generate complete SEO metadata object
 * Main entry point for consistent SEO across all pages
 */
export function generateSEOMetadata(config: SEOConfig) {
  const title = config.title ? buildTitle(config.title) : `${SITE_NAME} - Solana Market Intelligence`
  const description = config.description || "Real-time Solana token intelligence, risk analysis, and market data."
  const canonical = config.path ? buildCanonical(config.path) : BASE_URL
  const keywords = config.keywords ? buildKeywords(config.keywords) : undefined
  
  return {
    title,
    description,
    keywords,
    canonical,
    ogImage: buildOGImageURL(config.path),
    robotsTag: buildRobotsTag({ noIndex: config.noIndex }),
  }
}

/**
 * Token Page SEO Generator
 * Specialized metadata for token detail pages
 */
export function generateTokenSEO(tokenData: {
  symbol: string
  name: string
  mint: string
  score?: number
  risk?: string
  liquidity?: number
}) {
  const title = `${tokenData.symbol} - SOLRAD Score & Analysis`
  const description = buildDescription(
    `Real-time analysis for ${tokenData.name} (${tokenData.symbol}). ${
      tokenData.score ? `SOLRAD Score: ${tokenData.score}/100.` : ""
    } ${tokenData.risk ? `Risk: ${tokenData.risk}.` : ""} Live market data, holder analysis, and signals.`,
    "Track on SOLRAD."
  )
  
  return generateSEOMetadata({
    title,
    description,
    path: `/token/${tokenData.mint}`,
    keywords: [
      tokenData.symbol,
      tokenData.name,
      "Solana token",
      "token analysis",
      "SOLRAD score",
    ],
    noIndex: tokenData.risk === "TRASH", // Don't index trash tokens
  })
}

/**
 * Export constants for use across the app
 */
export const SEO_CONSTANTS = {
  BASE_URL,
  SITE_NAME,
  DEFAULT_TITLE: `${SITE_NAME} - Solana Market Intelligence & Token Analytics`,
  DEFAULT_DESCRIPTION: "Real-time Solana token scanner and market intelligence dashboard. Find gems, track wallets, analyze risk with SOLRAD scoring.",
  DEFAULT_OG_IMAGE: `${BASE_URL}/brand/og-1200x630.png`,
}
