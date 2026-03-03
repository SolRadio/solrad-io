"use client"

import { useState, useMemo } from "react"
import { TokenScore } from "@/lib/types"
import TokenRowMobile from "@/components/token-row-mobile"
import { Input } from "@/components/ui/input"
import { Activity, TrendingUp, Droplets, Coins, Sparkles, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

interface TabletTerminalProps {
  trendingTokens: TokenScore[]
  activeTokens: TokenScore[]
  newTokens: TokenScore[]
  freshSignals: TokenScore[]
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
    error: string | null
  }
  onRefresh?: () => void
  isRefreshing?: boolean
  lastUpdated?: number
  stale?: boolean
  staleSeverity?: "low" | "high" | "critical" | null
  liveWindowFallback?: boolean
}

export function TabletTerminal({
  trendingTokens,
  activeTokens,
  newTokens,
  freshSignals,
  stats,
  solPrice,
  onRefresh,
  isRefreshing,
  lastUpdated,
  stale,
  staleSeverity,
  liveWindowFallback,
}: TabletTerminalProps) {
  const [activeTab, setActiveTab] = useState<"trending" | "active" | "new" | "all">("trending")
  const [leftSearch, setLeftSearch] = useState("")
  const [rightSearch, setRightSearch] = useState("")

  // Get tokens for left column based on active tab
  const leftColumnTokens = useMemo(() => {
    let tokens: TokenScore[] = []
    switch (activeTab) {
      case "trending":
        tokens = trendingTokens
        break
      case "active":
        tokens = activeTokens
        break
      case "new":
        tokens = newTokens
        break
      case "all":
        tokens = [...trendingTokens, ...activeTokens, ...newTokens]
        // Remove duplicates by address
        tokens = tokens.filter((token, index, self) => 
          index === self.findIndex(t => t.address === token.address)
        )
        break
    }
    
    // Apply search filter
    if (leftSearch.trim()) {
      const searchLower = leftSearch.toLowerCase()
      tokens = tokens.filter(
        t =>
          t.symbol?.toLowerCase().includes(searchLower) ||
          t.name?.toLowerCase().includes(searchLower) ||
          t.address?.toLowerCase().includes(searchLower)
      )
    }
    
    return tokens
  }, [activeTab, trendingTokens, activeTokens, newTokens, leftSearch])

  // Filter fresh signals for right column
  const rightColumnTokens = useMemo(() => {
    if (!rightSearch.trim()) return freshSignals
    
    const searchLower = rightSearch.toLowerCase()
    return freshSignals.filter(
      t =>
        t.symbol?.toLowerCase().includes(searchLower) ||
        t.name?.toLowerCase().includes(searchLower) ||
        t.address?.toLowerCase().includes(searchLower)
    )
  }, [freshSignals, rightSearch])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navbar */}
      <Navbar 
        onRefresh={onRefresh} 
        isRefreshing={isRefreshing} 
        lastUpdated={lastUpdated}
        stale={stale}
        staleSeverity={staleSeverity}
        tokenCount={stats.tokensTracked}
      />
      
      {/* Stats Pills - 2-row grid */}
      <div className="px-4 pt-4 pb-3">
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          <div className="p-4 rounded-[12px] border border-primary/5 bg-secondary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] hover:border-primary/20 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-[2.5px] h-[2.5px] rounded-full bg-primary/60" />
                <span className="text-[9px] uppercase font-semibold text-muted-foreground/70 tracking-[0.08em] leading-none">VOL 24H</span>
              </div>
              <Activity className="h-3 w-3 text-primary/40" />
            </div>
            <div className="text-[22px] font-semibold font-mono leading-none tracking-tight tabular-nums">${(stats.totalVolume / 1000000).toFixed(1)}M</div>
          </div>

          <div className="p-4 rounded-[12px] border border-accent/5 bg-secondary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] hover:border-accent/20 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-[2.5px] h-[2.5px] rounded-full bg-purple-400/60" />
                <span className="text-[9px] uppercase font-semibold text-muted-foreground/70 tracking-[0.08em] leading-none">AVG</span>
              </div>
              <TrendingUp className="h-3 w-3 text-accent/40" />
            </div>
            <div className="text-[22px] font-semibold font-mono leading-none tracking-tight tabular-nums">{stats.avgScore.toFixed(0)}</div>
          </div>

          <div className="p-4 rounded-[12px] border border-success/5 bg-secondary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] hover:border-success/20 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-[2.5px] h-[2.5px] rounded-full bg-green-400/60" />
                <span className="text-[9px] uppercase font-semibold text-muted-foreground/70 tracking-[0.08em] leading-none">LIQUIDITY</span>
              </div>
              <Droplets className="h-3 w-3 text-green-400/40" />
            </div>
            <div className="text-[22px] font-semibold font-mono leading-none tracking-tight tabular-nums">${(stats.totalLiquidity / 1000000).toFixed(1)}M</div>
          </div>

          <div className="p-4 rounded-[12px] border border-purple-400/5 bg-secondary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] hover:border-purple-400/20 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-[2.5px] h-[2.5px] rounded-full bg-purple-400/60" />
                <span className="text-[9px] uppercase font-semibold text-muted-foreground/70 tracking-[0.08em] leading-none">TOKENS</span>
              </div>
              <Coins className="h-3 w-3 text-purple-400/40" />
            </div>
            <div className="text-[22px] font-semibold font-mono leading-none tracking-tight tabular-nums">{stats.tokensTracked}</div>
          </div>

          <div className="p-4 rounded-[12px] border border-cyan-400/8 bg-secondary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] hover:border-cyan-400/25 transition-colors col-span-2 ring-1 ring-cyan-400/5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-[2.5px] h-[2.5px] rounded-full bg-cyan-400/70" />
                <span className="text-[9px] uppercase font-semibold text-muted-foreground/70 tracking-[0.08em] leading-none">SOLANA PRICE</span>
              </div>
              <Sparkles className="h-3 w-3 text-cyan-400/50" />
            </div>
            {solPrice.loading ? (
              <div className="text-sm text-muted-foreground/60 font-mono">Loading...</div>
            ) : solPrice.error ? (
              <div className="text-sm text-muted-foreground/60 font-mono">—</div>
            ) : (
              <div className="flex items-baseline gap-2.5">
                <span className="text-[22px] font-semibold font-mono leading-none tracking-tight tabular-nums">${solPrice.price.toFixed(0)}</span>
                <span className={`text-xs font-semibold tabular-nums ${solPrice.change24h >= 0 ? "text-green-400/90" : "text-red-400/90"}`}>
                  {solPrice.change24h >= 0 ? "+" : ""}{solPrice.change24h.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab("trending")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
              activeTab === "trending"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            Trending
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
              activeTab === "active"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab("new")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
              activeTab === "new"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            New
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
              activeTab === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Two Column Layout - Scrollable */}
      <div className="px-3 md:px-4 pb-4">
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {/* Left Column: Token Radar */}
          <div className="flex flex-col rounded-2xl border border-white/10 bg-black/30">
            <div className="p-3 border-b border-white/10 bg-black/20 sticky top-0 z-10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold uppercase tracking-wide">Token Radar</h3>
                <Badge variant="secondary" className="text-xs">
                  {leftColumnTokens.length}
                </Badge>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tokens..."
                  value={leftSearch}
                  onChange={(e) => setLeftSearch(e.target.value)}
                  className="pl-9 h-9 text-sm bg-background/50"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-2 space-y-1">
                {leftColumnTokens.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    <p className="font-medium">No tokens found</p>
                    <p className="text-xs mt-1 opacity-70">Try adjusting your search</p>
                  </div>
                ) : (
                  leftColumnTokens.map((token, index) => (
                    <TokenRowMobile key={token.address} token={token} rank={index + 1} compact={true} />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Fresh Signals */}
          <div className="flex flex-col rounded-2xl border border-white/10 bg-black/30">
            <div className="p-3 border-b border-white/10 bg-black/20 sticky top-0 z-10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold uppercase tracking-wide">Fresh Signals</h3>
                <Badge variant="secondary" className="text-xs">
                  {rightColumnTokens.length}
                </Badge>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search signals..."
                  value={rightSearch}
                  onChange={(e) => setRightSearch(e.target.value)}
                  className="pl-9 h-9 text-sm bg-background/50"
                />
              </div>
            </div>
            <div className="p-2 space-y-1">
              {rightColumnTokens.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <p className="font-medium">No fresh signals</p>
                  <p className="text-xs mt-1 opacity-70">Check back soon</p>
                </div>
              ) : (
                rightColumnTokens.map((token, index) => (
                  <TokenRowMobile key={token.address} token={token} rank={index + 1} compact={true} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}
