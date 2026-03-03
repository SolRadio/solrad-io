import type { Metadata } from "next"
import { SignalsClient } from "./SignalsClient"

export const metadata: Metadata = {
  title: "Signal Outcomes | SOLRAD",
  description:
    "Recent signal outcomes and win/loss performance across SOLRAD tracked tokens.",
  alternates: { canonical: "https://www.solrad.io/signals" },
  openGraph: {
    title: "Signal Outcomes | SOLRAD",
    description:
      "Recent signal outcomes and win/loss performance across SOLRAD tracked tokens.",
    url: "https://www.solrad.io/signals",
    siteName: "SOLRAD",
    type: "website",
    images: [{ url: "/brand/og-1200x630.png", width: 1200, height: 630, alt: "SOLRAD Signal Outcomes" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Signal Outcomes | SOLRAD",
    description: "Recent signal outcomes and win/loss performance across SOLRAD tracked tokens.",
    images: ["/brand/twitter-1200x630.png"],
  },
}

export default function SignalsPage() {
  return (
    <main>
      <SignalsClient />
    </main>
  )
}
