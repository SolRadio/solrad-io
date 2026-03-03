"use client"

import { useState, useEffect } from "react"
import { X, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { usePro } from "@/lib/use-pro"

const STORAGE_KEY = "solrad_pro_welcomed"

export function ProWelcomeBanner() {
  const { isPro } = usePro()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isPro) return
    try {
      if (localStorage.getItem(STORAGE_KEY) !== "true") {
        setVisible(true)
      }
    } catch { /* SSR safe */ }
  }, [isPro])

  if (!visible) return null

  function dismiss() {
    setVisible(false)
    try { localStorage.setItem(STORAGE_KEY, "true") } catch { /* ignore */ }
  }

  return (
    <div className="w-full bg-green-500/10 border-b border-green-500/20">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
          <span className="text-green-300 font-medium">
            {"You're on SOLRAD Pro"} —{" "}
            <Link href="/score-lab" className="underline underline-offset-2 hover:text-green-200">
              Score Lab
            </Link>{" "}
            and all Pro features are now unlocked.
          </span>
        </div>
        <button
          onClick={dismiss}
          className="text-green-400/60 hover:text-green-300 transition-colors shrink-0"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
