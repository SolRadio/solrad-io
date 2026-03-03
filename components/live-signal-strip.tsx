"use client"

import { Activity, Droplets, Zap, Wallet, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function LiveSignalStrip() {
  return (
    <div className="hidden md:flex items-center gap-3 mb-4 overflow-x-auto pb-2 scrollbar-hide">
      {/* Volume Surges - Coming Soon */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border/50 bg-card/30 min-w-[160px] shrink-0">
        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
          <Activity className="h-4 w-4 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase leading-tight">Volume Surges</span>
          <Badge variant="secondary" className="text-[9px] w-fit mt-0.5">SOON</Badge>
        </div>
      </div>

      {/* Liquidity Rotation - Coming Soon */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border/50 bg-card/30 min-w-[180px] shrink-0">
        <div className="w-8 h-8 rounded-md bg-cyan-500/10 flex items-center justify-center">
          <Droplets className="h-4 w-4 text-cyan-500" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase leading-tight">Liquidity Rotation</span>
          <Badge variant="secondary" className="text-[9px] w-fit mt-0.5">SOON</Badge>
        </div>
      </div>

      {/* Smart Flow - Coming Soon */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border/50 bg-card/30 min-w-[140px] shrink-0">
        <div className="w-8 h-8 rounded-md bg-accent/10 flex items-center justify-center">
          <Zap className="h-4 w-4 text-accent" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase leading-tight">Smart Flow</span>
          <Badge variant="secondary" className="text-[9px] w-fit mt-0.5">SOON</Badge>
        </div>
      </div>

      {/* Treasury Activity - Coming Soon */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border/50 bg-card/30 min-w-[170px] shrink-0">
        <div className="w-8 h-8 rounded-md bg-green-500/10 flex items-center justify-center">
          <Wallet className="h-4 w-4 text-green-500" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase leading-tight">Treasury Activity</span>
          <Badge variant="secondary" className="text-[9px] w-fit mt-0.5">SOON</Badge>
        </div>
      </div>

      {/* New Tokens - Coming Soon */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border/50 bg-card/30 min-w-[150px] shrink-0">
        <div className="w-8 h-8 rounded-md bg-purple-500/10 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-purple-500" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase leading-tight">New Token Alerts</span>
          <Badge variant="secondary" className="text-[9px] w-fit mt-0.5">SOON</Badge>
        </div>
      </div>
    </div>
  )
}
