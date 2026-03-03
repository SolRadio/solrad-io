"use client"

import { useEffect, useState, useCallback } from "react"
import { useAutoRefresh } from "@/lib/use-auto-refresh"
import { LiveIndicator } from "@/components/live-indicator"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, TrendingUp, Activity, Clock, ExternalLink, Copy, Check, BarChart3, Grid3x3, List, Info } from "lucide-react"
import type { TrackerMetrics } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"
import { DataFreshnessBar } from "@/components/data-freshness-bar"

type Window = "1h" | "4h" | "6h" | "24h" | "7d"
type ViewMode = "grid" | "list" | "sparks"

export default function TrackerClient() {
  const [window, setWindow] = useState<Window>("24h")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [metrics, setMetrics] = useState<TrackerMetrics[]>([])
  const [preQualified, setPreQualified] = useState<TrackerMetrics[]>([])
  const [totalSnapshots, setTotalSnapshots] = useState(0)
  const [tokensTracked, setTokensTracked] = useState(0)
  const [loading, setLoading] = useState(true)
  const [copiedMint, setCopiedMint] = useState<string | null>(null)

  const fetchMetrics = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/tracker?window=${window}&mode=treasure&t=${Date.now()}`,
        { signal }
      )
      const data = await response.json()
      const metricsData = data.metrics || []
      console.log("[v0] TrackerClient metrics sample:", JSON.stringify({
        count: metricsData.length,
        first: metricsData[0] ? { symbol: metricsData[0].symbol, imageUrl: metricsData[0].imageUrl, hasImage: !!metricsData[0].imageUrl } : null,
        withImages: metricsData.filter((m: any) => !!m.imageUrl).length,
      }))
      setMetrics(metricsData)
      setPreQualified(data.preQualified || [])
      setTotalSnapshots(data.totalSnapshots || 0)
      setTokensTracked(data.tokensTracked || 0)
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return
      console.error("[v0] Failed to fetch tracker metrics:", error)
      setMetrics([])
      setPreQualified([])
    } finally {
      setLoading(false)
    }
  }, [window])

  const { lastUpdatedAt, isRefreshing, refreshNow } = useAutoRefresh({
    intervalMs: 12_000,
    onTick: fetchMetrics,
  })

  // Initial load + re-fetch on window change
  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  const copyMint = async (mint: string) => {
    await navigator.clipboard.writeText(mint)
    setCopiedMint(mint)
    setTimeout(() => setCopiedMint(null), 2000)
  }

  const getRiskBadgeColor = (label: string) => {
    switch (label) {
      case "Strong":
        return "bg-green-500/10 text-green-400 border-green-500/20"
      case "Watch":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      case "High Risk":
        return "bg-red-500/10 text-red-400 border-red-500/20"
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background pb-[calc(env(safe-area-inset-bottom)+1rem)]">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="h-10 w-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-foreground">
              TOP PERFORMERS
            </h1>
          </div>
          <div className="flex justify-center mb-2">
            <LiveIndicator lastUpdatedAt={lastUpdatedAt} isRefreshing={isRefreshing} onRefresh={refreshNow} />
          </div>
          <p className="text-lg text-muted-foreground mb-2">Track which tokens maintain high scores over time</p>
          <p className="text-sm text-muted-foreground">
            Historical snapshots show consistency and momentum across multiple time windows
          </p>
          
          {/* Data Freshness Bar */}
          <div className="mt-4">
            <DataFreshnessBar
              updatedAt={Date.now()}
              itemCount={totalSnapshots}
              itemLabel="snapshots"
              metadata={[
                { label: "Window", value: window.toUpperCase() },
                { label: "Tracked", value: tokensTracked },
              ]}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <Tabs value={window} onValueChange={(v) => setWindow(v as Window)} className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="1h" className="uppercase font-bold">
                1H
              </TabsTrigger>
              <TabsTrigger value="4h" className="uppercase font-bold">
                4H
              </TabsTrigger>
              <TabsTrigger value="6h" className="uppercase font-bold">
                6H
              </TabsTrigger>
              <TabsTrigger value="24h" className="uppercase font-bold">
                24H
              </TabsTrigger>
              <TabsTrigger value="7d" className="uppercase font-bold">
                7D
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "sparks" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("sparks")}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Info Note */}
        <div className="mb-8 p-4 rounded-lg bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
            <Info className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
            Longer time windows require sustained historical data. Early snapshots may overlap until enough data is collected.
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="p-5 bg-card/50 backdrop-blur">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              <span className="text-xs uppercase font-bold text-muted-foreground tracking-wide">
                HIGH SCORERS TRACKED
              </span>
            </div>
            <div className="text-2xl font-bold font-mono">{tokensTracked}</div>
          </Card>

          <Card className="p-5 bg-card/50 backdrop-blur">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-5 w-5 text-cyan-400" />
              <span className="text-xs uppercase font-bold text-muted-foreground tracking-wide">SNAPSHOTS</span>
            </div>
            <div className="text-2xl font-bold font-mono">{totalSnapshots}</div>
          </Card>

          <Card className="p-5 bg-card/50 backdrop-blur">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              <span className="text-xs uppercase font-bold text-muted-foreground tracking-wide">TOP CONSISTENCY</span>
            </div>
            <div className="text-2xl font-bold font-mono">
              {metrics.length > 0 ? `${metrics[0].consistency.toFixed(0)}%` : "N/A"}
            </div>
          </Card>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Activity className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground uppercase font-semibold">LOADING TRACKER DATA...</p>
          </div>
        ) : metrics.length === 0 ? (
          <>
            <Card className="p-12 text-center bg-card/50 backdrop-blur mb-8">
              <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-xl font-bold uppercase mb-2">NOT ENOUGH HISTORY YET</h3>
              <p className="text-muted-foreground">
                Snapshots are collected every 10 minutes. Check back soon to see consistency data.
              </p>
            </Card>

            {/* Pre-Qualified Tokens Section */}
            {preQualified.length > 0 && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold uppercase mb-2 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    Pre-Qualified Tokens
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Tracking — consistency forming • Appeared 2+ times with high scores
                  </p>
                </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
                  {preQualified.map((metric) => (
                    <Card
                      key={metric.mint}
                      className="p-5 bg-card/80 backdrop-blur hover:border-cyan-400/30 transition-colors border-cyan-400/10"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
                            {metric.imageUrl ? (
                              <img
                                src={metric.imageUrl}
                                alt={metric.symbol}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none"
                                  e.currentTarget.parentElement!.innerHTML = `<span class="w-full h-full flex items-center justify-center text-sm font-bold text-primary">${metric.symbol[0]}</span>`
                                }}
                              />
                            ) : (
                              <span className="w-full h-full flex items-center justify-center text-sm font-bold text-primary">
                                {metric.symbol.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold uppercase">{metric.symbol}</h3>
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">{metric.name}</p>
                          </div>
                        </div>
                        <Badge className="uppercase font-bold bg-cyan-500/10 border-cyan-500/30 text-cyan-400">
                          TRACKING
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-xs uppercase text-muted-foreground block">Appearances</span>
                            <span className="font-bold font-mono">{metric.appearances}</span>
                          </div>
                          <div>
                            <span className="text-xs uppercase text-muted-foreground block">Latest Score</span>
                            <span className="font-bold font-mono">{metric.latestScore.toFixed(1)}</span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs uppercase text-muted-foreground font-semibold">Mint Address</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2"
                              onClick={() => copyMint(metric.mint)}
                            >
                              {copiedMint === metric.mint ? (
                                <Check className="h-3 w-3 text-green-400" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                          <code className="text-[10px] text-muted-foreground break-all block">{metric.mint}</code>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full uppercase font-bold text-xs bg-transparent"
                          asChild
                        >
                          <a
                            href={`https://dexscreener.com/solana/${metric.mint}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            VIEW ON DEX
                          </a>
                        </Button>

                        <p className="text-xs text-muted-foreground">
                          Last seen {formatDistanceToNow(metric.lastSeen, { addSuffix: true })}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {metrics.map((metric, idx) => (
              <Card
                key={metric.mint}
                className="p-5 bg-card/80 backdrop-blur hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 via-cyan-500 to-green-500 p-0.5">
                        <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                          {metric.imageUrl ? (
                            <Image
                              src={metric.imageUrl || "/placeholder.svg"}
                              alt={metric.symbol}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                          ) : (
                            <span className="text-lg font-bold">{metric.symbol.charAt(0)}</span>
                          )}
                        </div>
                      </div>
                      <Badge className={`absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] font-bold ${
                        idx === 0 ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" :
                        idx === 1 ? "bg-gray-400/20 text-gray-300 border border-gray-400/30" :
                        idx === 2 ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" :
                        "bg-primary/10 text-primary border border-primary/20"
                      }`}>
                        {idx + 1}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="font-bold uppercase">{metric.symbol}</h3>
                      <p className="text-xs text-muted-foreground truncate max-w-[150px]">{metric.name}</p>
                    </div>
                  </div>
                  <Badge className={`uppercase font-bold ${getRiskBadgeColor(metric.latestLabel)}`}>
                    {metric.latestLabel}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase text-muted-foreground font-semibold">Consistency</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
                          style={{ width: `${metric.consistency}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold font-mono">{metric.consistency.toFixed(0)}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-xs uppercase text-muted-foreground block">Appearances</span>
                      <span className="font-bold font-mono">{metric.appearances}</span>
                    </div>
                    <div>
                      <span className="text-xs uppercase text-muted-foreground block">Score {'Δ'}</span>
                      <span
                        className={`font-bold font-mono ${Math.abs(metric.scoreDelta) < 0.05 ? "text-muted-foreground" : metric.scoreDelta >= 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        {Math.abs(metric.scoreDelta) < 0.05
                          ? "\u2014"
                          : `${metric.scoreDelta >= 0 ? "+" : ""}${metric.scoreDelta.toFixed(1)}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs uppercase text-muted-foreground block">Latest Score</span>
                      <span className="font-bold font-mono">{metric.latestScore.toFixed(1)}</span>
                    </div>
                    <div>
                      <span className="text-xs uppercase text-muted-foreground block">Rank</span>
                      <span className="font-bold font-mono">#{metric.latestRank}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 uppercase font-bold text-xs bg-transparent"
                      asChild
                    >
                      <a
                        href={`https://dexscreener.com/solana/${metric.mint}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        DEX
                      </a>
                    </Button>
                    {/* <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 uppercase font-bold text-xs bg-transparent"
                      asChild
                    >
                      <a href={`https://jup.ag/swap/SOL-${metric.mint}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        JUPITER
                      </a>
                    </Button> */}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Last seen {formatDistanceToNow(metric.lastSeen, { addSuffix: true })}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        ) : viewMode === "list" ? (
          <>
          {/* ── MOBILE CARD LIST ── */}
          <div className="sm:hidden space-y-2">
            {metrics.map((metric, idx) => (
              <Card key={metric.mint} className="p-3 bg-card/80 backdrop-blur hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs font-bold font-mono text-muted-foreground w-5 shrink-0 text-center">
                      {idx + 1}
                    </span>
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-muted shrink-0">
                      {metric.imageUrl ? (
                        <img
                          src={metric.imageUrl}
                          alt={metric.symbol}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                            e.currentTarget.parentElement!.innerHTML = `<span class="w-full h-full flex items-center justify-center text-xs font-bold text-primary">${metric.symbol[0]}</span>`
                          }}
                        />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-xs font-bold text-primary">
                          {metric.symbol.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold uppercase text-sm truncate">{metric.symbol}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{metric.name}</div>
                    </div>
                  </div>
                  <Badge className={`uppercase font-bold text-[10px] shrink-0 ${getRiskBadgeColor(metric.latestLabel)}`}>
                    {metric.latestLabel}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-3 text-[11px] font-mono">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-12 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: `${metric.consistency}%` }} />
                      </div>
                      <span className="font-bold tabular-nums">{metric.consistency.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="tabular-nums text-foreground/80">{metric.latestScore.toFixed(1)}</span>
                    <span className={`font-bold tabular-nums ${
                      Math.abs(metric.scoreDelta) < 0.05 ? "text-muted-foreground" : metric.scoreDelta >= 0 ? "text-green-400" : "text-red-400"
                    }`}>
                      {Math.abs(metric.scoreDelta) < 0.05 ? "\u2014" : `${metric.scoreDelta >= 0 ? "+" : ""}${metric.scoreDelta.toFixed(1)}`}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* ── DESKTOP TABLE ── */}
          <Card className="hidden sm:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-xs uppercase font-bold">#</th>
                    <th className="text-left p-3 text-xs uppercase font-bold">Token</th>
                    <th className="text-left p-3 text-xs uppercase font-bold">Consistency</th>
                    <th className="text-left p-3 text-xs uppercase font-bold">Appearances</th>
                    <th className="text-left p-3 text-xs uppercase font-bold">Score {'Δ'}</th>
                    <th className="text-left p-3 text-xs uppercase font-bold">Latest Score</th>
                    <th className="text-left p-3 text-xs uppercase font-bold">Label</th>
                    <th className="text-left p-3 text-xs uppercase font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((metric, idx) => (
                    <tr key={metric.mint} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono font-bold">{idx + 1}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                            {metric.imageUrl ? (
                              <img
                                src={metric.imageUrl}
                                alt={metric.symbol}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none"
                                  e.currentTarget.parentElement!.innerHTML = `<span class="w-full h-full flex items-center justify-center text-xs font-bold text-primary">${metric.symbol[0]}</span>`
                                }}
                              />
                            ) : (
                              <span className="w-full h-full flex items-center justify-center text-xs font-bold text-primary">
                                {metric.symbol.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-bold uppercase text-sm">{metric.symbol}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">{metric.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: `${metric.consistency}%` }} />
                          </div>
                          <span className="font-mono text-sm">{metric.consistency.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="p-3 font-mono">{metric.appearances}</td>
                      <td className="p-3">
                        <span className={`font-mono ${metric.scoreDelta >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {metric.scoreDelta >= 0 ? "+" : ""}
                          {metric.scoreDelta.toFixed(1)}
                        </span>
                      </td>
                      <td className="p-3 font-mono">{metric.latestScore.toFixed(1)}</td>
                      <td className="p-3">
                        <Badge className={`uppercase font-bold ${getRiskBadgeColor(metric.latestLabel)}`}>
                          {metric.latestLabel}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                            <a
                              href={`https://dexscreener.com/solana/${metric.mint}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyMint(metric.mint)}>
                            {copiedMint === metric.mint ? (
                              <Check className="h-3 w-3 text-green-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          </>
        ) : (
          <div className="space-y-3">
            {metrics.map((metric, idx) => (
              <Card
                key={metric.mint}
                className="p-4 bg-card/80 backdrop-blur hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Badge className="h-6 w-6 rounded-full flex items-center justify-center bg-yellow-500 text-black font-bold text-xs">
                    {idx + 1}
                  </Badge>
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                    {metric.imageUrl ? (
                      <img
                        src={metric.imageUrl}
                        alt={metric.symbol}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                          e.currentTarget.parentElement!.innerHTML = `<span class="w-full h-full flex items-center justify-center text-sm font-bold text-primary">${metric.symbol[0]}</span>`
                        }}
                      />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center text-sm font-bold text-primary">
                        {metric.symbol.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold uppercase">{metric.symbol}</span>
                      <Badge className={`uppercase font-bold text-[10px] ${getRiskBadgeColor(metric.latestLabel)}`}>
                        {metric.latestLabel}
                      </Badge>
                    </div>
                    <div className="h-8 bg-secondary/50 rounded-lg relative overflow-hidden">
                      <div
                        className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20"
                        style={{ width: `${metric.consistency}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-between px-3 text-xs">
                        <span className="font-mono font-bold">{metric.consistency.toFixed(0)}% consistency</span>
                        <span className="font-mono">{metric.appearances} appearances</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono">{metric.latestScore.toFixed(1)}</div>
                    <div className={`text-xs font-mono ${metric.scoreDelta >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {metric.scoreDelta >= 0 ? "+" : ""}
                      {metric.scoreDelta.toFixed(1)}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="uppercase font-bold text-xs bg-transparent" asChild>
                    <a href={`https://dexscreener.com/solana/${metric.mint}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      VIEW
                    </a>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
