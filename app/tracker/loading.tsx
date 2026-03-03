export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-12">
      <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-6">
        LOADING DATA...
      </p>

      {/* Tab buttons skeleton */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="shimmer h-9 w-24 rounded-md bg-card" />
        ))}
      </div>

      {/* 3-column grid of tracker cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="shimmer h-40 w-full rounded-lg bg-card" />
        ))}
      </div>
    </div>
  )
}
