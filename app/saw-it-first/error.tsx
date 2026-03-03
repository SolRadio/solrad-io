"use client"

import { Navbar } from "@/components/navbar"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function SawItFirstError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center flex flex-col items-center gap-4 max-w-sm">
          <AlertTriangle className="text-destructive" size={40} />
          <h1 className="text-xl font-black uppercase tracking-tight">
            Proof data unavailable
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The proof ledger is temporarily unavailable. The data pipeline may be
            updating.
          </p>
          {error.digest && (
            <code className="text-[10px] font-mono text-muted-foreground/50 bg-muted/30 px-2 py-1 rounded">
              {error.digest}
            </code>
          )}
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={reset}
              className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-mono font-semibold uppercase tracking-wider hover:bg-primary/90 transition-colors"
            >
              TRY AGAIN
            </button>
            <Link
              href="/"
              className="px-4 py-2 border border-border rounded text-sm font-mono font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              GO HOME
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
