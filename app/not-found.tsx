import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Terminal-style error code */}
      <div className="flex items-baseline gap-3 mb-6">
        <span className="text-7xl font-mono font-bold tracking-tighter text-foreground">
          404
        </span>
        <span className="h-12 w-px bg-border" aria-hidden="true" />
        <span className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
          Not Found
        </span>
      </div>

      <p className="text-sm text-muted-foreground mb-8 text-center max-w-md text-balance">
        The page you requested does not exist or has been moved.
      </p>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Back to Dashboard
        </Link>
        <Link
          href="/browse"
          className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Browse Tokens
        </Link>
      </div>

      {/* Subtle brand footer */}
      <p className="mt-16 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40">
        SOLRAD Terminal
      </p>
    </div>
  )
}
