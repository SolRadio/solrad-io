import type { Metadata } from "next"
import RadarClient from "./RadarClient"

export const metadata: Metadata = {
  title: "SOLRAD — Live Radar",
  description:
    "Live Solana token radar. Real-time signal detection scored 0-100 with on-chain proof.",
  alternates: {
    canonical: "https://www.solrad.io/radar",
  },
}

export default function RadarPage() {
  return <RadarClient />
}
