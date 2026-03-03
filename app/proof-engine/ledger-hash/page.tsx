import type { Metadata } from "next"
import LedgerHashPage from "./LedgerHashClient"

export const metadata: Metadata = {
  title: "Ledger Hash Audit | SOLRAD Proof Engine",
  description:
    "View the current and historical SHA-256 ledger hashes for the SOLRAD Alpha Ledger. Tamper-evident audit trail.",
  alternates: { canonical: "https://www.solrad.io/proof-engine/ledger-hash" },
}

export default function Page() {
  return <LedgerHashPage />
}
