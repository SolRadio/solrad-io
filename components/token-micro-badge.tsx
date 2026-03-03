'use client';

import type { TokenScore } from "@/lib/types"
import { Shield, Gem, Zap, Beaker, CheckCircle, Clock } from "lucide-react"
import { computeActivityRatio } from "@/lib/scoring-v2"
import { useEffect, useState } from "react"
import { getHeldDurationLabelClient } from "@/lib/heldDuration"
import { IconBadge } from "./icon-badge"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"

interface TokenMicroBadgeProps {
  token: TokenScore
  context?: "dashboard" | "topPerformers"
  maxBadges?: number
}

interface BadgeData {
  key: string
  icon: typeof Shield
  label: string
  color: 'success' | 'primary' | 'yellow' | 'accent' | 'teal' | 'violet'
  title: string
}

/**
 * V5 ICON-ONLY MICRO-BADGE (COMPACT MODE)
 * Displays icon-only badges with tooltips to prevent clipping/overlap.
 * Max 3 badges + overflow indicator, horizontally arranged.
 */
export function TokenMicroBadge({ token, context, maxBadges }: TokenMicroBadgeProps) {
  const [heldLabel, setHeldLabel] = useState<"1H" | "6H" | "24H" | null>(null)
  const [heldLoading, setHeldLoading] = useState(true)
  const [overflowOpen, setOverflowOpen] = useState(false)

  // Fetch held duration on mount
  useEffect(() => {
    let mounted = true
    
    const fetchHeld = async () => {
      try {
        const label = await getHeldDurationLabelClient(token.address)
        if (mounted) {
          setHeldLabel(label)
          setHeldLoading(false)
        }
      } catch (error) {
        if (mounted) {
          setHeldLoading(false)
        }
      }
    }

    fetchHeld()

    return () => {
      mounted = false
    }
  }, [token.address])

  // Never show badges on WARNING tokens
  const tierLabel = token.totalScore >= 80 ? "TREASURE" : token.totalScore >= 55 ? "CAUTION" : "WARNING"
  if (tierLabel === "WARNING") {
    return null
  }

  // Never show badges on HIGH RISK tokens
  if (token.riskLabel === "HIGH RISK") {
    return null
  }

  // Helper to compute token age in hours
  const getTokenAgeHours = (): number | null => {
    if (token.pairCreatedAt) {
      return (Date.now() - token.pairCreatedAt) / (1000 * 60 * 60)
    }
    return null
  }

  const ageHours = getTokenAgeHours()
  const activityRatio = computeActivityRatio(token)
  const volume = Number(token.volume24h) || 0
  const liquidity = Number(token.liquidity) || 0
  const priceChange = Number(token.priceChange24h) || 0

  // Determine activity category
  const isThinActivity = (volume: number, liquidity: number): boolean => volume < 25000 || liquidity < 50000;

  // Compute signal score (use existing scoreBreakdown if available)
  const signalScore = token.scoreBreakdown?.signalScore ?? null

  const badges: BadgeData[] = []

  // 1. SAFE Badge
  if (
    token.riskLabel === "LOW RISK" &&
    liquidity >= 100000 &&
    !isThinActivity(volume, liquidity)
  ) {
    badges.push({
      key: "safe",
      icon: Shield,
      label: "SAFE",
      color: "success",
      title: "Low risk, strong liquidity, healthy activity"
    })
  }

  // 2. TREASURE Badge
  if (token.totalScore >= 80) {
    badges.push({
      key: "treasure",
      icon: Gem,
      label: "TREASURE",
      color: "primary",
      title: "SOLRAD score 80+"
    })
  }

  // 3. MOMENTUM Badge
  if (
    signalScore !== null &&
    signalScore >= 7 &&
    volume >= 500000 &&
    priceChange > 15
  ) {
    badges.push({
      key: "momentum",
      icon: Zap,
      label: "MOMENTUM",
      color: "yellow",
      title: "Strong signal, high volume, positive momentum"
    })
  }

  // 4. EARLY Badge
  if (
    ageHours !== null &&
    ageHours < 24 &&
    liquidity >= 50000 &&
    token.riskLabel !== "HIGH RISK"
  ) {
    badges.push({
      key: "early",
      icon: Beaker,
      label: "EARLY",
      color: "accent",
      title: "Less than 24h old, decent liquidity, not high risk"
    })
  }

  // 5. CONSISTENT Badge (snapshot history check - placeholder for now)
  const hasSnapshotHistory = false
  if (
    hasSnapshotHistory &&
    signalScore !== null &&
    signalScore >= 6
  ) {
    badges.push({
      key: "consistent",
      icon: CheckCircle,
      label: "CONSISTENT",
      color: "teal",
      title: "Consistently strong signal across snapshots"
    })
  }

  // 6. SMART FLOW Badge
  const hasSmartFlow = 
    volume >= 50000 &&
    liquidity >= 50000 &&
    volume > liquidity * 0.5 &&
    token.riskLabel !== "HIGH RISK" &&
    token.totalScore >= 55

  if (hasSmartFlow) {
    badges.push({
      key: "smartflow",
      icon: Zap,
      label: "SMART FLOW",
      color: "accent",
      title: "Active trading flow with solid liquidity"
    })
  }

  // Add HELD badge if available
  if (!heldLoading && heldLabel) {
    badges.push({
      key: "held",
      icon: Clock,
      label: `HELD ${heldLabel}`,
      color: "violet",
      title: `Token held score ≥80 for ${heldLabel}`
    })
  }

  if (badges.length === 0) {
    return null
  }

  // Limit to 3 visible badges + overflow indicator
  const effectiveMaxBadges = maxBadges !== undefined ? maxBadges : 3
  const displayBadges = badges.slice(0, effectiveMaxBadges)
  const overflowBadges = badges.slice(effectiveMaxBadges)
  const overflowCount = overflowBadges.length

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1.5 items-center justify-end">
        {displayBadges.map((badge) => (
          <IconBadge
            key={badge.key}
            icon={badge.icon}
            label={badge.label}
            color={badge.color}
            title={badge.title}
          />
        ))}
        
        {/* Overflow +N indicator with tooltip showing hidden badges */}
        {overflowCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-border bg-muted/50 text-muted-foreground hover:bg-muted transition-all text-[10px] font-bold"
                aria-label={`${overflowCount} more badges`}
              >
                +{overflowCount}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={4}>
              <div className="flex flex-col gap-1">
                {overflowBadges.map((badge) => (
                  <span key={badge.key} className="text-xs">{badge.label}</span>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}
