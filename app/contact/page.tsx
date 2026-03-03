import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Mail, LayoutGrid } from "lucide-react"
import Link from "next/link"
import { ContactForm } from "./contact-form"

export const metadata: Metadata = {
  title: "Contact | SOLRAD Solana Intelligence",
  description:
    "Get in touch with SOLRAD for bug reports, feature requests, or general inquiries about the Solana token intelligence platform.",
  alternates: {
    canonical: "https://www.solrad.io/contact",
  },
  openGraph: {
    title: "Contact | SOLRAD Solana Intelligence",
    description:
      "Get in touch with SOLRAD for bug reports, feature requests, or general inquiries about Solana token intelligence.",
    url: "https://www.solrad.io/contact",
    siteName: "SOLRAD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact | SOLRAD Solana Intelligence",
    description:
      "Get in touch with SOLRAD for bug reports, feature requests, or general inquiries.",
  },
}

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">

          {/* 1. Page Header */}
          <div className="text-center mb-10">
            <Mail className="h-9 w-9 text-primary mx-auto mb-3" aria-hidden="true" />
            <h1 className="text-4xl font-black uppercase tracking-tight text-foreground">
              Contact
            </h1>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Get in touch with SOLRAD
            </p>
          </div>

          {/* 2. Email Support Card */}
          <div className="bg-card border border-border rounded-xl p-8 text-center max-w-lg mx-auto">
            <Mail className="h-7 w-7 text-primary mx-auto" aria-hidden="true" />
            <p className="text-sm font-bold uppercase tracking-wide text-center mt-3">
              Email Support
            </p>
            <p className="text-xs text-muted-foreground text-center mt-2">
              For general inquiries, bug reports, or feature requests
            </p>
            <a
              href="mailto:support@solrad.io"
              className="text-primary font-mono text-sm hover:underline mt-3 block text-center"
            >
              support@solrad.io
            </a>
          </div>

          {/* 3. Quick Links Card */}
          <div className="bg-card border border-border rounded-xl p-8 text-center max-w-lg mx-auto mt-4">
            <LayoutGrid className="h-7 w-7 text-primary mx-auto" aria-hidden="true" />
            <p className="text-sm font-bold uppercase tracking-wide text-center mt-3">
              Quick Links
            </p>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Looking for something specific?
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Link href="/faq" className="text-sm text-primary hover:underline font-mono">
                FAQ
              </Link>
              <span className="text-muted-foreground/40">·</span>
              <Link href="/scoring" className="text-sm text-primary hover:underline font-mono">
                Scoring Docs
              </Link>
              <span className="text-muted-foreground/40">·</span>
              <Link href="/research" className="text-sm text-primary hover:underline font-mono">
                Proof Engine
              </Link>
            </div>
          </div>

          {/* 4. Response Time Note */}
          <div className="bg-muted/30 border border-border rounded-lg p-4 max-w-lg mx-auto mt-4 text-center">
            <p className="text-sm">
              <span className="font-bold">Response Time:</span>{" "}
              <span className="text-xs text-muted-foreground">
                We typically respond within 24-48 hours. Please note that we cannot
                provide investment advice or token-specific recommendations.
              </span>
            </p>
          </div>

          {/* 5. Contact Form */}
          <div className="max-w-lg mx-auto mt-8">
            <ContactForm />
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}
