"use client"

import Link from "next/link"
import { AlertTriangle, RotateCcw, Home } from "lucide-react"


export default function BrowseError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
        <AlertTriangle className="h-12 w-12 text-destructive mb-6" />

        <h1 className="text-2xl font-bold font-mono uppercase tracking-widest text-foreground mb-3">
          Something went wrong
        </h1>

        <p className="text-sm text-muted-foreground mb-8 text-center max-w-md text-balance">
          {"We couldn't load the token pool right now. Please try again."}
        </p>

        {error.digest && (
          <code className="mb-8 rounded-md border border-border bg-secondary px-3 py-1.5 text-[11px] font-mono text-muted-foreground">
            Digest: {error.digest}
          </code>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            TRY AGAIN
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Home className="h-3.5 w-3.5" />
            GO HOME
          </Link>
        </div>

        <p className="mt-16 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40">
          SOLRAD Terminal
        </p>
      </div>
  )
}
