import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { WatchlistClient } from "./WatchlistClient"

export const metadata: Metadata = {
  title: "Watchlist | SOLRAD",
  description: "Your personal Solana token watchlist. Track scored tokens, monitor price movements, and manage your research portfolio with SOLRAD.",
  alternates: { canonical: "https://www.solrad.io/watchlist" },
  openGraph: {
    title: "Watchlist | SOLRAD",
    description: "Your personal Solana token watchlist. Track scored tokens and monitor price movements.",
    url: "https://www.solrad.io/watchlist",
    images: [{ url: "/brand/og-1200x630.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Watchlist | SOLRAD",
    description: "Personal Solana token watchlist powered by SOLRAD analytics.",
    images: ["/brand/twitter-1200x630.png"],
  },
}

export default function WatchlistPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <WatchlistClient />
      </main>
      <Footer />
    </div>
  )
}
