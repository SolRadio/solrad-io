"use client"

import { getConviction } from "@/lib/conviction"

export function ConvictionBadge({
  score,
  riskLevel,
  volume24h,
  liquidity,
  holderCount,
}: {
  score: number
  riskLevel?: string
  volume24h?: number
  liquidity?: number
  holderCount?: number
}) {
  const result = getConviction({
    score,
    riskLevel,
    volume24h,
    liquidity,
    holderCount,
  })

  const colorMap = {
    green: "text-green-400 border-green-500/40 bg-green-500/10",
    yellow: "text-yellow-400 border-yellow-500/40 bg-yellow-500/10",
    orange: "text-orange-400 border-orange-500/40 bg-orange-500/10",
    red: "text-red-400 border-red-500/40 bg-red-500/10",
  }

  return (
    <div className={`border px-2 py-1 rounded-md text-xs ${colorMap[result.color]}`}>
      <div className="font-medium">{result.label}</div>
      <div className="text-[10px] opacity-70">{result.summary}</div>
    </div>
  )
}
