"use client"

import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { useMemo } from "react"

export type SparklineMomentum = "up" | "down" | "flat"

interface TokenSparklineProps {
  values: number[]
  height?: number
  width?: number
  color?: string
  showMomentum?: boolean
  label?: string
}

export function TokenSparkline({
  values,
  height = 22,
  width = 90,
  color = "#22c55e",
  showMomentum = false,
  label,
}: TokenSparklineProps) {
  const { path, momentum } = useMemo(() => {
    if (!values || values.length === 0) {
      return { path: "", momentum: "flat" as SparklineMomentum }
    }

    // Filter out invalid values
    const validValues = values.filter((v) => typeof v === "number" && !isNaN(v) && isFinite(v))
    
    if (validValues.length === 0) {
      return { path: "", momentum: "flat" as SparklineMomentum }
    }

    // Find min and max for normalization
    const min = Math.min(...validValues)
    const max = Math.max(...validValues)
    const range = max - min

    // If all values are the same, draw a flat line
    if (range === 0) {
      const y = height / 2
      const pathString = `M 0 ${y} L ${width} ${y}`
      return { path: pathString, momentum: "flat" as SparklineMomentum }
    }

    // Normalize values to fit in height (with small padding)
    const padding = height * 0.1
    const points = validValues.map((value, index) => {
      const x = (index / (validValues.length - 1)) * width
      const normalizedY = ((value - min) / range) * (height - 2 * padding) + padding
      const y = height - normalizedY // Invert Y axis
      return { x, y }
    })

    // Create SVG path
    const pathString = points
      .map((point, index) => {
        if (index === 0) {
          return `M ${point.x} ${point.y}`
        }
        return `L ${point.x} ${point.y}`
      })
      .join(" ")

    // Calculate momentum
    let momentumDirection: SparklineMomentum = "flat"
    
    if (validValues.length >= 3) {
      // Compare last 3 values vs previous 3 values (or first half vs second half if fewer points)
      const halfPoint = Math.floor(validValues.length / 2)
      const recentValues = validValues.slice(-Math.min(3, validValues.length))
      const olderValues = validValues.slice(Math.max(0, halfPoint - 3), halfPoint)
      
      if (olderValues.length > 0) {
        const recentAvg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length
        const olderAvg = olderValues.reduce((a, b) => a + b, 0) / olderValues.length
        
        const percentChange = ((recentAvg - olderAvg) / olderAvg) * 100
        
        if (percentChange > 5) {
          momentumDirection = "up"
        } else if (percentChange < -5) {
          momentumDirection = "down"
        }
      }
    } else if (validValues.length === 2) {
      // Simple comparison for 2 values
      const change = ((validValues[1] - validValues[0]) / validValues[0]) * 100
      if (change > 5) momentumDirection = "up"
      else if (change < -5) momentumDirection = "down"
    }

    return { path: pathString, momentum: momentumDirection }
  }, [values, height, width])

  if (!path) {
    return (
      <div className="flex items-center justify-center text-muted-foreground/40 text-xs">
        No history
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wide font-medium shrink-0">
          {label}
        </span>
      )}
      <svg
        width={width}
        height={height}
        className="shrink-0"
        style={{ overflow: "visible" }}
      >
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />
      </svg>
      {showMomentum && (
        <div className="shrink-0">
          {momentum === "up" && (
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 border border-green-500/30">
              <TrendingUp className="w-3 h-3 text-green-500" />
            </div>
          )}
          {momentum === "down" && (
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 border border-red-500/30">
              <TrendingDown className="w-3 h-3 text-red-500" />
            </div>
          )}
          {momentum === "flat" && (
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-muted/15 border border-muted/30">
              <Minus className="w-3 h-3 text-muted-foreground" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
