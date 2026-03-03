import { Metadata } from "next"
import Link from "next/link"
import { Shield, FileText, ArrowRight, Download, BookOpen, Globe, CheckCircle2 } from "lucide-react"
import { SolButton } from "@/components/ui/sol-button"

export const metadata: Metadata = {
  title: "Whitepaper | SOLRAD Proof Protocol",
  description:
    "Full technical specification for SOLRAD Proof Protocol. Cryptographic signal verification, Merkle trees, and on-chain attestation on Solana.",
  alternates: { canonical: "https://www.solrad.io/whitepaper" },
  openGraph: {
    title: "Whitepaper | SOLRAD Proof Protocol",
    description: "Full technical specification for SOLRAD Proof Protocol. Cryptographic signal verification and on-chain attestation on Solana.",
    images: [{ url: "/brand/og-1200x630.png", width: 1200, height: 630, alt: "SOLRAD Whitepaper — Solana Token Intelligence" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Whitepaper | SOLRAD Proof Protocol",
    description: "Full technical specification for SOLRAD Proof Protocol.",
    images: ["/brand/twitter-1200x630.png"],
  },
}

export default function WhitepaperPage() {
  const sections = [
    { number: 1, title: "Abstract" },
    { number: 2, title: "The Problem" },
    { number: 3, title: "The Solution: SOLRAD Proof Protocol" },
    { number: 4, title: "Technical Architecture" },
    { number: 5, title: "Independent Verification" },
    { number: 6, title: "Scoring Methodology" },
    { number: 7, title: "Track Record and Data" },
    { number: 8, title: "Ecosystem Significance" },
    { number: 9, title: "Future Direction" },
    { number: 10, title: "Security Considerations" },
  ]

  return (
    <main>
      <div className="mx-auto max-w-5xl px-6 py-12 md:py-16 space-y-12">
          {/* Header */}
          <header className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 bg-green-500/10 border border-green-500/20">
                <Shield className="h-5 w-5 text-green-400" />
              </div>
              <div className="flex items-center justify-center h-10 w-10 bg-green-500/10 border border-green-500/20">
                <FileText className="h-5 w-5 text-green-400" />
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-mono font-bold text-foreground tracking-tight text-balance">
              SOLRAD PROOF PROTOCOL
            </h1>
            <p className="text-sm font-mono text-muted-foreground">
              {"Whitepaper v1.0 \u2014 February 2026"}
            </p>
          </header>

          {/* Highlights */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <HighlightCard
              icon={<BookOpen className="h-5 w-5 text-green-400" />}
              title="10 Sections"
              description="Full technical coverage"
            />
            <HighlightCard
              icon={<Globe className="h-5 w-5 text-green-400" />}
              title="Live Data"
              description="Real on-chain transactions"
            />
            <HighlightCard
              icon={<CheckCircle2 className="h-5 w-5 text-green-400" />}
              title="Open Verification"
              description="Public APIs"
            />
          </section>

          {/* Download Card */}
          <section className="bg-card border border-green-500/20 p-8 flex flex-col items-center text-center space-y-5">
            <FileText className="h-10 w-10 text-green-400" />
            <a
              href="/SOLRAD-Proof-Protocol-Whitepaper-v1.pdf"
              download="SOLRAD-Proof-Protocol-Whitepaper-v1.pdf"
              className="inline-block"
            >
              <span className="inline-flex items-center gap-2 border border-primary px-6 py-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary/10">
                <Download className="h-4 w-4" />
                {"DOWNLOAD WHITEPAPER PDF \u2192"}
              </span>
            </a>
            <p className="text-xs font-mono text-muted-foreground">
              {"Version 1.0 \u00B7 February 2026 \u00B7 PDF"}
            </p>
          </section>

          {/* Table of Contents */}
          <section className="space-y-4">
            <h2 className="text-xs font-mono text-muted-foreground tracking-[0.3em]">
              TABLE OF CONTENTS
            </h2>
            <div className="border border-border bg-card divide-y divide-border">
              {sections.map((s) => (
                <div
                  key={s.number}
                  className="flex items-center gap-4 px-4 py-3"
                >
                  <span className="text-xs font-mono font-bold text-green-400 tabular-nums w-6 text-right">
                    {s.number}.
                  </span>
                  <span className="text-sm font-mono text-foreground">
                    {s.title}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-4 px-4 py-3 bg-muted/30">
                <span className="text-xs font-mono font-bold text-muted-foreground tabular-nums w-6 text-right">
                  +
                </span>
                <span className="text-sm font-mono text-muted-foreground">
                  Appendices
                </span>
              </div>
            </div>
          </section>

          {/* Full Whitepaper Content */}
          <section className="space-y-10 border-t border-border pt-10">
            <h2 className="text-xs font-mono text-muted-foreground tracking-[0.3em]">
              FULL WHITEPAPER
            </h2>

            {/* Abstract */}
            <article className="space-y-4">
              <h3 className="text-lg font-mono font-bold text-foreground">Abstract</h3>
              <p className="text-sm font-mono text-muted-foreground leading-relaxed">
                SOLRAD is a real-time signal intelligence platform for the Solana ecosystem that introduces the first cryptographic proof layer for early token detection. While existing platforms surface trending tokens and trading signals, none provide verifiable proof that their detections preceded price movements. {"SOLRAD's"} Proof Protocol addresses this fundamental trust problem.
              </p>
              <p className="text-sm font-mono text-muted-foreground leading-relaxed">
                Every signal SOLRAD detects is SHA256-hashed at the moment of detection, capturing the mint address, detection timestamp, entry price, and SOLRAD score in a tamper-evident fingerprint. Daily signal batches are combined into Merkle trees, and the root hash is published to Solana mainnet via memo transaction. This creates an immutable, publicly verifiable record of signal intelligence that anyone can audit without trusting SOLRAD.
              </p>
              <p className="text-sm font-mono text-muted-foreground leading-relaxed">
                As of February 26, 2026, SOLRAD has recorded 405 signals in the Alpha Ledger since February 11, 2026, with the first on-chain proof published to Solana block 402900668. The proof system operates continuously, publishing daily batches at midnight UTC with a transaction cost of approximately $0.0004 per proof.
              </p>
            </article>

            {/* Section 1 */}
            <article className="space-y-4">
              <h3 className="text-lg font-mono font-bold text-foreground">1. The Problem: Unverifiable Signal Claims</h3>
              <p className="text-sm font-mono text-muted-foreground leading-relaxed">
                {"The crypto trading intelligence market is built on trust that cannot be verified. Platforms claim to detect tokens early, identify emerging trends, and surface high-conviction signals \u2014 but provide no cryptographic proof that their detections preceded price movements."}
              </p>
              <div className="space-y-3 pl-4 border-l-2 border-green-500/20">
                <div>
                  <p className="text-sm font-mono font-bold text-foreground">1.1 Retroactive Attribution</p>
                  <p className="text-xs font-mono text-muted-foreground leading-relaxed mt-1">
                    Any platform can claim it detected a token early after the token has already pumped. Without timestamped, tamper-evident records created before the price movement, early detection claims are indistinguishable from retroactive attribution.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-mono font-bold text-foreground">1.2 No Auditable Track Record</p>
                  <p className="text-xs font-mono text-muted-foreground leading-relaxed mt-1">
                    Existing platforms display win rates and accuracy statistics, but these figures are self-reported and cannot be independently audited. The underlying signal data is controlled entirely by the platform.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-mono font-bold text-foreground">1.3 Trust as Infrastructure</p>
                  <p className="text-xs font-mono text-muted-foreground leading-relaxed mt-1">
                    The entire market for signal intelligence rests on trust in the platform operator. This is antithetical to the ethos of the blockchain ecosystem, where trustless verification is a core primitive.
                  </p>
                </div>
              </div>
            </article>

            {/* Section 2 */}
            <article className="space-y-4">
              <h3 className="text-lg font-mono font-bold text-foreground">2. The Solution: SOLRAD Proof Protocol</h3>
              <p className="text-sm font-mono text-muted-foreground leading-relaxed">
                SOLRAD Proof Protocol is a three-stage pipeline that transforms signal detection events into cryptographically verifiable, on-chain attestations.
              </p>

              <div className="space-y-5 pl-4 border-l-2 border-green-500/20">
                <div className="space-y-2">
                  <p className="text-sm font-mono font-bold text-foreground">2.1 Stage One: Detect and Hash</p>
                  <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                    {"When SOLRAD's scoring engine detects a qualifying signal, the following data is immediately captured and SHA256-hashed:"}
                  </p>
                  <div className="bg-card border border-border overflow-x-auto">
                    <table className="w-full text-[11px] font-mono">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="text-left px-3 py-2 font-medium">Field</th>
                          <th className="text-left px-3 py-2 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-green-400">mint</td><td className="px-3 py-1.5">Solana mint address (44 chars, base58)</td></tr>
                        <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-green-400">detectedAtUnix</td><td className="px-3 py-1.5">Unix timestamp of detection (seconds)</td></tr>
                        <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-green-400">entryPriceUsd</td><td className="px-3 py-1.5">Token price in USD at detection</td></tr>
                        <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-green-400">solradScore</td><td className="px-3 py-1.5">SOLRAD composite score (0-100)</td></tr>
                        <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-green-400">signalType</td><td className="px-3 py-1.5">Detection classification</td></tr>
                        <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-green-400">sequenceNumber</td><td className="px-3 py-1.5">Global monotonic sequence number</td></tr>
                        <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-green-400">volume24h</td><td className="px-3 py-1.5">24-hour volume in USD</td></tr>
                        <tr><td className="px-3 py-1.5 text-green-400">liquidityUsd</td><td className="px-3 py-1.5">Total liquidity in USD</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-[#0a0a0a] border border-border p-3 text-[10px] font-mono text-green-400/80 break-all">
                    {"mint|detectedAtUnix|entryPriceUsd|solradScore|signalType|sequenceNumber|volume24h|liquidityUsd"}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-mono font-bold text-foreground">2.2 Stage Two: Merkle Tree Batching</p>
                  <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                    {"At midnight UTC each day, all signal hashes from the previous 24 hours are combined into a binary Merkle tree. The Merkle tree provides tamper evidence (modifying any single signal hash changes every ancestor node up to the root) and efficient verification (any individual signal can be verified against the Merkle root using only O(log n) hash operations)."}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-mono font-bold text-foreground">2.3 Stage Three: Solana Publication</p>
                  <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                    {"The Merkle root is published to Solana mainnet via a memo transaction from SOLRAD's dedicated proof wallet. The memo format encodes:"}
                  </p>
                  <div className="bg-[#0a0a0a] border border-border p-3 text-[10px] font-mono text-green-400/80">
                    {"SOLRAD:{date}:{merkleRoot_first16chars}:{signalCount}:{timestamp}"}
                  </div>
                  <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                    Transaction costs are approximately 0.000005 SOL (~$0.0004) per daily proof, making the system economically sustainable indefinitely.
                  </p>
                </div>
              </div>
            </article>

            {/* Section 3 */}
            <article className="space-y-4">
              <h3 className="text-lg font-mono font-bold text-foreground">3. Technical Architecture</h3>

              <div className="space-y-5 pl-4 border-l-2 border-green-500/20">
                <div className="space-y-2">
                  <p className="text-sm font-mono font-bold text-foreground">3.1 Signal Scoring Engine</p>
                  <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                    {"SOLRAD's scoring engine evaluates all Solana SPL tokens with a minimum liquidity floor of $5,000. Tokens are scored on a 0-100 composite scale incorporating volume momentum, liquidity depth, price action, holder distribution, token age, and boost signals. Tokens scoring above 50 are automatically tracked. Tokens scoring above 60 generate Alpha Ledger entries. The scoring engine runs every 5 minutes across 185+ tracked tokens."}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-mono font-bold text-foreground">3.2 Alpha Ledger</p>
                  <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                    {"The Alpha Ledger is SOLRAD's persistent signal record. Every qualifying detection event creates a ledger entry containing the unique ID, mint address, symbol, detection timestamp, detection type, SOLRAD score, entry price, SHA256 entryHash, and outcome classification (updated after 48h)."}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                    As of February 26, 2026, the Alpha Ledger contains 405 entries recorded since February 11, 2026.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-mono font-bold text-foreground">3.3 KV Storage Architecture</p>
                  <div className="bg-card border border-border overflow-x-auto">
                    <table className="w-full text-[11px] font-mono">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="text-left px-3 py-2 font-medium">Key Pattern</th>
                          <th className="text-left px-3 py-2 font-medium">Purpose</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-green-400">{"solrad:proof:signal:{proofId}"}</td><td className="px-3 py-1.5">Individual signal proof (1yr TTL)</td></tr>
                        <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-green-400">{"solrad:proof:signal:byHash:{hash}"}</td><td className="px-3 py-1.5">Reverse lookup by entryHash (1yr TTL)</td></tr>
                        <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-green-400">{"solrad:proof:daily:{date}"}</td><td className="px-3 py-1.5">Daily SHA256 hash array (48h TTL)</td></tr>
                        <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-green-400">{"solrad:proof:publication:{date}"}</td><td className="px-3 py-1.5">Publication record with Solana TX (1yr TTL)</td></tr>
                        <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-green-400">solrad:proof:latest-root</td><td className="px-3 py-1.5">Most recent Merkle root</td></tr>
                        <tr><td className="px-3 py-1.5 text-green-400">solrad:alpha:ledger</td><td className="px-3 py-1.5">Full Alpha Ledger entry array</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-mono font-bold text-foreground">3.4 Verification API</p>
                  <div className="bg-card border border-border overflow-x-auto">
                    <table className="w-full text-[11px] font-mono">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="text-left px-3 py-2 font-medium">Endpoint</th>
                          <th className="text-left px-3 py-2 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-green-400">GET /api/proof/history</td><td className="px-3 py-1.5">All proof publications with Solana TX sigs</td></tr>
                        <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-green-400">{"GET /api/proof/verify/{signalId}"}</td><td className="px-3 py-1.5">Verify a specific signal by ID or entryHash</td></tr>
                        <tr><td className="px-3 py-1.5 text-green-400">{"GET /api/proof/verify-tx?sig={sig}"}</td><td className="px-3 py-1.5">Check Solana TX confirmation status</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </article>

            {/* Section 4 */}
            <article className="space-y-4">
              <h3 className="text-lg font-mono font-bold text-foreground">4. Independent Verification</h3>
              <p className="text-sm font-mono text-muted-foreground leading-relaxed">
                {"SOLRAD Proof Protocol is designed so that any technically capable party can independently verify SOLRAD's signal history without trusting SOLRAD."}
              </p>
              <div className="space-y-3 pl-4 border-l-2 border-green-500/20">
                <div>
                  <p className="text-sm font-mono font-bold text-foreground">Step 1: Retrieve Proof History</p>
                  <div className="bg-[#0a0a0a] border border-border p-2 mt-1 text-[10px] font-mono text-green-400/80 break-all">
                    GET https://www.solrad.io/api/proof/history
                  </div>
                </div>
                <div>
                  <p className="text-sm font-mono font-bold text-foreground">Step 2: Verify On Solana</p>
                  <p className="text-xs font-mono text-muted-foreground leading-relaxed mt-1">
                    Take any Solana transaction signature and verify it on any Solana explorer. The transaction timestamp is immutable and predates any price action that occurred after detection.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-mono font-bold text-foreground">Step 3: Verify Individual Signals</p>
                  <div className="bg-[#0a0a0a] border border-border p-2 mt-1 text-[10px] font-mono text-green-400/80 break-all">
                    {"GET https://www.solrad.io/api/proof/verify/{entryHash}"}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-mono font-bold text-foreground">Step 4: Reconstruct the Merkle Tree</p>
                  <p className="text-xs font-mono text-muted-foreground leading-relaxed mt-1">
                    The daily hash array can be retrieved and the Merkle tree reconstructed locally. The resulting root hash must match the value published on Solana. Any discrepancy indicates tampering.
                  </p>
                </div>
              </div>
            </article>

            {/* Section 5 */}
            <article className="space-y-4">
              <h3 className="text-lg font-mono font-bold text-foreground">5. Scoring Methodology</h3>
              <div className="bg-card border border-border overflow-x-auto">
                <table className="w-full text-[11px] font-mono">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left px-3 py-2 font-medium">Dimension</th>
                      <th className="text-left px-3 py-2 font-medium">Weight</th>
                      <th className="text-left px-3 py-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-foreground">Volume Momentum</td><td className="px-3 py-1.5 text-green-400">High</td><td className="px-3 py-1.5">Multi-timeframe volume acceleration</td></tr>
                    <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-foreground">Liquidity Depth</td><td className="px-3 py-1.5 text-green-400">Medium</td><td className="px-3 py-1.5">Absolute and relative liquidity</td></tr>
                    <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-foreground">Price Velocity</td><td className="px-3 py-1.5 text-green-400">Medium</td><td className="px-3 py-1.5">Rate of price change across timeframes</td></tr>
                    <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-foreground">Holder Distribution</td><td className="px-3 py-1.5 text-green-400">Medium</td><td className="px-3 py-1.5">Holder growth and concentration risk</td></tr>
                    <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-foreground">Token Age</td><td className="px-3 py-1.5 text-muted-foreground">Low</td><td className="px-3 py-1.5">Age-normalized scoring</td></tr>
                    <tr><td className="px-3 py-1.5 text-foreground">Boost Activity</td><td className="px-3 py-1.5 text-muted-foreground">Low</td><td className="px-3 py-1.5">On-chain promotional signals</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-card border border-border overflow-x-auto mt-4">
                <table className="w-full text-[11px] font-mono">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left px-3 py-2 font-medium">Score</th>
                      <th className="text-left px-3 py-2 font-medium">Interpretation</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-green-400 font-bold">80-100</td><td className="px-3 py-1.5">STRONG -- High conviction, multiple confirming factors</td></tr>
                    <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-green-400">65-79</td><td className="px-3 py-1.5">EARLY -- Emerging signal, strong primary indicators</td></tr>
                    <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-foreground">50-64</td><td className="px-3 py-1.5">DETECTED -- Qualifying signal, monitoring recommended</td></tr>
                    <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-muted-foreground">30-49</td><td className="px-3 py-1.5">WATCH -- Below signal threshold, tracking only</td></tr>
                    <tr><td className="px-3 py-1.5 text-muted-foreground/50">0-29</td><td className="px-3 py-1.5">LOW -- Insufficient signal strength</td></tr>
                  </tbody>
                </table>
              </div>
            </article>

            {/* Section 6 */}
            <article className="space-y-4">
              <h3 className="text-lg font-mono font-bold text-foreground">6. Track Record and Data</h3>
              <div className="bg-card border border-border overflow-x-auto">
                <table className="w-full text-[11px] font-mono">
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-foreground font-medium w-48">Alpha Ledger Entries</td><td className="px-3 py-1.5">405 signals recorded</td></tr>
                    <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-foreground font-medium">Tracking Start Date</td><td className="px-3 py-1.5">February 11, 2026</td></tr>
                    <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-foreground font-medium">First On-Chain Proof</td><td className="px-3 py-1.5">February 26, 2026</td></tr>
                    <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-foreground font-medium">First Proof Block</td><td className="px-3 py-1.5">Solana Block 402900668</td></tr>
                    <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-foreground font-medium">Tokens Tracked</td><td className="px-3 py-1.5">185+ SPL tokens</td></tr>
                    <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-foreground font-medium">Scoring Frequency</td><td className="px-3 py-1.5">Every 5 minutes</td></tr>
                    <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-foreground font-medium">Daily Proof Cost</td><td className="px-3 py-1.5">~0.000005 SOL (~$0.0004)</td></tr>
                    <tr><td className="px-3 py-1.5 text-foreground font-medium">Proof Wallet</td><td className="px-3 py-1.5 text-green-400 break-all">Ft13xQcBJaLgTzgHWgvzVrvZNiPKZVhpE91qTM6Q9dzh</td></tr>
                  </tbody>
                </table>
              </div>
            </article>

            {/* Section 7 */}
            <article className="space-y-4">
              <h3 className="text-lg font-mono font-bold text-foreground">7. Ecosystem Significance</h3>
              <div className="space-y-3 pl-4 border-l-2 border-green-500/20">
                <div>
                  <p className="text-sm font-mono font-bold text-foreground">7.1 A New Standard for Signal Platforms</p>
                  <p className="text-xs font-mono text-muted-foreground leading-relaxed mt-1">
                    {"SOLRAD establishes a verifiable baseline that other signal platforms can adopt or be measured against. The question \"can you prove you found it early?\" now has a technical answer."}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-mono font-bold text-foreground">7.2 Infrastructure for Ecosystem Builders</p>
                  <p className="text-xs font-mono text-muted-foreground leading-relaxed mt-1">
                    The Proof Protocol API is publicly accessible. DeFi protocols, trading bots, DAOs, and on-chain governance systems can consume verified SOLRAD signal data with cryptographic confidence.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-mono font-bold text-foreground">7.3 Immutable Historical Record</p>
                  <p className="text-xs font-mono text-muted-foreground leading-relaxed mt-1">
                    {"As SOLRAD's proof chain grows \u2014 one Solana transaction per day \u2014 it builds an immutable archive of Solana token market intelligence. In one year, there will be 365 on-chain transactions representing hundreds of thousands of signal detections."}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-mono font-bold text-foreground">7.4 Complementary to Existing Infrastructure</p>
                  <p className="text-xs font-mono text-muted-foreground leading-relaxed mt-1">
                    SOLRAD does not compete with block explorers, DEX aggregators, or on-chain analytics platforms. It occupies a distinct layer: verified signal intelligence. DexScreener shows you what is happening. SOLRAD proves what it detected before it happened.
                  </p>
                </div>
              </div>
            </article>

            {/* Section 8 */}
            <article className="space-y-4">
              <h3 className="text-lg font-mono font-bold text-foreground">8. Future Direction</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-mono font-bold text-green-400">Near Term (Q1-Q2 2026)</p>
                  <ul className="mt-2 space-y-1 text-xs font-mono text-muted-foreground leading-relaxed list-none">
                    <li>{"-- Outcome tracking: Automated win/loss classification after 48-hour observation"}</li>
                    <li>{"-- Verified win rate publication with on-chain proof"}</li>
                    <li>{"-- API access tier for developers and institutional users"}</li>
                    <li>{"-- Extended proof data: volume and liquidity in proof hashes"}</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-mono font-bold text-foreground">Medium Term (Q3-Q4 2026)</p>
                  <ul className="mt-2 space-y-1 text-xs font-mono text-muted-foreground leading-relaxed list-none">
                    <li>{"-- Proof Protocol SDK: Open-source signal attestation library"}</li>
                    <li>{"-- Cross-chain expansion"}</li>
                    <li>{"-- Institutional data access with SLA guarantees"}</li>
                    <li>{"-- Solana Foundation integration"}</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-mono font-bold text-muted-foreground">Long Term (2027+)</p>
                  <ul className="mt-2 space-y-1 text-xs font-mono text-muted-foreground/70 leading-relaxed list-none">
                    <li>{"-- Decentralized proof validation"}</li>
                    <li>{"-- On-chain governance integration"}</li>
                    <li>{"-- Protocol licensing as a primitive"}</li>
                  </ul>
                </div>
              </div>
            </article>

            {/* Section 9 */}
            <article className="space-y-4">
              <h3 className="text-lg font-mono font-bold text-foreground">9. Security Considerations</h3>
              <div className="space-y-3 pl-4 border-l-2 border-green-500/20">
                <div>
                  <p className="text-sm font-mono font-bold text-foreground">9.1 Proof Wallet Security</p>
                  <p className="text-xs font-mono text-muted-foreground leading-relaxed mt-1">
                    {"The proof wallet private key is stored in Vercel's encrypted secret store. The wallet holds minimal SOL (0.01 SOL) sufficient only for transaction fees. Compromise cannot alter historical on-chain records."}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-mono font-bold text-foreground">9.2 Hash Collision Resistance</p>
                  <p className="text-xs font-mono text-muted-foreground leading-relaxed mt-1">
                    SHA256 collision resistance (2^128 operations for a birthday attack) provides sufficient security. A collision attack would require computational resources far exceeding any plausible economic incentive.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-mono font-bold text-foreground">9.3 Merkle Tree Integrity</p>
                  <p className="text-xs font-mono text-muted-foreground leading-relaxed mt-1">
                    The implementation uses pairwise SHA256 hashing with even-leaf padding. The root hash is deterministic given the input leaf set and can be independently reconstructed.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-mono font-bold text-foreground">9.4 RPC Redundancy</p>
                  <p className="text-xs font-mono text-muted-foreground leading-relaxed mt-1">
                    Proof publication uses a multi-endpoint RPC strategy with primary, secondary, and QuickNode fallback to ensure publication succeeds even during individual endpoint outages.
                  </p>
                </div>
              </div>
            </article>

            {/* Section 10 */}
            <article className="space-y-4">
              <h3 className="text-lg font-mono font-bold text-foreground">10. Conclusion</h3>
              <p className="text-sm font-mono text-muted-foreground leading-relaxed">
                Trust in trading intelligence platforms has historically been a matter of reputation, not mathematics. SOLRAD Proof Protocol changes this. By anchoring signal detection events to the Solana blockchain at the moment of detection, SOLRAD creates a verifiable track record that is immune to retroactive manipulation.
              </p>
              <p className="text-sm font-mono text-muted-foreground leading-relaxed">
                {"The system is live, operational, and growing. Every midnight UTC, another day of signal intelligence is permanently anchored to Solana. The proof chain compounds in value daily \u2014 each new transaction adding to an immutable archive that no competitor can replicate retroactively."}
              </p>
              <div className="bg-green-500/5 border border-green-500/20 p-6 text-center space-y-2 mt-4">
                <p className="text-sm font-mono font-bold text-green-400">
                  The math is on Solana.
                </p>
                <p className="text-sm font-mono font-bold text-foreground">
                  {"You don't have to trust us."}
                </p>
              </div>
            </article>

            {/* Appendix A */}
            <article className="space-y-4 border-t border-border pt-8">
              <h3 className="text-lg font-mono font-bold text-foreground">Appendix A: Public Resources</h3>
              <div className="bg-card border border-border overflow-x-auto">
                <table className="w-full text-[11px] font-mono">
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50">
                      <td className="px-3 py-1.5 text-foreground font-medium w-44">SOLRAD Platform</td>
                      <td className="px-3 py-1.5"><a href="https://www.solrad.io" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 transition-colors">www.solrad.io</a></td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="px-3 py-1.5 text-foreground font-medium">Proof Protocol</td>
                      <td className="px-3 py-1.5"><a href="https://www.solrad.io/proof-protocol" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 transition-colors">solrad.io/proof-protocol</a></td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="px-3 py-1.5 text-foreground font-medium">Proof History API</td>
                      <td className="px-3 py-1.5"><a href="https://www.solrad.io/api/proof/history" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 transition-colors">solrad.io/api/proof/history</a></td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="px-3 py-1.5 text-foreground font-medium">Proof Wallet</td>
                      <td className="px-3 py-1.5"><a href="https://solscan.io/account/Ft13xQcBJaLgTzgHWgvzVrvZNiPKZVhpE91qTM6Q9dzh" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 transition-colors break-all">Ft13xQ...Q9dzh</a></td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="px-3 py-1.5 text-foreground font-medium">First Proof TX</td>
                      <td className="px-3 py-1.5"><a href="https://solscan.io/tx/rWLy44btd9JQfWPDjZoMvjsGLZGYoKAnrUkAcxxijxgxb6aLQVuBUcJVMoG1uNyNAnTfmJfpYmXWKpw13nvRqGm" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 transition-colors break-all">rWLy44...RqGm</a></td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1.5 text-foreground font-medium">Scoring</td>
                      <td className="px-3 py-1.5"><a href="https://www.solrad.io/scoring" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 transition-colors">solrad.io/scoring</a></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </article>

            {/* Appendix B */}
            <article className="space-y-4">
              <h3 className="text-lg font-mono font-bold text-foreground">Appendix B: Glossary</h3>
              <div className="bg-card border border-border overflow-x-auto">
                <table className="w-full text-[11px] font-mono">
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-green-400 font-medium w-40">Alpha Ledger</td><td className="px-3 py-1.5">{"SOLRAD's persistent record of all qualifying signal detection events"}</td></tr>
                    <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-green-400 font-medium">entryHash</td><td className="px-3 py-1.5">SHA256 fingerprint of a signal detection event</td></tr>
                    <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-green-400 font-medium">Merkle Root</td><td className="px-3 py-1.5">{"Single hash representing all signals detected in a given day"}</td></tr>
                    <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-green-400 font-medium">Memo Transaction</td><td className="px-3 py-1.5">Solana transaction type that embeds arbitrary text data on-chain</td></tr>
                    <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-green-400 font-medium">Proof Publication</td><td className="px-3 py-1.5">{"Daily Solana transaction containing the day's Merkle root"}</td></tr>
                    <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-green-400 font-medium">Signal</td><td className="px-3 py-1.5">{"A token detection event meeting SOLRAD's scoring threshold"}</td></tr>
                    <tr className="border-b border-border/50"><td className="px-3 py-1.5 text-green-400 font-medium">SOLRAD Score</td><td className="px-3 py-1.5">Composite 0-100 score representing signal strength</td></tr>
                    <tr><td className="px-3 py-1.5 text-green-400 font-medium">SPL Token</td><td className="px-3 py-1.5">Solana Program Library token -- the standard token format on Solana</td></tr>
                  </tbody>
                </table>
              </div>
            </article>

            {/* Copyright */}
            <p className="text-[10px] font-mono text-muted-foreground/50 text-center pt-4">
              {"© 2026 SOLRAD. All rights reserved. This whitepaper is provided for informational purposes only and does not constitute financial advice."}
            </p>

            {/* Second Download CTA */}
            <div className="flex justify-center pt-4">
              <a
                href="/SOLRAD-Proof-Protocol-Whitepaper-v1.pdf"
                download="SOLRAD-Proof-Protocol-Whitepaper-v1.pdf"
                className="inline-block"
              >
                <Button variant="outline" className="font-mono text-xs tracking-widest border-green-500/30 text-green-400 hover:bg-green-500/10">
                  <Download className="h-4 w-4 mr-2" />
                  {"DOWNLOAD PDF"}
                </Button>
              </a>
            </div>
          </section>

          {/* Bottom CTA */}
          <section className="border-t border-border pt-8 space-y-4">
            <p className="text-sm font-mono text-muted-foreground">
              See the proof system running live with real Solana transactions.
            </p>
            <SolButton href="/proof-protocol">{"SEE THE PROOF SYSTEM LIVE \u2192"}</SolButton>
          </section>
        </div>
      </main>
  )
}

function HighlightCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="border border-border bg-card p-5 space-y-2">
      {icon}
      <p className="text-sm font-mono font-bold text-foreground">{title}</p>
      <p className="text-xs font-mono text-muted-foreground">{description}</p>
    </div>
  )
}
