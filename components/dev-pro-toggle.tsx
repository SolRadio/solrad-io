"use client"

import { useEffect, useState } from "react"
import { usePro } from "@/lib/use-pro"

export function DevProToggle() {
  if (process.env.NODE_ENV !== 'development') return null
  const { isPro, enablePro, disablePro } = usePro()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(window.location.search.includes("dev=1"))
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-border/60 bg-card/95 backdrop-blur-sm shadow-lg p-4 space-y-2 max-w-[220px]">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        Dev Tools
      </p>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          PRO Status:{" "}
          <span className={isPro ? "text-green-500 font-semibold" : "text-red-400 font-semibold"}>
            {isPro ? "ON" : "OFF"}
          </span>
        </span>
        <button
          onClick={isPro ? disablePro : enablePro}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
            isPro
              ? "bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30"
              : "bg-green-500/15 text-green-500 hover:bg-green-500/25 border border-green-500/30"
          }`}
        >
          {isPro ? "Disable PRO" : "Enable PRO"}
        </button>
      </div>
    </div>
  )
}
