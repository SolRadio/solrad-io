import type { Metadata } from "next"
import HomeClient from "../HomeClient"

export const metadata: Metadata = {
  title: "SOLRAD — Solana Token Intelligence Terminal",
  description:
    "SOLRAD scores every active Solana token 0-100 using published methodology, then proves it detected activity before the market reacted. Free. No wallet required.",
  metadataBase: new URL("https://www.solrad.io"),
  alternates: { canonical: "https://www.solrad.io/dashboard" },
  openGraph: {
    title: "SOLRAD — Solana Token Intelligence",
    description:
      "Real-time scoring, risk analysis, and verifiable lead-time intelligence for Solana tokens. No wallet. No black box.",
    url: "https://www.solrad.io/dashboard",
    siteName: "SOLRAD",
    type: "website",
    images: [
      {
        url: "/brand/og-1200x630.png",
        width: 1200,
        height: 630,
        alt: "SOLRAD — Solana Token Intelligence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SOLRAD — Solana Token Intelligence",
    description:
      "Scores tokens before they trend. Proves it. Free. No wallet required.",
    images: ["/brand/twitter-1200x630.png"],
  },
}

export default function DashboardPage() {
  return <HomeClient />
}
