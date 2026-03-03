"use client"

import { useRef, useEffect, useState } from "react"
import { createChart, ColorType, AreaSeries } from "lightweight-charts"
import type { IChartApi, UTCTimestamp } from "lightweight-charts"

interface ChartSnapshot {
  ts: number
  price: number
}

interface TokenChartProps {
  symbol: string
  mint: string
  snapshots: ChartSnapshot[]
  loading: boolean
}

function ChartFallback({ symbol, message }: { symbol: string; message: string }) {
  return (
    <div className="mb-4 rounded-lg border border-[#2a2a2a] overflow-hidden" style={{ backgroundColor: "#1a1a1a" }}>
      <div className="px-3 pt-3 pb-2">
        <span className="text-[10px] font-mono font-semibold uppercase tracking-wider" style={{ color: "#737373" }}>
          {symbol} PRICE
        </span>
      </div>
      <div className="h-[200px] flex items-center justify-center">
        <span className="text-xs font-mono" style={{ color: "#525252" }}>
          {message}
        </span>
      </div>
    </div>
  )
}

export function TokenChart({ symbol, mint, snapshots, loading }: TokenChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const [hasError, setHasError] = useState(false)
  const [localSnapshots, setLocalSnapshots] = useState<ChartSnapshot[]>([])
  const [localLoading, setLocalLoading] = useState(false)

  // Use prop snapshots if available, otherwise use locally fetched ones
  const effectiveSnapshots = snapshots && snapshots.length > 0 ? snapshots : localSnapshots
  const effectiveLoading = loading || localLoading

  // Fallback: fetch directly if prop snapshots are empty and we have a mint
  useEffect(() => {
    if (snapshots && snapshots.length > 0) return // prop data is fine
    if (!mint) return
    if (localSnapshots.length > 0) return // already fetched

    setLocalLoading(true)
    fetch(`/api/token-history?mint=${mint}&limit=80&window=24h`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        const history: ChartSnapshot[] = data.snapshots || data.history || []
        console.log("[v0] TokenChart direct fetch result:", { mint, count: history.length, sample: history[0] })
        setLocalSnapshots(history)
      })
      .catch((err) => {
        console.error("[v0] TokenChart direct fetch failed:", err)
      })
      .finally(() => setLocalLoading(false))
  }, [mint, snapshots, localSnapshots.length])

  // Render chart when data is available
  useEffect(() => {
    if (!containerRef.current || effectiveLoading) return
    if (!effectiveSnapshots || !Array.isArray(effectiveSnapshots) || effectiveSnapshots.length === 0) {
      return
    }

    // Clear previous chart
    if (chartRef.current) {
      try { chartRef.current.remove() } catch (_) { /* ignore */ }
      chartRef.current = null
    }

    try {
      const chart = createChart(containerRef.current, {
        height: 200,
        layout: {
          background: { type: ColorType.Solid, color: "#0a0a0a" },
          textColor: "#737373",
          fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
          fontSize: 10,
        },
        grid: {
          vertLines: { color: "#1a1a1a" },
          horzLines: { color: "#1a1a1a" },
        },
        crosshair: {
          vertLine: { color: "#404040", width: 1, style: 2 },
          horzLine: { color: "#404040", width: 1, style: 2 },
        },
        rightPriceScale: {
          borderColor: "#2a2a2a",
          scaleMargins: { top: 0.1, bottom: 0.05 },
        },
        timeScale: {
          borderColor: "#2a2a2a",
          timeVisible: true,
          secondsVisible: false,
        },
        handleScale: false,
        handleScroll: false,
      })

      chartRef.current = chart

      const firstPrice = effectiveSnapshots[0]?.price ?? 0
      const areaSeries = chart.addSeries(AreaSeries, {
        lineColor: "#a855f7",
        topColor: "rgba(168, 85, 247, 0.3)",
        bottomColor: "rgba(168, 85, 247, 0.0)",
        lineWidth: 2,
        priceFormat: {
          type: "price",
          precision: firstPrice < 0.01 ? 8 : firstPrice < 1 ? 6 : 4,
          minMove: firstPrice < 0.01 ? 0.00000001 : firstPrice < 1 ? 0.000001 : 0.0001,
        },
      })

      // Map snapshots to lightweight-charts format
      const sorted = [...effectiveSnapshots]
        .filter((s) => s && typeof s.ts === "number" && typeof s.price === "number" && s.price > 0)
        .sort((a, b) => a.ts - b.ts)

      // Normalize timestamps: if ts looks like ms (>1e12), convert to seconds
      const deduped: { time: UTCTimestamp; value: number }[] = []
      let lastTime = -1
      for (const snap of sorted) {
        const time = snap.ts > 1e12 ? Math.floor(snap.ts / 1000) : Math.floor(snap.ts)
        if (time > lastTime) {
          deduped.push({ time: time as UTCTimestamp, value: snap.price })
          lastTime = time
        }
      }

      console.log("[v0] TokenChart rendering:", { symbol, rawCount: effectiveSnapshots.length, dedupedCount: deduped.length, firstPoint: deduped[0], lastPoint: deduped[deduped.length - 1] })

      if (deduped.length >= 2) {
        areaSeries.setData(deduped)
        chart.timeScale().fitContent()
      } else {
        // Not enough points to draw
        chart.remove()
        chartRef.current = null
        return
      }

      // Resize observer
      const el = containerRef.current
      const resizeObserver = new ResizeObserver((entries) => {
        if (entries[0] && chartRef.current) {
          const { width } = entries[0].contentRect
          chart.applyOptions({ width })
        }
      })
      resizeObserver.observe(el)

      return () => {
        resizeObserver.disconnect()
        try { chart.remove() } catch (_) { /* ignore */ }
        chartRef.current = null
      }
    } catch (err) {
      console.error("[v0] TokenChart init failed:", err)
      setHasError(true)
      return
    }
  }, [effectiveSnapshots, effectiveLoading, symbol])

  if (hasError) {
    return <ChartFallback symbol={symbol} message="Chart unavailable" />
  }

  if (effectiveLoading) {
    return (
      <div className="mb-4 rounded-lg border border-[#2a2a2a] overflow-hidden" style={{ backgroundColor: "#1a1a1a" }}>
        <div className="px-3 pt-3 pb-2">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider" style={{ color: "#737373" }}>
            {symbol} PRICE
          </span>
        </div>
        <div className="h-[200px] flex items-center justify-center">
          <span className="text-xs font-mono animate-pulse" style={{ color: "#525252" }}>
            LOADING CHART...
          </span>
        </div>
      </div>
    )
  }

  if (!effectiveSnapshots || effectiveSnapshots.length < 2) {
    return <ChartFallback symbol={symbol} message="Not enough data for chart" />
  }

  return (
    <div className="mb-4 rounded-lg border border-[#2a2a2a] overflow-hidden" style={{ backgroundColor: "#1a1a1a" }}>
      <div className="px-3 pt-3 pb-1">
        <span className="text-[10px] font-mono font-semibold uppercase tracking-wider" style={{ color: "#737373" }}>
          {symbol} PRICE
        </span>
      </div>
      <div ref={containerRef} className="w-full" />
    </div>
  )
}
