"use client"

import React, { useEffect, useState, useRef, useCallback } from "react"
import type { TokenScore } from "@/lib/types"

interface WinnerTickerProps {
  onTokenClick?: (token: TokenScore) => void
}

interface WinnerToken {
  address: string
  symbol: string
  name: string
  image: string
  score: number
  change: number
  token: TokenScore
}

export function WinnerTicker({ onTokenClick }: WinnerTickerProps) {
  const [winners, setWinners] = useState<WinnerToken[]>([])
  const [loaded, setLoaded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isHovering = useRef(false)

  const fetchWinners = useCallback(async () => {
    try {
      const res = await fetch("/api/tokens", { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      const tokens: TokenScore[] = Array.isArray(data.tokens) ? data.tokens : []

      const filtered = tokens
        .filter((t) => {
          const score = t.totalScore ?? 0
          const change = t.priceChange24h ?? 0
          const signal = t.signalState ?? ""
          return score >= 60 && change > 0 && signal !== "CAUTION"
        })
        .sort((a, b) => {
          const changeA = a.priceChange24h ?? 0
          const changeB = b.priceChange24h ?? 0
          return changeB - changeA
        })
        .slice(0, 20)
        .map((t) => ({
          address: t.address,
          symbol: t.symbol,
          name: t.name,
          image: t.imageUrl ?? "",
          score: t.totalScore ?? 0,
          change: t.priceChange24h ?? 0,
          token: t,
        }))

      setWinners(filtered)
    } catch {
      // silent
    } finally {
      setLoaded(true)
    }
  }, [])

  // Fetch on mount + every 60s
  useEffect(() => {
    fetchWinners()
    const iv = setInterval(fetchWinners, 60_000)
    return () => clearInterval(iv)
  }, [fetchWinners])

  // Auto-scroll logic: nudge scrollLeft by 1px every 20ms
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    intervalRef.current = setInterval(() => {
      if (isHovering.current) return
      if (!el) return

      el.scrollLeft += 1

      // Reset to 0 when reaching end
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 1) {
        el.scrollLeft = 0
      }
    }, 20)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [winners])

  const handleMouseEnter = () => {
    isHovering.current = true
  }
  const handleMouseLeave = () => {
    isHovering.current = false
  }

  if (!loaded) {
    return <div className="w-full h-12 bg-zinc-950 border-b border-zinc-800" />
  }

  // Empty state
  if (winners.length < 3) {
    return (
      <div className="w-full h-12 bg-zinc-950 border-b border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-center w-full h-full gap-2">
          <span className="text-[10px] font-mono text-zinc-600 tracking-widest">
            {"◈ SCANNING FOR WINNERS..."}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-12 bg-zinc-950 border-b border-zinc-800 overflow-hidden flex">
      {/* Fixed left label */}
      <div className="flex-none flex items-center gap-2 px-3 h-full bg-zinc-950 border-r border-zinc-800 z-10">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[9px] font-mono text-zinc-500 tracking-[0.2em] whitespace-nowrap">
          LIVE WINNERS
        </span>
      </div>

      {/* Scrolling cards */}
      <div
        ref={scrollRef}
        className="flex-1 flex items-center overflow-x-hidden"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-center h-full">
          {winners.map((w) => {
            const scoreClass =
              w.score >= 80
                ? "bg-green-500/20 text-green-400"
                : w.score >= 65
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-zinc-800 text-zinc-400"

            return (
              <div
                key={w.address}
                onClick={() => onTokenClick?.(w.token)}
                className="flex-none flex items-center gap-2.5 px-4 h-full border-r border-zinc-800/60 hover:bg-zinc-900/60 cursor-pointer transition-colors"
              >
                {/* Token image */}
                {w.image ? (
                  <img
                    src={w.image}
                    alt={w.symbol}
                    className="w-6 h-6 rounded-full flex-none"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full flex-none bg-zinc-800" />
                )}

                {/* Symbol */}
                <span className="font-mono font-bold text-white text-xs tracking-wide">
                  ${w.symbol}
                </span>

                {/* SOLRAD score pill */}
                <span
                  className={`font-mono text-[10px] px-1.5 py-0.5 font-bold ${scoreClass}`}
                >
                  {w.score.toFixed(1)}
                </span>

                {/* % gain */}
                <span className="font-mono text-xs font-bold text-green-400">
                  +{w.change.toFixed(1)}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
