import type { Metadata } from "next"
import { WalletsClient } from "./WalletsClient"

export const metadata: Metadata = {
  title: "Wallet Tracking | SOLRAD",
  description: "Track Solana wallet activity, monitor smart money flows, and identify high-conviction positions with SOLRAD wallet intelligence.",
  alternates: { canonical: "https://www.solrad.io/wallets" },
  openGraph: {
    title: "Wallet Tracking | SOLRAD",
    description: "Track Solana wallet activity, monitor smart money flows, and identify high-conviction positions.",
    url: "https://www.solrad.io/wallets",
    images: [{ url: "/brand/og-1200x630.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wallet Tracking | SOLRAD",
    description: "Track Solana wallet activity and smart money flows with SOLRAD.",
    images: ["/brand/twitter-1200x630.png"],
  },
}

export default function WalletsPage() {
  return (
    <main>
      <WalletsClient />
    </main>
  )
}
