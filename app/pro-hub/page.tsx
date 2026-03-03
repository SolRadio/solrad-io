import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
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
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <ProHubClient />
      </main>
      <Footer />
    </div>
  )
}
