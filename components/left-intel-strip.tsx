"use client"

import { Zap, Brain, Droplet, Trophy } from "lucide-react"

export function LeftIntelStrip() {
  const intelItems = [
    { icon: Zap, label: "Alerts", color: "text-primary", group: 1 },
    { icon: Brain, label: "Smart Flow", color: "text-accent", group: 1 },
    { icon: Droplet, label: "Liquidity", color: "text-success", group: 2 },
    { icon: Trophy, label: "Top Performers", color: "text-warning", group: 2 },
  ]

  return (
    <aside className="hidden [@media(min-width:1280px)]:block fixed left-4 top-32 w-[72px] z-10">
      
    </aside>
  )
}
