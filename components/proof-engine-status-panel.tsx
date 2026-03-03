"use client"

/**
 * Proof Engine Status Panel
 *
 * Dev-only collapsible diagnostic panel rendered at the top of /research.
 * Fetches /api/proof-engine-status and displays a comprehensive system report.
 * Removable in one file delete + one import removal.
 */

import React, { useState, useCallback, useEffect, useRef } from "react"
import {
  RefreshCw,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Database,
  Activity,
  Timer,
  Shield,
  Link2,
} from "lucide-react"

// ── Status helpers ──

type Status = "GREEN" | "YELLOW" | "RED" | string

function StatusDot({ status }: { status: Status }) {
  const color =
    status === "GREEN"
      ? "bg-green-500"
      : status === "YELLOW"
        ? "bg-amber-400"
        : status === "RED"
          ? "bg-red-500"
          : "bg-muted-foreground/40"
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
}

function StatusIcon({ status }: { status: Status }) {
  if (status === "GREEN") return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
  if (status === "YELLOW") return <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
  if (status === "RED") return <XCircle className="h-3.5 w-3.5 text-red-500" />
  return <Activity className="h-3.5 w-3.5 text-muted-foreground/50" />
}

function StatusLabel({ status }: { status: Status }) {
  const color =
    status === "GREEN"
      ? "text-green-500"
      : status === "YELLOW"
        ? "text-amber-400"
        : status === "RED"
          ? "text-red-500"
          : "text-muted-foreground/60"
  return <span className={`font-semibold ${color}`}>{status}</span>
}

// ── Collapsible section ──

function Section({
  title,
  icon,
  status,
  defaultOpen = false,
  children,
}: {
  title: string
  icon: React.ReactNode
  status?: Status
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-border/30 rounded-sm bg-card/30">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-mono hover:bg-muted/10 transition-colors"
      >
        {open ? <ChevronDown className="h-3 w-3 text-muted-foreground/60" /> : <ChevronRight className="h-3 w-3 text-muted-foreground/60" />}
        {icon}
        <span className="font-semibold text-foreground/90">{title}</span>
        {status && (
          <span className="ml-auto flex items-center gap-1">
            <StatusDot status={status} />
            <StatusLabel status={status} />
          </span>
        )}
      </button>
      {open && <div className="px-3 pb-3 pt-1">{children}</div>}
    </div>
  )
}

// ── KV line ──

function KVLine({ label, data }: { label: string; data: { exists: boolean; type: string; sizeHint?: number } }) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-mono">
      <StatusDot status={data.exists ? "GREEN" : "RED"} />
      <span className="text-muted-foreground/80 w-36">{label}</span>
      <span className={data.exists ? "text-foreground/80" : "text-red-400"}>
        {data.exists ? `${data.type}${data.sizeHint !== undefined ? ` (${data.sizeHint})` : ""}` : "NOT FOUND"}
      </span>
    </div>
  )
}

// ── Stat line ──

function Stat({ label, value, warn }: { label: string; value: string | number; warn?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-mono">
      <span className="text-muted-foreground/70 w-40">{label}</span>
      <span className={warn ? "text-amber-400 font-semibold" : "text-foreground/80"}>{String(value)}</span>
    </div>
  )
}

// ── JSON viewer ──

function JsonViewer({ data, label }: { data: unknown; label: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-[9px] font-mono text-primary/70 hover:text-primary transition-colors underline"
      >
        {open ? `Hide ${label}` : `Show ${label}`}
      </button>
      {open && (
        <pre className="mt-1 p-2 rounded-sm bg-background/80 border border-border/20 text-[9px] font-mono text-muted-foreground/80 overflow-x-auto max-h-60 overflow-y-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  )
}

// ── Main Panel ──

export function ProofEngineStatusPanel() {
  const [collapsed, setCollapsed] = useState(true)
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [renderCount, setRenderCount] = useState(0)
  const renderRef = useRef(0)

  // Track re-renders to detect infinite loops
  useEffect(() => {
    renderRef.current++
    setRenderCount(renderRef.current)
  })

  const fetchReport = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/proof-engine-status", { cache: "no-store" })
      if (!res.ok) throw new Error(`Status ${res.status}`)
      const data = await res.json()
      setReport(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch")
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-fetch on first expand
  useEffect(() => {
    if (!collapsed && !report && !loading) {
      fetchReport()
    }
  }, [collapsed, report, loading, fetchReport])

  const alpha = report?.alphaLedger as Record<string, unknown> | undefined
  const lt = report?.leadTimeLedger as Record<string, unknown> | undefined
  const storageReport = report?.storageLayer as Record<string, unknown> | undefined
  const harvest = report?.harvestPipeline as Record<string, unknown> | undefined
  const crossLinks = report?.crossLinks as Record<string, unknown> | undefined
  const overallStatus = (report?.overallStatus as Status) ?? "UNKNOWN"

  return (
    <div className="mb-4 border border-border/40 rounded-sm bg-card/20 font-mono">
      {/* Header bar */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-2 px-3 py-2 text-[11px] hover:bg-muted/10 transition-colors"
      >
        {collapsed ? <ChevronRight className="h-3 w-3 text-muted-foreground/60" /> : <ChevronDown className="h-3 w-3 text-muted-foreground/60" />}
        <Activity className="h-3.5 w-3.5 text-primary/70" />
        <span className="font-semibold text-foreground/90">Proof Engine System Status</span>
        <span className="text-[9px] text-muted-foreground/50 ml-1">(dev only)</span>
        {report && (
          <span className="ml-auto flex items-center gap-1.5">
            <StatusIcon status={overallStatus} />
            <StatusLabel status={overallStatus} />
          </span>
        )}
        {!report && !loading && <span className="ml-auto text-[9px] text-muted-foreground/40">Click to load</span>}
        {loading && <RefreshCw className="ml-auto h-3 w-3 animate-spin text-muted-foreground/50" />}
      </button>

      {/* Expanded content */}
      {!collapsed && (
        <div className="px-3 pb-3 space-y-2">
          {/* Controls */}
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={fetchReport}
              disabled={loading}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono rounded-sm border border-border/30 text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`h-2.5 w-2.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <span className="text-[9px] text-muted-foreground/40">
              {report ? `Generated: ${String(report.generatedAt)}` : "Not loaded"}
            </span>
            <span className="text-[9px] text-muted-foreground/40 ml-auto">
              Renders: {renderCount}
            </span>
          </div>

          {error && (
            <div className="px-2 py-1.5 rounded-sm border border-red-500/30 bg-red-500/5 text-[10px] text-red-400">
              Error: {error}
            </div>
          )}

          {report && (
            <div className="space-y-2">
              {/* ── Alpha Ledger ── */}
              <Section
                title="Alpha Ledger"
                icon={<Shield className="h-3 w-3 text-primary/60" />}
                status={alpha?.status as Status}
                defaultOpen
              >
                {alpha && (
                  <div className="space-y-1">
                    <Stat label="Total in storage" value={alpha.totalInStorage as number} />
                    <Stat label="Active entries" value={alpha.activeEntries as number} />
                    <Stat label="Voided entries" value={alpha.voidedEntries as number} />
                    <Stat label="Unique mints" value={alpha.uniqueMints as number} />
                    <Stat label="Invalid mints" value={alpha.invalidMints as number} warn={(alpha.invalidMints as number) > 0} />
                    <Stat label="Invalid dates" value={alpha.invalidDates as number} warn={(alpha.invalidDates as number) > 0} />
                    <div className="mt-1.5 text-[9px] text-muted-foreground/60 font-semibold uppercase tracking-wider">Range breakdown (active)</div>
                    {alpha.rangeBreakdown && Object.entries(alpha.rangeBreakdown as Record<string, number>).map(([k, v]) => (
                      <Stat key={k} label={`  in ${k}`} value={v} />
                    ))}
                    <div className="mt-1.5 text-[9px] text-muted-foreground/60 font-semibold uppercase tracking-wider">Outcome breakdown</div>
                    {alpha.outcomeBreakdown && Object.entries(alpha.outcomeBreakdown as Record<string, number>).map(([k, v]) => (
                      <Stat key={k} label={`  ${k}`} value={v} />
                    ))}
                    <JsonViewer data={alpha.sample} label="Sample entries (3)" />
                    <JsonViewer data={alpha.metrics} label="Computed metrics" />
                    <JsonViewer data={alpha.meta} label="KV meta" />
                  </div>
                )}
              </Section>

              {/* ── Lead-Time Ledger ── */}
              <Section
                title="Lead-Time Ledger"
                icon={<Timer className="h-3 w-3 text-primary/60" />}
                status={lt?.status as Status}
                defaultOpen
              >
                {lt && (
                  <div className="space-y-1">
                    <Stat label="Total proofs" value={lt.totalProofs as number} />
                    <Stat label="Unique mints" value={lt.uniqueMints as number} />
                    <div className="mt-1.5 text-[9px] text-muted-foreground/60 font-semibold uppercase tracking-wider">Raw confidence values</div>
                    {lt.rawConfidenceValues && Object.entries(lt.rawConfidenceValues as Record<string, number>).map(([k, v]) => (
                      <Stat key={k} label={`  "${k}" (${typeof k})`} value={`${v} proofs`} />
                    ))}
                    <div className="mt-1.5 text-[9px] text-muted-foreground/60 font-semibold uppercase tracking-wider">Normalized confidence</div>
                    {lt.normalizedConfidenceBreakdown && Object.entries(lt.normalizedConfidenceBreakdown as Record<string, number>).map(([k, v]) => (
                      <Stat key={k} label={`  ${k}`} value={v} warn={k === "UNKNOWN" && (v as number) > 0} />
                    ))}
                    <div className="mt-1.5 text-[9px] text-muted-foreground/60 font-semibold uppercase tracking-wider">Range breakdown</div>
                    {lt.rangeBreakdown && Object.entries(lt.rangeBreakdown as Record<string, number>).map(([k, v]) => (
                      <Stat key={k} label={`  in ${k}`} value={v} />
                    ))}
                    <JsonViewer data={lt.sample} label="Sample proofs (3)" />
                  </div>
                )}
              </Section>

              {/* ── Storage Layer ── */}
              <Section
                title="Storage Layer (KV)"
                icon={<Database className="h-3 w-3 text-primary/60" />}
                status={storageReport?.status as Status}
              >
                {storageReport?.kvHealth && (
                  <div className="space-y-1">
                    {Object.entries(storageReport.kvHealth as Record<string, { exists: boolean; type: string; sizeHint?: number }>).map(([label, data]) => (
                      <KVLine key={label} label={label} data={data} />
                    ))}
                  </div>
                )}
              </Section>

              {/* ── Harvest Pipeline ── */}
              <Section
                title="Harvest Pipeline"
                icon={<Activity className="h-3 w-3 text-primary/60" />}
                status={harvest?.status as Status}
              >
                {harvest && (
                  <div className="space-y-1">
                    <Stat label="Last write" value={harvest.lastWriteAt ? String(harvest.lastWriteAt) : "Never"} warn={!harvest.lastWriteAt} />
                    <Stat label="Tracked since" value={harvest.trackedSince ? String(harvest.trackedSince) : "N/A"} />
                    <Stat label="Total entries (meta)" value={harvest.totalEntries as number} />
                    <Stat label="Total voided (meta)" value={harvest.totalVoided as number} />
                    <Stat label="Lock active" value={harvest.lockActive ? "YES" : "No"} warn={harvest.lockActive as boolean} />
                  </div>
                )}
              </Section>

              {/* ── Cross-Links ── */}
              <Section
                title="Cross-Link Validation"
                icon={<Link2 className="h-3 w-3 text-primary/60" />}
              >
                {crossLinks && (
                  <div className="space-y-1">
                    <Stat label="Alpha mint set size" value={crossLinks.alphaMintSetSize as number} />
                    <Stat label="Lead mint set size" value={crossLinks.leadMintSetSize as number} />
                    <Stat label="Intersection count" value={crossLinks.intersectionCount as number} />
                    <Stat label="Eligible for LEAD badge" value={crossLinks.eligibleForLeadBadge as number} />
                    <Stat label="Eligible for SIGNAL badge" value={crossLinks.eligibleForSignalBadge as number} />
                    {crossLinks.intersectionMints && (
                      <JsonViewer data={crossLinks.intersectionMints} label="Intersection mints (up to 10)" />
                    )}
                    {crossLinks.note && <Stat label="Note" value={crossLinks.note as string} />}
                  </div>
                )}
              </Section>

              {/* ── Full JSON dump ── */}
              <JsonViewer data={report} label="Full raw JSON report" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
