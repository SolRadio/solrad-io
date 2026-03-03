"use client"

import React from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/**
 * HelpTip -- wraps any element with a tooltip.
 * When `enabled` is false the children render unwrapped (zero overhead).
 */
export function HelpTip({
  children,
  text,
  enabled = true,
  side = "top",
  align = "center",
}: {
  children: React.ReactNode
  text: string
  enabled?: boolean
  side?: "top" | "bottom" | "left" | "right"
  align?: "start" | "center" | "end"
}) {
  if (!enabled) return <>{children}</>

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          className="max-w-[260px] text-sm leading-snug"
        >
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
