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
import { SectionHeading } from "@/components/ui/section-heading"
import { SolButton } from "@/components/ui/sol-button"

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
    "solana token risk assessment",
    "solana alpha detection",
    "solana early detection",
    "solana on-chain proof",
    "solana lead-time proof",
    "crypto intelligence",
    "crypto signal detection",
    "crypto token scoring",
    "memecoin scanner",
    "dex token analysis",
    "solana meme coin scanner"
  ],
  openGraph: {
    title: "About SOLRAD | Solana Token Intelligence & Scoring Platform",
    description:
      "Read-only Solana token intelligence. Deterministic scoring 0-100, signal detection with on-chain proofs, and verifiable lead-time timestamps. No wallet required.",
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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(combinedSchema),
        }}
      />

      <main>
        {/* Hero */}
        <section className="py-20">
          <div className="mx-auto max-w-5xl px-6">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary mb-4">
              About SOLRAD
            </p>
            <h1 className="font-mono text-3xl font-bold uppercase tracking-tight text-foreground md:text-4xl">
              Built to show what{"'"}s about to trend.
            </h1>
            <div className="mt-3 h-px w-full bg-border" />
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              SOLRAD is an independent Solana token intelligence terminal built for solana token scoring.
              We score every active token 0-100 using observable on-chain signals — liquidity, volume,
              age, and token risk assessment factors — then timestamp every signal detection to the{" "}
              <Link href="/research" className="text-primary hover:underline">Alpha Ledger</Link>{" "}
              so you can verify we saw it first.
            </p>
          </div>
        </section>

        {/* Stat Cards */}
        <section className="border-t border-border py-16">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid gap-px bg-border md:grid-cols-3">
              {[
                { icon: Database, value: "2", label: "Data Sources", sub: "DexScreener + QuickNode RPC", color: "text-primary" },
                { icon: BarChart2, value: "0-100", label: "Composite Score", sub: "10 observable signal dimensions", color: "text-primary" },
                { icon: Shield, value: "Read-Only", label: "No Wallet Needed", sub: "No keys. No trades. No custody.", color: "text-primary" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center bg-background p-6">
                  <stat.icon className={stat.color} size={24} aria-hidden="true" />
                  <p className="mt-3 font-mono text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="border-t border-border py-20">
          <div className="mx-auto max-w-5xl px-6">
            <SectionHeading sub="Four steps from raw blockchain data to verified proof">
              How It Works
            </SectionHeading>

            <div className="grid gap-px bg-border md:grid-cols-2">
              {[
                {
                  icon: Download, step: "01", label: "Ingest", title: "Data Collection",
                  desc: "Every 2 minutes, we pull price, volume, liquidity, and pair data for active Solana tokens from DexScreener and QuickNode RPC.",
                },
                {
                  icon: Calculator, step: "02", label: "Score", title: "Deterministic Scoring",
                  desc: "We apply a fixed, published formula across 10 signal dimensions. Same inputs always produce the same score. No black box, no model drift.",
                },
                {
                  icon: Zap, step: "03", label: "Detect", title: "Signal Detection",
                  desc: <>When a token{"'"}s score crosses a threshold for the first time, we timestamp the detection and log it to the append-only Alpha Ledger. <Link href="/saw-it-first" className="text-primary hover:underline">See recent detections</Link>.</>,
                },
                {
                  icon: CheckCircle, step: "04", label: "Prove", title: "Lead-Time Proof",
                  desc: <>Every detection is logged with the Solana block number. This creates a verifiable timestamp proving exactly when we first observed the signal — before market reaction. Track <Link href="/signals" className="text-primary hover:underline">signal outcomes</Link> to see how detections perform over time.</>,
                },
              ].map((item) => (
                <div key={item.step} className="flex flex-col bg-background p-6">
                  <item.icon className="text-primary" size={20} aria-hidden="true" />
                  <p className="mt-3 font-mono text-xs uppercase text-primary">{item.step} &mdash; {item.label}</p>
                  <p className="mt-1 text-sm font-bold text-foreground">{item.title}</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What We Are Not */}
        <section className="border-t border-border py-20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mx-auto max-w-2xl border border-primary/20 p-8">
              <XCircle className="text-primary" size={24} aria-hidden="true" />
              <h2 className="mt-3 mb-6 font-mono text-sm font-bold uppercase tracking-[0.2em] text-foreground">
                What SOLRAD Is Not
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { title: "Not a Trading Tool", desc: "We show data. You decide." },
                  { title: "Not Predictive", desc: "We observe the present, not the future." },
                  { title: "Not Custodial", desc: "We never touch your wallet or funds." },
                  { title: "Not a Black Box", desc: <>Our full <Link href="/scoring" className="text-primary hover:underline">scoring methodology</Link> is published.</> },
                ].map((item) => (
                  <div key={String(item.title)}>
                    <h3 className="text-xs font-bold uppercase text-foreground">{item.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Trust Principles */}
        <section className="border-t border-border py-20">
          <div className="mx-auto max-w-5xl px-6">
            <SectionHeading>Why Traders Trust SOLRAD</SectionHeading>

            <div className="grid gap-px bg-border md:grid-cols-2">
              {[
                { icon: Shield, title: "Read-Only Architecture", desc: "SOLRAD has no wallet integration, no trade execution, and no access to user funds. It reads public blockchain data only." },
                { icon: Eye, title: "Transparent Methodology", desc: <>Every scoring dimension is documented and published at <Link href="/scoring" className="text-primary hover:underline">solrad.io/scoring</Link>. No hidden factors.</> },
                { icon: Lock, title: "Append-Only Ledger", desc: "Signal detections are written once and never edited. The historical record is immutable and exportable." },
                { icon: Clock, title: "Verifiable Timestamps", desc: "Every detection is logged with Solana block numbers that can be independently verified on any block explorer." },
              ].map((item) => (
                <div key={item.title} className="flex flex-col bg-background p-6">
                  <item.icon className="text-primary" size={20} aria-hidden="true" />
                  <h3 className="mt-3 text-sm font-bold uppercase text-foreground">{item.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border py-20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="flex flex-wrap items-center gap-4">
              <SolButton href="/">START EXPLORING</SolButton>
              <SolButton href="/research" variant="secondary">SEE THE PROOF</SolButton>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              SOLRAD is independent. No VC funding. No token. No agenda.
            </p>
          </div>
        </section>
      </main>
    </>
  )
}
