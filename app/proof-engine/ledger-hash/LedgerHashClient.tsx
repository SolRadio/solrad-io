"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Copy,
  CheckCircle2,
  Shield,
  Clock,
  Hash,
  ArrowLeft,
  RefreshCw,
  FileCheck,
  AlertTriangle,
} from "lucide-react"

// ── Types ──

interface HashHistoryRecord {
  ledgerHash: string
  hashUpdatedAt: string
  entryCount: number
  reason: "append" | "void" | "recompute"
}

interface HashHistoryResponse {
  ok: boolean
  requestId: string
  current: {
    ledgerHash: string | null
    hashUpdatedAt: number | null
    hashEntryCount: number | null
  }
  history: HashHistoryRecord[]
  totalHistoryRecords: number
}

// ── Helpers ──

function truncateHash(hash: string): string {
  if (hash.length <= 16) return hash
  return `${hash.slice(0, 10)}\u2026${hash.slice(-8)}`
}

function fmtAgo(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "\u2014"
  if (sec < 60) return `${sec}s ago`
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`
  return `${Math.floor(sec / 86400)}d ago`
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  } catch {
    return "\u2014"
  }
}

function reasonLabel(r: string): { text: string; color: string } {
  switch (r) {
    case "append":
      return { text: "Append", color: "text-green-400/80" }
    case "void":
      return { text: "Void", color: "text-amber-400/80" }
    case "recompute":
      return { text: "Recompute", color: "text-blue-400/80" }
    default:
      return { text: r, color: "text-muted-foreground/60" }
  }
}

// ── Component ──

export default function LedgerHashPage() {
  const [data, setData] = useState<HashHistoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const copyText = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }, [])

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/alpha-ledger/hash-history")
      const text = await res.text()

      let parsed: HashHistoryResponse
      try {
        parsed = JSON.parse(text)
      } catch {
        setError(`Non-JSON response (${res.status})`)
        return
      }

      if (!res.ok) {
        setError(parsed.message || `HTTP ${res.status}`)
        return
      }

      setData(parsed)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Staleness check: > 2 hours = degraded
  const hashUpdatedAt = data?.current.hashUpdatedAt
  let statusDot: "ok" | "degraded" | "unknown" = "unknown"
  let statusLabel = "Unknown"
  if (hashUpdatedAt && Number.isFinite(hashUpdatedAt)) {
    const agoSec = Math.round((Date.now() - hashUpdatedAt) / 1000)
    if (agoSec <= 7200) {
      statusDot = "ok"
      statusLabel = "OK"
    } else {
      statusDot = "degraded"
      statusLabel = "Stale"
    }
  }

  const dotColor =
    statusDot === "ok"
      ? "bg-green-500"
      : statusDot === "degraded"
        ? "bg-amber-500"
        : "bg-muted-foreground/40"

  const hash = data?.current.ledgerHash
  const entryCount = data?.current.hashEntryCount
  const agoLabel =
    hashUpdatedAt && Number.isFinite(hashUpdatedAt)
      ? fmtAgo(Math.round((Date.now() - hashUpdatedAt) / 1000))
      : "\u2014"
  const exactDate =
    hashUpdatedAt && Number.isFinite(hashUpdatedAt)
      ? fmtDate(new Date(hashUpdatedAt).toISOString())
      : "\u2014"

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/research"
            className="text-muted-foreground/50 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary/70" />
            <h1 className="text-sm font-mono font-semibold text-foreground/90 tracking-tight">
              Ledger Hash Verification
            </h1>
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="ml-auto p-1.5 rounded border border-border/20 text-muted-foreground/50 hover:text-foreground hover:border-border/40 transition-colors disabled:opacity-30"
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 px-3 py-2.5 border border-red-500/30 rounded-sm bg-red-500/5">
            <p className="text-[11px] font-mono text-red-400/90 flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !data && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-sm bg-muted/20 shimmer" />
            ))}
          </div>
        )}

        {/* Content */}
        {data && (
          <>
            {/* Current Hash Card */}
            <div className="border border-border/20 rounded-sm bg-card/30 mb-6">
              <div className="px-4 py-3 border-b border-border/15 flex items-center gap-2">
                <Hash className="h-3.5 w-3.5 text-primary/60" />
                <span className="text-[11px] font-mono font-semibold text-foreground/80 uppercase tracking-wider">
                  Current Ledger Hash
                </span>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${dotColor} ${statusDot === "ok" ? "breathe-dot" : ""}`} />
                  <span className="text-[10px] font-mono text-muted-foreground/60">
                    {statusLabel}
                  </span>
                </div>
              </div>

              <div className="px-4 py-4">
                {/* Hash value */}
                <div className="flex items-center gap-2 mb-3">
                  <code className="text-sm font-mono text-foreground/80 tabular-nums select-all break-all leading-relaxed" title={hash ?? undefined}>
                    {hash || "\u2014"}
                  </code>
                  {hash && (
                    <button
                      onClick={() => copyText(hash, "current-hash")}
                      className="shrink-0 p-1 rounded text-muted-foreground/40 hover:text-primary transition-colors"
                      title="Copy full hash"
                    >
                      {copied === "current-hash" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Metadata row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono text-muted-foreground/60">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span title={exactDate}>{agoLabel}</span>
                    <span className="text-muted-foreground/30">({exactDate})</span>
                  </div>
                  <div>
                    <span className="text-foreground/60">{entryCount != null && Number.isFinite(entryCount) ? entryCount : "\u2014"}</span>
                    <span className="ml-0.5">entries</span>
                  </div>
                  <div>
                    <span className="text-foreground/60">{data.totalHistoryRecords}</span>
                    <span className="ml-0.5">hash changes recorded</span>
                  </div>
                </div>
              </div>
            </div>

            {/* How to Verify */}
            <div className="border border-border/15 rounded-sm bg-card/20 mb-6 px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <FileCheck className="h-3.5 w-3.5 text-primary/50" />
                <span className="text-[10px] font-mono font-semibold text-foreground/70 uppercase tracking-wider">
                  How to Verify
                </span>
              </div>
              <ol className="text-[11px] font-mono text-muted-foreground/60 space-y-1.5 list-decimal list-inside">
                <li>Compare this hash with past snapshots in the history below</li>
                <li>Export CSV from Proof Engine and confirm entry count alignment</li>
                <li>Hashes only change when entries are appended or voided</li>
                <li>A stable hash across multiple checks confirms no silent data changes</li>
              </ol>
            </div>

            {/* History Table */}
            <div className="border border-border/20 rounded-sm bg-card/30">
              <div className="px-4 py-2.5 border-b border-border/15 flex items-center justify-between">
                <span className="text-[10px] font-mono font-semibold text-foreground/70 uppercase tracking-wider">
                  Hash History
                </span>
                <span className="text-[9px] font-mono text-muted-foreground/40">
                  Showing {Math.min(data.history.length, 20)} of {data.totalHistoryRecords}
                </span>
              </div>

              {data.history.length === 0 ? (
                <div className="px-4 py-8 text-center text-[11px] font-mono text-muted-foreground/40">
                  No hash changes recorded yet. History will populate after the next harvest.
                </div>
              ) : (
                <div className="overflow-x-auto thin-scrollbar">
                  <table className="w-full text-[10px] font-mono">
                    <thead>
                      <tr className="border-b border-border/15 text-muted-foreground/40">
                        <th className="px-3 py-2 text-left font-medium">Time</th>
                        <th className="px-3 py-2 text-left font-medium">Hash</th>
                        <th className="px-3 py-2 text-right font-medium">Entries</th>
                        <th className="px-3 py-2 text-left font-medium">Reason</th>
                        <th className="px-3 py-2 w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {data.history.slice(0, 20).map((record, idx) => {
                        const r = reasonLabel(record.reason)
                        return (
                          <tr
                            key={`${record.hashUpdatedAt}-${idx}`}
                            className={`border-b border-border/10 transition-colors hover:bg-primary/5 ${idx % 2 === 1 ? "bg-muted/[0.04]" : ""}`}
                          >
                            <td className="px-3 py-2 text-muted-foreground/60 whitespace-nowrap" title={record.hashUpdatedAt}>
                              {fmtDate(record.hashUpdatedAt)}
                            </td>
                            <td className="px-3 py-2 text-foreground/70 tabular-nums whitespace-nowrap" title={record.ledgerHash}>
                              {truncateHash(record.ledgerHash)}
                            </td>
                            <td className="px-3 py-2 text-right text-foreground/60 tabular-nums">
                              {record.entryCount}
                            </td>
                            <td className="px-3 py-2">
                              <span className={`${r.color} text-[9px] font-semibold uppercase`}>{r.text}</span>
                            </td>
                            <td className="px-3 py-2">
                              <button
                                onClick={() => copyText(record.ledgerHash, `hist-${idx}`)}
                                className="text-muted-foreground/30 hover:text-primary transition-colors p-0.5"
                                title="Copy hash"
                              >
                                {copied === `hist-${idx}` ? (
                                  <CheckCircle2 className="h-3 w-3 text-green-400" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Footer */}
              <div className="px-3 py-2 border-t border-border/15 flex items-center justify-between text-[9px] font-mono text-muted-foreground/40">
                <span>
                  {data.requestId && `id: ${data.requestId}`}
                </span>
                <Link
                  href="/research"
                  className="underline underline-offset-2 hover:text-foreground transition-colors"
                >
                  Back to Proof Engine
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
