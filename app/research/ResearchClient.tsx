"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useAutoRefresh } from "@/lib/use-auto-refresh"
import { LiveIndicator } from "@/components/live-indicator"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { ProofEngineOnboarding } from "@/components/proof-engine-onboarding"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  FlaskConical, TrendingUp, TrendingDown, Shield, Search,
  Download, Share2, Activity, Target, BarChart3, Check,
  Clock, CheckCircle2, AlertTriangle, BookOpen, Lock,
  RefreshCw, Copy, Minus, ExternalLink, Timer, ScanSearch,
  Fingerprint,
} from "lucide-react"
import Link from "next/link"
import { ProofSummaryDrawer, type DrawerPayload } from "./proof-summary-drawer"
import { AlertsTab } from "./alerts-tab"
import { usePro } from "@/lib/use-pro"

// ────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────

interface ResearchReport {
  type: string
  slug: string
  date: string
  title: string
  summary: string
  tags: string[]
  relatedTokens: string[]
}

interface LedgerEntry {
  id: string
  mint: string
  symbol: string
  name?: string
  detectedAt: string
  detectionType: string
  scoreAtSignal?: number
  scoreNow?: number
  priceAtSignal: number
  priceNow: number
  pct24h?: number
  pct7d?: number
  pct30d?: number
  outcome: "win" | "loss" | "neutral"
  source: string
  notes?: string
  voided?: boolean
  voidReason?: string
  createdAt: string
  entryHash?: string
  // On-chain evidence (optional)
  slot?: number
  blockTime?: number
  txSig?: string
  sourceRpc?: string
}

interface LedgerMetrics {
  totalTracked: number
  winRate: number
  lossRate: number
  neutralRate: number
  avg7d: number
  avg24h: number
  trackedSince: string | null
  lastUpdated: string | null
}

interface LedgerResponse {
  ok: boolean
  entries: LedgerEntry[]
  totalFiltered: number
  metrics: LedgerMetrics | null
}

interface LeadTimeLedgerRow {
  id: string
  mint: string
  symbol: string
  name: string
  logo: string | null
  observedAt: string
  observationEvent: string
  reactionEvent: string
  leadSeconds: number
  leadBlocks: number
  confidence: number
  // On-chain evidence (optional)
  observationSlot?: number
  observationBlockTime?: number
  reactionSlot?: number
  reactionBlockTime?: number
  sourceRpc?: string
}

interface LeadTimeResponse {
  ok: boolean
  rows: LeadTimeLedgerRow[]
  total: number
  meta: { range: string; confidence?: string; generatedAt: string }
  _debug?: {
    totalBeforeFilters: number
    afterRange: number
    afterConfidence: number
    afterSearch: number
    rangeUsed: string
    confidenceUsed: string
    minConfidence: number
  }
}

// ────────────────────────────────────────────
// HEALTH STRIP
// ────────────────────────────────────────────

interface HealthData {
  ok: boolean
  now: string
  latencyMs: number
  alpha: {
    lastHarvestAt: string | null
    lastHarvestAgoSec: number | null
    lastUpdateAt?: string | null
    lastUpdateAgoSec?: number | null
    entries30d: number
    uniqueMints30d?: number
    voidedCount?: number
    invalidCount?: number
    ledgerHash?: string | null
    hashUpdatedAt?: number | null
    hashEntryCount?: number | null
    status: "OK" | "DEGRADED" | "UNKNOWN"
    statusReason?: string
  }
  lead: {
    lastProofAt: string | null
    lastProofAgoSec: number | null
    proofs30d: number
    uniqueMints30d?: number
    status: "OK" | "DEGRADED" | "UNKNOWN"
    statusReason?: string
  }
  kv: { status: "OK" | "DEGRADED" | "UNKNOWN" }
  overall: { status: "OK" | "DEGRADED" | "UNKNOWN"; reason?: string }
  harvest?: {
    lastRunAt: number | null
    lastSuccessAt: number | null
    lastErrorAt: number | null
    lastStatus: string | null
    lastProcessedCount: number | null
  }
}

function useHealthPolling(intervalMs = 60_000) {
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const lastGoodRef = useRef<HealthData | null>(null)

  useEffect(() => {
    let mounted = true
    const doFetch = async () => {
      try {
        const res = await fetch("/api/proof-engine-health")
        if (!res.ok) throw new Error(`${res.status}`)
        const json: HealthData = await res.json()
        if (mounted) {
          setData(json)
          lastGoodRef.current = json
          setLoading(false)
        }
      } catch {
        // Keep last good values, mark degraded
        if (mounted) {
          if (lastGoodRef.current) {
            setData({ ...lastGoodRef.current, overall: { status: "DEGRADED" } })
          }
          setLoading(false)
        }
      }
    }
    doFetch()
    const id = setInterval(doFetch, intervalMs)
    return () => { mounted = false; clearInterval(id) }
  }, [intervalMs])

  return { data, loading }
}

function fmtAgo(sec: number | null | undefined): string {
  if (sec === null || sec === undefined || !Number.isFinite(sec)) return "Unknown"
  if (sec < 60) return `${sec}s ago`
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`
  return `${Math.floor(sec / 86400)}d ago`
}

function StatusDot({ status }: { status: "OK" | "DEGRADED" | "UNKNOWN" }) {
  const color = status === "OK" ? "bg-green-500" : status === "DEGRADED" ? "bg-amber-500" : "bg-muted-foreground/40"
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${color} shrink-0`} />
}

function HealthStrip({ data, loading }: { data: HealthData | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center gap-3 px-3 py-2 border border-border/20 rounded-sm bg-card/30 mb-4 animate-pulse">
        <div className="h-3 w-20 bg-muted/30 rounded" />
        <div className="h-3 w-24 bg-muted/30 rounded" />
        <div className="h-3 w-16 bg-muted/30 rounded" />
        <div className="h-3 w-20 bg-muted/30 rounded" />
      </div>
    )
  }
  if (!data) return null

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-3 py-2 border border-border/20 rounded-sm bg-card/30 mb-4 text-[10px] font-mono">
      {/* Alpha */}
      <div className="flex items-center gap-1.5">
        <StatusDot status={data.alpha.status} />
        <span className="text-muted-foreground/60">Alpha</span>
        <span className="text-foreground/80">{fmtAgo(data.alpha.lastUpdateAgoSec ?? data.alpha.lastHarvestAgoSec)}</span>
        <span className="text-muted-foreground/40">|</span>
        <span className="text-foreground/70">{data.alpha.entries30d}<span className="text-muted-foreground/50 ml-0.5">30d</span></span>
      </div>

      {/* Lead-Time */}
      <div className="flex items-center gap-1.5">
        <StatusDot status={data.lead.status} />
        <span className="text-muted-foreground/60">Lead</span>
        <span className="text-foreground/80">{fmtAgo(data.lead.lastProofAgoSec)}</span>
        <span className="text-muted-foreground/40">|</span>
        <span className="text-foreground/70">{data.lead.proofs30d}<span className="text-muted-foreground/50 ml-0.5">30d</span></span>
      </div>

      {/* KV */}
      <div className="flex items-center gap-1.5">
        <StatusDot status={data.kv.status} />
        <span className="text-muted-foreground/60">KV</span>
        <span className="text-foreground/70">{data.latencyMs}ms</span>
      </div>

      {/* Overall */}
      <div className="flex items-center gap-1.5 ml-auto">
        <StatusDot status={data.overall.status} />
        <span className={`font-semibold tracking-wider ${data.overall.status === "OK" ? "text-green-400/80" : data.overall.status === "DEGRADED" ? "text-amber-400/80" : "text-muted-foreground/50"}`}>
          {data.overall.status}
        </span>
        {data.overall.reason && (
          <span className="relative group">
            <span className="text-muted-foreground/30 hover:text-muted-foreground/60 cursor-help transition-colors text-[9px]">i</span>
            <span className="absolute bottom-full right-0 mb-1 px-2 py-1 rounded bg-popover border border-border/30 text-[9px] font-mono text-muted-foreground/70 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 shadow-md">
              {data.overall.reason}
            </span>
          </span>
        )}
      </div>
    </div>
  )
}

function IntegrityStrip({ data, loading }: { data: HealthData | null; loading: boolean }) {
  if (loading || !data) return null

  const s = (v: number | undefined | null): string =>
    v !== undefined && v !== null && Number.isFinite(v) ? String(v) : "\u2014"

  const alphaTokens = data.alpha.uniqueMints30d
  const alphaSignals = data.alpha.entries30d
  const voided = data.alpha.voidedCount
  const invalid = data.alpha.invalidCount
  const leadTokens = data.lead.uniqueMints30d
  const leadProofs = data.lead.proofs30d

  // Compute stale gap label
  const staleGap = data.alpha.lastHarvestAgoSec
  let staleLabel: string | null = null
  let staleWarn = false
  if (staleGap !== null && staleGap !== undefined && Number.isFinite(staleGap)) {
    if (staleGap > 7200) {
      staleLabel = fmtAgo(staleGap)
      staleWarn = true
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-1.5 border border-border/15 rounded-sm bg-card/20 mb-4 text-[10px] font-mono">
      {/* Coverage */}
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground/40">Coverage</span>
        <span className="text-foreground/70">{s(alphaTokens)}<span className="text-muted-foreground/40 ml-0.5">tokens</span></span>
        <span className="text-muted-foreground/25">/</span>
        <span className="text-foreground/70">{s(alphaSignals)}<span className="text-muted-foreground/40 ml-0.5">signals</span></span>
        <span className="text-muted-foreground/25">/</span>
        <span className="text-foreground/70">{s(leadTokens)}<span className="text-muted-foreground/40 ml-0.5">lt-tokens</span></span>
        <span className="text-muted-foreground/25">/</span>
        <span className="text-foreground/70">{s(leadProofs)}<span className="text-muted-foreground/40 ml-0.5">proofs</span></span>
      </div>

      {/* Hygiene */}
      {(voided !== undefined || invalid !== undefined) && (
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground/40">Hygiene</span>
          {voided !== undefined && (
            <span className={voided > 0 ? "text-amber-400/70" : "text-foreground/60"}>
              {s(voided)}<span className="text-muted-foreground/40 ml-0.5">voided</span>
            </span>
          )}
          {invalid !== undefined && (
            <>
              <span className="text-muted-foreground/25">/</span>
              <span className={invalid > 0 ? "text-amber-400/70" : "text-foreground/60"}>
                {s(invalid)}<span className="text-muted-foreground/40 ml-0.5">invalid</span>
              </span>
            </>
          )}
        </div>
      )}

      {/* Stale warning */}
      {staleLabel && (
        <div className="flex items-center gap-1.5 ml-auto">
          <span className={staleWarn ? "text-amber-400/70" : "text-muted-foreground/50"}>
            Stale: {staleLabel}
          </span>
        </div>
      )}
    </div>
  )
}

function truncateHash(hash: string): string {
  if (hash.length <= 16) return hash
  return `${hash.slice(0, 8)}\u2026${hash.slice(-6)}`
}

function LedgerHashLine({ data, loading }: { data: HealthData | null; loading: boolean }) {
  if (loading || !data) return null
  const hash = data.alpha.ledgerHash
  const count = data.alpha.hashEntryCount
  const updatedAt = data.alpha.hashUpdatedAt

  let agoLabel = "\u2014"
  if (updatedAt && Number.isFinite(updatedAt)) {
    const sec = Math.round((Date.now() - updatedAt) / 1000)
    agoLabel = fmtAgo(sec)
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1 border border-border/10 rounded-sm bg-card/10 mb-4 text-[10px] font-mono text-muted-foreground/50">
      <span className="text-muted-foreground/40">Ledger Hash</span>
      <span className="text-foreground/60 tabular-nums select-all" title={hash ?? undefined}>
        {hash ? truncateHash(hash) : "\u2014"}
      </span>
      <span className="text-muted-foreground/25">|</span>
      <span>
        {count != null && Number.isFinite(count) ? count : "\u2014"}
        <span className="text-muted-foreground/40 ml-0.5">entries</span>
      </span>
      <span className="text-muted-foreground/25">|</span>
      <span>{agoLabel}</span>
    </div>
  )
}

// ────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────

function fmtPrice(p: number): string {
  if (!p || !Number.isFinite(p)) return "--"
  if (p < 0.0001) return `$${p.toExponential(2)}`
  if (p < 1) return `$${p.toFixed(6)}`
  return `$${p.toFixed(2)}`
}

function fmtPct(p: number | undefined | null): string {
  if (p === undefined || p === null || !Number.isFinite(p)) return "--"
  const sign = p >= 0 ? "+" : ""
  return `${sign}${p.toFixed(1)}%`
}

function pctColor(p: number | undefined | null): string {
  if (p === undefined || p === null || !Number.isFinite(p)) return "text-muted-foreground"
  if (p >= 15) return "text-green-400"
  if (p > 0) return "text-green-400/70"
  if (p <= -15) return "text-red-400"
  if (p < 0) return "text-red-400/70"
  return "text-muted-foreground"
}

function outcomeBadge(o: string) {
  if (o === "win")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-mono font-semibold tracking-wide">WIN</span>
  if (o === "loss")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-mono font-semibold tracking-wide">LOSS</span>
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-muted text-muted-foreground border border-border/50 text-[10px] font-mono font-semibold tracking-wide">NEUTRAL</span>
}

function confidenceBadge(c: number) {
  if (c >= 80)
    return <span className="inline-flex items-center px-2 py-0.5 rounded-sm bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-mono font-semibold">HIGH</span>
  if (c >= 50)
    return <span className="inline-flex items-center px-2 py-0.5 rounded-sm bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono font-semibold">MED</span>
  return <span className="inline-flex items-center px-2 py-0.5 rounded-sm bg-muted text-muted-foreground border border-border/50 text-[10px] font-mono font-semibold">LOW</span>
}

function fmtLeadTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}

function fmtObservationType(t: string): string {
  return t
    .replace(/_/g, " ")
    .replace(/signal upgrade /i, "")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

function exportCSV(entries: LedgerEntry[]) {
  const header = "Symbol,Mint,DetectedAt,Type,EntryPrice,CurrentPrice,24h%,7d%,30d%,Outcome,Source\n"
  const rows = entries.map((e) =>
    [
      e.symbol, e.mint, e.detectedAt, e.detectionType,
      e.priceAtSignal, e.priceNow,
      e.pct24h ?? "", e.pct7d ?? "", e.pct30d ?? "",
      e.outcome, e.source,
    ].join(","),
  )
  const blob = new Blob([header + rows.join("\n")], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `solrad-alpha-ledger-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function exportLeadTimeCSV(rows: LeadTimeLedgerRow[]) {
  const header = "Symbol,Mint,ObservedAt,Observation,Reaction,LeadSeconds,LeadBlocks,Confidence\n"
  const csvRows = rows.map((r) =>
    [r.symbol, r.mint, r.observedAt, r.observationEvent, r.reactionEvent, r.leadSeconds, r.leadBlocks, r.confidence].join(","),
  )
  const blob = new Blob([header + csvRows.join("\n")], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `solrad-leadtime-ledger-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function shareRow(entry: LedgerEntry) {
  const pctVal = entry.pct7d ?? entry.pct24h
  const pctLabel = entry.pct7d !== undefined ? "7D" : "24h"
  const pctStr = pctVal !== undefined ? `${pctVal >= 0 ? "+" : ""}${pctVal.toFixed(1)}% (${pctLabel})` : ""
  const dateStr = new Date(entry.detectedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  const text = `$${entry.symbol} ${pctStr}\nDetected: ${dateStr} via ${entry.detectionType}\n\nVerify: https://www.solrad.io/research?tab=ledger`
  navigator.clipboard.writeText(text)
}

function relativeTime(iso: string | null): string {
  if (!iso) return ""
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function detectionBadge(type: string) {
  const map: Record<string, { label: string; cls: string }> = {
    FIRST_SEEN: { label: "EARLY DETECT", cls: "bg-primary/10 text-primary border-primary/20" },
    SIGNAL_UPGRADE: { label: "UPGRADED", cls: "bg-accent/10 text-accent border-accent/20" },
    CROSS: { label: "UPGRADED", cls: "bg-accent/10 text-accent border-accent/20" },
    STRONG: { label: "STRONG SIGNAL", cls: "bg-green-500/10 text-green-400 border-green-500/20" },
  }
  const match = map[type]
  const label = match?.label ?? type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
  const cls = match?.cls ?? "bg-muted/50 text-muted-foreground border-border"
  return (
    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${cls}`}>
      {label}
    </span>
  )
}

/** Safely normalise any raw mint value into a trimmed string + lowercase key. */
function normMint(v: unknown): { mint: string; lower: string } {
  if (typeof v !== "string") return { mint: "", lower: "" }
  const mint = v.trim()
  if (!mint) return { mint: "", lower: "" }
  return { mint, lower: mint.toLowerCase() }
}

// ────────────────────────────────────────────
// TOKEN LOGO
// ────────────────────────────────────────────

function TokenLogo({ src, symbol, size = 18 }: { src?: string | null; symbol: string; size?: number }) {
  const [failed, setFailed] = useState(false)
  if (src && !failed) {
    return (
      <img
        src={src || "/placeholder.svg"}
        alt={`${symbol} logo`}
        width={size}
        height={size}
        className="rounded-full shrink-0 object-cover"
        crossOrigin="anonymous"
        onError={() => setFailed(true)}
      />
    )
  }
  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-muted/40 text-muted-foreground/70 font-mono font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      {symbol.charAt(0).toUpperCase()}
    </span>
  )
}

// ────────────────────────────────────────────
// METRIC TILE
// ────────────────────────────────────────────

function MetricTile({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="border border-border/40 rounded-sm px-3.5 py-2.5 bg-card/50">
      <p className="text-[10px] font-mono text-muted-foreground/80 uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-xl font-mono font-bold leading-tight ${color || "text-foreground"}`}>{value}</p>
      {sub && <p className="text-[10px] font-mono text-muted-foreground/50 mt-0.5">{sub}</p>}
    </div>
  )
}

// ────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────

type TabId = "ledger" | "leadtime" | "alerts" | "methodology"

function CsvExportButton({ isPro, isProLoading, disabled, onExport }: { isPro: boolean; isProLoading: boolean; disabled: boolean; onExport: () => void }) {
  const [exporting, setExporting] = useState(false)
  const [done, setDone] = useState(false)

  const handleClick = () => {
    if (!isPro || isProLoading || disabled) return
    setExporting(true)
    setTimeout(() => {
      onExport()
      setExporting(false)
      setDone(true)
      setTimeout(() => setDone(false), 3000)
    }, 300)
  }

  if (isProLoading) {
    return (
      <Button variant="outline" size="sm" className="h-8 text-[12px] font-mono rounded-sm bg-transparent px-3" disabled>
        <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
        Checking...
      </Button>
    )
  }

  if (!isPro) {
    return (
      <Button variant="outline" size="sm" className="h-8 text-[12px] font-mono rounded-sm bg-transparent px-3 cursor-not-allowed opacity-60" disabled>
        <Lock className="h-3 w-3 mr-1" />
        CSV Export
        <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-amber-400/15 text-amber-400 border border-amber-400/20">PRO</span>
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 text-[12px] font-mono rounded-sm bg-transparent px-3"
      onClick={handleClick}
      disabled={disabled || exporting}
    >
      {exporting ? (
        <><RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />Exporting...</>
      ) : done ? (
        <><Check className="h-3.5 w-3.5 mr-1 text-green-400" />Downloaded!</>
      ) : (
        <><Download className="h-3.5 w-3.5 mr-1" />CSV Export</>
      )}
    </Button>
  )
}

export function ResearchClient({ reports: _reports }: { reports: ResearchReport[] }) {
  const { isPro, isLoading: isProLoading } = usePro()

  // Tab state - default to ledger
  const [activeTab, setActiveTab] = useState<TabId>("ledger")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tabParam = params.get("tab")
    const hash = window.location.hash.replace("#", "")
    if (tabParam === "methodology" || hash === "methodology") setActiveTab("methodology")
    if (tabParam === "leadtime" || hash === "leadtime") setActiveTab("leadtime")
    if (tabParam === "alerts" || hash === "alerts") setActiveTab("alerts")
  }, [])

  const switchTab = (tab: TabId) => {
    setActiveTab(tab)
    window.history.replaceState(null, "", `/research?tab=${tab}`)
  }

  // ── Alpha Ledger state ──
  const [ledgerData, setLedgerData] = useState<LedgerResponse | null>(null)
  const [ledgerLoading, setLedgerLoading] = useState(false)
  const [alphaError, setAlphaError] = useState<{ status: number; message: string; requestId?: string; bodyPreview?: string } | null>(null)
  const [range, setRange] = useState("30d")
  const [outcomeFilter, setOutcomeFilter] = useState("all")
  const [searchQ, setSearchQ] = useState("")
  const debouncedSearchQ = useDebouncedValue(searchQ, 300)
  const [copied, setCopied] = useState<string | null>(null)

  // Health polling (60s interval, graceful fallback)
  const { data: healthData, loading: healthLoading } = useHealthPolling(60_000)

  // Proof summary drawer
  const [drawerPayload, setDrawerPayload] = useState<DrawerPayload>(null)

  // Token logo cache (shared between both tabs)
  // logoMap is in state only for re-render triggers; logoMapRef is the source of truth
  const [logoMap, setLogoMap] = useState<Map<string, string>>(new Map())
  const logoFetchedRef = useRef<Set<string>>(new Set())
  const logoMapRef = useRef(logoMap)
  logoMapRef.current = logoMap

  const enrichLogos = useCallback(async (rawMints: unknown[]) => {
    const safeMints = rawMints.map((m) => normMint(m)).filter((n) => n.lower !== "")
    const newMints = safeMints.filter((n) => !logoFetchedRef.current.has(n.lower))
    if (newMints.length === 0) return
    for (const n of newMints) logoFetchedRef.current.add(n.lower)
    try {
      const res = await fetch("/api/tokens/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mints: newMints.slice(0, 50).map((n) => n.mint) }),
      })
      if (!res.ok) return
      const data = await res.json()
      // Only trigger a state update if there are genuinely new keys
      const current = logoMapRef.current
      let hasNew = false
      for (const t of data.tokens ?? []) {
        if (t.imageUrl && t.address) {
          const key = t.address.toLowerCase()
          if (!current.has(key)) { hasNew = true; break }
        }
      }
      if (!hasNew) return
      const updates = new Map(current)
      for (const t of data.tokens ?? []) {
        if (t.imageUrl && t.address) {
          updates.set(t.address.toLowerCase(), t.imageUrl)
        }
      }
      setLogoMap(updates)
    } catch (_) {
      void _
    }
  }, [])

  const [ledgerDebug, setLedgerDebug] = useState<Record<string, unknown> | null>(null)
  // Trigger counter: bump to force an alpha refetch without depending on the callback ref
  const [alphaFetchKey, setAlphaFetchKey] = useState(0)
  const [alphaLimit, setAlphaLimit] = useState(50)
  const ledgerAbortRef = useRef<AbortController | null>(null)

  const fetchLedger = useCallback(async () => {
    ledgerAbortRef.current?.abort()
    const controller = new AbortController()
    ledgerAbortRef.current = controller

    setLedgerLoading(true)
    setAlphaError(null)
    try {
      const params = new URLSearchParams()
      if (range !== "all") params.set("range", range)
      if (outcomeFilter !== "all") params.set("outcome", outcomeFilter)
      if (debouncedSearchQ) params.set("q", debouncedSearchQ)
      params.set("limit", "200")
      const res = await fetch(`/api/alpha-ledger?${params.toString()}`, { signal: controller.signal })
      const text = await res.text()

      let data: Record<string, unknown>
      try {
        data = JSON.parse(text)
      } catch {
        // Non-JSON response (e.g. 500 HTML page)
        setAlphaError({ status: res.status, message: "Non-JSON response from server", bodyPreview: text.slice(0, 120) })
        return
      }

      if (!res.ok) {
        setAlphaError({
          status: res.status,
          message: (data.message as string) || (data.error as string) || `HTTP ${res.status}`,
          requestId: (data.requestId as string) || undefined,
          bodyPreview: text.slice(0, 120),
        })
        return
      }

      if (data.entries && Array.isArray(data.entries)) {
        data.entries = (data.entries as LedgerEntry[]).map((e: LedgerEntry) => ({
          ...e,
          mint: typeof e.mint === "string" ? e.mint.trim() : "",
          symbol: typeof e.symbol === "string" ? e.symbol : "???",
        }))
      }
      setLedgerData(data as unknown as LedgerResponse)
      setLedgerDebug((data._debug as Record<string, unknown>) ?? null)
      setAlphaLimit(50)
      // Enrich logos for first visible page only
      if ((data as unknown as LedgerResponse).entries?.length) {
        const visible = (data as unknown as LedgerResponse).entries.slice(0, 50)
        const validMints = visible
          .map((e: LedgerEntry) => e.mint)
          .filter((m: string) => m.length > 0)
        if (validMints.length > 0) enrichLogos(validMints)
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return
      if (!controller.signal.aborted) {
        console.error("Ledger fetch error:", err)
        setAlphaError({
          status: 0,
          message: err instanceof Error ? err.message : "Network error",
        })
      }
    } finally {
      if (!controller.signal.aborted) setLedgerLoading(false)
    }
  }, [range, outcomeFilter, debouncedSearchQ, enrichLogos])

  // Fetch alpha on tab switch or when debounced filters change while on tab
  useEffect(() => {
    if (activeTab === "ledger") {
      fetchLedger().finally(() => { initialLoadDone.current = true })
    }
    return () => { ledgerAbortRef.current?.abort() }
  }, [activeTab, range, outcomeFilter, debouncedSearchQ, alphaFetchKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-refresh wiring (safe: refs avoid hook-ordering / TDZ issues) ──
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const initialLoadDone = useRef(false)

  // Use refs so the onTick callback never has a stale closure
  const fetchLedgerRef = useRef(fetchLedger)
  fetchLedgerRef.current = fetchLedger

  const fetchLeadTimeRef = useRef<(() => Promise<void>) | null>(null)
  const activeTabRef = useRef(activeTab)
  activeTabRef.current = activeTab

  const { lastUpdatedAt: researchLiveAt, isRefreshing: researchRefreshing, refreshNow: researchRefreshNow } = useAutoRefresh({
    intervalMs: 90_000,
    enabled: initialLoadDone.current && (activeTab === "ledger" || activeTab === "leadtime"),
    onTick: async () => {
      try {
        setRefreshError(null)
        const tab = activeTabRef.current
        if (tab === "ledger") await fetchLedgerRef.current()
        else if (tab === "leadtime" && fetchLeadTimeRef.current) await fetchLeadTimeRef.current()
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return
        const msg = err instanceof Error ? err.message : "Refresh failed"
        console.error("[auto-refresh] research tick error:", msg)
        setRefreshError(msg)
      }
    },
  })

  const handleShare = (entry: LedgerEntry) => {
    shareRow(entry)
    setCopied(entry.id)
    setTimeout(() => setCopied(null), 2000)
  }

  const metrics = ledgerData?.metrics

  const extMetrics = useMemo(() => {
    if (!ledgerData?.entries?.length) return null
    const entries = ledgerData.entries
    const has7d = entries.filter((e) => typeof e.pct7d === "number")
    const use7d = has7d.length >= entries.length * 0.3
    const pctKey = use7d ? "pct7d" : "pct24h"
    const pctLabel = use7d ? "7D" : "24h"
    const values = entries
      .map((e) => (pctKey === "pct7d" ? e.pct7d : e.pct24h))
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v))
    const avg = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0
    const best = values.length > 0 ? Math.max(...values) : 0
    const worst = values.length > 0 ? Math.min(...values) : 0
    return { avg, best, worst, pctLabel, count: values.length }
  }, [ledgerData])

  // ── Lead-Time Ledger state ──
  const [ltData, setLtData] = useState<LeadTimeResponse | null>(null)
  const [ltLoading, setLtLoading] = useState(false)
  const [ltError, setLtError] = useState<{ status: number; message: string } | null>(null)
  const [ltRange, setLtRange] = useState("30d")
  const [ltConfidence, setLtConfidence] = useState("all")
  const [ltSearch, setLtSearch] = useState("")
  const debouncedLtSearch = useDebouncedValue(ltSearch, 300)
  const ltFetchedRef = useRef(false)
  const [ltFetchKey, setLtFetchKey] = useState(0)
  const [ltLimit, setLtLimit] = useState(50)
  const [ltDebug, setLtDebug] = useState<LeadTimeResponse["_debug"] | null>(null)

  const ltAbortRef = useRef<AbortController | null>(null)

  const fetchLeadTime = useCallback(async () => {
    ltAbortRef.current?.abort()
    const controller = new AbortController()
    ltAbortRef.current = controller

    setLtLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("range", ltRange)
      if (ltConfidence !== "all") params.set("confidence", ltConfidence)
      if (debouncedLtSearch) params.set("q", debouncedLtSearch)
      params.set("limit", "200")
      const res = await fetch(`/api/leadtime-ledger?${params.toString()}`, { signal: controller.signal })
      const text = await res.text()

      let data: LeadTimeResponse
      try {
        data = JSON.parse(text)
      } catch {
        console.error("Lead-time: non-JSON response", res.status, text.slice(0, 120))
        setLtError({ status: res.status, message: `Non-JSON response: ${text.slice(0, 200)}` })
        setLtData(null)
        return
      }

      if (!res.ok) {
        console.error("Lead-time: API error", res.status, text.slice(0, 120))
        setLtError({ status: res.status, message: data?.error || text.slice(0, 200) })
        setLtData(null)
        return
      }

      setLtError(null)

      // Coerce rows: ensure mint/symbol are strings (don't filter out)
      if (data.rows) {
        data.rows = data.rows.map((r: LeadTimeLedgerRow) => ({
          ...r,
          mint: typeof r.mint === "string" ? r.mint.trim() : "",
          symbol: typeof r.symbol === "string" ? r.symbol : "???",
        }))
      }
      setLtData(data)
      setLtDebug(data._debug ?? null)
      setLtLimit(50)
      // Enrich logos for first visible page only
      if (data.rows?.length) {
        const visible = data.rows.slice(0, 50)
        const needLogos = visible.filter((r) => !r.logo).map((r) => r.mint)
        if (needLogos.length > 0) enrichLogos(needLogos)
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return
      if (!controller.signal.aborted) {
        console.error("Lead-time fetch error:", err)
        setLtError({ status: 0, message: err instanceof Error ? err.message : "Network error" })
        setLtData(null)
      }
    } finally {
      if (!controller.signal.aborted) setLtLoading(false)
    }
  }, [ltRange, ltConfidence, debouncedLtSearch, enrichLogos])

  // Keep the ref in sync so auto-refresh can call it safely
  fetchLeadTimeRef.current = fetchLeadTime

  useEffect(() => {
    if (activeTab === "leadtime") {
      ltFetchedRef.current = true
      fetchLeadTime().finally(() => { initialLoadDone.current = true })
    }
    return () => { ltAbortRef.current?.abort() }
  }, [activeTab, ltRange, ltConfidence, debouncedLtSearch, ltFetchKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Lead-time computed metrics
  const ltMetrics = useMemo(() => {
    if (!ltData?.rows?.length) return null
    const rows = ltData.rows
    const avgLead = rows.reduce((s, r) => s + r.leadSeconds, 0) / rows.length
    const bestLead = Math.max(...rows.map((r) => r.leadSeconds))
    const avgConf = rows.reduce((s, r) => s + r.confidence, 0) / rows.length
    const earliest = rows.reduce((min, r) => {
      const t = new Date(r.observedAt).getTime()
      return t < min ? t : min
    }, Date.now())
    return {
      count: rows.length,
      avgLead: Math.round(avgLead),
      bestLead: Math.round(bestLead),
      avgConf: Math.round(avgConf),
      trackedSince: new Date(earliest),
    }
  }, [ltData])

  // ── Cross-link lookup Sets ──
  const alphaMintSet = useMemo(() => {
    const s = new Set<string>()
    if (ledgerData?.entries) {
      for (const e of ledgerData.entries) {
        const { lower } = normMint(e.mint)
        if (lower) s.add(lower)
      }
    }
    return s
  }, [ledgerData])

  const leadMintSet = useMemo(() => {
    const s = new Set<string>()
    if (ltData?.rows) {
      for (const r of ltData.rows) {
        const { lower } = normMint(r.mint)
        if (lower) s.add(lower)
      }
    }
    return s
  }, [ltData])

  const goToLeadFor = useCallback((mintOrSymbol: string) => {
    setLtSearch(mintOrSymbol)
    setLtFetchKey((k) => k + 1)
    switchTab("leadtime")
  }, [])

  const goToAlphaFor = useCallback((mintOrSymbol: string) => {
    setSearchQ(mintOrSymbol)
    setAlphaFetchKey((k) => k + 1)
    switchTab("ledger")
  }, [])

  return (
    <>
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4 mb-1">
        <div className="flex items-center gap-2.5">
          <FlaskConical className="h-5 w-5 text-primary" />
          <h1 className="text-lg md:text-xl font-mono font-bold uppercase tracking-wide">Proof Engine</h1>
          <LiveIndicator lastUpdatedAt={researchLiveAt} isRefreshing={researchRefreshing} onRefresh={researchRefreshNow} />
        </div>
        <div className="flex items-center gap-3">
          {metrics?.lastUpdated && (
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-[10px] font-mono text-muted-foreground/70">
                Updated {relativeTime(metrics.lastUpdated)}
              </span>
            </div>
          )}
          {healthData?.harvest?.lastStatus && (
            <span className={`text-[10px] font-mono ${
              healthData.harvest.lastStatus === "OK"
                ? "text-green-500/70"
                : healthData.harvest.lastStatus === "STARTED"
                  ? "text-blue-400/70"
                  : healthData.harvest.lastStatus.startsWith("ERROR")
                    ? "text-red-400/70"
                    : "text-muted-foreground/50"
            }`}>
              Harvest: {healthData.harvest.lastStatus === "OK"
                ? `OK (${healthData.harvest.lastProcessedCount ?? 0} added)`
                : healthData.harvest.lastStatus}
            </span>
          )}
        </div>
      </div>
      {/* Inline refresh error banner */}
      {refreshError && (
        <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-md bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
          <p className="text-[11px] font-mono text-red-400/90 flex-1">
            Research temporarily unavailable. Retrying&hellip;
          </p>
          <button
            onClick={() => { setRefreshError(null); researchRefreshNow() }}
            className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
          >
            Retry
          </button>
        </div>
      )}
      <p className="text-[13px] font-mono text-muted-foreground/80 mb-4">
        Append-only alpha ledger + lead-time proofs + verification methodology
      </p>

      {/* ── HEALTH STRIP ── */}
      <HealthStrip data={healthData} loading={healthLoading} />
      {healthData && healthData.overall.status !== "OK" && healthData.overall.reason && (
        <p className="text-[9px] font-mono text-amber-400/60 -mt-3 mb-3 px-3">
          Reason: {healthData.overall.reason}
        </p>
      )}
      <ProofEngineOnboarding />

      <div className="hidden md:block">
        <IntegrityStrip data={healthData} loading={healthLoading} />
        <LedgerHashLine data={healthData} loading={healthLoading} />
      </div>


      {/* ── TAB NAV ── */}
      <div className="flex items-center gap-0 mb-5 border-b border-border/40 flex-wrap">
        {([
          { id: "ledger" as const, label: "Alpha Ledger", shortLabel: "Alpha", icon: Shield },
          { id: "leadtime" as const, label: "Lead-Time Ledger", shortLabel: "Lead", icon: Timer },
          { id: "alerts" as const, label: "Alerts", shortLabel: "Alerts", icon: Activity },
          { id: "methodology" as const, label: "Methodology", shortLabel: "Method", icon: BookOpen },
        ]).map(({ id, label, shortLabel, icon: Icon }) => (
          <button
            key={id}
            onClick={() => switchTab(id)}
            className={`flex items-center gap-1 md:gap-1.5 px-2.5 md:px-4 py-2.5 text-[12px] md:text-[13px] font-mono transition-colors border-b -mb-px whitespace-nowrap shrink-0 ${
              activeTab === id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="md:hidden">{shortLabel}</span>
            <span className="hidden md:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* ALPHA LEDGER TAB                       */}
      {/* ═══════════════════════════════════════ */}
      {activeTab === "ledger" && (
        <>
          {/* Metric Strip */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
            <MetricTile
              label="Signals Tracked"
              value={metrics?.totalTracked?.toString() ?? "--"}
            />
            <MetricTile
              label="Win Rate"
              value={metrics ? `${metrics.winRate.toFixed(1)}%` : "--"}
              color={metrics && metrics.winRate >= 50 ? "text-green-400" : metrics && metrics.winRate > 0 ? "text-foreground" : undefined}
            />
            <MetricTile
              label={`Avg ${extMetrics?.pctLabel ?? "7D"} Move`}
              value={extMetrics ? fmtPct(extMetrics.avg) : "--"}
              color={extMetrics ? pctColor(extMetrics.avg) : undefined}
              sub={extMetrics ? `n=${extMetrics.count}` : undefined}
            />
            <MetricTile
              label={`Best ${extMetrics?.pctLabel ?? "7D"} Gain`}
              value={extMetrics ? fmtPct(extMetrics.best) : "--"}
              color="text-green-400"
            />
            <MetricTile
              label={`Worst ${extMetrics?.pctLabel ?? "7D"} Drawdown`}
              value={extMetrics ? fmtPct(extMetrics.worst) : "--"}
              color="text-red-400"
            />
            <MetricTile
              label="Tracked Since"
              value={metrics?.trackedSince ? new Date(metrics.trackedSince).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "--"}
            />
          </div>

          {/* Transparency Strip */}
          <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-3 text-[11px] font-mono text-muted-foreground/70 mb-4 py-2 px-3 border border-border/25 rounded-sm bg-muted/5">
            <span className="flex items-center gap-1"><Lock className="h-3 w-3 shrink-0" /> Append-only ledger</span>
            <span className="text-border/40 hidden md:inline">|</span>
            <span className="hidden md:inline">No deletions / no cherry-picking</span>
            <span className="text-border/40 hidden md:inline">|</span>
            <span className="flex items-center gap-1"><Download className="h-3 w-3 shrink-0" /> CSV export + verify independently</span>
          </div>

          {/* Controls Row */}
          <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-2 md:gap-2.5 mb-4">
            <div className="flex items-center gap-2">
              <Select value={range} onValueChange={setRange}>
                <SelectTrigger className="w-[100px] md:w-[110px] h-8 text-[12px] font-mono rounded-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24h</SelectItem>
                  <SelectItem value="7d">7d</SelectItem>
                  <SelectItem value="30d">30d</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
              <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
                <SelectTrigger className="w-[100px] md:w-[110px] h-8 text-[12px] font-mono rounded-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="win">Win</SelectItem>
                  <SelectItem value="loss">Loss</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="relative w-full md:flex-1 md:min-w-[160px] md:max-w-[260px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search..."
                className="h-8 text-[12px] font-mono pl-8 rounded-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[12px] font-mono rounded-sm bg-transparent px-3"
                onClick={() => setAlphaFetchKey((k) => k + 1)}
                disabled={ledgerLoading}
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${ledgerLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <CsvExportButton
                isPro={isPro}
                isProLoading={isProLoading}
                disabled={!ledgerData?.entries?.length}
                onExport={() => ledgerData?.entries && exportCSV(ledgerData.entries)}
              />
            </div>
          </div>

          {/* Dev debug banner (only when 0 entries and debug info available) */}
          {!ledgerLoading && !ledgerData?.entries?.length && ledgerDebug && process.env.NODE_ENV !== "production" && (
            <div className="mb-3 px-3 py-2 border border-amber-500/30 rounded-sm bg-amber-500/5 text-[10px] font-mono text-amber-400/80 space-y-0.5">
              <p className="font-semibold">Debug: Alpha Ledger returned 0 entries</p>
              <p>Range: {String(ledgerDebug.rangeUsed)} | Total in KV: {String(ledgerDebug.totalInKV)} | After void filter: {String(ledgerDebug.afterVoidFilter)} | After range filter: {String(ledgerDebug.afterRangeFilter)}</p>
              {ledgerDebug.sampleEntry && <p>Sample entry: mint type={String((ledgerDebug.sampleEntry as Record<string, unknown>).mint)}, detectedAt={String((ledgerDebug.sampleEntry as Record<string, unknown>).detectedAt)}</p>}
            </div>
          )}

          {/* Dev diagnostic */}
          {process.env.NODE_ENV !== "production" && (
            <p className="text-[9px] font-mono text-muted-foreground/40 mb-1">Alpha rows: {ledgerData?.entries?.length ?? 0} | search: &quot;{searchQ}&quot; | range: {range}</p>
          )}

          {/* Alpha error banner */}
          {alphaError && !ledgerLoading && (
            <div className="mb-3 px-3 py-2.5 border border-red-500/30 rounded-sm bg-red-500/5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-mono text-red-400/90">
                  Alpha Ledger is temporarily unavailable ({alphaError.status || "network"}).
                </p>
                <button
                  onClick={() => setAlphaFetchKey((k) => k + 1)}
                  className="px-2 py-0.5 rounded border border-red-500/30 text-[10px] font-mono text-red-400/80 hover:text-red-300 hover:border-red-400/40 transition-colors shrink-0"
                >
                  Retry
                </button>
              </div>
              <p className="text-[9px] font-mono text-red-400/50 mt-1">
                {alphaError.message}
                {alphaError.requestId && ` | id: ${alphaError.requestId}`}
              </p>
            </div>
          )}

          {/* Table */}
          {ledgerLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-xs font-mono text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading ledger...
            </div>
          ) : !ledgerData?.entries?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <Shield className="h-7 w-7 text-muted-foreground/30" />
              {ledgerDebug && Number(ledgerDebug.totalInKV ?? 0) > 0 ? (
                <>
                  <p className="text-[11px] font-mono text-amber-200/80">
                    {"0 rows after filters \u2014 Range: "}
                    {String(ledgerDebug.afterRangeFilter ?? "?")}/{String(ledgerDebug.totalInKV ?? "?")}
                    {", Outcome: "}{String(ledgerDebug.afterRangeFilter ?? "?")}/{String(ledgerDebug.afterVoidFilter ?? "?")}
                    {searchQ && `, Search: "${searchQ}"`}
                  </p>
                  <button
                    onClick={() => {
                      setRange("30d")
                      setOutcomeFilter("all")
                      setSearchQ("")
                      setAlphaLimit(50)
                      setAlphaFetchKey((k) => k + 1)
                    }}
                    className="px-2.5 py-1 rounded border border-muted-foreground/20 text-[10px] font-mono text-muted-foreground/70 hover:text-primary hover:border-primary/30 transition-colors"
                  >
                    Reset Filters
                  </button>
                </>
              ) : (
                <>
                  <p className="text-[11px] font-mono text-muted-foreground/70">
                    No alpha entries yet — run Harvest in Intel Hub.
                  </p>
                  <Link
                    href="/admin/intel"
                    className="px-2.5 py-1 rounded border border-muted-foreground/20 text-[10px] font-mono text-muted-foreground/70 hover:text-primary hover:border-primary/30 transition-colors"
                  >
                    Open Intel Hub
                  </Link>
                </>
              )}
            </div>
          ) : (
            <>
            {/* ── MOBILE CARD LIST ── */}
            <div className="md:hidden space-y-2">
              {ledgerData.entries.slice(0, alphaLimit).map((entry) => {
                const { mint: eMint, lower: eLower } = normMint(entry.mint)
                const hasMint = eLower !== ""
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setDrawerPayload({ type: "alpha", entry })}
                    className={`w-full text-left rounded-lg border border-border/30 bg-card/60 p-3 transition-colors active:bg-primary/5 ${entry.voided ? "opacity-30" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <TokenLogo src={hasMint ? logoMap.get(eLower) : undefined} symbol={entry.symbol ?? "?"} />
                        <div className="min-w-0">
                          <span className="text-[13px] font-mono font-semibold text-foreground truncate block">${entry.symbol}</span>
                          <span className="text-[10px] font-mono text-muted-foreground/60">
                            {new Date(entry.detectedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            {" "}
                            {new Date(entry.detectedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
{detectionBadge(entry.detectionType)}
  {outcomeBadge(entry.outcome)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                      <span className="text-muted-foreground/70">
                        {fmtPrice(entry.priceAtSignal)} <span className="text-muted-foreground/40 mx-0.5">{"\u2192"}</span> {fmtPrice(entry.priceNow)}
                      </span>
                      <div className="flex items-center gap-2 tabular-nums">
                        {entry.pct24h != null && <span className={pctColor(entry.pct24h)}>{fmtPct(entry.pct24h)} <span className="text-muted-foreground/40 text-[9px]">24h</span></span>}
                        {entry.pct7d != null && <span className={pctColor(entry.pct7d)}>{fmtPct(entry.pct7d)} <span className="text-muted-foreground/40 text-[9px]">7d</span></span>}
                      </div>
                    </div>
                    {entry.entryHash && (
                      <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-border/15">
                        <Fingerprint className="h-3 w-3 text-green-500/60 flex-none" />
                        <span className="text-[10px] font-mono text-muted-foreground/60">{entry.entryHash.slice(0, 8)}...</span>
                        <Link
                          href={`/proof-protocol?verify=${entry.entryHash}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[9px] font-mono font-bold tracking-wider text-green-400/70 hover:text-green-300 transition-colors ml-auto"
                        >
                          {"VERIFY \u2197"}
                        </Link>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* ── DESKTOP TABLE ── */}
            <div className="hidden md:block border border-zinc-800 rounded-sm overflow-clip relative">
              <div className="max-h-[520px] overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                <table className="w-full text-[13px] font-mono">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b border-zinc-700 bg-zinc-950">
                      <th className="text-left px-3 py-2.5 text-zinc-500 font-semibold text-[11px] uppercase tracking-wider bg-zinc-950">Token</th>
                      <th className="text-left px-3 py-2.5 text-zinc-500 font-semibold text-[11px] uppercase tracking-wider bg-zinc-950">Detected</th>
                      <th className="text-left px-3 py-2.5 text-zinc-500 font-semibold text-[11px] uppercase tracking-wider bg-zinc-950">Type</th>
                      <th className="text-right px-3 py-2.5 text-zinc-500 font-semibold text-[11px] uppercase tracking-wider bg-zinc-950">Entry</th>
                      <th className="text-right px-3 py-2.5 text-zinc-500 font-semibold text-[11px] uppercase tracking-wider bg-zinc-950">Now</th>
                      <th className="text-right px-3 py-2.5 text-zinc-500 font-semibold text-[11px] uppercase tracking-wider bg-zinc-950">24h%</th>
                      <th className="text-right px-3 py-2.5 text-zinc-500 font-semibold text-[11px] uppercase tracking-wider bg-zinc-950">7d%</th>
                      <th className="text-right px-3 py-2.5 text-zinc-500 font-semibold text-[11px] uppercase tracking-wider bg-zinc-950">30d%</th>
                      <th className="text-center px-3 py-2.5 text-zinc-500 font-semibold text-[11px] uppercase tracking-wider bg-zinc-950">Result</th>
                      <th className="text-center px-3 py-2.5 text-zinc-500 font-semibold text-[11px] uppercase tracking-wider bg-zinc-950">Proof</th>
                      <th className="w-16 px-1.5 py-2.5 bg-zinc-950" />
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerData.entries.slice(0, alphaLimit).map((entry, idx) => {
                      const { mint: eMint, lower: eLower } = normMint(entry.mint)
                      const hasMint = eLower !== ""
                      return (
                        <tr
                          key={entry.id}
                          onClick={() => setDrawerPayload({ type: "alpha", entry })}
                          className={`border-b border-border/15 transition-colors hover:bg-primary/5 cursor-pointer ${idx % 2 === 1 ? "bg-muted/[0.04]" : ""} ${entry.voided ? "opacity-30 line-through" : ""}`}
                        >
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <TokenLogo src={hasMint ? logoMap.get(eLower) : undefined} symbol={entry.symbol ?? "?"} />
                              <div>
                                {hasMint ? (
                                  <Link href={`/token/${eMint}`} className="text-primary hover:underline font-semibold">
                                    ${entry.symbol}
                                  </Link>
                                ) : (
                                  <span className="text-muted-foreground font-semibold">${entry.symbol}</span>
                                )}
                                {hasMint && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(eMint); setCopied(`addr-${entry.id}`); setTimeout(() => setCopied(null), 1500) }}
                                    className="ml-1.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                                    title={eMint}
                                  >
                                    <span className="text-[10px]">{`${eMint.slice(0, 4)}..${eMint.slice(-3)}`}</span>
                                    {copied === `addr-${entry.id}` ? <CheckCircle2 className="inline h-3 w-3 ml-0.5 text-green-400" /> : <Copy className="inline h-3 w-3 ml-0.5" />}
                                  </button>
                                )}
                                {hasMint && leadMintSet.has(eLower) && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); goToLeadFor(eMint || entry.symbol) }}
                                    className="inline-flex items-center gap-0.5 ml-1.5 px-1.5 py-[2px] rounded-md border border-muted-foreground/20 text-[9px] font-mono text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors cursor-pointer"
                                    title="View lead-time proof for this token"
                                  >
                                    <Timer className="h-2.5 w-2.5" />
                                    LEAD
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground/80">
                            {new Date(entry.detectedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            <span className="text-muted-foreground/50 ml-1">
                              {new Date(entry.detectedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                            </span>
                          </td>
  <td className="px-3 py-2.5">
  {detectionBadge(entry.detectionType)}
  </td>
                          <td className="px-3 py-2.5 text-right tabular-nums">{fmtPrice(entry.priceAtSignal)}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums">{fmtPrice(entry.priceNow)}</td>
                          <td className={`px-3 py-2.5 text-right tabular-nums ${pctColor(entry.pct24h)}`}>{fmtPct(entry.pct24h)}</td>
                          <td className={`px-3 py-2.5 text-right tabular-nums ${pctColor(entry.pct7d)}`}>{fmtPct(entry.pct7d)}</td>
                          <td className={`px-3 py-2.5 text-right tabular-nums ${pctColor(entry.pct30d)}`}>{fmtPct(entry.pct30d)}</td>
                          <td className="px-3 py-2.5 text-center">{outcomeBadge(entry.outcome)}</td>
                          <td className="px-2 py-2.5 text-center">
                            {entry.entryHash ? (
                              <div className="flex items-center gap-1 justify-center">
                                <Fingerprint className="h-3 w-3 text-green-500/60 flex-none" />
                                <span className="text-[10px] font-mono text-muted-foreground/70 tabular-nums">
                                  {entry.entryHash.slice(0, 8)}
                                </span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(entry.entryHash!); setCopied(`hash-${entry.id}`); setTimeout(() => setCopied(null), 1500) }}
                                  className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                                  title="Copy full entryHash"
                                >
                                  {copied === `hash-${entry.id}` ? <CheckCircle2 className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                                </button>
                                <Link
                                  href={`/proof-protocol?verify=${entry.entryHash}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[9px] font-mono font-bold tracking-wider text-green-400/70 hover:text-green-300 transition-colors"
                                  title="Verify on-chain"
                                >
                                  {"VERIFY \u2197"}
                                </Link>
                              </div>
                            ) : (
                              <span className="text-[10px] font-mono text-muted-foreground/30">--</span>
                            )}
                          </td>
                          <td className="px-1.5 py-2.5">
                            <div className="flex items-center gap-0.5 justify-center">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleShare(entry) }}
                                className="text-muted-foreground/50 hover:text-primary transition-colors p-1"
                                title="Copy proof snippet"
                              >
                                {copied === entry.id ? <CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> : <Share2 className="h-3.5 w-3.5" />}
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setDrawerPayload({ type: "alpha", entry }) }}
                                className="hidden md:inline-flex text-muted-foreground/40 hover:text-primary transition-colors p-1"
                                title="Verify"
                              >
                                <ScanSearch className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {/* Bottom fade hint */}
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-zinc-950 to-transparent hidden md:block" />
            </div>

            {/* Pro upgrade bar */}
            {!isPro && !isProLoading && (
              <div className="flex items-center gap-2 px-3 py-2 border border-amber-400/20 rounded-sm bg-amber-400/5 mt-2">
                <Lock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <p className="text-[11px] font-mono text-amber-400/80 flex-1">
                  CSV export is a Pro feature — download the full ledger for independent verification
                </p>
                <Link href="/pro" className="text-[11px] font-mono font-bold text-amber-400 hover:text-amber-300 transition-colors shrink-0">
                  {"Upgrade \u2192"}
                </Link>
              </div>
            )}

            {/* Pagination (shared mobile + desktop) */}
            {ledgerData.entries.length > alphaLimit && (
              <div className="flex items-center justify-center gap-3 px-3 py-2 mt-2 md:mt-0 border-t border-border/15">
                <button
                  onClick={() => {
                    const next = Math.min(alphaLimit + 50, 500)
                    setAlphaLimit(next)
                    const newSlice = ledgerData.entries.slice(alphaLimit, next)
                    const mints = newSlice.map((e) => e.mint).filter((m) => m.length > 0)
                    if (mints.length > 0) enrichLogos(mints)
                  }}
                  disabled={alphaLimit >= 500}
                  className="px-2.5 py-1 rounded border border-border/30 text-[10px] font-mono text-muted-foreground/70 hover:text-primary hover:border-primary/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Load 50 more
                </button>
                {alphaLimit < ledgerData.entries.length && ledgerData.entries.length <= 500 && (
                  <button
                    onClick={() => {
                      setAlphaLimit(500)
                      const newSlice = ledgerData.entries.slice(alphaLimit)
                      const mints = newSlice.map((e) => e.mint).filter((m) => m.length > 0)
                      if (mints.length > 0) enrichLogos(mints)
                    }}
                    className="px-2.5 py-1 rounded border border-border/30 text-[10px] font-mono text-muted-foreground/70 hover:text-primary hover:border-primary/30 transition-colors"
                  >
                    Show all
                  </button>
                )}
                <span className="text-[10px] font-mono text-muted-foreground/50">
                  Showing {Math.min(alphaLimit, ledgerData.entries.length)}/{ledgerData.entries.length}
                </span>
              </div>
            )}
            {/* Footer */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-border/25 bg-muted/10 text-[11px] font-mono text-muted-foreground/60 rounded-b-sm">
              <span>
                {Math.min(alphaLimit, ledgerData.entries.length)} of {ledgerData.entries.length}
                {ledgerData.totalFiltered > ledgerData.entries.length && ` (${ledgerData.totalFiltered} total)`}
                {" entries"}
              </span>
              <button
                onClick={() => switchTab("methodology")}
                className="underline underline-offset-2 hover:text-foreground transition-colors"
              >
                How to Verify
              </button>
            </div>
            </>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* LEAD-TIME LEDGER TAB                   */}
      {/* ═══════════════════════════════════════ */}
      {activeTab === "leadtime" && (
        <>
          {/* Metric Strip */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
            <MetricTile
              label="Proofs"
              value={ltMetrics?.count.toString() ?? "--"}
            />
            <MetricTile
              label="Avg Lead"
              value={ltMetrics ? fmtLeadTime(ltMetrics.avgLead) : "--"}
              color="text-primary"
            />
            <MetricTile
              label="Best Lead"
              value={ltMetrics ? fmtLeadTime(ltMetrics.bestLead) : "--"}
              color="text-green-400"
            />
            <MetricTile
              label="Avg Confidence"
              value={ltMetrics ? `${ltMetrics.avgConf}%` : "--"}
              color={ltMetrics && ltMetrics.avgConf >= 70 ? "text-green-400" : undefined}
            />
            <MetricTile
              label="Tracked Since"
              value={ltMetrics ? ltMetrics.trackedSince.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "--"}
            />
          </div>

          {/* Info Strip */}
          <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-3 text-[11px] font-mono text-muted-foreground/70 mb-4 py-2 px-3 border border-border/25 rounded-sm bg-muted/5">
            <span className="flex items-center gap-1"><Timer className="h-3 w-3 shrink-0" /> On-chain lead-time proofs</span>
            <span className="text-border/40 hidden md:inline">|</span>
            <span className="hidden md:inline">Observation before market reaction</span>
            <span className="text-border/40 hidden md:inline">|</span>
            <span className="flex items-center gap-1"><Download className="h-3 w-3 shrink-0" /> CSV export available</span>
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-2 md:gap-2.5 mb-4">
            <div className="flex items-center gap-2">
              <Select value={ltRange} onValueChange={setLtRange}>
                <SelectTrigger className="w-[100px] md:w-[110px] h-8 text-[12px] font-mono rounded-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24h</SelectItem>
                  <SelectItem value="7d">7d</SelectItem>
                  <SelectItem value="30d">30d</SelectItem>
                </SelectContent>
              </Select>
              <Select value={ltConfidence} onValueChange={setLtConfidence}>
                <SelectTrigger className="w-[120px] md:w-[130px] h-8 text-[12px] font-mono rounded-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Confidence: All</SelectItem>
                  <SelectItem value="HIGH">HIGH</SelectItem>
                  <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                  <SelectItem value="LOW">LOW</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="relative w-full md:flex-1 md:min-w-[160px] md:max-w-[260px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={ltSearch}
                onChange={(e) => setLtSearch(e.target.value)}
                placeholder="Search token..."
                className="h-8 text-[12px] font-mono pl-8 rounded-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[12px] font-mono rounded-sm bg-transparent px-3"
                onClick={() => setLtFetchKey((k) => k + 1)}
                disabled={ltLoading}
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${ltLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <CsvExportButton
                isPro={isPro}
                isProLoading={isProLoading}
                disabled={!ltData?.rows?.length}
                onExport={() => ltData?.rows && exportLeadTimeCSV(ltData.rows)}
              />
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[12px] font-mono rounded-sm bg-transparent px-3 text-muted-foreground/70"
                onClick={() => {
                  setLtRange("30d")
                  setLtConfidence("all")
                  setLtSearch("")
                  setLtLimit(50)
                  setLtFetchKey((k) => k + 1)
                }}
              >
                Reset
              </Button>
            </div>
          </div>

          {/* Dev diagnostic */}
          {process.env.NODE_ENV !== "production" && (
            <p className="text-[9px] font-mono text-muted-foreground/40 mb-1">
              rows: {ltData?.rows?.length ?? 0} | range: {ltRange} | confidence: {ltConfidence} | search: &quot;{ltSearch}&quot;
              {ltDebug && ` | server: total=${ltDebug.totalBeforeFilters} range=${ltDebug.afterRange} conf=${ltDebug.afterConfidence} search=${ltDebug.afterSearch}`}
            </p>
          )}

          {/* Dev-only amber warning: API returned rows but client shows 0 */}
          {process.env.NODE_ENV !== "production" && !ltLoading && !ltData?.rows?.length && ltDebug && ltDebug.totalBeforeFilters > 0 && (
            <div className="mb-3 px-3 py-2 border border-amber-500/30 rounded-sm bg-amber-500/5 text-[10px] font-mono text-amber-400/80 space-y-0.5">
              <p className="font-semibold">Warning: API had {ltDebug.totalBeforeFilters} proofs but 0 rows returned</p>
              <p>After range ({ltDebug.rangeUsed}): {ltDebug.afterRange} | After confidence ({ltDebug.confidenceUsed}, min={ltDebug.minConfidence}): {ltDebug.afterConfidence} | After search: {ltDebug.afterSearch}</p>
            </div>
          )}

          {/* Lead-time error banner */}
          {ltError && !ltLoading && (
            <div className="mb-3 px-3 py-2 border border-red-500/30 rounded-sm bg-red-500/10 flex items-center justify-between gap-2">
              <p className="text-[11px] font-mono text-red-400 truncate">
                Lead-time error {ltError.status ? `(${ltError.status})` : ""}: {(ltError.message || "Unknown").slice(0, 200)}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px] font-mono rounded-sm border-red-500/30 text-red-400 hover:bg-red-500/10 shrink-0"
                onClick={() => setLtFetchKey((k) => k + 1)}
              >
                Retry
              </Button>
            </div>
          )}

          {/* Table */}
          {ltLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-xs font-mono text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading lead-time proofs...
            </div>
          ) : !ltData?.rows?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <Timer className="h-7 w-7 text-muted-foreground/30" />
              {ltDebug && ltDebug.totalBeforeFilters > 0 ? (
                <>
                  <p className="text-[11px] font-mono text-amber-200/80">
                    {"0 rows after filters \u2014 Range: "}
                    {ltDebug.afterRange ?? "?"}/{ltDebug.totalBeforeFilters ?? "?"}
                    {", Confidence: "}{ltDebug.afterConfidence ?? "?"}/{ltDebug.afterRange ?? "?"}
                    {ltSearch && `, Search: ${ltDebug.afterSearch ?? "?"}/${ltDebug.afterConfidence ?? "?"}`}
                  </p>
                  <button
                    onClick={() => {
                      setLtRange("30d")
                      setLtConfidence("all")
                      setLtSearch("")
                      setLtLimit(50)
                      setLtFetchKey((k) => k + 1)
                    }}
                    className="px-2.5 py-1 rounded border border-muted-foreground/20 text-[10px] font-mono text-muted-foreground/70 hover:text-primary hover:border-primary/30 transition-colors"
                  >
                    Reset Filters
                  </button>
                </>
              ) : (
                <p className="text-[11px] font-mono text-muted-foreground/70">
                  No lead-time proofs available yet (source empty).
                </p>
              )}
            </div>
          ) : (
            <>
            {/* ── MOBILE CARD LIST ── */}
            <div className="md:hidden space-y-2">
              {ltData.rows.slice(0, ltLimit).map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setDrawerPayload({ type: "lead", row })}
                  className="w-full text-left rounded-lg border border-border/30 bg-card/60 p-3 transition-colors active:bg-primary/5"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <TokenLogo src={row.logo || (row.mint ? logoMap.get(row.mint.toLowerCase()) : undefined)} symbol={row.symbol ?? "?"} />
                      <div className="min-w-0">
                        <span className="text-[13px] font-mono font-semibold text-foreground truncate block">${row.symbol}</span>
                        <span className="text-[10px] font-mono text-muted-foreground/60">
                          {new Date(row.observedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          {" "}
                          {new Date(row.observedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                        </span>
                      </div>
                    </div>
                    {confidenceBadge(row.confidence)}
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[9px] h-5 px-1.5 rounded-sm">{fmtObservationType(row.observationEvent)}</Badge>
                      <span className="text-muted-foreground/40">{"\u2192"}</span>
                      <Badge variant="outline" className="text-[9px] h-5 px-1.5 rounded-sm">{fmtObservationType(row.reactionEvent)}</Badge>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 tabular-nums">
                      <span className="text-primary font-semibold">{fmtLeadTime(row.leadSeconds)}</span>
                      <span className="text-muted-foreground/50">+{row.leadBlocks}b</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* ── DESKTOP TABLE ── */}
            <div className="hidden md:block border border-border/30 rounded-sm overflow-clip">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] font-mono">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="text-left px-3 py-2.5 text-muted-foreground/90 font-semibold text-[11px] uppercase tracking-wider sticky top-0 bg-muted/30">Token</th>
                      <th className="text-left px-3 py-2.5 text-muted-foreground/90 font-semibold text-[11px] uppercase tracking-wider sticky top-0 bg-muted/30">Observed</th>
                      <th className="text-left px-3 py-2.5 text-muted-foreground/90 font-semibold text-[11px] uppercase tracking-wider sticky top-0 bg-muted/30">Observation</th>
                      <th className="text-left px-3 py-2.5 text-muted-foreground/90 font-semibold text-[11px] uppercase tracking-wider sticky top-0 bg-muted/30">Reaction</th>
                      <th className="text-right px-3 py-2.5 text-muted-foreground/90 font-semibold text-[11px] uppercase tracking-wider sticky top-0 bg-muted/30">Lead</th>
                      <th className="text-right px-3 py-2.5 text-muted-foreground/90 font-semibold text-[11px] uppercase tracking-wider sticky top-0 bg-muted/30">Blocks</th>
                      <th className="text-center px-3 py-2.5 text-muted-foreground/90 font-semibold text-[11px] uppercase tracking-wider sticky top-0 bg-muted/30">Conf</th>
                      <th className="w-16 px-1.5 py-2.5 sticky top-0 bg-muted/30" />
                    </tr>
                  </thead>
                  <tbody>
                    {ltData.rows.slice(0, ltLimit).map((row, idx) => (
                      <tr
                        key={row.id}
                        onClick={() => setDrawerPayload({ type: "lead", row })}
                        className={`border-b border-border/15 transition-colors hover:bg-primary/5 cursor-pointer ${idx % 2 === 1 ? "bg-muted/[0.04]" : ""}`}
                      >
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <TokenLogo src={row.logo || (row.mint ? logoMap.get(row.mint.toLowerCase()) : undefined)} symbol={row.symbol ?? "?"} />
                            <div>
                              <Link href={`/token/${row.mint}`} className="text-primary hover:underline font-semibold">
                                ${row.symbol}
                              </Link>
                              {row.name && <span className="text-muted-foreground/50 ml-1 text-[10px]">{row.name}</span>}
                              <button
                                onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(row.mint); setCopied(`lt-addr-${row.id}`); setTimeout(() => setCopied(null), 1500) }}
                                className="ml-1.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                                title={row.mint}
                              >
                                <span className="text-[10px]">{row.mint ? `${row.mint.slice(0, 4)}..${row.mint.slice(-3)}` : "--"}</span>
                                {copied === `lt-addr-${row.id}` ? <CheckCircle2 className="inline h-3 w-3 ml-0.5 text-green-400" /> : <Copy className="inline h-3 w-3 ml-0.5" />}
                              </button>
                              {normMint(row.mint).lower && alphaMintSet.has(normMint(row.mint).lower) && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); goToAlphaFor(row.mint || row.symbol) }}
                                  className="inline-flex items-center gap-0.5 ml-1.5 px-1.5 py-[2px] rounded-md border border-muted-foreground/20 text-[9px] font-mono text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors cursor-pointer"
                                  title="View signal outcome for this token"
                                >
                                  <Shield className="h-2.5 w-2.5" />
                                  SIGNAL
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground/80">
                          {new Date(row.observedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          <span className="text-muted-foreground/50 ml-1">
                            {new Date(row.observedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5 rounded-sm">{fmtObservationType(row.observationEvent)}</Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5 rounded-sm">{fmtObservationType(row.reactionEvent)}</Badge>
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-primary font-semibold">
                          {fmtLeadTime(row.leadSeconds)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground/70">
                          {row.leadBlocks}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {confidenceBadge(row.confidence)}
                        </td>
                        <td className="px-1.5 py-2.5">
                          <div className="flex items-center gap-0.5">
                            <Link
                              href={`/token/${row.mint}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-muted-foreground/40 hover:text-primary transition-colors p-0.5"
                              title="View token"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDrawerPayload({ type: "lead", row }) }}
                              className="hidden md:inline-flex text-muted-foreground/40 hover:text-primary transition-colors p-1"
                              title="Verify"
                            >
                              <ScanSearch className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination (shared mobile + desktop) */}
            {ltData.rows.length > ltLimit && (
              <div className="flex items-center justify-center gap-3 px-3 py-2 mt-2 md:mt-0 border-t border-border/15">
                <button
                  onClick={() => {
                    const next = Math.min(ltLimit + 50, 500)
                    setLtLimit(next)
                    const newSlice = ltData.rows.slice(ltLimit, next)
                    const mints = newSlice.filter((r) => !r.logo).map((r) => r.mint).filter((m) => m.length > 0)
                    if (mints.length > 0) enrichLogos(mints)
                  }}
                  disabled={ltLimit >= 500}
                  className="px-2.5 py-1 rounded border border-border/30 text-[10px] font-mono text-muted-foreground/70 hover:text-primary hover:border-primary/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Load 50 more
                </button>
                {ltLimit < ltData.rows.length && ltData.rows.length <= 500 && (
                  <button
                    onClick={() => {
                      setLtLimit(500)
                      const newSlice = ltData.rows.slice(ltLimit)
                      const mints = newSlice.filter((r) => !r.logo).map((r) => r.mint).filter((m) => m.length > 0)
                      if (mints.length > 0) enrichLogos(mints)
                    }}
                    className="px-2.5 py-1 rounded border border-border/30 text-[10px] font-mono text-muted-foreground/70 hover:text-primary hover:border-primary/30 transition-colors"
                  >
                    Show all
                  </button>
                )}
                <span className="text-[10px] font-mono text-muted-foreground/50">
                  Showing {Math.min(ltLimit, ltData.rows.length)}/{ltData.rows.length}
                </span>
              </div>
            )}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-3 py-2 border-t border-border/25 bg-muted/10 text-[11px] font-mono text-muted-foreground/60 gap-1 rounded-b-sm">
              <span>
                {Math.min(ltLimit, ltData.rows.length)} of {ltData.rows.length}
                {ltData.total > ltData.rows.length && ` (${ltData.total} total)`}
                {" proofs"}
              </span>
              <span className="hidden md:inline">
                Range: {ltRange} | Confidence: {ltConfidence === "all" ? "All" : ltConfidence}{ltDebug ? ` | Server: ${ltDebug.totalBeforeFilters} proofs` : ""}
              </span>
            </div>
            </>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* ALERTS TAB                              */}
      {/* ═══════════════════════════════════════ */}
      {activeTab === "alerts" && (
        <AlertsTab />
      )}

      {/* ═══════════════════════════════════════ */}
      {/* METHODOLOGY TAB                        */}
      {/* ═══════════════════════════════════════ */}
      {activeTab === "methodology" && (
        <div className="max-w-4xl space-y-5">
          {/* Signals */}
          <section className="border border-border/30 rounded-sm overflow-clip">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/20 bg-muted/10">
              <Target className="h-3.5 w-3.5 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">What is a Signal?</h3>
            </div>
            <div className="px-3.5 py-3 text-[13px] font-mono text-muted-foreground/80 space-y-2 leading-relaxed">
              <p>
                A <strong className="text-foreground">signal</strong> fires when a token&#39;s SOLRAD score crosses a minimum threshold (currently 75)
                for the first time within a 24-hour detection window.
              </p>
              <p>
                Signals are <strong className="text-foreground">factual observations</strong>, not predictions or recommendations.
              </p>
            </div>
          </section>

          {/* Lead-Time Proofs */}
          <section className="border border-border/30 rounded-sm overflow-clip">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/20 bg-muted/10">
              <Timer className="h-3.5 w-3.5 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">What is a Lead-Time Proof?</h3>
            </div>
            <div className="px-3.5 py-3 text-[13px] font-mono text-muted-foreground/80 space-y-2 leading-relaxed">
              <p>
                A <strong className="text-foreground">lead-time proof</strong> records when SOLRAD observed on-chain behavior (accumulation, liquidity probes,
                wallet clustering) <em>before</em> the broader market reacted (volume expansion, liquidity growth, DEX visibility).
              </p>
              <p>
                Lead-time is measured in both <strong className="text-foreground">seconds</strong> and <strong className="text-foreground">Solana blocks</strong>,
                providing two independent verification dimensions.
              </p>
            </div>
          </section>

          {/* Append-only */}
          <section className="border border-border/30 rounded-sm overflow-clip">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/20 bg-muted/10">
              <Lock className="h-3.5 w-3.5 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Append-Only Ledger</h3>
            </div>
            <div className="px-3.5 py-3 text-[13px] font-mono text-muted-foreground/80 space-y-2 leading-relaxed">
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2"><ChevronRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" /> Entries are written once and never edited</li>
                <li className="flex items-start gap-2"><ChevronRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" /> The only mutation is a &#34;void&#34; (tombstone) with a visible reason</li>
                <li className="flex items-start gap-2"><ChevronRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" /> Original price, score, and timestamp are preserved immutably</li>
                <li className="flex items-start gap-2"><ChevronRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" /> No retroactive adjustments to track record</li>
              </ul>
            </div>
          </section>

          {/* Outcome Thresholds */}
          <section className="border border-border/30 rounded-sm overflow-clip">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/20 bg-muted/10">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Outcome Thresholds</h3>
            </div>
            <div className="px-3.5 py-3 overflow-x-auto">
              <table className="w-full text-[12px] font-mono min-w-[320px]">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left py-2 px-3 text-xs font-mono uppercase text-muted-foreground font-medium whitespace-nowrap">Outcome</th>
                    <th className="text-left py-2 px-3 text-xs font-mono uppercase text-muted-foreground font-medium whitespace-nowrap">7d Threshold</th>
                    <th className="text-left py-2 px-3 text-xs font-mono uppercase text-muted-foreground font-medium whitespace-nowrap">24h Fallback</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-2 px-3 text-green-500 font-semibold">WIN</td>
                    <td className="py-2 px-3 text-muted-foreground">{">="}+20%</td>
                    <td className="py-2 px-3 text-muted-foreground">{">="}+15% (if 7d unavailable)</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2 px-3 text-destructive font-semibold">LOSS</td>
                    <td className="py-2 px-3 text-muted-foreground">{"<="}-20%</td>
                    <td className="py-2 px-3 text-muted-foreground">{"<="}-15% (if 7d unavailable)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-muted-foreground font-semibold">NEUTRAL</td>
                    <td className="py-2 px-3 text-muted-foreground" colSpan={2}>Between thresholds or insufficient data</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Data Sources */}
          <section className="border border-border/30 rounded-sm overflow-clip">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/20 bg-muted/10">
              <Activity className="h-3.5 w-3.5 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Data Sources</h3>
            </div>
            <div className="px-3.5 py-3 text-[13px] font-mono text-muted-foreground/80 space-y-2 leading-relaxed">
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2"><ChevronRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" /> <strong className="text-foreground">DexScreener</strong> -- price, volume, liquidity, pair data</li>
                <li className="flex items-start gap-2"><ChevronRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" /> <strong className="text-foreground">QuickNode RPC</strong> -- on-chain data, holder metrics, mint/freeze authority</li>
                <li className="flex items-start gap-2"><ChevronRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" /> <strong className="text-foreground">On-chain</strong> -- token age from mint timestamp</li>
              </ul>
              <p className="mt-2">SOLRAD holds no private keys, executes no trades, and has no financial relationship with any listed project.</p>
            </div>
          </section>

          {/* How to Verify */}
          <section className="border border-border/30 rounded-sm overflow-clip">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/20 bg-muted/10">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">How to Verify</h3>
            </div>
            <div className="px-3.5 py-3 text-[13px] font-mono text-muted-foreground/80 space-y-3 leading-relaxed">
              <div className="flex items-start gap-3"><span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">1</span> Export CSV from the Alpha Ledger or Lead-Time Ledger tab</div>
              <div className="flex items-start gap-3"><span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">2</span> Cross-reference detection timestamps with DexScreener historical data</div>
              <div className="flex items-start gap-3"><span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">3</span> Verify entry prices match on-chain records at the stated time</div>
              <div className="flex items-start gap-3"><span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">4</span> For lead-time proofs, verify block numbers on a Solana explorer</div>
              <div className="flex items-start gap-3"><span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">5</span> Check for voided entries (marked with strikethrough) and their reasons</div>
            </div>
          </section>

          {/* Disclaimer */}
          <section className="border border-border/30 rounded-sm overflow-clip">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/20 bg-muted/10">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Disclaimer</h3>
            </div>
            <div className="px-3.5 py-3 text-[13px] font-mono text-muted-foreground/80 space-y-2 leading-relaxed">
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2"><ChevronRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-destructive" /> Not financial advice</li>
                <li className="flex items-start gap-2"><ChevronRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-destructive" /> Past signals do not guarantee future performance</li>
                <li className="flex items-start gap-2"><ChevronRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-destructive" /> No endorsement of any listed token</li>
              </ul>
              <p className="mt-2">
                See{" "}
                <Link href="/scoring" className="text-primary underline underline-offset-2">Scoring Methodology</Link>
                {" "}and{" "}
                <Link href="/security" className="text-primary underline underline-offset-2">Security</Link>
                {" "}for full details.
              </p>
            </div>
          </section>
        </div>
      )}
      {/* Proof Summary Drawer */}
      <ProofSummaryDrawer
        payload={drawerPayload}
        onClose={() => setDrawerPayload(null)}
        logoMap={logoMap}
      />

      {/* Debug Perf Overlay -- only when ?debug=1 */}
      <PerfOverlay
        activeTab={activeTab}
        ledgerLoading={ledgerLoading}
        ltLoading={ltLoading}
        ledgerEntries={ledgerData?.entries?.length ?? 0}
        ltRows={ltData?.rows?.length ?? 0}
        logoMapSize={logoMap.size}
      />
    </>
  )
}

/* ── Perf Overlay (debug=1 only) ── */
function PerfOverlay({
  activeTab, ledgerLoading, ltLoading, ledgerEntries, ltRows, logoMapSize,
}: {
  activeTab: string; ledgerLoading: boolean; ltLoading: boolean
  ledgerEntries: number; ltRows: number; logoMapSize: number
}) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    setShow(new URLSearchParams(window.location.search).get("debug") === "1")
  }, [])
  if (!show) return null
  return (
    <div className="fixed top-2 right-2 z-[9999] bg-black/90 text-green-400 text-[10px] font-mono px-2.5 py-1.5 rounded border border-green-500/30 space-y-0.5 pointer-events-none select-none">
      <div>tab: {activeTab}</div>
      <div>ledgerFetch: {ledgerLoading ? "IN_FLIGHT" : "idle"} ({ledgerEntries} rows)</div>
      <div>ltFetch: {ltLoading ? "IN_FLIGHT" : "idle"} ({ltRows} rows)</div>
      <div>logoMap: {logoMapSize} keys</div>
    </div>
  )
}
