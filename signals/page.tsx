import type { Metadata } from "next"
import SignalsClient from "./SignalsClient"

export const metadata: Metadata = {
  title: "SOLRAD | Signal Feed",
  description:
    "Live SOLRAD signal feed — on-chain verified Solana token detections with scores, proof hashes, and real-time alerts.",
  alternates: {
    canonical: "https://solrad.io/signals",
  },
}

export default function SignalsPage() {
  return <SignalsClient />
}
