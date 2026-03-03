import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Laugh, Radar, TrendingUp, Shield, Zap, Activity, Search, Target } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Solana Meme Coin Scanner - Track Trending Solana Tokens",
  description:
    "Scan all Solana SPL tokens in real-time. Track trending tokens including meme coins, DeFi, and utility projects. Analyze liquidity, risk, and viral potential across every Solana token category.",
  keywords:
    "solana meme coin scanner, solana token scanner, solana meme tokens, solana SPL tokens, viral meme coins, solana token tracker, meme token finder, solana DeFi tokens, solana radar",
  alternates: {
    canonical: "https://www.solrad.io/solana-meme-coin-scanner",
  },
  openGraph: {
    title: "Solana Meme Coin Scanner - Track All Trending Solana Tokens | SOLRAD",
    description:
      "Scan all Solana SPL tokens in real-time. Track trending tokens including meme coins, DeFi, and utility projects with SOLRAD intelligence.",
    url: "https://www.solrad.io/solana-meme-coin-scanner",
  },
  twitter: {
    card: "summary_large_image",
    title: "Solana Meme Coin Scanner - Track All Trending Solana Tokens | SOLRAD",
    description:
      "Scan all Solana SPL tokens in real-time. Track trending tokens and identify viral potential with SOLRAD scoring.",
  },
}

export default function SolanaMemeCoinScannerPage() {
  const faqs = [
    {
      question: "What types of Solana tokens does SOLRAD scan?",
      answer:
        "SOLRAD scans all Solana SPL tokens, not just meme coins. This includes DeFi tokens, utility tokens, gaming tokens, meme coins, and any other SPL token with sufficient liquidity. Whether a token launched on Pump.fun, Raydium, Orca, or any other platform, SOLRAD detects and scores it based on liquidity health, volume patterns, holder distribution, and risk indicators.",
    },
    {
      question: "How do I find trending Solana tokens?",
      answer:
        "Use SOLRAD's dashboard to monitor the Trending and Active Trading columns, which feature tokens gaining traction across all categories. Look for tokens with: high SOLRAD scores (indicating healthy fundamentals), rapidly growing holder counts (community adoption), increasing volume-to-liquidity ratios (organic interest), and consistent momentum. The Fresh Signals column shows newly launched tokens before they trend.",
    },
    {
      question: "Are new Solana tokens safe to invest in?",
      answer:
        "New tokens -- whether meme coins, DeFi projects, or utility tokens -- carry significantly higher risk than established cryptocurrencies. Many are pump-and-dump schemes or rug pulls. SOLRAD helps you assess token safety through: liquidity depth analysis (avoiding low-liquidity scams), holder concentration metrics (identifying whale manipulation), risk classification systems, and contract safety checks. Always verify burn/lock status of liquidity and mint authority before investing.",
    },
    {
      question: "What makes a successful Solana token?",
      answer:
        "Successful tokens typically have: (1) Strong community engagement and active social media presence, (2) Healthy liquidity depth ($500K+) with locked/burned LP, (3) Fair distribution without extreme whale concentration, (4) Organic volume growth driven by genuine interest, (5) Safe contract structure with burned mint authority, (6) Clear value proposition -- whether cultural relevance for meme coins or genuine utility for DeFi/gaming tokens, (7) Active development team engaging with community. SOLRAD's scoring system evaluates these fundamentals automatically across all token types.",
    },
    {
      question: "How often do new Solana tokens launch?",
      answer:
        "Hundreds of new SPL tokens launch on Solana daily across platforms like Pump.fun, Raydium, and Orca -- spanning meme coins, DeFi, gaming, and utility projects. SOLRAD continuously monitors all new token launches and scores them based on liquidity health, volume patterns, and risk indicators. The Fresh Signals column shows recently discovered tokens that have established sufficient liquidity and are beginning to show momentum. Most new tokens fail quickly, so SOLRAD's filtering helps you focus on tokens with actual potential.",
    },
  ]

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        url: "https://www.solrad.io/solana-meme-coin-scanner",
        name: "Solana Meme Coin Scanner - Track All Trending Solana Tokens",
        description:
          "Scan all Solana SPL tokens in real-time. Track trending tokens including meme coins, DeFi, and utility projects. Analyze liquidity and risk.",
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
                <Laugh className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Solana <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Meme Coin Scanner</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Track trending Solana tokens in real-time. Identify viral potential, analyze fundamentals, and discover SPL tokens -- from meme coins to DeFi and utility projects -- before they moon.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  <Radar className="h-4 w-4" />
                  Scan Solana Tokens Now
                </Button>
              </Link>
              <Link href="/tracker">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                  View All Tokens
                </Button>
              </Link>
            </div>
          </section>

          <section className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">What Does SOLRAD Scan?</h2>
              <Card className="p-6 mb-8">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  <strong className="text-foreground">SOLRAD scans all Solana SPL tokens</strong> -- from meme coins and DeFi protocols to gaming tokens and utility projects. Any token with sufficient liquidity on Solana is automatically detected, scored, and tracked regardless of its category or launch platform.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  The Solana blockchain has become the most active chain for new token launches due to its low transaction fees and fast speeds. Platforms like Pump.fun, Raydium, Orca, and Jupiter host tokens across every category. SOLRAD monitors all of them, helping you identify which tokens have healthy fundamentals and genuine momentum versus obvious scams.
                </p>
              </Card>
            </div>
          </section>

          <section className="container mx-auto px-4 py-12">
            <h2 className="text-3xl font-bold mb-8 text-center">Token Scanner Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Radar className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Real-Time Scanning</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Continuous monitoring of new SPL token launches across all Solana platforms including Pump.fun, Raydium, Orca, and Jupiter.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-green-500" />
                  </div>
                  <CardTitle>Viral Potential Detection</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Identify tokens with viral momentum through holder growth analysis, volume acceleration, and social engagement metrics.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-amber-500" />
                  </div>
                  <CardTitle>Scam Detection</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Automatic filtering of obvious scams through liquidity checks, holder concentration analysis, and contract safety verification.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4">
                    <Activity className="h-6 w-6 text-cyan-500" />
                  </div>
                  <CardTitle>Community Signals</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Track organic community growth through holder count increases, volume patterns, and sustained trading activity.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="container mx-auto px-4 py-12 bg-muted/30">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8">How to Use the Token Scanner</h2>
              <div className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <Badge variant="default">Step 1</Badge>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Monitor Fresh Launches</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Check the Fresh Signals column for newly launched tokens across all categories. Focus on tokens with SOLRAD scores above 60 and healthy liquidity ($100K+). Avoid tokens with "High Risk" or "Critical Risk" labels which often indicate scams.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <Badge variant="default">Step 2</Badge>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Verify Liquidity Safety</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Click promising tokens to check if liquidity is locked or burned. Legitimate projects have LP locks or burned LP tokens visible on blockchain explorers. Verify mint authority is burned to prevent unlimited token creation.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <Badge variant="default">Step 3</Badge>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Assess Community Strength</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Analyze holder growth trends and trading patterns. Strong tokens show consistent holder increases over days/weeks. Check social media presence through linked Twitter/X accounts. Organic communities have engaged followers, not bot armies.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <Badge variant="default">Step 4</Badge>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Monitor Viral Momentum</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Track volume acceleration and SOLRAD score improvements. Tokens gaining momentum show exponential growth in volume-to-liquidity ratios. Add promising tokens to your watchlist to monitor their trajectory. Act fast but verify fundamentals first.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </section>

          <section className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8">Token Red Flags vs Green Flags</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6 border-red-500/20">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="text-red-500">🚩</span> Red Flags - Avoid
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Liquidity below $50K or unlocked LP</li>
                    <li>• Top 10 holders own {">"} 70% of supply</li>
                    <li>• Active mint authority (unlimited printing)</li>
                    <li>• No social media presence or dead community</li>
                    <li>• Sudden volume spikes followed by crashes</li>
                    <li>• Anonymous team with no transparency</li>
                    <li>• Promises of guaranteed returns or unrealistic claims</li>
                    <li>• Copy-paste code from other failed tokens</li>
                  </ul>
                </Card>

                <Card className="p-6 border-green-500/20">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="text-green-500">✓</span> Green Flags - Promising
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Liquidity $200K+ with burned or locked LP</li>
                    <li>• Distributed holders (top 10 {"<"} 50%)</li>
                    <li>• Burned mint authority (no infinite supply)</li>
                    <li>• Active, engaged community on social media</li>
                    <li>• Organic volume growth over days/weeks</li>
                    <li>• Transparent team or known community builders</li>
                    <li>• Cultural relevance or viral meme potential</li>
                    <li>• Consistent holder growth through price volatility</li>
                  </ul>
                </Card>
              </div>
            </div>
          </section>

          <section className="container mx-auto px-4 py-12 bg-muted/30">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8">Token Scanner FAQs</h2>
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
              <h2 className="text-3xl font-bold mb-4">Start Scanning Solana Tokens</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Discover trending SPL tokens across every category, analyze fundamentals, and find the next breakout Solana token before it moons.
              </p>
              <Link href="/">
                <Button size="lg" className="gap-2">
                  <Laugh className="h-4 w-4" />
                  Open Token Scanner
                </Button>
              </Link>
            </Card>
          </section>
        </main>

        <Footer />
      </div>
    </>
  )
}
