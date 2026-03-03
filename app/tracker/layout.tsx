import React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Token Radar Dashboard | SOLRAD",
  description:
    "Real-time Solana token radar tracking trending coins with volume spikes, liquidity changes, and momentum shifts. Monitor market signals across 1h, 4h, 6h, 24h, and 7d windows.",
  alternates: { canonical: "https://www.solrad.io/tracker" },
  openGraph: {
    title: "Token Radar Dashboard — SOLRAD",
    description:
      "Track trending Solana tokens in real-time. See volume surges, liquidity flows, and market momentum with SOLRAD's token radar.",
  },
  twitter: {
    title: "Token Radar Dashboard — SOLRAD",
    description:
      "Track trending Solana tokens in real-time with volume, liquidity, and momentum tracking.",
  },
}

export default function TrackerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
