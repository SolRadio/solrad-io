"use client"

import { TrendingUp, Activity, Flame } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function LiveIntelPanel() {
  return (
    <div className="hidden lg:block space-y-4">
      <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
        Live Intel
      </div>

      {/* Market Movers */}
      <Card className="p-4 bg-card/60 border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-green-500" />
          <h3 className="text-xs font-bold uppercase">Market Movers</h3>
        </div>
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Top Gainer</span>
            <Badge variant="secondary" className="text-[9px]">SOON</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Trending Now</span>
            <Badge variant="secondary" className="text-[9px]">SOON</Badge>
          </div>
        </div>
      </Card>

      {/* Volume Leaders */}
      <Card className="p-4 bg-card/60 border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold uppercase">Volume Leaders</h3>
        </div>
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>24h Volume</span>
            <Badge variant="secondary" className="text-[9px]">SOON</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Rising Fast</span>
            <Badge variant="secondary" className="text-[9px]">SOON</Badge>
          </div>
        </div>
      </Card>

      {/* Hot Signals */}
      
    </div>
  )
}
