import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Database, 
  Server, 
  Cpu, 
  Globe, 
  Shield, 
  Lock, 
  AlertTriangle,
  Activity,
  Clock,
  Zap,
  CheckCircle2,
  ArrowRight,
  Eye
} from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Infrastructure & Transparency | SOLRAD",
  description:
    "How SOLRAD ingests, processes, and serves Solana token intelligence. Read-only architecture, no wallet access, verifiable data sources.",
  alternates: {
    canonical: "https://www.solrad.io/infrastructure",
  },
  openGraph: {
    title: "Infrastructure & Transparency | SOLRAD",
    description:
      "How SOLRAD ingests, processes, and serves Solana token intelligence. Read-only architecture, no wallet access.",
    url: "https://www.solrad.io/infrastructure",
    siteName: "SOLRAD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Infrastructure & Transparency | SOLRAD",
    description:
      "How SOLRAD processes Solana token intelligence. Read-only architecture, no wallet access.",
  },
}

export default function InfrastructurePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-6 text-foreground">
              SOLRAD Infrastructure
            </h1>
            <p className="text-xl md:text-2xl text-foreground/90 leading-relaxed mb-8">
              How SOLRAD ingests, processes, and serves Solana intelligence signals — transparently and safely.
            </p>
            
            {/* Trust Bullets */}
            <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                <Shield className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">Read-only platform</p>
                  <p className="text-xs text-muted-foreground">No wallet connections</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                <Lock className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">No private keys</p>
                  <p className="text-xs text-muted-foreground">No signing, no custody</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                <Activity className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">On-chain signals</p>
                  <p className="text-xs text-muted-foreground">Verifiable market data</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* System Overview */}
        <section className="border-t border-border bg-muted/30">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-4 text-center">
                System Overview
              </h2>
              <p className="text-lg text-muted-foreground text-center mb-12">
                A transparent pipeline from data sources to intelligence delivery
              </p>

              {/* Desktop: Horizontal Flow with Arrows */}
              <div className="hidden lg:grid lg:grid-cols-5 gap-4 mb-8">
                <Card className="p-6 bg-zinc-900 border-zinc-800 text-center">
                  <Database className="h-8 w-8 text-cyan-400 mb-4 mx-auto" />
                  <h3 className="text-lg font-bold mb-3">Data Sources</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Solana RPC providers</li>
                    <li>• Market aggregators</li>
                    <li>• DEX APIs</li>
                    <li>• On-chain indexers</li>
                  </ul>
                </Card>

                <Card className="p-6 bg-zinc-900 border-zinc-800 text-center">
                  <Server className="h-8 w-8 text-purple-400 mb-4 mx-auto" />
                  <h3 className="text-lg font-bold mb-3">Ingestion Layer</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Data validation</li>
                    <li>• Indexing + filtering</li>
                    <li>• Normalization</li>
                    <li>• Deduplication</li>
                  </ul>
                </Card>

                <Card className="p-6 bg-zinc-900 border-zinc-800 text-center">
                  <Cpu className="h-8 w-8 text-lime-400 mb-4 mx-auto" />
                  <h3 className="text-lg font-bold mb-3">Intelligence Engine</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Scoring algorithms</li>
                    <li>• Signal detection</li>
                    <li>• Risk assessment</li>
                    <li>• Badge generation</li>
                  </ul>
                </Card>

                <Card className="p-6 bg-zinc-900 border-zinc-800 text-center">
                  <Zap className="h-8 w-8 text-yellow-400 mb-4 mx-auto" />
                  <h3 className="text-lg font-bold mb-3">Caching & Delivery</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Caching layer</li>
                    <li>• Edge optimization</li>
                    <li>• CDN distribution</li>
                    <li>• API endpoints</li>
                  </ul>
                </Card>

                <Card className="p-6 bg-zinc-900 border-zinc-800 text-center">
                  <Globe className="h-8 w-8 text-cyan-400 mb-4 mx-auto" />
                  <h3 className="text-lg font-bold mb-3">Frontend Experience</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Real-time dashboard</li>
                    <li>• Token analytics</li>
                    <li>• Signal alerts</li>
                    <li>• Research tools</li>
                  </ul>
                </Card>
              </div>

              {/* Mobile: Stacked Flow */}
              <div className="lg:hidden space-y-4">
                <Card className="p-6 bg-zinc-900 border-zinc-800 text-center">
                  <Database className="h-8 w-8 text-cyan-400 mb-4 mx-auto" />
                  <h3 className="text-lg font-bold mb-3">Data Sources</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Solana RPC providers</li>
                    <li>• Market aggregators</li>
                    <li>• DEX APIs</li>
                    <li>• On-chain indexers</li>
                  </ul>
                </Card>
                <div className="flex justify-center">
                  <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90" />
                </div>

                <Card className="p-6 bg-zinc-900 border-zinc-800 text-center">
                  <Server className="h-8 w-8 text-purple-400 mb-4 mx-auto" />
                  <h3 className="text-lg font-bold mb-3">Ingestion Layer</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Data validation</li>
                    <li>• Indexing + filtering</li>
                    <li>• Normalization</li>
                    <li>• Deduplication</li>
                  </ul>
                </Card>
                <div className="flex justify-center">
                  <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90" />
                </div>

                <Card className="p-6 bg-zinc-900 border-zinc-800 text-center">
                  <Cpu className="h-8 w-8 text-lime-400 mb-4 mx-auto" />
                  <h3 className="text-lg font-bold mb-3">Intelligence Engine</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Scoring algorithms</li>
                    <li>• Signal detection</li>
                    <li>• Risk assessment</li>
                    <li>• Badge generation</li>
                  </ul>
                </Card>
                <div className="flex justify-center">
                  <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90" />
                </div>

                <Card className="p-6 bg-zinc-900 border-zinc-800 text-center">
                  <Zap className="h-8 w-8 text-yellow-400 mb-4 mx-auto" />
                  <h3 className="text-lg font-bold mb-3">Caching & Delivery</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Caching layer</li>
                    <li>• Edge optimization</li>
                    <li>• CDN distribution</li>
                    <li>• API endpoints</li>
                  </ul>
                </Card>
                <div className="flex justify-center">
                  <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90" />
                </div>

                <Card className="p-6 bg-zinc-900 border-zinc-800 text-center">
                  <Globe className="h-8 w-8 text-cyan-400 mb-4 mx-auto" />
                  <h3 className="text-lg font-bold mb-3">Frontend Experience</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Real-time dashboard</li>
                    <li>• Token analytics</li>
                    <li>• Signal alerts</li>
                    <li>• Research tools</li>
                  </ul>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Security Model */}
        <section className="border-t border-border">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-4 text-center">
                Security Model
              </h2>
              <p className="text-lg text-muted-foreground text-center mb-12">
                Built on read-only architecture with zero wallet access
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                <Card className="p-6 bg-zinc-900 border-zinc-800 text-center">
                  <Eye className="h-10 w-10 text-green-500 mb-4 mx-auto" />
                  <h3 className="text-xl font-bold mb-3">Read-Only by Design</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    SOLRAD operates in read-only mode with no wallet connection capabilities, no transaction signing, and no access to private keys.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• No wallet connect prompts</li>
                    <li>• No signature requests</li>
                    <li>• No asset custody</li>
                  </ul>
                </Card>

                <Card className="p-6 bg-zinc-900 border-zinc-800 text-center">
                  <Shield className="h-10 w-10 text-cyan-500 mb-4 mx-auto" />
                  <h3 className="text-xl font-bold mb-3">Attack Surface Reduction</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    By eliminating transaction capabilities and wallet integrations, SOLRAD minimizes common DeFi attack vectors.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• No smart contract interactions</li>
                    <li>• No token approvals</li>
                    <li>• No fund movements</li>
                  </ul>
                </Card>

                <Card className="p-6 bg-zinc-900 border-zinc-800 text-center">
                  <AlertTriangle className="h-10 w-10 text-yellow-500 mb-4 mx-auto" />
                  <h3 className="text-xl font-bold mb-3">Integrity & Abuse Controls</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    Multiple layers of validation, rate limiting, and anomaly detection protect data integrity.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Rate limiting on all endpoints</li>
                    <li>• Input validation + sanitization</li>
                    <li>• Anomaly monitoring</li>
                  </ul>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Reliability */}
        <section className="border-t border-border bg-muted/30">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-4 text-center">
                Reliability
              </h2>
              <p className="text-lg text-muted-foreground text-center mb-12">
                Infrastructure targets for consistent service delivery
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 bg-zinc-900 border-zinc-800 text-center">
                  <Clock className="h-10 w-10 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-bold mb-2">Data Refresh</h3>
                  <p className="text-sm text-muted-foreground">
                    Near real-time updates (varies by source)
                  </p>
                </Card>

                <Card className="p-6 bg-zinc-900 border-zinc-800 text-center">
                  <Globe className="h-10 w-10 text-cyan-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold mb-2">Global Delivery</h3>
                  <p className="text-sm text-muted-foreground">
                    CDN/edge optimized distribution
                  </p>
                </Card>

                <Card className="p-6 bg-zinc-900 border-zinc-800 text-center">
                  <Activity className="h-10 w-10 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold mb-2">Monitoring</h3>
                  <p className="text-sm text-muted-foreground">
                    Automated health checks and alerting
                  </p>
                </Card>

                <Card className="p-6 bg-zinc-900 border-zinc-800 text-center">
                  <CheckCircle2 className="h-10 w-10 text-lime-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold mb-2">Graceful Degradation</h3>
                  <p className="text-sm text-muted-foreground">
                    Fallback caching when sources lag
                  </p>
                </Card>
              </div>

              <div className="mt-8 p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                <p className="text-xs text-muted-foreground text-center">
                  Note: Uptime and data refresh rates depend on upstream providers and network conditions. SOLRAD does not guarantee 100% uptime.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Transparency Commitments */}
        <section className="border-t border-border">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-4 text-center">
                Transparency Commitments
              </h2>
              <p className="text-lg text-muted-foreground text-center mb-12">
                How we maintain trust and accountability
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                <Card className="p-6 bg-card border border-border rounded-xl text-center">
                  <CheckCircle2 className="h-6 w-6 text-primary mx-auto" aria-hidden="true" />
                  <h3 className="text-sm font-bold text-center mt-3">Clear Scoring Explanations</h3>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Every score is backed by transparent component breakdowns showing liquidity, volume, activity, age, and health metrics.
                  </p>
                </Card>

                <Card className="p-6 bg-card border border-border rounded-xl text-center">
                  <Clock className="h-6 w-6 text-primary mx-auto" aria-hidden="true" />
                  <h3 className="text-sm font-bold text-center mt-3">Visible Data Timestamps</h3>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    All data displays include last-updated timestamps so you know exactly when information was captured.
                  </p>
                </Card>

                <Card className="p-6 bg-card border border-border rounded-xl text-center">
                  <Lock className="h-6 w-6 text-primary mx-auto" aria-hidden="true" />
                  <h3 className="text-sm font-bold text-center mt-3">No Hidden Wallet Permissions</h3>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    SOLRAD never requests wallet connections, signatures, or any form of asset control — period.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-border bg-muted/30">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-lg font-black uppercase tracking-tight text-center mb-4">
                Explore SOLRAD Intelligence
              </h2>
              <p className="text-sm text-muted-foreground mb-8">
                Read the full scoring methodology or reach out with questions.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                  <Link href="/scoring">How Scoring Works</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-transparent">
                  <Link href="/contact">Contact</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
