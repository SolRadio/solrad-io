import type { Metadata } from "next"
import { RadarClient } from "./RadarClient"

export const metadata: Metadata = {
  title: "SOLRAD -- Live Solana Token Radar",
  description:
    "Watch Solana tokens scored 0-100 in real time on a live radar. SOLRAD detects activity before the market reacts, then proves it on-chain.",
  metadataBase: new URL("https://www.solrad.io"),
  alternates: { canonical: "https://www.solrad.io" },
  openGraph: {
    title: "SOLRAD -- Live Solana Token Radar",
    description:
      "Real-time token intelligence radar. Scores every active Solana token and proves early detection on-chain.",
    url: "https://www.solrad.io",
    siteName: "SOLRAD",
    type: "website",
    images: [
      {
        url: "/brand/og-1200x630.png",
        width: 1200,
        height: 630,
        alt: "SOLRAD -- Live Solana Token Radar",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SOLRAD -- Live Solana Token Radar",
    description:
      "Scores tokens before they trend. Proves it. Free. No wallet required.",
    images: ["/brand/twitter-1200x630.png"],
  },
}

export default function Home() {
  return <RadarClient />
}
