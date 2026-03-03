import type { Metadata } from "next"
import { Mail, LayoutGrid } from "lucide-react"
import Link from "next/link"
import { ContactForm } from "./contact-form"
import { SectionHeading } from "@/components/ui/section-heading"

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
    <main className="py-12">
      <div className="mx-auto max-w-3xl px-6">

        <SectionHeading as="h1" sub="Get in touch with SOLRAD">
          Contact
        </SectionHeading>

        {/* Email Support Card */}
        <div className="border border-border p-8 max-w-lg mx-auto">
          <Mail className="h-7 w-7 text-primary" aria-hidden="true" />
          <p className="mt-3 font-mono text-sm font-bold uppercase tracking-[0.15em]">
            Email Support
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            For general inquiries, bug reports, or feature requests
          </p>
          <a
            href="mailto:support@solrad.io"
            className="mt-3 block font-mono text-sm text-primary hover:underline"
          >
            support@solrad.io
          </a>
        </div>

        {/* Quick Links Card */}
        <div className="mt-4 border border-border p-8 max-w-lg mx-auto">
          <LayoutGrid className="h-7 w-7 text-primary" aria-hidden="true" />
          <p className="mt-3 font-mono text-sm font-bold uppercase tracking-[0.15em]">
            Quick Links
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Looking for something specific?
          </p>
          <div className="mt-4 flex items-center gap-2">
            <Link href="/faq" className="text-sm font-mono text-primary hover:underline">FAQ</Link>
            <span className="text-muted-foreground/40">{"\u00B7"}</span>
            <Link href="/scoring" className="text-sm font-mono text-primary hover:underline">Scoring Docs</Link>
            <span className="text-muted-foreground/40">{"\u00B7"}</span>
            <Link href="/research" className="text-sm font-mono text-primary hover:underline">Proof Engine</Link>
          </div>
        </div>

        {/* Response Time Note */}
        <div className="mt-4 border border-border p-4 max-w-lg mx-auto">
          <p className="text-sm">
            <span className="font-bold">Response Time:</span>{" "}
            <span className="text-xs text-muted-foreground">
              We typically respond within 24-48 hours. Please note that we cannot
              provide investment advice or token-specific recommendations.
            </span>
          </p>
        </div>

        {/* Contact Form */}
        <div className="mx-auto mt-8 max-w-lg">
          <ContactForm />
        </div>

      </div>
    </main>
  )
}
