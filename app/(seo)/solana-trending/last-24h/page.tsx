import { getTrackedTokens } from "@/lib/get-tracked-tokens"
import type { TokenScore } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, ExternalLink, Droplets, Activity, Clock, BarChart3 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Trending Solana Tokens Last 24 Hours | Top Daily Movers | SOLRAD",
  description:
    "Top trending Solana tokens in the last 24 hours. Track daily price movers, volume leaders, and momentum plays with confirmed data and risk scores.",
  alternates: {
    canonical: "https://www.solrad.io/solana-trending/last-24h",
  },
  openGraph: {
    title: "Trending Solana Tokens Last 24 Hours | Top Daily Movers",
    description:
      "Track the top trending Solana tokens over 24 hours with established momentum and confirmed volume.",
    url: "https://www.solrad.io/solana-trending/last-24h",
    siteName: "SOLRAD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trending Solana Tokens Last 24 Hours | SOLRAD",
    description: "Discover top Solana tokens with established 24-hour momentum and volume.",
  },
}

export default async function Last24HPage() {
  const allTokens = await getTrackedTokens()
  
  // Sort by absolute 24h price change
  const trendingTokens = allTokens
    .sort((a, b) => Math.abs(b.priceChange24h || 0) - Math.abs(a.priceChange24h || 0))
    .slice(0, 100)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Trending Solana Tokens Last 24 Hours",
    description: "Comprehensive list of top trending Solana tokens over 24 hours with price movements and volume data",
    url: "https://www.solrad.io/solana-trending/last-24h",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: trendingTokens.length,
      itemListElement: trendingTokens.slice(0, 10).map((token, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "FinancialProduct",
          name: token.name,
          description: `${token.symbol} - Solana token with ${(token.priceChange24h || 0).toFixed(2)}% 24H change`,
        },
      })),
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-6 w-6 text-primary" />
            <Badge variant="outline" className="text-xs">Last 24 Hours</Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
            Trending Solana Tokens Last 24 Hours
          </h1>
          <p className="text-xl text-muted-foreground mb-6 text-pretty">
            Track the top trending Solana tokens over 24 hours. Find established momentum plays with confirmed volume and reduced volatility for swing trading.
          </p>
        </div>

        {/* SEO Content */}
        <div className="prose prose-invert max-w-none mb-12">
          <h2 className="text-2xl font-bold mb-4">What Are 24-Hour Trending Tokens?</h2>
          <p className="text-muted-foreground mb-6">
            24-hour trending tokens represent the most established momentum plays in the Solana ecosystem. These are tokens that have sustained price movement and volume over a full trading day, proving they have genuine interest beyond short-term hype. Unlike 1-hour or 6-hour movers that can reverse quickly, 24H trending tokens show confirmed market interest with higher probability of continuation.
          </p>
          
          <p className="text-muted-foreground mb-6">
            SOLRAD's 24-hour trending list is the gold standard for swing traders and position traders who want to hold tokens overnight or for multiple days. These tokens have weathered at least one full day of trading, survived normal volatility, and emerged with sustained momentum. This makes them significantly safer than shorter timeframe movers, though with less explosive upside potential remaining.
          </p>

          <h2 className="text-2xl font-bold mb-4 mt-8">Why 24-Hour Data Matters Most</h2>
          <p className="text-muted-foreground mb-6">
            The 24-hour timeframe is the industry standard for crypto trending lists for good reasons:
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <Card className="p-4 bg-card/50 border-border">
              <div className="flex items-start gap-3">
                <Activity className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Full Trading Cycle</h3>
                  <p className="text-sm text-muted-foreground">
                    Captures all major trading sessions (Asia, Europe, US) to ensure global volume confirmation.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-card/50 border-border">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Proven Momentum</h3>
                  <p className="text-sm text-muted-foreground">
                    Tokens that trend for 24 hours have proven they're not just pump-and-dumps but have sustained interest.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-card/50 border-border">
              <div className="flex items-start gap-3">
                <Droplets className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Liquidity Maturity</h3>
                  <p className="text-sm text-muted-foreground">
                    24H trending tokens typically have deeper liquidity, making entries and exits easier with less slippage.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-card/50 border-border">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">News Validation</h3>
                  <p className="text-sm text-muted-foreground">
                    If a token is pumping on news, 24H confirms the news is real and impactful, not just a rumor.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <h2 className="text-2xl font-bold mb-4 mt-8">How SOLRAD Ranks 24-Hour Trending Tokens</h2>
          <p className="text-muted-foreground mb-6">
            Our 24-hour trending algorithm combines multiple factors to surface the most significant movers:
          </p>

          <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
            <li><strong>Absolute Price Change:</strong> Tokens with largest percentage moves over 24H, both upward and downward</li>
            <li><strong>Volume-Weighted Ranking:</strong> Higher volume movers rank above similar-percentage low-volume tokens</li>
            <li><strong>Consistency Score:</strong> Tokens that moved steadily over 24H rank above volatile spike-and-crash patterns</li>
            <li><strong>SOLRAD Score Integration:</strong> Quality filters ensure scams and rugs don't make the list despite price pumps</li>
            <li><strong>Holder Growth:</strong> Tokens gaining new holders over 24H rank higher as it indicates real adoption</li>
          </ul>

          <h2 className="text-2xl font-bold mb-4 mt-8">24-Hour Trading Strategies</h2>
          <p className="text-muted-foreground mb-4">
            Different approaches for different trader profiles:
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-6">Swing Trading Strategy (1-7 Day Holds)</h3>
          <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-6">
            <li>Identify tokens in top 20 of 24H trending with SOLRAD score 70+</li>
            <li>Check that 24H volume is 10x+ higher than 7-day average (confirming breakout)</li>
            <li>Enter on first pullback after initial 24H surge (don't chase)</li>
            <li>Set stop loss 20% below entry and target 50-100% profit over 3-5 days</li>
            <li>Take partial profits at key resistance levels and trail stops</li>
          </ol>

          <h3 className="text-xl font-semibold mb-3 mt-6">Position Trading Strategy (1-4 Week Holds)</h3>
          <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-6">
            <li>Focus on top 10 tokens with 24H trending AND strong fundamentals</li>
            <li>Look for tokens with growing holder count, increasing liquidity, and no major red flags</li>
            <li>Only tokens with 75+ SOLRAD score qualify for position trades</li>
            <li>Enter gradually over 2-3 days to avoid buying the peak</li>
            <li>Target 100-300% gains and be patient - let winners run</li>
          </ol>

          <h2 className="text-2xl font-bold mb-4 mt-8">Reading 24-Hour Charts Like a Pro</h2>
          <p className="text-muted-foreground mb-6">
            When analyzing 24H trending tokens, look for these patterns:
          </p>

          <p className="text-muted-foreground mb-4">
            <strong>Bullish Patterns to Enter:</strong>
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
            <li>Higher highs and higher lows throughout the 24H period - classic uptrend</li>
            <li>Morning pump that consolidates for 6-8 hours then breaks higher - shows strength</li>
            <li>Volume increasing on green candles, decreasing on red - healthy accumulation</li>
            <li>Breaking above previous 7-day highs with strong volume - breakout confirmation</li>
          </ul>

          <p className="text-muted-foreground mb-4">
            <strong>Bearish Patterns to Avoid:</strong>
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
            <li>Single spike followed by 20H of decline - pump failed to hold</li>
            <li>Lower highs forming even as token stays on 24H list - momentum dying</li>
            <li>Volume declining throughout the day - buying interest exhausted</li>
            <li>Large red candles with higher volume than green - distribution happening</li>
          </ul>

          <h2 className="text-2xl font-bold mb-4 mt-8">Common Mistakes with 24H Trending</h2>
          <p className="text-muted-foreground mb-6">
            Even with confirmed 24H momentum, traders make these errors:
          </p>

          <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-8">
            <li><strong>Chasing Peaks:</strong> Buying when a token first appears on 24H trending often means you're late - wait for pullback</li>
            <li><strong>Ignoring SOLRAD Score:</strong> A token can pump 200% in 24H and still be a rug if score is under 50</li>
            <li><strong>No Exit Plan:</strong> Holding too long hoping for more gains - most 24H movers peak within 2-5 days</li>
            <li><strong>Over-Leveraging:</strong> Even "safe" 24H movers can dump 30% in hours - size positions appropriately</li>
            <li><strong>Ignoring Market Context:</strong> If overall Solana market is dumping, even trending tokens will struggle</li>
          </ul>

          <h2 className="text-2xl font-bold mb-4 mt-8">24H Trending vs Shorter Timeframes</h2>
          <p className="text-muted-foreground mb-6">
            Here's how 24-hour trending compares to faster timeframes:
          </p>

          <div className="overflow-x-auto mb-8">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3">Timeframe</th>
                  <th className="text-left p-3">Best For</th>
                  <th className="text-left p-3">Volatility</th>
                  <th className="text-left p-3">Upside Remaining</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="p-3 font-medium">1-Hour</td>
                  <td className="p-3 text-muted-foreground">Scalpers</td>
                  <td className="p-3 text-muted-foreground">Extreme</td>
                  <td className="p-3 text-muted-foreground">50-200%</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-3 font-medium">6-Hour</td>
                  <td className="p-3 text-muted-foreground">Day Traders</td>
                  <td className="p-3 text-muted-foreground">High</td>
                  <td className="p-3 text-muted-foreground">30-100%</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-3 font-medium">24-Hour</td>
                  <td className="p-3 text-muted-foreground">Swing Traders</td>
                  <td className="p-3 text-muted-foreground">Moderate</td>
                  <td className="p-3 text-muted-foreground">20-80%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-2xl font-bold mb-4 mt-8">Advanced: Using 24H Data for Reversal Plays</h2>
          <p className="text-muted-foreground mb-6">
            Experienced traders can use 24H trending to spot reversal opportunities:
          </p>

          <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-8">
            <li>Token down 40%+ in 24H with SOLRAD score 75+ may be oversold - watch for bounce</li>
            <li>If negative 24H trending coincides with positive news, it's often a buying opportunity</li>
            <li>Tokens that drop 24H but maintain high volume often bounce quickly as shorts cover</li>
            <li>Look for divergence: price down but holders increasing = accumulation at lower prices</li>
          </ul>
        </div>

        {/* Token Table */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Live 24-Hour Trending Tokens</h2>
          <div className="grid gap-3">
            {trendingTokens.map((token, index) => (
              <Link key={token.address} href={`/token/${token.address}`}>
                <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="text-muted-foreground font-mono text-sm w-8">
                      #{index + 1}
                    </div>
                    
                    <Image
                      src={token.imageUrl || "/placeholder.svg"}
                      alt={token.symbol}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-bold">{token.symbol}</div>
                      <div className="text-sm text-muted-foreground truncate">{token.name}</div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-mono text-sm">
                        ${token.priceUsd < 0.01 ? token.priceUsd.toFixed(6) : token.priceUsd.toFixed(4)}
                      </div>
                      <div
                        className={`flex items-center gap-1 text-sm font-medium justify-end ${
                          (token.priceChange24h || 0) >= 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {(token.priceChange24h || 0) >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {(token.priceChange24h || 0) >= 0 ? "+" : ""}
                        {(token.priceChange24h || 0).toFixed(2)}% (24H)
                      </div>
                    </div>
                    
                    <div className="text-right text-sm hidden md:block">
                      <div className="text-muted-foreground">Vol 24H</div>
                      <div className="font-mono">${(token.volume24h / 1000000).toFixed(2)}M</div>
                    </div>
                    
                    <div className="text-right text-sm hidden lg:block">
                      <div className="text-muted-foreground">Liquidity</div>
                      <div className="font-mono">${(token.liquidity / 1000).toFixed(0)}K</div>
                    </div>
                    
                    <Badge
                      variant={
                        token.totalScore >= 75
                          ? "default"
                          : token.totalScore >= 50
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {token.totalScore}
                    </Badge>
                    
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Internal Linking Grid */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link href="/solana-trending/by-volume">
            <Card className="p-6 hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <Activity className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-bold mb-2">Trending by Volume</h3>
              <p className="text-sm text-muted-foreground">
                Sort tokens by 24H trading volume for liquidity leaders
              </p>
            </Card>
          </Link>

          <Link href="/solana-trending/by-holders">
            <Card className="p-6 hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <TrendingUp className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-bold mb-2">Trending by Holders</h3>
              <p className="text-sm text-muted-foreground">
                Find tokens with growing holder bases for adoption signals
              </p>
            </Card>
          </Link>

          <Link href="/">
            <Card className="p-6 hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <BarChart3 className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-bold mb-2">SOLRAD Dashboard</h3>
              <p className="text-sm text-muted-foreground">
                Access full token scanner with live SOLRAD scores
              </p>
            </Card>
          </Link>
        </div>

        {/* FAQ */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="font-bold mb-2">When is the best time to buy 24H trending tokens?</h3>
              <p className="text-muted-foreground">
                The optimal entry is during the first major pullback after initial pump. This usually happens 6-12 hours after the token starts trending. Avoid buying at the peak when everyone is FOMOing in.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold mb-2">How long do 24H trending tokens typically maintain momentum?</h3>
              <p className="text-muted-foreground">
                Most maintain strong momentum for 2-7 days after appearing on 24H lists. After that, they either consolidate into a new range or begin declining. Set profit targets accordingly and don't get greedy.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold mb-2">Should I hold 24H trending tokens overnight?</h3>
              <p className="text-muted-foreground">
                Yes, 24H trending tokens are specifically suited for overnight holds and multi-day swings. They have proven stability compared to 1H or 6H movers. However, always use stop losses in case of market-wide dumps.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold mb-2">What's a good SOLRAD score for 24H trending swing trades?</h3>
              <p className="text-muted-foreground">
                For swing trades lasting multiple days, stick to tokens with 70+ SOLRAD scores. These have sufficient liquidity, decent holder distribution, and lower rug risk. Avoid anything under 60 for overnight holds.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
