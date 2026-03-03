import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

export const metadata: Metadata = {
  title: "Risk Disclaimer | SOLRAD",
  description: "Important risk disclosures for SOLRAD. Cryptocurrency analytics are not financial advice. Understand the risks before acting on any signal data.",
  alternates: { canonical: "https://www.solrad.io/disclaimer" },
  openGraph: {
    title: "Risk Disclaimer | SOLRAD",
    description: "Important risk disclosures for SOLRAD. Cryptocurrency analytics are not financial advice.",
    url: "/disclaimer",
  },
  twitter: {
    card: "summary",
    title: "Risk Disclaimer | SOLRAD",
    description: "Important risk disclosures for SOLRAD. Cryptocurrency analytics are not financial advice.",
  },
}

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <h1 className="text-4xl font-black uppercase tracking-tight">RISK DISCLAIMER</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-8">Please read carefully before using SOLRAD</p>

          <div className="prose prose-invert max-w-none space-y-6">
            <Card className="p-6 border-destructive/50 bg-destructive/5">
              <h2 className="text-xl font-bold uppercase mb-3 text-destructive">CRYPTOCURRENCY RISK WARNING</h2>
              <p className="text-muted-foreground">
                Trading and investing in cryptocurrencies involves substantial risk of loss and is not suitable for
                every investor. The valuation of cryptocurrencies may fluctuate dramatically, and you may lose all or
                more than your original investment.
              </p>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold uppercase mb-3">NO GUARANTEES</h2>
              <p className="text-muted-foreground">
                SOLRAD scores are computational estimates based on publicly available data. A high score does not
                guarantee profitability, and a low score does not guarantee loss. Past performance is not indicative of
                future results.
              </p>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold uppercase mb-3">DO YOUR OWN RESEARCH (DYOR)</h2>
              <p className="text-muted-foreground">
                SOLRAD is a tool to assist your research, not replace it. Always conduct thorough due diligence before
                making any investment decision. Verify all information independently and consult with qualified
                financial advisors.
              </p>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold uppercase mb-3">SMART CONTRACT RISKS</h2>
              <p className="text-muted-foreground">
                Solana tokens may contain bugs, vulnerabilities, or malicious code. Even tokens with high SOLRAD scores
                can suffer from exploits, rug pulls, or technical failures. We cannot verify the security or legitimacy
                of any token's smart contract.
              </p>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold uppercase mb-3">MARKET VOLATILITY</h2>
              <p className="text-muted-foreground">
                Cryptocurrency markets are highly volatile and can be influenced by regulatory changes, market
                sentiment, technical issues, and other factors beyond our control. Prices can change drastically in
                seconds.
              </p>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold uppercase mb-3">NO ENDORSEMENT</h2>
              <p className="text-muted-foreground">
                The presence of a token on SOLRAD does not constitute an endorsement, recommendation, or guarantee. We
                do not verify the legitimacy of projects or their teams.
              </p>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold uppercase mb-3">DATA LIMITATIONS</h2>
              <p className="text-muted-foreground">
                Our data sources may be incomplete, delayed, or inaccurate. Network issues, API failures, or
                manipulation of on-chain data can affect scoring accuracy. Always verify information from multiple
                independent sources.
              </p>
            </Card>

            <Card className="p-6 bg-muted/50">
              <p className="text-sm text-muted-foreground">
                By using SOLRAD, you acknowledge that you understand and accept these risks. You agree that SOLRAD and
                its operators are not responsible for any losses incurred through the use of this service.
              </p>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
