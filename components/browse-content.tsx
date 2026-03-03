"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CompactTokenCard } from "@/components/compact-token-card"
import { TokenDetailDrawer } from "@/components/token-detail-drawer"
import type { TokenScore } from "@/lib/types"
import { Search, Filter, SortAsc, Activity, Info } from "lucide-react"
import Link from "next/link"
import { DataFreshnessBar } from "@/components/data-freshness-bar"

type SortField = "score" | "liquidity" | "volume" | "change24h" | "age"
type RiskFilter = "all" | "low" | "medium" | "high"
type BadgeFilter = "all" | "rad" | "gem" | "trash" | "held"

interface BrowseContentProps {
  initialTokens: TokenScore[]
  pageTokens: TokenScore[]
  currentPage: number
  totalPages: number
  updatedAt: string
}

export function BrowseContent({
  initialTokens,
  pageTokens,
  currentPage,
  totalPages,
  updatedAt,
}: BrowseContentProps) {
  // Client-side filters
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState<SortField>("score")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all")
  const [badgeFilter, setBadgeFilter] = useState<BadgeFilter>("all")
  const [minLiquidity, setMinLiquidity] = useState("")
  const [minVolume, setMinVolume] = useState("")

  // Drawer
  const [selectedToken, setSelectedToken] = useState<TokenScore | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Filtered and sorted tokens
  const filteredTokens = useMemo(() => {
    let result = [...initialTokens]

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (t) =>
          t.symbol?.toLowerCase().includes(q) ||
          t.name?.toLowerCase().includes(q) ||
          t.address?.toLowerCase().includes(q)
      )
    }

    // Risk filter
    if (riskFilter !== "all") {
      result = result.filter((t) => {
        if (riskFilter === "low") return t.riskLabel === "LOW RISK"
        if (riskFilter === "medium") return t.riskLabel === "MEDIUM RISK"
        if (riskFilter === "high") return t.riskLabel === "HIGH RISK"
        return true
      })
    }

    // Badge filter
    if (badgeFilter !== "all") {
      result = result.filter((t) => {
        const badges = t.badges || []
        if (badgeFilter === "rad")
          return badges.some((b) => b.key === "RAD" || b.icon === "🤘")
        if (badgeFilter === "gem")
          return badges.some((b) => b.key === "GEM" || b.icon === "💎")
        if (badgeFilter === "trash")
          return badges.some((b) => b.key === "TRASH" || b.key === "WARNING" || b.icon === "🗑️" || b.icon === "⚠️")
        if (badgeFilter === "held")
          return badges.some((b) => b.key === "HELD" || b.icon === "🕛")
        return true
      })
    }

    // Min liquidity filter
    if (minLiquidity) {
      const minLiq = Number.parseFloat(minLiquidity) * 1000
      result = result.filter((t) => (t.liquidity ?? 0) >= minLiq)
    }

    // Min volume filter
    if (minVolume) {
      const minVol = Number.parseFloat(minVolume) * 1000
      result = result.filter((t) => (t.volume24h ?? 0) >= minVol)
    }

    // Sort
    result.sort((a, b) => {
      let valA: number, valB: number

      switch (sortField) {
        case "score":
          valA = a.totalScore ?? 0
          valB = b.totalScore ?? 0
          break
        case "liquidity":
          valA = a.liquidity ?? 0
          valB = b.liquidity ?? 0
          break
        case "volume":
          valA = a.volume24h ?? 0
          valB = b.volume24h ?? 0
          break
        case "change24h":
          valA = a.priceChange24h ?? 0
          valB = b.priceChange24h ?? 0
          break
        case "age":
          valA = a.pairCreatedAt ?? 0
          valB = b.pairCreatedAt ?? 0
          break
        default:
          valA = a.totalScore ?? 0
          valB = b.totalScore ?? 0
      }

      return sortDir === "desc" ? valB - valA : valA - valB
    })

    return result
  }, [
    initialTokens,
    search,
    riskFilter,
    badgeFilter,
    minLiquidity,
    minVolume,
    sortField,
    sortDir,
  ])

  const handleTokenClick = (token: TokenScore) => {
    setSelectedToken(token)
    setDrawerOpen(true)
  }

  const hasActiveFilters =
    search || riskFilter !== "all" || badgeFilter !== "all" || minLiquidity || minVolume

  // If no filters active, show server-rendered page tokens with proper links
  const displayTokens = hasActiveFilters ? filteredTokens : pageTokens

  return (
    <>
      {/* How it works callout */}
      <div className="rounded-none border border-primary/20 bg-primary/5 p-5 max-w-4xl backdrop-blur-sm mb-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Info className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="flex-1 space-y-3">
            <p className="text-sm font-bold uppercase tracking-wide text-primary">
              How It Works
            </p>
            <div className="space-y-2.5 text-sm text-foreground/80 leading-relaxed">
              <div className="flex gap-3">
                <span className="text-primary font-mono text-xs mt-0.5">
                  01
                </span>
                <p>
                  SOLRAD scores tokens across multiple signals (liquidity,
                  momentum, quality).
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-mono text-xs mt-0.5">
                  02
                </span>
                <p>Tokens that reach a 50+ score are added to the Token Pool.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-mono text-xs mt-0.5">
                  03
                </span>
                <p>
                  The pool refreshes automatically as new data arrives, keeping
                  scores and metrics updated.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Freshness Bar */}
      <div className="mb-4">
        <DataFreshnessBar
          updatedAt={updatedAt}
          itemCount={initialTokens.length}
          itemLabel="tokens in pool"
          metadata={[
            { label: "Min Score", value: 50 },
          ]}
        />
      </div>

      {/* Filters Row */}
      <div className="mb-6 p-4 rounded-none border border-border bg-card/50 backdrop-blur">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, symbol, or mint..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <SortAsc className="h-4 w-4 text-muted-foreground" />
            <Select
              value={sortField}
              onValueChange={(v) => setSortField(v as SortField)}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Score</SelectItem>
                <SelectItem value="liquidity">Liquidity</SelectItem>
                <SelectItem value="volume">Volume</SelectItem>
                <SelectItem value="change24h">24h Change</SelectItem>
                <SelectItem value="age">Age</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
              className="bg-transparent"
            >
              {sortDir === "desc" ? "↓" : "↑"}
            </Button>
          </div>

          {/* Risk Filter */}
          <Select
            value={riskFilter}
            onValueChange={(v) => setRiskFilter(v as RiskFilter)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Risk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk</SelectItem>
              <SelectItem value="low">Low Risk</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High Risk</SelectItem>
            </SelectContent>
          </Select>

          {/* Badge Filter */}
          <Select
            value={badgeFilter}
            onValueChange={(v) => setBadgeFilter(v as BadgeFilter)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Badge" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Badges</SelectItem>
              <SelectItem value="rad">RAD Only</SelectItem>
              <SelectItem value="gem">GEM Only</SelectItem>
              <SelectItem value="trash">WARNING Only</SelectItem>
              <SelectItem value="held">HELD Only</SelectItem>
            </SelectContent>
          </Select>

          {/* Min Liquidity */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Liq $</span>
            <Input
              type="number"
              placeholder="Min K"
              value={minLiquidity}
              onChange={(e) => setMinLiquidity(e.target.value)}
              className="w-[80px]"
            />
            <span className="text-xs text-muted-foreground">K</span>
          </div>

          {/* Min Volume */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Vol $</span>
            <Input
              type="number"
              placeholder="Min K"
              value={minVolume}
              onChange={(e) => setMinVolume(e.target.value)}
              className="w-[80px]"
            />
            <span className="text-xs text-muted-foreground">K</span>
          </div>
        </div>

        {/* Active filters indicator */}
        <div className="mt-3 flex items-center gap-2">
          <Filter className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Showing {filteredTokens.length} of {initialTokens.length} tokens
          </span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-6 px-2"
              onClick={() => {
                setSearch("")
                setRiskFilter("all")
                setBadgeFilter("all")
                setMinLiquidity("")
                setMinVolume("")
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Token Grid */}
      {displayTokens.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Search className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
          <p className="text-muted-foreground font-semibold">
            No tokens match your filters.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting filters or clearing search.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3">
          {displayTokens.map((token, idx) => (
            <Link
              key={token.address}
              href={`/token/${token.address}`}
              onClick={(e) => {
                e.preventDefault()
                handleTokenClick(token)
              }}
            >
              <CompactTokenCard
                token={token}
                rank={idx + 1}
                onClick={() => handleTokenClick(token)}
              />
            </Link>
          ))}
        </div>
      )}

      {/* Token Detail Drawer */}
      {selectedToken && (
        <TokenDetailDrawer
          token={selectedToken}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
        />
      )}
    </>
  )
}
