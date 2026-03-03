/**
 * Lead-Time Data Hook
 * 
 * Fetches lead-time proofs and stats for a token
 */

"use client"

import { useState, useEffect } from "react"
import type { LeadTimeProof, LeadTimeStats, PendingObservation } from "@/lib/lead-time/types"

interface UseLeadTimeOptions {
  enabled?: boolean
}

interface LeadTimeData {
  proofs: LeadTimeProof[]
  stats: LeadTimeStats | null
  pendingObservation: PendingObservation | null
  isPro: boolean
  delayMinutes: number
  loading: boolean
  error: Error | null
}

export function useLeadTime(
  mint: string | undefined,
  options: UseLeadTimeOptions = {}
): LeadTimeData {
  const { enabled = true } = options
  
  const [data, setData] = useState<LeadTimeData>({
    proofs: [],
    stats: null,
    pendingObservation: null,
    isPro: false,
    delayMinutes: 15,
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (!mint || !enabled) {
      setData((prev) => ({ ...prev, loading: false }))
      return
    }

    let isMounted = true

    const fetchLeadTime = async () => {
      try {
        const response = await fetch(`/api/lead-time/${mint}`, {
          cache: "no-store",
        })
        if (!response.ok) {
          throw new Error("Failed to fetch lead-time data")
        }

        const result = await response.json()
        

        if (isMounted) {
          setData({
            proofs: result.proofs ?? [],
            stats: result.stats ?? null,
            pendingObservation: result.pendingObservation ?? null,
            isPro: result.isPro ?? false,
            delayMinutes: result.delayMinutes ?? 15,
            loading: false,
            error: null,
          })
        }
      } catch (error) {
        if (isMounted) {
          setData((prev) => ({
            ...prev,
            loading: false,
            error: error as Error,
          }))
        }
      }
    }

    fetchLeadTime()

    return () => {
      isMounted = false
    }
  }, [mint, enabled])

  return data
}

/**
 * Hook for latest lead-time proof (for badge display)
 */
export function useLatestLeadTimeProof(
  mint: string | undefined,
  options: UseLeadTimeOptions = {}
): {
  proof: LeadTimeProof | null
  loading: boolean
  error: Error | null
} {
  const { proofs, loading, error } = useLeadTime(mint, options)
  
  const proof = proofs.length > 0 ? proofs[proofs.length - 1] : null

  return { proof, loading, error }
}
