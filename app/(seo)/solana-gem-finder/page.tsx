
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Gem, TrendingUp, Shield, Zap, Search, Activity, Target, Sparkles, AlertTriangle, CheckCircle2, Eye, Layers, BarChart3, Droplets, Clock } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Solana Gem Finder | Early Token Discovery | SOLRAD",
  description:
    "Find high-potential Solana tokens early. On-chain scoring, liquidity analysis, and rug risk detection. Discover gems before the crowd with SOLRAD.",
  keywords:
    "solana gem finder, find solana gems, solana hidden gems, solana 100x tokens, gem scanner, early token discovery, solana gem detector, rug risk detection",
  alternates: {
    canonical: "https://www.solrad.io/solana-gem-finder",
  },
  openGraph: {
    title: "Solana Gem Finder – Discover High-Potential Tokens Early",
    description:
      "Find Solana gems before they moon. Advanced token scoring, liquidity analysis, and rug risk detection.",
    url: "https://www.solrad.io/solana-gem-finder",
    siteName: "SOLRAD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Solana Gem Finder – Discover High-Potential Tokens Early",
    description:
      "Find Solana gems before they moon with SOLRAD's advanced token scoring and risk detection.",
  },
}

export default function SolanaGemFinderPage() {
  const faqs = [
    {
      question: "What is a Solana gem finder and how does it work?",
      answer:
        "A Solana gem finder is a tool that helps identify undervalued tokens with high growth potential before they gain mainstream attention. SOLRAD's gem finder works by continuously scanning the Solana blockchain, aggregating data from multiple sources including DexScreener, on-chain analytics, and liquidity pools. It applies a sophisticated scoring algorithm that evaluates tokens based on liquidity depth, volume patterns, holder distribution, contract safety, and momentum indicators. Tokens scoring 70+ with healthy fundamentals are flagged as potential gems.",
    },
    {
      question: "How does SOLRAD's scoring system identify gems?",
      answer:
        "SOLRAD uses a composite scoring system (0-100) that weighs five critical factors: Liquidity Score (30 points) measures depth and stability, Volume Score (25 points) evaluates trading activity and sustainability, Activity Score (20 points) tracks holder growth and engagement, Age Score (15 points) rewards established tokens, and Health Score (10 points) assesses overall market confidence. Bonus points are awarded for multi-source verification. Gems typically score 70+ with balanced metrics across all categories, indicating strong fundamentals without red flags.",
    },
    {
      question: "What rug risk detection features does SOLRAD provide?",
      answer:
        "SOLRAD's rug risk detection analyzes multiple security vectors: liquidity lock status and LP token ownership, mint authority status (safe if burned/renounced), holder concentration (flags if top 10 holders control >70%), FDV-to-market-cap ratios (extreme ratios >1000x are suspicious), volume patterns (sudden spikes followed by silence), and contract safety checks for honeypot functions. Each token receives a risk classification (Low, Medium, High, Critical) with specific warnings. SOLRAD automatically flags tokens with unsafe mint authority, draining liquidity, or whale-dominated supply.",
    },
    {
      question: "How do I use SOLRAD to find gems effectively?",
      answer:
        "Start by monitoring the Fresh Signals column for newly discovered tokens with gem characteristics. Filter for tokens with scores above 70 and Low or Medium risk classifications. Click any token to view detailed analytics including liquidity charts, volume trends, holder distribution, and risk indicators. Verify that liquidity is locked or burned, check holder concentration isn't extreme, and look for consistent organic growth rather than sudden spikes. Add promising gems to your watchlist to track their progression over days or weeks. Always conduct external research including team verification, social presence, and roadmap review before investing.",
    },
    {
      question: "What's the difference between Fresh Signals, Trending, and Active Trading?",
      answer:
        "Fresh Signals shows newly discovered tokens that have recently established liquidity and are beginning to show momentum – ideal for finding very early gems. Trending displays tokens with sustained momentum over hours or days, indicating growing community interest and consistent performance. Active Trading highlights tokens experiencing unusual volume surges right now, which can signal breaking news, whale activity, or emerging attention. For gem hunting, Fresh Signals offers the earliest entry points, Trending shows validated momentum, and Active Trading reveals real-time opportunities with higher volatility.",
    },
    {
      question: "Can SOLRAD guarantee I'll find 100x gems?",
      answer:
        "No platform can guarantee 100x returns, and SOLRAD makes no such claims. SOLRAD provides analytical tools and data intelligence to help identify tokens with gem potential based on quantifiable metrics like liquidity, volume, and risk factors. However, cryptocurrency investments carry substantial risk, and even tokens with strong fundamentals can fail. SOLRAD's scoring system highlights tokens that meet specific quality thresholds, but market success depends on countless variables including team execution, market conditions, competition, and broader crypto trends. Always use SOLRAD as part of your research process, never as your only decision-making tool. Practice proper risk management and never invest more than you can afford to lose.",
    },
  ]

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        url: "https://www.solrad.io/solana-gem-finder",
        name: "Solana Gem Finder – Discover High-Potential Tokens Early",
        description:
          "Find Solana gems before they moon. Advanced token scoring, liquidity analysis, rug risk detection, and real-time intelligence for early token discovery.",
        isPartOf: {
          "@type": "WebSite",
          url: "https://www.solrad.io",
          name: "SOLRAD",
        },
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: "https://www.solrad.io",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Solana Gem Finder",
              item: "https://www.solrad.io/solana-gem-finder",
            },
          ],
        },
      },
      {
        "@type": "SoftwareApplication",
        name: "SOLRAD Gem Finder",
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        description:
          "Real-time Solana token gem finder with advanced scoring, liquidity analysis, and rug risk detection",
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />

        <main className="flex-1">
          {/* Hero Section */}
          <section className="container mx-auto px-4 py-16 md:py-24 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-2xl bg-primary/10">
                <Gem className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-balance">
              Solana Gem Finder – Discover High-Potential Tokens <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Early</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 text-pretty">
              Find hidden Solana gems before they explode using SOLRAD's advanced token scoring system, real-time liquidity analysis, and comprehensive rug risk detection. Discover the next 100x opportunity before the crowd.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  <Sparkles className="h-4 w-4" />
                  Start Finding Gems Now
                </Button>
              </Link>
              <Link href="/scoring">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                  How Scoring Works
                </Button>
              </Link>
            </div>
          </section>

          {/* What is a Solana Gem Finder */}
          <section className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">What is a Solana Gem Finder?</h2>
              <Card className="p-6 mb-8">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  A <strong className="text-foreground">Solana gem finder</strong> is a specialized tool designed to identify undervalued tokens with high growth potential on the Solana blockchain before they gain mainstream attention. Unlike simple token scanners that only show trending or popular tokens, a sophisticated gem finder analyzes fundamental metrics including liquidity depth, trading volume patterns, holder distribution, contract safety mechanisms, and early momentum indicators to surface tokens that exhibit characteristics of potential "gems" – tokens that could deliver significant returns.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The Solana ecosystem processes thousands of new token launches daily, making manual research impossible. Traditional methods of finding gems – browsing Twitter, Discord groups, or manually checking DEX listings – are too slow and often lead to discovering tokens after optimal entry points have passed. A proper gem finder automates this discovery process by continuously monitoring on-chain data, aggregating information from multiple sources, and applying algorithmic scoring to identify tokens that meet specific quality thresholds.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  SOLRAD's gem finder goes beyond basic metrics by implementing multi-factor analysis that weighs liquidity health (is there enough depth to support growth?), volume sustainability (is trading organic or manipulated?), holder distribution (are whales controlling supply?), contract security (is mint authority burned?), and age-weighted momentum (has the token established credibility?). This comprehensive approach helps filter out rug pulls, pump-and-dumps, and low-quality projects while highlighting tokens with genuine potential for sustained growth.
                </p>
              </Card>
            </div>
          </section>

          {/* How SOLRAD Finds High-Quality Gems */}
          <section className="container mx-auto px-4 py-12 bg-muted/30">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">How SOLRAD Finds High-Quality Gems</h2>
              <div className="space-y-4 mb-8">
                <p className="text-muted-foreground leading-relaxed">
                  SOLRAD employs a sophisticated multi-source aggregation system that pulls real-time data from DexScreener trending APIs, on-chain Solana analytics via QuickNode RPC, Jupiter DEX aggregator, Pump.fun discovery feeds, and proprietary momentum signals. This comprehensive data collection ensures SOLRAD captures tokens across multiple discovery vectors, from newly launched projects establishing initial liquidity to established tokens showing fresh momentum signals.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  The gem identification process operates in three stages. First, token discovery continuously ingests new tokens from multiple sources, verifying contract addresses and initial metadata. Second, multi-factor scoring evaluates each token against SOLRAD's composite algorithm (detailed below). Third, intelligent filtering applies risk classification logic to automatically flag unsafe tokens while promoting gems that meet quality thresholds. This pipeline processes tokens every 5-10 minutes, ensuring fresh gems appear quickly after establishing sufficient liquidity.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Target className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Multi-Source Discovery</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="leading-relaxed">
                      Aggregates data from DexScreener, on-chain Solana analytics, Jupiter, and Pump.fun to capture gems across all discovery channels. Cross-validates data for accuracy and awards bonus points for multi-source confirmation.
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                      <Activity className="h-6 w-6 text-green-500" />
                    </div>
                    <CardTitle>Real-Time Liquidity Monitoring</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="leading-relaxed">
                      Tracks liquidity pool depth, LP token lock status, and liquidity trends over time. Detects liquidity drainage patterns and flags tokens with insufficient depth or unlocked LP as high-risk.
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4">
                      <Shield className="h-6 w-6 text-cyan-500" />
                    </div>
                    <CardTitle>Comprehensive Risk Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="leading-relaxed">
                      Evaluates contract safety (mint authority status, freeze authority), holder concentration, FDV ratios, volume patterns, and historical behavior to assign risk classifications and detect potential rug pulls.
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                      <TrendingUp className="h-6 w-6 text-purple-400" />
                    </div>
                    <CardTitle>Momentum Signal Detection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="leading-relaxed">
                      Identifies early momentum through volume acceleration, holder growth velocity, buy/sell pressure ratios, and social sentiment signals before gems hit mainstream radar.
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Scoring System Explanation */}
          <section className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">SOLRAD Scoring System Explained</h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                SOLRAD's composite scoring algorithm evaluates tokens on a 0-100 scale by analyzing five weighted components plus bonus factors. Each component targets specific fundamental qualities that correlate with genuine gem potential rather than speculative hype. The scoring system is fully transparent and documented, with thresholds calibrated to balance sensitivity (catching early gems) with specificity (filtering out low-quality tokens).
              </p>

              <div className="space-y-4">
                <Card className="p-6 border-primary/20">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                      <Droplets className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold">Liquidity Score</h3>
                        <Badge variant="secondary">30 points</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Measures liquidity pool depth and stability. Tokens need sufficient liquidity ($100K+) to support growth without excessive slippage. Scoring rewards deep liquidity pools while penalizing shallow or volatile liquidity. Locked or burned LP tokens receive bonus points for reduced rug risk.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-green-500/20">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-green-500/10 shrink-0">
                      <BarChart3 className="h-6 w-6 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold">Volume Score</h3>
                        <Badge variant="secondary">25 points</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Evaluates trading volume quality and sustainability. Organic volume shows healthy market interest, while manipulated volume indicates wash trading. SOLRAD analyzes volume-to-liquidity ratios (healthy: 0.5-2.0) and volume consistency over time to detect genuine trading activity.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-cyan-500/20">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-cyan-500/10 shrink-0">
                      <Activity className="h-6 w-6 text-cyan-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold">Activity Score</h3>
                        <Badge variant="secondary">20 points</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Tracks holder growth and engagement patterns. Growing holder counts indicate expanding community interest, while declining holders signal exits. SOLRAD monitors holder velocity and distribution quality to identify tokens building genuine community bases versus pump-and-dump schemes.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-purple-500/20">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-purple-500/10 shrink-0">
                      <Clock className="h-6 w-6 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold">Age Score</h3>
                        <Badge variant="secondary">15 points</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Rewards tokens that have established longevity without being "too late" for gem potential. Tokens that survive and grow over weeks or months demonstrate resilience. SOLRAD balances age rewards to favor tokens old enough to have proven themselves but young enough to still have significant upside potential.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-accent/20">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-accent/10 shrink-0">
                      <Shield className="h-6 w-6 text-accent" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold">Health Score</h3>
                        <Badge variant="secondary">10 points</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Assesses overall market confidence and structural safety. Incorporates price stability, buy pressure balance, holder retention rates, and absence of critical red flags. Tokens with healthy scores demonstrate consistent positive indicators without alarming risk factors.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-yellow-500/20 bg-yellow-500/5">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-yellow-500/10 shrink-0">
                      <Sparkles className="h-6 w-6 text-yellow-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold">Bonus Points</h3>
                        <Badge variant="secondary">Up to +10</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Additional points awarded for exceptional characteristics: Multi-source verification (token appears across multiple discovery platforms), locked liquidity, burned mint authority, strong community engagement signals, and consistent positive momentum trends. Bonus points can push high-quality gems above scoring thresholds.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="p-6 mt-6 bg-muted/50">
                <h3 className="text-lg font-bold mb-3">Score Interpretation</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-green-500 text-white shrink-0">85-100</Badge>
                    <span className="text-muted-foreground">Exceptional gems with top-tier fundamentals across all metrics</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-cyan-500 text-white shrink-0">70-84</Badge>
                    <span className="text-muted-foreground">Strong gem potential with healthy fundamentals and manageable risks</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-yellow-500 text-black shrink-0">50-69</Badge>
                    <span className="text-muted-foreground">Moderate quality, suitable for experienced traders with higher risk tolerance</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-red-500 text-white shrink-0">0-49</Badge>
                    <span className="text-muted-foreground">Low quality or high risk – avoid unless conducting speculative trades</span>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* Rug Risk Detection */}
          <section className="container mx-auto px-4 py-12 bg-muted/30">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">Advanced Rug Risk Detection</h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Rug pulls represent the most significant risk in early-stage token investing. SOLRAD implements multi-layered rug risk detection by analyzing contract structures, liquidity mechanics, holder behavior, and historical patterns to identify red flags before they materialize into exit scams. Each token receives a risk classification (Low, Medium, High, Critical) with specific warnings explaining detected vulnerabilities.
              </p>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Card className="p-6 border-red-500/30">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Critical Red Flags
                  </h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-red-500 mt-2 shrink-0" />
                      <div>
                        <strong className="text-foreground">Unsafe Mint Authority:</strong>
                        <p className="text-muted-foreground">Mint authority not burned or renounced – developers can mint unlimited tokens and dilute holders</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-red-500 mt-2 shrink-0" />
                      <div>
                        <strong className="text-foreground">Unlocked Liquidity:</strong>
                        <p className="text-muted-foreground">LP tokens not locked or burned – developers can drain liquidity pool at any time</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-red-500 mt-2 shrink-0" />
                      <div>
                        <strong className="text-foreground">Extreme Whale Concentration:</strong>
                        <p className="text-muted-foreground">Top 10 holders control {">"}70% of supply – risk of coordinated dumps</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-red-500 mt-2 shrink-0" />
                      <div>
                        <strong className="text-foreground">Liquidity Drainage:</strong>
                        <p className="text-muted-foreground">Declining liquidity over time indicates slow rug pull in progress</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-red-500 mt-2 shrink-0" />
                      <div>
                        <strong className="text-foreground">Extreme FDV Ratio:</strong>
                        <p className="text-muted-foreground">Market cap to FDV ratio {">"}1000x suggests inflated valuations or hidden supply</p>
                      </div>
                    </li>
                  </ul>
                </Card>

                <Card className="p-6 border-green-500/30">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Safety Indicators
                  </h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-green-500 mt-2 shrink-0" />
                      <div>
                        <strong className="text-foreground">Burned Mint Authority:</strong>
                        <p className="text-muted-foreground">Mint authority permanently disabled – supply is fixed and cannot be inflated</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-green-500 mt-2 shrink-0" />
                      <div>
                        <strong className="text-foreground">Locked Liquidity:</strong>
                        <p className="text-muted-foreground">LP tokens locked for extended period or burned – liquidity cannot be removed</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-green-500 mt-2 shrink-0" />
                      <div>
                        <strong className="text-foreground">Distributed Holders:</strong>
                        <p className="text-muted-foreground">Top 10 holders control {"<"}50% of supply – reduced whale manipulation risk</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-green-500 mt-2 shrink-0" />
                      <div>
                        <strong className="text-foreground">Growing Liquidity:</strong>
                        <p className="text-muted-foreground">Increasing liquidity over time shows developer commitment and community trust</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-green-500 mt-2 shrink-0" />
                      <div>
                        <strong className="text-foreground">Reasonable FDV:</strong>
                        <p className="text-muted-foreground">Market cap to FDV ratio {"<"}100x indicates transparent tokenomics</p>
                      </div>
                    </li>
                  </ul>
                </Card>
              </div>

              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4">Risk Classification System</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-4">
                    <Badge className="bg-green-500 text-white shrink-0">LOW RISK</Badge>
                    <p className="text-sm text-muted-foreground">
                      Burned mint authority, locked liquidity, distributed holders, healthy liquidity depth, organic volume. Safe for most risk profiles.
                    </p>
                  </div>
                  <div className="flex items-start gap-4">
                    <Badge className="bg-yellow-500 text-black shrink-0">MEDIUM RISK</Badge>
                    <p className="text-sm text-muted-foreground">
                      Some minor concerns like moderate holder concentration or short lock periods. Suitable for experienced traders who understand the specific risks.
                    </p>
                  </div>
                  <div className="flex items-start gap-4">
                    <Badge className="bg-orange-500 text-white shrink-0">HIGH RISK</Badge>
                    <p className="text-sm text-muted-foreground">
                      Multiple red flags present: unsafe mint authority, unlocked liquidity, or high whale concentration. Only for speculative traders with high risk tolerance.
                    </p>
                  </div>
                  <div className="flex items-start gap-4">
                    <Badge className="bg-red-500 text-white shrink-0">CRITICAL RISK</Badge>
                    <p className="text-sm text-muted-foreground">
                      Severe vulnerabilities detected: active rug indicators, drainage patterns, or honeypot behavior. AVOID – extremely high probability of total loss.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* How to Use SOLRAD to Find Gems */}
          <section className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8">How to Use SOLRAD to Find Gems: Step-by-Step Guide</h2>
              <div className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <Badge variant="default" className="shrink-0 text-lg px-3 py-1">1</Badge>
                    <div>
                      <h3 className="text-xl font-bold mb-3">Access SOLRAD's Live Intelligence Dashboard</h3>
                      <p className="text-muted-foreground leading-relaxed mb-3">
                        Navigate to SOLRAD's main dashboard where real-time token data is displayed across multiple intelligence columns. The interface organizes tokens into Fresh Signals (newly discovered gems), Trending (sustained momentum), and Active Trading (volume surges). Each column serves a specific discovery purpose based on your gem-hunting strategy.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">Pro Tip:</strong> Fresh Signals offers the earliest entry points, Trending shows validated momentum, and Active Trading reveals real-time opportunities with higher volatility.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <Badge variant="default" className="shrink-0 text-lg px-3 py-1">2</Badge>
                    <div>
                      <h3 className="text-xl font-bold mb-3">Filter for High-Potential Gems</h3>
                      <p className="text-muted-foreground leading-relaxed mb-3">
                        Use SOLRAD's filtering system to narrow results to gems matching specific criteria. Set minimum score threshold to 70+, select "Low Risk" or "Medium Risk" classifications, and optionally filter by minimum liquidity ($100K+) or specific age ranges. The filter system eliminates noise and surfaces only tokens meeting your quality standards.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">Pro Tip:</strong> Start with stricter filters (score {">"}75, Low Risk only) to build a core watchlist, then gradually expand criteria to discover more speculative opportunities.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <Badge variant="default" className="shrink-0 text-lg px-3 py-1">3</Badge>
                    <div>
                      <h3 className="text-xl font-bold mb-3">Analyze Token Fundamentals</h3>
                      <p className="text-muted-foreground leading-relaxed mb-3">
                        Click any potential gem to open the detailed analytics panel. Review the token's complete profile including current score breakdown (Liquidity, Volume, Activity, Age, Health), risk classification with specific warnings, liquidity chart showing historical depth trends, volume patterns over time, holder count progression, and contract safety indicators. Verify that all key metrics align with gem characteristics.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">Red Flags to Check:</strong> Declining liquidity, sudden volume spikes followed by drops, high holder concentration, unsafe mint authority, extreme FDV ratios.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <Badge variant="default" className="shrink-0 text-lg px-3 py-1">4</Badge>
                    <div>
                      <h3 className="text-xl font-bold mb-3">Verify Contract Safety</h3>
                      <p className="text-muted-foreground leading-relaxed mb-3">
                        Examine the Risk Assessment section for critical safety checks. Confirm mint authority is burned or renounced (prevents unlimited minting), check liquidity lock status and duration (prevents rug pulls), review holder distribution to ensure top wallets don't control excessive supply, verify FDV-to-market-cap ratio is reasonable, and check for any honeypot or suspicious contract functions.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">Essential Checks:</strong> Burned mint authority + locked/burned LP + distributed holders + reasonable FDV = Low rug risk.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <Badge variant="default" className="shrink-0 text-lg px-3 py-1">5</Badge>
                    <div>
                      <h3 className="text-xl font-bold mb-3">Track Momentum and Trends</h3>
                      <p className="text-muted-foreground leading-relaxed mb-3">
                        Monitor volume trends and holder growth over multiple timeframes. Genuine gems exhibit consistent organic growth rather than explosive spikes followed by silence. Look for positive volume-to-liquidity ratios (0.5-2.0 is healthy), steadily increasing holder counts, balanced buy/sell pressure, and sustained momentum over days or weeks. Add promising gems to your watchlist for ongoing tracking.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">Momentum Indicators:</strong> Rising holder count + increasing volume + stable/growing liquidity + positive sentiment = Healthy gem trajectory.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <Badge variant="default" className="shrink-0 text-lg px-3 py-1">6</Badge>
                    <div>
                      <h3 className="text-xl font-bold mb-3">Conduct External Research</h3>
                      <p className="text-muted-foreground leading-relaxed mb-3">
                        SOLRAD provides comprehensive on-chain analytics, but always supplement with external research. Use SOLRAD's DexScreener and Pump.fun links to verify contract addresses and review trading charts. Check the project's Twitter/X presence for developer transparency and community engagement. Review the roadmap, whitepaper (if available), and team credentials. Join community channels (Telegram, Discord) to gauge genuine interest versus artificial hype.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">Never Rely Solely on Scoring:</strong> SOLRAD identifies candidates with strong fundamentals, but project success depends on team execution, market conditions, and countless unpredictable factors. Always DYOR (Do Your Own Research).
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <Badge variant="default" className="shrink-0 text-lg px-3 py-1">7</Badge>
                    <div>
                      <h3 className="text-xl font-bold mb-3">Practice Risk Management</h3>
                      <p className="text-muted-foreground leading-relaxed mb-3">
                        Even gems with perfect scores carry inherent risk in cryptocurrency markets. Never invest more than you can afford to lose. Diversify across multiple gems rather than concentrating in a single token. Set stop-losses based on your risk tolerance. Take profits incrementally as prices rise. Monitor your watchlist daily for changing risk indicators. Remember that early-stage tokens are highly volatile and speculative by nature.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">Risk Management Rules:</strong> Position sizing (1-5% per gem), diversification (10+ gems), profit-taking strategy, stop-losses, continuous monitoring.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </section>

          {/* Live Token Intelligence */}
          <section className="container mx-auto px-4 py-12 bg-muted/30">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">Live Token Intelligence Features</h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                SOLRAD operates as a real-time intelligence engine, continuously processing on-chain data and updating token scores every 5-10 minutes. This live monitoring ensures you discover gems as soon as they establish sufficient liquidity and momentum, before broader market attention drives prices higher. The system never sleeps, providing 24/7 surveillance of Solana's token ecosystem.
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Eye className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold">Fresh Signals</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    Newly discovered tokens that have recently established liquidity and are beginning to show early momentum. Perfect for finding very early gems before mainstream discovery.
                  </p>
                  <Badge variant="outline" className="text-xs">Updated every 5-10 min</Badge>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                    <h3 className="text-lg font-bold">Trending Gems</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    Tokens showing sustained momentum over hours or days with consistent growth indicators. Validated gems that have proven staying power beyond initial hype.
                  </p>
                  <Badge variant="outline" className="text-xs">Real-time momentum tracking</Badge>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-cyan-500/10">
                      <Zap className="h-5 w-5 text-cyan-500" />
                    </div>
                    <h3 className="text-lg font-bold">Active Trading</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    Tokens experiencing unusual volume surges right now, indicating breaking news, whale activity, or emerging attention. Real-time opportunities with higher volatility.
                  </p>
                  <Badge variant="outline" className="text-xs">Live volume monitoring</Badge>
                </Card>
              </div>

              <Card className="p-6 mt-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                    <Layers className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-3">Watchlist & Portfolio Tracking</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Add gems to your personal watchlist to track their progression over time. Monitor score changes, liquidity trends, holder growth, and risk classification updates. Receive notifications when watchlisted tokens reach specific thresholds or show concerning changes. Build and manage your gem portfolio with real-time performance tracking across all positions.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <Card key={index} className="p-6">
                    <h3 className="text-lg font-bold mb-3">{faq.question}</h3>
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="container mx-auto px-4 py-16 text-center">
            <Card className="p-12 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <div className="flex justify-center mb-6">
                <div className="p-4 rounded-2xl bg-primary/10">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
              </div>
              <h2 className="text-3xl font-bold mb-4">Start Finding Solana Gems Today</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
                Access SOLRAD's live token intelligence dashboard now. Discover hidden gems with advanced scoring, comprehensive risk analysis, and real-time momentum tracking before they hit mainstream attention.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/">
                  <Button size="lg" className="w-full sm:w-auto gap-2">
                    <Search className="h-4 w-4" />
                    Launch Gem Finder
                  </Button>
                </Link>
                <Link href="/scoring">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                    Learn About Scoring
                  </Button>
                </Link>
              </div>
            </Card>
          </section>

          {/* Disclaimer */}
          <section className="container mx-auto px-4 pb-12">
            <div className="max-w-4xl mx-auto">
              <Card className="p-6 border-yellow-500/50 bg-yellow-500/5">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-bold mb-2">Important Disclaimer</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      SOLRAD is a market intelligence tool that provides data analysis and scoring based on publicly available on-chain information. It is NOT financial advice, investment recommendation, or endorsement of any token. Cryptocurrency trading involves substantial risk of loss. SOLRAD cannot guarantee the accuracy of third-party data sources, predict future token performance, or prevent rug pulls. Always conduct your own research (DYOR), verify contract addresses independently, understand the risks involved, and never invest more than you can afford to lose. Past performance does not indicate future results.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  )
}
