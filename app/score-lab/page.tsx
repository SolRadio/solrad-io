import type { Metadata } from "next"
import { ScoreLabClient } from "./ScoreLabClient"
import { isProUser } from "@/lib/subscription"

export const metadata: Metadata = {
  title: "Score Lab | SOLRAD",
  description: "Analyze SOLRAD scoring model performance. Win rates by tier, top performers, and historical accuracy across Solana token snapshots.",
  alternates: { canonical: "https://www.solrad.io/score-lab" },
  openGraph: {
    title: "Score Lab | SOLRAD",
    description: "Analyze SOLRAD scoring model performance with win rates, top performers, and historical accuracy.",
    url: "https://www.solrad.io/score-lab",
    images: [{ url: "/brand/og-1200x630.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Score Lab | SOLRAD",
    description: "SOLRAD scoring model performance analysis and accuracy metrics.",
    images: ["/brand/twitter-1200x630.png"],
  },
}

export default async function ScoreLabPage() {
  const isPro = await isProUser()

  return (
    <main>
      <ScoreLabClient isPro={isPro} />
    </main>
  )
}
