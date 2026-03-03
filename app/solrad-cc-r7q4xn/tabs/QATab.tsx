"use client"

import { useState, useCallback } from "react"
import { Activity, CheckCircle2, XCircle, ChevronDown, ChevronRight, ExternalLink, Clock } from "lucide-react"

interface QATestResult {
  testName: string
  pass: boolean
  reason?: string
  tokenSymbol?: string
  tokenMint?: string
  dexUrl?: string
}

interface QASummary {
  totalTests: number
  passed: number
  failed: number
  timestamp: string
  duration: number
}

interface QAReport {
  summary: QASummary
  results: QATestResult[]
  columnChecks: {
    newEarly: { pass: boolean; failures: string[] }
    active: { pass: boolean; failures: string[] }
    trending: { pass: boolean; failures: string[] }
  }
}

interface QATabProps {
  adminHeaders: Record<string, string>;
  password: string;
}

export function QATab({ adminHeaders }: QATabProps) {
  const [running, setRunning] = useState(false)
  const [report, setReport] = useState<QAReport | null>(null)
  const [error, setError] = useState("")
  const [expandedFailures, setExpandedFailures] = useState<Set<string>>(new Set())

  const runQA = useCallback(async () => {
    setRunning(true)
    setError("")
    setReport(null)
    try {
      const res = await fetch("/api/admin/qa/run", {
        method: "POST",
        headers: adminHeaders,
      })
      if (!res.ok) throw new Error(`QA failed: ${res.status}`)
      setReport(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : "QA run failed")
    } finally {
      setRunning(false)
    }
  }, [adminHeaders])

  const toggleExpanded = (key: string) => {
    const next = new Set(expandedFailures)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setExpandedFailures(next)
  }

  const failedResults = report?.results.filter((r) => !r.pass) || []
  const passedResults = report?.results.filter((r) => r.pass) || []

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-xs text-zinc-400 tracking-widest mb-1">DATA QUALITY CHECKS</h2>
          <p className="text-[10px] text-zinc-600">Comprehensive verification against live production data</p>
        </div>
        <button
          onClick={runQA}
          disabled={running}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-700 text-zinc-300 font-mono text-xs tracking-widest hover:border-green-500/50 hover:text-green-400 transition-colors disabled:opacity-40"
        >
          <Activity className={`h-3 w-3 ${running ? "animate-spin" : ""}`} />
          {running ? "RUNNING..." : "RUN QA"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="border border-red-500/30 bg-red-500/5 p-4 rounded">
          <p className="text-xs text-red-400 font-mono">{error}</p>
        </div>
      )}

      {/* Summary */}
      {report && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="border border-zinc-800 rounded p-4">
            <div className="text-[10px] text-zinc-500 tracking-widest mb-1">TOTAL</div>
            <div className="text-2xl font-mono font-bold text-zinc-200">{report.summary.totalTests}</div>
          </div>
          <div className="border border-zinc-800 rounded p-4">
            <div className="text-[10px] text-zinc-500 tracking-widest mb-1">PASSED</div>
            <div className="text-2xl font-mono font-bold text-green-400">{report.summary.passed}</div>
          </div>
          <div className="border border-zinc-800 rounded p-4">
            <div className="text-[10px] text-zinc-500 tracking-widest mb-1">FAILED</div>
            <div className="text-2xl font-mono font-bold text-red-400">{report.summary.failed}</div>
          </div>
          <div className="border border-zinc-800 rounded p-4">
            <div className="text-[10px] text-zinc-500 tracking-widest mb-1">DURATION</div>
            <div className="text-2xl font-mono font-bold text-zinc-200 flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {(report.summary.duration / 1000).toFixed(1)}s
            </div>
          </div>
          <div className="border border-zinc-800 rounded p-4">
            <div className="text-[10px] text-zinc-500 tracking-widest mb-1">STATUS</div>
            <span className={`font-mono text-sm font-bold px-3 py-1 rounded border ${report.summary.failed === 0 ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
              {report.summary.failed === 0 ? "PASS" : "FAIL"}
            </span>
          </div>
        </div>
      )}

      {/* Column rule checks */}
      {report && (
        <div className="space-y-3">
          <h3 className="font-mono text-[10px] text-zinc-500 tracking-widest">COLUMN RULE VALIDATION</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {(["newEarly", "active", "trending"] as const).map((col) => {
              const check = report.columnChecks[col]
              const labels = { newEarly: "New/Early", active: "Active Trading", trending: "Trending" }
              return (
                <div key={col} className="border border-zinc-800 rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-zinc-300">{labels[col]}</span>
                    {check.pass ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                  {check.failures.length > 0 ? (
                    <div className="space-y-1">
                      {check.failures.map((f, i) => (
                        <div key={i} className="text-[10px] text-red-400 bg-red-500/10 p-2 rounded font-mono">{f}</div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-green-400 font-mono">All rules passed</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Failed tests */}
      {report && failedResults.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-400" />
            <h3 className="font-mono text-xs text-zinc-400 tracking-widest">FAILED TESTS ({failedResults.length})</h3>
          </div>
          <div className="space-y-2">
            {failedResults.map((result, idx) => {
              const key = `failed-${idx}`
              const isExpanded = expandedFailures.has(key)
              return (
                <div key={key} className="border border-red-500/30 rounded overflow-hidden">
                  <button
                    onClick={() => toggleExpanded(key)}
                    className="w-full p-3 bg-red-500/5 hover:bg-red-500/10 transition-colors flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown className="h-3 w-3 text-zinc-500" /> : <ChevronRight className="h-3 w-3 text-zinc-500" />}
                      <XCircle className="h-3 w-3 text-red-400" />
                      <span className="font-mono text-[10px] text-zinc-300">{result.testName}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-zinc-700 text-zinc-500">{result.tokenSymbol || "N/A"}</span>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="p-3 border-t border-red-500/30 space-y-1 text-[10px] font-mono">
                      {result.reason && <div><span className="text-zinc-500">Reason: </span><span className="text-red-400">{result.reason}</span></div>}
                      {result.tokenMint && <div><span className="text-zinc-500">Mint: </span><code className="bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-300">{result.tokenMint}</code></div>}
                      {result.dexUrl && (
                        <div>
                          <span className="text-zinc-500">DexUrl: </span>
                          <a href={result.dexUrl} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline inline-flex items-center gap-1">
                            {result.dexUrl} <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Passed tests */}
      {report && passedResults.length > 0 && (
        <div className="border border-zinc-800 rounded p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <span className="font-mono text-xs text-zinc-400 tracking-widest">PASSED TESTS ({passedResults.length})</span>
          </div>
          <p className="text-[10px] text-zinc-600 mt-1 font-mono">All passed. No issues detected.</p>
        </div>
      )}
    </div>
  )
}
