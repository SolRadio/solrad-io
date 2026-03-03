import type { TokenScore } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Check, AlertTriangle, Moon } from "lucide-react"
import { computeActivityRatio } from "@/lib/scoring-v2"

interface ActivityHealthProps {
  token: TokenScore
}

export function ActivityHealth({ token }: ActivityHealthProps) {
  const ratio = computeActivityRatio(token)
  const volume = Number(token.volume24h) || 0
  const liquidity = Number(token.liquidity) || 0

  // Determine category
  let category: "HEALTHY" | "EXTREME" | "THIN" = "HEALTHY"
  let Icon = Check
  let colorClass = "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/50"

  if (volume < 25000 || liquidity < 50000) {
    category = "THIN"
    Icon = Moon
    colorClass = "bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/50"
  } else if (ratio !== null && (ratio < 0.2 || ratio > 5)) {
    category = "EXTREME"
    Icon = AlertTriangle
    colorClass = "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/50"
  } else if (ratio !== null && ratio >= 0.6 && ratio <= 2.2) {
    category = "HEALTHY"
    Icon = Check
    colorClass = "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/50"
  }

  return (
    <Badge variant="outline" className={`text-xs uppercase font-semibold ${colorClass}`}>
      <Icon className="h-3 w-3 mr-1" />
      {category}
    </Badge>
  )
}
