import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, AlertTriangle, CheckCircle, XCircle, Target, Activity, Lock, Users } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Solana Risk Checker - Analyze Token Safety & Rug Pull Risk",
  description:
    "Check Solana token risk before investing. Analyze contract safety, liquidity health, holder concentration, and rug pull indicators. Protect yourself from Solana scams.",
  keywords:
    "solana risk checker, solana token safety, rug pull checker, solana scam detector, token risk analysis, solana contract checker, safe solana tokens",
  alternates: {
    canonical: "https://www.solrad.io/solana-risk-checker",
  },
  openGraph: {
    title: "Solana Risk Checker - Analyze Token Safety & Rug Pull Risk | SOLRAD",
    description:
      "Check Solana token risk before investing. Analyze contract safety, liquidity health, and rug pull indicators.",
    url: "https://www.solrad.io/solana-risk-checker",
  },
  twitter: {
    card: "summary_large_image",
    title: "Solana Risk Checker - Analyze Token Safety & Rug Pull Risk | SOLRAD",
    description:
      "Check Solana token risk before investing. Analyze contract safety, liquidity, and rug pull indicators.",
  },
}

export default function SolanaRiskCheckerPage() {
  const faqs = [
    {
      question: "How do I check if a Solana token is safe?",
      answer:
        "Use SOLRAD's risk checker to analyze: (1) Liquidity depth and lock status - safe tokens have $100K+ locked liquidity, (2) Holder concentration - avoid tokens where top 10 holders own &gt;70%, (3) Mint authority status - safe tokens have burned mint authority, (4) FDV ratio - extreme ratios above 1000x indicate overvaluation, (5) SOLRAD risk classification - tokens labeled 'Low Risk' have passed multiple safety checks. Always verify contract details on blockchain explorers like Solscan.",
    },
    {
      question: "What is a rug pull and how can I avoid it?",
      answer:
        "A rug pull occurs when developers drain liquidity or dump large token holdings, crashing the price and leaving investors with worthless tokens. Avoid rug pulls by: checking if liquidity is locked/burned (unlocked LP = rug risk), verifying mint authority is burned (active mint = unlimited printing), analyzing holder concentration (developer wallets holding majority = exit scam risk), monitoring liquidity trends (draining liquidity = imminent rug), and using SOLRAD's risk labels to filter high-risk tokens automatically.",
    },
    {
      question: "What do SOLRAD risk labels mean?",
      answer:
        "SOLRAD classifies tokens into risk categories: LOW RISK - Healthy liquidity ($200K+), distributed holders (&lt;50% concentration), burned mint authority, reasonable FDV ratios. MEDIUM RISK - Adequate liquidity ($50K-$200K), moderate concentration (50-70%), or minor red flags. HIGH RISK - Low liquidity (&lt;$50K), high concentration (&gt;70%), or multiple warning signs. CRITICAL RISK - Extreme red flags like draining liquidity, unsafe contracts, or honeypot indicators. Avoid HIGH and CRITICAL risk tokens.",
    },
    {
      question: "Can SOLRAD detect honeypot scams?",
      answer:
        "SOLRAD detects potential honeypot indicators through contract analysis and trading pattern monitoring. Honeypots allow buys but prevent sells through hidden contract functions. Warning signs include: extremely low sell volume compared to buy volume, holder count increasing but no successful sells, tokens stuck in wallets with failed transaction attempts, and unusual contract code patterns. While SOLRAD flags suspicious patterns, always test with small amounts first and verify contract code on Solscan before large investments.",
    },
    {
      question: "How often does SOLRAD update risk assessments?",
      answer:
        "Risk assessments update every 5-10 minutes alongside token scores. SOLRAD continuously monitors: liquidity depth changes (draining = increasing risk), holder concentration shifts (whale accumulation = risk), mint authority modifications (reactivation = danger), and trading pattern anomalies (volume manipulation = caution). Risk labels can change rapidly as token conditions evolve. Always check current risk status before investing, not cached or outdated information.",
    },
  ]

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        url: "https://www.solrad.io/solana-risk-checker",
        name: "Solana Risk Checker - Analyze Token Safety & Rug Pull Risk",
        description:
          "Check Solana token risk before investing. Analyze contract safety, liquidity health, holder concentration, and rug pull indicators.",
        isPartOf: {
          "@type": "WebSite",
          url: "https://www.solrad.io",
          name: "SOLRAD",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        
        <main className="flex-1">
          <section className="container mx-auto px-4 py-16 md:py-24 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-2xl bg-primary/10">
                <Shield className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Solana <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Risk Checker</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Analyze Solana token safety before investing. Check rug pull risk, contract security, liquidity health, and holder concentration automatically.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  <Shield className="h-4 w-4" />
                  Check Token Risk Now
                </Button>
              </Link>
              <Link href="/security">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                  Learn About Security
                </Button>
              </Link>
            </div>
          </section>

          <section className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">Why Check Solana Token Risk?</h2>
              <Card className="p-6 mb-8">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The Solana ecosystem has thousands of tokens, but many are scams, rug pulls, or poorly designed projects that will lose value. <strong className="text-foreground">Checking token risk before investing</strong> is essential to protect your capital and avoid obvious scams.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  SOLRAD automatically analyzes every tracked token for red flags including: low or draining liquidity, unsafe contract structures, extreme holder concentration, unrealistic FDV ratios, and suspicious trading patterns. Our risk classification system (Low, Medium, High, Critical) helps you quickly identify which tokens are safe to research further and which to avoid completely.
                </p>
              </Card>
            </div>
          </section>

          <section className="container mx-auto px-4 py-12">
            <h2 className="text-3xl font-bold mb-8 text-center">Risk Analysis Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4">
                    <Lock className="h-6 w-6 text-cyan-500" />
                  </div>
                  <CardTitle>Liquidity Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Check liquidity depth, lock status, and drain patterns. Identify tokens with insufficient or unlocked liquidity indicating rug pull risk.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-amber-500" />
                  </div>
                  <CardTitle>Holder Concentration</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Analyze holder distribution and whale concentration. High concentration (&gt;70%) indicates potential for coordinated dumps.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center mb-4">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                  </div>
                  <CardTitle>Contract Safety</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Verify mint authority status, detect honeypot patterns, and identify unsafe contract structures that enable scams.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                  <CardTitle>Risk Classification</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Automatic risk labeling (Low/Medium/High/Critical) based on comprehensive analysis of multiple risk factors.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="container mx-auto px-4 py-12 bg-muted/30">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8">Understanding Risk Classifications</h2>
              <div className="space-y-6">
                <Card className="p-6 border-green-500/20">
                  <div className="flex items-start gap-4">
                    <Badge variant="default" className="shrink-0 bg-green-500">LOW RISK</Badge>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Safe to Research Further</h3>
                      <p className="text-muted-foreground leading-relaxed mb-3">
                        Tokens with LOW RISK classification have passed multiple safety checks and show healthy fundamentals. They typically have:
                      </p>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Liquidity depth $200K+ with locked or burned LP tokens</li>
                        <li>• Distributed holder base (top 10 holders own less than 50%)</li>
                        <li>• Burned mint authority preventing unlimited token creation</li>
                        <li>• Reasonable FDV ratios (market cap to FDV below 100x)</li>
                        <li>• Consistent liquidity and holder growth over time</li>
                        <li>• No honeypot indicators or suspicious contract patterns</li>
                      </ul>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-yellow-500/20">
                  <div className="flex items-start gap-4">
                    <Badge variant="default" className="shrink-0 bg-yellow-500">MEDIUM RISK</Badge>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Proceed with Caution</h3>
                      <p className="text-muted-foreground leading-relaxed mb-3">
                        MEDIUM RISK tokens have some concerning factors but aren't immediately dangerous. Common issues:
                      </p>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Liquidity depth $50K-$200K (adequate but not ideal)</li>
                        <li>• Moderate holder concentration (50-70% in top wallets)</li>
                        <li>• Young token age with limited track record</li>
                        <li>• Elevated FDV ratios (100x-500x) indicating overvaluation</li>
                        <li>• Minor contract concerns or unverified code</li>
                        <li>• Requires additional research before investing</li>
                      </ul>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-orange-500/20">
                  <div className="flex items-start gap-4">
                    <Badge variant="default" className="shrink-0 bg-orange-500">HIGH RISK</Badge>
                    <div>
                      <h3 className="text-xl font-bold mb-2">High Probability of Loss</h3>
                      <p className="text-muted-foreground leading-relaxed mb-3">
                        HIGH RISK tokens have multiple red flags and should be avoided by most investors:
                      </p>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Low liquidity (&lt;$50K) or unlocked LP</li>
                        <li>• Extreme holder concentration (&gt;70% controlled by top wallets)</li>
                        <li>• Active mint authority enabling infinite token printing</li>
                        <li>• Extreme FDV ratios (&gt;500x) indicating pump-and-dump setup</li>
                        <li>• Declining liquidity or holder counts (exit scam indicators)</li>
                        <li>• Only suitable for experienced traders accepting extreme risk</li>
                      </ul>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-red-500/20">
                  <div className="flex items-start gap-4">
                    <Badge variant="default" className="shrink-0 bg-red-500">CRITICAL RISK</Badge>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Likely Scam - Do Not Invest</h3>
                      <p className="text-muted-foreground leading-relaxed mb-3">
                        CRITICAL RISK tokens show severe warning signs of scams or imminent rug pulls:
                      </p>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Actively draining liquidity or locked LP expiring soon</li>
                        <li>• Honeypot contract preventing sells (only buys allowed)</li>
                        <li>• Developer wallet holds majority of supply (instant dump risk)</li>
                        <li>• Suspicious contract code with hidden malicious functions</li>
                        <li>• Extreme FDV manipulation (&gt;1000x) for pump-and-dump</li>
                        <li>• <strong>AVOID COMPLETELY - these tokens will likely go to zero</strong></li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </section>

          <section className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8">Key Risk Indicators Explained</h2>
              <div className="space-y-4">
                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <Lock className="h-5 w-5 text-cyan-500" />
                    Liquidity Depth & Lock Status
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">What it is:</strong> The amount of paired tokens (usually SOL) available in liquidity pools, and whether that liquidity is locked or can be withdrawn by developers. <strong className="text-foreground">Why it matters:</strong> Low or unlocked liquidity enables rug pulls where developers drain the pool, making the token worthless. Safe tokens have $100K+ liquidity that's locked for months or burned permanently. Check SOLRAD's liquidity charts for draining patterns indicating imminent rugs.
                  </p>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5 text-amber-500" />
                    Holder Concentration
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">What it is:</strong> The percentage of total supply controlled by the largest wallets, typically measured as "top 10 holder percentage". <strong className="text-foreground">Why it matters:</strong> High concentration means a few wallets can dump and crash the price. Healthy tokens have distributed holders where top 10 own less than 50%. Anything above 70% is extremely risky as coordinated sells will destroy liquidity. SOLRAD flags dangerous concentration automatically.
                  </p>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Mint Authority Status
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">What it is:</strong> The ability to create new tokens after launch. <strong className="text-foreground">Why it matters:</strong> Active mint authority means developers can print unlimited tokens and dump them, diluting your holdings to zero. Safe tokens have burned mint authority, permanently disabling this function. Always verify on Solscan that mint authority is burned before investing. Tokens with active mint authority are instant red flags.
                  </p>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-500" />
                    FDV Ratio (Market Cap to FDV)
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">What it is:</strong> The ratio between current market capitalization and fully diluted valuation (FDV = max supply × price). <strong className="text-foreground">Why it matters:</strong> Extreme ratios (above 1000x) indicate massive overvaluation where circulating supply is tiny compared to max supply. When more tokens unlock or enter circulation, price typically crashes. Healthy ratios are below 100x. Use SOLRAD's FDV warnings to avoid overvalued tokens that will inevitably correct downward.
                  </p>
                </Card>
              </div>
            </div>
          </section>

          <section className="container mx-auto px-4 py-12 bg-muted/30">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8">Risk Checker FAQs</h2>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <Card key={index} className="p-6">
                    <h3 className="text-lg font-bold mb-3">{faq.question}</h3>
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          <section className="container mx-auto px-4 py-16 text-center">
            <Card className="p-12 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <h2 className="text-3xl font-bold mb-4">Protect Your Investments with Risk Analysis</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Check Solana token safety before investing. Avoid rug pulls, scams, and high-risk tokens with SOLRAD's automated risk checker.
              </p>
              <Link href="/">
                <Button size="lg" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Check Token Risk Now
                </Button>
              </Link>
            </Card>
          </section>
        </main>

        <Footer />
      </div>
    </>
  )
}
