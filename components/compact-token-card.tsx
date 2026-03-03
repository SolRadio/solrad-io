'use client';

import React from "react"
import type { TokenScore } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"
import Image from "next/image"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { formatUsdPrice, formatCompactUsd } from "@/lib/format"
import { getTokenOriginWithReason, getOriginAccent } from "@/lib/token-origin-accent"
import { getSolradScore, formatSolradScore } from "@/lib/token-score"

interface CompactTokenCardProps {
  token: TokenScore
  rank: number
  onClick?: () => void
}

/**
 * Compact token card for grid layouts
 * PART A: Uses SAME badge + tooltip system as dashboard token rows
 * A2: Wrapped in React.memo to prevent unnecessary rerenders
 */
export const CompactTokenCard = React.memo(function CompactTokenCard({ token, rank, onClick }: CompactTokenCardProps) {
  const { origin, reason, matched } = getTokenOriginWithReason(token)
  const accent = getOriginAccent(origin)
  const isDev = process.env.NODE_ENV !== "production"
  const score = getSolradScore(token)

  const isPositive = (token.priceChange24h ?? 0) >= 0
  const priceUsd = token.priceUsd ?? 0
  const volume24h = token.volume24h ?? 0
  const liquidity = token.liquidity ?? 0
  const badges = token.badges ?? []

  return (
    <Card 
      className="h-[280px] p-3.5 hover:bg-muted/30 transition-all duration-200 cursor-pointer flex flex-col bg-gradient-to-b from-card/95 to-card"
      onClick={onClick}
      style={accent.borderStyle}
    >
      {/* Header */}
      <div className="flex items-start gap-2.5 mb-3 min-h-0 rounded-none">
        <div 
          className="rounded-lg shrink-0"
          style={accent.ringStyle}
        >
          <Image
            src={token.imageUrl || "/placeholder.svg?height=36&width=36"}
            alt={`${token.symbol || "Token"} (${token.name || "Solana Token"}) logo`}
            width={36}
            height={36}
            className="rounded-full w-12 h-12"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="font-semibold truncate text-base tracking-tight line-clamp-1">{token.symbol}</h3>
            {accent.label && (
              <span 
                className="text-[8px] font-mono font-bold px-1 py-0.5 uppercase tracking-wider shrink-0 rounded-sm"
                style={{ backgroundColor: `${accent.borderColor}22`, color: accent.borderColor, border: `1px solid ${accent.borderColor}44` }}
                title={isDev ? `${origin} • ${reason} • ${matched}` : undefined}
              >
                {accent.label}
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground/70 truncate leading-tight font-normal line-clamp-1">{token.name}</p>
        </div>
      </div>
      
      {/* Price & Change */}
      <div className="mb-3 text-sm">
        <div className="font-mono text-base font-semibold tracking-tight tabular-nums truncate mb-1 mt-6">
          {formatUsdPrice(priceUsd)}
        </div>
        <div
          className={`flex items-center gap-1 text-xs font-semibold whitespace-nowrap ${
            isPositive ? "text-green-400" : "text-red-400"
          }`}
        >
          {isPositive ? <TrendingUp className="h-3 w-3 shrink-0" /> : <TrendingDown className="h-3 w-3 shrink-0" />}
          <span className="tabular-nums">
            {isPositive ? "+" : ""}
            {token.priceChange24h?.toFixed(1) ?? "0.0"}%
          </span>
        </div>
      </div>
      
      {/* Stats */}
      <div className="mb-2 text-sm space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="min-w-0">
            <div className="text-muted-foreground/60 mb-0.5 text-[10px] uppercase tracking-wide font-medium truncate">Vol</div>
            <div className="font-mono font-semibold tabular-nums truncate">{formatCompactUsd(volume24h)}</div>
          </div>
          <div className="min-w-0">
            <div className="text-muted-foreground/60 mb-0.5 text-[10px] uppercase tracking-wide font-medium truncate">Liq</div>
            <div className="font-mono font-semibold tabular-nums truncate">{formatCompactUsd(liquidity)}</div>
          </div>
        </div>
        {/* SOLRAD Score */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/30">
          <div className="text-muted-foreground/60 text-[10px] uppercase tracking-wide font-medium">Score</div>
          <Badge 
            variant="outline" 
            className="bg-primary/15 border-primary/30 font-mono font-semibold px-2 py-0.5 h-5 shrink-0 text-sm rounded-sm text-card-foreground"
          >
            {formatSolradScore(score)}
          </Badge>
        </div>
      </div>
      
      {/* Badges + Intel Popovers */}
      <div className="mt-auto pt-2.5 border-t border-border/50 overflow-hidden">
        {/* Badge row with tooltips */}
        <div className="flex items-center gap-2 mb-2 min-h-[28px] overflow-hidden">
          {badges.slice(0, 3).map((badge) => (
            <TooltipProvider key={badge.key}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    className={`w-6 h-6 shrink-0 rounded-md flex items-center justify-center text-sm cursor-default transition-all hover:scale-105 ${
                      badge.key === "RAD" ? "bg-green-500/10 border border-green-500/30" :
                      badge.key === "GEM" ? "bg-blue-500/10 border border-blue-500/30" :
                      badge.key === "TRASH" || badge.key === "WARNING" || badge.key === "WASH" ? "bg-red-500/10 border border-red-500/30" :
                      badge.key === "HELD" ? "bg-yellow-500/10 border border-yellow-500/30" :
                      "bg-cyan-500/10 border border-cyan-500/30"
                    }`}
                  >
                    {badge.icon}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold">{badge.label}</p>
                  <p className="text-xs text-muted-foreground">{badge.detail}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
          {badges.length > 3 && (
            <span className="text-[10px] text-muted-foreground/60 font-medium shrink-0">+{badges.length - 3}</span>
          )}
        </div>
        
        {/* Intel insight popovers */}
        <div className="flex items-center justify-between gap-1 overflow-hidden">
          <div className="flex items-center gap-1 overflow-hidden">
            {token.whyFlagged && (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    className="w-5 h-5 rounded-md bg-muted/30 border border-border/30 flex items-center justify-center text-[11px] opacity-50 hover:opacity-100 transition-opacity"
                    title="Why SOLRAD flagged this"
                  >
                    {"🤘"}
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" className="w-56 text-xs" onClick={(e) => e.stopPropagation()}>
                  <p className="font-semibold mb-1">Why Flagged</p>
                  <p className="text-muted-foreground">{token.whyFlagged}</p>
                </PopoverContent>
              </Popover>
            )}

            {token.scoreDebug && (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    className="w-5 h-5 rounded-md bg-muted/30 border border-border/30 flex items-center justify-center text-[11px] opacity-50 hover:opacity-100 transition-opacity"
                    title="Score Debug"
                  >
                    {"🧪"}
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" className="w-64 text-xs" onClick={(e) => e.stopPropagation()}>
                  <p className="font-semibold mb-1">Score Breakdown</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{token.scoreDebug}</p>
                </PopoverContent>
              </Popover>
            )}

            {token.tokenInsight && (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    className="w-5 h-5 rounded-md bg-muted/30 border border-border/30 flex items-center justify-center text-[11px] opacity-50 hover:opacity-100 transition-opacity"
                    title="Token Insight"
                  >
                    {"🧠"}
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" className="w-56 text-xs" onClick={(e) => e.stopPropagation()}>
                  <p className="font-semibold mb-1">Token Insight</p>
                  <p className="text-muted-foreground">{token.tokenInsight}</p>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
})
