import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Activity, Droplets, TrendingUp, Clock, Shield, AlertTriangle, Database, Ban, AlertCircle, CheckCircle2, Zap, XCircle } from "lucide-react"
import type { Metadata } from "next"
import { generateBreadcrumbSchema } from "@/lib/schema"

export const metadata: Metadata = {
  title: "SOLRAD Scoring Methodology | Intelligence Framework",
  description:
    "SOLRAD's observational intelligence methodology for Solana tokens. Deterministic scoring framework analyzing liquidity depth, trading activity, market participation, token maturity, and structural risk signals.",
  alternates: {
    canonical: "https://www.solrad.io/scoring",
  },
  openGraph: {
    title: "SOLRAD Scoring Methodology | Intelligence Framework",
    description:
      "Observational intelligence methodology for Solana tokens. Deterministic framework analyzing liquidity, activity, participation, maturity, and risk.",
    url: "https://www.solrad.io/scoring",
    siteName: "SOLRAD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SOLRAD Scoring Methodology | Intelligence Framework",
    description:
      "Observational intelligence methodology for Solana tokens. Deterministic framework analyzing market conditions.",
  },
}

export default function ScoringPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://www.solrad.io" },
    { name: "Scoring", url: "https://www.solrad.io/scoring" },
  ])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* SEO: Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">

          {/* CHANGE 1 — PAGE HEADER */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-foreground">
              Scoring Methodology
            </h1>
            <p className="text-sm text-muted-foreground mt-2">Observational intelligence framework for Solana token analysis</p>
          </div>

          {/* CHANGE 2 — SCORING PHILOSOPHY */}
          <div className="bg-card border border-border rounded-xl p-8 max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-sm font-bold uppercase tracking-wide text-foreground mb-5">Scoring Philosophy</h2>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                SOLRAD functions as an <strong className="text-foreground">observational intelligence system</strong> for Solana tokens. 
                It does not predict prices, recommend trades, or forecast future performance.
              </p>
              <p>
                Instead, it analyzes current market conditions through a deterministic, reproducible framework that processes
                the same inputs the same way every time. Given identical market data, SOLRAD produces identical scores.
              </p>
              <p>
                Scores reflect <strong className="text-foreground">present-state conditions</strong>—liquidity depth, trading patterns, 
                token maturity, and structural risk signals. These are observational snapshots, not guarantees about what happens next.
              </p>
            </div>
            <div className="bg-primary/5 border-l-4 border-primary rounded-r p-3 text-xs text-muted-foreground italic text-left mt-6">
              SOLRAD reads market state. It does not write, custody, access wallets, or execute trades.
            </div>
          </div>

          {/* CHANGE 3 — SCORE BANDS */}
          <div className="mb-10">
            <h2 className="text-sm font-bold uppercase tracking-wide text-foreground text-center mb-6">Score Bands</h2>
            <p className="text-sm text-muted-foreground text-center max-w-2xl mx-auto mb-6">
              Scores range from 0-100 and indicate relative strength of current market conditions. Higher scores suggest
              stronger liquidity, activity, and lower structural risk signals based on available data.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="flex justify-center">
                  <TrendingUp className="text-green-500" size={32} />
                </div>
                <p className="text-2xl font-black text-green-500 text-center mt-3">{"70 — 100"}</p>
                <p className="text-xs font-mono text-green-400 uppercase text-center mt-1">High Signal</p>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Strong liquidity depth, balanced trading activity, mature token age, healthy fundamentals
                </p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="flex justify-center">
                  <Activity className="text-yellow-500" size={32} />
                </div>
                <p className="text-2xl font-black text-yellow-500 text-center mt-3">{"50 — 69"}</p>
                <p className="text-xs font-mono text-yellow-400 uppercase text-center mt-1">Moderate</p>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Moderate liquidity, developing activity patterns, mixed signals across fundamentals
                </p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="flex justify-center">
                  <AlertTriangle className="text-muted-foreground" size={32} />
                </div>
                <p className="text-2xl font-black text-muted-foreground text-center mt-3">{"0 — 49"}</p>
                <p className="text-xs font-mono text-muted-foreground uppercase text-center mt-1">Low Signal</p>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Thin liquidity, minimal activity, very new tokens, or elevated structural risk signals
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4 p-3 bg-muted/50 rounded text-center">
              Scores are relative indicators of current conditions. They do not predict future outcomes or provide trading recommendations.
            </p>
          </div>

          {/* CHANGE 4 — CORE SIGNAL CATEGORIES */}
          <div className="mb-10">
            <h2 className="text-sm font-bold uppercase tracking-wide text-foreground text-center mb-6">Core Signal Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Liquidity Strength */}
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="flex justify-center">
                  <Droplets className="text-primary" size={32} />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-center mt-3 mb-4">Liquidity Strength & Depth</h3>
                <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-1">What It Measures</p>
                <p className="text-xs text-muted-foreground text-center">
                  Total available liquidity in trading pools. 
                  Deeper liquidity enables larger trades with less price impact (slippage).
                </p>
                <div className="border-t border-border my-3" />
                <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-1">Why It Matters</p>
                <p className="text-xs text-muted-foreground text-center">
                  Thin liquidity creates vulnerability to manipulation, 
                  high slippage, and difficulty exiting positions. Strong liquidity suggests established market structure.
                </p>
                <div className="border-t border-border my-3" />
                <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-1">Strong vs Weak</p>
                <p className="text-xs text-muted-foreground text-center">
                  High liquidity (hundreds of thousands) indicates 
                  resilient market depth. Low liquidity (under tens of thousands) signals fragile conditions.
                </p>
              </div>

              {/* Trading Activity */}
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="flex justify-center">
                  <Activity className="text-primary" size={32} />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-center mt-3 mb-4">Trading Activity Quality</h3>
                <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-1">What It Measures</p>
                <p className="text-xs text-muted-foreground text-center">
                  24-hour volume, transaction counts, 
                  and volume-to-liquidity ratios. Identifies organic vs artificial activity patterns.
                </p>
                <div className="border-t border-border my-3" />
                <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-1">Why It Matters</p>
                <p className="text-xs text-muted-foreground text-center">
                  Balanced activity (volume relative to liquidity 
                  in healthy ranges) suggests genuine participation. Extreme ratios may indicate wash trading or thin engagement.
                </p>
                <div className="border-t border-border my-3" />
                <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-1">Strong vs Weak</p>
                <p className="text-xs text-muted-foreground text-center">
                  Moderate ratios with consistent transactions 
                  signal healthy activity. Very low or very high ratios raise questions about participation quality.
                </p>
              </div>

              {/* Market Participation */}
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="flex justify-center">
                  <TrendingUp className="text-primary" size={32} />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-center mt-3 mb-4">Market Participation Balance</h3>
                <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-1">What It Measures</p>
                <p className="text-xs text-muted-foreground text-center">
                  Holder distribution and concentration 
                  patterns. Identifies centralized vs distributed ownership structures.
                </p>
                <div className="border-t border-border my-3" />
                <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-1">Why It Matters</p>
                <p className="text-xs text-muted-foreground text-center">
                  High concentration in a few wallets creates 
                  control risk and vulnerability to large exits. Distributed ownership suggests broader market confidence.
                </p>
                <div className="border-t border-border my-3" />
                <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-1">Strong vs Weak</p>
                <p className="text-xs text-muted-foreground text-center">
                  Distributed holdings across many participants 
                  indicate healthy participation. Top holders controlling majority supply signal concentration risk.
                </p>
              </div>

              {/* Token Maturity */}
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="flex justify-center">
                  <Clock className="text-primary" size={32} />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-center mt-3 mb-4">Token Maturity & Survival</h3>
                <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-1">What It Measures</p>
                <p className="text-xs text-muted-foreground text-center">
                  Time since pair creation. 
                  Tracks how long the token has maintained active trading.
                </p>
                <div className="border-t border-border my-3" />
                <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-1">Why It Matters</p>
                <p className="text-xs text-muted-foreground text-center">
                  Very new tokens carry higher uncertainty. 
                  Sustained survival over time demonstrates durability through various market conditions.
                </p>
                <div className="border-t border-border my-3" />
                <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-1">Strong vs Weak</p>
                <p className="text-xs text-muted-foreground text-center">
                  Tokens operating for days or weeks show 
                  staying power. Brand new tokens (hours old) lack track record and carry higher risk.
                </p>
              </div>

              {/* Structural Risk — full width on desktop */}
              <div className="bg-card border border-border rounded-xl p-6 text-center md:col-span-2 max-w-lg mx-auto w-full">
                <div className="flex justify-center">
                  <Shield className="text-primary" size={32} />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-center mt-3 mb-4">Structural Risk Signals</h3>
                <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-1">What It Measures</p>
                <p className="text-xs text-muted-foreground text-center">
                  FDV/liquidity ratios, authority status 
                  (mint/freeze controls), and other technical flags that indicate structural vulnerabilities.
                </p>
                <div className="border-t border-border my-3" />
                <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-1">Why It Matters</p>
                <p className="text-xs text-muted-foreground text-center">
                  Active authorities allow supply manipulation. 
                  Extreme FDV/liquidity mismatches create instability. These are structural red flags independent of price action.
                </p>
                <div className="border-t border-border my-3" />
                <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-1">Strong vs Weak</p>
                <p className="text-xs text-muted-foreground text-center">
                  Renounced authorities and balanced ratios 
                  reduce structural risk. Present authorities and extreme imbalances elevate it.
                </p>
              </div>
            </div>
          </div>

          {/* CHANGE 5 — RISK LABELS */}
          <div className="mb-10">
            <h2 className="text-sm font-bold uppercase tracking-wide text-foreground text-center mb-2">Risk & Activity Labels</h2>
            <p className="text-sm text-muted-foreground text-center max-w-2xl mx-auto mb-6">
              SOLRAD applies categorical labels to quickly communicate risk and activity state. These are derived from 
              observable conditions, not predictions about future performance.
            </p>

            <h3 className="text-xs font-mono font-semibold uppercase tracking-widest text-muted-foreground/60 text-center mb-4">Risk Labels</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="flex justify-center">
                  <Shield className="text-green-500" size={28} />
                </div>
                <p className="text-sm font-bold text-green-500 text-center mt-3 mb-2">LOW RISK</p>
                <p className="text-xs text-muted-foreground text-center">
                  Minimal structural red flags observed. Adequate liquidity, reasonable age, balanced fundamentals. 
                  Does not guarantee safety—only indicates fewer present-state concerns.
                </p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="flex justify-center">
                  <AlertCircle className="text-yellow-500" size={28} />
                </div>
                <p className="text-sm font-bold text-yellow-500 text-center mt-3 mb-2">MEDIUM RISK</p>
                <p className="text-xs text-muted-foreground text-center">
                  Some caution signals present. May include thin liquidity, recent launch, or imbalanced activity patterns. 
                  Elevated watchfulness advised.
                </p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="flex justify-center">
                  <AlertTriangle className="text-destructive" size={28} />
                </div>
                <p className="text-sm font-bold text-destructive text-center mt-3 mb-2">HIGH RISK</p>
                <p className="text-xs text-muted-foreground text-center">
                  Multiple structural red flags observed. Very low liquidity, extreme ratios, high concentration, or active 
                  authorities. Significant caution warranted.
                </p>
              </div>
            </div>

            {/* CHANGE 6 — ACTIVITY STATES */}
            <h3 className="text-xs font-mono font-semibold uppercase tracking-widest text-muted-foreground/60 text-center mb-4">Activity States</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="flex justify-center">
                  <Activity className="text-muted-foreground" size={28} />
                </div>
                <p className="text-sm font-bold text-muted-foreground text-center mt-3 mb-2">LOW ACTIVITY</p>
                <p className="text-xs text-muted-foreground text-center">
                  Low volume, minimal participation. May indicate early-stage market or declining interest.
                </p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="flex justify-center">
                  <CheckCircle2 className="text-green-500" size={28} />
                </div>
                <p className="text-sm font-bold text-green-500 text-center mt-3 mb-2">NORMAL ACTIVITY</p>
                <p className="text-xs text-muted-foreground text-center">
                  Balanced volume-to-liquidity ratio within typical organic ranges. Activity appears proportional to available depth.
                </p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="flex justify-center">
                  <Zap className="text-orange-400" size={28} />
                </div>
                <p className="text-sm font-bold text-orange-400 text-center mt-3 mb-2">VOL ANOMALY</p>
                <p className="text-xs text-muted-foreground text-center">
                  Volume significantly disproportionate to liquidity—either too high (potential wash trading) or too volatile. 
                  Unusual activity patterns observed.
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-4 p-3 bg-primary/5 border-l-4 border-primary rounded-r italic text-left">
              Labels are observational signals based on current data. They are not recommendations, predictions, or guarantees of future behavior.
            </p>
          </div>

          {/* CHANGE 7 — WHAT SOLRAD DOES NOT DO */}
          <div className="bg-card border border-destructive/20 rounded-xl p-8 max-w-3xl mx-auto text-center mb-10">
            <div className="flex justify-center mb-4">
              <XCircle className="text-destructive" size={32} />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-foreground mb-6">What SOLRAD Does Not Do</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <p className="text-xs font-bold text-foreground mb-1">No Predictions</p>
                <p className="text-xs text-muted-foreground">
                  SOLRAD does not predict future prices, 
                  forecast performance, or claim to know what happens next. It observes present conditions only.
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-foreground mb-1">No Price Targets</p>
                <p className="text-xs text-muted-foreground">
                  Scores do not imply price targets, 
                  expected returns, or investment outcomes. They reflect current market state, not future results.
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-foreground mb-1">No Wallet Access</p>
                <p className="text-xs text-muted-foreground">
                  SOLRAD does not access, control, or 
                  interact with user wallets. It is a read-only intelligence system.
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-foreground mb-1">No Custody</p>
                <p className="text-xs text-muted-foreground">
                  SOLRAD does not hold, custody, or manage 
                  user funds. It analyzes publicly available market data.
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs font-bold text-foreground mb-1">No Trading Advice</p>
                <p className="text-xs text-muted-foreground">
                  Nothing on SOLRAD constitutes financial, 
                  investment, or trading advice. Users make independent decisions at their own risk.
                </p>
              </div>
            </div>
          </div>

          {/* CHANGE 8 — DATA SOURCES */}
          <div className="bg-card border border-border rounded-xl p-8 max-w-3xl mx-auto text-center mb-10">
            <div className="flex justify-center mb-4">
              <Database className="text-primary" size={32} />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-foreground mb-6">Data Sources & Update Behavior</h2>
            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold text-foreground mb-1">DexScreener</p>
                <p className="text-xs text-muted-foreground">
                  Provides price, volume, liquidity, 
                  pair creation timestamps, and transaction counts for Solana tokens.
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-foreground mb-1">On-Chain (QuickNode RPC)</p>
                <p className="text-xs text-muted-foreground">
                  Enrichment data including holder counts, 
                  mint/freeze authority status, and holder concentration (available for select tokens).
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-foreground mb-1">Deterministic Scoring</p>
                <p className="text-xs text-muted-foreground">
                  Given identical inputs, SOLRAD 
                  produces identical scores. The framework is reproducible and transparent in its calculations.
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-foreground mb-1">Update Cadence</p>
                <p className="text-xs text-muted-foreground">
                  Data refreshes occur periodically 
                  as market information becomes available. Scores reflect conditions at time of last refresh.
                </p>
              </div>
            </div>
            <div className="bg-primary/5 border-l-4 border-primary rounded-r p-3 text-xs text-muted-foreground italic text-left mt-6">
              SOLRAD processes publicly available market data through a deterministic intelligence framework. 
              It does not generate, manipulate, or alter source data—only observes and analyzes it.
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}
