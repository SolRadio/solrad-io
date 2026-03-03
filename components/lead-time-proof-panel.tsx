/**
 * Lead-Time Proof Panel
 * 
 * Displays detailed lead-time proofs in token detail drawer
 * Shows observation events, reaction events, and lead-time metrics
 */

"use client"

import type { LeadTimeProof, LeadTimeStats, PendingObservation } from "@/lib/lead-time/types"
import { Badge } from "@/components/ui/badge"
import { Clock, TrendingUp, Users, Droplets, Eye, Lock, HourglassIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface LeadTimeProofPanelProps {
  proofs: LeadTimeProof[]
  stats: LeadTimeStats | null
  pendingObservation: PendingObservation | null
  isPro: boolean
  loading?: boolean
}

export function LeadTimeProofPanel({
  proofs,
  stats,
  pendingObservation,
  isPro,
  loading = false,
}: LeadTimeProofPanelProps) {
  // Show pending observation for Pro users if no proofs exist yet
  const hasPendingOnly = isPro && pendingObservation && (!proofs || proofs.length === 0)
  
  // Render guard: require either proofs or pending observation (Pro only)
  if (!hasPendingOnly && (!proofs || proofs.length === 0)) {
    return null
  }

  // If showing pending only, render pending UI
  if (hasPendingOnly) {
    const timeSinceObservation = Date.now() - pendingObservation.observedAt
    const minutesAgo = Math.floor(timeSinceObservation / 1000 / 60)
    
    return (
      <div className="p-2.5 rounded-none bg-card border border-amber-500/30">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
            <HourglassIcon className="h-3 w-3" />
            Pending Observation
          </h3>
          <Badge variant="outline" className="text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">
            PRO
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="p-2 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Clock className="h-3 w-3" />
              <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                Observed {minutesAgo}m ago
              </span>
            </div>
            <p className="text-xs">{pendingObservation.observationType.replace(/_/g, " ")}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Score: {pendingObservation.baseline.score} | Vol: ${Math.round(pendingObservation.baseline.volume24h).toLocaleString()} | Liq: ${Math.round(pendingObservation.baseline.liquidity).toLocaleString()}
            </p>
          </div>
          
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <HourglassIcon className="h-3 w-3" />
              Pending market reaction - Tracking volume and liquidity changes
            </p>
          </div>
          
          <p className="text-[10px] text-muted-foreground/70 italic">
            Observing on-chain behavior. Not a prediction or guarantee of future performance.
          </p>
        </div>
      </div>
    )
  }

  const latestProof = proofs[proofs.length - 1]
  
  // Render guard: require leadSeconds or leadBlocks in the proof
  if (!latestProof.leadSeconds && !latestProof.leadBlocks) {
    return null
  }
  const observationIcons = {
    accumulation_spike: <Users className="h-3 w-3" />,
    wallet_clustering: <Users className="h-3 w-3" />,
    liquidity_probe: <Droplets className="h-3 w-3" />,
  }

  const reactionIcons = {
    volume_expansion: <TrendingUp className="h-3 w-3" />,
    liquidity_expansion: <Droplets className="h-3 w-3" />,
    dexscreener_visibility: <Eye className="h-3 w-3" />,
  }

  const confidenceColors = {
    LOW: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
    MEDIUM: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
    HIGH: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
  }

  // Calculate display time from leadSeconds or leadBlocks
  let displayTime: string
  let displayBlocks: string

  if (latestProof.leadSeconds) {
    const leadMinutes = Math.floor(latestProof.leadSeconds / 60)
    displayTime = leadMinutes < 60
      ? `${leadMinutes}m`
      : `${Math.floor(leadMinutes / 60)}h ${leadMinutes % 60}m`
  } else {
    displayTime = "Unknown"
  }

  if (latestProof.leadBlocks) {
    displayBlocks = `+${latestProof.leadBlocks} blocks`
  } else if (latestProof.leadSeconds) {
    displayBlocks = `~${Math.round(latestProof.leadSeconds / 0.4)} blocks (est)`
  } else {
    displayBlocks = "Unknown"
  }

  return (
    <div className="p-2.5 rounded-none bg-card border">
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          Lead-Time Proof
        </h3>
        <Badge variant="outline" className={`text-[10px] ${confidenceColors[latestProof.confidence]}`}>
          {latestProof.confidence}
        </Badge>
      </div>

      {/* Latest Proof */}
      <div className="space-y-2">
        <div className="p-2 rounded-lg bg-muted/30 border border-border/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">
              Lead Time
            </span>
            <span className="font-mono text-sm font-bold">
              {displayBlocks}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{displayTime} before market reaction</p>
        </div>

        {/* Observation Event */}
        <div className="p-2 rounded-lg bg-muted/20 border border-border/30">
          <div className="flex items-center gap-1.5 mb-0.5">
            {observationIcons[latestProof.observationEvent.observationType]}
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">
              Observed
            </span>
          </div>
          <p className="text-xs">{latestProof.observationEvent.details}</p>
          {latestProof.observationEvent.blockNumber > 0 && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Block #{latestProof.observationEvent.blockNumber.toLocaleString()}
            </p>
          )}
        </div>

        {/* Reaction Event */}
        <div className="p-2 rounded-lg bg-muted/20 border border-border/30">
          <div className="flex items-center gap-1.5 mb-0.5">
            {reactionIcons[latestProof.reactionEvent.reactionType]}
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">
              Market Reaction
            </span>
          </div>
          <p className="text-xs">{latestProof.reactionEvent.details}</p>
          {latestProof.reactionEvent.blockNumber > 0 && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Block #{latestProof.reactionEvent.blockNumber.toLocaleString()}
            </p>
          )}
        </div>

        {/* Stats Summary */}
        {stats && stats.totalProofs > 1 && (
          <div className="pt-2 border-t border-border/50">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Total Proofs:</span>
                <span className="ml-1 font-semibold">{stats.totalProofs}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Avg Lead:</span>
                <span className="ml-1 font-semibold">{Math.round(stats.averageLeadBlocks)}b</span>
              </div>
              <div>
                <span className="text-muted-foreground">Min Lead:</span>
                <span className="ml-1 font-semibold">{stats.minLeadBlocks}b</span>
              </div>
              <div>
                <span className="text-muted-foreground">Max Lead:</span>
                <span className="ml-1 font-semibold">{stats.maxLeadBlocks}b</span>
              </div>
            </div>
          </div>
        )}

        {/* Trust-First Disclaimer */}
        <p className="text-[10px] text-muted-foreground/70 italic">
          Lead-time proof shows observed on-chain behavior. Not a prediction or guarantee of
          future performance.
        </p>
      </div>
    </div>
  )
}
