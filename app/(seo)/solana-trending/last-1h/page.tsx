import { getTrackedTokens } from "@/lib/get-tracked-tokens"
import type { TokenScore } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, ExternalLink, Droplets, Activity, Clock, Zap } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Trending Solana Tokens Last Hour | Live 1H Price Movers | SOLRAD",
  description:
    "Solana tokens trending in the last hour. Track 1H price movements, volume spikes, and liquidity changes. Find fast-moving tokens with SOLRAD.",
  alternates: {
    canonical: "https://www.solrad.io/solana-trending/last-1h",
  },
  openGraph: {
    title: "Trending Solana Tokens Last Hour | Live 1H Price Movers",
    description:
      "Track Solana tokens trending in the last hour. Real-time 1H price movers, volume spikes, and new token launches.",
    url: "https://www.solrad.io/solana-trending/last-1h",
    siteName: "SOLRAD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trending Solana Tokens Last Hour | SOLRAD",
    description: "Track Solana tokens trending in the last hour with real-time price and volume data.",
  },
}

export default async function Last1HPage() {
  const allTokens = await getTrackedTokens()
  
  // Filter tokens with 1h data and sort by 1h change
  const trendingTokens = allTokens
    .filter(t => t.priceChange1h !== undefined && t.priceChange1h !== null)
    .sort((a, b) => Math.abs(b.priceChange1h || 0) - Math.abs(a.priceChange1h || 0))
    .slice(0, 100)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Trending Solana Tokens Last Hour",
    description: "Real-time tracking of Solana tokens trending in the last hour with price movements and volume analysis",
    url: "https://www.solrad.io/solana-trending/last-1h",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: trendingTokens.length,
      itemListElement: trendingTokens.slice(0, 10).map((token, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "FinancialProduct",
          name: token.name,
          description: `${token.symbol} - Trending Solana token with ${(token.priceChange1h || 0).toFixed(2)}% 1H change`,
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
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-6 w-6 text-primary" />
            <Badge variant="outline" className="text-xs">Last 1 Hour</Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
            Trending Solana Tokens Last Hour
          </h1>
          <p className="text-xl text-muted-foreground mb-6 text-pretty">
            Real-time tracking of Solana tokens with the highest price movements in the last 60 minutes. Catch fast movers before the crowd.
          </p>
        </div>

        {/* SEO Content */}
        <div className="prose prose-invert max-w-none mb-12">
          <h2 className="text-2xl font-bold mb-4">What Are 1-Hour Trending Tokens?</h2>
          <p className="text-muted-foreground mb-6">
            1-hour trending tokens are Solana cryptocurrencies experiencing significant price movements, volume spikes, or liquidity changes within the last 60 minutes. These ultra-short-term movers represent the fastest-moving opportunities in the Solana ecosystem, perfect for scalpers and momentum traders looking to capitalize on rapid price action.
          </p>
          
          <p className="text-muted-foreground mb-6">
            SOLRAD's 1-hour trending scanner tracks over 500 Solana tokens in real-time, analyzing minute-by-minute price changes, transaction volumes, and liquidity shifts to identify tokens gaining momentum right now. Our system refreshes every 5 minutes, ensuring you see the latest fast movers as they develop.
          </p>

          <h2 className="text-2xl font-bold mb-4 mt-8">How SOLRAD Finds 1-Hour Trending Tokens</h2>
          <p className="text-muted-foreground mb-6">
            Our 1-hour trending algorithm combines multiple data points to identify tokens with genuine momentum:
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <Card className="p-4 bg-card/50 border-border">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">1-Hour Price Change</h3>
                  <p className="text-sm text-muted-foreground">
                    Tracks percentage price movement over the last 60 minutes. Tokens with ±10% or more in 1H show strong momentum.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-card/50 border-border">
              <div className="flex items-start gap-3">
                <Activity className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Volume Acceleration</h3>
                  <p className="text-sm text-muted-foreground">
                    Compares current 1H volume to 24H average. Sudden volume spikes indicate genuine interest, not manipulation.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-card/50 border-border">
              <div className="flex items-start gap-3">
                <Droplets className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Liquidity Depth</h3>
                  <p className="text-sm text-muted-foreground">
                    Ensures sufficient liquidity for safe entry/exit. Filters out low-liquidity pumps that trap traders.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-card/50 border-border">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Momentum Score</h3>
                  <p className="text-sm text-muted-foreground">
                    Combines price velocity, volume strength, and transaction count to rank true momentum plays.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <h2 className="text-2xl font-bold mb-4 mt-8">Why Track 1-Hour Movers?</h2>
          <p className="text-muted-foreground mb-4">
            The 1-hour timeframe is critical for active Solana traders for several reasons:
          </p>

          <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
            <li><strong>Catch Early Momentum:</strong> Identify tokens gaining traction before they hit 24H trending lists on other platforms</li>
            <li><strong>Scalping Opportunities:</strong> Find rapid price movements perfect for quick in-and-out trades with tight risk management</li>
            <li><strong>New Token Launches:</strong> Many new Solana tokens pump hardest in their first 1-2 hours after launch</li>
            <li><strong>News-Driven Pumps:</strong> React quickly to announcements, partnerships, or social media buzz driving sudden price action</li>
            <li><strong>Volume Confirmation:</strong> Verify that price movements are backed by real volume, not low-liquidity manipulation</li>
          </ul>

          <h2 className="text-2xl font-bold mb-4 mt-8">How to Use 1-Hour Trending Data</h2>
          <p className="text-muted-foreground mb-4">
            Here's a proven workflow for trading 1-hour trending tokens on Solana:
          </p>

          <ol className="list-decimal list-inside text-muted-foreground space-y-3 mb-6">
            <li><strong>Scan for Momentum:</strong> Look for tokens with 15%+ price change in 1H plus strong volume (5x+ 24H average)</li>
            <li><strong>Check SOLRAD Score:</strong> Only consider tokens with 60+ score to filter out obvious rugs and scams</li>
            <li><strong>Verify Liquidity:</strong> Ensure minimum $50K liquidity to avoid slippage traps and manipulation</li>
            <li><strong>Review Token Age:</strong> New tokens (under 24H old) are higher risk but offer bigger upside if legitimate</li>
            <li><strong>Set Tight Stops:</strong> 1-hour movers can reverse quickly - use 5-10% stop losses to protect capital</li>
            <li><strong>Take Profits Fast:</strong> Most 1H pumps retrace within 4-6 hours - scale out as price rises</li>
          </ol>

          <h2 className="text-2xl font-bold mb-4 mt-8">1-Hour Trending vs 24-Hour Trending</h2>
          <p className="text-muted-foreground mb-6">
            While 24-hour trending lists show established momentum, 1-hour trending catches tokens at the very start of their move. The key difference is timing and risk:
          </p>

          <p className="text-muted-foreground mb-4">
            <strong>1-Hour Trending (This Page):</strong> Ultra-fast movers with higher volatility. Best for experienced traders who can monitor positions actively. Higher risk, higher potential reward.
          </p>

          <p className="text-muted-foreground mb-6">
            <strong>24-Hour Trending:</strong> More established moves with confirmed volume and momentum. Lower volatility but often less upside remaining. Better for swing traders.
          </p>

          <h2 className="text-2xl font-bold mb-4 mt-8">Safety Tips for 1-Hour Movers</h2>
          <p className="text-muted-foreground mb-4">
            1-hour trending tokens are inherently risky due to their rapid price action. Follow these safety rules:
          </p>

          <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-8">
            <li>Never invest more than 2-5% of your portfolio in any single 1H trending token</li>
            <li>Avoid tokens with liquidity under $25K - they're manipulation targets</li>
            <li>Check token age - brand new tokens (under 1H old) are extremely high risk</li>
            <li>Look for the TRASH badge - if SOLRAD flags it, stay away regardless of price action</li>
            <li>Use limit orders, not market orders, to avoid slippage on volatile tokens</li>
            <li>Monitor continuously - 1H movers can dump as fast as they pump</li>
          </ul>
        </div>

        {/* Token Table */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Live 1-Hour Trending Tokens</h2>
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
                          (token.priceChange1h || 0) >= 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {(token.priceChange1h || 0) >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {(token.priceChange1h || 0) >= 0 ? "+" : ""}
                        {(token.priceChange1h || 0).toFixed(2)}% (1H)
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
          <Link href="/solana-trending/last-6h">
            <Card className="p-6 hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <Clock className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-bold mb-2">6-Hour Trending</h3>
              <p className="text-sm text-muted-foreground">
                Track tokens with sustained momentum over 6 hours
              </p>
            </Card>
          </Link>

          <Link href="/solana-trending/last-24h">
            <Card className="p-6 hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <TrendingUp className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-bold mb-2">24-Hour Trending</h3>
              <p className="text-sm text-muted-foreground">
                View established movers with confirmed 24H volume
              </p>
            </Card>
          </Link>

          <Link href="/solana-trending/by-volume">
            <Card className="p-6 hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <Activity className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-bold mb-2">Trending by Volume</h3>
              <p className="text-sm text-muted-foreground">
                Sort by 24H volume to find highest liquidity tokens
              </p>
            </Card>
          </Link>
        </div>

        {/* FAQ */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="font-bold mb-2">How often does 1-hour trending data update?</h3>
              <p className="text-muted-foreground">
                SOLRAD refreshes 1-hour trending data every 5 minutes, pulling live price and volume data from DexScreener, Jupiter, and on-chain sources via QuickNode RPC. This ensures you see the latest fast movers as soon as they gain momentum.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold mb-2">What's a safe SOLRAD score for 1-hour trending tokens?</h3>
              <p className="text-muted-foreground">
                For 1-hour movers, stick to tokens with scores of 60 or higher. These have verified liquidity, holder distribution, and no major red flags. Tokens under 50 score are high risk and should be avoided unless you're an expert.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold mb-2">How do I avoid pump-and-dump schemes?</h3>
              <p className="text-muted-foreground">
                Check three things: (1) SOLRAD score above 60, (2) liquidity over $50K, (3) no TRASH badge. Also verify that volume is organic - if a token is up 100% in 1H but has only $10K volume, it's likely manipulation.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold mb-2">Can I trade 1-hour trending tokens with bots?</h3>
              <p className="text-muted-foreground">
                Yes, but be cautious. Solana's fast block times make it bot-friendly, but 1-hour movers are extremely volatile. Use strict stop losses and position sizing. Many professional traders use SOLRAD's data to feed their automated strategies.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
