import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { BrowseContent } from "@/components/browse-content"
import { Layers } from "lucide-react"
import type { TokenScore } from "@/lib/types"
import { convertIntelToScore } from "@/lib/intel/converter"
import Link from "next/link"
import type { Metadata } from "next"
import { generateBreadcrumbSchema } from "@/lib/schema"
import { toCanonicalToken } from "@/lib/canonical/canonicalToken"

export const dynamic = "force-dynamic"

const TOKENS_PER_PAGE = 100
const MAX_PAGES = 5

export const metadata: Metadata = {
  title: "Browse Tokens — SOLRAD Token Pool",
  description:
    "Explore Solana tokens scoring 50+ with verified safety signals. Real-time scores, liquidity metrics, risk analysis, and momentum tracking.",
  alternates: {
    canonical: "https://www.solrad.io/browse",
  },
  openGraph: {
    title: "Browse Tokens — SOLRAD Token Pool",
    description:
      "Browse all tracked Solana tokens with real-time scores, liquidity metrics, and risk analysis.",
    url: "https://www.solrad.io/browse",
    siteName: "SOLRAD",
    type: "website",
  },
}

const EMPTY_RESULT = { tokens: [] as TokenScore[], updatedAt: new Date().toISOString() }

async function fetchFromIndex(): Promise<{
  tokens: TokenScore[]
  updatedAt: string
}> {
  try {
    const indexRes = await fetch("https://www.solrad.io/api/index", {
      cache: "no-store",
    })
    if (!indexRes.ok) {
      console.error(`[fetchFromIndex] Index API returned ${indexRes.status}`)
      return EMPTY_RESULT
    }
    const indexData = await indexRes.json()
    if (indexData.all && Array.isArray(indexData.all)) {
      const converted = indexData.all.map(convertIntelToScore)
      return { tokens: converted, updatedAt: indexData.updatedAt }
    }
    return EMPTY_RESULT
  } catch (error) {
    console.error("[fetchFromIndex] Failed:", error)
    return EMPTY_RESULT
  }
}

async function fetchTokensServer(): Promise<{
  tokens: TokenScore[]
  updatedAt: string
}> {
  try {
    const archiveRes = await fetch(
      "https://www.solrad.io/api/tokens/archive?minScore=50&page=1&pageSize=500&sort=lastSeen",
      { cache: "no-store" }
    )

    if (!archiveRes.ok) {
      console.error(
        `[fetchTokensServer] Archive API returned ${archiveRes.status}: ${archiveRes.statusText}`
      )
      return await fetchFromIndex()
    }

    const archiveData = await archiveRes.json()

    if (
      archiveData.tokens &&
      Array.isArray(archiveData.tokens) &&
      archiveData.tokens.length > 0
    ) {
      const converted: TokenScore[] = archiveData.tokens.map(
        (archived: any) => {
          const token = {
            address: archived.address,
            symbol: archived.symbol,
            name: archived.name,
            chain: "solana",
            trendingRank: 0,
            totalScore: archived.lastScore,
            riskLabel: archived.riskLabel || "MEDIUM RISK",
            priceUsd: archived.priceUsd || 0,
            priceChange24h: archived.priceChange24h || 0,
            volume24h: archived.volume24h || 0,
            liquidity: archived.liquidity || 0,
            imageUrl: archived.imageUrl,
            dexUrl: archived.dexUrl,
            scoreBreakdown: {
              liquidityScore: 0,
              volumeScore: 0,
              activityScore: 0,
              ageScore: 0,
              healthScore: 0,
              boostScore: 0,
            },
            lastUpdated: archived.lastSeenAt,
            badges: archived.badges || [],
          } as TokenScore

          const canonical = toCanonicalToken(token)
          return {
            ...token,
            _canonical: { ...canonical, inPool: true },
          }
        }
      )

      return {
        tokens: converted,
        updatedAt: archiveData.updatedAt,
      }
    }

    // Archive returned OK but no tokens — fall back to index
    return await fetchFromIndex()
  } catch (error) {
    console.error("[fetchTokensServer] Failed:", error)
    return await fetchFromIndex()
  }
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const resolvedParams = await searchParams
  const page = Math.min(
    Math.max(1, Number.parseInt(resolvedParams.page || "1", 10)),
    MAX_PAGES
  )

  const { tokens: allTokens, updatedAt } = await fetchTokensServer()

  // Sort by score descending for consistent pagination
  const sortedTokens = [...allTokens].sort(
    (a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0)
  )

  // Paginate
  const startIdx = (page - 1) * TOKENS_PER_PAGE
  const endIdx = startIdx + TOKENS_PER_PAGE
  const pageTokens = sortedTokens.slice(startIdx, endIdx)
  const totalPages = Math.min(
    Math.ceil(sortedTokens.length / TOKENS_PER_PAGE),
    MAX_PAGES
  )

  // Generate JSON-LD ItemList schema
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `SOLRAD Token Pool - Page ${page}`,
    description: `Solana tokens scoring 50+ on SOLRAD intelligence system, page ${page} of ${totalPages}`,
    numberOfItems: pageTokens.length,
    itemListElement: pageTokens.map((token, idx) => ({
      "@type": "ListItem",
      position: startIdx + idx + 1,
      item: {
        "@type": "FinancialProduct",
        name: token.symbol || "Unknown Token",
        description: token.name || "",
        url: `https://www.solrad.io/token/${token.address}`,
        identifier: token.address,
      },
    })),
  }

  // Generate Breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://www.solrad.io" },
    { name: "Browse Tokens", url: "https://www.solrad.io/browse" },
  ])

  // Combine schemas
  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [itemListSchema, breadcrumbSchema],
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* JSON-LD Structured Data - ItemList + Breadcrumb */}
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: SEO structured data
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(combinedSchema),
        }}
      />

      <Navbar />

      <main className="flex-1 w-full max-w-none px-4 md:px-6 xl:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Layers className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-black uppercase tracking-tight">
              Token Pool
            </h1>
          </div>

          {/* HOW IT WORKS card */}
          <div className="bg-card border border-border rounded-xl p-5 max-w-4xl">
            <h2 className="text-[10px] font-mono font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
              How It Works
            </h2>
            <p className="text-sm text-foreground/80 leading-relaxed">
              A curated pool of tokens that have scored 50+ on SOLRAD{"'"}s scoring
              system. We continuously track and refresh these tokens so you can
              see updated scores, momentum, and risk signals in one place.
            </p>
          </div>
        </div>

        {/* Pass tokens to client component for interactivity */}
        <BrowseContent
          initialTokens={allTokens}
          pageTokens={pageTokens}
          currentPage={page}
          totalPages={totalPages}
          updatedAt={updatedAt}
        />

        {/* SEO Pagination Links - Server Rendered */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            {page > 1 && (
              <Link
                href={`/browse?page=${page - 1}`}
                className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
              >
                Previous
              </Link>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/browse?page=${p}`}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  p === page
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border bg-card hover:bg-muted"
                }`}
              >
                {p}
              </Link>
            ))}
            {page < totalPages && (
              <Link
                href={`/browse?page=${page + 1}`}
                className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        )}

        {/* SEO Internal Link Graph */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              Explore SOLRAD
            </h2>
            <nav className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/"
                className="p-4 rounded-lg border border-border bg-card hover:bg-muted hover:border-primary/50 transition-all"
              >
                <div className="font-semibold mb-1">Homepage</div>
                <div className="text-xs text-muted-foreground">
                  Live token signals
                </div>
              </Link>
              <Link
                href="/tracker"
                className="p-4 rounded-lg border border-border bg-card hover:bg-muted hover:border-primary/50 transition-all"
              >
                <div className="font-semibold mb-1">Tracker</div>
                <div className="text-xs text-muted-foreground">
                  Track favorites
                </div>
              </Link>
              <Link
                href="/learn"
                className="p-4 rounded-lg border border-border bg-card hover:bg-muted hover:border-primary/50 transition-all"
              >
                <div className="font-semibold mb-1">Learn</div>
                <div className="text-xs text-muted-foreground">
                  Intelligence guide
                </div>
              </Link>
              <Link
                href="/sitemap.xml"
                className="p-4 rounded-lg border border-border bg-card hover:bg-muted hover:border-primary/50 transition-all"
              >
                <div className="font-semibold mb-1">Sitemap</div>
                <div className="text-xs text-muted-foreground">
                  Full site index
                </div>
              </Link>
            </nav>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
