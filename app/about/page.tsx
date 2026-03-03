import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import {
  Database,
  BarChart2,
  Shield,
  Download,
  Calculator,
  Zap,
  CheckCircle,
  XCircle,
  Eye,
  Lock,
  Clock,
} from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { generateOrganizationSchema, generateWebApplicationSchema, generateBreadcrumbSchema, generateCombinedSchema } from "@/lib/schema"

export const metadata: Metadata = {
  title: "About SOLRAD | Solana Token Intelligence",
  description:
    "SOLRAD is a read-only Solana token intelligence terminal. We score every active Solana token 0-100 using on-chain data — liquidity, volume, age, and risk signals. No wallet required.",
  keywords: [
    "solana token scanner",
    "solana token scoring",
    "solana intelligence",
    "solana gem finder",
    "solana signal detection",
    "solana token analysis",
    "solana token score 0-100",
    "read-only solana analytics",
    "solana token early detection",
  ],
  alternates: {
    canonical: "https://www.solrad.io/about",
  },
  openGraph: {
    title: "About SOLRAD | Solana Token Intelligence & Scoring Platform",
    description:
      "Read-only Solana token intelligence terminal. Deterministic scoring, signal detection, and verifiable timestamps. No wallet connection required.",
    url: "https://www.solrad.io/about",
    siteName: "SOLRAD",
    type: "website",
    images: [
      {
        url: "https://www.solrad.io/brand/og-1200x630.png",
        width: 1200,
        height: 630,
        alt: "SOLRAD - Solana Token Intelligence & Scoring Platform"
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About SOLRAD | Solana Token Intelligence & Scoring Platform",
    description:
      "Read-only Solana token intelligence. Deterministic scoring, signal detection, and lead-time proofs. No wallet required.",
    images: ["https://www.solrad.io/brand/twitter-1200x630.png"],
  },
}

export default function AboutPage() {
  const organizationSchema = generateOrganizationSchema()
  const softwareSchema = generateWebApplicationSchema()
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://www.solrad.io" },
    { name: "About", url: "https://www.solrad.io/about" },
  ])
  const webPageSchema = {
    "@type": "WebPage",
    name: "About SOLRAD",
    description: "SOLRAD is a Solana token intelligence terminal that scores tokens 0-100 using on-chain data and timestamps early signal detections.",
    url: "https://www.solrad.io/about",
    publisher: {
      "@type": "Organization",
      name: "SOLRAD",
      url: "https://www.solrad.io",
    },
  }
  const combinedSchema = generateCombinedSchema(organizationSchema, softwareSchema, breadcrumbSchema, webPageSchema)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(combinedSchema),
        }}
      />

      <Navbar />

      <main className="flex-1">
        {/* ── SECTION 1: HERO ── */}
        <section className="py-20">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <p className="text-xs font-mono text-primary uppercase tracking-widest mb-4">
              About SOLRAD
            </p>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-foreground">
              Built to show what{"'"}s about to trend.
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-2xl mx-auto mt-4 leading-relaxed">
              SOLRAD is an independent Solana token intelligence terminal built for solana token scoring.
              We score every active token 0-100 using observable on-chain signals — liquidity, volume,
              age, and token risk assessment factors — then timestamp every signal detection to the{" "}
              <Link href="/research" className="text-primary hover:underline">Alpha Ledger</Link>{" "}
              so you can verify we saw it first.
            </p>
          </div>
        </section>

        {/* ── SECTION 2: 3 STAT CARDS ── */}
        <section className="py-16 border-t border-border">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid gap-5 md:grid-cols-3">
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="flex justify-center">
                  <Database className="text-primary" size={32} aria-hidden="true" />
                </div>
                <p className="text-3xl font-black text-foreground mt-3">2</p>
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wide">
                  Data Sources
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  DexScreener + QuickNode RPC
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="flex justify-center">
                  <BarChart2 className="text-primary" size={32} aria-hidden="true" />
                </div>
                <p className="text-3xl font-black text-foreground mt-3">0-100</p>
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wide">
                  Composite Score
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  10 observable signal dimensions
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="flex justify-center">
                  <Shield className="text-green-500" size={32} aria-hidden="true" />
                </div>
                <p className="text-3xl font-black text-foreground mt-3">Read-Only</p>
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wide">
                  No Wallet Needed
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  No keys. No trades. No custody.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 3: HOW IT ACTUALLY WORKS ── */}
        <section className="py-20 border-t border-border">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">
                How It Works
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Four steps from raw blockchain data to verified proof
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="flex justify-center">
                  <Download className="text-primary" size={28} aria-hidden="true" />
                </div>
                <p className="text-xs font-mono text-primary uppercase mt-3">01 — Ingest</p>
                <p className="text-sm font-bold mt-1">Data Collection</p>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Every 2 minutes, we pull price, volume, liquidity, and pair data for active
                  Solana tokens from DexScreener and QuickNode RPC.
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="flex justify-center">
                  <Calculator className="text-primary" size={28} aria-hidden="true" />
                </div>
                <p className="text-xs font-mono text-primary uppercase mt-3">02 — Score</p>
                <p className="text-sm font-bold mt-1">Deterministic Scoring</p>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  We apply a fixed, published formula across 10 signal dimensions. Same inputs
                  always produce the same score. No black box, no model drift.
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="flex justify-center">
                  <Zap className="text-primary" size={28} aria-hidden="true" />
                </div>
                <p className="text-xs font-mono text-primary uppercase mt-3">03 — Detect</p>
                <p className="text-sm font-bold mt-1">Signal Detection</p>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  When a token{"'"}s score crosses a threshold for the first time, we timestamp
                  the detection and log it to the append-only Alpha Ledger.{" "}
                  <Link href="/saw-it-first" className="text-primary hover:underline">See recent detections</Link>.
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="flex justify-center">
                  <CheckCircle className="text-green-500" size={28} aria-hidden="true" />
                </div>
                <p className="text-xs font-mono text-green-500 uppercase mt-3">04 — Prove</p>
                <p className="text-sm font-bold mt-1">Lead-Time Proof</p>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Every detection is logged with the Solana block number. This creates a
                  verifiable timestamp proving exactly when we first observed the signal —
                  before market reaction. Track{" "}
                  <Link href="/signals" className="text-primary hover:underline">signal outcomes</Link>{" "}
                  to see how detections perform over time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 4: WHAT WE ARE NOT ── */}
        <section className="py-20 border-t border-border">
          <div className="max-w-5xl mx-auto px-6">
            <div className="max-w-2xl mx-auto bg-card border border-primary/20 rounded-xl p-8 text-center">
              <div className="flex justify-center">
                <XCircle className="text-primary" size={32} aria-hidden="true" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-foreground mt-3 mb-6">
                What SOLRAD Is Not
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="text-center">
                  <h3 className="text-xs font-bold uppercase text-foreground">Not a Trading Tool</h3>
                  <p className="text-xs text-muted-foreground mt-1">We show data. You decide.</p>
                </div>
                <div className="text-center">
                  <h3 className="text-xs font-bold uppercase text-foreground">Not Predictive</h3>
                  <p className="text-xs text-muted-foreground mt-1">We observe the present, not the future.</p>
                </div>
                <div className="text-center">
                  <h3 className="text-xs font-bold uppercase text-foreground">Not Custodial</h3>
                  <p className="text-xs text-muted-foreground mt-1">We never touch your wallet or funds.</p>
                </div>
                <div className="text-center">
                  <h3 className="text-xs font-bold uppercase text-foreground">Not a Black Box</h3>
                  <p className="text-xs text-muted-foreground mt-1">Our full <Link href="/scoring" className="text-primary hover:underline">scoring methodology</Link> is published.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 5: TRUST PRINCIPLES ── */}
        <section className="py-20 border-t border-border">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">
                Why Traders Trust SOLRAD
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="flex justify-center">
                  <Shield className="text-primary" size={28} aria-hidden="true" />
                </div>
                <h3 className="text-sm font-bold uppercase mt-3">Read-Only Architecture</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  SOLRAD has no wallet integration, no trade execution, and no access to user
                  funds. It reads public blockchain data only.
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="flex justify-center">
                  <Eye className="text-primary" size={28} aria-hidden="true" />
                </div>
                <h3 className="text-sm font-bold uppercase mt-3">Transparent Methodology</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Every scoring dimension is documented and published at{" "}
                  <Link href="/scoring" className="text-primary hover:underline">
                    solrad.io/scoring
                  </Link>
                  . No hidden factors.
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="flex justify-center">
                  <Lock className="text-primary" size={28} aria-hidden="true" />
                </div>
                <h3 className="text-sm font-bold uppercase mt-3">Append-Only Ledger</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Signal detections are written once and never edited. The historical record
                  is immutable and exportable.
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="flex justify-center">
                  <Clock className="text-primary" size={28} aria-hidden="true" />
                </div>
                <h3 className="text-sm font-bold uppercase mt-3">Verifiable Timestamps</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Every detection is logged with Solana block numbers that can be independently
                  verified on any block explorer.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 6: CTA ── */}
        <section className="py-20 border-t border-border">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/"
                className="bg-primary text-primary-foreground text-sm font-bold px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
              >
                START EXPLORING
              </Link>
              <Link
                href="/research"
                className="border border-border text-sm font-bold px-6 py-3 rounded-lg hover:bg-muted transition-colors"
              >
                SEE THE PROOF
              </Link>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              SOLRAD is independent. No VC funding. No token. No agenda.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
