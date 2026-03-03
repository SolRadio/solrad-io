import React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "My Watchlist — SOLRAD",
  description: "Track your favorite Solana tokens with real-time price updates, SOLRAD scores, and market signals.",
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
  },
}

export default function WatchlistLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
