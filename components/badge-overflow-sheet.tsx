"use client"

import React from "react"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Shield, Gem, Zap, Beaker, Clock, Info } from "lucide-react"

interface BadgeInfo {
  key: string
  label: string
  icon: React.ReactNode
  description: string
  color: string
}

interface BadgeOverflowSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  badges: BadgeInfo[]
}

export function BadgeOverflowSheet({ open, onOpenChange, badges }: BadgeOverflowSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left uppercase font-bold">All Badges</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          {badges.map((badge) => (
            <div
              key={badge.key}
              className={`flex items-start gap-3 p-3 rounded-lg border ${badge.color}`}
            >
              <div className="shrink-0 mt-0.5">{badge.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold uppercase text-sm mb-1">{badge.label}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Helper to generate badge info for the overflow sheet
export function getBadgeInfo(badgeKey: string): BadgeInfo | null {
  const badgeMap: Record<string, BadgeInfo> = {
    safe: {
      key: "safe",
      label: "SAFE",
      icon: <Shield className="h-4 w-4 text-green-400" />,
      description: "Low risk, strong liquidity, healthy activity",
      color: "bg-green-500/5 border-green-500/20",
    },
    treasure: {
      key: "treasure",
      label: "💎 TREASURE",
      icon: <Gem className="h-4 w-4 text-purple-400" />,
      description: "SOLRAD score 80+",
      color: "bg-purple-500/5 border-purple-500/20",
    },
    momentum: {
      key: "momentum",
      label: "MOMENTUM",
      icon: <Zap className="h-4 w-4 text-yellow-400" />,
      description: "Strong signal, high volume, positive momentum",
      color: "bg-yellow-500/5 border-yellow-500/20",
    },
    early: {
      key: "early",
      label: "EARLY",
      icon: <Beaker className="h-4 w-4 text-cyan-400" />,
      description: "Less than 24h old, decent liquidity, not high risk",
      color: "bg-cyan-500/5 border-cyan-500/20",
    },
    held: {
      key: "held",
      label: "HELD",
      icon: <Clock className="h-4 w-4 text-primary" />,
      description: "Token held score ≥80 across snapshots",
      color: "bg-primary/5 border-primary/20",
    },
    smartflow: {
      key: "smartflow",
      label: "SMART FLOW",
      icon: <Zap className="h-4 w-4 text-blue-400" />,
      description: "Active trading flow with solid liquidity and moderate risk",
      color: "bg-blue-500/5 border-blue-500/20",
    },
  }

  return badgeMap[badgeKey] || null
}
