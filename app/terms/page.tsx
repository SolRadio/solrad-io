import type { Metadata } from "next"
import { Card } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Terms of Service | SOLRAD",
  description: "Terms of service for SOLRAD. Understand the conditions governing use of our Solana token analytics and signal research platform.",
  alternates: { canonical: "https://www.solrad.io/terms" },
  openGraph: {
    title: "Terms of Service | SOLRAD",
    description: "Terms of service for SOLRAD. Understand the conditions governing use of our Solana token analytics and signal research platform.",
    url: "/terms",
  },
  twitter: {
    card: "summary",
    title: "Terms of Service | SOLRAD",
    description: "Terms of service for SOLRAD Solana token analytics platform.",
  },
}

export default function TermsPage() {
  return (
    <main className="py-12">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-10">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary mb-4">Legal</p>
          <h1 className="font-mono text-3xl font-bold uppercase tracking-tight text-foreground md:text-4xl">Terms of Service</h1>
          <div className="mt-3 h-px w-full bg-border" />
          <p className="mt-4 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="max-w-3xl space-y-6">
          {[
            { title: "Acceptance of Terms", text: "By accessing and using SOLRAD, you accept and agree to be bound by these Terms of Service. If you do not agree, do not use this service." },
            { title: "Service Description", text: "SOLRAD is an analytics tool that aggregates publicly available data about Solana tokens. We provide scoring and analysis for informational and educational purposes only." },
            { title: "No Financial Advice", text: 'SOLRAD does not provide financial, investment, or trading advice. All information is provided "as is" for informational purposes only. You are solely responsible for your own investment decisions.' },
            { title: "Data Accuracy", text: "While we strive for accuracy, we make no warranties about the completeness, reliability, or accuracy of the data. Token scores and metrics are computational estimates and should not be relied upon as the sole basis for any decision." },
            { title: "Limitation of Liability", text: "SOLRAD and its operators shall not be liable for any damages arising from the use or inability to use this service, including but not limited to trading losses, data inaccuracies, or service interruptions." },
            { title: "Modifications", text: "We reserve the right to modify or discontinue the service at any time without notice. We may also update these Terms at any time." },
          ].map(({ title, text }) => (
            <Card key={title} className="p-6">
              <h2 className="font-mono text-sm font-bold uppercase tracking-[0.15em]">{title}</h2>
              <p className="mt-3 text-muted-foreground">{text}</p>
            </Card>
          ))}

          <Card className="p-6">
            <h2 className="font-mono text-sm font-bold uppercase tracking-[0.15em]">Prohibited Use</h2>
            <p className="mt-3 text-muted-foreground mb-3">You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Attempt to scrape, spider, or harvest data in violation of our rate limits</li>
              <li>Use the service for any unlawful purpose</li>
              <li>Interfere with or disrupt the service</li>
              <li>Misrepresent SOLRAD scores as financial advice</li>
            </ul>
          </Card>
        </div>
      </div>
    </main>
  )
}
