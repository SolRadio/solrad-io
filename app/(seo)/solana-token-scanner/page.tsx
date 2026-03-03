import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Metadata } from "next"
import { generateBreadcrumbSchema } from "@/lib/schema"
import {
  Search,
  ArrowRight,
  CheckCircle2,
  Activity,
  BarChart3,
  Eye,
  ChevronDown,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Solana Token Scanner | SOLRAD",
  description:
    "Protect your portfolio with advanced real-time scanning. Detect rug pulls, honeypots, and insider risks in seconds. Scan any SPL token for verified safety signals before you invest.",
  keywords: [
    "solana token scanner",
    "scan solana tokens",
    "solana coin scanner",
    "SPL token scanner",
    "solana risk analysis",
    "token liquidity scanner",
    "solana rug pull detector",
    "insider wallet monitoring",
    "solana token trends",
    "dexscreener alternative",
  ],
  alternates: {
    canonical: "https://www.solrad.io/solana-token-scanner",
  },
  openGraph: {
    title: "Solana Token Scanner | Real-Time Risk Analysis & Liquidity Monitoring",
    description:
      "Advanced Solana token scanner with real-time risk analysis, liquidity monitoring, insider wallet tracking, and trend detection. Scan tokens before you invest.",
    url: "https://www.solrad.io/solana-token-scanner",
    siteName: "SOLRAD",
    type: "website",
    images: [
      {
        url: "https://www.solrad.io/brand/og-1200x630.png",
        width: 1200,
        height: 630,
        alt: "SOLRAD Token Scanner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Solana Token Scanner | Real-Time Risk Analysis",
    description:
      "Scan any Solana token for risk signals, liquidity depth, insider activity, and trend momentum. Advanced scanning beyond Dexscreener.",
    images: ["https://www.solrad.io/brand/twitter-1200x630.png"],
  },
}

const faqItems = [
  {
    q: "How often does SOLRAD update token data?",
    a: "SOLRAD updates token data based on source availability, typically every few minutes. Update frequency varies by data provider and token liquidity. Coverage depends on whether a token has sufficient DEX activity. Data refresh timing is not guaranteed and may experience delays during high network activity.",
  },
  {
    q: "What tokens does SOLRAD track?",
    a: "SOLRAD tracks SPL tokens with available market data and liquidity on supported DEXs. Coverage depends on data source availability. You can search for any token by contract address\u2014if sufficient liquidity and DEX data exists, SOLRAD will display available metrics. Tokens without adequate liquidity may show limited or no data.",
  },
  {
    q: "How does SOLRAD differ from other token trackers?",
    a: "SOLRAD emphasizes risk indicators, score explanations, and transparency. The platform aggregates data from multiple sources where available and provides reasoning behind risk assessments. SOLRAD is a research tool\u2014not a recommendation engine. All data should be independently verified before making any trading decisions.",
  },
  {
    q: "Can SOLRAD detect all rug pulls?",
    a: "No system can detect all rug pulls or malicious behavior. SOLRAD flags common risk indicators like mint authority status, freeze authority, holder concentration, and liquidity patterns. However, sophisticated scams may evade detection. Risk badges are observational tools, not guarantees. Always DYOR and never invest more than you can afford to lose.",
  },
  {
    q: "Does SOLRAD work for Pump.fun tokens?",
    a: "SOLRAD includes Pump.fun data where available through supported APIs. Coverage depends on whether the token has sufficient visibility and data availability. Pump.fun tokens may receive specific badges when identifiable, but data completeness varies. Always verify information across multiple sources before making decisions.",
  },
  {
    q: "Is SOLRAD available on mobile?",
    a: "Yes, SOLRAD is fully responsive and works on mobile browsers. The mobile interface provides access to token data, search, filtering, and watchlist features. No wallet connection or app installation is required to use SOLRAD.",
  },
]

export default function SolanaTokenScannerPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://www.solrad.io" },
    { name: "Solana Token Scanner", url: "https://www.solrad.io/solana-token-scanner" },
  ])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* SEO: Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <Navbar />

      {/* ── SCREEN 1: HERO ── */}
      <section className="border-b border-border">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-black uppercase tracking-tight md:text-6xl text-foreground text-balance">
              Solana Token Scanner
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl text-balance leading-relaxed">
              Read-only Solana token intelligence built on observed on-chain activity,
              liquidity behavior, and score transitions. No predictions. No wallet required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link href="/signals">
                  View Signal Outcomes <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/">Open Dashboard</Link>
              </Button>
            </div>

            {/* Stat pills */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <span className="bg-card border border-border rounded-full px-3 py-1 text-xs font-mono text-muted-foreground">
                40+ TOKENS TRACKED
              </span>
              <span className="bg-card border border-border rounded-full px-3 py-1 text-xs font-mono text-muted-foreground">
                UPDATES EVERY 2 MIN
              </span>
              <span className="bg-card border border-border rounded-full px-3 py-1 text-xs font-mono text-muted-foreground">
                READ-ONLY &middot; NO WALLET
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SCREEN 2: WHAT IS IT + FAQ ── */}
      <section className="border-b border-border py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            {/* Condensed "What is it" */}
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3 text-center">
              What is a Solana Token Scanner?
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed text-center mb-12 max-w-2xl mx-auto">
              A Solana token scanner aggregates on-chain market data &mdash; liquidity, volume,
              holder patterns, and risk signals &mdash; into a unified view. SOLRAD scores every
              active SPL token from 0&ndash;100 using a deterministic, published methodology.
              No wallet connection required.
            </p>

            {/* FAQ accordion */}
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6 text-center">
              Token Scanner FAQ
            </h2>
            <div className="divide-y divide-border border-t border-b border-border">
              {faqItems.map((item, idx) => (
                <details key={idx} className="group">
                  <summary className="flex items-center justify-between cursor-pointer py-4 px-3 hover:bg-muted/30 transition-colors">
                    <h3 className="text-sm font-medium text-foreground pr-4">{item.q}</h3>
                    <ChevronDown
                      className="h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <div className="px-3 pb-4">
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SCREEN 3: CTA ── */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            {/* Related internal links */}
            <p className="text-xs text-muted-foreground mb-10">
              Related:{" "}
              <Link href="/scoring" className="text-primary hover:underline">Scoring Methodology</Link>
              {" \u00B7 "}
              <Link href="/browse" className="text-primary hover:underline">Token Pool</Link>
              {" \u00B7 "}
              <Link href="/signals" className="text-primary hover:underline">Signal Outcomes</Link>
              {" \u00B7 "}
              <Link href="/faq" className="text-primary hover:underline">FAQ</Link>
            </p>

            <h2 className="mb-6 text-3xl font-black uppercase tracking-tight md:text-4xl text-foreground text-balance">
              Explore SOLRAD Intelligence
            </h2>
            <p className="mb-8 text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
              Access read-only token intelligence and risk indicators. Review observed data
              and conduct your own research. No wallet connection required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link href="/">
                  Open Dashboard <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/signals">View Signal Outcomes</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" aria-hidden="true" />
                <span>Read-Only Tool</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" aria-hidden="true" />
                <span>No Wallet Required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" aria-hidden="true" />
                <span>Transparent Data</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Explore More SOLRAD Features */}
      <section className="border-t border-border bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6 text-center">
              Explore More SOLRAD Features
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <Link
                href="/"
                className="group flex items-center gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary"
              >
                <Activity className="h-5 w-5 text-muted-foreground group-hover:text-primary" aria-hidden="true" />
                <span className="text-sm font-medium">Live Token Feed</span>
              </Link>
              <Link
                href="/scoring"
                className="group flex items-center gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary"
              >
                <BarChart3 className="h-5 w-5 text-muted-foreground group-hover:text-primary" aria-hidden="true" />
                <span className="text-sm font-medium">Scoring System</span>
              </Link>
              <Link
                href="/watchlist"
                className="group flex items-center gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary"
              >
                <Eye className="h-5 w-5 text-muted-foreground group-hover:text-primary" aria-hidden="true" />
                <span className="text-sm font-medium">Watchlist</span>
              </Link>
              <Link
                href="/research"
                className="group flex items-center gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary"
              >
                <Search className="h-5 w-5 text-muted-foreground group-hover:text-primary" aria-hidden="true" />
                <span className="text-sm font-medium">Token Research</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* JSON-LD Schema — preserved from original */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebPage",
                "@id": "https://www.solrad.io/solana-token-scanner",
                url: "https://www.solrad.io/solana-token-scanner",
                name: "Solana Token Scanner | Real-Time Risk Analysis & Liquidity Monitoring",
                description:
                  "Advanced Solana token scanner with real-time risk analysis, liquidity monitoring, insider wallet tracking, and trend detection. Scan any SPL token for rug pulls and safety signals.",
                isPartOf: { "@id": "https://www.solrad.io/#website" },
                primaryImageOfPage: { "@id": "https://www.solrad.io/og.png" },
                datePublished: "2025-01-28",
                dateModified: "2025-01-28",
              },
              {
                "@type": "SoftwareApplication",
                name: "SOLRAD Token Scanner",
                applicationCategory: "FinanceApplication",
                operatingSystem: "Web",
                offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
                aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", ratingCount: "1250" },
                description:
                  "Real-time Solana token scanner with risk analysis, liquidity monitoring, and trend detection for 50,000+ tokens.",
              },
              {
                "@type": "FAQPage",
                mainEntity: [
                  {
                    "@type": "Question",
                    name: "How often does SOLRAD scan tokens?",
                    acceptedAnswer: { "@type": "Answer", text: "SOLRAD scans all tracked tokens every 60 seconds, updating price, volume, liquidity, and holder data in real-time. New token launches are detected within 5 minutes of deployment." },
                  },
                  {
                    "@type": "Question",
                    name: "Can I scan any Solana token?",
                    acceptedAnswer: { "@type": "Answer", text: "Yes! SOLRAD scans 50,000+ Solana SPL tokens including DeFi protocols, meme coins, utility tokens, gaming tokens, and new launches from any platform. Simply paste any SPL token contract address into the search bar." },
                  },
                  {
                    "@type": "Question",
                    name: "What makes SOLRAD's scanner better than Dexscreener?",
                    acceptedAnswer: { "@type": "Answer", text: "SOLRAD focuses on risk intelligence with multi-source data validation, insider wallet analysis, risk scoring, and visual badges. Dexscreener shows you what's happening; SOLRAD tells you if it's safe." },
                  },
                  {
                    "@type": "Question",
                    name: "How accurate is the rug pull detection?",
                    acceptedAnswer: { "@type": "Answer", text: "SOLRAD's rug pull detection catches 85-90% of obvious rug pulls using a multi-signal approach that flags suspicious patterns like revocable mint authority, freeze authority, and coordinated wallet behaviors." },
                  },
                  {
                    "@type": "Question",
                    name: "Does the scanner work for Pump.fun tokens?",
                    acceptedAnswer: { "@type": "Answer", text: "Absolutely! SOLRAD has dedicated Pump.fun integration that scans new launches within minutes of bonding curve deployment, analyzing Pump.fun-specific metrics and graduation status." },
                  },
                  {
                    "@type": "Question",
                    name: "Can I scan tokens on mobile?",
                    acceptedAnswer: { "@type": "Answer", text: "Yes! SOLRAD's token scanner is fully responsive and works perfectly on mobile devices with all the same scanning capabilities as desktop." },
                  },
                ],
              },
            ],
          }),
        }}
      />
    </div>
  )
}
