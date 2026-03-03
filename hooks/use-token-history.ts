'use client';

import { useState, useEffect, useCallback } from "react"

interface TokenHistorySnapshot {
  ts: number
  price: number
  solradScore: number
  signalScore: number | null
  liquidityUsd: number
  volume24hUsd: number
  riskLabel: string
}

interface TokenHistoryResponse {
  mint: string | null
  count: number
  window: string
  snapshots: TokenHistorySnapshot[]
}

interface UseTokenHistoryOptions {
  enabled?: boolean
  limit?: number
  window?: "6h" | "24h" | "7d"
  pollIntervalMs?: number
}

interface UseTokenHistoryReturn {
  snapshots: TokenHistorySnapshot[]
  loading: boolean
  error: string | null
  lastUpdated: number | null
}

export function useTokenHistory(
  mint: string | null | undefined,
  options: UseTokenHistoryOptions = {}
): UseTokenHistoryReturn {
  const {
    enabled = true,
    limit = 80,
    window = "24h",
    pollIntervalMs,
  } = options

  const [snapshots, setSnapshots] = useState<TokenHistorySnapshot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)

  const fetchHistory = useCallback(async () => {
    if (!mint || !enabled) {
      setSnapshots([])
      setLoading(false)
      setError(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        mint,
        limit: limit.toString(),
        window,
      })

      const response = await fetch(`/api/token-history?${params}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch token history: ${response.statusText}`)
      }

      const data: TokenHistoryResponse = await response.json()
      setSnapshots(data.snapshots || [])
      setLastUpdated(Date.now())
    } catch (err) {
      console.error("[v0] Token history fetch error:", err)
      setError(err instanceof Error ? err.message : "Failed to load history")
      setSnapshots([])
    } finally {
      setLoading(false)
    }
  }, [mint, enabled, limit, window])

  // Initial fetch
  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // Polling (if enabled)
  useEffect(() => {
    if (!pollIntervalMs || !enabled || !mint) return

    const interval = setInterval(fetchHistory, pollIntervalMs)
    return () => clearInterval(interval)
  }, [fetchHistory, pollIntervalMs, enabled, mint])

  return {
    snapshots,
    loading,
    error,
    lastUpdated,
  }
}
