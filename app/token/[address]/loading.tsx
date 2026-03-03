export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-12">
      <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-6">
        LOADING DATA...
      </p>

      {/* Header skeleton: token name / score area */}
      <div className="shimmer h-28 w-full rounded-lg bg-card mb-6" />

      {/* Data grid rows */}
      <div className="flex flex-col gap-3">
        <div className="shimmer h-14 w-full rounded-md bg-card" />
        <div className="shimmer h-14 w-full rounded-md bg-card" />
        <div className="shimmer h-14 w-full rounded-md bg-card" />
      </div>
    </div>
  )
}
