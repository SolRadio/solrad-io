import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Ledger Hash Audit | Proof Engine | SOLRAD",
  description: "Verify the SHA-256 hash of the SOLRAD Alpha Ledger. Cryptographic proof of immutability.",
  alternates: { canonical: "/proof-engine/ledger-hash" },
}

export default function LedgerHashLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  )
}
