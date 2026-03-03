import { getTrackedTokens } from "@/lib/get-tracked-tokens"
import type { TokenScore } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, ExternalLink, Droplets, Activity, Users } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Solana Tokens by Liquidity | Highest Liquidity Pools | SOLRAD",
  description:
    "Solana tokens ranked by liquidity depth. Deepest pools for minimal slippage, safer trading, and lower rug pull risk on Solana DEXs.",
  alternates: {
    canonical: "https://www.solrad.io/solana-trending/by-liquidity",
  },
  openGraph: {
    title: "Solana Tokens by Liquidity | Highest Liquidity Pools",
    description:
      "Track Solana tokens with the deepest liquidity for safest trading with minimal slippage.",
    url: "https://www.solrad.io/solana-trending/by-liquidity",
    siteName: "SOLRAD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Solana Tokens by Liquidity | SOLRAD",
    description: "Find Solana's highest liquidity tokens for safest trading with minimal slippage.",
  },
}

export default async function ByLiquidityPage() {
  const allTokens = await getTrackedTokens()
  
  // Sort by liquidity
  const liquidityLeaders = allTokens
    .sort((a, b) => (b.liquidity || 0) - (a.liquidity || 0))
    .slice(0, 100)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Solana Tokens by Liquidity",
    description: "Comprehensive ranking of Solana tokens by liquidity depth showing the safest and most liquid trading pairs",
    url: "https://www.solrad.io/solana-trending/by-liquidity",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: liquidityLeaders.length,
      itemListElement: liquidityLeaders.slice(0, 10).map((token, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "FinancialProduct",
          name: token.name,
          description: `${token.symbol} - $${(token.liquidity / 1000000).toFixed(2)}M liquidity`,
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
            <Droplets className="h-6 w-6 text-primary" />
            <Badge variant="outline" className="text-xs">By Liquidity</Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
            Solana Tokens Ranked by Liquidity
          </h1>
          <p className="text-xl text-muted-foreground mb-6 text-pretty">
            Track Solana tokens with the deepest liquidity pools. High liquidity means minimal slippage, easy entry/exit, and significantly lower rug pull risk.
          </p>
        </div>

        {/* Token Table */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Highest Liquidity Solana Tokens</h2>
          <div className="grid gap-3">
            {liquidityLeaders.map((token, index) => (
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
                      <div className="text-muted-foreground text-xs">Liquidity</div>
                      <div className="font-mono text-lg font-bold">
                        ${(token.liquidity / 1000000).toFixed(2)}M
                      </div>
                    </div>
                    
                    <div className="text-right text-sm hidden md:block">
                      <div className="text-muted-foreground">Volume 24H</div>
                      <div className="font-mono">${(token.volume24h / 1000000).toFixed(2)}M</div>
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
          <Link href="/solana-trending/by-volume">
            <Card className="p-6 hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <Activity className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-bold mb-2">By Volume</h3>
              <p className="text-sm text-muted-foreground">
                View tokens ranked by 24H trading volume
              </p>
            </Card>
          </Link>

          <Link href="/solana-trending/by-holders">
            <Card className="p-6 hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <Users className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-bold mb-2">By Holders</h3>
              <p className="text-sm text-muted-foreground">
                Find tokens with highest holder counts
              </p>
            </Card>
          </Link>

          <Link href="/solana-trending/last-24h">
            <Card className="p-6 hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <TrendingUp className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-bold mb-2">24H Trending</h3>
              <p className="text-sm text-muted-foreground">
                View tokens by 24H price change
              </p>
            </Card>
          </Link>
        </div>
      </div>
    </>
  )
}
