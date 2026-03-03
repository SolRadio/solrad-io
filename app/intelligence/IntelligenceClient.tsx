"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { LockedFeatureCard } from "@/components/locked-feature-card"
import { ComingSoonPill } from "@/components/coming-soon-pill"
import { Badge } from "@/components/ui/badge"
import { Brain, Shield, Droplets, Sparkles, CheckCircle2 } from "lucide-react"

export function IntelligenceClient() {
  const features = [
    {
      title: "Holder Quality Score",
      description: "Measures the quality + track record of wallets accumulating.",
      details: "Target: 85+ = Smart Wallet Concentration",
      icon: <Brain className="h-5 w-5 text-primary" />,
    },
    {
      title: "Insider Risk Score",
      description: "Detects bundled wallets, shared funding, and coordinated entries.",
      details: "Risk levels: LOW / MED / HIGH",
      icon: <Shield className="h-5 w-5 text-destructive" />,
    },
    {
      title: "Liquidity Rotation Detector",
      description: "Flags LP add/remove loops, fake liquidity, and early exit patterns.",
      details: "Signals: Stable / Rotating / Pull Risk",
      icon: <Droplets className="h-5 w-5 text-blue-500" />,
    },
    {
      title: "Smart Flow Badge",
      description: "Identifies repeated buys + multi-wallet accumulation patterns.",
      details: "Badge: SMART FLOW",
      icon: <Sparkles className="h-5 w-5 text-yellow-500" />,
    },
  ]

  const phases = [
    {
      phase: "Phase A",
      features: "Holder Quality + Smart Flow",
      status: "coming-soon",
    },
    {
      phase: "Phase B",
      features: "Insider Risk + Liquidity Rotation",
      status: "coming-soon",
    },
    {
      phase: "Phase C",
      features: "Alerts + Monetization",
      status: "coming-soon",
    },
  ]

  return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">Intelligence Hub</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Institutional-grade Solana signals — rolling out in phases.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {features.map((feature) => (
            <LockedFeatureCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
              details={feature.details}
              icon={feature.icon}
            />
          ))}
        </div>

        {/* Release Phases */}
        <Card>
          <CardHeader>
            <CardTitle>Release Phases</CardTitle>
            <CardDescription>
              SOLRAD Intelligence features are launching in controlled phases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {phases.map((phase, idx) => (
                <div
                  key={phase.phase}
                  className="flex items-center justify-between p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <div>
                      <p className="font-semibold uppercase text-sm">{phase.phase}</p>
                      <p className="text-sm text-muted-foreground">{phase.features}</p>
                    </div>
                  </div>
                  <ComingSoonPill />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
  )
}
