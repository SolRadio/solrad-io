import type { TokenScore } from "@/lib/types"
import { redirect } from "next/navigation"
import { resolveTokenByAddress } from "@/lib/token-resolver"
import { normalizeMint, isValidSolanaMint } from "@/lib/solana/normalizeMint"
import NotTrackedPageComponent from "@/components/not-tracked-page-component"
import {
  generateTokenFinancialProductSchema,
  generateTokenFAQSchema,
  generateBreadcrumbSchema,
  generateCombinedSchema,
} from "@/lib/schema"
import { TokenDetailDrawerPage } from "./TokenDetailDrawerPage"

function extractMint(params: Record<string, unknown>, searchParams: Record<string, unknown>): string {
  const raw =
    params?.mint ??
    params?.address ??
    params?.token ??
    (Array.isArray(params?.slug) ? params.slug[0] : params?.slug) ??
    searchParams?.mint ??
    searchParams?.address ??
    searchParams?.token ??
    ""
  return String(raw).trim().split("?")[0].trim()
}

async function getTokenData(mint: string): Promise<{ token: TokenScore | null; source: string }> {
  try {
    const result = await resolveTokenByAddress(mint)
    return { token: result.token, source: result.source }
  } catch {
    return { token: null, source: "missing" }
  }
}

export default async function TokenDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ address: string }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const rawMint = extractMint(resolvedParams, resolvedSearchParams)
  const mint = normalizeMint(rawMint)

  if (!mint || !isValidSolanaMint(mint)) {
    redirect("/")
  }

  if (rawMint !== mint) {
    redirect(`/token/${mint}`)
  }

  const { token } = await getTokenData(mint)

  if (!token) {
    return <NotTrackedPageComponent address={mint} />
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.solrad.io"
  const liquidity = token.liquidity || 0

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateCombinedSchema(
              generateTokenFinancialProductSchema(token),
              generateTokenFAQSchema(token),
              generateBreadcrumbSchema([
                { name: "Home", url: siteUrl },
                { name: "Tokens", url: `${siteUrl}/tracker` },
                { name: token.symbol || "Token", url: `${siteUrl}/token/${mint}` },
              ]),
              {
                "@context": "https://schema.org",
                "@type": "WebPage",
                name: `${token.symbol} — SOLRAD Score & Signals`,
                description: `Real-time SOLRAD analysis for ${token.name}. SOLRAD Score: ${token.totalScore}, Risk: ${token.riskLabel}, Liquidity: $${(liquidity / 1000000).toFixed(2)}M`,
                url: `${siteUrl}/token/${mint}`,
                isPartOf: { "@type": "WebSite", name: "SOLRAD", url: siteUrl },
              }
            )
          ),
        }}
      />

      <TokenDetailDrawerPage token={token} />
    </>
  )
}
