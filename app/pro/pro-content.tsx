"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Shield, Zap, Trophy, Check, Mail, ArrowDown, CreditCard, Settings, Loader2, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"

/* ─────────────────────────── Comparison Table Data ─────────────────────────── */

const comparisonRows = [
  { feature: "Full token index + scoring",  free: "\u2713",                  pro: "\u2713" },
  { feature: "Proof Engine / Alpha Ledger", free: "\u2713 view only",        pro: "\u2713 + CSV export" },
  { feature: "Signal Outcomes",             free: "3 rows",                  pro: "Unlimited" },
  { feature: "Lead-Time Proof Alerts",      free: "5 alerts",               pro: "Unlimited" },
  { feature: "Token Watchlist",             free: "5 tokens",               pro: "Unlimited (cloud-synced)" },
  { feature: "Tracker Time Windows",        free: "24h only",               pro: "1h / 4h / 6h / 7d / all" },
  { feature: "Full Scoring Breakdown",      free: "Summary",                pro: "\u2713 Complete breakdown" },
  { feature: "Ad-free experience",          free: "Ads shown",              pro: "\u2713 No ads" },
  { feature: "Priority data refresh",       free: "Standard",               pro: "\u2713 Priority queue" },
]

/* ─────────────────────────── Trust Bullets ──────────────────────────────────── */

const trustBullets = [
  {
    icon: Shield,
    text: "Every signal timestamped at the block level \u2014 no retroactive editing possible",
  },
  {
    icon: Zap,
    text: "Published scoring methodology \u2014 you know exactly why a token scored what it scored",
  },
  {
    icon: Trophy,
    text: "Read-only, no wallet required \u2014 we never touch your funds or ask for access",
  },
]

/* ═══════════════════════════ MAIN COMPONENT ═════════════════════════════════ */

export function ProContent({ isPro }: { isPro: boolean }) {
  const { isSignedIn } = useUser()
  const searchParams = useSearchParams()
  const isSuccess = searchParams.get("success") === "true"
  const isCanceled = searchParams.get("canceled") === "true"
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState("")
  const [waitlistEmail, setWaitlistEmail] = useState("")
  const [waitlistLoading, setWaitlistLoading] = useState(false)
  const [waitlistSuccess, setWaitlistSuccess] = useState(false)
  const [waitlistError, setWaitlistError] = useState("")

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setWaitlistLoading(true)
    setWaitlistError("")
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: waitlistEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to join waitlist")
      setWaitlistSuccess(true)
      setWaitlistEmail("")
    } catch (err: unknown) {
      setWaitlistError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setWaitlistLoading(false)
    }
  }

  const handleCheckout = async () => {
    setCheckoutLoading(true)
    setError("")
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Checkout failed")
      if (data.url) window.location.href = data.url
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handlePortal = async () => {
    setPortalLoading(true)
    setError("")
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Portal failed")
      if (data.url) window.location.href = data.url
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setPortalLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">

        {/* ───────── SUCCESS / CANCELED BANNERS ───────── */}
        {isSuccess && (
          <div className="bg-green-500/10 border-b border-green-500/30 px-4 py-3">
            <div className="max-w-3xl mx-auto flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              <p className="text-sm font-medium text-green-400">
                Welcome to SOLRAD Pro! Your account is now upgraded.
              </p>
            </div>
          </div>
        )}
        {isCanceled && (
          <div className="bg-muted/30 border-b border-border px-4 py-3">
            <div className="max-w-3xl mx-auto flex items-center gap-3">
              <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
              <p className="text-sm text-muted-foreground">
                No worries — your free account is still active.
              </p>
            </div>
          </div>
        )}

        {/* ───────── SECTION 1: HERO ───────── */}
        <section className="py-16 md:py-24 text-center px-4">
          <Badge variant="secondary" className="mb-4 text-xs font-bold tracking-widest uppercase">
            SOLRAD PRO
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4 text-balance">
            Get early. Stay ahead.
          </h1>

          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-8 text-pretty">
            Real-time signals, unlimited proof access, and zero ads &mdash; for traders who take their edge seriously.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            {isPro ? (
              <Button size="lg" className="gap-2 text-sm font-bold uppercase tracking-wide" onClick={handlePortal} disabled={portalLoading}>
                {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
                MANAGE SUBSCRIPTION
              </Button>
            ) : isSignedIn ? (
              <Button size="lg" className="gap-2 text-sm font-bold uppercase tracking-wide" onClick={handleCheckout} disabled={checkoutLoading}>
                {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                UPGRADE TO PRO — $24/MO
              </Button>
            ) : (
              <Button size="lg" className="gap-2 text-sm font-bold uppercase tracking-wide" asChild>
                <Link href="/sign-in?redirect_url=/pro">
                  <CreditCard className="h-4 w-4" />
                  SIGN IN TO UPGRADE
                </Link>
              </Button>
            )}
            <Button size="lg" variant="ghost" className="gap-1 text-sm text-muted-foreground" asChild>
              <a href="#comparison">
                SEE WHAT&apos;S INCLUDED
                <ArrowDown className="h-4 w-4" />
              </a>
            </Button>
          </div>

          {error && <p className="text-xs text-destructive mb-2">{error}</p>}

          <p className="text-xs text-muted-foreground">
            {isPro ? "You have an active Pro subscription." : "$24/month. Cancel anytime."}
          </p>
        </section>


        {/* ───────── SECTION 2: COMPARISON TABLE ───────── */}
        <section id="comparison" className="py-16 px-4 scroll-mt-8">
          <div className="max-w-4xl mx-auto">

            {/* Desktop table */}
            <div className="hidden md:block">
              <div className="pt-3">
              <div className="grid grid-cols-[1fr_160px_200px] gap-0 rounded-xl border border-border overflow-clip">
                {/* Header row */}
                <div className="bg-muted/30 px-5 py-4 border-b border-border">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Feature</span>
                </div>
                <div className="bg-muted/30 px-5 py-4 border-b border-border border-l text-center">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Free</span>
                </div>
                <div className="bg-primary/5 px-5 py-4 border-b border-primary/30 border-l border-t-2 border-t-primary relative overflow-visible text-center">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-primary text-primary-foreground text-[9px] font-bold tracking-wider whitespace-nowrap">MOST POPULAR</Badge>
                  </div>
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider text-right">Pro &mdash; $24/mo</span>
                </div>

                {/* Data rows */}
                {comparisonRows.map((row, i) => (
                  <div key={row.feature} className="contents">
                    <div className={`px-5 py-3.5 text-sm ${i < comparisonRows.length - 1 ? "border-b border-border" : ""}`}>
                      {row.feature}
                    </div>
                    <div className={`px-5 py-3.5 text-sm text-center text-muted-foreground border-l ${i < comparisonRows.length - 1 ? "border-b border-border" : ""}`}>
                      {row.free}
                    </div>
                    <div className={`px-5 py-3.5 text-sm text-center font-medium bg-primary/5 border-l border-primary/30 ${i < comparisonRows.length - 1 ? "border-b border-primary/20" : ""}`}>
                      {row.pro}
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </div>

            {/* Mobile card layout */}
            <div className="md:hidden space-y-4">
              {/* FREE card */}
              <div className="rounded-xl border border-border p-5 bg-card">
                <h3 className="text-lg font-bold mb-1">Free</h3>
                <p className="text-xs text-muted-foreground mb-4">Essential Solana intelligence</p>
                <ul className="space-y-2.5">
                  {comparisonRows.map((row) => (
                    <li key={row.feature} className="flex items-start justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">{row.feature}</span>
                      <span className="text-right shrink-0 font-medium">{row.free}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* PRO card */}
              <div className="rounded-xl border-2 border-primary p-5 bg-card relative">
                <div className="absolute -top-3 left-4">
                  <Badge className="bg-primary text-primary-foreground text-[9px] font-bold tracking-wider">MOST POPULAR</Badge>
                </div>
                <h3 className="text-lg font-bold mb-1">Pro <span className="text-muted-foreground font-normal text-sm">&mdash; $24/mo</span></h3>
                <p className="text-xs text-muted-foreground mb-4">Advanced intelligence for serious traders</p>
                <ul className="space-y-2.5">
                  {comparisonRows.map((row) => (
                    <li key={row.feature} className="flex items-start justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">{row.feature}</span>
                      <span className="text-right shrink-0 font-medium text-foreground">{row.pro}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        {/* ───────── SECTION 3: TRUST ───────── */}
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-8">Why traders trust SOLRAD</h2>

            <div className="grid sm:grid-cols-3 gap-6 text-left">
              {trustBullets.map((bullet) => {
                const Icon = bullet.icon
                return (
                  <div key={bullet.text} className="flex gap-3">
                    <div className="shrink-0 mt-0.5">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-4.5 w-4.5 text-primary" />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{bullet.text}</p>
                  </div>
                )
              })}
            </div>

            <p className="mt-8 text-sm text-muted-foreground">
              Learn exactly how we score tokens on the{" "}
              <Link href="/scoring" className="text-primary hover:underline font-medium">
                scoring methodology
              </Link>{" "}
              page.
            </p>
          </div>
        </section>


        {/* ───────── SECTION 4: CHECKOUT CTA ───────── */}
        <section id="checkout" className="py-16 px-4 scroll-mt-8">
          <div className="max-w-md mx-auto text-center">
            {isPro ? (
              <>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                  <Check className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">You have Pro</h2>
                <p className="text-muted-foreground text-sm mb-6">
                  Full access unlocked. Manage billing in the Stripe portal.
                </p>
                <Button onClick={handlePortal} disabled={portalLoading} className="gap-2 font-bold uppercase tracking-wide text-xs">
                  {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
                  MANAGE SUBSCRIPTION
                </Button>
              </>
            ) : (
              <>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Ready to upgrade?</h2>
                <p className="text-muted-foreground text-sm mb-6">
                  $24/month. Cancel anytime. Full access in seconds.
                </p>
                {isSignedIn ? (
                  <Button onClick={handleCheckout} disabled={checkoutLoading} size="lg" className="gap-2 font-bold uppercase tracking-wide text-sm">
                    {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                    UPGRADE TO PRO
                  </Button>
                ) : (
                  <Button size="lg" className="gap-2 font-bold uppercase tracking-wide text-sm" asChild>
                    <Link href="/sign-in?redirect_url=/pro">
                      <CreditCard className="h-4 w-4" />
                      SIGN IN TO UPGRADE
                    </Link>
                  </Button>
                )}
                {error && <p className="text-xs text-destructive mt-3">{error}</p>}
                <p className="text-xs text-muted-foreground mt-3">
                  Powered by Stripe. Secure checkout. Cancel anytime.
                </p>
              </>
            )}
          </div>
        </section>

        {/* ───────── SECTION 5: DEMOTED WAITLIST ───────── */}
        {!isPro && (
          <section className="pb-16 px-4">
            <div className="max-w-sm mx-auto text-center">
              <p className="text-xs text-muted-foreground/60 uppercase tracking-widest font-mono mb-3">
                Prefer email updates?
              </p>
              {waitlistSuccess ? (
                <p className="text-xs text-muted-foreground">
                  <Check className="inline h-3 w-3 text-green-500 mr-1" />
                  {"You\u2019re on the list. We\u2019ll notify you of new Pro features."}
                </p>
              ) : (
                <form onSubmit={handleWaitlistSubmit} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    required
                    disabled={waitlistLoading}
                    className="flex-1 h-8 text-xs"
                    aria-label="Email address for waitlist"
                  />
                  <Button type="submit" disabled={waitlistLoading} variant="ghost" size="sm" className="text-xs text-muted-foreground shrink-0">
                    <Mail className="h-3 w-3 mr-1" />
                    {waitlistLoading ? "..." : "NOTIFY ME"}
                  </Button>
                </form>
              )}
              {waitlistError && <p className="text-xs text-destructive mt-1">{waitlistError}</p>}
            </div>
          </section>
        )}

      </main>

      <Footer />
    </div>
  )
}
