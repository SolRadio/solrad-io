import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
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
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-black uppercase tracking-tight mb-4">TERMS OF SERVICE</h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-invert max-w-none space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold uppercase mb-3">ACCEPTANCE OF TERMS</h2>
              <p className="text-muted-foreground">
                By accessing and using SOLRAD, you accept and agree to be bound by these Terms of Service. If you do not
                agree, do not use this service.
              </p>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold uppercase mb-3">SERVICE DESCRIPTION</h2>
              <p className="text-muted-foreground">
                SOLRAD is an analytics tool that aggregates publicly available data about Solana tokens. We provide
                scoring and analysis for informational and educational purposes only.
              </p>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold uppercase mb-3">NO FINANCIAL ADVICE</h2>
              <p className="text-muted-foreground">
                SOLRAD does not provide financial, investment, or trading advice. All information is provided "as is"
                for informational purposes only. You are solely responsible for your own investment decisions.
              </p>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold uppercase mb-3">DATA ACCURACY</h2>
              <p className="text-muted-foreground">
                While we strive for accuracy, we make no warranties about the completeness, reliability, or accuracy of
                the data. Token scores and metrics are computational estimates and should not be relied upon as the sole
                basis for any decision.
              </p>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold uppercase mb-3">LIMITATION OF LIABILITY</h2>
              <p className="text-muted-foreground">
                SOLRAD and its operators shall not be liable for any damages arising from the use or inability to use
                this service, including but not limited to trading losses, data inaccuracies, or service interruptions.
              </p>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold uppercase mb-3">PROHIBITED USE</h2>
              <p className="text-muted-foreground mb-3">You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Attempt to scrape, spider, or harvest data in violation of our rate limits</li>
                <li>Use the service for any unlawful purpose</li>
                <li>Interfere with or disrupt the service</li>
                <li>Misrepresent SOLRAD scores as financial advice</li>
              </ul>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold uppercase mb-3">MODIFICATIONS</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify or discontinue the service at any time without notice. We may also update
                these Terms at any time.
              </p>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
