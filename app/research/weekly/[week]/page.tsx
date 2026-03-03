import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"
import { loadResearchReport, getWeeklyReportWeeks } from "@/lib/research"
import { generatePageMetadata } from "@/lib/meta"
import { generateArticleSchema, generateBreadcrumbSchema, generateCombinedSchema } from "@/lib/schema"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ week: string }>
}

export async function generateStaticParams() {
  const weeks = await getWeeklyReportWeeks()
  return weeks.map((week) => ({ week }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { week } = await params
  const report = await loadResearchReport("weekly", week)

  if (!report) {
    return {
      title: "Report Not Found",
      description: "The requested research report could not be found.",
    }
  }

  return generatePageMetadata({
    title: report.title,
    description: report.summary,
    canonical: `https://www.solrad.io/research/weekly/${week}`,
    keywords: report.tags.join(", "),
    type: "article",
    publishedTime: report.date,
  })
}

export default async function WeeklyReportPage({ params }: PageProps) {
  const { week } = await params
  const report = await loadResearchReport("weekly", week)

  if (!report) {
    notFound()
  }

  const siteUrl = "https://www.solrad.io"

  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateCombinedSchema(
              generateArticleSchema({
                title: report.title,
                description: report.summary,
                datePublished: report.date,
                url: `${siteUrl}/research/weekly/${week}`,
              }),
              generateBreadcrumbSchema([
                { name: "Home", url: siteUrl },
                { name: "Research", url: `${siteUrl}/research` },
                { name: "Weekly Insights", url: `${siteUrl}/research` },
                { name: report.title, url: `${siteUrl}/research/weekly/${week}` },
              ])
            )
          ),
        }}
      />

      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />

        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Back Link */}
            <Link
              href="/research"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Proof Engine
            </Link>

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="uppercase">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Weekly Insights
                </Badge>
                <span className="text-sm text-muted-foreground">{week}</span>
              </div>

              <h1 className="text-4xl font-black uppercase tracking-tight mb-4">{report.title}</h1>
              <p className="text-xl text-muted-foreground">{report.summary}</p>

              {/* Tags */}
              {report.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {report.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Report Sections */}
            <div className="space-y-6">
              {report.sections.map((section, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-xl">{section.heading}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {section.bullets.map((bullet, bulletIdx) => (
                        <li key={bulletIdx} className="flex gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span className="flex-1 leading-relaxed">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Related Tokens */}
            {report.relatedTokens.length > 0 && (
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Related Tokens</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {report.relatedTokens.map((token) => (
                      <Link key={token} href={`/token/${token}`}>
                        <Badge variant="outline" className="hover:bg-primary/10 cursor-pointer">
                          {token}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}
