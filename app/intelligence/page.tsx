import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { IntelligenceClient } from "./IntelligenceClient"

export const metadata: Metadata = {
  title: "Alpha Intelligence | SOLRAD",
  description: "Advanced Solana token intelligence with rug-pull detection, liquidity analysis, and smart money tracking. Research-grade analytics by SOLRAD.",
  alternates: { canonical: "https://www.solrad.io/intelligence" },
  openGraph: {
    title: "Alpha Intelligence | SOLRAD",
    description: "Advanced Solana token intelligence with rug-pull detection, liquidity analysis, and smart money tracking.",
    url: "https://www.solrad.io/intelligence",
    images: [{ url: "/brand/og-1200x630.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Alpha Intelligence | SOLRAD",
    description: "Research-grade Solana token intelligence by SOLRAD.",
    images: ["/brand/twitter-1200x630.png"],
  },
}

export default function IntelligencePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <IntelligenceClient />
      </main>
      <Footer />
    </div>
  )
}
