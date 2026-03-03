"use client"

import type { TokenScore } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { computeSignalScore, computeClusterScore } from "@/lib/signals"
import { featureFlags } from "@/lib/featureFlags"

interface SignalBadgesProps {
  token: TokenScore
}

export function SignalBadges({ token }: SignalBadgesProps) {
  if (!featureFlags.signalBadges) return null

  const signalScore = computeSignalScore(token)
  const clusterScore = computeClusterScore(token)

  // Don't show badges if signal score is 0
  if (signalScore === 0) return null

  return (
    <>
      <Badge variant="outline" className="text-xs bg-accent/10 border-accent/50 text-accent font-mono">
        SIGNAL {signalScore}/10
      </Badge>
      {clusterScore !== null && (
        <Badge variant="outline" className="text-xs bg-primary/10 border-primary/50 text-primary font-mono">
          CLUSTER {clusterScore}/10
        </Badge>
      )}
    </>
  )
}
