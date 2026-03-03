/**
 * Lead-Time Badge Component
 * 
 * Displays "🕒 +{blocks}b" badge on token cards when lead-time exists
 * Shows how many blocks SOLRAD observed activity before market reaction
 */

"use client"

import { Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface LeadTimeBadgeProps {
  leadBlocks?: number
  leadSeconds?: number
  confidence: "LOW" | "MEDIUM" | "HIGH"
  className?: string
}

export function LeadTimeBadge({
  leadBlocks,
  leadSeconds,
  confidence,
  className = "",
}: LeadTimeBadgeProps) {
  // Render guard: require a positive leadSeconds or leadBlocks value
  // Also guards against string "0" from API, NaN, and negatives
  const numBlocks = Number(leadBlocks)
  const numSeconds = Number(leadSeconds)
  if ((!numBlocks || numBlocks <= 0) && (!numSeconds || numSeconds <= 0)) {
    return null
  }

  const confidenceColors = {
    LOW: "bg-muted/50 text-muted-foreground border-muted-foreground/30",
    MEDIUM: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    HIGH: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  }

  // Display logic: prioritize leadBlocks if available, otherwise use leadSeconds
  let displayText: string

  if (numBlocks > 0) {
    displayText = `+${numBlocks}b`
  } else if (numSeconds > 0) {
    const minutes = Math.round(numSeconds / 60)
    displayText = `+${minutes}m`
  } else {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`text-xs font-medium shrink-0 whitespace-nowrap px-1.5 py-0.5 cursor-help ${confidenceColors[confidence]} ${className}`}
          >
            {displayText}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            Observed on-chain behavior before market reaction. Not a prediction.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
