"use client"

import { AlertTriangle, TrendingUp, Sparkles } from "lucide-react"
import type { SignalState } from "@/lib/signal-state"

interface SignalStateBadgeProps {
  state: SignalState
  compact?: boolean
  showLabel?: boolean
  className?: string
}

const stateConfig: Record<SignalState, {
  label: string
  icon: typeof AlertTriangle
  bgClass: string
  textClass: string
  glowClass: string
  borderClass: string
}> = {
  EARLY: {
    label: "Early",
    icon: Sparkles,
    bgClass: "bg-purple-500/15",
    textClass: "text-purple-400",
    glowClass: "shadow-[0_0_8px_rgba(168,85,247,0.3)]",
    borderClass: "border-purple-500/40",
  },
  CAUTION: {
    label: "Caution",
    icon: AlertTriangle,
    bgClass: "bg-yellow-500/15",
    textClass: "text-yellow-400",
    glowClass: "shadow-[0_0_8px_rgba(234,179,8,0.3)]",
    borderClass: "border-yellow-500/40",
  },
  STRONG: {
    label: "Strong",
    icon: TrendingUp,
    bgClass: "bg-green-500/15",
    textClass: "text-green-400",
    glowClass: "shadow-[0_0_8px_rgba(34,197,94,0.3)]",
    borderClass: "border-green-500/40",
  },
}

export function SignalStateBadge({ state, compact = false, showLabel = true, className = "" }: SignalStateBadgeProps) {
  const config = stateConfig[state]
  const Icon = config.icon

  if (compact) {
    return (
      <div
        className={`
          inline-flex items-center justify-center
          w-6 h-6 rounded-lg
          ${config.bgClass} ${config.textClass} ${config.glowClass}
          border ${config.borderClass}
          transition-all duration-300
          ${className}
        `}
        title={config.label}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
    )
  }

  return (
    <div
      className={`
        inline-flex items-center gap-1.5
        px-2 py-1 rounded-lg
        ${config.bgClass} ${config.textClass} ${config.glowClass}
        border ${config.borderClass}
        text-[10px] font-bold uppercase tracking-wide
        transition-all duration-300
        ${className}
      `}
    >
      <Icon className="h-3 w-3" />
      {showLabel && <span>{config.label}</span>}
    </div>
  )
}
