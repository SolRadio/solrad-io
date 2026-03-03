"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Radar,
  TrendingUp,
  Target,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Eye,
  Layers,
  LineChart,
  Twitter,
  Wallet,
  LogOut,
  Zap,
} from "lucide-react"

export function HowToFindGemsContent() {
  const frameworkSteps = [
    {
      icon: Radar,
      title: "Radar",
      description: "Monitor real-time signals",
    },
    {
      icon: Layers,
      title: "Signal Stacking",
      description: "Align multiple indicators",
    },
    {
      icon: CheckCircle2,
      title: "Validation",
      description: "Confirm with external data",
    },
    {
      icon: Target,
      title: "Entry",
      description: "Enter on pullbacks",
    },
    {
      icon: LogOut,
      title: "Exit",
      description: "Exit into strength",
    },
  ]

  const steps = [
    {
      number: "01",
      title: "Scan Fresh Signals for Early Momentum",
      description:
        "Start inside SOLRAD's Fresh Signals feed. This column surfaces tokens showing early momentum, unusual volume, and behavioral anomalies.",
      filters: [
        "Age ≤ 30 days",
        "Score ≥ 60",
        "Multiple positive signal badges",
      ],
      goal: "Identify tokens before they trend.",
      icon: Eye,
      screenshot: "/images/screenshot-202026-01-29-20175248.png",
    },
    {
      number: "02",
      title: "Stack Signals to Build Conviction",
      description:
        "High-quality setups appear when multiple intelligence signals align. Look for at least two of the following:",
      signals: [
        "Momentum Rising",
        "Smart Flow",
        "Holder Quality",
        "Liquidity Stability",
        "Early Rotation",
      ],
      conclusion: "Single signals are noise. Stacked signals create edge.",
      icon: Layers,
      screenshot: "/images/screenshot-202026-01-29-20175341.png",
    },
    {
      number: "03",
      title: "Validate Chart, Liquidity, and Buy Pressure",
      description: "Open DexScreener to confirm:",
      checks: [
        "Chart structure",
        "Liquidity health",
        "Volume expansion",
        "Buy clustering",
      ],
      note: "Look for $5k+ buys and repeated wallets — these often signal sniper and smart-money positioning.",
      icon: LineChart,
      screenshot: "/images/screenshot-202026-01-29-20175411.png",
    },
    {
      number: "04",
      title: "Confirm Market Attention on X (Twitter)",
      description:
        "Strong on-chain flow combined with rising social engagement creates sustained momentum.",
      checks: ["Recent tweets", "Engagement growth", "Organic replies"],
      conclusion: "Dead socials often mean limited continuation.",
      icon: Twitter,
      screenshot: "/images/screenshot-202026-01-29-20175441.png",
    },
    {
      number: "05",
      title: "Track Smart Wallets",
      description:
        "When you find high-quality wallets, save them. Track their re-entries, scaling behavior, and exit timing.",
      conclusion: "Smart wallet behavior often leads price action.",
      icon: Wallet,
      screenshot: "/images/screenshot-202026-01-29-20175550.png",
    },
    {
      number: "06",
      title: "Enter Pullbacks, Exit Into Strength",
      description: "Never chase green candles.",
      entry: ["Pullbacks", "Consolidation", "Break-and-retest"],
      exit: [
        "Volume spikes without continuation",
        "Large wallets sell",
        "Momentum fades",
      ],
      conclusion: "Smart money exits before tops — follow them.",
      icon: TrendingUp,
      screenshot: "/images/screenshot-202026-01-29-20175625.png",
    },
  ]

  const cheatSheet = [
    "Fresh Signals → Score 60+",
    "Stack ≥ 2 signals",
    "DexScreener validation",
    "Twitter engagement",
    "Track $5k+ wallets",
    "Enter pullbacks",
    "Exit into strength",
  ]

  return (
    <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-6 bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 bg-clip-text text-transparent animate-gradient">
              How To Find Solana Gems Using SOLRAD
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              A professional, step-by-step playbook used by on-chain traders to
              identify early opportunities, validate momentum, and exit before
              the crowd.
            </p>
            <Button
              size="lg"
              className="text-lg px-8 py-6"
              onClick={() => {
                document
                  .getElementById("framework")
                  ?.scrollIntoView({ behavior: "smooth" })
              }}
            >
              Start Scanning
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>

        {/* Section 1 — The SOLRAD Gem Framework */}
        <section
          id="framework"
          className="bg-card/50 border-y border-border py-16"
        >
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="mb-12 text-center">
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-4">
                  The SOLRAD Gem Framework
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  SOLRAD is not a gambling tool. It is a real-time intelligence
                  system designed to stack signals, analyze on-chain behavior,
                  and surface asymmetric opportunities early.
                </p>
              </div>

              {/* Framework Flow */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {frameworkSteps.map((step, idx) => {
                  const Icon = step.icon
                  return (
                    <div key={idx} className="relative">
                      <Card className="p-6 h-full border-primary/20 hover:border-primary/40 transition-colors">
                        <div className="flex flex-col items-center text-center gap-3">
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <h3 className="font-bold uppercase text-sm">
                            {step.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {step.description}
                          </p>
                        </div>
                      </Card>
                      {idx < frameworkSteps.length - 1 && (
                        <div className="hidden md:absolute md:flex md:right-0 md:top-1/2 md:-translate-y-1/2 md:translate-x-1/2 z-10">
                          <ChevronRight className="h-5 w-5 text-primary" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Section 2 — Step-By-Step Guide */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-12 text-center">
              Step-By-Step Guide
            </h2>

            <div className="space-y-12">
              {steps.map((step, idx) => {
                const Icon = step.icon
                return (
                  <Card
                    key={idx}
                    className="p-8 border-primary/20 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start gap-6">
                      {/* Step Number & Icon */}
                      <div className="flex-shrink-0">
                        <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center relative">
                          <span className="text-2xl font-black text-primary font-mono">
                            {step.number}
                          </span>
                          <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-4">
                        <h3 className="text-2xl font-bold uppercase tracking-tight">
                          {step.title}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {step.description}
                        </p>

                        {/* Filters */}
                        {step.filters && (
                          <div>
                            <p className="text-sm font-semibold text-foreground mb-2">
                              Filters:
                            </p>
                            <ul className="space-y-1">
                              {step.filters.map((filter, i) => (
                                <li
                                  key={i}
                                  className="flex items-center gap-2 text-sm text-muted-foreground"
                                >
                                  <CheckCircle2 className="h-4 w-4 text-success" />
                                  {filter}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Signals */}
                        {step.signals && (
                          <div className="flex flex-wrap gap-2">
                            {step.signals.map((signal, i) => (
                              <Badge
                                key={i}
                                className="bg-primary/10 text-primary border-primary/20"
                              >
                                {signal}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Checks */}
                        {step.checks && (
                          <ul className="space-y-1">
                            {step.checks.map((check, i) => (
                              <li
                                key={i}
                                className="flex items-center gap-2 text-sm text-muted-foreground"
                              >
                                <CheckCircle2 className="h-4 w-4 text-accent" />
                                {check}
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* Entry/Exit */}
                        {step.entry && (
                          <div>
                            <p className="text-sm font-semibold text-foreground mb-2">
                              Look for:
                            </p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {step.entry.map((item, i) => (
                                <Badge
                                  key={i}
                                  className="bg-success/10 text-success border-success/20"
                                >
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {step.exit && (
                          <div>
                            <p className="text-sm font-semibold text-foreground mb-2">
                              Exit when:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {step.exit.map((item, i) => (
                                <Badge
                                  key={i}
                                  className="bg-destructive/10 text-destructive border-destructive/20"
                                >
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Goal/Note/Conclusion */}
                        {step.goal && (
                          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                            <p className="text-sm font-semibold text-primary mb-1">
                              Goal:
                            </p>
                            <p className="text-sm text-foreground/90">
                              {step.goal}
                            </p>
                          </div>
                        )}
                        {step.note && (
                          <div className="rounded-lg bg-accent/5 border border-accent/20 p-4">
                            <p className="text-sm text-foreground/90">
                              {step.note}
                            </p>
                          </div>
                        )}
                        {step.conclusion && (
                          <div className="rounded-lg bg-muted/50 border border-border p-4">
                            <p className="text-sm font-semibold text-foreground">
                              {step.conclusion}
                            </p>
                          </div>
                        )}

                        {/* Screenshot */}
                        {step.screenshot && (
                          <div className="mt-6 rounded-xl border border-border overflow-hidden bg-black">
                            <img
                              src={step.screenshot || "/placeholder.svg"}
                              alt={`Step ${step.number}: ${step.title}`}
                              className="h-auto text-left pl-0 w-full"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Section 3 — Quick Degen Cheat Sheet */}
        <section className="bg-gradient-to-br from-primary/10 via-accent/5 to-success/10 border-y border-primary/20 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <Card className="p-8 border-primary/30 bg-card/80 backdrop-blur-sm">
                <div className="flex items-start gap-4 mb-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-2">
                      SOLRAD Sniper Flow
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Quick reference for high-conviction plays
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {cheatSheet.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
                    >
                      <span className="text-lg font-black text-primary font-mono">
                        {(idx + 1).toString().padStart(2, "0")}
                      </span>
                      <span className="text-sm font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 4 — Why SOLRAD Works */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-8 text-center">
              Why SOLRAD Works
            </h2>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="p-6 border-primary/20">
                <h3 className="font-bold uppercase text-sm mb-2 text-primary">
                  Multi-Source Data Ingestion
                </h3>
                <p className="text-sm text-muted-foreground">
                  SOLRAD aggregates signals from multiple on-chain and social
                  feeds, providing comprehensive market coverage.
                </p>
              </Card>
              <Card className="p-6 border-accent/20">
                <h3 className="font-bold uppercase text-sm mb-2 text-accent">
                  Real-Time Signal Processing
                </h3>
                <p className="text-sm text-muted-foreground">
                  Token scores and momentum indicators update continuously,
                  ensuring you see the latest intelligence.
                </p>
              </Card>
              <Card className="p-6 border-success/20">
                <h3 className="font-bold uppercase text-sm mb-2 text-success">
                  Behavioral Wallet Analysis
                </h3>
                <p className="text-sm text-muted-foreground">
                  Track wallet patterns, holder distribution, and smart money
                  flows to understand who is accumulating.
                </p>
              </Card>
              <Card className="p-6 border-purple-500/20">
                <h3 className="font-bold uppercase text-sm mb-2 text-purple-400">
                  Signal Stacking Engine
                </h3>
                <p className="text-sm text-muted-foreground">
                  SOLRAD identifies when multiple indicators align, creating
                  high-conviction entry opportunities.
                </p>
              </Card>
            </div>

            <div className="text-center">
              <p className="text-lg font-semibold text-foreground/90 mb-8">
                SOLRAD is built to surface real on-chain intelligence — not
                hype.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-card/50 border-y border-border py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight mb-4">
              Ready to find your next gem?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Start using SOLRAD's intelligence system to identify early
              opportunities with stacked signals and on-chain conviction.
            </p>
            <Button size="lg" asChild>
              <Link href="/">
                Open SOLRAD Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  )
}
