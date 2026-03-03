"use client"

import React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Droplets, Lock, Sparkles, Zap, ArrowRight } from "lucide-react"
import Image from "next/image"

/**
 * Pro Token Card Preview Component
 * 
 * This is a STANDALONE preview component for the Pro page only.
 * It does NOT affect live token cards or dashboard components.
 * All values are static examples for demonstration purposes.
 */
export function ProTokenCardPreview() {
  return (
    <div className="w-full max-w-md mx-auto">
      <Card 
        className="p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)] bg-gradient-to-b from-card/95 to-card border-primary/30 relative"
      >
        {/* ZONE A: HEADER - Token Identity + Pro Badge */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="rounded-none shrink-0 ring-2 ring-primary/40">
              <Image
                src="/placeholder.svg"
                alt="Example Token"
                width={48}
                height={48}
                className="rounded-lg w-12 h-12"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg tracking-tight truncate">EXAMPLE</h3>
              <p className="text-sm text-muted-foreground truncate">Example Token</p>
            </div>
          </div>

          {/* Pro Badge */}
          <Badge className="bg-primary/20 text-primary border-primary/40 text-xs font-bold gap-1.5 px-2.5 py-1 shrink-0">
            <Lock className="h-3 w-3" />
            PRO
          </Badge>
        </div>

        {/* ZONE B: CORE SNAPSHOT - Score, Price, Signal Transition */}
        <div className="mb-6 pb-6 border-b border-border/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-primary/15 text-primary border-primary/30 font-mono font-bold text-2xl px-4 py-1.5">
                82.4
              </Badge>
              <div className="text-sm">
                <div className="text-muted-foreground/70 uppercase text-xs tracking-wide mb-0.5">Score</div>
                <div className="font-semibold">High Strength</div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-mono text-lg font-semibold tracking-tight">$0.042</div>
              <div className="flex items-center gap-1 text-sm font-semibold text-green-400">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>+24.3%</span>
              </div>
            </div>
          </div>

          {/* Signal State Transition */}
          <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-muted/30">
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-500/15 text-purple-400 border border-purple-500/40 text-xs font-bold uppercase tracking-wide">
              <Sparkles className="h-3 w-3" />
              <span>Early</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-500/15 text-green-400 border border-green-500/40 text-xs font-bold uppercase tracking-wide">
              <TrendingUp className="h-3 w-3" />
              <span>Strong</span>
            </div>
          </div>
        </div>

        {/* ZONE C: PRO SIGNALS SECTION */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Pro Signals
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 text-sm">
              <div className="shrink-0 w-6 h-6 rounded-md bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5 text-green-400" />
              </div>
              <span className="text-muted-foreground">Score momentum rising</span>
            </div>
            
            <div className="flex items-center gap-2.5 text-sm">
              <div className="shrink-0 w-6 h-6 rounded-md bg-yellow-500/10 flex items-center justify-center">
                <Zap className="h-3.5 w-3.5 text-yellow-400" />
              </div>
              <span className="text-muted-foreground">Liquidity inflection detected</span>
            </div>
            
            <div className="flex items-center gap-2.5 text-sm">
              <div className="shrink-0 w-6 h-6 rounded-md bg-purple-500/10 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              </div>
              <span className="text-muted-foreground">Smart wallet flow spike</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
