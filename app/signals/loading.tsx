export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-12">
      <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-6">
        LOADING DATA...
      </p>

      {/* Header skeleton */}
      <div className="shimmer h-16 w-full rounded-lg bg-card mb-6" />

      {/* Signal outcome table rows */}
      <div className="flex flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="shimmer h-11 w-full rounded-md bg-card" />
        ))}
      </div>
    </div>
  )
}
