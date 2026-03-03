"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAutoRefresh } from "@/lib/use-auto-refresh"
import { LiveIndicator } from "@/components/live-indicator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  RefreshCw, Database, Cpu, Clock, AlertTriangle, ExternalLink,
  Copy, Check, ShieldAlert, Activity, Wrench, Zap, Download, Timer, Search,
} from "lucide-react"

interface TabProps {
  adminHeaders: Record<string, string>
  password: string
}

interface SystemReport {
  ok: boolean
  nowISO: string
  cutoffISO: string
  durationMs: number
  gates: string[]
  kv: {
    ok: boolean
    trackedMintsCount?: number
    samples?: SampleMint[]
    kvIdentity?: string
    error?: string
  }
  proof: {
    ok: boolean
    isFresh?: boolean
    lastUpdateISO?: string | null
    lastUpdateAgeSec?: number | null
    lastRunStatus?: string | null
    lastProcessedCount?: number | null
    lastSuccessISO?: string | null
    lastErrorISO?: string | null
    error?: string
  }
  leadtimeHarvest?: {
    ok: boolean
    lastRunAt?: string | null
    ageSec?: number | null
    isFresh?: boolean
    status?: string | null
    lastError?: { time?: string; message?: string } | null
    lastResult?: { tokensScanned?: number; wroteCount?: number; durationMs?: number } | null
    cronHit?: {
      lastHitAt?: string | null
      lastHitAgeSec?: number | null
      lastHitStatus?: string | null
      lastHitError?: string | null
    }
  }
  leadtime: {
    ok: boolean
    recentCount?: number
    scannedAtISO?: string | null
    scannedAgoSec?: number | null
    error?: string
  }
}

interface SampleMint {
  mint: string
  mintFull?: string
  llen?: number
  sampleCount?: number
  newestRecencyMs?: number | null
  newestRecencyISO?: string | null
  countLast24h?: number
  error?: string
}

function fmtAge(seconds: number | null | undefined): string {
  if (seconds == null) return "--"
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

function statusBadge(ok: boolean | undefined, label?: string) {
  if (ok === true)
    return (
      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/40 font-mono text-xs">
        {label ?? "OK"}
      </Badge>
    )
  if (ok === false)
    return (
      <Badge className="bg-red-500/15 text-red-400 border-red-500/40 font-mono text-xs">
        {label ?? "BAD"}
      </Badge>
    )
  return (
    <Badge className="bg-zinc-800 text-zinc-500 font-mono text-xs">
      {label ?? "?"}
    </Badge>
  )
}

function toErrMsg(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === "string") return e
  try { return JSON.stringify(e) } catch { return String(e) }
}

function gateLabel(gate: string): string {
  const labels: Record<string, string> = {
    no_snapshots_in_24h: "No snapshots found in the 24 h window",
    proof_engine_stale: "Proof engine has not run recently",
    leadtime_harvest_stale: "Lead-time harvest cron has not run in 45+ min",
    leadtime_harvest_read_failed: "Could not read lead-time harvest telemetry",
    leadtime_empty: "No lead-time proofs stored",
    snap_index_empty: "KV snap:index set is empty",
    kv_unavailable: "Cannot reach KV store",
    proof_engine_read_failed: "Could not read proof engine telemetry",
    leadtime_read_failed: "Could not read lead-time storage",
    leadtime_key_mismatch: "Data found under alternate key -- possible key name mismatch",
  }
  return labels[gate] ?? gate
}

export function StatusTab({ adminHeaders, password }: TabProps) {
  const [report, setReport] = useState<SystemReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [reindexing, setReindexing] = useState(false)
  const [reindexResult, setReindexResult] = useState<string | null>(null)
  const [harvesting, setHarvesting] = useState(false)
  const [harvestResult, setHarvestResult] = useState<string | null>(null)
  const [snapshotIngesting, setSnapshotIngesting] = useState(false)
  const [snapshotIngestResult, setSnapshotIngestResult] = useState<string | null>(null)
  const [ltHarvesting, setLtHarvesting] = useState(false)
  const [ltHarvestResult, setLtHarvestResult] = useState<string | null>(null)
  const [traceCopied, setTraceCopied] = useState(false)
  const rawJsonRef = useRef<string>("")

  const fetchReport = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/admin/system-report?t=${Date.now()}`, {
        headers: { "x-ops-password": password },
        cache: "no-store",
        signal,
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      rawJsonRef.current = JSON.stringify(data, null, 2)
      setReport(data)
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") return
      setError(toErrMsg(e))
    } finally {
      setLoading(false)
    }
  }, [password])

  useEffect(() => { fetchReport() }, [fetchReport])

  const { lastUpdatedAt: statusLiveAt, isRefreshing: statusRefreshing, refreshNow: statusRefreshNow } = useAutoRefresh({
    intervalMs: 20_000,
    enabled: true,
    onTick: fetchReport,
  })

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(rawJsonRef.current)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* */ }
  }

  const handleReindex = async () => {
    setReindexing(true)
    setReindexResult(null)
    try {
      const res = await fetch("/api/admin/snapshot/reindex", {
        method: "POST",
        headers: { "x-ops-password": password },
      })
      const data = await res.json()
      if (res.ok) {
        setReindexResult(`Done: ${data.indexBefore ?? "?"} -> ${data.indexAfter ?? "?"} mints (added ${data.addedCount ?? 0})`)
        setTimeout(() => fetchReport(), 1500)
      } else {
        setReindexResult(`Error: ${data.error ?? res.status}`)
      }
    } catch (e: unknown) {
      setReindexResult(`Failed: ${toErrMsg(e)}`)
    } finally {
      setReindexing(false)
    }
  }

  const handleHarvest = async () => {
    setHarvesting(true)
    setHarvestResult(null)
    try {
      const res = await fetch("/api/admin/harvest/run", { method: "POST", headers: { "x-ops-password": password } })
      const data = await res.json()
      if (data.started === false) setHarvestResult(`Skipped: ${data.reason ?? "unknown"}`)
      else if (res.ok) { setHarvestResult(data.note ?? "Harvest completed"); setTimeout(() => fetchReport(), 2000) }
      else setHarvestResult(`Error: ${data.note ?? res.status}`)
    } catch (e: unknown) { setHarvestResult(`Failed: ${toErrMsg(e)}`) }
    finally { setHarvesting(false) }
  }

  const handleSnapshotIngest = async () => {
    setSnapshotIngesting(true)
    setSnapshotIngestResult(null)
    try {
      const res = await fetch("/api/admin/run-snapshot-ingest", { method: "POST", headers: { "x-ops-password": password } })
      const data = await res.json()
      if (data.started === false) setSnapshotIngestResult(`Skipped: ${data.reason ?? "unknown"}`)
      else if (res.ok) { setSnapshotIngestResult(data.note ?? "Snapshot ingest completed"); setTimeout(() => fetchReport(), 2000) }
      else setSnapshotIngestResult(`Error: ${data.note ?? res.status}`)
    } catch (e: unknown) { setSnapshotIngestResult(`Failed: ${toErrMsg(e)}`) }
    finally { setSnapshotIngesting(false) }
  }

  const handleLtHarvest = async () => {
    setLtHarvesting(true)
    setLtHarvestResult(null)
    try {
      const res = await fetch("/api/admin/run-leadtime-harvest", { method: "POST", headers: { "x-ops-password": password } })
      const data = await res.json()
      if (data.started === false) setLtHarvestResult(`Skipped: ${data.reason ?? "unknown"}`)
      else if (res.ok) { setLtHarvestResult(data.note ?? "Lead-time harvest completed"); setTimeout(() => fetchReport(), 2000) }
      else setLtHarvestResult(`Error: ${data.note ?? res.status}`)
    } catch (e: unknown) { setLtHarvestResult(`Failed: ${toErrMsg(e)}`) }
    finally { setLtHarvesting(false) }
  }

  const handleCopyTrace = async () => {
    try {
      const res = await fetch("/api/admin/readpath-trace", { headers: { "x-ops-password": password } })
      const data = await res.json()
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      setTraceCopied(true)
      setTimeout(() => setTraceCopied(false), 2000)
    } catch (e: unknown) {
      alert(`Failed: ${toErrMsg(e)}`)
    }
  }

  const sampleMint = report?.kv?.samples?.find((s) => s.mintFull)?.mintFull ?? ""

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-mono font-bold flex items-center gap-2 text-zinc-200">
            <Activity className="h-5 w-5" />
            {"◈"} SYSTEM STATUS
            <LiveIndicator lastUpdatedAt={statusLiveAt} isRefreshing={statusRefreshing} onRefresh={statusRefreshNow} />
          </h2>
          <p className="text-xs font-mono text-zinc-600 mt-1">Live diagnostic report — KV, Proof Engine, Lead-Time</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {report && <span className="text-xs text-zinc-600 font-mono">{report.durationMs}ms</span>}
          <Button variant="outline" size="sm" onClick={() => fetchReport()} disabled={loading} className="border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono">{error}</div>}

      {/* Global Status */}
      {report && (
        <div className="flex items-center gap-3">
          {statusBadge(report.ok, report.ok ? "ALL SYSTEMS OK" : "DEGRADED")}
          <span className="text-xs text-zinc-600 font-mono">as of {report.nowISO}</span>
        </div>
      )}

      {/* Gates Warning */}
      {report && report.gates.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-400 font-mono">
              <ShieldAlert className="h-4 w-4" />
              ACTIVE GATES ({report.gates.length})
            </CardTitle>
            <CardDescription className="text-xs text-amber-400/70 font-mono">
              These conditions may prevent signals from appearing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {report.gates.map((gate) => (
                <li key={gate} className="flex items-start gap-2 text-sm text-amber-300/90">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    <code className="font-mono text-xs text-amber-400">{gate}</code> — {gateLabel(gate)}
                  </span>
                </li>
              ))}
              {report.gates.includes("leadtime_harvest_stale") && (report.leadtimeHarvest as any)?.cronHit?.lastHitStatus === "401" && (
                <li className="flex items-start gap-2 text-sm text-orange-300/90 bg-orange-500/10 px-2 py-1.5 mt-1">
                  <ShieldAlert className="h-3.5 w-3.5 mt-0.5 shrink-0 text-orange-400" />
                  <span className="text-xs">
                    <strong className="text-orange-400">Likely fix:</strong>{" "}
                    <code className="font-mono text-orange-300">CRON_SECRET</code> is missing or mismatched.
                  </span>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 3 Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KV Snapshots */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2 text-zinc-200 font-mono">
                <Database className="h-4 w-4" /> KV SNAPSHOTS
              </CardTitle>
              {report && statusBadge(report.kv?.ok)}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {report?.kv ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-600">Tracked Mints</p>
                    <p className="text-xl font-mono font-semibold text-zinc-200">{report.kv.trackedMintsCount ?? "--"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-600">In 24h Window</p>
                    <p className="text-xl font-mono font-semibold text-zinc-200">{(report.kv as any).countLast24hOverall ?? "--"}</p>
                  </div>
                </div>
                {(report.kv as any).newestObservedAtOverall && (
                  <div className="pt-1">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-600">Newest Snapshot (overall)</p>
                    <p className="text-xs font-mono text-zinc-400">{fmtAge((report.kv as any).newestObservedAgeSecOverall)} ago</p>
                  </div>
                )}
                <div className="pt-1">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600">KV Identity</p>
                  <p className="text-xs font-mono text-zinc-500 truncate">{report.kv.kvIdentity ?? "--"}</p>
                </div>
                {report.kv.samples && report.kv.samples.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-600">Sample Mints</p>
                    {report.kv.samples.map((s, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <code className="font-mono text-zinc-500 truncate max-w-[120px]">{s.mint}</code>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-zinc-300">{s.countLast24h ?? 0}</span>
                          <span className="text-zinc-600">/24h</span>
                          <span className="font-mono text-zinc-600">({s.llen ?? 0} total)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {report.kv.error && <p className="text-xs text-red-400 font-mono">{report.kv.error}</p>}
              </>
            ) : (
              <p className="text-sm text-zinc-600 font-mono">Loading...</p>
            )}
          </CardContent>
        </Card>

        {/* Proof Engine */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2 text-zinc-200 font-mono">
                <Cpu className="h-4 w-4" /> PROOF ENGINE
              </CardTitle>
              {report && statusBadge(report.proof?.ok)}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {report?.proof ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-600">Last Update</p>
                    <p className="text-xl font-mono font-semibold text-zinc-200">{fmtAge(report.proof.lastUpdateAgeSec)}</p>
                    <p className="text-[10px] text-zinc-600">ago</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-600">Processed</p>
                    <p className="text-xl font-mono font-semibold text-zinc-200">{report.proof.lastProcessedCount ?? "--"}</p>
                    <p className="text-[10px] text-zinc-600">items</p>
                  </div>
                </div>
                <div className="space-y-1 pt-2 border-t border-zinc-800">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-600">Status</span>
                    <span className="font-mono text-zinc-300">{report.proof.lastRunStatus ?? "--"}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-600">Fresh</span>
                    <span className="font-mono text-zinc-300">{report.proof.isFresh ? "YES" : "NO"}</span>
                  </div>
                  {report.proof.lastErrorISO && (
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-600">Last Error</span>
                      <span className="font-mono text-red-400 truncate max-w-[160px]">{report.proof.lastErrorISO}</span>
                    </div>
                  )}
                </div>
                {report.proof.error && <p className="text-xs text-red-400 font-mono">{report.proof.error}</p>}
              </>
            ) : (
              <p className="text-sm text-zinc-600 font-mono">Loading...</p>
            )}
          </CardContent>
        </Card>

        {/* Lead-Time */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2 text-zinc-200 font-mono">
                <Clock className="h-4 w-4" /> LEAD-TIME
              </CardTitle>
              {report && statusBadge(report.leadtime?.ok)}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {report?.leadtime ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-600">Recent Proofs</p>
                    <p className="text-xl font-mono font-semibold text-zinc-200">{report.leadtime.recentCount ?? "--"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-600">Last Scanned</p>
                    <p className="text-xl font-mono font-semibold text-zinc-200">{fmtAge(report.leadtime.scannedAgoSec)}</p>
                    <p className="text-[10px] text-zinc-600">ago</p>
                  </div>
                </div>
                {report.leadtime.error && <p className="text-xs text-red-400 font-mono">{report.leadtime.error}</p>}
              </>
            ) : (
              <p className="text-sm text-zinc-600 font-mono">Loading...</p>
            )}
          </CardContent>
        </Card>

        {/* Lead-Time Harvest */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2 text-zinc-200 font-mono">
                <Clock className="h-4 w-4" /> LEAD-TIME HARVEST
              </CardTitle>
              {report && statusBadge(report.leadtimeHarvest?.ok)}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {report?.leadtimeHarvest ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-600">Last Run</p>
                    <p className="text-xl font-mono font-semibold text-zinc-200">
                      {report.leadtimeHarvest.lastRunAt ? fmtAge(report.leadtimeHarvest.ageSec) : "--"}
                    </p>
                    {report.leadtimeHarvest.lastRunAt && <p className="text-[10px] text-zinc-600">ago</p>}
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-600">Status</p>
                    <p className={`text-sm font-mono font-semibold ${
                      report.leadtimeHarvest.status?.startsWith("ERROR") ? "text-red-400" :
                      report.leadtimeHarvest.status === "OK" ? "text-emerald-400" : "text-zinc-300"
                    }`}>{report.leadtimeHarvest.status ?? "--"}</p>
                  </div>
                </div>
                {(report.leadtimeHarvest as any).cronHit && (
                  <div className="border-t border-zinc-800 pt-2">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1.5">Cron Last Hit</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-zinc-400">
                        {(report.leadtimeHarvest as any).cronHit.lastHitAt ? fmtAge((report.leadtimeHarvest as any).cronHit.lastHitAgeSec) + " ago" : "Never"}
                      </span>
                      {(report.leadtimeHarvest as any).cronHit.lastHitStatus && (
                        <Badge className={`font-mono text-[10px] px-1.5 py-0 ${
                          (report.leadtimeHarvest as any).cronHit.lastHitStatus === "200" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40" :
                          (report.leadtimeHarvest as any).cronHit.lastHitStatus === "401" ? "bg-orange-500/15 text-orange-400 border-orange-500/40" :
                          "bg-red-500/15 text-red-400 border-red-500/40"
                        }`}>{(report.leadtimeHarvest as any).cronHit.lastHitStatus}</Badge>
                      )}
                    </div>
                  </div>
                )}
                {report.leadtimeHarvest.lastResult && (
                  <div className="grid grid-cols-3 gap-2 text-center border-t border-zinc-800 pt-2">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-zinc-600">Scanned</p>
                      <p className="text-sm font-mono font-semibold text-zinc-300">{(report.leadtimeHarvest.lastResult as any).tokensScanned ?? "--"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-zinc-600">Wrote</p>
                      <p className="text-sm font-mono font-semibold text-zinc-300">{(report.leadtimeHarvest.lastResult as any).wroteCount ?? "--"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-zinc-600">Duration</p>
                      <p className="text-sm font-mono font-semibold text-zinc-300">
                        {(report.leadtimeHarvest.lastResult as any).durationMs ? `${Math.round((report.leadtimeHarvest.lastResult as any).durationMs / 1000)}s` : "--"}
                      </p>
                    </div>
                  </div>
                )}
                {report.leadtimeHarvest.lastError && (
                  <div className="border-t border-zinc-800 pt-2">
                    <p className="text-[10px] uppercase tracking-wider text-red-400 mb-1">Last Error</p>
                    <p className="text-xs text-red-400 font-mono break-all">{(report.leadtimeHarvest.lastError as any).message ?? JSON.stringify(report.leadtimeHarvest.lastError)}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-zinc-600 font-mono">Loading...</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Admin Controls */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-zinc-200 font-mono">
            <Wrench className="h-4 w-4" /> {"◈"} ADMIN CONTROLS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button variant="outline" size="sm" className="justify-start gap-2 text-xs border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200" disabled={!sampleMint} onClick={() => { if (sampleMint) window.open(`/api/debug/kv-snapshots?mint=${encodeURIComponent(sampleMint)}`, "_blank") }}>
              <Database className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Open KV Probe</span> <ExternalLink className="h-3 w-3 ml-auto shrink-0" />
            </Button>
            <Button variant="outline" size="sm" className="justify-start gap-2 text-xs border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200" disabled={reindexing} onClick={handleReindex}>
              <RefreshCw className={`h-3.5 w-3.5 shrink-0 ${reindexing ? "animate-spin" : ""}`} /> <span className="truncate">{reindexing ? "Reindexing..." : "Run Snapshot Reindex"}</span>
            </Button>
            <Button variant="outline" size="sm" className="justify-start gap-2 text-xs border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200" disabled={harvesting} onClick={handleHarvest}>
              <Zap className={`h-3.5 w-3.5 shrink-0 ${harvesting ? "animate-pulse text-amber-400" : ""}`} /> <span className="truncate">{harvesting ? "Harvesting..." : "Run Harvest Now"}</span>
            </Button>
            <Button variant="outline" size="sm" className="justify-start gap-2 text-xs border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200" disabled={snapshotIngesting} onClick={handleSnapshotIngest}>
              <Download className={`h-3.5 w-3.5 shrink-0 ${snapshotIngesting ? "animate-pulse text-blue-400" : ""}`} /> <span className="truncate">{snapshotIngesting ? "Ingesting..." : "Run Snapshot Ingest"}</span>
            </Button>
            <Button variant="outline" size="sm" className="justify-start gap-2 text-xs border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200" disabled={ltHarvesting} onClick={handleLtHarvest}>
              <Timer className={`h-3.5 w-3.5 shrink-0 ${ltHarvesting ? "animate-pulse text-cyan-400" : ""}`} /> <span className="truncate">{ltHarvesting ? "Harvesting..." : "Run Lead-Time Harvest"}</span>
            </Button>
            <Button variant="outline" size="sm" className="justify-start gap-2 text-xs border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200" onClick={() => window.open("/api/proof-engine-health?debug=1", "_blank")}>
              <Cpu className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Proof Health Debug</span> <ExternalLink className="h-3 w-3 ml-auto shrink-0" />
            </Button>
            <Button variant="outline" size="sm" className="justify-start gap-2 text-xs border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200" disabled={!report} onClick={handleCopyJson}>
              {copied ? <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 shrink-0" />}
              <span className="truncate">{copied ? "Copied!" : "Copy JSON"}</span>
            </Button>
            <Button variant="outline" size="sm" className="justify-start gap-2 text-xs border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200" onClick={handleCopyTrace}>
              {traceCopied ? <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 shrink-0" />}
              <span className="truncate">{traceCopied ? "Copied!" : "Copy Trace JSON"}</span>
            </Button>
          </div>
          {reindexResult && <div className="mt-3 p-2 bg-zinc-950 text-xs font-mono text-zinc-500 border border-zinc-800">{reindexResult}</div>}
          {harvestResult && <div className="mt-3 p-2 bg-zinc-950 text-xs font-mono text-zinc-500 border border-zinc-800">{harvestResult}</div>}
          {snapshotIngestResult && <div className="mt-3 p-2 bg-zinc-950 text-xs font-mono text-zinc-500 border border-zinc-800">{snapshotIngestResult}</div>}
          {ltHarvestResult && <div className="mt-3 p-2 bg-zinc-950 text-xs font-mono text-zinc-500 border border-zinc-800">{ltHarvestResult}</div>}
        </CardContent>
      </Card>

      {report && (
        <div className="flex items-center gap-4 text-xs text-zinc-600 font-mono">
          <span>24h cutoff: {report.cutoffISO}</span>
          <span className="text-zinc-800">|</span>
          <span>now: {report.nowISO}</span>
        </div>
      )}
    </div>
  )
}
