"use client"

import React from "react"
import { useState } from "react"
import type { TokenScore } from "@/lib/types"

import {
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Share2,
  Copy,
  Check,
  MoreHorizontal,
  Star,
  HelpCircle,
  BarChart3,
  Lightbulb,
} from "lucide-react"
import { TokenImage } from "@/components/token-image"
import { TokenDetailDrawer } from "./token-detail-drawer"
import { generateShareText } from "@/lib/intel/converter"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useWatchlist } from "@/hooks/use-watchlist"
import { useToast } from "@/hooks/use-toast"
import { formatUsdPrice, formatCompactUsd } from "@/lib/format"
import { getTokenOriginWithReason, getOriginAccent } from "@/lib/token-origin-accent"
import { getSolradScore, formatSolradScore } from "@/lib/token-score"
import { LeadTimeBadge } from "./lead-time-badge"
import { getScorePercentile, formatPercentile } from "@/lib/utils/score-percentile"
import { ConvictionIcon } from "./conviction-icon"
import type { LeadTimeProof } from "@/lib/lead-time/types"

// PART A: Removed useFreshQuote - live polling ONLY happens in TokenDetailDrawer, not per-card

interface TokenRowDesktopProps {
  token: TokenScore
  rank: number
  leadTimeProof?: LeadTimeProof
  allScores?: number[]
}

// Sprint 1: Wrapped in React.memo to prevent unnecessary rerenders
export const TokenRowDesktop = React.memo(function TokenRowDesktop({ token, rank, leadTimeProof, allScores = [] }: TokenRowDesktopProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const { isWatched, toggleWatch } = useWatchlist()
  const { toast } = useToast()
  
  // PART A: Use token data directly - no per-row polling to avoid 429 storms
  const isPositive = (token.priceChange24h ?? 0) >= 0

  const handleExternalLink = (e: React.MouseEvent) => {
    e.stopPropagation()
    const dexUrl = token.pairUrl || `https://dexscreener.com/solana/${token.address}`
    window.open(dexUrl, "_blank", "noopener,noreferrer")
  }

  // STEP H: Text-based share (no image generation)
  const handleCopyXPost = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const shareText = generateShareText(token)
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Silently fail
    }
  }

  const handleOpenXCompose = (e: React.MouseEvent) => {
    e.stopPropagation()
    const shareText = generateShareText(token)
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const handleToggleWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation()
    const wasWatched = isWatched(token.address)
    toggleWatch(token.address, {
      symbol: token.symbol,
      name: token.name,
      image: token.imageUrl,
    })
    
    toast({
      title: wasWatched ? "Removed from Watchlist" : "Added to Watchlist",
      description: `${token.symbol} ${wasWatched ? "removed from" : "added to"} your watchlist`,
    })
  }

  const badges = token.badges ?? []
  const hasWashWarning = token.washTrading?.suspected === true
  const { origin, reason, matched } = getTokenOriginWithReason(token)
  const accent = getOriginAccent(origin)
  const isDev = process.env.NODE_ENV !== "production"
  const score = getSolradScore(token)

  return (
    <>
      <div
        onClick={() => setDrawerOpen(true)}
        className="group relative flex items-center flex-wrap gap-x-3 gap-y-1 px-3 py-3 border-b border-zinc-900 bg-[#0a0a0a] hover:bg-[#111111] transition-all cursor-pointer min-h-[80px] bg-card"
        style={{ borderLeft: '2px solid transparent' }}
        onMouseEnter={(e) => {
          const s = score ?? 0
          e.currentTarget.style.borderLeftColor = s >= 70 ? 'rgb(34,197,94)' : s >= 40 ? 'rgb(245,158,11)' : 'rgb(239,68,68)'
        }}
        onMouseLeave={(e) => { e.currentTarget.style.borderLeftColor = 'transparent' }}
      >
        {/* Zone 1: Rank + Avatar (identity anchor) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-xs font-mono text-muted-foreground/35 tabular-nums w-5 text-right">{rank}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <TokenImage
                    src={token.imageUrl}
                    symbol={token.symbol}
                    size={48}
                    className="flex-none"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="font-semibold">{token.symbol} &mdash; {token.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Zone 2: Symbol + Name + Badges */}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs font-mono font-bold text-white tracking-wider truncate leading-tight cursor-default">{token.symbol}</span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="font-semibold">{token.symbol} ({token.name})</p>
                  <p className="text-xs text-muted-foreground font-mono">{token.address.slice(0, 8)}...{token.address.slice(-6)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {accent.label && (
              <span 
                className="text-[8px] uppercase px-1 py-px rounded font-bold tracking-wider shrink-0"
                style={{ backgroundColor: `${accent.borderColor}15`, color: accent.borderColor, border: `1px solid ${accent.borderColor}40` }}
              >
                {accent.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] font-mono text-zinc-500 truncate">{token.name}</span>
            {/* Badge indicators */}
            <div className="flex items-center gap-0.5 shrink-0">
              {badges.slice(0, 3).map((badge) => (
                <TooltipProvider key={badge.key}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className={`w-[18px] h-[18px] rounded flex items-center justify-center text-[10px] cursor-default ${
                          badge.key === "RAD" ? "bg-green-500/10 text-green-500" :
                          badge.key === "GEM" ? "bg-blue-500/10 text-blue-500" :
                          badge.key === "TRASH" || badge.key === "WARNING" || badge.key === "WASH" ? "bg-red-500/10 text-red-500" :
                          badge.key === "HELD" ? "bg-yellow-500/10 text-yellow-500" :
                          "bg-cyan-500/10 text-cyan-500"
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
              {hasWashWarning && !badges.some(b => b.key === "WASH") && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-[18px] h-[18px] rounded bg-orange-500/10 flex items-center justify-center text-[10px] cursor-default text-orange-500">
                        {"!"}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">Wash-Filtered Volume</p>
                      <p className="text-xs text-muted-foreground max-w-[200px]">{token.washTrading?.notes ?? "Suspected wash trading detected"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>

        {/* Zone 3: Price + Change */}
        <div className="flex flex-col items-end shrink-0 min-w-[75px]">
          <span className="text-sm font-mono font-semibold tabular-nums leading-tight text-zinc-200">{formatUsdPrice(token.priceUsd)}</span>
          <span className={`text-xs font-mono font-bold tabular-nums flex items-center gap-0.5 ${isPositive ? "text-green-500" : "text-red-500"}`}>
            {isPositive ? <TrendingUp className="h-3 w-3 shrink-0" /> : <TrendingDown className="h-3 w-3 shrink-0" />}
            {isPositive ? "+" : ""}{token.priceChange24h?.toFixed(1) ?? "0.0"}%
          </span>
        </div>

        {/* Zone 4: VOL / LIQ + data age */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-col items-end shrink-0 min-w-[60px] cursor-default">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono text-muted-foreground/50 uppercase">V</span>
                  <span className="text-xs font-mono font-medium tabular-nums">{formatCompactUsd(token.volume24h)}</span>
                  {(() => {
                    const fetchedAt = (token as any).dataFetchedAt ?? (token as any).sourceUpdatedAt
                    if (!fetchedAt) return null
                    const ageMin = Math.floor((Date.now() - fetchedAt) / 60000)
                    return ageMin > 0 ? (
                      <span className={`text-[9px] font-mono ${ageMin > 5 ? "text-amber-600" : "text-zinc-600"}`}>
                        {ageMin}m
                      </span>
                    ) : null
                  })()}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono text-muted-foreground/50 uppercase">L</span>
                  <span className="text-xs font-mono font-medium tabular-nums">{formatCompactUsd(token.liquidity)}</span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs"><span className="font-semibold">V</span> = 24h Volume &middot; <span className="font-semibold">L</span> = Liquidity Pool</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Zone 5: SOLRAD Score pill + percentile */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="shrink-0 cursor-default flex items-center gap-1.5">
                <div
                  className="w-[3px] h-4 shrink-0"
                  style={{
                    backgroundColor: (score ?? 0) >= 70 ? 'rgb(34,197,94)' : (score ?? 0) >= 40 ? 'rgb(245,158,11)' : 'rgb(239,68,68)',
                  }}
                />
                <div className="flex flex-col items-center gap-0.5">
                  <span className={`text-sm font-mono font-bold tabular-nums leading-none ${
                    (score ?? 0) >= 70 ? 'text-green-500' : (score ?? 0) >= 40 ? 'text-amber-500' : 'text-red-500'
                  }`}>{formatSolradScore(score)}</span>
                  {allScores.length > 0 && (
                    <span className="text-[9px] font-mono text-zinc-600 leading-none">
                      {formatPercentile(getScorePercentile(score, allScores))}
                    </span>
                  )}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs font-semibold">SOLRAD Score (0&ndash;100)</p>
              <p className="text-xs text-muted-foreground">Composite signal strength rating</p>
              {allScores.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Scores higher than {getScorePercentile(score, allScores)}% of tracked tokens
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Zone 6: Risk badge + Conviction */}
        <div className="flex items-center gap-1.5 shrink-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="min-w-[44px] text-center cursor-default">
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wide ${
                    token.riskLabel === "LOW RISK" ? "text-green-500" :
                    token.riskLabel === "MEDIUM RISK" ? "text-yellow-500" :
                    "text-red-500"
                  }`}>
                    {token.riskLabel?.replace(" RISK", "") || "--"}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">Risk: <span className="font-semibold">{token.riskLabel || "Unknown"}</span></p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <ConvictionIcon
            score={score}
            riskLabel={token.riskLabel}
            volume24h={token.volume24h}
            liquidity={token.liquidity}
            holderCount={(token as any).holderCount ?? (token as any).holders}
          />
        </div>

        {/* Zone 7: Lead-Time Badge -- only show if we have meaningful lead data (>0) */}
        {(Number(leadTimeProof?.leadBlocks) > 0 || Number(leadTimeProof?.leadSeconds) > 0) && (
          <div className="shrink-0">
            <LeadTimeBadge
              leadBlocks={leadTimeProof?.leadBlocks}
              leadSeconds={leadTimeProof?.leadSeconds}
              confidence={leadTimeProof?.confidence || "MEDIUM"}
            />
          </div>
        )}

        {/* Zone 8: Trade deep-link (hover-only) + Compact actions trigger */}
        <div className="shrink-0 ml-auto pl-1 flex items-center gap-1.5">
          <a
            href={`https://jup.ag/?inputMint=So11111111111111111111111111111111111111112&outputMint=${token.address}&buy=${token.address}&sell=So11111111111111111111111111111111111111112`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="hidden group-hover:inline-flex items-center gap-1 text-[10px] font-mono font-bold tracking-wider border border-zinc-700 px-2 py-1 hover:border-green-700 hover:text-green-400 transition-colors text-zinc-400"
          >
            TRADE
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground/30 group-hover:text-muted-foreground group-hover:bg-muted/40 hover:!bg-muted/70 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Token actions</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="left"
              align="start"
              sideOffset={8}
              className="w-[240px] bg-card border-border/60"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-mono">
                Actions
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  handleCopyXPost(e as unknown as React.MouseEvent)
                }}
                className="gap-2.5 text-xs cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy X post text"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  handleOpenXCompose(e as unknown as React.MouseEvent)
                }}
                className="gap-2.5 text-xs cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share on X
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleWatchlist(e as unknown as React.MouseEvent)
                }}
                className="gap-2.5 text-xs cursor-pointer"
              >
                <Star className={`h-3.5 w-3.5 ${isWatched(token.address) ? "fill-yellow-500 text-yellow-500" : ""}`} />
                {isWatched(token.address) ? "Remove from Watchlist" : "Add to Watchlist"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  handleExternalLink(e as unknown as React.MouseEvent)
                }}
                className="gap-2.5 text-xs cursor-pointer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open DexScreener
              </DropdownMenuItem>

              {/* Intel section — only shown when data exists */}
              {(token.whyFlagged || token.scoreDebug || token.tokenInsight) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-mono">
                    Intel
                  </DropdownMenuLabel>
                </>
              )}
              {token.whyFlagged && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    setDrawerOpen(true)
                  }}
                  className="gap-2.5 text-xs cursor-pointer"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <div className="flex flex-col min-w-0">
                    <span>Why SOLRAD flagged this</span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {token.signalReasons?.[0] || token.whyFlagged}
                    </span>
                  </div>
                </DropdownMenuItem>
              )}
              {token.scoreDebug && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    setDrawerOpen(true)
                  }}
                  className="gap-2.5 text-xs cursor-pointer"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  <div className="flex flex-col min-w-0">
                    <span>Score breakdown</span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {token.scoreDebug.slice(0, 50)}
                    </span>
                  </div>
                </DropdownMenuItem>
              )}
              {token.tokenInsight && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    setDrawerOpen(true)
                  }}
                  className="gap-2.5 text-xs cursor-pointer"
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  <div className="flex flex-col min-w-0">
                    <span>Token insight</span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {token.tokenInsight.slice(0, 50)}
                    </span>
                  </div>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <TokenDetailDrawer token={token} open={drawerOpen} onOpenChange={setDrawerOpen} allScores={allScores} />
    </>
  )
})

// Default export for consistent import style
export default TokenRowDesktop
