import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Privacy Policy | SOLRAD",
  description: "How SOLRAD handles data, privacy, and third-party integrations. Read-only analytics with no wallet access or personal data collection.",
  alternates: { canonical: "https://www.solrad.io/privacy" },
  openGraph: {
    title: "Privacy Policy | SOLRAD",
    description: "How SOLRAD handles data, privacy, and third-party integrations. Read-only analytics with no wallet access or personal data collection.",
    url: "/privacy",
  },
  twitter: {
    card: "summary",
    title: "Privacy Policy | SOLRAD",
    description: "How SOLRAD handles data, privacy, and third-party integrations.",
  },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-black uppercase tracking-tight mb-4">PRIVACY POLICY</h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-invert max-w-none space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold uppercase mb-3">DATA COLLECTION</h2>
              <p className="text-muted-foreground">
                SOLRAD does not collect, store, or process any personal information. We do not use cookies, tracking
                pixels, or any form of user identification beyond anonymous analytics provided by Vercel Analytics.
              </p>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold uppercase mb-3">PUBLIC DATA</h2>
              <p className="text-muted-foreground">
                All token data displayed on SOLRAD is publicly available information sourced from DexScreener, QuickNode RPC, and on-chain
                data. We do not have access to your wallet, transaction history, or any private information.
              </p>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold uppercase mb-3">THIRD-PARTY SERVICES</h2>
              <p className="text-muted-foreground mb-3">SOLRAD uses the following third-party services:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Vercel Analytics (anonymous usage statistics)</li>
                <li>DexScreener API (public token data)</li>
                <li>QuickNode RPC (public blockchain data)</li>
              </ul>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold uppercase mb-3">YOUR RIGHTS</h2>
              <p className="text-muted-foreground">
                Since we don't collect personal data, there is no personal information to access, modify, or delete. You
                can use SOLRAD completely anonymously.
              </p>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold uppercase mb-3">CHANGES</h2>
              <p className="text-muted-foreground">
                We may update this policy from time to time. Continued use of SOLRAD constitutes acceptance of any
                changes.
              </p>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
