export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-5 w-5 border-2 border-green-500/40 border-t-green-500 rounded-full animate-spin" />
        <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
          Loading Proof Protocol
        </span>
      </div>
    </div>
  )
}
