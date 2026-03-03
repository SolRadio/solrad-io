"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Clock, TrendingUp } from "lucide-react"
import type { LeadTimeProof } from "@/lib/lead-time/types"

interface RecentProofsResponse {
  proofs: LeadTimeProof[]
  isPro: boolean
  delayMinutes: number
}

export function RecentLeadTimeProofs() {
  const [proofs, setProofs] = useState<LeadTimeProof[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProofs = async () => {
      try {
        const response = await fetch("/api/lead-time/recent?limit=10")
        if (!response.ok) return
        
        const data: RecentProofsResponse = await response.json()
        setProofs(data.proofs || [])
      } catch (error) {
        console.error("[v0] Failed to fetch recent proofs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProofs()
    
    // Refresh every 2 minutes
    const interval = setInterval(fetchProofs, 120000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="hidden lg:block">
        <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
          Recent Lead-Time Proofs
        </div>
        <Card className="p-4 bg-card/60 border-border/50">
          <div className="text-xs text-muted-foreground text-center py-4">
            Loading...
          </div>
        </Card>
      </div>
    )
  }

  if (!proofs || proofs.length === 0) {
    return null
  }

  return (
    <div className="hidden lg:block">
      <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
        Recent Lead-Time Proofs
      </div>
      
      <Card className="p-3 bg-card/60 border-border/50">
        <div className="space-y-2.5">
          {proofs.map((proof, idx) => {
            const minutesAgo = Math.round((Date.now() - proof.proofCreatedAt) / 60000)
            const leadMinutes = Math.round(proof.leadSeconds / 60)
            
            return (
              <div
                key={`${proof.mint}-${idx}`}
                className="p-2 rounded-lg bg-background/50 border border-border/30 hover:border-border/60 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-bold text-foreground truncate">
                      {proof.symbol}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground/70 shrink-0">
                      {minutesAgo}m ago
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Clock className="h-3 w-3 text-cyan-400" />
                    <span className="text-[10px] font-mono font-semibold text-cyan-400">
                      +{leadMinutes}m
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-2.5 w-2.5 text-success/70" />
                  <p className="text-[10px] text-muted-foreground/80 line-clamp-1">
                    {proof.reactionEvent.reactionType.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
        
        <div className="mt-3 pt-3 border-t border-border/30">
          <p className="text-[9px] text-muted-foreground/60 text-center italic leading-relaxed">
            Observed on-chain behavior before market reaction. Not predictions.
          </p>
        </div>
      </Card>
    </div>
  )
}
