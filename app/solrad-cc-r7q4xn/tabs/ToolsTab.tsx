"use client"

import { useState, useCallback } from "react"
import { RefreshCw, Database, Copy, Check, ChevronDown, ChevronRight } from "lucide-react"

interface SubcallResult {
  id: string
  url: string
  status: number
  ok: boolean
  durationMs: number
  internalAuthHeader: string | null
  bodyPreview: string
  error: string | null
}

interface DiagReport {
  ok: boolean
  nowISO: string
  totalDurationMs: number
  envPresence: Record<string, unknown>
  results: SubcallResult[]
}

interface KvKeyResult {
  key: string
  exists: boolean
  value: string | null
  type: string
}

interface KvScanReport {
  ok: boolean
  nowISO: string
  durationMs: number
  keyCount: number
  existingCount: number
  results: KvKeyResult[]
}

function statusBadgeColor(status: number): string {
  if (status >= 200 && status < 300) return "bg-green-500/20 text-green-400 border-green-500/30"
  if (status >= 400) return "bg-red-500/20 text-red-400 border-red-500/30"
  return "bg-zinc-700/50 text-zinc-400 border-zinc-600"
}

function CollapsibleJson({ data, label }: { data: unknown; label: string }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const json = JSON.stringify(data, null, 2)

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {label}
      </button>
      {open && (
        <div className="relative mt-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(json)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
            className="absolute top-2 right-2 p-1 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3 text-zinc-500" />}
          </button>
          <pre className="p-3 rounded bg-zinc-900 text-[10px] font-mono overflow-x-auto max-h-80 text-zinc-300">
            {json}
          </pre>
        </div>
      )}
    </div>
  )
}

interface ToolsTabProps {
  adminHeaders: Record<string, string>;
  password: string;
}

export function ToolsTab({ adminHeaders }: ToolsTabProps) {
  const [diagLoading, setDiagLoading] = useState(false)
  const [diagReport, setDiagReport] = useState<DiagReport | null>(null)
  const [diagError, setDiagError] = useState<string | null>(null)

  const [kvLoading, setKvLoading] = useState(false)
  const [kvReport, setKvReport] = useState<KvScanReport | null>(null)
  const [kvError, setKvError] = useState<string | null>(null)

  const runDiag = useCallback(async () => {
    setDiagLoading(true)
    setDiagError(null)
    setDiagReport(null)
    try {
      const res = await fetch("/api/admin/tools/diag", { headers: adminHeaders, cache: "no-store" })
      if (!res.ok) {
        const text = await res.text().catch(() => "")
        setDiagError(`HTTP ${res.status}: ${text.slice(0, 300)}`)
        return
      }
      setDiagReport(await res.json())
    } catch (err) {
      setDiagError(err instanceof Error ? err.message : String(err))
    } finally {
      setDiagLoading(false)
    }
  }, [adminHeaders])

  const runKvScan = useCallback(async () => {
    setKvLoading(true)
    setKvError(null)
    setKvReport(null)
    try {
      const res = await fetch("/api/admin/tools/kv-scan", { headers: adminHeaders, cache: "no-store" })
      if (!res.ok) {
        const text = await res.text().catch(() => "")
        setKvError(`HTTP ${res.status}: ${text.slice(0, 300)}`)
        return
      }
      setKvReport(await res.json())
    } catch (err) {
      setKvError(err instanceof Error ? err.message : String(err))
    } finally {
      setKvLoading(false)
    }
  }, [adminHeaders])

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="font-mono text-xs text-zinc-400 tracking-widest mb-1">DIAGNOSTICS & KV INSPECTION</h2>
        <p className="text-[10px] text-zinc-600">Proof Engine subcall tests and data store health checks</p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={runDiag}
          disabled={diagLoading}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-700 text-zinc-300 font-mono text-xs tracking-widest hover:border-green-500/50 hover:text-green-400 transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`h-3 w-3 ${diagLoading ? "animate-spin" : ""}`} />
          {diagLoading ? "RUNNING..." : "RUN DIAGNOSTICS"}
        </button>
        <button
          onClick={runKvScan}
          disabled={kvLoading}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-700 text-zinc-300 font-mono text-xs tracking-widest hover:border-green-500/50 hover:text-green-400 transition-colors disabled:opacity-40"
        >
          <Database className={`h-3 w-3 ${kvLoading ? "animate-spin" : ""}`} />
          {kvLoading ? "SCANNING..." : "KV SCAN"}
        </button>
      </div>

      {/* Diag error */}
      {diagError && (
        <div className="border border-red-500/30 bg-red-500/5 p-4 rounded">
          <p className="text-xs text-red-400 font-mono">{diagError}</p>
        </div>
      )}

      {/* Diag results */}
      {diagReport && (
        <div className="border border-zinc-800 rounded p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-zinc-400 tracking-widest">DIAGNOSTIC RESULTS</span>
            <div className="flex items-center gap-2">
              <span className={`font-mono text-[10px] px-2 py-0.5 rounded border ${diagReport.ok ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
                {diagReport.ok ? "ALL OK" : "FAILURES"}
              </span>
              <span className="text-[10px] text-zinc-600 font-mono">{diagReport.totalDurationMs}ms</span>
            </div>
          </div>

          {/* Env presence */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(diagReport.envPresence).map(([k, v]) => (
              <span key={k} className={`font-mono text-[10px] px-2 py-0.5 rounded border ${v ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-zinc-800 text-zinc-500 border-zinc-700"}`}>
                {k}: {v ? (typeof v === "string" ? v : "set") : "unset"}
              </span>
            ))}
          </div>

          {/* Subcall results */}
          <div className="space-y-2">
            {diagReport.results.map((r) => (
              <div key={r.id} className={`border rounded p-3 ${!r.ok || r.status >= 400 ? "border-red-500/30 bg-red-500/5" : "border-zinc-800"}`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-zinc-200">{r.id}</span>
                    <span className={`font-mono text-[10px] px-2 py-0.5 rounded border ${statusBadgeColor(r.status)}`}>
                      {r.status || "ERR"}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-600 font-mono">{r.durationMs}ms</span>
                </div>
                <p className="mt-1 text-[10px] text-zinc-600 font-mono break-all">{r.url}</p>
                {r.error && <p className="mt-1 text-[10px] text-red-400 font-mono">Error: {r.error}</p>}
              </div>
            ))}
          </div>

          <CollapsibleJson data={diagReport} label="Raw JSON" />
        </div>
      )}

      {/* KV error */}
      {kvError && (
        <div className="border border-red-500/30 bg-red-500/5 p-4 rounded">
          <p className="text-xs text-red-400 font-mono">{kvError}</p>
        </div>
      )}

      {/* KV results */}
      {kvReport && (
        <div className="border border-zinc-800 rounded p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-zinc-400 tracking-widest">KV SCAN RESULTS</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] px-2 py-0.5 rounded border bg-green-500/10 text-green-400 border-green-500/20">
                {kvReport.existingCount}/{kvReport.keyCount} keys
              </span>
              <span className="text-[10px] text-zinc-600 font-mono">{kvReport.durationMs}ms</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="py-2 px-3 text-[10px] font-semibold text-zinc-500 tracking-widest">KEY</th>
                  <th className="py-2 px-3 text-[10px] font-semibold text-zinc-500 tracking-widest">STATUS</th>
                  <th className="py-2 px-3 text-[10px] font-semibold text-zinc-500 tracking-widest">TYPE</th>
                  <th className="py-2 px-3 text-[10px] font-semibold text-zinc-500 tracking-widest">VALUE</th>
                </tr>
              </thead>
              <tbody>
                {kvReport.results.map((r) => (
                  <tr key={r.key} className={`border-b border-zinc-800/50 ${!r.exists ? "opacity-40" : ""}`}>
                    <td className="py-2 px-3 font-mono text-[10px] text-zinc-300">{r.key}</td>
                    <td className="py-2 px-3">
                      <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${r.exists ? "bg-green-500/10 text-green-400" : "bg-zinc-800 text-zinc-500"}`}>
                        {r.exists ? "exists" : "missing"}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-[10px] text-zinc-500 font-mono">{r.type}</td>
                    <td className="py-2 px-3 text-[10px] font-mono text-zinc-400 max-w-md break-all">
                      {r.value ? <span className="line-clamp-3">{r.value}</span> : <span className="text-zinc-600">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <CollapsibleJson data={kvReport} label="Raw JSON" />
        </div>
      )}
    </div>
  )
}
