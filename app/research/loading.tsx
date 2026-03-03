export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-12">
      <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-6">
        LOADING DATA...
      </p>

      {/* Header skeleton */}
      <div className="shimmer h-16 w-full rounded-lg bg-card mb-6" />

      {/* 2-column grid of report cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="shimmer h-36 w-full rounded-lg bg-card" />
        ))}
      </div>
    </div>
  )
}
