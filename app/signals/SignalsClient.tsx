"use client"

import { useState, useEffect, useCallback } from "react"
import { useAutoRefresh } from "@/lib/use-auto-refresh"
import { LiveIndicator } from "@/components/live-indicator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TokenDetailDrawer } from "@/components/token-detail-drawer"
import { TokenSparkline } from "@/components/token-sparkline"
import { TrendingUp, TrendingDown, Activity, ChevronDown, ChevronUp, Copy, Lock } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { TokenScore } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { DataFreshnessBar } from "@/components/data-freshness-bar"
import { usePro } from "@/lib/use-pro"

interface SignalOutcome {
  mint: string
  symbol: string
  name: string
  detectionType: "CROSS" | "FIRST_SEEN"
  detectedAt: number
  priceAtSignal: number
  priceNow: number
  priceChangePct24h: number
  scoreAtSignal: number
  scoreNow: number
  scoreDelta: number
  riskLabel: string
  liquidityAtSignal: number
  imageUrl?: string
}

interface DebugInfo {
  minScore: number
  tokensAnalyzed: number
  tokensWithAnyHistory: number
  tokensWithWindowHistory: number
  tokensWith2PlusSnapshots: number
  tokensCrossingThreshold: number
  tokensFirstSeenAboveThreshold: number
  tokensAnySnapshotAboveThreshold: number
  pushedSignalsCount: number
  pushedNearSignalsCount: number
  droppedInsufficientSnapshots: number
  droppedNoEvent: number
  exampleCross: { mint: string; prevScore: number; currScore: number; ts: number } | null
  exampleFirstSeen: { mint: string; score: number; ts: number } | null
  sampleSnapshotKeys: string[]
  newestSnapshotTs: number | null
  oldestSnapshotTs: number | null
  reasonIfEmpty: string
  deploymentId: string | null
  gitSha: string | null
  maxScoreInWindow: number
  exampleMaxScoreMint: string | null
  exampleMaxScoreValue: number | null
  exampleMaxScoreTs: number | null
  exampleMaxScoreRawKeys: string[]
}

function formatPrice(price: number): string {
  if (price >= 1) return `$${price.toFixed(4)}`
  if (price >= 0.0001) return `$${price.toFixed(6)}`
  return `$${price.toExponential(2)}`
}

function formatTimestamp(ts: number): string {
  const diff = Date.now() - ts
  const hours = Math.floor(diff / (60 * 60 * 1000))
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))
  
  if (hours > 0) return `${hours}h ${minutes}m ago`
  return `${minutes}m ago`
}

function SignalsTable({ 
  signals, 
  onRowClick,
  minScore 
}: { 
  signals: SignalOutcome[]
  onRowClick: (signal: SignalOutcome) => void
  minScore: number
}) {
  const { toast } = useToast()
  const { isPro } = usePro()
  const isProUser = isPro
  const FREE_PREVIEW_ROWS = 3
  return (
    <div className="rounded-none border bg-card/50 backdrop-blur-sm overflow-hidden">
      {/* ── MOBILE CARD LIST ── */}
      <div className="sm:hidden divide-y divide-border/30">
        {(isProUser ? signals : signals.slice(0, FREE_PREVIEW_ROWS)).map((signal) => {
          const isPos = signal.priceChangePct24h >= 0
          return (
            <button
              key={signal.mint}
              type="button"
              onClick={() => onRowClick(signal)}
              className="w-full text-left p-3 transition-colors active:bg-primary/5"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  {signal.imageUrl ? (
                    <Image
                      src={signal.imageUrl || "/placeholder.svg"}
                      alt={signal.symbol}
                      width={28}
                      height={28}
                      className="rounded-full w-7 h-7 ring-1 ring-border shrink-0"
                      unoptimized
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center ring-1 ring-border shrink-0">
                      <span className="text-[10px] font-bold">{signal.symbol.slice(0, 2)}</span>
                    </div>
                  )}
                  <span className="text-sm font-bold truncate">{signal.symbol}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {signal.detectionType === "FIRST_SEEN" ? (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">EARLY</span>
                  ) : signal.detectionType === "CROSS" ? (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">UPGRADED</span>
                  ) : (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">STRONG</span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold tabular-nums">
                    {signal.scoreAtSignal.toFixed(0)}
                  </span>
                  <span className="text-muted-foreground/40">{"\u2192"}</span>
                  <span className="font-semibold tabular-nums">{signal.scoreNow.toFixed(0)}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`font-bold tabular-nums ${isPos ? "text-green-400" : "text-red-400"}`}>
                    {isPos ? "+" : ""}{signal.priceChangePct24h.toFixed(1)}%
                  </span>
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    signal.riskLabel === "LOW RISK"
                      ? "bg-green-500/15 text-green-400 border border-green-500/30"
                      : signal.riskLabel === "MEDIUM RISK"
                        ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30"
                        : "bg-red-500/15 text-red-400 border border-red-500/30"
                  }`}>
                    {signal.riskLabel.replace(" RISK", "")}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* ── DESKTOP TABLE ── */}
      <div className="hidden sm:block overflow-x-auto -mx-4 px-4">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b-2">
                  <TableHead className="font-bold uppercase text-xs whitespace-nowrap">Token</TableHead>
                  <TableHead className="font-bold uppercase text-xs whitespace-nowrap">Type</TableHead>
                  <TableHead className="font-bold uppercase text-xs text-right whitespace-nowrap">Detected</TableHead>
                  <TableHead className="font-bold uppercase text-xs text-right whitespace-nowrap">Price @ Signal</TableHead>
                  <TableHead className="font-bold uppercase text-xs text-right whitespace-nowrap">Price Now</TableHead>
                  <TableHead className="font-bold uppercase text-xs text-right whitespace-nowrap">24h Δ</TableHead>
                  <TableHead className="font-bold uppercase text-xs whitespace-nowrap">Trend</TableHead>
                  <TableHead className="font-bold uppercase text-xs text-right whitespace-nowrap">Score @ Signal</TableHead>
                  <TableHead className="font-bold uppercase text-xs text-right whitespace-nowrap">Score Now</TableHead>
                  <TableHead className="font-bold uppercase text-xs text-right whitespace-nowrap">Score Δ</TableHead>
                  <TableHead className="font-bold uppercase text-xs whitespace-nowrap">Risk</TableHead>
                  <TableHead className="font-bold uppercase text-xs text-right whitespace-nowrap">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(isProUser ? signals : signals.slice(0, FREE_PREVIEW_ROWS)).map((signal, idx) => {
            const isPositive = signal.priceChangePct24h >= 0
            const scoreImproved = signal.scoreDelta > 0
            
            return (
              <TableRow
                key={signal.mint}
                onClick={() => onRowClick(signal)}
                className="transition-colors h-12 cursor-pointer hover:bg-muted/50"
              >
                {(
                <>
                {/* Token */}
                <TableCell className="font-medium align-middle py-3">
                  <div className="flex items-center gap-2.5">
                    {signal.imageUrl ? (
                      <Image
                        src={signal.imageUrl || "/placeholder.svg"}
                        alt={signal.symbol}
                        width={32}
                        height={32}
                        className="rounded-full w-8 h-8 ring-1 ring-border"
                        unoptimized
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center ring-1 ring-border">
                        <span className="text-xs font-bold">{signal.symbol.slice(0, 2)}</span>
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-sm truncate">{signal.symbol}</span>
                      <span className="text-xs text-muted-foreground truncate">{signal.name}</span>
                    </div>
                  </div>
                </TableCell>
                
                {/* Type Badge */}
                <TableCell className="align-middle py-3">
                  {signal.detectionType === "FIRST_SEEN" ? (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      EARLY DETECT
                    </span>
                  ) : signal.detectionType === "CROSS" ? (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                      UPGRADED
                    </span>
                  ) : signal.detectionType === "STRONG" ? (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                      STRONG SIGNAL
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground border border-border">
                      {signal.detectionType || "UNKNOWN"}
                    </span>
                  )}
                </TableCell>
                
                {/* Detected */}
                <TableCell className="text-xs font-mono text-muted-foreground align-middle py-3">
                  {formatTimestamp(signal.detectedAt)}
                </TableCell>

                {/* Price @ Signal */}
                <TableCell className="text-right font-mono text-sm align-middle py-3">
                  {formatPrice(signal.priceAtSignal)}
                </TableCell>

                {/* Price Now */}
                <TableCell className="text-right font-mono text-sm font-semibold align-middle py-3">
                  {formatPrice(signal.priceNow)}
                </TableCell>

                {/* 24h Δ */}
                <TableCell className="text-right align-middle py-3">
                  <div className={`flex items-center justify-end gap-1 font-mono font-bold text-sm ${
                    isPositive ? "text-green-400" : "text-red-400"
                  }`}>
                    {isPositive ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5" />
                    )}
                    {isPositive ? "+" : ""}{signal.priceChangePct24h.toFixed(1)}%
                  </div>
                </TableCell>

                {/* Trend Sparkline */}
                <TableCell className="align-middle py-3">
                  <TokenSparkline
                    values={[signal.scoreAtSignal, signal.scoreNow]}
                    height={18}
                    width={60}
                    color={isPositive ? "#22c55e" : "#ef4444"}
                  />
                </TableCell>

                {/* Score @ Signal */}
                <TableCell className="text-right align-middle py-3">
                  <span className="font-mono font-semibold text-sm px-2 py-1 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    {signal.scoreAtSignal.toFixed(0)}
                  </span>
                </TableCell>

                {/* Score Now */}
                <TableCell className="text-right align-middle py-3">
                  <div className="flex items-center justify-end gap-2 h-10">
                    <span className="font-mono font-semibold text-sm leading-none">
                      {signal.scoreNow.toFixed(0)}
                    </span>
                  </div>
                </TableCell>

                {/* Score Δ */}
                <TableCell className="text-right align-middle py-3">
                  <div className="flex items-center justify-end gap-2 h-10">
                    <span className={`font-mono text-sm leading-none ${
                      scoreImproved ? "text-green-400" : signal.scoreDelta < 0 ? "text-red-400" : "text-muted-foreground"
                    }`}>
                      {scoreImproved ? "+" : ""}{signal.scoreDelta.toFixed(0)}
                    </span>
                  </div>
                </TableCell>

                {/* Risk */}
                <TableCell className="align-middle py-3">
                  <div className="flex items-center justify-start gap-2 h-10">
                    <span className={`text-xs font-bold uppercase tracking-wider h-7 px-3 rounded inline-flex items-center ${
                      signal.riskLabel === "LOW RISK"
                        ? "bg-green-500/15 text-green-400 border border-green-500/30"
                        : signal.riskLabel === "MEDIUM RISK"
                          ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30"
                          : "bg-red-500/15 text-red-400 border border-red-500/30"
                    }`}>
                      {signal.riskLabel.replace(" RISK", "")}
                    </span>
                  </div>
                </TableCell>

                {/* Actions */}
                <TableCell className="align-middle py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      const proofText = `SOLRAD Signal (≥${signal.scoreAtSignal}) observed: ${signal.symbol} — 24h Δ: ${signal.priceChangePct24h >= 0 ? '+' : ''}${signal.priceChangePct24h.toFixed(1)}% | Score: ${signal.scoreAtSignal.toFixed(0)}→${signal.scoreNow.toFixed(0)} | Risk: ${signal.riskLabel} — Record: https://www.solrad.io/signals?minScore=${signal.scoreAtSignal}`
                      navigator.clipboard.writeText(proofText)
                      window.alert("Copied")
                    }}
                    className="h-7 px-2 hover:bg-muted"
                    title="Copy Proof"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
                </>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      </div>
      
      {/* Single locked overlay for non-pro users */}
      {!isProUser && signals.length > FREE_PREVIEW_ROWS && (
        <div className="relative mt-2">
          <div className="space-y-2 pointer-events-none select-none">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-14 rounded-lg bg-card/40 blur-[2px] opacity-50 border border-border/30" />
            ))}
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/60 backdrop-blur-sm rounded-lg border border-primary/20">
            <Lock className="text-primary" size={20} />
            <p className="text-sm font-bold uppercase tracking-wide">
              {signals.length - FREE_PREVIEW_ROWS} more signals locked
            </p>
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              Upgrade to Pro to see all signal outcomes with full price tracking and history
            </p>
            <a href="/pro" className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
              UNLOCK ALL SIGNALS
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

interface SignalOutcomesResponse {
  updatedAt: number
  minScore: number
  count: number
  signals: SignalOutcome[]
  nearCount: number
  nearSignals: SignalOutcome[]
  tokensAnalyzed: number
  debug?: DebugInfo
}

export function SignalsClient() {
  const [signals, setSignals] = useState<SignalOutcome[]>([])
  const [nearSignals, setNearSignals] = useState<SignalOutcome[]>([])
  const [minScore, setMinScore] = useState(70)
  const [updatedAt, setUpdatedAt] = useState<number>(Date.now())
  const [tokensAnalyzed, setTokensAnalyzed] = useState(0)
  const [debug, setDebug] = useState<DebugInfo | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedToken, setSelectedToken] = useState<TokenScore | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const { toast } = useToast()

  // Check if debug panel should be visible
  useEffect(() => {
    // Check for ?debug=1 query param
    const urlParams = new URLSearchParams(window.location.search)
    const debugParam = urlParams.get("debug") === "1"
    
    // Check admin status from sessionStorage
    const adminAuth = sessionStorage.getItem("adminAuth") === "true"
    setIsAdmin(adminAuth)
    
    // Show debug panel if either condition is met
    setShowDebugPanel(debugParam || adminAuth)
  }, [])

  const fetchSignals = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch(
        `/api/signal-outcomes?sort=priceChangePct24h&limit=50&minScore=${minScore}&t=${Date.now()}`,
        { signal }
      )
      const data: SignalOutcomesResponse = await res.json()
      setSignals(data.signals || [])
      setNearSignals(data.nearSignals || [])
      setUpdatedAt(data.updatedAt)
      setTokensAnalyzed(data.tokensAnalyzed)
      setDebug(data.debug || null)
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return
      console.error("[v0] Failed to fetch signals:", error)
    } finally {
      setLoading(false)
    }
  }, [minScore])

  const { lastUpdatedAt: liveUpdatedAt, isRefreshing, refreshNow } = useAutoRefresh({
    intervalMs: 15_000,
    onTick: fetchSignals,
  })

  // Initial load
  useEffect(() => {
    fetchSignals()
  }, [fetchSignals])

  const handleRowClick = async (signal: SignalOutcome) => {
    try {
      // Fetch full token data for drawer
      const res = await fetch(`/api/tokens?address=${signal.mint}`)
      const data = await res.json()
      
      if (data.token) {
        // Phase C1: Enrich with signal rationale
        const { deriveSignalRationale } = await import("@/lib/signals/deriveSignalRationale")
        const enrichedToken = {
          ...data.token,
          _rationale: deriveSignalRationale(data.token),
        }
        setSelectedToken(enrichedToken)
        setDrawerOpen(true)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch token details:", error)
    }
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          {/* Page Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Activity className="h-8 w-8 text-primary" />
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Signal Outcomes</h1>
                <LiveIndicator lastUpdatedAt={liveUpdatedAt} isRefreshing={isRefreshing} onRefresh={refreshNow} />
              </div>

              {/* Threshold Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden lg:inline">Threshold:</span>
                <div className="flex gap-1">
                  {[60, 65, 70, 75, 80].map((threshold) => (
                    <button
                      key={threshold}
                      onClick={() => setMinScore(threshold)}
                      className={`px-2.5 py-1 text-xs font-bold rounded transition-all ${
                        minScore === threshold
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {threshold}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Data Freshness Bar */}
            <DataFreshnessBar
              updatedAt={updatedAt}
              itemCount={signals.length}
              itemLabel="signals"
              metadata={[
                { label: "Threshold", value: minScore },
                { label: "Analyzed", value: tokensAnalyzed },
              ]}
            />
            
            <p className="text-muted-foreground text-sm md:text-base max-w-3xl">
              Signal Outcomes documents historical instances where specific on-chain and market conditions were observed. 
              Tokens listed scored ≥{minScore} on the SOLRAD quality index within the observation window. 
              This page tracks what followed after those observations. Click any row to view full token details.
            </p>
            <p className="text-xs text-muted-foreground/60 italic">
              Outcomes vary. Some signals may not lead to significant movement. Market conditions change rapidly. 
              Data completeness depends on liquidity and source availability. Not financial advice.
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground text-sm animate-pulse">Loading signal outcomes...</div>
            </div>
          )}

          {/* Empty State */}
          {!loading && signals.length === 0 && nearSignals.length === 0 && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-12 space-y-2">
                <Activity className="h-12 w-12 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">No tokens ≥{minScore} yet.</p>
                <p className="text-xs text-muted-foreground/60">Try lowering the threshold or check back soon as new tokens are tracked.</p>
              </div>
              
              {/* Debug Panel - Only visible with ?debug=1 or admin auth */}
              {debug && showDebugPanel && (
                <div className="rounded-none border bg-card/30 p-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDebug(!showDebug)}
                    className="w-full flex items-center justify-between hover:bg-muted/50"
                  >
                    <span className="text-xs font-mono font-bold uppercase">Debug Info</span>
                    {showDebug ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                  
                  {showDebug && (
                    <div className="mt-3 space-y-2 text-xs font-mono">
                      <div className="text-muted-foreground font-bold mb-2 pb-1 border-b">Hybrid Detection Pipeline:</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className="text-muted-foreground">Tokens Analyzed:</span> {debug.tokensAnalyzed}</div>
                        <div><span className="text-muted-foreground">With History:</span> {debug.tokensWithAnyHistory}</div>
                        <div><span className="text-muted-foreground">In 24h Window:</span> {debug.tokensWithWindowHistory}</div>
                        <div><span className="text-muted-foreground">With 2+ Snapshots:</span> {debug.tokensWith2PlusSnapshots}</div>
                        <div className={debug.tokensAnySnapshotAboveThreshold > 0 ? "text-green-400" : ""}>
                          <span className="text-muted-foreground">Any Above {debug.minScore}:</span> {debug.tokensAnySnapshotAboveThreshold}
                        </div>
                        <div><span className="text-muted-foreground">Min Score:</span> {debug.minScore}</div>
                      </div>
                      
                      <div className="text-muted-foreground font-bold mb-2 pb-1 border-b pt-2">Detection Results:</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className={debug.tokensCrossingThreshold > 0 ? "text-emerald-400" : ""}>
                          <span className="text-muted-foreground">CROSS (↗):</span> {debug.tokensCrossingThreshold}
                        </div>
                        <div className={debug.tokensFirstSeenAboveThreshold > 0 ? "text-blue-400" : ""}>
                          <span className="text-muted-foreground">FIRST_SEEN (●):</span> {debug.tokensFirstSeenAboveThreshold}
                        </div>
                        <div className={debug.pushedSignalsCount > 0 ? "text-green-400" : ""}>
                          <span className="text-muted-foreground">Total Signals:</span> {debug.pushedSignalsCount}
                        </div>
                        <div className={debug.pushedNearSignalsCount > 0 ? "text-yellow-400" : ""}>
                          <span className="text-muted-foreground">Near-Signals:</span> {debug.pushedNearSignalsCount}
                        </div>
                        <div className={debug.droppedNoEvent > 0 ? "text-orange-400" : ""}>
                          <span className="text-muted-foreground">No Event:</span> {debug.droppedNoEvent}
                        </div>
                        <div className={debug.droppedInsufficientSnapshots > 0 ? "text-orange-400" : ""}>
                          <span className="text-muted-foreground">Insufficient Data:</span> {debug.droppedInsufficientSnapshots}
                        </div>
                      </div>
                      
                      {debug.exampleCross && (
                        <div className="pt-2 border-t">
                          <div className="text-muted-foreground font-bold mb-1">Example CROSS Event (↗):</div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="col-span-2 text-emerald-400">
                              <span className="text-muted-foreground">Mint:</span> {debug.exampleCross.mint.slice(0, 8)}...
                            </div>
                            <div>
                              <span className="text-muted-foreground">Prev Score:</span> {debug.exampleCross.prevScore.toFixed(1)}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Curr Score:</span> {debug.exampleCross.currScore.toFixed(1)}
                            </div>
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Time:</span> {formatTimestamp(debug.exampleCross.ts)}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {debug.exampleFirstSeen && (
                        <div className="pt-2 border-t">
                          <div className="text-muted-foreground font-bold mb-1">Example FIRST_SEEN Event (●):</div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="col-span-2 text-blue-400">
                              <span className="text-muted-foreground">Mint:</span> {debug.exampleFirstSeen.mint.slice(0, 8)}...
                            </div>
                            <div>
                              <span className="text-muted-foreground">Score:</span> {debug.exampleFirstSeen.score.toFixed(1)}
                            </div>
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Time:</span> {formatTimestamp(debug.exampleFirstSeen.ts)}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {debug.newestSnapshotTs && (
                        <div><span className="text-muted-foreground">Newest Snapshot:</span> {formatTimestamp(debug.newestSnapshotTs)}</div>
                      )}
                      {debug.oldestSnapshotTs && (
                        <div><span className="text-muted-foreground">Oldest Snapshot:</span> {formatTimestamp(debug.oldestSnapshotTs)}</div>
                      )}
                      
                      {debug.maxScoreInWindow > 0 && (
                        <div className="pt-2 border-t">
                          <div className="text-muted-foreground font-bold mb-1">Max Score Found in Window:</div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Value:</span> <span className="text-yellow-400 font-bold">{debug.exampleMaxScoreValue?.toFixed(1)}</span>
                            </div>
                            {debug.exampleMaxScoreMint && (
                              <div className="col-span-2 text-[10px]">
                                <span className="text-muted-foreground">Mint:</span> {debug.exampleMaxScoreMint.slice(0, 8)}...
                              </div>
                            )}
                            {debug.exampleMaxScoreTs && (
                              <div className="col-span-2 text-[10px]">
                                <span className="text-muted-foreground">Time:</span> {formatTimestamp(debug.exampleMaxScoreTs)}
                              </div>
                            )}
                            {debug.exampleMaxScoreRawKeys.length > 0 && (
                              <div className="col-span-2 text-[10px]">
                                <span className="text-muted-foreground">Fields:</span> {debug.exampleMaxScoreRawKeys.slice(0, 15).join(", ")}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {(debug.deploymentId || debug.gitSha) && (
                        <div className="pt-2 border-t">
                          <div className="text-muted-foreground font-bold mb-1">Deployment Info:</div>
                          <div className="grid grid-cols-1 gap-1">
                            {debug.deploymentId && (
                              <div className="text-[10px] font-mono">
                                <span className="text-muted-foreground">Deployment ID:</span> {debug.deploymentId.slice(0, 16)}...
                              </div>
                            )}
                            {debug.gitSha && (
                              <div className="text-[10px] font-mono">
                                <span className="text-muted-foreground">Git SHA:</span> {debug.gitSha.slice(0, 8)}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {debug.sampleSnapshotKeys.length > 0 && (
                        <div className="pt-2 border-t">
                          <div className="text-muted-foreground mb-1">Sample Snapshot Keys:</div>
                          <div className="text-[10px] break-all text-muted-foreground/70">
                            {debug.sampleSnapshotKeys.join(", ")}
                          </div>
                        </div>
                      )}
                      
                      {debug.reasonIfEmpty && (
                        <div className="pt-2 border-t">
                          <div className="text-muted-foreground mb-1">Reason:</div>
                          <div className="text-yellow-500">{debug.reasonIfEmpty}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Empty Signals but has Near Signals */}
          {!loading && signals.length === 0 && nearSignals.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-8 space-y-2">
                <Activity className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">No tokens ≥{minScore} yet</p>
                <p className="text-xs text-muted-foreground/60">But {nearSignals.length} tokens are close ({minScore - 5} to {minScore - 0.1})</p>
              </div>
            </div>
          )}

          {/* Proof Highlights */}
          {!loading && signals.length > 0 && (() => {
            const topWinners = [...signals].sort((a, b) => b.priceChangePct24h - a.priceChangePct24h).slice(0, 3)
            const topLosers = [...signals].sort((a, b) => a.priceChangePct24h - b.priceChangePct24h).slice(0, 3)
            
            return (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Observed Highlights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Top Winners */}
                  <div className="rounded-none border bg-card/50 backdrop-blur-sm p-4 space-y-3">
                    <h4 className="text-sm font-bold uppercase tracking-tight text-green-400">Largest Positive Movement (24h)</h4>
                    <div className="space-y-2">
                      {topWinners.map((signal) => (
                        <div
                          key={signal.mint}
                          onClick={() => handleRowClick(signal)}
                          className="flex items-center justify-between gap-3 p-2 rounded-lg bg-background/50 border border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {signal.imageUrl ? (
                              <Image
                                src={signal.imageUrl || "/placeholder.svg"}
                                alt={signal.symbol}
                                width={24}
                                height={24}
                                className="rounded-full w-6 h-6 ring-1 ring-border flex-shrink-0"
                                unoptimized
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center ring-1 ring-border flex-shrink-0">
                                <span className="text-[10px] font-bold">{signal.symbol.slice(0, 2)}</span>
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-xs truncate">{signal.symbol}</div>
                              <div className="text-[10px] text-muted-foreground truncate">{signal.name}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="text-xs font-mono font-bold text-green-400">
                              +{signal.priceChangePct24h.toFixed(1)}%
                            </div>
                            <div className="text-[10px] font-mono text-muted-foreground">
                              {signal.scoreAtSignal.toFixed(0)}→{signal.scoreNow.toFixed(0)}
                            </div>
                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              signal.riskLabel === "LOW RISK"
                                ? "bg-green-500/15 text-green-400 border border-green-500/30"
                                : signal.riskLabel === "MEDIUM RISK"
                                  ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30"
                                  : "bg-red-500/15 text-red-400 border border-red-500/30"
                            }`}>
                              {signal.riskLabel.replace(" RISK", "")[0]}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Top Losers */}
                  <div className="rounded-none border bg-card/50 backdrop-blur-sm p-4 space-y-3">
                    <h4 className="text-sm font-bold uppercase tracking-tight text-red-400">Largest Negative Movement (24h)</h4>
                    <div className="space-y-2">
                      {topLosers.map((signal) => (
                        <div
                          key={signal.mint}
                          onClick={() => handleRowClick(signal)}
                          className="flex items-center justify-between gap-3 p-2 rounded-lg bg-background/50 border border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {signal.imageUrl ? (
                              <Image
                                src={signal.imageUrl || "/placeholder.svg"}
                                alt={signal.symbol}
                                width={24}
                                height={24}
                                className="rounded-full w-6 h-6 ring-1 ring-border flex-shrink-0"
                                unoptimized
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center ring-1 ring-border flex-shrink-0">
                                <span className="text-[10px] font-bold">{signal.symbol.slice(0, 2)}</span>
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-xs truncate">{signal.symbol}</div>
                              <div className="text-[10px] text-muted-foreground truncate">{signal.name}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="text-xs font-mono font-bold text-red-400">
                              {signal.priceChangePct24h.toFixed(1)}%
                            </div>
                            <div className="text-[10px] font-mono text-muted-foreground">
                              {signal.scoreAtSignal.toFixed(0)}→{signal.scoreNow.toFixed(0)}
                            </div>
                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              signal.riskLabel === "LOW RISK"
                                ? "bg-green-500/15 text-green-400 border border-green-500/30"
                                : signal.riskLabel === "MEDIUM RISK"
                                  ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30"
                                  : "bg-red-500/15 text-red-400 border border-red-500/30"
                            }`}>
                              {signal.riskLabel.replace(" RISK", "")[0]}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Main Signals Table */}
          {!loading && signals.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold uppercase tracking-tight text-primary">
                Observed Signals (≥{minScore})
              </h2>
              <SignalsTable signals={signals} onRowClick={handleRowClick} minScore={minScore} />
            </div>
          )}
          
          {/* Near Signals Table */}
          {!loading && nearSignals.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <h2 className="text-lg font-bold uppercase tracking-tight text-muted-foreground">
                  Near Signals ({minScore - 5}–{minScore - 0.1})
                </h2>
                <span className="text-xs text-muted-foreground/60">({nearSignals.length} tokens close to threshold)</span>
              </div>
              <SignalsTable signals={nearSignals} onRowClick={handleRowClick} minScore={minScore} />
            </div>
          )}

          {/* Debug Panel - Only visible with ?debug=1 or admin auth */}
          {!loading && debug && showDebugPanel && signals.length > 0 && (
            <div className="rounded-none border bg-card/30 p-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDebug(!showDebug)}
                className="w-full flex items-center justify-between hover:bg-muted/50"
              >
                <span className="text-xs font-mono font-bold uppercase">Debug Info (Signals Present)</span>
                {showDebug ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              
              {showDebug && (
                <div className="mt-3 space-y-2 text-xs font-mono">
                  <div className="text-muted-foreground font-bold mb-2 pb-1 border-b">Signal Detection:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-muted-foreground">Tokens Analyzed:</span> {debug.tokensAnalyzed}</div>
                    <div><span className="text-muted-foreground">Signals Pushed:</span> {debug.pushedSignalsCount}</div>
                    <div><span className="text-muted-foreground">FIRST_SEEN:</span> {debug.tokensFirstSeenAboveThreshold}</div>
                    <div><span className="text-muted-foreground">Any Above Threshold:</span> {debug.tokensAnySnapshotAboveThreshold}</div>
                  </div>
                  
                  {debug.maxScoreInWindow > 0 && (
                    <div className="pt-2 border-t">
                      <div className="text-muted-foreground">Max Score in Window: <span className="text-yellow-400 font-bold">{debug.maxScoreInWindow.toFixed(1)}</span></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Market Snapshot */}
          {!loading && signals.length > 0 && (() => {
            const positiveCount = signals.filter(s => s.priceChangePct24h > 0.25).length
            const negativeCount = signals.filter(s => s.priceChangePct24h < -0.25).length
            const neutralCount = signals.filter(s => Math.abs(s.priceChangePct24h) < 0.25).length
            const avgDelta = signals.reduce((sum, s) => sum + s.priceChangePct24h, 0) / signals.length
            
            return (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Market Snapshot</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="p-3 rounded-lg bg-card/50 border">
                    <div className="text-xs text-muted-foreground mb-1">Total Signals</div>
                    <div className="text-2xl font-bold font-mono">{signals.length}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-card/50 border">
                    <div className="text-xs text-muted-foreground mb-1">Positive Outcomes</div>
                    <div className="text-2xl font-bold font-mono text-green-400">
                      {positiveCount}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-card/50 border">
                    <div className="text-xs text-muted-foreground mb-1">Neutral Outcomes</div>
                    <div className="text-2xl font-bold font-mono text-yellow-400">
                      {neutralCount}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-card/50 border">
                    <div className="text-xs text-muted-foreground mb-1">Negative Outcomes</div>
                    <div className="text-2xl font-bold font-mono text-red-400">
                      {negativeCount}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-card/50 border">
                    <div className="text-xs text-muted-foreground mb-1">Avg 24h Δ</div>
                    <div className={`text-2xl font-bold font-mono ${
                      avgDelta >= 0 ? "text-green-400" : "text-red-400"
                    }`}>
                      {avgDelta.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Proof KPIs */}
          {!loading && signals.length > 0 && (() => {
            const positiveSignals = signals.filter(s => s.priceChangePct24h > 0)
            const winRate = (positiveSignals.length / signals.length) * 100
            
            const sortedDeltas = [...signals].map(s => s.priceChangePct24h).sort((a, b) => a - b)
            const medianDelta = sortedDeltas.length % 2 === 0
              ? (sortedDeltas[sortedDeltas.length / 2 - 1] + sortedDeltas[sortedDeltas.length / 2]) / 2
              : sortedDeltas[Math.floor(sortedDeltas.length / 2)]
            
            const avgDelta = signals.reduce((sum, s) => sum + s.priceChangePct24h, 0) / signals.length
            
            const bestSignal = signals.reduce((best, s) => 
              s.priceChangePct24h > best.priceChangePct24h ? s : best
            , signals[0])
            
            return (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Observed Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-card/50 border">
                    <div className="text-xs text-muted-foreground mb-1">Positive Rate</div>
                    <div className={`text-2xl font-bold font-mono ${
                      winRate >= 50 ? "text-green-400" : "text-red-400"
                    }`}>
                      {winRate.toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                      {positiveSignals.length}/{signals.length} positive
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-card/50 border">
                    <div className="text-xs text-muted-foreground mb-1">Median 24h Δ</div>
                    <div className={`text-2xl font-bold font-mono ${
                      medianDelta >= 0 ? "text-green-400" : "text-red-400"
                    }`}>
                      {medianDelta >= 0 ? "+" : ""}{medianDelta.toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                      middle value
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-card/50 border">
                    <div className="text-xs text-muted-foreground mb-1">Avg 24h Δ</div>
                    <div className={`text-2xl font-bold font-mono ${
                      avgDelta >= 0 ? "text-green-400" : "text-red-400"
                    }`}>
                      {avgDelta >= 0 ? "+" : ""}{avgDelta.toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                      mean across all
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-card/50 border">
                    <div className="text-xs text-muted-foreground mb-1">Max 24h Δ</div>
                    <div className="text-2xl font-bold font-mono text-green-400">
                      +{bestSignal.priceChangePct24h.toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">
                      {bestSignal.symbol}
                    </div>
                  </div>
                </div>
              </div>
  )
  })()}
  </div>

      {/* Token Detail Drawer */}
      {selectedToken && (
        <TokenDetailDrawer
          token={selectedToken}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
        />
      )}
    </>
  )
}
