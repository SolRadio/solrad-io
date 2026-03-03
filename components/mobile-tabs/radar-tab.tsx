"use client"

import { useState, useRef, useMemo } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import type { TokenScore } from "@/lib/types"
import TokenRowMobile from "@/components/token-row-mobile"
import { Activity, TrendingUp, Zap, Star, Diamond, Info, Droplets, Search, X, SlidersHorizontal } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { featureFlags } from "@/lib/featureFlags"
import type { LeadTimeProof } from "@/lib/lead-time/types"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { FiltersTab } from "./filters-tab"

interface RadarTabProps {
  freshSignals: TokenScore[]
  trending: TokenScore[]
  active: TokenScore[]
  newEarly: TokenScore[]
  leadTimeProofsMap?: Map<string, LeadTimeProof>
  stats: {
    totalVolume: number
    avgScore: number
    totalLiquidity: number
    tokensTracked: number
  }
  solPrice: {
    price: number
    change24h: number
    loading: boolean
    error: boolean
  }
  gemFinderMode?: boolean
  onGemFinderChange?: (enabled: boolean) => void
}

function filterGems(tokens: TokenScore[]): TokenScore[] {
  return tokens.filter((token) => {
    const hasHealthyLiquidity = (token.liquidity ?? 0) >= 5000 && (token.liquidity ?? 0) <= 500000
    const hasGoodScore = token.totalScore >= 55
    const isEarly = (token.tokenAgeHours ?? 0) <= 72
    const hasReasonableHolders = (token.holders ?? 0) >= 50
    return hasHealthyLiquidity && hasGoodScore && (isEarly || hasReasonableHolders)
  })
}

export function RadarTab({
  freshSignals,
  trending,
  active,
  newEarly,
  leadTimeProofsMap = new Map(),
  stats,
  solPrice,
  gemFinderMode = false,
  onGemFinderChange,
}: RadarTabProps) {
  const [activeSection, setActiveSection] = useState<"signals" | "trending" | "active" | "new">("signals")
  const [showGemInfo, setShowGemInfo] = useState(false)
  const [search, setSearch] = useState("")
  const [quickFilter, setQuickFilter] = useState("all")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const parentRef = useRef<HTMLDivElement>(null)

  const sections = [
    { id: "signals" as const, label: "FRESH", icon: Activity },
    { id: "trending" as const, label: "TREND", icon: TrendingUp },
    { id: "active" as const, label: "ACTIVE", icon: Zap },
    { id: "new" as const, label: "NEW", icon: Star },
  ]

  const getFilteredTokens = useMemo(() => {
    const baseTokens = {
      signals: freshSignals,
      trending: trending,
      active: active,
      new: newEarly,
    }
    if (!gemFinderMode) return baseTokens
    return {
      signals: filterGems(freshSignals),
      trending: filterGems(trending),
      active: filterGems(active),
      new: filterGems(newEarly),
    }
  }, [freshSignals, trending, active, newEarly, gemFinderMode])

  const currentTokens = useMemo(() => {
    let tokens = getFilteredTokens[activeSection]
    if (search) {
      const s = search.toLowerCase()
      tokens = tokens.filter(
        (t) =>
          t.symbol?.toLowerCase().includes(s) ||
          t.name?.toLowerCase().includes(s) ||
          t.address.toLowerCase().includes(s)
      )
    }
    // Quick filter
    if (quickFilter !== "all") {
      tokens = tokens.filter((t) => {
        if (quickFilter === "hot") {
          const age = Date.now() - (t.detectedAt ?? t.lastUpdated ?? 0)
          return age < 60 * 60 * 1000
        }
        if (quickFilter === "EARLY") return t.signalState === "EARLY"
        if (quickFilter === "CAUTION") return t.signalState === "CAUTION"
        if (quickFilter === "STRONG") return t.signalState === "STRONG"
        if (quickFilter === "low") return t.riskLevel === "LOW" || (t as Record<string, unknown>).risk === "low"
        if (quickFilter === "highscore") return (t.totalScore ?? 0) >= 70
        return true
      })
    }
    return tokens
  }, [getFilteredTokens, activeSection, search, quickFilter])

  const counts = {
    signals: getFilteredTokens.signals.length,
    trending: getFilteredTokens.trending.length,
    active: getFilteredTokens.active.length,
    new: getFilteredTokens.new.length,
  }

  const virtualizer = useVirtualizer({
    count: currentTokens.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 15,
  })

  // Compute SURGING and HOT counts from already-loaded token list
  const allTokens = useMemo(() => {
    return [...freshSignals, ...trending, ...active, ...newEarly]
  }, [freshSignals, trending, active, newEarly])

  const surgingCount = useMemo(() => {
    return allTokens.filter((t) => {
      const delta = ((t as Record<string, unknown>).scoreDelta ?? (t as Record<string, unknown>).scoreChange ?? 0) as number
      return delta > 5
    }).length
  }, [allTokens])

  const hotCount = useMemo(() => {
    const now = Date.now()
    return allTokens.filter((t) => {
      const age = now - ((t as Record<string, unknown>).detectedAt as number ?? t.lastUpdated ?? 0)
      return age < 60 * 60 * 1000 && (t.totalScore ?? 0) >= 60
    }).length
  }, [allTokens])

  const fmtCompact = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
    return `$${n.toFixed(0)}`
  }

  return (
    <div className="flex flex-col h-full">
      {/* Market Snapshot - Dense Ticker Row */}
      <div className="flex items-center gap-px px-3 py-2 border-b border-border/30 bg-muted/10 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono text-muted-foreground/50 uppercase">Vol</span>
            <span className="text-[11px] font-mono font-bold tabular-nums">{fmtCompact(stats.totalVolume)}</span>
          </div>
          <div className="w-px h-3 bg-border/30" />
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono text-muted-foreground/50 uppercase">Liq</span>
            <span className="text-[11px] font-mono font-bold tabular-nums">{fmtCompact(stats.totalLiquidity)}</span>
          </div>
          <div className="w-px h-3 bg-border/30" />
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono text-muted-foreground/50 uppercase">Tkns</span>
            <span className="text-[11px] font-mono font-bold tabular-nums">{stats.tokensTracked}</span>
          </div>
          <div className="w-px h-3 bg-border/30" />
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono text-muted-foreground/50 uppercase">Avg</span>
            <span className="text-[11px] font-mono font-bold tabular-nums">{stats.avgScore.toFixed(0)}</span>
          </div>
          <div className="w-px h-3 bg-border/30" />
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono text-amber-400/60 uppercase">Surging</span>
            <span className="text-[11px] font-mono font-bold tabular-nums text-amber-400">{surgingCount}</span>
          </div>
          <div className="w-px h-3 bg-border/30" />
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono text-orange-400/60 uppercase">Hot</span>
            <span className="text-[11px] font-mono font-bold tabular-nums text-orange-400">{hotCount}</span>
          </div>
        </div>
      </div>

      {/* Gem Finder Toggle + Search + Filter Button */}
      <div className="px-3 py-2 flex items-center gap-2 border-b border-border/20">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40" />
          <Input
            type="text"
            placeholder="Search tokens..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 pl-7 pr-7 text-xs font-mono bg-muted/20 border-border/30 rounded-md placeholder:text-muted-foreground/30"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="h-3 w-3 text-muted-foreground/40" />
            </button>
          )}
        </div>

        {/* Gem Finder */}
        {featureFlags.gemFinderMode && (
          <div className="flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-md border border-border/30 bg-muted/10">
            <Diamond className={`h-3 w-3 ${gemFinderMode ? "text-cyan-400" : "text-muted-foreground/40"}`} />
            <span className="text-[9px] font-mono font-bold uppercase">GEM</span>
            <Switch
              checked={gemFinderMode}
              onCheckedChange={onGemFinderChange}
              className="h-4 w-7 data-[state=checked]:bg-cyan-500"
            />
            <button onClick={() => setShowGemInfo(true)} className="p-0.5">
              <Info className="h-2.5 w-2.5 text-muted-foreground/40" />
            </button>
          </div>
        )}

        {/* Filter bottom sheet trigger */}
        <button
          onClick={() => setFiltersOpen(true)}
          className="flex-none w-8 h-7 flex items-center justify-center border border-zinc-700 bg-zinc-900 rounded-md"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
        </button>
      </div>

      {/* Quick Filter Strip */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-3 py-2 border-b border-zinc-800/60">
        {[
          { label: "ALL", value: "all" },
          { label: "HOT", value: "hot" },
          { label: "EARLY", value: "EARLY" },
          { label: "CAUTION", value: "CAUTION" },
          { label: "STRONG", value: "STRONG" },
          { label: "LOW RISK", value: "low" },
          { label: "HIGH SCORE", value: "highscore" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setQuickFilter(f.value)}
            className={`flex-none px-3 py-1.5 text-[10px] font-mono tracking-widest rounded-full border transition-colors whitespace-nowrap
              ${quickFilter === f.value
                ? "bg-green-500/20 border-green-500/60 text-green-400"
                : "bg-zinc-900 border-zinc-700 text-zinc-500 hover:border-zinc-500"
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Section Tabs - Dense Terminal Style */}
      <div className="flex border-b border-border/30">
        {sections.map((section) => {
          const Icon = section.icon
          const isActive = activeSection === section.id
          const count = counts[section.id]
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`
                flex-1 flex items-center justify-center gap-1 py-2
                text-[10px] font-mono font-bold uppercase tracking-wider
                transition-colors duration-100 border-b-2
                ${
                  isActive
                    ? "text-cyan-400 border-cyan-400 bg-cyan-400/5"
                    : "text-muted-foreground/40 border-transparent hover:text-muted-foreground/60"
                }
              `}
            >
              <Icon className="h-3 w-3" />
              <span>{section.label}</span>
              <span className={`text-[8px] ${isActive ? "text-cyan-400/60" : "text-muted-foreground/30"}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Token List - Virtualized */}
      <div ref={parentRef} className="flex-1 overflow-y-auto overscroll-contain">
        {currentTokens.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/40">
            <Activity className="h-8 w-8 mb-3 opacity-30" />
            <p className="text-xs font-mono">
              {search ? "No matches" : gemFinderMode ? "No gems found" : "No tokens found"}
            </p>
          </div>
        ) : (
          <div
            style={{ height: `${virtualizer.getTotalSize()}px`, width: "100%", position: "relative" }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const token = currentTokens[virtualItem.index]
              return (
                <div
                  key={token.address}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <div className="px-3 py-0.5">
                    <TokenRowMobile
                      token={token}
                      rank={virtualItem.index + 1}
                      showSignalState
                      leadTimeProof={leadTimeProofsMap.get(token.address.toLowerCase())}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Filters Bottom Sheet */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom" className="rounded-t-xl h-[85vh] bg-background border-border/50 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>Token filter settings</SheetDescription>
          </SheetHeader>
          <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mt-3 mb-4" />
          <div className="flex-1 overflow-y-auto h-[calc(85vh-3rem)]">
            <FiltersTab />
          </div>
        </SheetContent>
      </Sheet>

      {/* Gem Info Sheet */}
      <Sheet open={showGemInfo} onOpenChange={setShowGemInfo}>
        <SheetContent side="bottom" className="rounded-t-xl max-h-[50vh] bg-background border-border/50">
          <SheetHeader className="text-left pb-3">
            <SheetTitle className="flex items-center gap-2 text-sm font-mono font-bold uppercase">
              <Diamond className="h-4 w-4 text-cyan-400" />
              Gem Finder
            </SheetTitle>
            <SheetDescription className="sr-only">Gem Finder filtering criteria</SheetDescription>
          </SheetHeader>
          <div className="space-y-2 text-xs font-mono text-muted-foreground">
            <p>Filters for early-stage tokens with structural health indicators:</p>
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-muted/20 border border-border/30">
                <Droplets className="h-3 w-3 text-cyan-400 shrink-0" />
                <span>Liquidity $5K - $500K</span>
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-muted/20 border border-border/30">
                <TrendingUp className="h-3 w-3 text-green-400 shrink-0" />
                <span>SOLRAD score 55+</span>
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-muted/20 border border-border/30">
                <Star className="h-3 w-3 text-yellow-400 shrink-0" />
                <span>{'<'} 72h old or 50+ holders</span>
              </div>
            </div>
            <p className="text-muted-foreground/50 pt-2 text-[10px]">Not financial advice. Always DYOR.</p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
