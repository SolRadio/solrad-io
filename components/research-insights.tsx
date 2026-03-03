import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FlaskConical, TrendingUp, Calendar, FileText } from "lucide-react"

/**
 * Research Insights - Internal linking block
 * Displays latest research reports for SEO link density
 */
export function ResearchInsights() {
  // Static data for crawlable links (can be made dynamic later)
  const latestDaily = {
    date: "2025-01-27",
    title: "Daily Market Intelligence: Jan 27, 2025",
  }

  const latestWeekly = {
    week: "2025-W04",
    title: "Weekly Market Insights: Week 4, 2025",
  }

  const trendingTokenReports = [
    { symbol: "SOL", title: "Why is SOL trending today?" },
    { symbol: "BONK", title: "Is BONK safe to buy?" },
    { symbol: "JUP", title: "JUP wallet behavior analysis" },
  ]

  return (
    <Card className="border-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Research Insights</CardTitle>
          <Badge variant="secondary" className="ml-auto text-xs">
            Latest
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {/* Latest Daily Research */}
        <Link
          href={`/research/daily/${latestDaily.date}`}
          className="flex items-start gap-2 p-2 rounded-md hover:bg-accent/50 transition-colors group"
        >
          <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-foreground group-hover:text-primary transition-colors font-medium line-clamp-2">
              {latestDaily.title}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">Daily Report</div>
          </div>
        </Link>

        {/* Latest Weekly Report */}
        <Link
          href={`/research/weekly/${latestWeekly.week}`}
          className="flex items-start gap-2 p-2 rounded-md hover:bg-accent/50 transition-colors group"
        >
          <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-foreground group-hover:text-primary transition-colors font-medium line-clamp-2">
              {latestWeekly.title}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">Weekly Analysis</div>
          </div>
        </Link>

        {/* Trending Token Reports */}
        <div className="pt-2 border-t border-border/50">
          <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Trending Token Reports</span>
          </div>
          <div className="space-y-1.5">
            {trendingTokenReports.map((report) => (
              <Link
                key={report.symbol}
                href={`/insights/${report.title
                  .toLowerCase()
                  .replace(/\s+/g, "-")
                  .replace(/[?]/g, "")}`}
                className="block p-1.5 pl-2 rounded hover:bg-accent/50 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono shrink-0">
                    {report.symbol}
                  </Badge>
                  <span className="text-foreground group-hover:text-primary transition-colors text-xs line-clamp-1">
                    {report.title}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Link to Research Lab */}
        <Link
          href="/research"
          className="block text-center py-2 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
        >
          View All Research →
        </Link>
      </CardContent>
    </Card>
  )
}
