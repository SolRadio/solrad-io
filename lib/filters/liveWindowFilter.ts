import type { TokenScore } from "@/lib/types"

/**
 * LIVE WINDOW FILTER
 * 
 * Filters tokens to only include those updated within the last 5 minutes.
 * This prevents stale tokens from re-surfacing in LIVE dashboard sections.
 * 
 * USAGE:
 * - Apply ONLY to: Trending, Active Trading, Fresh Signals, New/Early
 * - DO NOT apply to: Token Pool, Drawer, Search, Historical views
 * 
 * NO DATA IS DELETED - this is UI-level filtering only
 */

// 5 minutes in milliseconds
export const LIVE_WINDOW_MS = 5 * 60 * 1000

/**
 * Extract a valid timestamp from a token, trying multiple fields
 * @param token - Token to extract timestamp from
 * @returns Timestamp in milliseconds, or null if no valid timestamp found
 */
function extractTimestamp(token: TokenScore): number | null {
  // Try these fields in order (first valid wins)
  const candidates = [
    (token as any).lastUpdatedAt,
    token.lastUpdated,
    (token as any).updatedAt,
    (token as any).updated,
    token.sourceUpdatedAt,
    (token as any)._canonical?.lastUpdatedAt,
    (token as any)._canonical?.firstSeenAt,
  ]
  
  for (const value of candidates) {
    if (value === undefined || value === null) continue
    
    // If number, use it directly
    if (typeof value === "number" && value > 0) {
      return value
    }
    
    // If string, try to parse as ISO date
    if (typeof value === "string") {
      const parsed = Date.parse(value)
      if (!isNaN(parsed) && parsed > 0) {
        return parsed
      }
    }
  }
  
  return null
}

/**
 * Filters tokens to only include "live" tokens (updated within last 5 minutes)
 * @param tokens - Array of tokens to filter
 * @returns Filtered array containing only tokens updated within LIVE_WINDOW_MS
 */
export function filterLiveTokens(tokens: TokenScore[]): TokenScore[] {
  const now = Date.now()
  
  return tokens.filter(token => {
    const timestamp = extractTimestamp(token)
    
    // If no valid timestamp found, INCLUDE the token (fail open)
    // This prevents blanking due to missing metadata
    if (timestamp === null) {
      return true
    }
    
    // Check if token was updated within the live window
    const age = now - timestamp
    return age <= LIVE_WINDOW_MS
  })
}

/**
 * Get the age of the oldest token in a list (in milliseconds)
 * @param tokens - Array of tokens
 * @returns Age in milliseconds, or null if no tokens or no timestamps
 */
export function getOldestTokenAge(tokens: TokenScore[]): number | null {
  if (tokens.length === 0) return null
  
  const now = Date.now()
  let maxAge = 0
  
  for (const token of tokens) {
    if (token.lastUpdatedAt) {
      const age = now - token.lastUpdatedAt
      if (age > maxAge) {
        maxAge = age
      }
    }
  }
  
  return maxAge > 0 ? maxAge : null
}

/**
 * Format age in milliseconds to human-readable string
 * @param ageMs - Age in milliseconds
 * @returns Formatted string like "2m 30s ago"
 */
export function formatAge(ageMs: number): string {
  const minutes = Math.floor(ageMs / 60000)
  const seconds = Math.floor((ageMs % 60000) / 1000)
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}
