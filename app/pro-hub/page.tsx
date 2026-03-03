import type { Metadata } from "next"
import { ProHubClient } from "./ProHubClient"
import { isProUser } from "@/lib/subscription"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Pro Hub | SOLRAD",
  description: "Your SOLRAD Pro command center. Access Score Lab, Signal Outcomes, Alpha Ledger CSV export, and all Pro features from one place.",
  alternates: { canonical: "https://www.solrad.io/pro-hub" },
  robots: { index: false, follow: false },
}

export default async function ProHubPage() {
  const isPro = await isProUser()

  if (!isPro) {
    redirect("/pro")
  }

  return (
    <main>
      <ProHubClient />
    </main>
  )
}
