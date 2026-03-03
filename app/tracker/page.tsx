import type { Metadata } from "next"
import TrackerClient from "./TrackerClient"

export const metadata: Metadata = {
  title: "Top Performing Solana Tokens — SOLRAD Tracker",
  description:
    "Track the highest-scoring Solana tokens across 1h, 4h, 6h, 24h, and 7d windows. Pre-filtered by SOLRAD's intelligence engine. No wallet required.",
  metadataBase: new URL("https://www.solrad.io"),
  alternates: { canonical: "https://www.solrad.io/tracker" },
  openGraph: {
    title: "Top Performing Solana Tokens — SOLRAD",
    description:
      "Highest-scoring tokens by time window. Powered by SOLRAD's multi-factor intelligence engine.",
    url: "https://www.solrad.io/tracker",
    siteName: "SOLRAD",
    type: "website",
  },
}

export default function TrackerPage() {
  return <TrackerClient />
}
