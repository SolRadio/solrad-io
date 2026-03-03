import type { Metadata } from "next"
import { ProContent } from "./pro-content"
import { DevProToggle } from "@/components/dev-pro-toggle"
import { generateBreadcrumbSchema, generateProFAQSchema } from "@/lib/schema"
import { isProUser } from "@/lib/subscription"

export const metadata: Metadata = {
  title: "SOLRAD Pro — Advanced Solana Intelligence",
  description:
    "Unlock elite Solana insights. Holder quality scores, smart flow badges, insider risk detection, and advanced alerts. Join the Pro waitlist now.",
  keywords: "SOLRAD Pro, Solana Pro features, advanced token analysis, holder quality score, insider risk detection",
  alternates: {
    canonical: "https://www.solrad.io/pro",
  },
  openGraph: {
    title: "SOLRAD Pro — Advanced Solana Intelligence",
    description: "Unlock elite Solana insights with Pro features. Holder quality scores, insider risk detection, and advanced alerts.",
    url: "https://www.solrad.io/pro",
    images: [{ url: "/brand/og-1200x630.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SOLRAD Pro — Advanced Solana Intelligence",
    description: "Unlock elite Solana insights with Pro features.",
    images: ["/brand/twitter-1200x630.png"],
  },
}

export default async function ProPage() {
  const isPro = await isProUser()
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://www.solrad.io" },
    { name: "Pro", url: "https://www.solrad.io/pro" },
  ])

  const faqSchema = generateProFAQSchema()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
      <ProContent isPro={isPro} />
      <DevProToggle />
    </>
  )
}
