import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Proof Protocol | SOLRAD",
  description:
    "Verified on-chain signal detection proof. Every SOLRAD signal is SHA256 hashed and anchored to Solana. Verifiable by anyone.",
  alternates: {
    canonical: "https://www.solrad.io/proof-protocol",
  },
  openGraph: {
    title: "Proof Protocol | SOLRAD",
    description: "Verified on-chain signal detection proof from SOLRAD.",
    images: [{ url: "/brand/og-1200x630.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Proof Protocol | SOLRAD",
    description: "Verified on-chain signal detection proof from SOLRAD.",
    images: ["/brand/twitter-1200x630.png"],
  },
}

export default function ProofProtocolLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
