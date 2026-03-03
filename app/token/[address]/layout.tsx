import React from "react"
import type { Metadata } from "next"
import { formatCompactUsd } from "@/lib/format"

type Props = {
  params: Promise<{ address: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { address } = await params
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.solrad.io"

  try {
    const response = await fetch(`${siteUrl}/api/token/${address}`, {
      cache: "no-store",
    })
    if (!response.ok) throw new Error("not ok")
    const token = await response.json()

    if (token && token.symbol) {
      const score = token.totalScore ?? token.score ?? 0
      const title = `$${token.symbol} — SOLRAD Score ${Number(score).toFixed(1)}/100`
      const description = `$${token.symbol} scored ${Number(score).toFixed(1)}/100 on SOLRAD. Signal: ${token.signalState ?? "N/A"}. Vol: ${formatCompactUsd(token.volume24h)}. Real on-chain intelligence.`

      return {
        title,
        description,
        robots: { index: false, follow: false },
        alternates: {
          canonical: `${siteUrl}/token/${address}`,
        },
        openGraph: {
          title,
          description,
          url: `${siteUrl}/token/${address}`,
          siteName: "SOLRAD",
          type: "website",
          images: [{ url: "/brand/og-1200x630.png", width: 1200, height: 630 }],
        },
        twitter: {
          card: "summary_large_image",
          title,
          description,
          images: [{ url: "/brand/twitter-1200x630.png", width: 1200, height: 630 }],
        },
      }
    }
  } catch {
    // Fall through to default
  }

  return {
    title: "Token Intelligence | SOLRAD",
    description: "Token intelligence on SOLRAD.",
    robots: { index: false, follow: false },
  }
}

export default function TokenLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
