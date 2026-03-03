import type { Metadata } from "next"
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
    <main className="py-12">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-10">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-destructive mb-4">Important</p>
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-7 w-7 text-destructive" aria-hidden="true" />
            <h1 className="font-mono text-3xl font-bold uppercase tracking-tight text-foreground md:text-4xl">Risk Disclaimer</h1>
          </div>
          <div className="mt-3 h-px w-full bg-border" />
          <p className="mt-4 text-sm text-muted-foreground">Please read carefully before using SOLRAD</p>
        </div>

        <div className="max-w-3xl space-y-6">
          <Card className="p-6 border-destructive/50">
            <h2 className="font-mono text-sm font-bold uppercase tracking-[0.15em] text-destructive">Cryptocurrency Risk Warning</h2>
            <p className="mt-3 text-muted-foreground">
              Trading and investing in cryptocurrencies involves substantial risk of loss and is not suitable for
              every investor. The valuation of cryptocurrencies may fluctuate dramatically, and you may lose all or
              more than your original investment.
            </p>
          </Card>

          {[
            { title: "No Guarantees", text: "SOLRAD scores are computational estimates based on publicly available data. A high score does not guarantee profitability, and a low score does not guarantee loss. Past performance is not indicative of future results." },
            { title: "Do Your Own Research (DYOR)", text: "SOLRAD is a tool to assist your research, not replace it. Always conduct thorough due diligence before making any investment decision. Verify all information independently and consult with qualified financial advisors." },
            { title: "Smart Contract Risks", text: "Solana tokens may contain bugs, vulnerabilities, or malicious code. Even tokens with high SOLRAD scores can suffer from exploits, rug pulls, or technical failures. We cannot verify the security or legitimacy of any token\u2019s smart contract." },
            { title: "Market Volatility", text: "Cryptocurrency markets are highly volatile and can be influenced by regulatory changes, market sentiment, technical issues, and other factors beyond our control. Prices can change drastically in seconds." },
            { title: "No Endorsement", text: "The presence of a token on SOLRAD does not constitute an endorsement, recommendation, or guarantee. We do not verify the legitimacy of projects or their teams." },
            { title: "Data Limitations", text: "Our data sources may be incomplete, delayed, or inaccurate. Network issues, API failures, or manipulation of on-chain data can affect scoring accuracy. Always verify information from multiple independent sources." },
          ].map(({ title, text }) => (
            <Card key={title} className="p-6">
              <h2 className="font-mono text-sm font-bold uppercase tracking-[0.15em]">{title}</h2>
              <p className="mt-3 text-muted-foreground">{text}</p>
            </Card>
          ))}

          <Card className="p-6 bg-muted/50">
            <p className="text-sm text-muted-foreground">
              By using SOLRAD, you acknowledge that you understand and accept these risks. You agree that SOLRAD and
              its operators are not responsible for any losses incurred through the use of this service.
            </p>
          </Card>
        </div>
      </div>
    </main>
  )
}
