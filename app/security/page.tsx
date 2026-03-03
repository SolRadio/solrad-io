import { Shield, Lock, Eye, Database, CheckCircle2, AlertTriangle, BookOpen, Ban, Calculator, RefreshCw } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"
import { SectionHeading } from "@/components/ui/section-heading"

export const metadata: Metadata = {
  title: "Security & Transparency | SOLRAD — Read-Only Solana Intelligence",
  description:
    "SOLRAD is a read-only platform. No wallet connection, no private keys, no personal data collection. Learn how we keep your experience safe and our data sources transparent.",
  alternates: {
    canonical: "https://www.solrad.io/security",
  },
  openGraph: {
    title: "Security & Transparency | SOLRAD — Read-Only Solana Intelligence",
    description:
      "SOLRAD is a read-only platform. No wallet connection, no private keys, no personal data collection.",
    url: "https://www.solrad.io/security",
  },
  twitter: {
    card: "summary_large_image",
    title: "Security & Transparency | SOLRAD",
    description:
      "Read-only Solana intelligence. No wallet connection, no private keys, no personal data collection.",
  },
}

export default function SecurityPage() {
  return (
    <main className="py-12">
      <div className="mx-auto max-w-5xl px-6">

      <SectionHeading as="h1" sub="How we keep your experience safe">
        Security & Transparency
      </SectionHeading>

      {/* SECURITY MODEL */}
      <section className="mb-12">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground border-b border-border pb-2 mb-6">
          Security Model
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: Shield, title: "No Wallet Connection Required", text: "Browse and analyze tokens without connecting any wallet. SOLRAD is a read-only intelligence platform \u2014 you never need to link your private keys, sign transactions, or expose your assets." },
            { icon: Lock, title: "No Private Keys, No Transactions", text: "SOLRAD does not request, store, or have access to your private keys. We cannot initiate transactions on your behalf. Your assets remain completely under your control at all times." },
            { icon: Eye, title: "Read-Only Market Intelligence", text: "We only display data \u2014 no trading, swapping, or transaction capabilities. SOLRAD is purely informational. Any trading actions you take happen outside our platform through your own wallet and DEX of choice." },
            { icon: Database, title: "No Personal Data Collection", text: "SOLRAD does not collect, store, or track personal identifying information. We don\u2019t require email sign-ups, KYC, or user accounts. Your usage remains private." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="border border-border p-6">
              <Icon className="text-green-500 mb-3" size={28} aria-hidden="true" />
              <h3 className="font-mono text-sm font-bold uppercase tracking-[0.15em] text-foreground">
                {title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* DATA SOURCES */}
      <section className="mb-12">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground border-b border-border pb-2 mb-6">
          Data Sources
        </h2>
        <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          All data displayed on SOLRAD comes from publicly accessible on-chain and API sources. We do not have privileged access to insider information or private data feeds.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: "DexScreener API", text: "Price, volume, liquidity, and pair data for trending Solana tokens via public boosted tokens API endpoints." },
            { title: "QuickNode On-Chain Data", text: "Token metadata, holder counts, authority status, and smart contract details via QuickNode RPC for on-chain verification and enrichment." },
            { title: "Jupiter Aggregator", text: "Live price quotes and routing data for supported Solana tokens via Jupiter\u2019s public APIs." },
            { title: "Solana Blockchain", text: "Public on-chain data including transaction history, token supply, and program interactions." },
          ].map(({ title, text }) => (
            <div key={title} className="border border-border p-4">
              <CheckCircle2 className="text-green-500 mb-2" size={20} aria-hidden="true" />
              <h3 className="font-mono text-sm font-bold">{title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TRANSPARENCY COMMITMENT */}
      <section className="mb-12">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground border-b border-border pb-2 mb-6">
          Transparency Commitment
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: BookOpen, title: "Open Scoring Methodology", text: <>Our scoring system is fully documented and available at{" "}<Link href="/scoring" className="text-primary hover:underline">/scoring</Link>. We explain exactly how tokens are evaluated and why they receive their scores.</> },
            { icon: Ban, title: "No Paid Listings", text: "Tokens cannot pay to appear on SOLRAD or boost their scores. All listings are based purely on trending signals and on-chain fundamentals." },
            { icon: Calculator, title: "Deterministic Scoring", text: "Given the same input data, the same score will always be produced. Our algorithms are consistent, reproducible, and free from manual intervention." },
            { icon: RefreshCw, title: "Real-Time Updates", text: "Market intelligence updates continuously with snapshots approximately every 5-10 minutes. You see the same data we see, when we see it." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="border border-border p-4">
              <Icon className="text-primary mb-2" size={24} aria-hidden="true" />
              <h3 className="font-mono text-sm font-bold">{title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* USER SAFETY */}
      <section className="mb-12">
        <div className="border border-destructive/20 p-6">
          <div className="mb-4">
            <AlertTriangle className="text-yellow-500 mb-2" size={28} aria-hidden="true" />
            <h2 className="font-mono text-sm font-bold uppercase tracking-[0.15em]">User Safety</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            While SOLRAD itself does not interact with your wallet or assets, the Solana ecosystem contains inherent risks:
          </p>
          <div className="space-y-3 max-w-2xl">
            {[
              { label: "Smart Contract Risks:", text: "Tokens may contain bugs, vulnerabilities, or malicious code. Even high-scoring tokens can be exploited." },
              { label: "Market Volatility:", text: "Cryptocurrency prices can change drastically in seconds due to market conditions, liquidity shifts, or external factors." },
              { label: "Data Limitations:", text: "Our sources may experience delays, inaccuracies, or manipulation. Always verify critical information from multiple independent sources." },
              { label: "No Endorsement:", text: "Presence on SOLRAD does not constitute endorsement, recommendation, or guarantee of any token or project." },
            ].map(({ label, text }) => (
              <div key={label} className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 bg-orange-500 mt-2 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">{label}</strong> {text}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm font-bold text-foreground">
            Always DYOR (Do Your Own Research). Use SOLRAD as one tool among many in your research process, not as a sole decision-making authority.
          </p>
        </div>
      </section>

      {/* QUESTIONS OR CONCERNS */}
      <section className="mb-8">
        <div className="border border-border p-6 max-w-2xl">
          <h2 className="font-mono text-sm font-bold uppercase tracking-[0.15em]">
            Questions or Concerns?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            If you have questions about our security practices, data handling, or transparency policies, please reach out through our{" "}
            <Link href="/contact" className="text-primary hover:underline">contact page</Link>.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            For urgent security issues or vulnerability reports, email:{" "}
            <a href="mailto:support@solrad.io" className="font-mono text-primary hover:underline">support@solrad.io</a>
          </p>
        </div>
      </section>
    </div>
    </main>
  )
}
