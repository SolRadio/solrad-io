import { getTrackedTokens } from "@/lib/get-tracked-tokens"
import type { TokenScore } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, ExternalLink, Droplets, Activity, Clock, Target } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Trending Solana Tokens Last 6 Hours | Live 6H Price Movers | SOLRAD",
  description:
    "Solana tokens trending in the last 6 hours. Monitor mid-term momentum, sustained volume, and breakout opportunities with SOLRAD.",
  alternates: {
    canonical: "https://www.solrad.io/solana-trending/last-6h",
  },
  openGraph: {
    title: "Trending Solana Tokens Last 6 Hours | Live 6H Price Movers",
    description:
      "Track Solana tokens with sustained momentum over 6 hours. Real-time 6H price movers and volume analysis.",
    url: "https://www.solrad.io/solana-trending/last-6h",
    siteName: "SOLRAD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trending Solana Tokens Last 6 Hours | SOLRAD",
    description: "Monitor Solana tokens with 6-hour momentum and sustained volume growth.",
  },
}

export default async function Last6HPage() {
  const allTokens = await getTrackedTokens()
  
  // Filter tokens with 6h data and sort by 6h change
  const trendingTokens = allTokens
    .filter(t => t.priceChange6h !== undefined && t.priceChange6h !== null)
    .sort((a, b) => Math.abs(b.priceChange6h || 0) - Math.abs(a.priceChange6h || 0))
    .slice(0, 100)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Trending Solana Tokens Last 6 Hours",
    description: "Real-time tracking of Solana tokens trending over the last 6 hours with sustained momentum and volume analysis",
    url: "https://www.solrad.io/solana-trending/last-6h",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: trendingTokens.length,
      itemListElement: trendingTokens.slice(0, 10).map((token, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "FinancialProduct",
          name: token.name,
          description: `${token.symbol} - Solana token with ${(token.priceChange6h || 0).toFixed(2)}% 6H change`,
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
            <Target className="h-6 w-6 text-primary" />
            <Badge variant="outline" className="text-xs">Last 6 Hours</Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
            Trending Solana Tokens Last 6 Hours
          </h1>
          <p className="text-xl text-muted-foreground mb-6 text-pretty">
            Track Solana tokens with sustained momentum over 6 hours. Find tokens with confirmed volume and reduced noise from 1-hour spikes.
          </p>
        </div>

        {/* SEO Content */}
        <div className="prose prose-invert max-w-none mb-12">
          <h2 className="text-2xl font-bold mb-4">What Are 6-Hour Trending Tokens?</h2>
          <p className="text-muted-foreground mb-6">
            6-hour trending tokens represent the sweet spot between ultra-fast 1-hour movers and slower 24-hour trends. This timeframe captures tokens with sustained momentum that have proven staying power beyond initial hype spikes. These are tokens where early buyers are still holding, volume remains elevated, and price action shows continuation patterns rather than reversal.
          </p>
          
          <p className="text-muted-foreground mb-6">
            SOLRAD's 6-hour trending scanner filters out flash-in-the-pan pumps that die within an hour, focusing instead on tokens with genuine interest that could sustain momentum through a full trading session. This makes the 6H timeframe ideal for day traders who want confirmed moves but aren't ready to hold overnight.
          </p>

          <h2 className="text-2xl font-bold mb-4 mt-8">Why 6 Hours Matters for Solana Trading</h2>
          <p className="text-muted-foreground mb-6">
            The 6-hour window is strategically important in crypto markets for several reasons:
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <Card className="p-4 bg-card/50 border-border">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Session-Based Trading</h3>
                  <p className="text-sm text-muted-foreground">
                    Six hours aligns with typical day trading sessions. Tokens that maintain momentum for 6H often continue through to end of day.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-card/50 border-border">
              <div className="flex items-start gap-3">
                <Activity className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Volume Confirmation</h3>
                  <p className="text-sm text-muted-foreground">
                    6 hours provides enough data to confirm real volume vs wash trading. Sustained buying over 6H indicates organic demand.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-card/50 border-border">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Trend Stability</h3>
                  <p className="text-sm text-muted-foreground">
                    Filters out noise from 1H spikes while catching moves before they're widely known on 24H lists.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-card/50 border-border">
              <div className="flex items-start gap-3">
                <Droplets className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Lower Volatility</h3>
                  <p className="text-sm text-muted-foreground">
                    Less whipsaw than 1H movers but more upside potential than 24H movers. Balanced risk/reward profile.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <h2 className="text-2xl font-bold mb-4 mt-8">How SOLRAD Identifies 6-Hour Momentum</h2>
          <p className="text-muted-foreground mb-6">
            Our 6-hour trending algorithm looks for tokens with sustained momentum characteristics:
          </p>

          <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
            <li><strong>Consistent Price Action:</strong> Tokens showing steady upward or downward movement without extreme 15-minute candle spikes</li>
            <li><strong>Volume Persistence:</strong> Trading volume that remains elevated across multiple 1-hour periods, not just one spike</li>
            <li><strong>Holder Retention:</strong> Wallet data showing holders are accumulating or holding, not dumping into the rally</li>
            <li><strong>Liquidity Growth:</strong> Liquidity pools growing as token gains momentum, reducing rug pull risk</li>
            <li><strong>Multi-Source Confirmation:</strong> Price movement confirmed across DexScreener, Jupiter, and on-chain data</li>
          </ul>

          <h2 className="text-2xl font-bold mb-4 mt-8">6-Hour Trading Strategy</h2>
          <p className="text-muted-foreground mb-4">
            Here's how professional traders use 6-hour trending data:
          </p>

          <ol className="list-decimal list-inside text-muted-foreground space-y-3 mb-6">
            <li><strong>Entry Timing:</strong> Look for tokens that have been trending 4-6 hours but haven't reached 24H lists yet</li>
            <li><strong>Volume Validation:</strong> Confirm that 6H volume is 3x+ higher than average hourly volume</li>
            <li><strong>SOLRAD Score Check:</strong> Only trade tokens with 65+ score to avoid scams with fake momentum</li>
            <li><strong>Liquidity Requirement:</strong> Minimum $100K liquidity for 6H trades to ensure you can exit without slippage</li>
            <li><strong>Position Sizing:</strong> Allocate 5-10% of trading capital to 6H movers - more stable than 1H but still volatile</li>
            <li><strong>Profit Taking:</strong> Set initial target at +25% and trail stops to lock in gains as momentum continues</li>
          </ol>

          <h2 className="text-2xl font-bold mb-4 mt-8">6H vs 1H vs 24H: Which is Best?</h2>
          <p className="text-muted-foreground mb-6">
            Each timeframe serves different trading styles and risk tolerances:
          </p>

          <p className="text-muted-foreground mb-4">
            <strong>1-Hour Trending:</strong> Best for scalpers and active monitors. Highest volatility, highest reward, highest risk. Requires constant attention.
          </p>

          <p className="text-muted-foreground mb-4">
            <strong>6-Hour Trending (This Page):</strong> Ideal for day traders who want confirmed momentum without overnight risk. Balanced volatility with better risk/reward than 1H. Can be monitored every 1-2 hours.
          </p>

          <p className="text-muted-foreground mb-6">
            <strong>24-Hour Trending:</strong> Suited for swing traders comfortable holding overnight. Lower volatility, more established trends, but less upside potential remaining. Can be checked 2-3 times per day.
          </p>

          <h2 className="text-2xl font-bold mb-4 mt-8">Reading 6-Hour Chart Patterns</h2>
          <p className="text-muted-foreground mb-6">
            When analyzing 6-hour trending tokens, look for these bullish patterns:
          </p>

          <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
            <li><strong>Ascending Triangle:</strong> Higher lows over 6 hours with resistance at a key level - breakout often leads to continuation</li>
            <li><strong>Steady Climb:</strong> Consistent 2-3% gains each hour without major retracements - shows strong accumulation</li>
            <li><strong>Volume Expansion:</strong> Each green candle has higher volume than the last - indicates growing buyer interest</li>
            <li><strong>Support Holding:</strong> When token dips intraday but bounces at same level - shows demand at that price</li>
          </ul>

          <p className="text-muted-foreground mb-8">
            Conversely, avoid tokens showing: sharp 1H spike followed by 5H sideways (likely pump exhausted), declining volume on green candles (weak buying), or lower highs forming (downtrend starting).
          </p>

          <h2 className="text-2xl font-bold mb-4 mt-8">Risk Management for 6H Movers</h2>
          <p className="text-muted-foreground mb-4">
            While 6-hour movers are more stable than 1H spikes, they still require careful risk management:
          </p>

          <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-8">
            <li>Use 10-15% stop losses to protect against sudden reversals</li>
            <li>Never allocate more than 10% of your portfolio to a single 6H trending token</li>
            <li>Check for upcoming token unlocks or vesting schedules that could trigger dumps</li>
            <li>Monitor on-chain metrics - if whale wallets start moving tokens to exchanges, exit</li>
            <li>Be cautious of tokens that pump 6H on weekends - often lower liquidity and easier to manipulate</li>
            <li>Always verify SOLRAD score is 65+ and no TRASH badge before entering</li>
          </ul>
        </div>

        {/* Token Table */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Live 6-Hour Trending Tokens</h2>
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
                          (token.priceChange6h || 0) >= 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {(token.priceChange6h || 0) >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {(token.priceChange6h || 0) >= 0 ? "+" : ""}
                        {(token.priceChange6h || 0).toFixed(2)}% (6H)
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
          <Link href="/solana-trending/last-1h">
            <Card className="p-6 hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <Clock className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-bold mb-2">1-Hour Trending</h3>
              <p className="text-sm text-muted-foreground">
                Catch the fastest movers in their first 60 minutes
              </p>
            </Card>
          </Link>

          <Link href="/solana-trending/last-24h">
            <Card className="p-6 hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <TrendingUp className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-bold mb-2">24-Hour Trending</h3>
              <p className="text-sm text-muted-foreground">
                View tokens with established 24H momentum
              </p>
            </Card>
          </Link>

          <Link href="/solana-trending/by-liquidity">
            <Card className="p-6 hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <Droplets className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-bold mb-2">Trending by Liquidity</h3>
              <p className="text-sm text-muted-foreground">
                Sort by liquidity depth for safest entries
              </p>
            </Card>
          </Link>
        </div>

        {/* FAQ */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="font-bold mb-2">Is 6-hour trending more reliable than 1-hour?</h3>
              <p className="text-muted-foreground">
                Yes, generally. 6-hour trending filters out flash pumps and wash trading that show up on 1H lists. Tokens that maintain momentum for 6 hours have proven staying power and are less likely to immediately reverse.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold mb-2">Can I swing trade 6-hour trending tokens?</h3>
              <p className="text-muted-foreground">
                While possible, 6H trending is optimized for day trading. For swing trades (holding 1-7 days), use 24H trending data which shows more established trends. 6H movers can still reverse before market close.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold mb-2">What time of day is best for 6H movers?</h3>
              <p className="text-muted-foreground">
                Tokens that start trending between 6am-12pm EST often have the best follow-through, as they capture both Asian and US trading sessions. Avoid tokens that pump late at night (after 10pm EST) as volume is thinner.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold mb-2">How do I know when to exit a 6H trending token?</h3>
              <p className="text-muted-foreground">
                Set multiple exit targets: take 25% profit at +20%, another 25% at +40%, and trail the rest. If price crosses below the 6H low, exit immediately as the trend may be breaking.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
