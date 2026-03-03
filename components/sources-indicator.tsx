import { Badge } from "@/components/ui/badge"
import type { SourceType } from "@/lib/types"

interface SourcesIndicatorProps {
  sources: Array<{ source: SourceType }>
}

const sourceColors: Record<SourceType, string> = {
  dexscreener: "bg-blue-500",
  helius: "bg-cyan-600",
  jupiter: "bg-green-500",
}

/** UI-facing labels -- maps backend source keys to truthful display names */
const sourceLabels: Record<SourceType, string> = {
  dexscreener: "DS",
  helius: "QN",
  jupiter: "JP",
}

/** UI-facing tooltip names */
const sourceDisplayNames: Record<SourceType, string> = {
  dexscreener: "Market data (DexScreener)",
  helius: "On-chain enrichment (QuickNode RPC)",
  jupiter: "Jupiter DEX Aggregator",
}

export function SourcesIndicator({ sources }: SourcesIndicatorProps) {
  return (
    <div className="flex gap-1">
      {sources.map((s, idx) => (
        <Badge
          key={idx}
          variant="outline"
          className={`${sourceColors[s.source]} text-white border-0 text-xs px-1.5 py-0`}
          title={sourceDisplayNames[s.source]}
        >
          {sourceLabels[s.source]}
        </Badge>
      ))}
    </div>
  )
}
