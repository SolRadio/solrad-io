import { Card } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { HelpCircle, Shield, TrendingUp, Database, Zap, Info } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { generateStaticFAQSchema, generateBreadcrumbSchema, generateCombinedSchema } from "@/lib/schema"

export const metadata: Metadata = {
  title: "FAQ | SOLRAD — Solana Token Intelligence",
  description:
    "Frequently asked questions about SOLRAD. Solana token scoring, signal detection, risk assessment, and how the intelligence terminal works. No wallet required.",
  keywords: [
    "SOLRAD FAQ",
    "solana token scanner questions",
    "solana token scoring explained",
    "solana gem finder FAQ",
    "solana intelligence terminal",
  ],
  alternates: {
    canonical: "https://www.solrad.io/faq",
  },
  openGraph: {
    title: "FAQ | SOLRAD — Solana Token Intelligence",
    description:
      "Frequently asked questions about SOLRAD. Solana token scoring, signal detection, risk assessment, and how the intelligence terminal works.",
    url: "https://www.solrad.io/faq",
    siteName: "SOLRAD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ | SOLRAD — Solana Token Intelligence",
    description:
      "Frequently asked questions about SOLRAD. Solana token scoring, signal detection, and how the terminal works.",
  },
}

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is SOLRAD?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "SOLRAD is a read-only Solana token intelligence terminal that scores every active Solana token from 0-100 using on-chain data including liquidity, volume, age, and structural risk signals. No wallet connection required.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need to connect a wallet?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. SOLRAD is completely read-only. You never need to connect a wallet, share private keys, or sign any transaction to use SOLRAD.",
      },
    },
    {
      "@type": "Question",
      name: "How does SOLRAD scoring work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "SOLRAD scores tokens 0-100 using a deterministic formula across 10 signal dimensions: liquidity strength, trading activity quality, market participation balance, token maturity, and structural risk signals. The full methodology is published at solrad.io/scoring.",
      },
    },
    {
      "@type": "Question",
      name: "How often is data updated?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "SOLRAD refreshes token data every 2 minutes using DexScreener and QuickNode RPC data sources.",
      },
    },
    {
      "@type": "Question",
      name: "Is SOLRAD free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "SOLRAD offers a free tier with full access to token scoring, the dashboard, and basic signal data. A Pro tier unlocks unlimited signal history, full proof ledger access, and advanced features.",
      },
    },
    {
      "@type": "Question",
      name: "Where does SOLRAD get its data?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "SOLRAD aggregates data from DexScreener (price, volume, liquidity, pair data) and QuickNode RPC (on-chain holder metrics, mint/freeze authority status, holder concentration).",
      },
    },
    {
      "@type": "Question",
      name: "Is SOLRAD safe to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. SOLRAD is read-only and never requests wallet access, private keys, or any permissions. It only reads publicly available blockchain data.",
      },
    },
    {
      "@type": "Question",
      name: "How do I find the best tokens (gems)?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Use Gem Finder Mode on the SOLRAD dashboard to filter for tokens with high scores, strong liquidity, and low risk signals. Tokens scoring above 70 with LOW risk are considered high-quality.",
      },
    },
  ],
}

export default function FAQPage() {
  const faqSchema = generateStaticFAQSchema()
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://www.solrad.io" },
    { name: "FAQ", url: "https://www.solrad.io/faq" },
  ])
  const combinedSchema = generateCombinedSchema(faqSchema, breadcrumbSchema)

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: SEO structured data
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(combinedSchema),
        }}
      />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: SEO structured data
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd),
        }}
      />

      <main className="py-12">
        <div className="mx-auto max-w-5xl px-6">
          {/* Header */}
          <div className="mb-10">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary mb-4">FAQ</p>
            <h1 className="font-mono text-3xl font-bold uppercase tracking-tight text-foreground md:text-4xl">
              Frequently Asked Questions
            </h1>
            <div className="mt-3 h-px w-full bg-border" />
            <p className="mt-4 text-sm text-muted-foreground">
              Everything you need to know about SOLRAD.{" "}
              See also:{" "}
              <Link href="/scoring" className="text-primary hover:underline">Scoring Methodology</Link>
              {" \u00B7 "}
              <Link href="/research" className="text-primary hover:underline">Proof Engine</Link>
              {" \u00B7 "}
              <Link href="/about" className="text-primary hover:underline">About SOLRAD</Link>
            </p>
          </div>

          {/* General Questions */}
          <Card className="p-6 mb-8">
            <h2 className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-foreground mb-6">General</h2>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="what-is-solrad">
                <AccordionTrigger className="text-left"><h3 className="font-semibold">What is SOLRAD?</h3></AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    SOLRAD is a Solana intelligence engine that scans and analyzes trending tokens in real-time. We aggregate data from multiple sources including DexScreener, on-chain metrics, and proprietary signals to help traders identify opportunities and assess risk.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Think of SOLRAD as your read-only command center for Solana token intelligence - no wallet connections, no transactions, just pure market data and insights.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="do-i-need-wallet">
                <AccordionTrigger className="text-left"><h3 className="font-semibold">Do I need to connect a wallet?</h3></AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    <strong className="text-foreground">No wallet connection required.</strong> SOLRAD is completely read-only. You can browse, search, and analyze tokens without connecting any wallet or signing any transactions.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Your private keys stay private. We never ask for wallet access, and we can{"'"}t execute any transactions on your behalf.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="how-often-updates">
                <AccordionTrigger className="text-left"><h3 className="font-semibold">How often is data updated?</h3></AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    Token data refreshes every 5 minutes during active periods. Price and volume data updates more frequently (every 30-60 seconds for actively tracked tokens).
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    The {"\""}LIVE{"\""} indicator in the header shows the last successful data sync. If you see {"\""}Updated 2m ago{"\""}, that means the last refresh was 2 minutes ago.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="is-it-free">
                <AccordionTrigger className="text-left"><h3 className="font-semibold">Is SOLRAD free to use?</h3></AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground leading-relaxed">
                    Yes! The core SOLRAD dashboard, token scanner, and intelligence features are completely free. No registration, no payment required. Just visit and start exploring.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>

          {/* Scoring & Analysis */}
          <Card className="p-6 mb-8">
            <h2 className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-foreground mb-6">Scoring & Analysis</h2>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="how-scoring-works">
                <AccordionTrigger className="text-left"><h3 className="font-semibold">How does SOLRAD scoring work?</h3></AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    Each token receives a composite score from 0-100 based on five key factors:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mb-3">
                    <li><strong className="text-foreground">Liquidity Score</strong> - Pool depth and stability</li>
                    <li><strong className="text-foreground">Volume Score</strong> - 24h trading activity</li>
                    <li><strong className="text-foreground">Activity Score</strong> - Buy/sell pressure and momentum</li>
                    <li><strong className="text-foreground">Age Score</strong> - Time since token creation</li>
                    <li><strong className="text-foreground">Health Score</strong> - Holder distribution and contract safety</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed">
                    Learn more on our <Link href="/scoring" className="text-primary hover:underline">How Scoring Works</Link> page.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="what-is-rad-score">
                <AccordionTrigger className="text-left"><h3 className="font-semibold">What does a RAD, GEM, or TRASH badge mean?</h3></AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 text-muted-foreground">
                    <div>
                      <strong className="text-green-500">RAD (80-100):</strong> High-quality tokens with strong fundamentals, healthy liquidity, and low risk factors. These are the {"\""}gems{"\""} worth watching.
                    </div>
                    <div>
                      <strong className="text-yellow-500">GEM (55-79):</strong> Moderate quality tokens that show promise but have some caution flags. Do your own research before trading.
                    </div>
                    <div>
                      <strong className="text-red-500">TRASH (0-54):</strong> Low-quality tokens with significant risk factors like low liquidity, wash trading signals, or suspicious holder patterns. Approach with extreme caution.
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="what-are-badges">
                <AccordionTrigger className="text-left"><h3 className="font-semibold">What do the different badges mean?</h3></AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div><strong className="text-foreground">MULTI-SOURCE:</strong> Token appears on multiple data feeds (higher confidence)</div>
                    <div><strong className="text-foreground">TRENDING:</strong> High liquidity with strong 24h volume</div>
                    <div><strong className="text-foreground">ACTIVE:</strong> High trading activity relative to pool size</div>
                    <div><strong className="text-foreground">NEW:</strong> Recently created token with strong initial momentum</div>
                    <div><strong className="text-foreground">FRESH SIGNAL:</strong> Rapid price movement with volume spike</div>
                    <div><strong className="text-red-500">TRASH:</strong> Detected risk factors (wash trading, centralization, etc.)</div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>

          {/* Data & Sources */}
          <Card className="p-6 mb-8">
            <h2 className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-foreground mb-6">Data & Sources</h2>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="where-data-from">
                <AccordionTrigger className="text-left"><h3 className="font-semibold">Where does SOLRAD get its data?</h3></AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    We aggregate data from multiple public sources:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>DexScreener API (price, volume, liquidity)</li>
                    <li>Solana blockchain data (on-chain metrics)</li>
                    <li>Jupiter aggregator (DEX data)</li>
                    <li>Proprietary signal detection algorithms</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="all-solana-tokens">
                <AccordionTrigger className="text-left"><h3 className="font-semibold">Does SOLRAD track all Solana tokens?</h3></AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    No. SOLRAD focuses on trending and actively traded tokens. We track tokens that meet minimum thresholds for liquidity, volume, and trading activity to filter out spam and inactive projects.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    New tokens are added automatically when they hit trending lists or show significant trading activity. Our coverage expands daily as the Solana ecosystem grows.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="token-not-found">
                <AccordionTrigger className="text-left"><h3 className="font-semibold">Why can{"'"}t I find a specific token?</h3></AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    If a token isn{"'"}t showing up, it{"'"}s likely because:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mb-3">
                    <li>Liquidity is too low to meet our minimum thresholds</li>
                    <li>The token is brand new and hasn{"'"}t been indexed yet</li>
                    <li>Trading volume is insufficient for reliable scoring</li>
                    <li>The token may be filtered out due to risk factors</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed">
                    Use our <Link href="/solana-token-scanner" className="text-primary hover:underline">Token Scanner</Link> to search by contract address and see if a token meets our tracking criteria.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>

          {/* Safety & Security */}
          <Card className="p-6 mb-8">
            <h2 className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-foreground mb-6">Safety & Security</h2>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="is-safe-to-use">
                <AccordionTrigger className="text-left"><h3 className="font-semibold">Is SOLRAD safe to use?</h3></AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    <strong className="text-foreground">Yes, completely safe.</strong> SOLRAD is read-only and never asks for:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mb-3">
                    <li>Wallet connections</li>
                    <li>Private keys or seed phrases</li>
                    <li>Transaction signatures</li>
                    <li>Personal information</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed">
                    We{"'"}re a data platform, not a trading interface. Your assets remain completely under your control. Learn more on our <Link href="/security" className="text-primary hover:underline">Security</Link> page.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="does-solrad-recommend">
                <AccordionTrigger className="text-left"><h3 className="font-semibold">Does SOLRAD recommend tokens to buy?</h3></AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    <strong className="text-foreground">No.</strong> SOLRAD provides data and scoring to help you make informed decisions, but we never recommend specific tokens or give financial advice.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Our scores and badges are risk indicators based on quantitative metrics, not investment recommendations. Always do your own research and understand the risks before trading any cryptocurrency.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="report-scam">
                <AccordionTrigger className="text-left"><h3 className="font-semibold">How do I report a scam token?</h3></AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    If you believe a token on SOLRAD is a scam or rug pull, please <Link href="/contact" className="text-primary hover:underline">contact us</Link> with:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>Token contract address</li>
                    <li>Description of suspicious activity</li>
                    <li>Any supporting evidence or links</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed mt-3">
                    We{"'"}ll investigate and add appropriate risk flags if warranted.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>

          {/* Using SOLRAD */}
          <Card className="p-6 mb-8">
            <h2 className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-foreground mb-6">Using SOLRAD</h2>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="how-to-find-gems">
                <AccordionTrigger className="text-left"><h3 className="font-semibold">How do I find the best tokens (gems)?</h3></AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    Start with the <Link href="/tracker" className="text-primary hover:underline">Tracker</Link> page which shows top performers sorted by score. Look for:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mb-3">
                    <li>Tokens with RAD badges (80+ score)</li>
                    <li>MULTI-SOURCE badges (seen on multiple platforms)</li>
                    <li>Healthy liquidity ($100K+) and volume</li>
                    <li>Low risk indicators (no TRASH flags)</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed">
                    Use the {"\""}FRESH SIGNALS{"\""} tab on mobile or homepage to catch tokens with rapid momentum before they pump.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="watchlist-how">
                <AccordionTrigger className="text-left"><h3 className="font-semibold">How does the watchlist work?</h3></AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    Click the star icon on any token card to add it to your personal watchlist. Your watchlist is saved locally in your browser (no account needed).
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Access your watchlist from the bottom navigation on mobile or the <Link href="/watchlist" className="text-primary hover:underline">Watchlist page</Link> on desktop.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="gem-finder-mode">
                <AccordionTrigger className="text-left"><h3 className="font-semibold">What is Gem Finder Mode?</h3></AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    Gem Finder Mode filters the entire token list to show only high-quality tokens (score 70+) with no TRASH flags. It{"'"}s the fastest way to cut through noise and focus on legitimate opportunities.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Toggle it on using the diamond icon button in the dashboard header.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="what-is-proof-engine">
                <AccordionTrigger className="text-left"><h3 className="font-semibold">What is the Proof Engine?</h3></AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    The <Link href="/research" className="text-primary hover:underline">Proof Engine</Link> is SOLRAD{"'"}s transparency layer. It tracks every signal detection with timestamps, scores, and prices to create an append-only ledger.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Each entry is hashed (SHA-256) and chained, so you can cryptographically verify that SOLRAD detected a token before the market moved. This is our {"\""}saw it first{"\""} proof system.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>

          {/* Still have questions? */}
          <div className="border border-primary/20 p-8 mt-8">
            <h2 className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-foreground mb-3">Still have questions?</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Can{"'"}t find what you{"'"}re looking for?{" "}
              <Link href="/contact" className="text-primary hover:underline">Send us a message</Link>{" "}
              or explore our <Link href="/scoring" className="text-primary hover:underline">full scoring docs</Link> and <Link href="/about" className="text-primary hover:underline">about page</Link>.
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
