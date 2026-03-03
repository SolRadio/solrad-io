import { getTrackedTokens } from "@/lib/get-tracked-tokens"
import type { TokenScore } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, ExternalLink, Droplets, Activity, BarChart3 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Solana Tokens by Volume | Highest 24H Trading Volume | SOLRAD",
  description:
    "Solana tokens ranked by 24-hour trading volume. Most actively traded tokens with highest liquidity and market interest on SOLRAD.",
  alternates: {
    canonical: "https://www.solrad.io/solana-trending/by-volume",
  },
  openGraph: {
    title: "Solana Tokens by Volume | Highest 24H Trading Volume",
    description:
      "Track Solana tokens ranked by 24H trading volume. Find the most liquid and actively traded tokens.",
    url: "https://www.solrad.io/solana-trending/by-volume",
    siteName: "SOLRAD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Solana Tokens by Volume | SOLRAD",
    description: "Discover Solana's highest volume tokens with live 24H trading data.",
  },
}

export default async function ByVolumePage() {
  const allTokens = await getTrackedTokens()
  
  // Sort by 24h volume
  const volumeLeaders = allTokens
    .sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0))
    .slice(0, 100)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Solana Tokens by Trading Volume",
    description: "Comprehensive ranking of Solana tokens by 24-hour trading volume showing the most actively traded cryptocurrencies",
    url: "https://www.solrad.io/solana-trending/by-volume",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: volumeLeaders.length,
      itemListElement: volumeLeaders.slice(0, 10).map((token, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "FinancialProduct",
          name: token.name,
          description: `${token.symbol} - $${(token.volume24h / 1000000).toFixed(2)}M 24H volume`,
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
            <Activity className="h-6 w-6 text-primary" />
            <Badge variant="outline" className="text-xs">By Volume</Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
            Solana Tokens Ranked by Trading Volume
          </h1>
          <p className="text-xl text-muted-foreground mb-6 text-pretty">
            Discover the most actively traded Solana tokens ranked by 24-hour volume. High volume means deep liquidity, tight spreads, and easy entry/exit for traders of all sizes.
          </p>
        </div>

        {/* SEO Content - Comprehensive volume analysis content would go here */}
        <div className="prose prose-invert max-w-none mb-12">
          <h2 className="text-2xl font-bold mb-4">Why Trading Volume Matters</h2>
          <p className="text-muted-foreground mb-6">
            Trading volume is the lifeblood of cryptocurrency markets. It represents the total dollar value of tokens bought and sold over 24 hours, indicating market interest, liquidity depth, and trading opportunity. High volume tokens are significantly safer and more predictable than low volume alternatives, making volume ranking essential for serious traders.
          </p>

          <h2 className="text-2xl font-bold mb-4 mt-8">Benefits of High Volume Tokens</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <Card className="p-4 bg-card/50 border-border">
              <div className="flex items-start gap-3">
                <Activity className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Tight Spreads</h3>
                  <p className="text-sm text-muted-foreground">
                    High volume means bid-ask spreads are narrow, reducing slippage on market orders.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-card/50 border-border">
              <div className="flex items-start gap-3">
                <Droplets className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Easy Exit</h3>
                  <p className="text-sm text-muted-foreground">
                    You can sell large positions without crashing the price, crucial for risk management.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-card/50 border-border">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Price Discovery</h3>
                  <p className="text-sm text-muted-foreground">
                    More trades mean more accurate pricing and less manipulation by single whales.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-card/50 border-border">
              <div className="flex items-start gap-3">
                <BarChart3 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Market Confidence</h3>
                  <p className="text-sm text-muted-foreground">
                    High volume signals strong market interest and confidence in the token.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Additional comprehensive content here */}
        </div>

        {/* Token Table */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Highest Volume Solana Tokens</h2>
          <div className="grid gap-3">
            {volumeLeaders.map((token, index) => (
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
                      <div className="text-muted-foreground text-xs">Volume 24H</div>
                      <div className="font-mono text-lg font-bold">
                        ${(token.volume24h / 1000000).toFixed(2)}M
                      </div>
                    </div>
                    
                    <div className="text-right text-sm hidden md:block">
                      <div className="text-muted-foreground">Price</div>
                      <div className="font-mono">
                        ${token.priceUsd < 0.01 ? token.priceUsd.toFixed(6) : token.priceUsd.toFixed(4)}
                      </div>
                    </div>
                    
                    <div className="text-right text-sm hidden lg:block">
                      <div className="text-muted-foreground">24H Change</div>
                      <div
                        className={`font-mono ${
                          (token.priceChange24h || 0) >= 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {(token.priceChange24h || 0) >= 0 ? "+" : ""}
                        {(token.priceChange24h || 0).toFixed(2)}%
                      </div>
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

        {/* Internal Links */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link href="/solana-trending/by-liquidity">
            <Card className="p-6 hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <Droplets className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-bold mb-2">By Liquidity</h3>
              <p className="text-sm text-muted-foreground">
                Sort by liquidity depth for lowest slippage
              </p>
            </Card>
          </Link>

          <Link href="/solana-trending/by-holders">
            <Card className="p-6 hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <TrendingUp className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-bold mb-2">By Holders</h3>
              <p className="text-sm text-muted-foreground">
                Find tokens with growing holder counts
              </p>
            </Card>
          </Link>

          <Link href="/solana-trending/last-24h">
            <Card className="p-6 hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <BarChart3 className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-bold mb-2">24H Trending</h3>
              <p className="text-sm text-muted-foreground">
                View tokens by price change percentage
              </p>
            </Card>
          </Link>
        </div>
      </div>
    </>
  )
}
