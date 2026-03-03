"use client"

import { RefreshCw, Search, Settings2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useState } from "react"

interface MobileHeaderProps {
  lastUpdated?: number
  onRefresh?: () => void
  isRefreshing?: boolean
  solPrice?: { price: number; change24h: number; loading: boolean; error: boolean }
  onSearchOpen?: () => void
}

export function MobileHeader({ lastUpdated, onRefresh, isRefreshing, solPrice, onSearchOpen }: MobileHeaderProps) {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 border-b border-border/50">
      <div className="flex items-center justify-between h-12 px-3 safe-top">
        {/* Left: Brand + Status */}
        <div className="flex items-center gap-2">
          <img src="/brand/icon-512.png" alt="SOLRAD" className="h-6 w-auto" />
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[9px] font-mono text-green-500/80 uppercase">LIVE</span>
          </div>
        </div>

        {/* Center: SOL Price */}
        {solPrice && !solPrice.loading && !solPrice.error && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-muted/30 border border-border/30">
            <span className="text-[10px] font-mono font-bold text-muted-foreground/70">SOL</span>
            <span className="text-[11px] font-mono font-bold tabular-nums">${solPrice.price.toFixed(0)}</span>
            <span className={`text-[9px] font-mono font-bold tabular-nums ${solPrice.change24h >= 0 ? "text-green-400" : "text-red-400"}`}>
              {solPrice.change24h >= 0 ? "+" : ""}{solPrice.change24h.toFixed(1)}%
            </span>
          </div>
        )}

        {/* Right: Updated + Refresh */}
        <div className="flex items-center gap-1.5">
          {lastUpdated && (
            <span className="text-[9px] font-mono text-muted-foreground/50">
              {formatDistanceToNow(lastUpdated, { addSuffix: false })}
            </span>
          )}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-md hover:bg-muted/50 transition-colors disabled:opacity-40"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
    </header>
  )
}
