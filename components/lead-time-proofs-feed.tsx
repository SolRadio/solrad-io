"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"
import type { LeadTimeProof } from "@/lib/lead-time/types"

interface RecentProofsResponse {
  proofs: LeadTimeProof[]
  isPro: boolean
  delayMinutes: number
  scannedAt: string
  source?: "live" | "fallback"
}

export function LeadTimeProofsFeed() {
  const [proofs, setProofs] = useState<LeadTimeProof[]>([])
  const [scannedAt, setScannedAt] = useState<string | null>(null)
  const [source, setSource] = useState<"live" | "fallback">("live")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchProofs = async () => {
      try {
        const response = await fetch("/api/lead-time/recent?limit=50", {
          cache: "no-store",
        })
        if (!response.ok) {
          setError(true)
          return
        }
        
        const data: RecentProofsResponse = await response.json()
        setProofs(data.proofs || [])
        setScannedAt(data.scannedAt || new Date().toISOString())
        setSource(data.source ?? "live")
        setError(false)
      } catch (err) {
        console.error("[v0] Failed to fetch recent proofs:", err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchProofs()
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchProofs, 60000)
    return () => clearInterval(interval)
  }, [])

  const isEmpty = !loading && (!proofs || proofs.length === 0)

  return (
    <div className="w-full rounded-xl border bg-card/50 backdrop-blur-sm p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Clock className="h-5 w-5 text-cyan-400" />
        <div>
          <h2 className="text-lg font-bold text-foreground">Lead-Time Proofs Feed</h2>
          <p className="text-xs text-muted-foreground">
            Recent on-chain observations before market reaction (limit 50)
          </p>
        </div>
      </div>

      {loading && (
        <div className="text-sm text-muted-foreground text-center py-8">
          Loading proofs...
        </div>
      )}

      {error && (
        <div className="text-sm text-amber-500/70 text-center py-8">
          Failed to load proofs. Please try again later.
        </div>
      )}

      {isEmpty && !error && (
        <div className="text-center py-8 space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
            </span>
            <p className="text-sm font-medium text-foreground/80">
              Building real-time proof
            </p>
          </div>
          <p className="text-xs text-muted-foreground/60">
            Early signals updating continuously
          </p>
        </div>
      )}

      {!loading && !isEmpty && (
        <>
        {/* Building real-time proof banner -- always visible when proofs exist */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/5 border border-cyan-500/15">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
          </span>
          <p className="text-[11px] text-muted-foreground">
            Building real-time proof — early signals updating continuously
          </p>
        </div>

        {source === "fallback" && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-500/5 border border-amber-500/15">
            <p className="text-[10px] text-amber-500/70">
              Showing last confirmed proofs while new signals are processing
            </p>
          </div>
        )}

        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {proofs.map((proof, idx) => {
            const minutesAgo = Math.round((Date.now() - proof.proofCreatedAt) / 60000)
            const hoursAgo = Math.floor(minutesAgo / 60)
            const displayTime = hoursAgo > 0 
              ? `${hoursAgo}h ${minutesAgo % 60}m ago`
              : `${minutesAgo}m ago`
            
            const leadDisplay = proof.leadBlocks 
              ? `+${proof.leadBlocks}b`
              : `+${Math.round(proof.leadSeconds / 60)}m`
            
            return (
              <div
                key={`${proof.mint}-${idx}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-background/40 border border-border/30 hover:border-cyan-500/30 transition-colors"
              >
                {/* Token Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-cyan-400">
                    {proof.symbol.charAt(0)}
                  </span>
                </div>
                
                {/* Token Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground truncate">
                      {proof.symbol}
                    </span>
                    <span className="text-xs text-muted-foreground/60 shrink-0">
                      {displayTime}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground/70 font-mono truncate">
                    {proof.mint}
                  </div>
                </div>
                
                {/* Lead Time Badge */}
                <div className="shrink-0">
                  <div className="px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30">
                    <span className="text-sm font-mono font-bold text-cyan-400">
                      {leadDisplay}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        </>
      )}

      {/* Footer Note */}
      <div className="pt-3 border-t border-border/20">
        <p className="text-xs text-muted-foreground/50 text-center">
          Lead times represent observed on-chain behavior before market price movement. 
          Not predictions • Verifiable receipts only
        </p>
      </div>
    </div>
  )
}
