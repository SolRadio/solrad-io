"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type Outcome = "winning" | "neutral" | "losing"

interface ProofRow {
  symbol: string
  mint: string
  scoreBefore: number | null
  scoreAfter: number | null
  resultPct: number | null
  outcome: Outcome
  agoMs: number
}

function classifyOutcome(pct: number | null): Outcome {
  if (pct === null) return "neutral"
  if (pct > 2) return "winning"
  if (pct < -2) return "losing"
  return "neutral"
}

function formatAgo(ms: number): string {
  if (ms < 0) ms = 0
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return `${sec}s`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  return `${Math.floor(hr / 24)}d`
}

function extractResultPct(p: Record<string, unknown>): number | null {
  if (typeof p.resultPct === "number") return p.resultPct
  if (typeof p.changePct === "number") return p.changePct
  if (typeof p.priceChangePct === "number") return p.priceChangePct
  if (typeof p.priceChangePct24h === "number") return p.priceChangePct24h
  const mag = (p.reactionEvent as Record<string, unknown>)?.magnitude
  if (typeof mag === "number") return Math.round(mag * 100)
  const baseline = p.observationEvent as Record<string, unknown> | undefined
  const entry = (p.entryPrice ?? p.priceAtSignal ?? (baseline?.baseline as Record<string, unknown>)?.priceUsd) as number | undefined
  const now = (p.currentPrice ?? p.priceNow ?? (p.reactionEvent as Record<string, unknown>)?.priceUsd) as number | undefined
  if (typeof entry === "number" && typeof now === "number" && entry > 0) {
    return Math.round(((now - entry) / entry) * 100)
  }
  return null
}

function mapLeadTimeProofs(proofs: Record<string, unknown>[]): ProofRow[] {
  return proofs
    .map((p) => {
      const baseline = (p.observationEvent as Record<string, unknown>)?.baseline as Record<string, unknown> | undefined
      const scoreBefore = baseline?.score
      const resultPct = extractResultPct(p)
      return {
        symbol: (p.symbol as string) || (p.mint as string)?.slice(0, 6) || "???",
        mint: (p.mint as string) || "",
        scoreBefore: typeof scoreBefore === "number" ? Math.round(scoreBefore) : null,
        scoreAfter: null,
        resultPct,
        outcome: classifyOutcome(resultPct),
        agoMs: Date.now() - ((p.proofCreatedAt as number) || Date.now()),
      }
    })
    .filter((r) => r.resultPct !== null)
    .sort((a, b) => Math.abs(b.resultPct ?? 0) - Math.abs(a.resultPct ?? 0))
    .slice(0, 6)
}

function mapSignalOutcomes(signals: Record<string, unknown>[]): ProofRow[] {
  return signals
    .map((s) => {
      const resultPct = typeof s.priceChangePct24h === "number" ? Math.round(s.priceChangePct24h) : null
      return {
        symbol: (s.symbol as string) || (s.mint as string)?.slice(0, 6) || "???",
        mint: (s.mint as string) || "",
        scoreBefore: typeof s.scoreAtSignal === "number" ? Math.round(s.scoreAtSignal) : null,
        scoreAfter: typeof s.scoreNow === "number" ? Math.round(s.scoreNow) : null,
        resultPct,
        outcome: classifyOutcome(resultPct),
        agoMs: Date.now() - ((s.detectedAt as number) || Date.now()),
      }
    })
    .filter((r) => r.resultPct !== null)
    .sort((a, b) => Math.abs(b.resultPct ?? 0) - Math.abs(a.resultPct ?? 0))
    .slice(0, 6)
}

type Source = "live" | "fallback" | "outcomes"

export function ProofPreviewRail() {
  const router = useRouter()
  const [rows, setRows] = useState<ProofRow[]>([])
  const [source, setSource] = useState<Source>("live")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const res = await fetch("/api/lead-time/recent?limit=8", { cache: "no-store" } as RequestInit)
        if (res.ok) {
          const data = await res.json()
          if (data.readCount > 0 && data.proofs?.length > 0 && data.source !== "fallback") {
            if (!cancelled) { setRows(mapLeadTimeProofs(data.proofs)); setSource("live"); setLoading(false) }
            return
          }
          if (data.source === "fallback" && data.proofs?.length > 0) {
            if (!cancelled) { setRows(mapLeadTimeProofs(data.proofs)); setSource("fallback"); setLoading(false) }
            return
          }
        }
      } catch { /* fall through */ }

      try {
        const res2 = await fetch("/api/signal-outcomes?limit=8", { cache: "no-store" } as RequestInit)
        if (res2.ok) {
          const data2 = await res2.json()
          const signals = data2.signals || []
          if (!cancelled && signals.length > 0) {
            setRows(mapSignalOutcomes(signals)); setSource("outcomes"); setLoading(false)
            return
          }
        }
      } catch { /* continue */ }

      if (!cancelled) { setRows([]); setLoading(false) }
    }

    load()
    const interval = setInterval(load, 120_000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  const isEmpty = rows.length === 0

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#0a0a0a] border border-zinc-800 overflow-hidden bg-card">
      {/* Header */}
      <div className="flex-none px-3 pt-2.5 pb-2 border-b border-zinc-900 bg-card">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 bg-green-500" />
          </span>
          <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-300">
            LIVE PROOF PREVIEW
          </h3>
        </div>
        <p className="text-[9px] font-mono text-zinc-600 italic mt-0.5 tracking-wide">
          We track outcomes -- not hype
        </p>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-card">
        {/* Loading skeleton */}
        {loading && (
          <div className="px-3 py-2 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5">
                <div className="h-3 w-10 bg-zinc-800 animate-pulse" />
                <div className="h-3 w-6 bg-zinc-800 animate-pulse" />
                <div className="h-4 w-12 bg-zinc-800 animate-pulse ml-auto" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && isEmpty && (
          <div className="text-center py-6 px-3 space-y-2">
            <p className="text-[10px] font-mono font-bold text-zinc-400">
              No tracked proofs in the last 24h
            </p>
            <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
              Waiting for new signals -- full ledger still tracks everything.
            </p>
            <Link
              href="/research"
              className="inline-flex items-center justify-center text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1.5 mt-1 bg-green-500 text-black hover:bg-green-400 transition-colors"
            >
              View Proof Engine
            </Link>
          </div>
        )}

        {/* Proof rows -- up to 3 entries with left border accent */}
        {!loading && !isEmpty && rows.map((row, i) => (
          <button
            key={`${row.mint}-${i}`}
            type="button"
            onClick={() => router.push("/research")}
            className="flex flex-1 items-center gap-2 w-full text-left px-3 py-2 hover:bg-zinc-900/60 transition-colors cursor-pointer border-b border-zinc-900 last:border-b-0"
            style={{
              borderLeft: `2px solid ${row.outcome === "winning" ? "rgb(34,197,94)" : row.outcome === "losing" ? "rgb(239,68,68)" : "rgb(63,63,70)"}`,
            }}
          >
            {/* Token symbol */}
            <span className="text-[10px] font-mono font-bold text-white w-12 truncate">{row.symbol}</span>

            {/* Score badge */}
            <span className="text-[9px] font-mono px-1.5 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700 tabular-nums">
              {row.scoreBefore !== null ? row.scoreBefore : "--"}
            </span>

            {/* Result % */}
            <span className={`text-sm font-mono font-bold tabular-nums ml-auto ${
              row.outcome === "winning" ? "text-green-400" : row.outcome === "losing" ? "text-red-400" : "text-zinc-500"
            }`}>
              {row.resultPct !== null
                ? `${row.resultPct > 0 ? "+" : ""}${row.resultPct}%`
                : "--"}
            </span>

            {/* Age */}
            <span className="text-[9px] font-mono text-zinc-600 tabular-nums w-6 text-right">{formatAgo(row.agoMs)}</span>
          </button>
        ))}
      </div>

      {/* Footer */}
      {!loading && !isEmpty && (
        <div className="flex-none px-3 py-2 border-t border-zinc-900 space-y-2">
          {/* Source + auto-refresh */}
          <div className="flex items-center justify-between">
            <span className={`text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 border ${
              source === "live" ? "bg-green-500/10 text-green-500/70 border-green-500/20"
                : source === "fallback" ? "bg-amber-500/10 text-amber-500/70 border-amber-500/20"
                : "bg-blue-500/10 text-blue-400/70 border-blue-500/20"
            }`}>
              {source === "live" ? "Live" : source === "fallback" ? "Cached" : "Outcomes"}
            </span>
            <span className="text-[8px] font-mono text-zinc-700">Auto-refresh 2m</span>
          </div>

          {/* CTA */}
          <Link
            href="/research"
            className="flex items-center justify-center w-full py-2 bg-green-500 text-black font-mono text-[10px] font-bold tracking-widest uppercase hover:bg-green-400 transition-colors"
          >
            VIEW PROOF ENGINE
          </Link>
        </div>
      )}
    </div>
  )
}
