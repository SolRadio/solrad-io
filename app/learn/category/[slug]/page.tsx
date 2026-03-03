import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, ArrowLeft } from "lucide-react"
import { getArticlesByCategory, categories } from "@/lib/learn-articles"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const category = categories[slug as keyof typeof categories]

  if (!category) {
    return {
      title: "Category Not Found",
    }
  }

  return {
    title: `${category.title} - Learn Solana Trading`,
    description: category.description,
    alternates: {
      canonical: `https://www.solrad.io/learn/category/${slug}`,
    },
    openGraph: {
      title: `${category.title} - Learn Solana Trading | SOLRAD`,
      description: category.description,
      url: `https://www.solrad.io/learn/category/${slug}`,
    },
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params
  const category = categories[slug as keyof typeof categories]

  if (!category) {
    notFound()
  }

  const articles = getArticlesByCategory(slug)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/learn" className="hover:text-foreground transition-colors">
              Learn
            </Link>
            <span>/</span>
            <span className="text-foreground">{category.title}</span>
          </div>

          {/* Header */}
          <h1 className="text-4xl font-black uppercase tracking-tight mb-4">{category.title}</h1>
          <p className="text-xl text-muted-foreground mb-8">{category.description}</p>

          {/* Articles */}
          <div className="space-y-4">
            {articles.map((article) => (
              <Link key={article.slug} href={`/learn/${article.slug}`}>
                <Card className="hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-muted-foreground">{article.readTime}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            Updated {new Date(article.lastUpdated).toLocaleDateString()}
                          </span>
                        </div>
                        <CardTitle className="text-xl mb-2">{article.title}</CardTitle>
                        <CardDescription>{article.description}</CardDescription>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>

          {/* Back Link */}
          <Link
            href="/learn"
            className="inline-flex items-center gap-2 mt-8 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all categories
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export async function generateStaticParams() {
  return Object.keys(categories).map((slug) => ({
    slug,
  }))
}
