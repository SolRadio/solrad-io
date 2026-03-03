/**
 * Centralized 24h cutoff computation.
 * ONE function used by BOTH /api/signal-outcomes and /api/snapshot-health
 * so they can NEVER disagree on the cutoff value.
 */
export function getCutoffMs24h(nowMs: number = Date.now()): number {
  return nowMs - 86_400_000 // exactly 24 hours in ms
}

/**
 * Derive a redacted KV identity string for debugging.
 * Shows the hostname portion of KV_REST_API_URL without tokens.
 */
export function getKvIdentity(): string {
  const url = process.env.KV_REST_API_URL
  if (!url) return "KV_NOT_SET"
  try {
    const u = new URL(url)
    return u.hostname
  } catch {
    // Show last 8 chars as fingerprint
    return `...${url.slice(-8)}`
  }
}
