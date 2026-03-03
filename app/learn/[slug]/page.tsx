import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Clock, Calendar, CheckCircle2 } from "lucide-react"
import { getArticleBySlug, getRelatedArticles, categories } from "@/lib/learn-articles"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const article = getArticleBySlug(slug)

  if (!article) {
    return {
      title: "Article Not Found",
    }
  }

  return {
    title: article.title,
    description: article.description,
    keywords: article.keywords.join(", "),
    alternates: {
      canonical: `https://www.solrad.io/learn/${slug}`,
    },
    openGraph: {
      title: `${article.title} | SOLRAD`,
      description: article.description,
      url: `https://www.solrad.io/learn/${slug}`,
      type: "article",
      publishedTime: article.lastUpdated,
      modifiedTime: article.lastUpdated,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
    },
  }
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params
  const article = getArticleBySlug(slug)

  if (!article) {
    notFound()
  }

  const relatedArticles = getRelatedArticles(article)
  const category = categories[article.category]
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.solrad.io"
  
  // Import breadcrumb helper
  const { generateBreadcrumbSchema } = require("@/lib/schema")
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://www.solrad.io" },
    { name: "Learn", url: "https://www.solrad.io/learn" },
    { name: article.title, url: `https://www.solrad.io/learn/${slug}` },
  ])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* JSON-LD Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      
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
            author: {
              "@type": "Organization",
              name: "SOLRAD",
              url: siteUrl,
            },
            publisher: {
              "@type": "Organization",
              name: "SOLRAD",
              logo: {
                "@type": "ImageObject",
                url: `${siteUrl}/icon.png`,
              },
            },
            datePublished: article.lastUpdated,
            dateModified: article.lastUpdated,
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `${siteUrl}/learn/${slug}`,
            },
            keywords: article.keywords.join(", "),
            articleSection: category.title,
            inLanguage: "en",
          }),
        }}
      />

      {/* BreadcrumbList Schema */}
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: SEO structured data
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: siteUrl,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Learn",
                item: `${siteUrl}/learn`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: article.title,
                item: `${siteUrl}/learn/${slug}`,
              },
            ],
          }),
        }}
      />

      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/learn" className="hover:text-foreground transition-colors">
              Learn
            </Link>
            <span>/</span>
            <Link href={`/learn/category/${article.category}`} className="hover:text-foreground transition-colors">
              {category.title}
            </Link>
            <span>/</span>
            <span className="text-foreground line-clamp-1">{article.title}</span>
          </div>

          {/* Article Header */}
          <div className="mb-8">
            <Badge variant="outline" className="mb-4 uppercase">
              {category.title}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-4 leading-tight">
              {article.title}
            </h1>
            <p className="text-xl text-muted-foreground mb-6">{article.description}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{article.readTime}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Updated {new Date(article.lastUpdated).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Table of Contents */}
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Table of Contents</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {article.content.sections.map((section, index) => (
                  <li key={index}>
                    <a
                      href={`#section-${index}`}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {index + 1}. {section.heading}
                    </a>
                    {section.subsections && section.subsections.length > 0 && (
                      <ul className="ml-4 mt-1 space-y-1">
                        {section.subsections.map((sub, subIndex) => (
                          <li key={subIndex}>
                            <a
                              href={`#section-${index}-${subIndex}`}
                              className="text-muted-foreground hover:text-foreground transition-colors text-xs"
                            >
                              {index + 1}.{subIndex + 1} {sub.subheading}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Article Content */}
          <div className="prose prose-neutral dark:prose-invert max-w-none mb-8">
            {/* Introduction */}
            <p className="text-lg leading-relaxed mb-8">{article.content.intro}</p>

            {/* Sections */}
            {article.content.sections.map((section, index) => (
              <div key={index} id={`section-${index}`} className="mb-8">
                <h2 className="text-2xl font-bold uppercase mb-4">{section.heading}</h2>
                <p className="leading-relaxed text-muted-foreground mb-4">{section.content}</p>
                
                {section.subsections && section.subsections.length > 0 && (
                  <div className="ml-4 space-y-4">
                    {section.subsections.map((subsection, subIndex) => (
                      <div key={subIndex} id={`section-${index}-${subIndex}`}>
                        <h3 className="text-xl font-bold mb-2">{subsection.subheading}</h3>
                        <p className="leading-relaxed text-muted-foreground">{subsection.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Key Takeaways */}
            <Card className="my-8 border-green-500/20 bg-green-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                  Key Takeaways
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {article.content.keyTakeaways.map((takeaway, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                      <span className="text-sm leading-relaxed">{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <Card className="mb-12 bg-primary/5 border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl mb-2">Apply Your Knowledge with SOLRAD</CardTitle>
              <p className="text-muted-foreground">
                Use SOLRAD's real-time intelligence to find Solana gems using the strategies you just learned
              </p>
            </CardHeader>
            <CardContent className="flex justify-center gap-4">
              <Link href="/">
                <Button size="lg" className="uppercase font-bold">
                  Open Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/tracker">
                <Button size="lg" variant="outline" className="uppercase font-bold bg-transparent">
                  View All Tokens
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold uppercase mb-6">Related Articles</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedArticles.map((related) => (
                  <Link key={related.slug} href={`/learn/${related.slug}`}>
                    <Card className="h-full hover:border-primary/50 transition-colors">
                      <CardHeader>
                        <Badge variant="outline" className="w-fit mb-2 uppercase text-xs">
                          {related.category}
                        </Badge>
                        <CardTitle className="text-base line-clamp-2">{related.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{related.readTime}</span>
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Back Link */}
          <Link
            href={`/learn/category/${article.category}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {category.title}
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export async function generateStaticParams() {
  const { learnArticles } = await import("@/lib/learn-articles")
  return learnArticles.map((article) => ({
    slug: article.slug,
  }))
}
