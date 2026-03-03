"use client"

import type { TokenScore } from "@/lib/types"
import { buildWhyFlagged } from "@/lib/utils/why-flagged"
import { featureFlags } from "@/lib/featureFlags"
import { useState } from "react"
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react"

interface WhyFlaggedProps {
  token: TokenScore
}

export function WhyFlagged({ token }: WhyFlaggedProps) {
  const [expanded, setExpanded] = useState(false)

  if (!featureFlags.whyFlagged) return null

  const explanation = buildWhyFlagged(token)

  if (!explanation) return null

  return (
    <div className="mt-3 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
      <button
        className="w-full flex items-center justify-between text-left"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setExpanded(!expanded)
        }}
      >
        <span className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase">
          <Sparkles className="h-3 w-3" />
          Why SOLRAD Flagged This
        </span>
        {expanded ? <ChevronUp className="h-3 w-3 text-cyan-400" /> : <ChevronDown className="h-3 w-3 text-cyan-400" />}
      </button>
      {expanded && <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{explanation}</p>}
    </div>
  )
}
