import type React from "react"

export type TokenOrigin = 
  | "pumpfun" 
  | "bonk" 
  | "raydium" 
  | "orca" 
  | "meteora" 
  | "jupiter" 
  | "moonshot" 
  | "bags" 
  | "unknown"

/**
 * Detects token origin by searching across ALL available token fields
 * Because our data isn't consistent, we build one big searchable string
 */
export function detectTokenOrigin(token: any): TokenOrigin {
  // Build searchable string from MANY possible fields
  const raw = [
    token.origin,
    token.source,
    token.launchpad,
    token.platform,
    token.dex,
    token.dexId,
    token.market,
    token.exchange,
    token.listingSource,
    token.pair?.dexId,
    token.pair?.dex,
    ...(Array.isArray(token.sources) ? token.sources : []),
    token.tags,
    token.tag,
    token.pairUrl,
    token.dexUrl,
    token.url,
  ].filter(Boolean).join(" ").toLowerCase()

  // Detect origin with substring matching
  let origin: TokenOrigin = "unknown"
  
  if (raw.includes("bags")) {
    origin = "bags"
  } else if (raw.includes("pump") || raw.includes("pumpfun") || raw.includes("pump.fun")) {
    origin = "pumpfun"
  } else if (raw.includes("letsbonk") || raw.includes("bonk")) {
    origin = "bonk"
  } else if (raw.includes("raydium")) {
    origin = "raydium"
  } else if (raw.includes("orca")) {
    origin = "orca"
  } else if (raw.includes("meteora")) {
    origin = "meteora"
  } else if (raw.includes("jup") || raw.includes("jupiter")) {
    origin = "jupiter"
  } else if (raw.includes("moonshot")) {
    origin = "moonshot"
  }

  // Dev-only debug probe
  if (process.env.NODE_ENV !== "production") {
    console.debug("[origin]", token.symbol, token.address?.slice(0, 4), {
      origin: token.origin,
      source: token.source,
      launchpad: token.launchpad,
      listingSource: token.listingSource,
      dexId: token.dexId,
      sources: token.sources,
      tags: token.tags,
      raw,
      detected: origin,
    })
  }

  return origin
}

// Export alias for compatibility
export const getTokenOrigin = detectTokenOrigin

/**
 * Returns accent styling for a given token origin
 */
export function getOriginAccent(origin: TokenOrigin): {
  borderColor: string
  borderStyle: React.CSSProperties
  ringStyle: React.CSSProperties
  label: string
} {
  const accents = {
    pumpfun: {
      borderColor: "#22c55e",
      label: "PUMP",
    },
    bonk: {
      borderColor: "#f97316",
      label: "BONK",
    },
    raydium: {
      borderColor: "#3b82f6",
      label: "RAY",
    },
    orca: {
      borderColor: "#14b8a6",
      label: "ORCA",
    },
    meteora: {
      borderColor: "#a855f7",
      label: "METEORA",
    },
    jupiter: {
      borderColor: "#22c55e",
      label: "JUP",
    },
    moonshot: {
      borderColor: "#eab308",
      label: "MOONSHOT",
    },
    bags: {
      borderColor: "#10b981",
      label: "BAGS",
    },
    unknown: {
      borderColor: "#334155",
      label: "",
    },
  }

  const { borderColor, label } = accents[origin]

  return {
    borderColor,
    label,
    borderStyle: {
      border: `1px solid ${borderColor}`,
      boxShadow: `0 0 0 1px ${borderColor}33, 0 0 16px ${borderColor}26`,
    },
    ringStyle: {
      border: `2px solid ${borderColor}`,
      boxShadow: `0 0 0 3px ${borderColor}1a, 0 0 14px ${borderColor}2b`,
    },
  }
}
