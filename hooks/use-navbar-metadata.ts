"use client"

import { useState, useEffect } from "react"

export interface NavbarMetadata {
  updatedAt: number | null
  tokenCount: number
  sources: string[]
}

/**
 * Fetch real navbar metadata from the dashboard API
 * Phase A: UI-only, reuses existing /api/index endpoint
 */
export function useNavbarMetadata() {
  const [metadata, setMetadata] = useState<NavbarMetadata>({
    updatedAt: null,
    tokenCount: 0,
    sources: ["DexScreener"],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch("/api/index")
        const data = await response.json()

        // Extract metadata from API response
        const updatedAt = data.lastIngestAt || data.updatedAt || Date.now()
        const tokenCount = data.totalTokenCount || data.all?.length || 0

        // Infer sources from token data (Phase A: client-side inference only)
        const sources = inferSources(data)

        setMetadata({
          updatedAt,
          tokenCount,
          sources,
        })
      } catch (error) {
        console.error("[v0] Failed to fetch navbar metadata:", error)
        // Keep fallback values on error
      } finally {
        setLoading(false)
      }
    }

    fetchMetadata()

    // Refresh every 30 seconds to stay in sync with dashboard
    const interval = setInterval(fetchMetadata, 30000)

    return () => clearInterval(interval)
  }, [])

  return { metadata, loading }
}

/**
 * Infer data sources from API response
 * Phase A: Simple client-side heuristics based on existing data
 */
function inferSources(data: any): string[] {
  const sources = new Set<string>()

  // Always include DexScreener as primary source for market data
  sources.add("DexScreener")

  // Check if tokens have on-chain data (indicates blockchain source)
  const hasOnChainData = data.all?.some((token: any) => 
    token.pairCreatedAt || token.holders || token.dexUrl
  )
  
  if (hasOnChainData) {
    sources.add("On-chain")
  }

  return Array.from(sources)
}
