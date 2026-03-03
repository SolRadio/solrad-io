"use client"

import { Zap, TrendingUp, Shield } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useLeadTimeRecentMap } from "@/hooks/use-lead-time-recent"

const PILLARS = [
  {
    icon: Zap,
    iconColor: "text-primary",
    title: "SIGNAL ISSUED",
    description:
      "Token flagged by SOLRAD algorithm with score, block timestamp, and on-chain reference \u2014 before it appears on trending pages.",
  },
  {
    icon: TrendingUp,
    iconColor: "text-cyan-400",
    title: "MARKET MOVES",
    description:
      "Price action unfolds. The blockchain records everything. Our observation timestamp cannot be altered retroactively.",
  },
  {
    icon: Shield,
    iconColor: "text-green-500",
    title: "PROOF PUBLISHED",
    description:
      "Lead-time verified and published to the Alpha Ledger. Auditable by anyone. Our track record, not our claims.",
  },
] as const

function formatLeadTime(seconds?: number): string {
  if (!seconds || seconds <= 0) return "early"
  const mins = Math.round(seconds / 60)
  if (mins < 60) return `${mins}m before pump`
  const hours = (mins / 60).toFixed(1)
  return `${hours}h before pump`
}

function formatTimeAgo(timestamp?: number): string {
  if (!timestamp) return ""
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function ProofEngineSection() {
  const { items, loading } = useLeadTimeRecentMap(true)
  const recentProofs = items.slice(0, 5)

  return (
    <section className="w-full border-t border-border bg-card py-12 px-4 md:py-16">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
          Why traders trust SOLRAD
        </p>
          <h2 className="mb-2 text-2xl font-bold uppercase tracking-tight text-foreground md:text-3xl text-balance">
          Every call. Timestamped. Verified.
        </h2>
        <p className="mb-10 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Unlike channels that claim early detection with no proof, SOLRAD timestamps every signal at the block level. Every entry is immutable. Every claim is verifiable.
        </p>

        {/* 3-column pillars */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="flex flex-col gap-3 rounded-none border border-border bg-background p-6"
            >
              <pillar.icon className={`h-6 w-6 ${pillar.iconColor}`} />
              <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">
                {pillar.title}
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>

        {/* Live feed panel */}
        <div className="mt-8 rounded-none border border-border bg-background p-4">
          {/* Feed header */}
          <div className="mb-3 flex items-center gap-2">
            <span className="breathe-dot inline-block h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs font-bold uppercase tracking-wide text-foreground">
              Recent Verified Detections
            </span>
          </div>

          {/* Feed rows */}
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-lg bg-muted/10 px-3 py-2"
                >
                  <div className="h-3 w-14 animate-pulse rounded bg-muted/30" />
                  <div className="h-3 w-28 animate-pulse rounded bg-muted/20" />
                  <div className="ml-auto h-3 w-12 animate-pulse rounded bg-muted/20" />
                </div>
              ))}
            </div>
          ) : recentProofs.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No verified detections yet. Check back soon.
            </p>
          ) : (
            <div className="space-y-1">
              {recentProofs.map((proof, i) => (
                <div
                  key={proof.mint + i}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs transition-colors hover:bg-muted/10 font-mono"
                >
                  <span className="min-w-[60px] font-bold text-foreground uppercase">
                    {(proof as any).symbol ||
                      proof.mint.slice(0, 6).toUpperCase()}
                  </span>
                  <span className="text-muted-foreground">
                    detected {formatLeadTime(proof.leadSeconds)}
                  </span>
                  <span className="ml-auto text-muted-foreground/60">
                    {formatTimeAgo(proof.proofCreatedAt)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Ledger CTA */}
          <div className="mt-4 flex justify-center">
            <Button variant="ghost" size="sm" asChild>
              <Link
                href="/research"
                className="text-xs font-bold uppercase tracking-wide"
              >
                View Full Proof Ledger
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
