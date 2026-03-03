import type { Metadata } from "next"
import LandingClient from "./LandingClient"

export const metadata: Metadata = {
  title: "SOLRAD — Solana Signal Intelligence",
  description:
    "Early token detection. On-chain verified. Every detection hashed and published to Solana mainnet.",
  openGraph: {
    title: "SOLRAD — Solana Signal Intelligence",
    description:
      "We detect tokens early. We prove it on Solana. Every detection hashed and published to mainnet daily.",
  },
}

export default function Home() {
  return <LandingClient />
}
