"use client"

import Link from "next/link"
import { Twitter } from "lucide-react"

const navLinks = [
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/faq" },
  { label: "Learn", href: "/learn" },
  { label: "Scoring", href: "/scoring" },
  { label: "Security", href: "/security" },
  { label: "Research", href: "/research" },
  { label: "Score Lab", href: "/score-lab" },
  { label: "Saw It First", href: "/saw-it-first" },
  { label: "Contact", href: "/contact" },
]

const legalLinks = [
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "Whitepaper", href: "/whitepaper" },
  { label: "Proof Protocol", href: "/proof-protocol" },
]

export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        {/* Nav links row */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://x.com/solaboratoryrad"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Follow SOLRAD on X"
          >
            <Twitter className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Bottom row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground/60">
            {"\u00A9 2026 SOLRAD"}
          </span>

          <div className="flex flex-wrap items-center gap-6">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <span className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground/60">
            BUILT ON SOLANA
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: "#9945FF" }}
            />
          </span>
        </div>
      </div>
    </footer>
  )
}
