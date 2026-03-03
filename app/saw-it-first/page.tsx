import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ExternalLink, Clock, Shield, Zap, Hash } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "SOLRAD Saw It First — Verified Early Detection Leaderboard",
  description:
    "Every token SOLRAD scored before it trended on DexScreener. Timestamped. Verified. Publicly auditable.",
  alternates: {
    canonical: "https://www.solrad.io/saw-it-first",
  },
  openGraph: {
    title: "SOLRAD Saw It First — Verified Early Detection Leaderboard",
    description:
      "Every token SOLRAD scored before it trended on DexScreener. Timestamped. Verified. Publicly auditable.",
    url: "https://www.solrad.io/saw-it-first",
    siteName: "SOLRAD",
    type: "website",
    images: [
      {
        url: "https://www.solrad.io/brand/og-1200x630.png",
        width: 1200,
        height: 630,
        alt: "SOLRAD Saw It First - Verified Early Detection Leaderboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SOLRAD Saw It First — Verified Early Detection Leaderboard",
    description:
      "Every token SOLRAD scored before it trended. Timestamped. Verified. Publicly auditable.",
    images: ["https://www.solrad.io/brand/twitter-1200x630.png"],
  },
}

interface LedgerEntry {
  id: string
  mint: string
  symbol: string
  name?: string
  imageUrl?: string
  detectedAt: string
  detectionType: string
  scoreAtSignal?: number
  scoreNow?: number
  priceAtSignal: number
  priceNow: number
  pct24h?: number
  pct7d?: number
  pct30d?: number
  outcome: "win" | "loss" | "neutral"
  entryHash?: string
  voided?: boolean
}

interface LedgerMetrics {
  totalTracked: number
  winRate: number
  avg7d: number
  avg24h: number
}

const EMPTY = {
  entries: [] as LedgerEntry[],
  metrics: null as LedgerMetrics | null,
}

async function fetchLedgerData(): Promise<typeof EMPTY> {
  try {
    const res = await fetch(
      "https://www.solrad.io/api/alpha-ledger?range=30d&limit=500",
      { cache: "no-store" }
    )

    if (!res.ok) {
      console.error(`[saw-it-first] API returned ${res.status}`)
      return EMPTY
    }

    const data = await res.json()
    const entries: LedgerEntry[] = Array.isArray(data?.entries) ? data.entries : []
    const metrics: LedgerMetrics | null = data?.metrics ?? null

    return { entries: entries.filter((e) => !e.voided), metrics }
  } catch (error) {
    console.error("[saw-it-first] Failed to fetch ledger:", error)
    return EMPTY
  }
}

function formatPrice(price: number): string {
  if (!price || price === 0) return "\u2014"
  if (price < 0.00001) return `$${price.toExponential(2)}`
  if (price < 0.01) return `$${price.toFixed(6)}`
  if (price < 1) return `$${price.toFixed(4)}`
  return `$${price.toFixed(2)}`
}

function truncateMint(mint: string): string {
  if (!mint || mint.length < 12) return mint
  return `${mint.slice(0, 4)}...${mint.slice(-4)}`
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  } catch {
    return "\u2014"
  }
}

function TokenImage({ entry }: { entry: LedgerEntry }) {
  return (
    <div className="w-6 h-6 rounded-full overflow-hidden bg-muted flex-shrink-0">
      {entry.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={entry.imageUrl}
          alt={entry.symbol}
          className="w-full h-full object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-primary">
          {entry.symbol?.[0]}
        </div>
      )}
    </div>
  )
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  const cls =
    outcome === "win"
      ? "bg-green-500/20 text-green-400 border border-green-500/30"
      : outcome === "loss"
        ? "bg-destructive/20 text-destructive border border-destructive/30"
        : "bg-muted text-muted-foreground border border-border"
  return (
    <span className={`inline-block text-[10px] font-mono font-bold uppercase tracking-wider rounded px-2 py-0.5 ${cls}`}>
      {outcome}
    </span>
  )
}

export default async function SawItFirstPage() {
  const { entries, metrics } = await fetchLedgerData()

  // Sort: wins first, then by detection date descending
  const sorted = [...entries].sort((a, b) => {
    if (a.outcome === "win" && b.outcome !== "win") return -1
    if (a.outcome !== "win" && b.outcome === "win") return 1
    return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
  })

  const wins = entries.filter((e) => e.outcome === "win")
  const totalDetections = metrics?.totalTracked ?? entries.length
  const winRate = metrics?.winRate ?? (entries.length > 0 ? (wins.length / entries.length) * 100 : 0)
  const avgGain = Number.isFinite(metrics?.avg7d) && metrics!.avg7d !== 0 ? metrics!.avg7d : null

  // CHANGE 5: Compute longest lead (max time between detection and now for wins)
  // This is a placeholder — if proof data had leadSeconds we'd use that
  const longestLead = entries.reduce((max, e) => {
    if (e.outcome !== "win") return max
    const diffMs = Date.now() - new Date(e.detectedAt).getTime()
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
    return diffDays > max ? diffDays : max
  }, 0)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
            <div className="text-center">
              <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-primary/80 mb-4 px-3 py-1 border border-primary/20 rounded-full">
                PROOF OF EDGE
              </span>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-4 text-balance">
                SOLRAD SAW IT FIRST
              </h1>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto text-pretty">
                A public, auditable record of every token our intelligence engine detected
                before it appeared on DexScreener&apos;s trending page. Not claims. Proof.
              </p>
            </div>

            {/* CHANGE 5: Aggregate Stats — 4 columns, with guards for zero values */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-10 max-w-2xl mx-auto">
              <div className="text-center p-3 md:p-4 rounded-lg border border-border bg-card">
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                  Verified Detections
                </p>
                <p className="text-2xl md:text-3xl font-black font-mono text-foreground">
                  {totalDetections || "\u2014"}
                </p>
              </div>
              <div className="text-center p-3 md:p-4 rounded-lg border border-border bg-card">
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                  Win Rate
                </p>
                <p className="text-2xl md:text-3xl font-black font-mono text-green-500">
                  {winRate > 0 ? `${winRate.toFixed(1)}%` : "\u2014"}
                </p>
              </div>
              <div className="text-center p-3 md:p-4 rounded-lg border border-border bg-card">
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                  Avg 7d Move
                </p>
                <p className={`text-2xl md:text-3xl font-black font-mono ${avgGain !== null && avgGain >= 0 ? "text-green-500" : avgGain !== null ? "text-red-500" : "text-muted-foreground"}`}>
                  {avgGain !== null ? `${avgGain >= 0 ? "+" : ""}${avgGain.toFixed(1)}%` : "\u2014"}
                </p>
              </div>
              <div className="text-center p-3 md:p-4 rounded-lg border border-border bg-card">
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                  Longest Lead
                </p>
                <p className="text-2xl md:text-3xl font-black font-mono text-foreground">
                  {longestLead > 0 ? `${longestLead}d` : "\u2014"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Table */}
        <section className="border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-10 md:py-12">
            {/* CHANGE 1: Count label above table */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
                VERIFIED DETECTIONS (LAST 30 DAYS)
              </h2>
              {sorted.length > 0 && (
                <span className="text-xs font-mono text-muted-foreground/60">
                  {sorted.length} entries · scroll to explore
                </span>
              )}
            </div>

            {sorted.length === 0 ? (
              <div className="text-center py-20 border border-border rounded-lg bg-card">
                <p className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
                  No verified detections yet — check back soon
                </p>
              </div>
            ) : (
              /* CHANGE 1: Scrollable container with fade */
              <div className="relative">
                <div className="overflow-y-auto max-h-[600px] rounded-xl border border-border scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                  <table className="w-full text-xs font-mono">
                    <thead className="sticky top-0 z-10 bg-card">
                      <tr className="border-b border-border text-left">
                        <th className="py-2.5 pl-3 pr-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                          Token
                        </th>
                        <th className="py-2.5 pr-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold text-right">
                          Score
                        </th>
                        <th className="py-2.5 pr-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold text-right hidden sm:table-cell">
                          Price at Detection
                        </th>
                        <th className="py-2.5 pr-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold text-right hidden sm:table-cell">
                          Price Now
                        </th>
                        {/* CHANGE 2: 7D CHANGE column removed */}
                        <th className="py-2.5 pr-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold text-center">
                          Outcome
                        </th>
                        <th className="py-2.5 pr-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold text-right hidden md:table-cell">
                          Detected
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((entry, i) => (
                        <tr
                          key={entry.id}
                          className={`border-b border-border/30 hover:bg-muted/30 transition-colors ${
                            i % 2 === 0 ? "bg-transparent" : "bg-muted/10"
                          }`}
                        >
                          {/* CHANGE 3: Token image + name */}
                          <td className="py-2.5 pl-3 pr-3">
                            <Link
                              href={`/token/${entry.mint}`}
                              className="hover:text-primary transition-colors flex items-center gap-2"
                            >
                              <TokenImage entry={entry} />
                              <span className="font-semibold text-foreground">
                                {entry.symbol}
                              </span>
                              <span className="text-muted-foreground/60 text-[10px]">
                                {truncateMint(entry.mint)}
                              </span>
                            </Link>
                          </td>
                          <td className="py-2.5 pr-3 text-right">
                            <span className="text-primary font-bold">
                              {entry.scoreAtSignal ?? "\u2014"}
                            </span>
                          </td>
                          <td className="py-2.5 pr-3 text-right text-muted-foreground hidden sm:table-cell">
                            {formatPrice(entry.priceAtSignal)}
                          </td>
                          <td className="py-2.5 pr-3 text-right text-muted-foreground hidden sm:table-cell">
                            {formatPrice(entry.priceNow)}
                          </td>
                          {/* CHANGE 2: 7D CHANGE column removed */}
                          {/* CHANGE 4: Standardized outcome badges */}
                          <td className="py-2.5 pr-3 text-center">
                            <OutcomeBadge outcome={entry.outcome} />
                          </td>
                          <td className="py-2.5 pr-3 text-right text-muted-foreground/70 hidden md:table-cell">
                            {formatTimestamp(entry.detectedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Fade gradient at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none rounded-b-xl" />
              </div>
            )}
          </div>
        </section>

        {/* How Verification Works */}
        <section>
          <div className="max-w-4xl mx-auto px-4 py-10 md:py-14">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-muted-foreground mb-6">
              HOW DOES VERIFICATION WORK?
            </h2>

            <div className="grid gap-5 md:grid-cols-3">
              <div className="p-5 rounded-lg border border-border bg-card text-center">
                <div className="flex flex-col items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold uppercase">Detection</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  SOLRAD continuously scans the Solana blockchain for emerging token signals.
                  When a token crosses our scoring threshold, it&apos;s timestamped and logged to the
                  Alpha Ledger with its score, price, and detection context. This creates an
                  immutable record of exactly when we first identified the token.
                </p>
              </div>

              <div className="p-5 rounded-lg border border-border bg-card text-center">
                <div className="flex flex-col items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold uppercase">Tracking</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  After detection, each entry is tracked over 24h, 7d, and 30d windows. Price
                  changes are computed against the detection price, and outcomes are assigned
                  algorithmically: a 7-day gain of +20% or more is classified as a WIN, a drop
                  of -20% or more as a LOSS, and everything else is NEUTRAL.
                </p>
              </div>

              <div className="p-5 rounded-lg border border-border bg-card text-center">
                <div className="flex flex-col items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                    <Hash className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold uppercase">Proof</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every ledger entry receives a SHA-256 hash computed from its canonical fields.
                  A rolling ledger hash chains all entries together, creating a tamper-evident
                  audit trail. You can verify the full ledger integrity on the{" "}
                  <Link href="/research" className="text-primary hover:underline">
                    Proof Engine
                  </Link>{" "}
                  page, where hash history and entry-level proofs are publicly accessible.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
