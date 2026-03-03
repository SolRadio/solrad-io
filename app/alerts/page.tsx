import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AlertsClient } from "./AlertsClient"

export const metadata: Metadata = {
  title: "Smart Alerts | SOLRAD",
  description: "Configure intelligent alerts for Solana token movements, liquidity events, and momentum shifts. Real-time notifications powered by SOLRAD analytics.",
  alternates: { canonical: "https://www.solrad.io/alerts" },
  openGraph: {
    title: "Smart Alerts | SOLRAD",
    description: "Configure intelligent alerts for Solana token movements, liquidity events, and momentum shifts.",
    url: "https://www.solrad.io/alerts",
    images: [{ url: "/brand/og-1200x630.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart Alerts | SOLRAD",
    description: "Intelligent Solana token alerts powered by SOLRAD analytics.",
    images: ["/brand/twitter-1200x630.png"],
  },
}

export default function AlertsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <AlertsClient />
      </main>
      <Footer />
    </div>
  )
}
