"use client"

import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import type { LeadTimeProof } from "@/lib/lead-time/types"
import { Activity, Shield, Zap, Radio } from "lucide-react"

interface HeroOverlayProps {
  stats: {
    totalVolume: number
    avgScore: number
    totalLiquidity: number
    tokensTracked: number
  }
  leadTimeProofsMap: Map<string, LeadTimeProof>
  onDismiss: () => void
}

export function HeroOverlay({ stats, leadTimeProofsMap, onDismiss }: HeroOverlayProps) {
  const [opacity, setOpacity] = useState(0)

  // Fade in on mount
  useEffect(() => {
    const raf = requestAnimationFrame(() => setOpacity(1))
    return () => cancelAnimationFrame(raf)
  }, [])

  const dismiss = useCallback(() => {
    setOpacity(0)
    setTimeout(onDismiss, 500)
  }, [onDismiss])

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const timer = setTimeout(dismiss, 5000)
    return () => clearTimeout(timer)
  }, [dismiss])

  // Dismiss on any scroll
  useEffect(() => {
    const onScroll = () => dismiss()
    window.addEventListener("scroll", onScroll, { once: true, passive: true })
    // Also listen for wheel events on elements that don't propagate scroll
    window.addEventListener("wheel", onScroll, { once: true, passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("wheel", onScroll)
    }
  }, [dismiss])

  // Dismiss on any keypress
  useEffect(() => {
    const onKey = () => dismiss()
    window.addEventListener("keydown", onKey, { once: true })
    return () => window.removeEventListener("keydown", onKey)
  }, [dismiss])

  // Get 3 most recent lead-time proofs for the live feed
  const recentProofs = Array.from(leadTimeProofsMap.values())
    .sort((a, b) => b.proofCreatedAt - a.proofCreatedAt)
    .slice(0, 3)

  // Compute average lead time in hours from available proofs
  const avgLeadHours = recentProofs.length > 0
    ? (recentProofs.reduce((sum, p) => sum + p.leadSeconds, 0) / recentProofs.length / 3600).toFixed(1)
    : null

  return (
    <div
      className="absolute inset-0 z-50"
      style={{
        opacity,
        transition: "opacity 500ms ease-out",
      }}
    >
      {/* Full-screen gradient backdrop that fades to transparent at bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/98 via-60% to-transparent pointer-events-none" />

      {/* Clickable dismiss layer */}
      <button
        onClick={dismiss}
        className="absolute inset-0 w-full h-full cursor-pointer"
        aria-label="Dismiss hero overlay"
      />

      {/* Content */}
      <div className="relative pointer-events-none max-w-6xl mx-auto px-4 pt-16 md:pt-20 pb-8">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-8">

          {/* LEFT SIDE: Copy + CTAs */}
          <div className="flex-1 max-w-2xl pointer-events-auto">
            {/* Label */}
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-primary mb-4">
              Intelligence Terminal
            </span>

            {/* Headline */}
                <h2 className="text-2xl md:text-4xl font-bold uppercase tracking-tight text-foreground leading-[1.1] mb-4 text-balance">
              The only Solana tool that scores tokens before they trend.
            </h2>

            {/* Subtext */}
            <p className="text-sm text-muted-foreground max-w-lg leading-relaxed mb-6">
              {"SOLRAD\u2019s engine analyzes every active Solana token across 10 dimensions \u2014 liquidity, volume, age, risk, and more \u2014 into a single 0\u2013100 score. Every call timestamped. Every detection proven."}
            </p>

            {/* CTAs */}
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={dismiss}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                {"See What\u2019s Scoring High"}
                <span aria-hidden="true">{"\u2192"}</span>
              </button>
              <Link
                href="/research"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
              >
                How We Prove It
              </Link>
            </div>

            {/* Trust line */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="text-success">{"\u2713"}</span> No wallet required
              </span>
              <span className="flex items-center gap-1">
                <span className="text-success">{"\u2713"}</span> No black box
              </span>
              <span className="flex items-center gap-1">
                <span className="text-success">{"\u2713"}</span> Published methodology
              </span>
            </div>
          </div>

          {/* RIGHT SIDE: Live stats card (desktop xl+ only) */}
          <div className="hidden xl:flex flex-col gap-3 w-[320px] shrink-0 pointer-events-auto">
            {/* Stats card */}
            <div className="rounded-none border border-border bg-card p-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Signals Issued */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                    <Zap className="h-3 w-3 text-primary" />
                    Signals Issued
                  </span>
                  <span className="text-xl font-bold font-mono text-foreground tabular-nums">
                    {leadTimeProofsMap.size > 0 ? leadTimeProofsMap.size.toLocaleString() : "\u2014"}
                  </span>
                </div>

                {/* Tokens Tracked */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                    <Activity className="h-3 w-3 text-accent" />
                    Tokens Tracked
                  </span>
                  <span className="text-xl font-bold font-mono text-foreground tabular-nums">
                    {stats.tokensTracked > 0 ? stats.tokensTracked.toLocaleString() : "\u2014"}
                  </span>
                </div>

                {/* Avg Lead Time */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                    <Shield className="h-3 w-3 text-success" />
                    Avg Lead Time
                  </span>
                  <span className="text-xl font-bold font-mono text-foreground tabular-nums">
                    {avgLeadHours ? `${avgLeadHours}h` : "\u2014"}
                  </span>
                </div>

                {/* Proof Engine */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                    <Radio className="h-3 w-3 text-primary" />
                    Proof Engine
                  </span>
                  <span className="text-xl font-bold font-mono text-success tabular-nums flex items-center gap-2">
                    Active
                    <span className="breathe-dot inline-block h-2 w-2 rounded-full bg-green-500" />
                  </span>
                </div>
              </div>
            </div>

            {/* Recent proof feed */}
            {recentProofs.length > 0 && (
              <div className="rounded-none border border-border bg-card p-3 space-y-1.5">
                {recentProofs.map((proof, i) => {
                  const hoursAgo = ((Date.now() - proof.proofCreatedAt) / 3600000).toFixed(1)
                  return (
                    <div key={`${proof.mint}-${i}`} className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                      <span className="text-accent">$</span>
                      <span className="text-foreground font-semibold truncate max-w-[80px]">
                        {proof.symbol}
                      </span>
                      <span className="text-muted-foreground">
                        {"flagged "}
                        <span className="text-success font-semibold">{hoursAgo}h</span>
                        {" before pump"}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
