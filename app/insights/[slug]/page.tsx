import { notFound } from "next/navigation"
import type { Metadata } from "next"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, TrendingUp, Shield, Users } from "lucide-react"
import { getTrackedTokens } from "@/lib/get-tracked-tokens"
import { generateAllArticles, type GeneratedArticle } from "@/lib/content-generator"
import { buildTitle, buildDescription, buildCanonical } from "@/lib/seo"
import { buildMetadata } from "@/lib/meta"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticleBySlug(slug)

  if (!article) {
    return {
      title: "Article Not Found",
      robots: { index: false, follow: false },
    }
  }

  return buildMetadata({
    title: buildTitle(article.title, "short"),
    description: buildDescription(article.description),
    path: `/insights/${slug}`,
    keywords: article.keywords,
  })
}

async function getArticleBySlug(slug: string): Promise<GeneratedArticle | null> {
  try {
    const tokens = await getTrackedTokens()
    
    // Generate articles for all tracked tokens
    for (const token of tokens) {
      const articles = generateAllArticles(token)
      const match = articles.find((a) => a.slug === slug)
      if (match) return match
    }
    
    return null
  } catch (error) {
    console.error("[v0] Error generating article:", error)
    return null
  }
}

export async function generateStaticParams() {
  try {
    const tokens = await getTrackedTokens()
    const results: { slug: string }[] = []
    
    // Generate top 50 token articles to prevent huge build times
    const topTokens = tokens.slice(0, 50)
    
    for (const token of topTokens) {
      const articles = generateAllArticles(token)
      results.push(...articles.map((a) => ({ slug: a.slug })))
    }
    
    return results
  } catch (error) {
    console.error("[v0] Error generating static params:", error)
    return []
  }
}

export default async function InsightArticlePage({ params }: PageProps) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)

  if (!article) {
    notFound()
  }

  const categoryIcons = {
    trending: TrendingUp,
    safety: Shield,
    "wallet-analysis": Users,
  }

  const categoryLabels = {
    trending: "Trending Analysis",
    safety: "Safety Analysis",
    "wallet-analysis": "Wallet Behavior",
  }

  const Icon = categoryIcons[article.category]

  return (
    <>
      {/* JSON-LD Article Schema */}
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: SEO structured data
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: article.title,
            description: article.description,
            image: "https://www.solrad.io/og.png?v=20260127",
            datePublished: article.publishedAt.toISOString(),
            dateModified: article.publishedAt.toISOString(),
            author: {
              "@type": "Organization",
              name: "SOLRAD",
              url: "https://www.solrad.io",
            },
            publisher: {
              "@type": "Organization",
              name: "SOLRAD",
              url: "https://www.solrad.io",
              logo: {
                "@type": "ImageObject",
                url: "https://www.solrad.io/icon.png",
              },
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://www.solrad.io/insights/${slug}`,
            },
            articleSection: categoryLabels[article.category],
            keywords: article.keywords.join(", "),
          }),
        }}
      />

      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Article Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="gap-1.5">
              <Icon className="h-3 w-3" />
              {categoryLabels[article.category]}
            </Badge>
            <Badge variant="secondary" className="gap-1.5">
              <Clock className="h-3 w-3" />
              {article.readTime} min read
            </Badge>
          </div>

          <h1 className="text-4xl font-bold mb-4 text-balance">{article.title}</h1>
          
          <p className="text-lg text-muted-foreground text-pretty">{article.description}</p>

          <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
            <span>By SOLRAD Intelligence</span>
            <span>·</span>
            <span>{article.publishedAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
          </div>
        </div>

        {/* Article Content */}
        <Card>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none pt-6">
            <div
              // biome-ignore lint/security/noDangerouslySetInnerHtml: Generated article content
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </CardContent>
        </Card>

        {/* Related Articles CTA */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-2">Continue Learning</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Explore more Solana token intelligence and market analysis
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href="/learn"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Browse Learning Hub
              </a>
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              >
                Live Token Dashboard
              </a>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  )
}
