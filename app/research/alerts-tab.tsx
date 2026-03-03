"use client"

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Activity,
  ExternalLink,
  Clock,
  AlertTriangle,
  RefreshCw,
  Flame,
  ShieldCheck,
  Zap,
  Lock,
} from "lucide-react"
import { usePro } from "@/lib/use-pro"

interface AlertProof {
  mint: string
  symbol: string
  name?: string
  leadBlocks?: number
  leadSeconds?: number
  confidence?: "LOW" | "MEDIUM" | "HIGH"
  proofCreatedAt?: number
  score?: number
  riskLevel?: string
  observationEvent?: {
    observationType?: string
    details?: string
  }
}

/* ── helpers ─────────────────────────────────────────────── */

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function formatLead(blocks?: number, seconds?: number): string {
  if (seconds && seconds >= 60) return `+${(seconds / 60).toFixed(1)}m`
  if (seconds) return `+${seconds.toFixed(0)}s`
  if (blocks) return `+${blocks} blk`
  return "--"
}

type SignalTier = "high" | "moderate" | "speculative" | "low"

function deriveSignalTier(p: AlertProof): SignalTier {
  // If we have a score from enrichment, use conviction-style tiers
  if (p.score && p.score >= 85 && p.confidence === "HIGH") return "high"
  if (p.score && p.score >= 70) return "moderate"
  // Fall back to confidence + lead strength
  const hasStrongLead = (p.leadBlocks ?? 0) >= 20 || (p.leadSeconds ?? 0) >= 120
  if (p.confidence === "HIGH" && hasStrongLead) return "high"
  if (p.confidence === "HIGH" || (p.confidence === "MEDIUM" && hasStrongLead)) return "moderate"
  if (p.confidence === "MEDIUM") return "speculative"
  return "low"
}

const tierConfig: Record<SignalTier, {
  label: string
  icon: typeof Flame
  bg: string
  text: string
  border: string
  dot: string
}> = {
  high: {
    label: "High Conviction",
    icon: Flame,
    bg: "bg-green-500/10",
    text: "text-green-400",
    border: "border-green-500/20",
    dot: "bg-green-500",
  },
  moderate: {
    label: "Moderate",
    icon: ShieldCheck,
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    border: "border-yellow-500/20",
    dot: "bg-yellow-500",
  },
  speculative: {
    label: "Speculative",
    icon: Zap,
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/20",
    dot: "bg-orange-500",
  },
  low: {
    label: "Weak",
    icon: AlertTriangle,
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/20",
    dot: "bg-red-500",
  },
}

const confidenceChip: Record<string, string> = {
  HIGH: "bg-green-500/15 text-green-400 border-green-500/30",
  MEDIUM: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  LOW: "bg-red-500/15 text-red-400 border-red-500/30",
}

const FREE_PREVIEW = 5
const MAX_ROWS = 50

/* ── component ───────────────────────────────────────────── */

export function AlertsTab() {
  const [proofs, setProofs] = useState<AlertProof[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(50)
  const { isPro } = usePro()
  const abortRef = useRef<AbortController | null>(null)

  const fetchAlerts = useCallback(async () => {
    // Abort any in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/lead-time/recent?limit=30", {
        signal: controller.signal,
      })
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json()
      const items: AlertProof[] = data.proofs ?? data.items ?? data.recent ?? data ?? []
      if (!controller.signal.aborted) {
        setProofs(Array.isArray(items) ? items.slice(0, MAX_ROWS) : [])
        setVisibleCount(50)
      }
    } catch (e: any) {
      if (e.name === "AbortError") return
      if (!controller.signal.aborted) {
        setError(e.message ?? "Failed to fetch")
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchAlerts()
    return () => { abortRef.current?.abort() }
  }, [fetchAlerts])

  // Group by time window
  const { recent, older } = useMemo(() => {
    const now = Date.now()
    const fiveMin = 5 * 60 * 1000
    const r: AlertProof[] = []
    const o: AlertProof[] = []
    proofs.forEach((p) => {
      if (p.proofCreatedAt && now - p.proofCreatedAt < fiveMin) r.push(p)
      else o.push(p)
    })
    return { recent: r, older: o }
  }, [proofs])

  const visibleLimit = isPro ? Infinity : FREE_PREVIEW

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-mono font-bold text-foreground tracking-tight">Signal Feed</span>
          </div>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono text-muted-foreground/60 border-border/30">
            {proofs.length} signals
          </Badge>
        </div>
        <button
          onClick={fetchAlerts}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-muted-foreground hover:text-foreground border border-border/40 rounded-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Feed container */}
      <div className="border border-border/30 rounded-md bg-muted/5 max-h-[560px] overflow-y-auto">
        {loading && proofs.length === 0 && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground/60">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm font-mono">Loading signals...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 px-4 py-8 text-sm font-mono text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span>Error: {error}</span>
          </div>
        )}

        {!loading && !error && proofs.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground/60">
            <Activity className="h-6 w-6" />
            <span className="text-sm font-mono">No recent signals</span>
          </div>
        )}

        {proofs.length > 0 && (
          <div className="divide-y divide-border/10">
            {/* Recent signals group */}
            {recent.length > 0 && (
              <>
                <div className="px-3 py-1.5 bg-green-500/5 border-b border-green-500/10 sticky top-0 z-10">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-green-400/70">
                    Last 5 minutes
                  </span>
                </div>
                {recent.slice(0, visibleLimit).map((p, idx) => (
                  <SignalRow key={`r-${p.mint}-${idx}`} proof={p} locked={false} />
                ))}
              </>
            )}

            {/* Older signals */}
            {older.length > 0 && (
              <>
                <div className="px-3 py-1.5 bg-muted/10 border-b border-border/10 sticky top-0 z-10">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground/50">
                    Recent Signals
                  </span>
                </div>
                {older.slice(0, Math.max(0, visibleLimit - recent.length)).map((p, idx) => (
                  <SignalRow key={`o-${p.mint}-${idx}`} proof={p} locked={false} />
                ))}
              </>
            )}

            {/* If no grouping needed (all in one bucket) */}
            {recent.length === 0 && older.length === 0 &&
              proofs.slice(0, visibleLimit).map((p, idx) => (
                <SignalRow key={`a-${p.mint}-${idx}`} proof={p} locked={false} />
              ))
            }

            {/* Single Pro gate overlay */}
            {!isPro && proofs.length > FREE_PREVIEW && (
              <div className="relative mt-2">
                <div className="space-y-1 pointer-events-none select-none">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="h-12 rounded bg-card/40 blur-[2px] opacity-40 border border-border/20" />
                  ))}
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/70 backdrop-blur-sm rounded-lg border border-primary/20">
                  <Lock className="text-primary" size={18} />
                  <p className="text-sm font-bold uppercase tracking-wide">
                    Real-time signal alerts
                  </p>
                  <p className="text-xs text-muted-foreground text-center max-w-xs">
                    Upgrade to Pro to receive live alerts when tokens cross score thresholds
                  </p>
                  <a href="/pro" className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                    UNLOCK ALERTS
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="text-[10px] font-mono text-muted-foreground/40 text-center">
        Signals derived from lead-time proofs. {isPro ? "Showing all signals." : `Showing ${FREE_PREVIEW} of ${proofs.length}.`}
      </p>
    </div>
  )
}

/* ── signal row ──────────────────────────────────────────── */

function SignalRow({ proof: p, locked }: { proof: AlertProof; locked: boolean }) {
  const tier = deriveSignalTier(p)
  const config = tierConfig[tier]
  const TierIcon = config.icon

  if (locked) {
    return (
      <div className="flex items-center justify-center gap-2 px-3 py-3 bg-muted/10 select-none">
        <Lock className="h-3 w-3 text-muted-foreground/30" />
        <span className="text-[11px] font-mono text-muted-foreground/30">PRO signal</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 hover:bg-muted/10 transition-colors group ${config.bg}`}>
      {/* Conviction label */}
      <div className={`flex items-center gap-1.5 min-w-[120px] shrink-0`}>
        <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${config.dot}`} />
        <TierIcon className={`h-3.5 w-3.5 shrink-0 ${config.text}`} />
        <span className={`text-[11px] font-mono font-bold truncate ${config.text}`}>
          {config.label}
        </span>
      </div>

      {/* Token info */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="text-[13px] font-mono font-bold text-foreground truncate">
          ${p.symbol || "???"}
        </span>
        {p.name && (
          <span className="text-[10px] font-mono text-muted-foreground/40 truncate hidden md:inline">
            {p.name}
          </span>
        )}
        {p.score && (
          <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono text-primary/70 border-primary/20 shrink-0">
            {p.score}/100
          </Badge>
        )}
      </div>

      {/* Lead time */}
      <div className="flex items-center gap-1 shrink-0 min-w-[60px] justify-end">
        <span className="text-[13px] font-mono font-bold text-primary tabular-nums">
          {formatLead(p.leadBlocks, p.leadSeconds)}
        </span>
      </div>

      {/* Confidence chip */}
      <div className="shrink-0 min-w-[44px] flex justify-center">
        <Badge
          variant="outline"
          className={`text-[9px] px-1.5 py-0 font-bold border ${
            confidenceChip[p.confidence ?? "MEDIUM"]
          }`}
        >
          {p.confidence ?? "MED"}
        </Badge>
      </div>

      {/* Time */}
      <span className="text-[10px] font-mono text-muted-foreground/50 min-w-[50px] text-right shrink-0 hidden md:block">
        <Clock className="h-2.5 w-2.5 inline mr-0.5 -mt-px" />
        {p.proofCreatedAt ? timeAgo(p.proofCreatedAt) : "--"}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
        <a
          href={`/?token=${p.mint}`}
          className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-foreground bg-muted/30 border border-border/30 rounded-sm hover:bg-muted/60 transition-colors"
        >
          <ExternalLink className="h-2.5 w-2.5" />
          Open
        </a>
        <a
          href={`/research?tab=leadtime&token=${p.mint}`}
          className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-primary border border-primary/30 rounded-sm hover:bg-primary/10 transition-colors"
        >
          Proof
        </a>
      </div>
    </div>
  )
}
