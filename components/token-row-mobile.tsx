"use client"

import React from "react"
import { useState, useMemo } from "react"
import type { TokenScore } from "@/lib/types"
import { ExternalLink, TrendingUp, TrendingDown, AlertTriangle, Sparkles } from "lucide-react"
import { TokenImage } from "@/components/token-image"
import { TokenDetailDrawer } from "./token-detail-drawer"
import { WatchlistButton } from "@/components/watchlist-button"
import { useWatchlist } from "@/hooks/use-watchlist"
import { formatUsdPrice } from "@/lib/format"
import { getSolradScore, formatSolradScore } from "@/lib/token-score"
import { computeSignalState, computeConfidence } from "@/lib/signal-state"
import type { SignalState } from "@/lib/signal-state"
import { LeadTimeBadge } from "./lead-time-badge"
import type { LeadTimeProof } from "@/lib/lead-time/types"

interface TokenRowMobileProps {
  token: TokenScore
  rank: number
  compact?: boolean
  showSignalState?: boolean
  leadTimeProof?: LeadTimeProof
}

const signalColors: Record<SignalState, { border: string; text: string; bg: string; label: string }> = {
  EARLY: { border: "border-purple-500/30", text: "text-purple-400", bg: "bg-purple-500/10", label: "EARLY" },
  CAUTION: { border: "border-yellow-500/30", text: "text-yellow-400", bg: "bg-yellow-500/10", label: "CAUTION" },
  STRONG: { border: "border-green-500/30", text: "text-green-400", bg: "bg-green-500/10", label: "STRONG" },
}

export const TokenRowMobile = React.memo(function TokenRowMobile({
  token,
  rank,
  compact = true,
  showSignalState = true,
  leadTimeProof,
}: TokenRowMobileProps) {
  const { isWatched } = useWatchlist()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isPositive = (token.priceChange24h ?? 0) >= 0
  const score = getSolradScore(token)

  const isHot = (() => {
    const age = Date.now() - ((token as Record<string, unknown>).detectedAt as number ?? token.lastUpdated ?? 0)
    return age < 60 * 60 * 1000 && (token.totalScore ?? 0) >= 60
  })()

  const delta = ((token as Record<string, unknown>).scoreDelta ?? (token as Record<string, unknown>).scoreChange ?? 0) as number

  const signalState = useMemo(() => {
    const confidence = computeConfidence(token)
    return computeSignalState(token, confidence)
  }, [token])

  const sc = signalColors[signalState]

  const formatVol = (v: number | null | undefined) => {
    if (!v) return "$0"
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
    return `$${v.toFixed(0)}`
  }

  const formatLiq = (l: number | null | undefined) => {
    if (!l) return "$0"
    if (l >= 1_000_000) return `$${(l / 1_000_000).toFixed(1)}M`
    if (l >= 1_000) return `$${(l / 1_000).toFixed(0)}K`
    return `$${l.toFixed(0)}`
  }

  return (
    <>
      <div
        onClick={() => setDrawerOpen(true)}
        className={`
          relative flex items-center gap-2.5
          px-3 py-2
          bg-card/60 border border-border/40
          rounded-lg cursor-pointer
          transition-colors duration-150
          active:bg-card/90
          ${isWatched(token.address) ? "border-yellow-500/40" : ""}
        `}
      >
        {/* Rank */}
        <span className="text-[10px] font-mono font-bold text-muted-foreground/60 w-5 text-right tabular-nums shrink-0">
          {rank}
        </span>

        {/* Token Image */}
        <TokenImage
          src={token.imageUrl}
          symbol={token.symbol}
          size={32}
          className="flex-none"
        />

        {/* Symbol + Signal */}
        <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
          <span className="text-xs font-bold tracking-tight truncate">{token.symbol}</span>
          <div className="flex items-center gap-1">
            {showSignalState && (
              <span className={`text-[8px] font-bold uppercase tracking-wider ${sc.text}`}>
                {sc.label}
              </span>
            )}
            {isHot && (
              <span className="text-[8px] font-mono text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 tracking-wider rounded">
                HOT
              </span>
            )}
          </div>
        </div>

        {/* Price + Change */}
        <div className="flex flex-col items-end shrink-0">
          <span className="text-[11px] font-mono font-semibold tabular-nums text-foreground/90 whitespace-nowrap">
            {formatUsdPrice(token.priceUsd)}
          </span>
          <span
            className={`text-[10px] font-mono font-semibold tabular-nums flex items-center gap-0.5 whitespace-nowrap ${
              isPositive ? "text-green-400" : "text-red-400"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="h-2.5 w-2.5 shrink-0" />
            ) : (
              <TrendingDown className="h-2.5 w-2.5 shrink-0" />
            )}
            {isPositive ? "+" : ""}
            {(token.priceChange24h ?? 0).toFixed(1)}%
          </span>
        </div>

        {/* VOL / LIQ */}
        <div className="hidden min-[400px]:flex flex-col items-end w-14 shrink-0">
          <span className="text-[9px] font-mono text-muted-foreground/70 tabular-nums">
            V {formatVol(token.volume24h)}
          </span>
          <span className="text-[9px] font-mono text-muted-foreground/70 tabular-nums">
            L {formatLiq(token.liquidity)}
          </span>
        </div>

        {/* Lead Time Badge */}
        {leadTimeProof?.leadBlocks ? (
          <div className="shrink-0">
            <LeadTimeBadge
              leadBlocks={leadTimeProof.leadBlocks}
              leadSeconds={leadTimeProof.leadSeconds}
              confidence={leadTimeProof.confidence || "MEDIUM"}
            />
          </div>
        ) : null}

        {/* Score */}
        <div className="flex items-center gap-1 shrink-0">
          <div
            className={`
              px-1.5 py-0.5 rounded font-bold font-mono text-[11px] tabular-nums border
              ${
                score !== null && score >= 80
                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                  : score !== null && score >= 55
                    ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
              }
            `}
          >
            {formatSolradScore(score)}
          </div>
          {delta > 0 && (
            <span className="text-[8px] font-mono text-amber-400">{'\u25B2'}{delta.toFixed(0)}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          <WatchlistButton
            mint={token.address}
            tokenMeta={{ symbol: token.symbol, name: token.name, image: token.imageUrl }}
            size="icon"
            className="h-7 w-7 p-1.5 rounded-md bg-transparent border-0 hover:bg-muted/50"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              window.open(`https://dexscreener.com/solana/${token.address}`, "_blank")
            }}
            className="h-7 w-7 p-1.5 rounded-md hover:bg-muted/50 transition-colors flex items-center justify-center"
            aria-label="View on Dexscreener"
          >
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/60" />
          </button>
        </div>
      </div>

      <TokenDetailDrawer token={token} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  )
})

export default TokenRowMobile
