import { getTrackedTokens } from "@/lib/get-tracked-tokens"
import type { TokenScore } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, ExternalLink, Users, Activity, Droplets } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { generateBreadcrumbSchema } from "@/lib/schema"

export const metadata: Metadata = {
  title: "Solana Tokens by Holder Count | Most Holders | SOLRAD",
  description:
    "Solana tokens ranked by holder count. Find tokens with growing communities and adoption signals. High holder count means lower concentration risk.",
  alternates: {
    canonical: "https://www.solrad.io/solana-trending/by-holders",
  },
  openGraph: {
    title: "Solana Tokens by Holder Count | Most Holders",
    description:
      "Track Solana tokens with the highest holder counts showing real adoption and community growth.",
    url: "https://www.solrad.io/solana-trending/by-holders",
    siteName: "SOLRAD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Solana Tokens by Holder Count | SOLRAD",
    description: "Find Solana tokens with the most holders and strongest community adoption.",
  },
}

export default async function ByHoldersPage() {
  const allTokens = await getTrackedTokens()
  
  // Filter tokens with holder data and sort
  const holderLeaders = allTokens
    .filter(t => (t.holders || 0) > 0)
    .sort((a, b) => (b.holders || 0) - (a.holders || 0))
    .slice(0, 100)

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      generateBreadcrumbSchema([
        { name: "Home", url: "https://www.solrad.io" },
        { name: "Trending", url: "https://www.solrad.io/solana-trending/by-holders" },
        { name: "By Holders", url: "https://www.solrad.io/solana-trending/by-holders" },
      ]),
      {
        "@type": "WebPage",
        name: "Solana Tokens by Holder Count",
        description: "Ranking of Solana tokens by number of unique holders showing community size and adoption metrics",
        url: "https://www.solrad.io/solana-trending/by-holders",
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: holderLeaders.length,
          itemListElement: holderLeaders.slice(0, 10).map((token, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "FinancialProduct",
              name: token.name,
              description: `${token.symbol} - ${(token.holders || 0).toLocaleString()} holders`,
            },
          })),
        },
      },
    ],
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
            <Users className="h-6 w-6 text-primary" />
            <Badge variant="outline" className="text-xs">By Holders</Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
            Solana Tokens Ranked by Holder Count
          </h1>
          <p className="text-xl text-muted-foreground mb-6 text-pretty">
            Track Solana tokens with the highest holder counts. More holders means broader distribution, lower whale control, and stronger community support.
          </p>
        </div>

        {/* Token Table */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Tokens with Most Holders</h2>
          <div className="grid gap-3">
            {holderLeaders.map((token, index) => (
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
                      <div className="text-muted-foreground text-xs">Holders</div>
                      <div className="font-mono text-lg font-bold">
                        {(token.holders || 0).toLocaleString()}
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

          <Link href="/solana-trending/by-liquidity">
            <Card className="p-6 hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <Droplets className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-bold mb-2">By Liquidity</h3>
              <p className="text-sm text-muted-foreground">
                Sort by liquidity for lowest slippage trades
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
