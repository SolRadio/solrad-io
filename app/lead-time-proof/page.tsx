/**
 * Lead-Time Proof Explanation Page
 * 
 * Explains the Lead-Time Proof Engine and shows recent proofs
 */

import type { Metadata } from "next"
import { Clock, Eye, Users, Droplets, TrendingUp, Shield, Lock, Zap } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"
import { Button } from "@/components/ui/button"


export const metadata: Metadata = {
  title: "Lead-Time Proof Engine | SOLRAD",
  description:
    "Measure how many Solana blocks SOLRAD observed on-chain activity before market reaction. Trust-first observational intelligence.",
  alternates: { canonical: "https://www.solrad.io/lead-time-proof" },
  openGraph: {
    title: "Lead-Time Proof Engine | SOLRAD",
    description:
      "Measure how many Solana blocks SOLRAD observed on-chain activity before market reaction.",
    url: "https://www.solrad.io/lead-time-proof",
    type: "website",
    images: [{ url: "/brand/og-1200x630.png", width: 1200, height: 630, alt: "SOLRAD Lead-Time Proof Engine" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lead-Time Proof Engine | SOLRAD",
    description: "Measure how many Solana blocks SOLRAD observed on-chain activity before market reaction.",
    images: ["/brand/twitter-1200x630.png"],
  },
}

export default async function LeadTimeProofPage() {
  return (
    <div className="container max-w-6xl mx-auto px-3 md:px-4 py-6 md:py-8">
      {/* Hero Section */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-2 md:gap-3 mb-3">
          <Clock className="h-6 w-6 md:h-8 md:w-8 text-primary shrink-0" />
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight">Lead-Time Proof Engine</h1>
        </div>
        <p className="text-base md:text-lg text-muted-foreground max-w-3xl">
          Measure how many Solana blocks SOLRAD observed on-chain activity{" "}
          <strong>before</strong> market reaction occurred. Trust-first observational intelligence.
        </p>
      </div>

      {/* Trust-First Notice */}
      <Alert className="mb-6 bg-card border-primary/30">
        <Shield className="h-4 w-4" />
        <AlertTitle>Trust-First Architecture</AlertTitle>
        <AlertDescription>
          Lead-time proofs are <strong>observational only</strong>. They show what SOLRAD detected
          on-chain, not predictions or guarantees. All observations are recorded after they occur.
        </AlertDescription>
      </Alert>

      {/* How It Works */}
      <div className="mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Observation Events */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold">Observation Events</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              SOLRAD monitors on-chain activity patterns that may precede market moves:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Users className="h-4 w-4 text-blue-400 mt-0.5" />
                <div>
                  <strong>Accumulation Spikes</strong>
                  <p className="text-muted-foreground">
                    Rapid increases in holder count or transaction frequency
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Users className="h-4 w-4 text-blue-400 mt-0.5" />
                <div>
                  <strong>Wallet Clustering</strong>
                  <p className="text-muted-foreground">
                    Multiple wallets from same source accumulating tokens
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Droplets className="h-4 w-4 text-blue-400 mt-0.5" />
                <div>
                  <strong>Liquidity Probes</strong>
                  <p className="text-muted-foreground">
                    Small liquidity additions testing pool depth
                  </p>
                </div>
              </li>
            </ul>
          </Card>

          {/* Reaction Events */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <h3 className="text-lg font-semibold">Reaction Events</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Market reactions that occur after observation events:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-green-400 mt-0.5" />
                <div>
                  <strong>Volume Expansion</strong>
                  <p className="text-muted-foreground">
                    Significant increase in 24h trading volume (2x+ or $500k+)
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Droplets className="h-4 w-4 text-green-400 mt-0.5" />
                <div>
                  <strong>Liquidity Expansion</strong>
                  <p className="text-muted-foreground">
                    Major liquidity pool growth (1.5x+ or $100k+)
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Eye className="h-4 w-4 text-green-400 mt-0.5" />
                <div>
                  <strong>DexScreener Visibility</strong>
                  <p className="text-muted-foreground">
                    Token appears on DexScreener trending
                  </p>
                </div>
              </li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Lead-Time Calculation */}
      <div className="mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Lead-Time Calculation</h2>
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3">
              <Badge variant="outline" className="bg-blue-500/15 border-blue-500/30">
                1. Observation Detected
              </Badge>
              <span className="text-muted-foreground hidden md:inline">{"\u2192"}</span>
              <span className="text-muted-foreground md:hidden text-xs pl-2">{"\u2193"}</span>
              <Badge variant="outline" className="bg-green-500/15 border-green-500/30">
                2. Reaction Detected
              </Badge>
              <span className="text-muted-foreground hidden md:inline">{"\u2192"}</span>
              <span className="text-muted-foreground md:hidden text-xs pl-2">{"\u2193"}</span>
              <Badge variant="outline" className="bg-primary/15 border-primary/30">
                3. Lead-Time Computed
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              <strong>Lead-Time = Reaction Block Number - Observation Block Number</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Only observations with <strong>≥10 blocks</strong> lead-time qualify as valid proofs.
            </p>
            <Alert className="bg-muted/30 border-muted-foreground/30">
              <Clock className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Example: If SOLRAD detects accumulation at block 100,000 and volume expansion occurs
                at block 100,150, the lead-time proof is +150 blocks (~1.25 minutes on Solana).
              </AlertDescription>
            </Alert>
          </div>
        </Card>
      </div>

      {/* Confidence Levels */}
      <div className="mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Confidence Levels</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 border-yellow-500/30">
            <Badge variant="outline" className="mb-2 bg-yellow-500/15 text-yellow-600 border-yellow-500/30">
              LOW
            </Badge>
            <p className="text-sm text-muted-foreground">
              10-29 blocks lead-time or weak observation signals
            </p>
          </Card>
          <Card className="p-4 border-blue-500/30">
            <Badge variant="outline" className="mb-2 bg-blue-500/15 text-blue-600 border-blue-500/30">
              MEDIUM
            </Badge>
            <p className="text-sm text-muted-foreground">
              30-99 blocks lead-time with moderate observation confidence
            </p>
          </Card>
          <Card className="p-4 border-green-500/30">
            <Badge variant="outline" className="mb-2 bg-green-500/15 text-green-600 border-green-500/30">
              HIGH
            </Badge>
            <p className="text-sm text-muted-foreground">
              100+ blocks lead-time or strong early observation signals
            </p>
          </Card>
        </div>
      </div>

      {/* Pro vs Free */}
      <div className="mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Access Tiers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Free Users</h3>
              <Badge variant="outline">15min Delay</Badge>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• View lead-time proofs with 15-minute delay</li>
              <li>• See historical proof statistics</li>
              <li>• Observational data only</li>
            </ul>
          </Card>
          <Card className="p-4 border-primary/50 bg-primary/5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Pro Users
              </h3>
              <Badge variant="default">Real-Time</Badge>
            </div>
            <ul className="space-y-2 text-sm">
              <li>• Real-time lead-time tracking (no delay)</li>
              <li>• Filter tokens by lead-time metrics</li>
              <li>• Advanced observation confidence levels</li>
              <li>• Priority access to new detection methods</li>
            </ul>
            <Button className="w-full mt-4" asChild>
              <Link href="/pro">Upgrade to Pro</Link>
            </Button>
          </Card>
        </div>
      </div>

      {/* Disclaimer */}
      <Alert className="bg-muted border-muted-foreground/30">
        <AlertDescription className="text-sm">
          <strong>Important Disclaimer:</strong> Lead-time proofs show observed on-chain behavior
          patterns. They are not predictions, signals, or guarantees of future performance. Past
          observations do not indicate future results. Always conduct your own research and never
          invest more than you can afford to lose.
        </AlertDescription>
      </Alert>
    </div>
  )
}
