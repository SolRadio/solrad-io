import { Shield, Lock, Eye, Database, CheckCircle2, AlertTriangle, Activity, BookOpen, Ban, Calculator, RefreshCw } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

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
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">

      {/* HEADER — centered */}
      <div className="text-center mb-12">
        <Shield className="text-primary mx-auto mb-4" size={36} aria-hidden="true" />
        <h1 className="text-4xl font-black uppercase tracking-tight">
          Security & Transparency
        </h1>
        <p className="text-sm text-muted-foreground mt-3">
          How we keep your experience safe
        </p>
      </div>

      {/* SECURITY MODEL */}
      <section className="mb-12">
        <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground text-center border-b border-border pb-2 mb-6">
          Security Model
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <Shield className="text-green-500 mx-auto" size={28} aria-hidden="true" />
            <h3 className="text-sm font-bold uppercase tracking-wide text-center mt-3">
              No Wallet Connection Required
            </h3>
            <p className="text-xs text-muted-foreground text-center mt-2 leading-relaxed">
              Browse and analyze tokens without connecting any wallet. SOLRAD is a read-only intelligence platform — you never need to link your private keys, sign transactions, or expose your assets.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <Lock className="text-green-500 mx-auto" size={28} aria-hidden="true" />
            <h3 className="text-sm font-bold uppercase tracking-wide text-center mt-3">
              No Private Keys, No Transactions
            </h3>
            <p className="text-xs text-muted-foreground text-center mt-2 leading-relaxed">
              SOLRAD does not request, store, or have access to your private keys. We cannot initiate transactions on your behalf. Your assets remain completely under your control at all times.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <Eye className="text-green-500 mx-auto" size={28} aria-hidden="true" />
            <h3 className="text-sm font-bold uppercase tracking-wide text-center mt-3">
              Read-Only Market Intelligence
            </h3>
            <p className="text-xs text-muted-foreground text-center mt-2 leading-relaxed">
              We only display data — no trading, swapping, or transaction capabilities. SOLRAD is purely informational. Any trading actions you take happen outside our platform through your own wallet and DEX of choice.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <Database className="text-green-500 mx-auto" size={28} aria-hidden="true" />
            <h3 className="text-sm font-bold uppercase tracking-wide text-center mt-3">
              No Personal Data Collection
            </h3>
            <p className="text-xs text-muted-foreground text-center mt-2 leading-relaxed">
              SOLRAD does not collect, store, or track personal identifying information. We don{"'"}t require email sign-ups, KYC, or user accounts. Your usage remains private.
            </p>
          </div>
        </div>
      </section>

      {/* DATA SOURCES */}
      <section className="mb-12">
        <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground text-center border-b border-border pb-2 mb-6">
          Data Sources
        </h2>
        <p className="text-sm text-muted-foreground text-center max-w-2xl mx-auto mb-6 leading-relaxed">
          All data displayed on SOLRAD comes from publicly accessible on-chain and API sources. We do not have privileged access to insider information or private data feeds.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <CheckCircle2 className="text-green-500 mx-auto" size={20} aria-hidden="true" />
            <h3 className="text-sm font-bold text-center mt-2">DexScreener API</h3>
            <p className="text-xs text-muted-foreground text-center mt-1">
              Price, volume, liquidity, and pair data for trending Solana tokens via public boosted tokens API endpoints.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <CheckCircle2 className="text-green-500 mx-auto" size={20} aria-hidden="true" />
            <h3 className="text-sm font-bold text-center mt-2">QuickNode On-Chain Data</h3>
            <p className="text-xs text-muted-foreground text-center mt-1">
              Token metadata, holder counts, authority status, and smart contract details via QuickNode RPC for on-chain verification and enrichment.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <CheckCircle2 className="text-green-500 mx-auto" size={20} aria-hidden="true" />
            <h3 className="text-sm font-bold text-center mt-2">Jupiter Aggregator</h3>
            <p className="text-xs text-muted-foreground text-center mt-1">
              Live price quotes and routing data for supported Solana tokens via Jupiter{"'"}s public APIs.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <CheckCircle2 className="text-green-500 mx-auto" size={20} aria-hidden="true" />
            <h3 className="text-sm font-bold text-center mt-2">Solana Blockchain</h3>
            <p className="text-xs text-muted-foreground text-center mt-1">
              Public on-chain data including transaction history, token supply, and program interactions.
            </p>
          </div>
        </div>
      </section>

      {/* TRANSPARENCY COMMITMENT */}
      <section className="mb-12">
        <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground text-center border-b border-border pb-2 mb-6">
          Transparency Commitment
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <BookOpen className="text-primary mx-auto" size={24} aria-hidden="true" />
            <h3 className="text-sm font-bold text-center mt-2">Open Scoring Methodology</h3>
            <p className="text-xs text-muted-foreground text-center mt-1">
              Our scoring system is fully documented and available at{" "}
              <Link href="/scoring" className="text-primary hover:underline">/scoring</Link>.
              We explain exactly how tokens are evaluated and why they receive their scores.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Ban className="text-primary mx-auto" size={24} aria-hidden="true" />
            <h3 className="text-sm font-bold text-center mt-2">No Paid Listings</h3>
            <p className="text-xs text-muted-foreground text-center mt-1">
              Tokens cannot pay to appear on SOLRAD or boost their scores. All listings are based purely on trending signals and on-chain fundamentals.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Calculator className="text-primary mx-auto" size={24} aria-hidden="true" />
            <h3 className="text-sm font-bold text-center mt-2">Deterministic Scoring</h3>
            <p className="text-xs text-muted-foreground text-center mt-1">
              Given the same input data, the same score will always be produced. Our algorithms are consistent, reproducible, and free from manual intervention.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <RefreshCw className="text-primary mx-auto" size={24} aria-hidden="true" />
            <h3 className="text-sm font-bold text-center mt-2">Real-Time Updates</h3>
            <p className="text-xs text-muted-foreground text-center mt-1">
              Market intelligence updates continuously with snapshots approximately every 5-10 minutes. You see the same data we see, when we see it.
            </p>
          </div>
        </div>
      </section>

      {/* USER SAFETY */}
      <section className="mb-12">
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6">
          <div className="text-center mb-4">
            <AlertTriangle className="text-yellow-500 mx-auto mb-2" size={28} aria-hidden="true" />
            <h2 className="text-sm font-bold uppercase tracking-wide">User Safety</h2>
          </div>
          <p className="text-center text-sm text-muted-foreground mb-5">
            While SOLRAD itself does not interact with your wallet or assets, the Solana ecosystem contains inherent risks:
          </p>
          <div className="space-y-3 max-w-2xl mx-auto">
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-orange-500 mt-2 shrink-0" />
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Smart Contract Risks:</strong> Tokens may contain bugs, vulnerabilities, or malicious code. Even high-scoring tokens can be exploited.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-orange-500 mt-2 shrink-0" />
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Market Volatility:</strong> Cryptocurrency prices can change drastically in seconds due to market conditions, liquidity shifts, or external factors.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-orange-500 mt-2 shrink-0" />
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Data Limitations:</strong> Our sources may experience delays, inaccuracies, or manipulation. Always verify critical information from multiple independent sources.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-orange-500 mt-2 shrink-0" />
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">No Endorsement:</strong> Presence on SOLRAD does not constitute endorsement, recommendation, or guarantee of any token or project.
              </p>
            </div>
          </div>
          <p className="text-center font-bold text-sm mt-4 text-foreground">
            Always DYOR (Do Your Own Research). Use SOLRAD as one tool among many in your research process, not as a sole decision-making authority. Understand the risks before interacting with any token or smart contract.
          </p>
        </div>
      </section>

      {/* QUESTIONS OR CONCERNS */}
      <section className="mb-8">
        <div className="bg-card border border-border rounded-xl p-6 text-center max-w-2xl mx-auto">
          <h2 className="text-sm font-bold uppercase tracking-wide text-center">
            Questions or Concerns?
          </h2>
          <p className="text-center text-sm text-muted-foreground mt-3 leading-relaxed">
            If you have questions about our security practices, data handling, or transparency policies, please reach out through our{" "}
            <Link href="/contact" className="text-primary hover:underline">contact page</Link>.
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            For urgent security issues or vulnerability reports, email:{" "}
            <a href="mailto:support@solrad.io" className="font-mono text-primary hover:underline">support@solrad.io</a>
          </p>
        </div>
      </section>
    </main>
      <Footer />
    </div>
  )
}
