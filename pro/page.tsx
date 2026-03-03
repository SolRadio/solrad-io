"use client"

import { useState } from "react"
import Link from "next/link"

const features = [
  "Live radar — all tokens, real-time",
  "Full signal feed with proof verification",
  "Real-time Telegram alerts",
  "On-chain proof for every detection",
  "Cancel anytime",
]

export default function ProPage() {
  const [loading, setLoading] = useState(false)

  async function handleCheckout() {
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      /* no-op */
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 py-20">
      {/* Heading */}
      <h1 className="text-2xl md:text-3xl font-bold tracking-widest uppercase text-foreground text-center">
        SOLRAD ACCESS
      </h1>
      <p className="mt-3 text-sm text-muted-foreground tracking-wide text-center">
        On-chain verified signal intelligence.
      </p>

      {/* Plan Card */}
      <div className="mt-12 w-full max-w-md border border-border rounded-lg bg-card p-8">
        {/* Price */}
        <div className="text-center">
          <span className="text-3xl md:text-4xl font-bold text-foreground">
            $9.99
          </span>
          <span className="text-muted-foreground text-sm ml-2">/ month</span>
        </div>

        {/* Divider */}
        <div className="my-6 h-px bg-border" />

        {/* Features */}
        <ul className="space-y-4">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-3 text-sm text-foreground">
              <span className="text-green mt-0.5 shrink-0">&#10003;</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="mt-8 w-full h-11 rounded-md border border-green text-green font-bold text-sm uppercase tracking-widest
                     hover:bg-green hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "CONNECTING..." : "START NOW"}
        </button>
      </div>

      {/* Sign-in link */}
      <p className="mt-6 text-xs text-muted-foreground">
        Already subscribed?{" "}
        <Link href="/sign-in" className="text-green hover:underline">
          Sign in &rarr;
        </Link>
      </p>

      {/* Stripe note */}
      <p className="mt-10 text-[11px] text-zinc-600 tracking-wide">
        Payments secured by Stripe
      </p>
    </main>
  )
}
