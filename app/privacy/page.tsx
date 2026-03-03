import type { Metadata } from "next"
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
    <main className="py-12">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-10">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary mb-4">Legal</p>
          <h1 className="font-mono text-3xl font-bold uppercase tracking-tight text-foreground md:text-4xl">Privacy Policy</h1>
          <div className="mt-3 h-px w-full bg-border" />
          <p className="mt-4 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="max-w-3xl space-y-6">
          {[
            { title: "Data Collection", text: "SOLRAD does not collect, store, or process any personal information. We do not use cookies, tracking pixels, or any form of user identification beyond anonymous analytics provided by Vercel Analytics." },
            { title: "Public Data", text: "All token data displayed on SOLRAD is publicly available information sourced from DexScreener, QuickNode RPC, and on-chain data. We do not have access to your wallet, transaction history, or any private information." },
            { title: "Your Rights", text: "Since we don\u2019t collect personal data, there is no personal information to access, modify, or delete. You can use SOLRAD completely anonymously." },
            { title: "Changes", text: "We may update this policy from time to time. Continued use of SOLRAD constitutes acceptance of any changes." },
          ].map(({ title, text }) => (
            <Card key={title} className="p-6">
              <h2 className="font-mono text-sm font-bold uppercase tracking-[0.15em]">{title}</h2>
              <p className="mt-3 text-muted-foreground">{text}</p>
            </Card>
          ))}

          <Card className="p-6">
            <h2 className="font-mono text-sm font-bold uppercase tracking-[0.15em]">Third-Party Services</h2>
            <p className="mt-3 text-muted-foreground mb-3">SOLRAD uses the following third-party services:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Vercel Analytics (anonymous usage statistics)</li>
              <li>DexScreener API (public token data)</li>
              <li>QuickNode RPC (public blockchain data)</li>
            </ul>
          </Card>
        </div>
      </div>
    </main>
  )
}
