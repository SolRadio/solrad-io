"use client"

import { useState, useMemo } from "react"
import type { TokenScore } from "@/lib/types"
import TokenRowDesktop from "./token-row-desktop"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Input } from "./ui/input"
import { Flame, TrendingUp, Sparkles, Search, Activity } from "lucide-react"
import type { LeadTimeProof } from "@/lib/lead-time/types"
import { extractAllScores } from "@/lib/utils/score-percentile"

// Column view options for the toggle
type ColumnView = "trending" | "active" | "new-early" | "signals"

interface DesktopTerminalProps {
  trending: TokenScore[]
  active: TokenScore[]
  newEarly: TokenScore[]
  freshSignals: TokenScore[]
  all?: TokenScore[]
  updatedAt?: number
  stale?: boolean
  staleSeverity?: "low" | "high" | null
  refreshing?: boolean
  liveWindowFallback?: boolean
  leadTimeProofsMap?: Map<string, LeadTimeProof>
  compact?: boolean
}

// Column config for consistent rendering
const COLUMN_CONFIG: Record<ColumnView, { icon: typeof Flame; label: string; color: string }> = {
  "trending": { icon: Flame, label: "TRENDING", color: "text-orange-500/80" },
  "active": { icon: TrendingUp, label: "ACTIVE", color: "text-green-500/80" },
  "new-early": { icon: Sparkles, label: "NEW/EARLY", color: "text-primary/80" },
  "signals": { icon: Activity, label: "SIGNALS", color: "text-yellow-500/80" },
}

export function DesktopTerminal({ trending, active, newEarly, freshSignals, all, updatedAt, stale, staleSeverity, refreshing, liveWindowFallback, leadTimeProofsMap = new Map(), compact = false }: DesktopTerminalProps) {
  // Per-column local filter state
  const [trendingSort, setTrendingSort] = useState("score")
  const [trendingRisk, setTrendingRisk] = useState("all")
  const [activeSort, setActiveSort] = useState("24h-vol")
  const [activeRisk, setActiveRisk] = useState("all")
  const [newSort, setNewSort] = useState("age")
  const [newRisk, setNewRisk] = useState("all")
  const [freshSort, setFreshSort] = useState("urgency")
  const [freshRisk, setFreshRisk] = useState("all")
  
  const [trendingSearch, setTrendingSearch] = useState("")
  const [activeSearch, setActiveSearch] = useState("")
  const [newSearch, setNewSearch] = useState("")

  // Compute all scores once for percentile calculations across all columns
  const allScores = useMemo(() => {
    const combined = all ?? [...trending, ...active, ...newEarly, ...freshSignals]
    return extractAllScores(combined)
  }, [all, trending, active, newEarly, freshSignals])
  const [freshSearch, setFreshSearch] = useState("")

  const filterByRisk = (tokenList: TokenScore[], riskFilter: string) => {
    if (riskFilter === "all") return tokenList
    return tokenList.filter((t) => {
      if (riskFilter === "low") return t.riskLabel === "LOW RISK"
      if (riskFilter === "medium") return t.riskLabel === "MEDIUM RISK"
      if (riskFilter === "high") return t.riskLabel === "HIGH RISK"
      return true
    })
  }
  
  const filterBySearch = (tokenList: TokenScore[], searchQuery: string) => {
    if (!searchQuery.trim()) return tokenList
    const q = searchQuery.toLowerCase()
    return tokenList.filter((t) =>
      t.symbol?.toLowerCase().includes(q) ||
      t.name?.toLowerCase().includes(q) ||
      t.address?.toLowerCase().includes(q)
    )
  }

  const trendingTokens = useMemo(
    () => filterBySearch(filterByRisk(trending, trendingRisk), trendingSearch),
    [trending, trendingRisk, trendingSearch]
  )
  const activeTokens = useMemo(
    () => filterBySearch(filterByRisk(active, activeRisk), activeSearch),
    [active, activeRisk, activeSearch]
  )
  const newTokens = useMemo(
    () => filterBySearch(filterByRisk(newEarly, newRisk), newSearch),
    [newEarly, newRisk, newSearch]
  )
  const freshTokens = useMemo(
    () => filterBySearch(filterByRisk(freshSignals, freshRisk), freshSearch),
    [freshSignals, freshRisk, freshSearch]
  )

  // Get data/state for a given view
  const getColumnData = (view: ColumnView) => {
    switch (view) {
      case "trending": return { tokens: trendingTokens, sort: trendingSort, setSort: setTrendingSort, risk: trendingRisk, setRisk: setTrendingRisk, search: trendingSearch, setSearch: setTrendingSearch, sortOptions: [{ value: "score", label: "Score" }, { value: "volume", label: "Volume" }, { value: "liquidity", label: "Liquidity" }, { value: "24h-change", label: "24h Change" }] }
      case "active": return { tokens: activeTokens, sort: activeSort, setSort: setActiveSort, risk: activeRisk, setRisk: setActiveRisk, search: activeSearch, setSearch: setActiveSearch, sortOptions: [{ value: "24h-vol", label: "24h Vol" }, { value: "1h-vol", label: "1h Vol" }, { value: "txns", label: "Txns" }] }
      case "new-early": return { tokens: newTokens, sort: newSort, setSort: setNewSort, risk: newRisk, setRisk: setNewRisk, search: newSearch, setSearch: setNewSearch, sortOptions: [{ value: "age", label: "Newest" }, { value: "liquidity", label: "Liquidity" }] }
      case "signals": return { tokens: freshTokens, sort: freshSort, setSort: setFreshSort, risk: freshRisk, setRisk: setFreshRisk, search: freshSearch, setSearch: setFreshSearch, sortOptions: [{ value: "urgency", label: "Urgency" }, { value: "volume", label: "Volume" }, { value: "change", label: "Change" }] }
    }
  }

  // Render a single column
  const renderColumn = (view: ColumnView, srLabel: string) => {
    const config = COLUMN_CONFIG[view]
    const Icon = config.icon
    const col = getColumnData(view)
    return (
      <div className="flex flex-col bg-[#0a0a0a] overflow-visible" style={{ minHeight: 0, minWidth: 0 }}>
        <h2 className="sr-only">{srLabel}</h2>
        
        <div className="shrink-0 px-3 py-2.5 border-b border-zinc-800 bg-[#0a0a0a] bg-card">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Icon className={`h-3.5 w-3.5 ${config.color}`} />
              <h3 className="text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-zinc-500">{config.label}</h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-600 tabular-nums">{col.tokens.length}</span>
          </div>
          <div className="relative mb-1.5">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-600" />
            <Input
              type="text"
              placeholder="Filter..."
              value={col.search}
              onChange={(e) => col.setSearch(e.target.value)}
              className="h-7 text-xs pl-7 bg-zinc-900 border-zinc-800 font-mono text-sm placeholder:text-zinc-600 rounded-none focus:border-zinc-600 transition-colors"
            />
          </div>
          <div className="flex gap-1">
            <Select value={col.sort} onValueChange={col.setSort}>
              <SelectTrigger className="h-7 text-xs bg-zinc-900 border-zinc-800 flex-1 font-mono rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {col.sortOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={col.risk} onValueChange={col.setRisk}>
              <SelectTrigger className="h-7 text-xs bg-zinc-900 border-zinc-800 w-[4.5rem] font-mono rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Med</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain thin-scrollbar px-0 py-0 bg-[#0a0a0a]">
          <div>
            {col.tokens.map((token, index) => (
              <TokenRowDesktop 
                key={token.address} 
                token={token} 
                rank={index + 1}
                leadTimeProof={leadTimeProofsMap.get(token.address.toLowerCase())}
                allScores={allScores}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="hidden md:flex md:flex-col relative" style={{ minHeight: 0, height: '100%' }}>
      {/* Loading overlay when refreshing */}
      {refreshing && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] mb-2" />
            <p className="text-sm font-semibold text-white">Refreshing data...</p>
          </div>
        </div>
      )}
      
      {/* 3-column grid: Trending | Active | Signals */}
      <div className={`grid grid-cols-3 gap-px bg-zinc-900 overflow-hidden border border-zinc-800 ${
        stale && (staleSeverity === "high" || staleSeverity === "critical") 
          ? "ring-1 ring-orange-500/30" 
          : ""
      }`} style={{ flex: 1, minHeight: '600px' }}>
        {renderColumn("trending", "Trending Solana Tokens")}
        {renderColumn("active", "Active Solana Tokens")}
        {renderColumn("signals", "Fresh Signal Solana Tokens")}
      </div>
    </div>
  )
}
