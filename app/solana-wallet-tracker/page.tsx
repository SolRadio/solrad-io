
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wallet, Eye, TrendingUp, Users, Activity, Shield, Zap, Target } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Solana Wallet Tracker | Smart Money Flows | SOLRAD",
  description:
    "Track Solana wallet activity, smart money flows, and whale behavior. Spot early buyer patterns and holder concentrations before the crowd.",
  keywords:
    "solana wallet tracker, track solana wallets, solana whale tracker, smart money solana, solana holder analysis, wallet activity tracker, solana address tracker",
  alternates: {
    canonical: "https://www.solrad.io/solana-wallet-tracker",
  },
  openGraph: {
    title: "Solana Wallet Tracker - Track Smart Money & Whale Wallets | SOLRAD",
    description:
      "Track Solana wallet activity, smart money movements, and whale behavior. Monitor holder concentrations and wallet flows on Solana.",
    url: "https://www.solrad.io/solana-wallet-tracker",
  },
  twitter: {
    card: "summary_large_image",
    title: "Solana Wallet Tracker - Track Smart Money & Whale Wallets | SOLRAD",
    description:
      "Track Solana wallet activity, smart money movements, and whale behavior. Monitor holder concentrations and wallet flows.",
  },
}

export default function SolanaWalletTrackerPage() {
  const faqs = [
    {
      question: "How do I track Solana wallets?",
      answer:
        "SOLRAD provides wallet tracking through holder analysis on individual token pages. Click any token to view holder distribution, concentration metrics, and identify wallet patterns. You can track how many wallets hold a token, detect whale concentration (top 10 holder percentage), and monitor changes in holder counts over time. This helps identify smart money accumulation or whale dumping patterns.",
    },
    {
      question: "Can I track specific wallet addresses on SOLRAD?",
      answer:
        "SOLRAD focuses on aggregate wallet behavior and holder concentration metrics rather than individual wallet tracking. However, you can analyze holder distribution for any token to understand wallet behavior patterns. For detailed individual wallet tracking, you would need to use Solana blockchain explorers like Solscan or Solana Beach alongside SOLRAD's aggregate insights.",
    },
    {
      question: "What is holder concentration and why does it matter?",
      answer:
        "Holder concentration measures what percentage of a token's supply is controlled by the top wallets (typically top 10 holders). High concentration (above 70%) indicates a few wallets control most of the supply, creating rug pull risk. Healthy tokens have distributed holder bases where top 10 holders own less than 50% of supply. SOLRAD displays concentration metrics to help you identify risky wallet distributions.",
    },
    {
      question: "How can I identify smart money wallets?",
      answer:
        "Smart money wallets typically exhibit patterns like: early entry into tokens before major price movements, distributed holdings across multiple promising projects, consistent profit-taking strategies, and avoidance of obvious scams. On SOLRAD, you can identify potential smart money activity by tracking tokens with: growing holder counts despite stable prices, healthy volume-to-liquidity ratios, and early-stage momentum signals before mainstream attention.",
    },
    {
      question: "Does SOLRAD show whale wallet movements?",
      answer:
        "SOLRAD provides aggregate whale behavior insights through holder concentration metrics and volume analysis. You can identify potential whale activity by monitoring: sudden changes in holder concentration, large volume spikes relative to liquidity, and tokens with high top-holder percentages. While SOLRAD doesn't track individual whale wallets by address, the aggregate metrics help you understand overall whale behavior patterns for any token.",
    },
  ]

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        url: "https://www.solrad.io/solana-wallet-tracker",
        name: "Solana Wallet Tracker - Track Smart Money & Whale Wallets",
        description:
          "Track Solana wallet activity, smart money movements, and whale behavior. Monitor holder concentrations, wallet flows, and early buyer patterns.",
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
              name: "Solana Wallet Tracker",
              item: "https://www.solrad.io/solana-wallet-tracker",
            },
          ],
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
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

    <>

        <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
          {/* Hero Section */}
          <section className="container mx-auto px-4 py-16 md:py-24 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 border border-border bg-primary/5">
                <Wallet className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="font-mono text-4xl md:text-5xl font-bold uppercase tracking-tight mb-6 text-foreground text-balance">
              Track Solana Wallet Activity
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Monitor smart money movements, whale behavior, and holder concentrations on Solana. Track wallet activity patterns and identify early accumulation signals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  <Eye className="h-4 w-4" />
                  Start Tracking Wallets
                </Button>
              </Link>
              <Link href="/tracker">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                  View Token Holders
                </Button>
              </Link>
            </div>
          </section>

          {/* What is Wallet Tracking */}
          <section className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">What is Solana Wallet Tracking?</h2>
              <Card className="p-6 mb-8">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  <strong className="text-foreground">Solana wallet tracking</strong> involves monitoring blockchain wallet addresses to understand holder behavior, identify smart money movements, and detect whale activity. By analyzing wallet distributions, holder concentrations, and transaction patterns, traders can gain insights into market sentiment and potential price movements before they occur.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  SOLRAD provides aggregate wallet analysis for every tracked token, showing holder concentrations, wallet distribution patterns, and changes in holder counts over time. This data helps you identify tokens with healthy distributed holder bases versus those with risky whale concentration that could lead to rug pulls or heavy sell pressure.
                </p>
              </Card>
            </div>
          </section>

          {/* Wallet Tracking Features */}
          <section className="container mx-auto px-4 py-12">
            <h2 className="text-3xl font-bold mb-8 text-center">Wallet Tracking Capabilities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Holder Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Monitor total holder counts and track growth patterns. Increasing holders indicate organic adoption while declining counts signal exits.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
                    <Target className="h-6 w-6 text-amber-500" />
                  </div>
                  <CardTitle>Concentration Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    View top holder concentration percentages. Identify whale-dominated tokens versus healthily distributed projects to assess rug pull risk.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                    <Activity className="h-6 w-6 text-green-500" />
                  </div>
                  <CardTitle>Smart Money Signals</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Detect early accumulation patterns and smart money movements through volume analysis and holder growth before major price action.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-cyan-500" />
                  </div>
                  <CardTitle>Behavior Patterns</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Analyze wallet behavior over time. Track accumulation vs distribution phases, identify panic selling, and spot coordinated movements.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* How to Use Wallet Tracking */}
          <section className="container mx-auto px-4 py-12 bg-muted/30">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8">How to Track Solana Wallets with SOLRAD</h2>
              <div className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <Badge variant="default" className="shrink-0">Step 1</Badge>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Select Tokens to Monitor</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Browse SOLRAD's dashboard columns (Trending, Active Trading, New/Early, Fresh Signals) to find interesting tokens. Click any token card to open detailed analytics including wallet and holder information. Focus on tokens with high SOLRAD scores and healthy volume patterns for quality wallet analysis.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <Badge variant="default" className="shrink-0">Step 2</Badge>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Review Holder Distribution</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Check the holder concentration metrics displayed in the token detail view. Look for the "Top 10 Holders" percentage - healthy tokens have concentrations below 50%, while anything above 70% indicates high risk. Compare current holder counts against historical data to spot accumulation or distribution trends.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <Badge variant="default" className="shrink-0">Step 3</Badge>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Identify Wallet Patterns</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Analyze volume-to-liquidity ratios alongside holder data. Smart money accumulation shows: growing holder counts with stable/increasing liquidity, organic volume growth, and improving SOLRAD scores. Whale manipulation shows: high concentration with volatile volume spikes, declining holder counts, or suspicious trading patterns.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <Badge variant="default" className="shrink-0">Step 4</Badge>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Monitor Changes Over Time</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Add tokens to your watchlist and monitor wallet behavior over days or weeks. Consistent holder growth indicates organic adoption. Sudden holder drops signal coordinated exits. Compare wallet patterns across multiple tokens to identify broader market trends or systematic smart money movements across the Solana ecosystem.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </section>

          {/* Wallet Behavior Indicators */}
          <section className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8">Understanding Wallet Behavior Indicators</h2>
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-xl font-bold mb-4">Smart Money Accumulation Signals</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• <strong className="text-foreground">Steady Holder Growth:</strong> Consistent increase in unique wallets holding the token</li>
                    <li>• <strong className="text-foreground">Decreasing Concentration:</strong> Top holder percentage declining as supply distributes</li>
                    <li>• <strong className="text-foreground">Organic Volume:</strong> Trading volume growing proportionally with holder count</li>
                    <li>• <strong className="text-foreground">Price Stability:</strong> Accumulation often occurs with sideways price action before breakouts</li>
                    <li>• <strong className="text-foreground">Low Volatility:</strong> Fewer large price swings indicate patient accumulation by smart money</li>
                  </ul>
                </Card>

                <Card className="p-6">
                  <h3 className="text-xl font-bold mb-4">Whale Manipulation Warning Signs</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• <strong className="text-foreground">High Concentration:</strong> Top 10 holders controlling {">"} 70% of token supply</li>
                    <li>• <strong className="text-foreground">Declining Holders:</strong> Shrinking wallet count while price pumps (coordinated exit)</li>
                    <li>• <strong className="text-foreground">Volume Spikes:</strong> Sudden massive volume followed by immediate price collapse</li>
                    <li>• <strong className="text-foreground">Liquidity Manipulation:</strong> Liquidity added temporarily then removed after price pump</li>
                    <li>• <strong className="text-foreground">Coordinated Buys:</strong> Multiple wallets buying simultaneously (often same entity)</li>
                  </ul>
                </Card>

                <Card className="p-6">
                  <h3 className="text-xl font-bold mb-4">Healthy Distribution Characteristics</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• <strong className="text-foreground">Low Concentration:</strong> Top 10 holders own less than 50% of supply</li>
                    <li>• <strong className="text-foreground">Growing Community:</strong> Holder count increasing steadily over weeks/months</li>
                    <li>• <strong className="text-foreground">Balanced Trading:</strong> No single wallet dominating daily trading volume</li>
                    <li>• <strong className="text-foreground">Stable Holders:</strong> Core holder base remains consistent through price volatility</li>
                    <li>• <strong className="text-foreground">Natural Distribution:</strong> Supply gradually spreading to more wallets over time</li>
                  </ul>
                </Card>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="container mx-auto px-4 py-12 bg-muted/30">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8">Solana Wallet Tracker FAQs</h2>
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
              <h2 className="text-3xl font-bold mb-4">Start Tracking Solana Wallets Today</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Monitor holder behavior, identify smart money movements, and track whale activity across Solana tokens.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/">
                  <Button size="lg" className="w-full sm:w-auto gap-2">
                    <Wallet className="h-4 w-4" />
                    Open Wallet Tracker Dashboard
                  </Button>
                </Link>
                <Link href="/tracker">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                    View Token Analytics
                  </Button>
                </Link>
              </div>
            </Card>
          </section>
        </main>

    </>
    </>
  )
}
