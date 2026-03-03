"use client"

import { Clock, Database, TrendingUp } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface DataFreshnessBarProps {
  /** Timestamp when data was last updated */
  updatedAt?: number | string | null
  /** Number of items in dataset */
  itemCount?: number
  /** Label for items (e.g., "tokens", "signals", "snapshots") */
  itemLabel?: string
  /** Optional additional metadata to display */
  metadata?: Array<{ label: string; value: string | number }>
  /** Compact mode for mobile - single line with essential info only */
  compact?: boolean
}

/**
 * DataFreshnessBar - Non-intrusive status line showing data age and coverage
 * Displays: update timestamp, item count, and optional metadata
 * 
 * Usage:
 * <DataFreshnessBar 
 *   updatedAt={updatedAt} 
 *   itemCount={tokens.length} 
 *   itemLabel="tokens"
 *   metadata={[{ label: "Sources", value: "3" }]}
 * />
 */
export function DataFreshnessBar({
  updatedAt,
  itemCount,
  itemLabel = "items",
  metadata,
  compact = false,
}: DataFreshnessBarProps) {
  // Format timestamp
  const formatAge = (ts: number | string | null | undefined) => {
    if (!ts) return "Unknown"
    
    try {
      const timestamp = typeof ts === "string" ? new Date(ts).getTime() : ts
      if (!timestamp || Number.isNaN(timestamp)) return "Unknown"
      
      return formatDistanceToNow(timestamp, { addSuffix: true })
    } catch {
      return "Unknown"
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground/70 font-mono">
        <Clock className="h-3 w-3 shrink-0" />
        <span>{formatAge(updatedAt)}</span>
        {typeof itemCount === "number" && (
          <>
            <span className="text-muted-foreground/40">•</span>
            <span>
              {itemCount.toLocaleString()} {itemLabel}
            </span>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground/70 font-mono flex-wrap">
      {/* Update timestamp */}
      {updatedAt && (
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 shrink-0" />
          <span>Updated {formatAge(updatedAt)}</span>
        </div>
      )}

      {/* Item count */}
      {typeof itemCount === "number" && (
        <>
          {updatedAt && <span className="text-muted-foreground/40">•</span>}
          <div className="flex items-center gap-1.5">
            <Database className="h-3 w-3 shrink-0" />
            <span>
              {itemCount.toLocaleString()} {itemLabel}
            </span>
          </div>
        </>
      )}

      {/* Additional metadata */}
      {metadata && metadata.length > 0 && (
        <>
          <span className="text-muted-foreground/40">•</span>
          {metadata.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 shrink-0" />
              <span>
                {item.label}: {typeof item.value === "number" ? item.value.toLocaleString() : item.value}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
