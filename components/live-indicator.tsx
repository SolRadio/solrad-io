"use client"

import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"

interface LiveIndicatorProps {
  lastUpdatedAt: number | null
  isRefreshing: boolean
  onRefresh: () => void
  /** Override the "LIVE" label */
  label?: string
}

function formatAgo(ms: number): string {
  const sec = Math.round(ms / 1000)
  if (sec < 5) return "just now"
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  return `${Math.floor(min / 60)}h ago`
}

export function LiveIndicator({
  lastUpdatedAt,
  isRefreshing,
  onRefresh,
  label = "LIVE",
}: LiveIndicatorProps) {
  // Re-render every 5s to keep the "ago" text fresh
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5000)
    return () => clearInterval(id)
  }, [])

  const ago = lastUpdatedAt ? formatAgo(Date.now() - lastUpdatedAt) : null

  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      {/* Pulsing dot + LIVE label */}
      <span className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="font-semibold text-emerald-400 uppercase tracking-wider text-[10px]">
          {label}
        </span>
      </span>

      {/* Updated ago text */}
      {ago && (
        <span className="text-muted-foreground/60 text-[10px]">
          Updated {ago}
        </span>
      )}

      {/* Refresh button */}
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="inline-flex items-center justify-center h-5 w-5 rounded hover:bg-muted/40 transition-colors disabled:opacity-50"
        aria-label="Refresh now"
      >
        <RefreshCw
          className={`h-3 w-3 text-muted-foreground/60 ${isRefreshing ? "animate-spin" : ""}`}
        />
      </button>
    </div>
  )
}
