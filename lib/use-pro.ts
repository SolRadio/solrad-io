"use client"

import { useCallback, useEffect, useState } from "react"

// ── Module-level 60-second in-memory cache ──
let cached: { isPro: boolean; ts: number } | null = null
const CACHE_TTL = 60_000 // 60 seconds

export function invalidateProCache() {
  cached = null
}

async function fetchProStatus(): Promise<boolean> {
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.isPro
  }

  try {
    const res = await fetch("/api/user/pro-status", {
      credentials: "include",
    })
    if (!res.ok) return false
    const data = await res.json()
    const isPro = data?.isPro === true
    cached = { isPro, ts: Date.now() }
    return isPro
  } catch {
    return false
  }
}

export function usePro() {
  const [isPro, setIsPro] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      invalidateProCache()
      const result = await fetchProStatus()
      setIsPro(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch pro status")
      setIsPro(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    fetchProStatus()
      .then((result) => {
        if (!cancelled) {
          setIsPro(result)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to fetch pro status")
          setIsPro(false)
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { isPro, isLoading, error, refetch }
}
