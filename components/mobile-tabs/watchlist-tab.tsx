"use client"

import { useMemo, useEffect, useState, useRef } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import type { TokenScore } from "@/lib/types"
import TokenRowMobile from "@/components/token-row-mobile"
import { Star, Trash2, TrendingUp, TrendingDown, Sparkles } from "lucide-react"
import { useWatchlist } from "@/hooks/use-watchlist"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import type { LeadTimeProof } from "@/lib/lead-time/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface WatchlistTabProps {
  allTokens?: TokenScore[]
  leadTimeProofsMap?: Map<string, LeadTimeProof>
}

export function WatchlistTab({ allTokens = [], leadTimeProofsMap = new Map() }: WatchlistTabProps) {
  const { watchlist, clearWatchlist, mounted } = useWatchlist()
  const [liveTokens, setLiveTokens] = useState<TokenScore[]>(allTokens)
  const { toast } = useToast()
  const parentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (allTokens.length > 0) {
      setLiveTokens(allTokens)
      return
    }
    const fetchTokens = async () => {
      try {
        const response = await fetch("/api/index")
        const data = await response.json()
        setLiveTokens(data.all || [])
      } catch (error) {
        console.error("Failed to fetch tokens for watchlist:", error)
      }
    }
    fetchTokens()
  }, [allTokens])

  const tokenMap = useMemo(() => {
    const map = new Map<string, TokenScore>()
    liveTokens.forEach((token) => map.set(token.address.toLowerCase(), token))
    return map
  }, [liveTokens])

  const watchedTokens = useMemo(() => {
    return watchlist
      .map((item) => {
        const liveToken = tokenMap.get(item.mint.toLowerCase())
        if (liveToken) return liveToken
        return {
          address: item.mint,
          symbol: item.symbol || "???",
          name: item.name || "Unknown Token",
          imageUrl: item.image,
          totalScore: 0,
          priceUsd: 0,
          priceChange24h: 0,
          volume24h: 0,
          liquidity: 0,
          notInRadar: true,
        } as TokenScore & { notInRadar?: boolean }
      })
      .filter(Boolean)
  }, [watchlist, tokenMap])

  const portfolioStats = useMemo(() => {
    const gainers = watchedTokens.filter((t) => (t.priceChange24h ?? 0) > 0).length
    const losers = watchedTokens.filter((t) => (t.priceChange24h ?? 0) < 0).length
    const avgChange =
      watchedTokens.length > 0
        ? watchedTokens.reduce((sum, t) => sum + (t.priceChange24h ?? 0), 0) / watchedTokens.length
        : 0
    return { gainers, losers, avgChange }
  }, [watchedTokens])

  const virtualizer = useVirtualizer({
    count: watchedTokens.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 5,
  })

  const handleClearWatchlist = () => {
    clearWatchlist()
    toast({ title: "Watchlist cleared", description: "All tokens removed" })
  }

  if (!mounted) return null

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-3 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-400" />
          <h1 className="text-sm font-mono font-bold uppercase tracking-wider">Watchlist</h1>
          <span className="text-[10px] font-mono text-muted-foreground/40 tabular-nums">{watchlist.length}</span>
        </div>
        {watchlist.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md bg-transparent hover:bg-red-500/10"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-400/60" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-background border-border/50">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-sm font-mono">Clear watchlist?</AlertDialogTitle>
                <AlertDialogDescription className="text-xs font-mono">
                  Remove all {watchlist.length} tokens. Cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="text-xs font-mono bg-muted/30 border-border/30">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearWatchlist}
                  className="text-xs font-mono bg-red-500 hover:bg-red-600 text-foreground"
                >
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Portfolio Stats Strip */}
      {watchlist.length > 0 && (
        <div className="flex items-center gap-3 px-3 py-2 border-b border-border/20 bg-muted/5">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3 text-green-400" />
            <span className="text-[10px] font-mono font-bold text-green-400 tabular-nums">{portfolioStats.gainers}</span>
            <span className="text-[9px] font-mono text-muted-foreground/40">up</span>
          </div>
          <div className="w-px h-3 bg-border/30" />
          <div className="flex items-center gap-1.5">
            <TrendingDown className="h-3 w-3 text-red-400" />
            <span className="text-[10px] font-mono font-bold text-red-400 tabular-nums">{portfolioStats.losers}</span>
            <span className="text-[9px] font-mono text-muted-foreground/40">dn</span>
          </div>
          <div className="w-px h-3 bg-border/30" />
          <div className="flex items-center gap-1.5">
            <Sparkles className={`h-3 w-3 ${portfolioStats.avgChange >= 0 ? "text-cyan-400" : "text-orange-400"}`} />
            <span
              className={`text-[10px] font-mono font-bold tabular-nums ${
                portfolioStats.avgChange >= 0 ? "text-cyan-400" : "text-orange-400"
              }`}
            >
              {portfolioStats.avgChange >= 0 ? "+" : ""}
              {portfolioStats.avgChange.toFixed(1)}%
            </span>
            <span className="text-[9px] font-mono text-muted-foreground/40">avg</span>
          </div>
        </div>
      )}

      {/* Watchlist Content */}
      <div ref={parentRef} className="flex-1 overflow-y-auto overscroll-contain">
        {watchlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/30">
            <Star className="h-8 w-8 mb-3 opacity-30" />
            <p className="text-xs font-mono font-bold">No tokens watched</p>
            <p className="text-[10px] font-mono text-muted-foreground/20 mt-1">
              Star tokens from Radar to track them here
            </p>
          </div>
        ) : (
          <div style={{ height: `${virtualizer.getTotalSize()}px`, width: "100%", position: "relative" }}>
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const token = watchedTokens[virtualItem.index]
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
    </div>
  )
}
