"use client"

import { useEffect, useState } from "react"

interface SolPriceData {
  price: number
  change24h: number
  loading: boolean
  error: boolean
}

// Sprint 2: Module-level promise for initial fetch coordination
let initialFetchPromise: Promise<void> | null = null

export function useSolPrice(): SolPriceData {
  const [data, setData] = useState<SolPriceData>({
    price: 0,
    change24h: 0,
    loading: true,
    error: false,
  })

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout

    const fetchPrice = async () => {
      try {
        const controller = new AbortController()
        const abortTimeoutId = setTimeout(() => controller.abort(), 8000) // 8s timeout

        const response = await fetch("/api/sol-price", {
          cache: "no-store",
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        })

        clearTimeout(abortTimeoutId)

        // Safe JSON parsing: read text first, then parse
        const text = await response.text()

        let json: any = null
        try {
          json = JSON.parse(text)
        } catch (parseError) {
          console.error("[v0] Failed to parse SOL price response:", parseError)
          // Keep previous state, don't crash
          return
        }

        if (mounted && json) {
          // PART B: Handle new response format: { price, change24h, updatedAt, stale, source }
          // Also support legacy format: { priceUsd, change24h, source, ts }
          const price = json.price ?? json.priceUsd ?? 0
          const change24h = json.change24h ?? 0

          console.log("[v0] SOL price update:", { price, change24h, source: json.source, raw: json })

          // Only update if we got valid data
          if (price > 0 || json.price !== undefined || json.priceUsd !== undefined) {
            setData({
              price,
              change24h,
              loading: false,
              error: false,
            })
          }
        }
      } catch (error) {
        console.error("[v0] SOL price fetch error:", error)
        // Don't mark as error, just keep previous state
        if (mounted) {
          setData((prev) => ({ ...prev, loading: false }))
        }
      }

      // Poll every 120 seconds (2 minutes)
      if (mounted) {
        timeoutId = setTimeout(fetchPrice, 120000)
      }
    }

    // Sprint 2: Store initial fetch promise for parallel coordination
    if (!initialFetchPromise) {
      initialFetchPromise = fetchPrice().then(() => {
        initialFetchPromise = null
      })
    } else {
      fetchPrice()
    }

    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  return data
}

// Sprint 2: Export function to prefetch SOL price in parallel with /api/index
export async function prefetchSolPrice(): Promise<void> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    await fetch("/api/sol-price", {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    })

    clearTimeout(timeoutId)
  } catch (error) {
    // Silently fail - hook will retry
    console.error("[v0] SOL price prefetch failed:", error)
  }
}
