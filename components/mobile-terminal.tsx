"use client"

import React from "react"

import { useState, useMemo } from "react"
import type { TokenScore } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Search, Flame, Activity, Sparkles, TrendingUp, TrendingDown, ExternalLink, Coins } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"
import { TokenDetailDrawer } from "./token-detail-drawer"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { featureFlags } from "@/lib/featureFlags"
import { GemFinderModal } from "./gem-finder-modal"

interface MobileTerminalProps {
  trending: TokenScore[]
  active: TokenScore[]
  newEarly: TokenScore[]
  all: TokenScore[]
  gemFinderMode: boolean
  onGemFinderChange: (enabled: boolean) => void
}

type TabType = "trending" | "active" | "new"
type RiskFilter = "all" | "low" | "med" | "high"

/**
 * Mobile Terminal - Pro dashboard layout for mobile
 * PART M1: Sticky controls, segmented tabs, compact token rows
 */
export function MobileTerminal({
  trending,
  active,
  newEarly,
  all,
  gemFinderMode,
  onGemFinderChange,
}: MobileTerminalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("trending")
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState("score")
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all")
  const [selectedToken, setSelectedToken] = useState<TokenScore | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Get tokens based on active tab
  const tabTokens = useMemo(() => {
    switch (activeTab) {
      case "trending":
        return trending
      case "active":
        return active
      case "new":
        return newEarly
      default:
        return all
    }
  }, [activeTab, trending, active, newEarly, all])

  // Apply filters and sort
  const filteredTokens = useMemo(() => {
    let tokens = [...tabTokens]

    // Search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase()
      tokens = tokens.filter(
        (t) =>
          t.symbol?.toLowerCase().includes(searchLower) ||
          t.name?.toLowerCase().includes(searchLower) ||
          t.address?.toLowerCase().includes(searchLower)
      )
    }

    // Risk filter
    if (riskFilter !== "all") {
      tokens = tokens.filter((t) => {
        const risk = t.riskLabel?.toLowerCase() || ""
        if (riskFilter === "low") return risk.includes("low")
        if (riskFilter === "med") return risk.includes("medium") || risk.includes("med")
        if (riskFilter === "high") return risk.includes("high")
        return true
      })
    }

    // Sort
    switch (sortBy) {
      case "volume":
        tokens.sort((a, b) => (b.volume24h ?? 0) - (a.volume24h ?? 0))
        break
      case "liquidity":
        tokens.sort((a, b) => (b.liquidity ?? 0) - (a.liquidity ?? 0))
        break
      case "change":
        tokens.sort((a, b) => (b.priceChange24h ?? 0) - (a.priceChange24h ?? 0))
        break
      case "score":
      default:
        tokens.sort((a, b) => b.totalScore - a.totalScore)
        break
    }

    return tokens
  }, [tabTokens, search, riskFilter, sortBy])

  const handleTokenClick = (token: TokenScore) => {
    setSelectedToken(token)
    setDrawerOpen(true)
  }

  const tabs: { key: TabType; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "trending", label: "Trending", icon: <Flame className="h-3.5 w-3.5" />, count: trending.length },
    { key: "active", label: "Active", icon: <Activity className="h-3.5 w-3.5" />, count: active.length },
    { key: "new", label: "New/Early", icon: <Sparkles className="h-3.5 w-3.5" />, count: newEarly.length },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* PART M1: Sticky top controls */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border pb-3 space-y-3">
        {/* Live Data Indicator */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] uppercase font-semibold text-muted-foreground/60 tracking-wide">
            Live data • Last 5 min
          </span>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search tokens..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-muted/50 border-border/50"
          />
        </div>

        {/* Sort + Risk Filters Row */}
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[110px] h-8 text-xs bg-muted/50">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Score</SelectItem>
              <SelectItem value="volume">Volume</SelectItem>
              <SelectItem value="liquidity">Liquidity</SelectItem>
              <SelectItem value="change">24h Change</SelectItem>
            </SelectContent>
          </Select>

          {/* Risk filter chips */}
          <div className="flex items-center gap-2 flex-1 overflow-x-auto scrollbar-hide">
            {(["all", "low", "med", "high"] as RiskFilter[]).map((risk) => (
              <button
                key={risk}
                type="button"
                onClick={() => setRiskFilter(risk)}
                className={`
                  px-3 py-1.5 min-h-[44px] rounded-full text-[10px] font-bold uppercase whitespace-nowrap
                  transition-all shrink-0 flex items-center
                  ${riskFilter === risk
                    ? risk === "low"
                      ? "bg-green-500/20 text-green-400 border border-green-500/50"
                      : risk === "med"
                        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50"
                        : risk === "high"
                          ? "bg-red-500/20 text-red-400 border border-red-500/50"
                          : "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground border border-transparent"
                  }
                `}
              >
                {risk === "all" ? "All" : risk === "med" ? "Med Risk" : `${risk} Risk`}
              </button>
            ))}
          </div>
        </div>

          {/* Gem Finder Toggle */}
          {featureFlags.gemFinderMode && (
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-cyan-400" />
                <Label htmlFor="gem-finder-mobile" className="text-xs uppercase font-bold cursor-pointer">
                  Gem Finder
                </Label>
              </div>
              <Switch
                id="gem-finder-mobile"
                checked={gemFinderMode}
                onCheckedChange={onGemFinderChange}
              />
            </div>
          )}

        {/* Segmented Tabs */}
        <div className="flex bg-muted/30 rounded-xl p-1 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`
                flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg
                text-xs font-bold uppercase transition-all
                ${activeTab === tab.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className="text-[10px] opacity-70">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Token List */}
      <div className="flex-1 overflow-y-auto pt-3 pb-20">
        {filteredTokens.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Search className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">No tokens match your filters</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTokens.map((token, index) => (
              <MobileTokenRow
                key={token.address}
                token={token}
                rank={index + 1}
                onClick={() => handleTokenClick(token)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Sheet Drawer */}
      {selectedToken && (
        <TokenDetailDrawer
          token={selectedToken}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
        />
      )}
    </div>
  )
}

/**
 * PART M2: Compact Mobile Token Row
 * Dense, readable, thumb-friendly design
 */
interface MobileTokenRowProps {
  token: TokenScore
  rank: number
  onClick: () => void
}

function MobileTokenRow({ token, rank, onClick }: MobileTokenRowProps) {
  const isPositive = (token.priceChange24h ?? 0) >= 0
  const badges = token.badges ?? []

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return "$0.00"
    if (price < 0.0001) return `$${price.toExponential(2)}`
    if (price < 0.01) return `$${price.toFixed(6)}`
    if (price < 1) return `$${price.toFixed(4)}`
    return `$${price.toFixed(2)}`
  }

  const handleDexClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(`https://dexscreener.com/solana/${token.address}`, "_blank")
  }

  return (
    <div
      onClick={onClick}
      className="
        flex items-center gap-2.5 px-3 py-2.5
        bg-card/80 border border-border/50 rounded-xl
        active:bg-muted/60 transition-colors cursor-pointer
        relative overflow-hidden
      "
    >
      {/* Left edge rank indicator */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 to-accent/50 rounded-l-xl" />

      {/* Token Avatar + Rank */}
      <div className="relative shrink-0">
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-border/50">
          {token.imageUrl ? (
            <Image
              src={token.imageUrl || "/placeholder.svg"}
              alt={token.symbol || "Token"}
              width={40}
              height={40}
              className="rounded-lg object-cover"
            />
          ) : (
            <span className="text-sm font-bold uppercase text-muted-foreground">
              {token.symbol?.[0] || "?"}
            </span>
          )}
        </div>
        <div className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-background border border-border flex items-center justify-center">
          <span className="text-[9px] font-bold text-muted-foreground">{rank}</span>
        </div>
      </div>

      {/* Center: Token Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold uppercase truncate">{token.symbol}</span>
        </div>
        <span className="text-[11px] text-muted-foreground truncate block">{token.name}</span>
        
        {/* Badge strip - uses existing badge system */}
        {badges.length > 0 && (
          <div className="flex items-center gap-0.5 mt-1">
            {badges.slice(0, 4).map((badge) => (
              <Popover key={badge.key}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    className="w-5 h-5 rounded bg-muted/50 border border-border/50 flex items-center justify-center text-xs active:bg-muted transition-colors"
                  >
                    {badge.icon}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  side="top"
                  className="w-auto px-3 py-2 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{badge.icon}</span>
                    <div>
                      <div className="font-semibold">{badge.label}</div>
                      <div className="text-muted-foreground">{badge.detail ?? badge.tooltip ?? ""}</div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            ))}
            {badges.length > 4 && (
              <span className="text-[9px] text-muted-foreground ml-0.5">+{badges.length - 4}</span>
            )}
          </div>
        )}
      </div>

      {/* Right: Stats */}
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        {/* Score pill */}
        <div
          className={`
            px-2 py-0.5 rounded text-[11px] font-bold
            ${token.totalScore >= 80
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : token.totalScore >= 55
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "bg-red-500/20 text-red-400 border border-red-500/30"
            }
          `}
        >
          {token.totalScore}
        </div>
        
        {/* Price */}
        <span className="text-[11px] font-mono">{formatPrice(token.priceUsd)}</span>
        
        {/* Change */}
        <div className={`flex items-center gap-0.5 text-[10px] font-semibold ${isPositive ? "text-green-400" : "text-red-400"}`}>
          {isPositive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
          {isPositive ? "+" : ""}{token.priceChange24h?.toFixed(1) ?? "0.0"}%
        </div>
      </div>

      {/* Dex link */}
      <button
        type="button"
        onClick={handleDexClick}
        className="shrink-0 p-1.5 rounded bg-muted/30 border border-border/30 active:bg-muted transition-colors"
        aria-label="View on Dexscreener"
      >
        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    </div>
  )
}
