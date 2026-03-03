"use client"

import Link from "next/link"
import { Twitter } from "lucide-react"

const footerLinks = [
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/faq" },
  { label: "Learn", href: "/learn" },
  { label: "Security", href: "/security" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Scoring", href: "/scoring" },
  { label: "Score Lab", href: "/score-lab" },
  { label: "Research", href: "/research" },
  { label: "Saw It First", href: "/saw-it-first" },
  { label: "Contact", href: "/contact" },
]

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-[oklch(0.08_0_0)] text-[oklch(0.55_0_0)] shrink-0">
      <div className="flex items-center justify-center gap-x-4 px-4 py-2 text-[11px] font-mono whitespace-nowrap overflow-x-auto">
        {/* Nav links */}
        {footerLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="hover:text-foreground transition-colors"
          >
            {link.label}
          </Link>
        ))}

        {/* Separator */}
        <span className="text-muted-foreground/30">{'·'}</span>

        {/* Meta text */}
        <span>{'\u00A9 2026 SOLRAD'}</span>
        <span className="text-muted-foreground/30">{'·'}</span>
        <span>Solana Intelligence Engine</span>
        <span className="text-muted-foreground/30">{'·'}</span>
        <span>Read-only intel dashboard</span>
        <span className="text-muted-foreground/30">{'·'}</span>
        <span>Sources: QuickNode RPC + DexScreener</span>

        {/* Twitter / X icon */}
        <a
          href="https://x.com/solaboratoryrad"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors ml-1"
          aria-label="Follow SOLRAD on X"
        >
          <Twitter className="w-3 h-3" />
        </a>
      </div>
    </footer>
  )
}
