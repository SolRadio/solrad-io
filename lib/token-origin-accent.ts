import type { TokenScore } from "./types"

/**
 * Token Origin Accent System
 * Provides colored borders and glows based on token origin (pump.fun, raydium, etc.)
 */

export type OriginKey = "pumpfun" | "raydium" | "orca" | "meteora" | "bonk" | "moonshot" | "bags" | "jupiter" | "unknown"

export interface OriginResult {
  origin: OriginKey
  reason: string  // which field matched: "pass1:dexId", "pass2:json", etc.
  matched?: string // the keyword that matched
}

const ORIGIN_COLORS: Record<OriginKey, string> = {
  pumpfun: "#22c55e",
  raydium: "#3b82f6",
  orca: "#14b8a6",
  meteora: "#a855f7",
  bonk: "#f97316",
  moonshot: "#eab308",
  bags: "#10b981",
  jupiter: "#a855f7",
  unknown: "#334155",
}

const ORIGIN_LABELS: Record<OriginKey, string> = {
  pumpfun: "PUMP",
  raydium: "RAY",
  orca: "ORCA",
  meteora: "MET",
  bonk: "BONK",
  moonshot: "MOON",
  bags: "BAGS",
  jupiter: "JUP",
  unknown: "UNK",
}

/**
 * SINGLE SOURCE OF TRUTH: Keyword matching
 * Matches keywords in priority order
 */
export function matchOriginFromText(input: string): { origin: OriginKey; matched?: string } {
  if (!input) return { origin: "unknown" }
  
  const text = input.toLowerCase()
  
  // pumpfun keywords
  const pumpKeywords = ["pump.fun", "pumpfun", " pump ", ".pump", "pump"]
  for (const kw of pumpKeywords) {
    if (text.includes(kw)) return { origin: "pumpfun", matched: kw }
  }
  
  // bonk keywords
  const bonkKeywords = ["letsbonk", "bonk", ".bonk"]
  for (const kw of bonkKeywords) {
    if (text.includes(kw)) return { origin: "bonk", matched: kw }
  }
  
  // raydium keywords
  const raydiumKeywords = ["raydium", " ray ", "ray"]
  for (const kw of raydiumKeywords) {
    if (text.includes(kw)) return { origin: "raydium", matched: kw }
  }
  
  // orca keywords
  if (text.includes("orca")) return { origin: "orca", matched: "orca" }
  
  // meteora keywords
  if (text.includes("meteora")) return { origin: "meteora", matched: "meteora" }
  
  // jupiter keywords
  const jupiterKeywords = ["jup", "jupiter"]
  for (const kw of jupiterKeywords) {
    if (text.includes(kw)) return { origin: "jupiter", matched: kw }
  }
  
  // moonshot keywords
  if (text.includes("moonshot")) return { origin: "moonshot", matched: "moonshot" }
  
  // bags keywords
  if (text.includes("bags")) return { origin: "bags", matched: "bags" }
  
  return { origin: "unknown" }
}

/**
 * Helper: Safely convert any value to string
 */
function toSafeString(value: unknown): string {
  if (!value) return ""
  if (typeof value === "string") return value
  if (Array.isArray(value)) return value.map(toSafeString).join(" ")
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

/**
 * TRUE 2-PASS DETECTOR with fallback
 */
export function getTokenOriginWithReason(token: TokenScore): OriginResult {
  // Pass 1: Check targeted fields in order (defensive)
  const candidateFields = [
    { name: "dexId", value: token.dexId },
    { name: "pairUrl", value: token.pairUrl },
    { name: "source", value: (token as any).source },
    { name: "boostSources", value: token.boostSources },
    { name: "dex", value: (token as any).dex },
    { name: "market", value: (token as any).market },
    { name: "marketId", value: (token as any).marketId },
    { name: "url", value: (token as any).url },
    { name: "links", value: (token as any).links },
    { name: "pair", value: (token as any).pair },
    { name: "pools", value: (token as any).pools },
    { name: "platform", value: (token as any).platform },
  ]
  
  for (const field of candidateFields) {
    if (!field.value) continue
    const fieldText = toSafeString(field.value)
    const match = matchOriginFromText(fieldText)
    if (match.origin !== "unknown") {
      return {
        origin: match.origin,
        reason: `pass1:${field.name}`,
        matched: match.matched,
      }
    }
  }
  
  // Pass 2: FULL haystack stringify (ALWAYS run if Pass 1 failed)
  const haystack = JSON.stringify(token)
  const haystackMatch = matchOriginFromText(haystack)
  
  if (haystackMatch.origin !== "unknown") {
    return {
      origin: haystackMatch.origin,
      reason: "pass2:json",
      matched: haystackMatch.matched,
    }
  }
  
  // Pass 2.5: Pump.fun mint suffix fallback
  if (token.address && typeof token.address === "string") {
    if (token.address.toLowerCase().endsWith("pump")) {
      return {
        origin: "pumpfun",
        reason: "pass2.5:address_suffix_pump",
        matched: "address ending with 'pump'",
      }
    }
  }
  
  // Unknown - no match found
  return {
    origin: "unknown",
    reason: "no-match",
  }
}

/**
 * Simplified version that returns only OriginKey
 */
export function getTokenOrigin(token: TokenScore): OriginKey {
  return getTokenOriginWithReason(token).origin
}

/**
 * Get origin accent styles as React inline style objects
 */
export function getOriginAccent(origin: OriginKey) {
  const color = ORIGIN_COLORS[origin]
  const label = ORIGIN_LABELS[origin]

  // Jupiter gets special multi-tone glow treatment
  if (origin === "jupiter") {
    return {
      borderStyle: {
        border: `1px solid ${color}`,
        boxShadow: `0 0 0 1px ${color}55, 0 0 14px #3b82f633, 0 0 18px #22c55e22`,
      } as React.CSSProperties,
      ringStyle: {
        boxShadow: `0 0 0 2px ${color}aa, 0 0 16px ${color}33, 0 0 12px #3b82f633`,
        borderRadius: "9999px",
      } as React.CSSProperties,
      accentStripStyle: {
        background: color,
        boxShadow: `0 0 14px ${color}33`,
      } as React.CSSProperties,
      pillStyle: {
        border: `1px solid ${color}66`,
        color: color,
        background: `${color}14`,
      } as React.CSSProperties,
      label,
      originLabel: label,
      borderColor: color,
    }
  }

  // Standard origin styles
  return {
    borderStyle: {
      border: `1px solid ${color}`,
      boxShadow: `0 0 0 1px ${color}55, 0 0 18px ${color}22`,
    } as React.CSSProperties,
    ringStyle: {
      boxShadow: `0 0 0 2px ${color}aa, 0 0 16px ${color}33`,
      borderRadius: "9999px",
    } as React.CSSProperties,
    accentStripStyle: {
      background: color,
      boxShadow: `0 0 14px ${color}33`,
    } as React.CSSProperties,
    pillStyle: {
      border: `1px solid ${color}66`,
      color: color,
      background: `${color}14`,
    } as React.CSSProperties,
    label,
    originLabel: label,
    borderColor: color,
  }
}
