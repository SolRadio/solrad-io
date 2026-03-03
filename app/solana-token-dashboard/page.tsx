import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { LayoutDashboard, TrendingUp, Activity, Zap, LineChart, Eye, Filter, BarChart3 } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Solana Token Dashboard | SOLRAD",
  description:
    "Professional Solana token dashboard with real-time analytics. Track trending tokens, monitor liquidity, analyze volume patterns, and discover opportunities with SOLRAD intelligence.",
  keywords:
    "solana token dashboard, solana analytics dashboard, token tracking platform, solana market dashboard, real-time solana data, token analytics platform",
  alternates: {
    canonical: "https://www.solrad.io/solana-token-dashboard",
  },
  openGraph: {
    title: "Solana Token Dashboard - Real-Time Analytics & Market Intelligence | SOLRAD",
    description:
      "Professional Solana token dashboard with real-time analytics. Track trending tokens, monitor liquidity, and discover opportunities.",
    url: "https://www.solrad.io/solana-token-dashboard",
  },
  twitter: {
    card: "summary_large_image",
    title: "Solana Token Dashboard - Real-Time Analytics & Market Intelligence | SOLRAD",
    description:
      "Professional Solana token dashboard with real-time analytics. Track, analyze, and discover Solana tokens.",
  },
}

export default function SolanaTokenDashboardPage() {
  const faqs = [
    {
      question: "What is a Solana token dashboard?",
      answer:
        "A Solana token dashboard is a centralized interface that aggregates real-time market data, analytics, and intelligence for tokens on the Solana blockchain. SOLRAD's dashboard provides: trending token feeds, active trading alerts, early signal detection, fresh token discoveries, SOLRAD scoring (0-100), risk classifications, liquidity monitoring, volume analytics, and holder behavior tracking. It consolidates data from multiple sources into one professional workspace for efficient market analysis.",
    },
    {
      question: "What data does the SOLRAD dashboard show?",
      answer:
        "The SOLRAD dashboard displays: (1) Trending Tokens - tokens gaining momentum ranked by SOLRAD score, (2) Active Trading - tokens with unusual volume surges in last 24 hours, (3) New/Early Tokens - recently launched projects with established liquidity, (4) Fresh Signals - newly discovered tokens showing promise, (5) Token metrics including liquidity depth, 24h volume, price changes, holder counts, (6) Risk classifications (Low/Medium/High/Critical), (7) Market statistics (total volume, average scores, tracked token count), (8) Real-time updates every 5-10 minutes.",
    },
    {
      question: "How do I use the token dashboard effectively?",
      answer:
        "Effective dashboard usage: (1) Start with dashboard columns - scan Trending for momentum plays, Active Trading for volume breakouts, Fresh Signals for early opportunities, (2) Filter by SOLRAD score - focus on tokens above 70 for quality, (3) Check risk labels - avoid High/Critical risk tokens, (4) Click tokens for detailed analysis - review liquidity health, holder distribution, contract safety, (5) Add interesting tokens to watchlist for ongoing monitoring, (6) Compare metrics across columns to identify market patterns, (7) Use sorting and filtering to customize your view based on trading strategy.",
    },
    {
      question: "Can I customize the dashboard view?",
      answer:
        "Yes, SOLRAD's dashboard offers multiple viewing options: (1) Column sorting - sort by score, volume, liquidity, or percentage changes, (2) Filter options - show only specific risk categories or score ranges, (3) Compact/detailed views - toggle between card views for different information density, (4) Watchlist tab - create personalized tracking lists of tokens you're monitoring, (5) Mobile responsive design - full dashboard functionality on all devices. The dashboard remembers your preferences and updates in real-time across all views.",
    },
    {
      question: "How often does the dashboard update?",
      answer:
        "The SOLRAD dashboard updates every 5-10 minutes with fresh data. Real-time updates include: token scores recalculated based on latest metrics, new tokens appearing as they establish liquidity, risk classifications adjusting to changing conditions, volume and price data refreshing continuously, liquidity monitoring for drain detection, and holder counts updating as wallets transact. The dashboard displays the last update time and staleness indicator. You can manually refresh using the refresh button in the navbar for immediate updates.",
    },
  ]

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        url: "https://www.solrad.io/solana-token-dashboard",
        name: "Solana Token Dashboard - Real-Time Analytics & Market Intelligence",
        description:
          "Professional Solana token dashboard with real-time analytics. Track trending tokens, monitor liquidity, analyze volume patterns.",
        isPartOf: {
          "@type": "WebSite",
          url: "https://www.solrad.io",
          name: "SOLRAD",
        },
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
      {
        "@type": "SoftwareApplication",
        name: "SOLRAD Dashboard",
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        description: "Real-time Solana token analytics dashboard and market intelligence platform",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        
        <main className="flex-1">
          <section className="container mx-auto px-4 py-16 md:py-24 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-2xl bg-primary/10">
                <LayoutDashboard className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Professional <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Solana Token Dashboard</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Real-time analytics, market intelligence, and comprehensive token tracking for Solana. Monitor trending tokens, analyze risk, and discover opportunities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Open Dashboard
                </Button>
              </Link>
              <Link href="/scoring">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                  How Scoring Works
                </Button>
              </Link>
            </div>
          </section>

          <section className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">What is the SOLRAD Token Dashboard?</h2>
              <Card className="p-6 mb-8">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The <strong className="text-foreground">SOLRAD token dashboard</strong> is a professional-grade analytics platform that aggregates real-time market data, scoring intelligence, and risk assessments for Solana tokens. Unlike basic token trackers that only show prices and volume, SOLRAD provides comprehensive market intelligence through proprietary scoring algorithms, automated risk detection, and multi-source data aggregation.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Built specifically for Solana traders and researchers, the dashboard consolidates trending signals, volume alerts, new token discoveries, and detailed analytics into one efficient workspace. Every token receives a SOLRAD score (0-100) based on liquidity health, trading volume quality, age, activity patterns, and overall market viability. The dashboard updates every 5-10 minutes, ensuring you always have fresh intelligence for making informed trading decisions.
                </p>
              </Card>
            </div>
          </section>

          <section className="container mx-auto px-4 py-12">
            <h2 className="text-3xl font-bold mb-8 text-center">Dashboard Features & Capabilities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Trending Tokens</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Real-time feed of tokens gaining momentum. Ranked by SOLRAD score, showing tokens with strongest fundamentals and growth signals.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                    <Activity className="h-6 w-6 text-green-500" />
                  </div>
                  <CardTitle>Volume Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Active trading column highlights tokens with unusual 24h volume surges. Catch breakouts and high-activity opportunities early.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-cyan-500" />
                  </div>
                  <CardTitle>Fresh Signals</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Newly discovered tokens with gem potential. Spot early-stage opportunities before mainstream attention and price action.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                    <LineChart className="h-6 w-6 text-purple-400" />
                  </div>
                  <CardTitle>Advanced Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Click any token for detailed analytics: liquidity charts, volume trends, holder distribution, risk assessment, contract details.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="container mx-auto px-4 py-12 bg-muted/30">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8">Dashboard Columns Explained</h2>
              <div className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Trending Column</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Displays tokens with the strongest overall momentum and fundamentals. Sorted by SOLRAD score (highest first), this column shows tokens that are gaining traction across multiple metrics including liquidity growth, volume acceleration, holder increases, and positive risk profiles. Use Trending to identify which tokens have the best combination of safety and growth potential. Ideal for finding momentum plays with solid fundamentals backing the price action.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-green-500/10 shrink-0">
                      <Activity className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Active Trading Column</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Shows tokens experiencing unusual 24-hour volume surges relative to their normal trading patterns. Sorted by 24h volume percentage change, this column helps you catch breakout moments, whale accumulation, or viral attention spikes. High volume doesn't always mean quality - always check the token's SOLRAD score and risk label before acting. Use Active Trading to spot short-term momentum opportunities and volume breakouts that could signal trend starts.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-cyan-500/10 shrink-0">
                      <Eye className="h-6 w-6 text-cyan-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">New / Early Column</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Features recently launched tokens that have established sufficient liquidity and are showing early signs of viability. Sorted by age (newest first with minimum liquidity threshold), this column is ideal for finding tokens in their early stages before massive price appreciation. Exercise extra caution here - young tokens carry higher risk even if they look promising. Verify liquidity locks, holder distribution, and contract safety before investing in new/early tokens.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-purple-500/10 shrink-0">
                      <Zap className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Fresh Signals Column</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Displays newly discovered tokens that SOLRAD has recently started tracking and scoring. These tokens have met minimum liquidity requirements and are beginning to show momentum indicators. Sorted by urgency/recency of signal detection, Fresh Signals is perfect for gem hunters looking to identify opportunities before they hit mainstream attention. Always verify fundamentals - fresh doesn't mean safe. Check SOLRAD scores, risk labels, and contract safety before considering fresh signal tokens.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </section>

          <section className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8">How to Navigate the Dashboard</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Filter className="h-5 w-5 text-primary" />
                    Sorting & Filtering
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• <strong className="text-foreground">Sort by Score:</strong> Find highest-quality tokens with best fundamentals</li>
                    <li>• <strong className="text-foreground">Sort by Volume:</strong> Identify tokens with most trading activity</li>
                    <li>• <strong className="text-foreground">Sort by Liquidity:</strong> Focus on tokens with deepest liquidity pools</li>
                    <li>• <strong className="text-foreground">Filter by Risk:</strong> Show only Low/Medium risk tokens for safer options</li>
                    <li>• <strong className="text-foreground">Search Tokens:</strong> Find specific tokens by name or symbol</li>
                  </ul>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-500" />
                    Token Analysis
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• <strong className="text-foreground">Click Tokens:</strong> Open detailed analytics drawer for any token</li>
                    <li>• <strong className="text-foreground">View Charts:</strong> Analyze liquidity and volume trends over time</li>
                    <li>• <strong className="text-foreground">Check Holders:</strong> Review distribution and concentration metrics</li>
                    <li>• <strong className="text-foreground">Verify Safety:</strong> Read risk assessment and red flag warnings</li>
                    <li>• <strong className="text-foreground">External Links:</strong> Access DexScreener, Pump.fun, explorers</li>
                  </ul>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Eye className="h-5 w-5 text-cyan-500" />
                    Watchlist Management
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• <strong className="text-foreground">Add to Watchlist:</strong> Star tokens you want to monitor long-term</li>
                    <li>• <strong className="text-foreground">Watchlist Tab:</strong> View all your tracked tokens in one place</li>
                    <li>• <strong className="text-foreground">Monitor Changes:</strong> Track score, risk, and metric changes over time</li>
                    <li>• <strong className="text-foreground">Compare Tokens:</strong> Evaluate multiple watchlist tokens side-by-side</li>
                    <li>• <strong className="text-foreground">Persistent Storage:</strong> Watchlist syncs across devices</li>
                  </ul>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-amber-500" />
                    Market Statistics
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• <strong className="text-foreground">Total Volume:</strong> Aggregate 24h volume across tracked tokens</li>
                    <li>• <strong className="text-foreground">Average Score:</strong> Mean SOLRAD score indicating market health</li>
                    <li>• <strong className="text-foreground">Total Liquidity:</strong> Combined liquidity depth of token ecosystem</li>
                    <li>• <strong className="text-foreground">Tokens Tracked:</strong> Number of active tokens meeting criteria</li>
                    <li>• <strong className="text-foreground">Live Indicator:</strong> Shows data freshness and update status</li>
                  </ul>
                </Card>
              </div>
            </div>
          </section>

          <section className="container mx-auto px-4 py-12 bg-muted/30">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8">Dashboard FAQs</h2>
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

          <section className="container mx-auto px-4 py-16 text-center">
            <Card className="p-12 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <h2 className="text-3xl font-bold mb-4">Start Using the Professional Dashboard</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Real-time Solana token analytics, market intelligence, and comprehensive tracking in one powerful platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/">
                  <Button size="lg" className="w-full sm:w-auto gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Open Dashboard
                  </Button>
                </Link>
                <Link href="/tracker">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                    View All Tokens
                  </Button>
                </Link>
              </div>
            </Card>
          </section>
        </main>

        <Footer />
      </div>
    </>
  )
}
