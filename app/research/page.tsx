
import type { Metadata } from "next"
import { loadAllResearchReports } from "@/lib/research"
import { buildMetadata } from "@/lib/meta"
import { ResearchClient } from "./ResearchClient"
// ProofEngineStatusPanel removed — causes infinite render loop.
// Diagnostic data still available at /api/proof-engine-status (JSON).

export const dynamic = "force-dynamic"

export const metadata: Metadata = buildMetadata({
  title: "Proof Engine — Alpha Ledger | SOLRAD",
  description:
    "Append-only alpha ledger of SOLRAD Solana token signals with outcomes, win/loss labeling, and verification methodology. Export CSV and verify independently.",
  path: "/research",
  keywords: [
    "Solana proof engine",
    "alpha ledger",
    "signal proof",
    "crypto signal verification",
    "token signal outcomes",
    "blockchain intelligence",
    "SOLRAD proof",
    "Solana signals track record",
  ],
})

export default async function ResearchPage() {
  const reports = await loadAllResearchReports(30)

  // Serialize for client component
  const serialized = reports.map((r) => ({
    type: r.type,
    slug: r.slug,
    date: r.date,
    title: r.title,
    summary: r.summary,
    tags: r.tags,
    relatedTokens: r.relatedTokens,
  }))

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "SOLRAD Proof Engine",
    url: "https://www.solrad.io/research",
    description:
      "Append-only alpha ledger of SOLRAD Solana token signals with outcomes, win/loss labeling, and verification methodology. Export CSV and verify independently.",
    about: "Solana token signals, outcomes, alpha ledger",
    isPartOf: {
      "@type": "WebSite",
      name: "SOLRAD",
      url: "https://www.solrad.io",
    },
  }

  return (
    <div className="min-h-screen flex flex-col bg-background pb-[calc(env(safe-area-inset-bottom)+1rem)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="flex-1 container mx-auto px-3 md:px-4 py-6 md:py-12">
        <div className="max-w-7xl mx-auto">
          {process.env.NODE_ENV !== "production" && (
            <div className="mb-3">
              <a
                href="/api/proof-engine-status"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-muted-foreground/20 text-[10px] font-mono text-muted-foreground/60 hover:text-primary hover:border-primary/30 transition-colors"
              >
                Open Status JSON
              </a>
            </div>
          )}
          <ResearchClient reports={serialized} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
