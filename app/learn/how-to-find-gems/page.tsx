import type { Metadata } from "next"
import { HowToFindGemsContent } from "./content"

export const metadata: Metadata = {
  title: "How To Find Solana Gems | SOLRAD",
  description:
    "Professional guide for finding early Solana gems using SOLRAD's intelligence and signal stacking framework. Step-by-step playbook for on-chain traders.",
  keywords:
    "solana gems, crypto trading guide, signal stacking, on-chain analysis, SOLRAD tutorial, find crypto gems",
  alternates: {
    canonical: "https://www.solrad.io/learn/how-to-find-gems",
  },
  openGraph: {
    title: "How To Find Solana Gems Using SOLRAD",
    description:
      "A professional, step-by-step playbook for identifying early opportunities, validating momentum, and exiting before the crowd.",
    url: "https://www.solrad.io/learn/how-to-find-gems",
    siteName: "SOLRAD",
    type: "article",
    images: ["https://www.solrad.io/brand/og-1200x630.png?v=20260130"],
  },
  twitter: {
    card: "summary_large_image",
    title: "How To Find Solana Gems Using SOLRAD",
    description:
      "Step-by-step playbook for finding Solana gems using signal stacking and on-chain intelligence.",
    images: ["https://www.solrad.io/brand/twitter-1200x630.png?v=20260130"],
  },
}

export default function HowToFindGemsPage() {
  return <HowToFindGemsContent />
}
