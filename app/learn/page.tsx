import type { Metadata } from "next"
import Link from "next/link"
import { Zap, TrendingUp, Wallet, Shield, ArrowRight, ChevronRight } from "lucide-react"
import { SolButton } from "@/components/ui/sol-button"
import { learnArticles, categories } from "@/lib/learn-articles"

export const metadata: Metadata = {
  title: "Learn Solana Token Trading | SOLRAD Intelligence Guides & Tutorials",
  description:
    "Free guides on Solana token analysis, gem finding strategies, rug pull detection, wallet security, and on-chain intelligence. Learn how to find 100x tokens on Solana with SOLRAD.",
  keywords: [
    "learn solana trading",
    "solana token analysis",
    "solana gem finder",
    "rug pull detection",
    "solana wallet security",
    "on-chain intelligence",
    "find 100x tokens solana",
    "solana token scoring",
  ],
  alternates: {
    canonical: "https://www.solrad.io/learn",
  },
  openGraph: {
    title: "SOLRAD Learn — Solana Token Intelligence Guides",
    description:
      "Master Solana token trading with expert guides on gem finding, liquidity analysis, rug pull detection, and on-chain signals.",
    url: "https://www.solrad.io/learn",
    siteName: "SOLRAD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SOLRAD Learn — Solana Token Intelligence Guides",
    description:
      "Master Solana token trading with expert guides on gem finding, liquidity analysis, rug pull detection, and on-chain signals.",
  },
}

const iconMap: Record<string, typeof Zap> = {
  Zap,
  TrendingUp,
  Wallet,
  Shield,
}

const collectionSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "SOLRAD Learn — Solana Token Intelligence Guides",
  description:
    "Educational guides on Solana token analysis, gem finding, and on-chain intelligence.",
  url: "https://www.solrad.io/learn",
  publisher: {
    "@type": "Organization",
    name: "SOLRAD",
    url: "https://www.solrad.io",
  },
  hasPart: learnArticles.map((a) => ({
    "@type": "Article",
    name: a.title,
    url: `https://www.solrad.io/learn/${a.slug}`,
  })),
}

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://www.solrad.io" },
    { "@type": "ListItem", position: 2, name: "Learn", item: "https://www.solrad.io/learn" },
  ],
}

export default function LearnPage() {
  const featuredArticles = learnArticles.slice(0, 3)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <main className="py-12">
        <div className="mx-auto max-w-5xl px-6">

          {/* Header */}
          <div className="mb-12">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary mb-4">Learn</p>
            <h1 className="font-mono text-3xl font-bold uppercase tracking-tight text-foreground md:text-4xl">
              SOLRAD Learn
            </h1>
            <div className="mt-3 h-px w-full bg-border" />
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Master Solana token trading with expert guides on blockchain fundamentals,
              token analysis, wallet security, and scam prevention.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Explore:{" "}
              <Link href="/scoring" className="text-primary hover:underline">Scoring Methodology</Link>
              {" \u00B7 "}
              <Link href="/research" className="text-primary hover:underline">Proof Engine</Link>
              {" \u00B7 "}
              <Link href="/browse" className="text-primary hover:underline">Token Pool</Link>
              {" \u00B7 "}
              <Link href="/" className="text-primary hover:underline">Live Dashboard</Link>
            </p>
          </div>

          {/* ── FEATURED GUIDES ── */}
          <section className="mb-16">
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6 border-b border-border pb-2">
              Featured Guides
            </h2>
            <div className="grid md:grid-cols-3 gap-5">
              {featuredArticles.map((article) => (
                <Link key={article.slug} href={`/learn/${article.slug}`}>
                  <div className="border border-border p-6 h-full hover:border-primary/50 transition-colors cursor-pointer flex flex-col">
                    <span className="text-[10px] font-mono bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 w-fit uppercase">
                      {article.readTime}
                    </span>
                    <h3 className="text-sm font-bold mt-3 leading-snug line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-2 flex-1">
                      {article.description}
                    </p>
                    <span className="text-xs text-primary font-mono mt-4 flex items-center gap-1">
                      READ GUIDE <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* ── BROWSE BY CATEGORY ── */}
          <section className="mb-16">
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6 border-b border-border pb-2">
              Browse by Category
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              {Object.values(categories).map((category) => {
                const Icon = iconMap[category.icon as keyof typeof iconMap] ?? Zap
                const count = learnArticles.filter((a) => a.category === category.slug).length

                return (
                  <Link key={category.slug} href={`/learn/category/${category.slug}`}>
                    <div className="border border-border p-6 hover:border-primary/40 transition-colors cursor-pointer">
                      <Icon className="text-primary mx-auto mb-3" size={28} aria-hidden="true" />
                      <h3 className="text-sm font-bold text-center">{category.title}</h3>
                      <p className="text-xs text-muted-foreground text-center mt-1">
                        {category.description}
                      </p>
                      <p className="text-[10px] font-mono text-primary mt-3 uppercase tracking-wide">
                        {count} {count === 1 ? "Article" : "Articles"}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>

          {/* ── ALL ARTICLES ── */}
          <section className="mb-16">
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6 border-b border-border pb-2">
              All Articles
            </h2>
            <div className="space-y-2">
              {learnArticles.map((article) => (
                <Link key={article.slug} href={`/learn/${article.slug}`} className="block">
                  <div className="border-l-2 border-transparent hover:border-primary hover:pl-3 transition-all duration-150 py-3 px-1 rounded-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono bg-muted/50 text-muted-foreground border border-border rounded px-1.5 py-0.5 uppercase">
                            {article.category}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {article.readTime}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold hover:text-primary transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {article.description}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-2" aria-hidden="true" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="border border-primary/30 p-8">
            <h2 className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-foreground">
              Ready to Find Solana Gems?
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Apply what you{"'"}ve learned with SOLRAD{"'"}s real-time{" "}
              <Link href="/scoring" className="text-primary hover:underline">token scoring</Link>{" "}
              and{" "}
              <Link href="/about" className="text-primary hover:underline">intelligence terminal</Link>.
            </p>
            <div className="mt-5">
              <SolButton href="/">OPEN DASHBOARD</SolButton>
            </div>
          </div>

        </div>
      </main>
    </>
  )
}
