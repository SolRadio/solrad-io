"use client"

import { useEffect, useState } from "react"
import { FlaskConical } from "lucide-react"
import type { SnapshotSummary } from "@/lib/types"

interface ScoreLabData {
  summaries: SnapshotSummary[]
  winRates: {
    high: { total: number; wins: number; winRate: number }
    medium: { total: number; wins: number; winRate: number }
    low: { total: number; wins: number; winRate: number }
  }
  topWinners: SnapshotSummary[]
  totalSnapshots: number
  uniqueTokens: number
}

export function ScoreLabClient({ isPro }: { isPro: boolean }) {
  const [data, setData] = useState<ScoreLabData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/score-lab")
      .then((res) => res.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch((err) => {
        console.error("[v0] Score Lab fetch error:", err)
        setLoading(false)
      })
  }, [])

  // isPro is passed from the server via Clerk publicMetadata

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto text-center">
          <FlaskConical className="text-primary mx-auto mb-3" size={36} aria-hidden="true" />
          <h1 className="text-4xl font-bold uppercase text-center text-foreground">SCORE LAB</h1>
          <p className="text-sm text-muted-foreground text-center mt-2">Loading snapshots...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto text-center">
          <FlaskConical className="text-primary mx-auto mb-3" size={36} aria-hidden="true" />
          <h1 className="text-4xl font-bold uppercase text-center text-foreground">SCORE LAB</h1>
          <p className="text-destructive mt-2">Failed to load data</p>
        </div>
      </div>
    )
  }

  // ── Full page for Pro / admin bypass ──
  if (isPro) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <FullPageContent data={data} />
        </div>
      </div>
    )
  }

  // ── Pro-gated view ──
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* 1. PAGE HEADER — always visible */}
        <div className="text-center">
          <FlaskConical className="text-primary mx-auto mb-3" size={36} aria-hidden="true" />
          <h1 className="text-4xl font-bold uppercase text-center text-foreground">
            SCORE LAB
          </h1>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Live performance analytics from SOLRAD{"'"}s scoring engine
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            <span className="bg-card border border-border rounded-full px-3 py-1 text-xs font-mono text-muted-foreground">
              {data.totalSnapshots.toLocaleString()} SNAPSHOTS (24H)
            </span>
            <span className="bg-card border border-border rounded-full px-3 py-1 text-xs font-mono text-muted-foreground">
              {data.uniqueTokens.toLocaleString()} UNIQUE TOKENS
            </span>
            <span className="bg-card border border-border rounded-full px-3 py-1 text-xs font-mono text-muted-foreground">
              24H WINDOW
            </span>
          </div>
        </div>

        {/* 2. WIN RATES — visible but blurred */}
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              WIN RATES BY SCORE BUCKET
            </h2>
            <span className="bg-muted rounded-full px-3 py-1 text-[10px] font-mono text-muted-foreground block w-fit mx-auto mt-2">
              Win = +30% or more in 6 hours
            </span>
          </div>
          <div className="pointer-events-none select-none" style={{ filter: "blur(6px)", opacity: 0.6 }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-none border p-4 bg-green-950/20 border-green-900 text-center">
                <div className="text-sm font-medium text-green-400">High (8-10)</div>
                <div className="text-2xl font-bold mt-2">{data.winRates.high.winRate.toFixed(1)}%</div>
                <div className="text-[10px] font-mono text-muted-foreground mt-1">
                  {data.winRates.high.wins} / {data.winRates.high.total} tokens
                </div>
              </div>
              <div className="rounded-none border p-4 bg-yellow-950/20 border-yellow-900 text-center">
                <div className="text-sm font-medium text-yellow-400">Medium (6-7)</div>
                <div className="text-2xl font-bold mt-2">{data.winRates.medium.winRate.toFixed(1)}%</div>
                <div className="text-[10px] font-mono text-muted-foreground mt-1">
                  {data.winRates.medium.wins} / {data.winRates.medium.total} tokens
                </div>
              </div>
              <div className="rounded-none border p-4 bg-red-950/20 border-red-900 text-center">
                <div className="text-sm font-medium text-red-400">Low (0-5)</div>
                <div className="text-2xl font-bold mt-2">{data.winRates.low.winRate.toFixed(1)}%</div>
                <div className="text-[10px] font-mono text-muted-foreground mt-1">
                  {data.winRates.low.wins} / {data.winRates.low.total} tokens
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. PRO GATE OVERLAY */}
        <div className="relative mt-4">
          {/* Blurred ghost content underneath */}
          <div className="pointer-events-none select-none blur-sm opacity-40">
            <div className="space-y-2 mt-8">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-10 bg-card border border-border rounded-lg" />
              ))}
            </div>
          </div>

          {/* Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm rounded-none border border-primary/20 min-h-[400px] p-8 text-center">
            <FlaskConical className="text-primary" size={32} aria-hidden="true" />

            <div>
              <p className="text-lg font-bold uppercase tracking-tight">
                SCORE LAB IS PRO-ONLY
              </p>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                Full performance analytics, win rate breakdowns by score bucket, and the top performing tokens by 24h return.
              </p>
            </div>

            {/* 3 feature bullets */}
            <div className="grid grid-cols-1 gap-2 w-full max-w-xs mt-2">
              {[
                "Win rates by score bucket",
                "Top 10 winners with full return data",
                "Last 50 snapshots with risk labels",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  {feature}
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <a
                href="/pro"
                className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-bold font-mono hover:bg-primary/90 transition-colors"
              >
                {"UPGRADE TO PRO →"}
              </a>
              <a
                href="/research"
                className="bg-card border border-border text-foreground px-6 py-2.5 rounded-lg text-sm font-mono hover:border-primary/50 transition-colors"
              >
                VIEW PROOF ENGINE
              </a>
            </div>

            <p className="text-[10px] text-muted-foreground">
              Pro includes Score Lab, full signal history, and advanced analytics.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Full unlocked page content (shared by Pro / Admin) ── */
function FullPageContent({ data }: { data: ScoreLabData }) {
  return (
    <>
      {/* Header */}
      <div className="text-center">
        <FlaskConical className="text-primary mx-auto mb-3" size={36} aria-hidden="true" />
        <h1 className="text-4xl font-bold uppercase text-center text-foreground">SCORE LAB</h1>
        <p className="text-sm text-muted-foreground text-center mt-2">
          Live performance data from SOLRAD{"'"}s scoring engine — updated continuously.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-none p-4 text-center">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Total Snapshots (24h)</div>
          <div className="text-3xl font-bold text-foreground mt-1">{data.totalSnapshots.toLocaleString()}</div>
        </div>
        <div className="bg-card border border-border rounded-none p-4 text-center">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Unique Tokens</div>
          <div className="text-3xl font-bold text-foreground mt-1">{data.uniqueTokens.toLocaleString()}</div>
        </div>
        <div className="bg-card border border-border rounded-none p-4 text-center">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Data Window</div>
          <div className="text-3xl font-bold text-foreground mt-1">24 hours</div>
        </div>
      </div>

      {/* Win Rates */}
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">WIN RATES BY SCORE BUCKET</h2>
          <span className="bg-muted rounded-full px-3 py-1 text-[10px] font-mono text-muted-foreground block w-fit mx-auto mt-2">
            Win = +30% or more in 6 hours
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-none border p-4 bg-green-950/20 border-green-900 text-center">
            <div className="text-sm font-medium text-green-400">High (8-10)</div>
            <div className="text-2xl font-bold mt-2">{data.winRates.high.winRate.toFixed(1)}%</div>
            <div className="text-[10px] font-mono text-muted-foreground mt-1">{data.winRates.high.wins} / {data.winRates.high.total} tokens</div>
          </div>
          <div className="rounded-none border p-4 bg-yellow-950/20 border-yellow-900 text-center">
            <div className="text-sm font-medium text-yellow-400">Medium (6-7)</div>
            <div className="text-2xl font-bold mt-2">{data.winRates.medium.winRate.toFixed(1)}%</div>
            <div className="text-[10px] font-mono text-muted-foreground mt-1">{data.winRates.medium.wins} / {data.winRates.medium.total} tokens</div>
          </div>
          <div className="rounded-none border p-4 bg-red-950/20 border-red-900 text-center">
            <div className="text-sm font-medium text-red-400">Low (0-5)</div>
            <div className="text-2xl font-bold mt-2">{data.winRates.low.winRate.toFixed(1)}%</div>
            <div className="text-[10px] font-mono text-muted-foreground mt-1">{data.winRates.low.wins} / {data.winRates.low.total} tokens</div>
          </div>
        </div>
      </div>

      {/* Top 10 Winners */}
      <div className="space-y-4">
        <div className="text-center flex items-center justify-center flex-wrap gap-2">
          <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">TOP 10 WINNERS (24H RETURN)</h2>
          <span className="text-[10px] font-mono bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded px-2 py-0.5">
            PAST PERFORMANCE — NOT A GUARANTEE
          </span>
        </div>
        <div className="overflow-x-auto rounded-none border border-border">
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="bg-muted text-xs font-mono uppercase text-muted-foreground">
                <th className="text-left p-2 pl-3">#</th>
                <th className="text-left p-2">Symbol</th>
                <th className="text-right p-2">24h Return</th>
                <th className="text-right p-2">SOLRAD</th>
                <th className="text-right p-2">SIGNAL v2</th>
                <th className="text-right p-2 pr-3">GEM</th>
              </tr>
            </thead>
            <tbody>
              {data.topWinners.map((winner, idx) => (
                <tr key={winner.mint} className="border-b border-border/30">
                  <td className="p-2 pl-3 text-xs font-mono text-muted-foreground">{idx + 1}</td>
                  <td className="p-2 font-mono">{winner.symbol}</td>
                  <td className="text-right p-2 text-green-400 font-bold">+{winner.return24h?.toFixed(1)}%</td>
                  <td className="text-right p-2">{winner.solradScore.toFixed(1)}</td>
                  <td className="text-right p-2">{winner.signalScore?.toFixed(1) || "—"}</td>
                  <td className="text-right p-2 pr-3">{winner.gemScore?.toFixed(0) || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Snapshots */}
      <div className="space-y-3">
        <div className="text-center">
          <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">RECENT SNAPSHOTS</h2>
          <span className="text-[10px] font-mono text-muted-foreground/60 block mt-1">Showing last 50 snapshots</span>
        </div>
        <div className="max-h-[500px] overflow-y-auto rounded-none border border-border">
          <table className="w-full text-sm font-mono">
            <thead className="sticky top-0 bg-background z-10 border-b border-border">
              <tr className="bg-muted text-xs font-mono uppercase text-muted-foreground">
                <th className="text-left p-2 pl-3">Symbol</th>
                <th className="text-right p-2">SOLRAD</th>
                <th className="text-right p-2">SIGNAL v2</th>
                <th className="text-right p-2">GEM</th>
                <th className="text-right p-2">6h Return</th>
                <th className="text-right p-2">24h Return</th>
                <th className="text-left p-2 pr-3">Risk</th>
              </tr>
            </thead>
            <tbody>
              {data.summaries.slice(0, 50).map((s) => (
                <tr key={s.mint} className="border-b border-border/30">
                  <td className="p-2 pl-3 font-mono">{s.symbol}</td>
                  <td className="text-right p-2">{s.solradScore.toFixed(1)}</td>
                  <td className="text-right p-2">{s.signalScore?.toFixed(1) || "—"}</td>
                  <td className="text-right p-2">{s.gemScore?.toFixed(0) || "—"}</td>
                  <td className={`text-right p-2 ${s.return6h === null ? "text-muted-foreground" : s.return6h >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {s.return6h !== null ? `${s.return6h >= 0 ? "+" : ""}${s.return6h.toFixed(1)}%` : "—"}
                  </td>
                  <td className={`text-right p-2 ${s.return24h === null ? "text-muted-foreground" : s.return24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {s.return24h !== null ? `${s.return24h >= 0 ? "+" : ""}${s.return24h.toFixed(1)}%` : "—"}
                  </td>
                  <td className="p-2 pr-3 text-xs">
                    <span className={`inline-block px-2 py-0.5 rounded ${
                      s.latestSnapshot.riskLabel === "LOW RISK" ? "bg-green-900/30 text-green-400"
                        : s.latestSnapshot.riskLabel === "MEDIUM RISK" ? "bg-yellow-900/30 text-yellow-400"
                          : "bg-red-900/30 text-red-400"
                    }`}>
                      {s.latestSnapshot.riskLabel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="max-w-2xl mx-auto text-center mt-8 p-4 bg-muted/30 rounded-none border border-border">
        <p className="text-[10px] font-mono text-muted-foreground leading-relaxed">
          Score Lab shows historical scoring performance data for transparency purposes.
          Past signal performance does not guarantee future results.
          All data is observational. Not financial advice. Always DYOR.
        </p>
      </div>
    </>
  )
}
