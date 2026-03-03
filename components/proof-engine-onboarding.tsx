"use client"

import { useState, useEffect } from "react"
import { X, FlaskConical, Shield, Timer, Bell, BookOpen } from "lucide-react"

const STORAGE_KEY = "solrad_proof_welcomed"

export function ProofEngineOnboarding() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "true") return
      setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  function dismiss() {
    setVisible(false)
    try {
      localStorage.setItem(STORAGE_KEY, "true")
    } catch {
      // silently fail
    }
  }

  if (!visible) return null

  return (
    <div className="relative mb-4 rounded-lg border border-primary/20 bg-primary/5 px-3 py-3 md:px-4 md:py-3.5">
      <button
        onClick={dismiss}
        className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/30 transition-colors"
        aria-label="Dismiss guide"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-2 mb-2 pr-6">
        <FlaskConical className="h-4 w-4 text-primary shrink-0" />
        <h3 className="text-[13px] font-mono font-bold text-foreground">
          Welcome to the Proof Engine
        </h3>
      </div>

      <p className="text-[11px] font-mono text-muted-foreground/80 mb-2.5 leading-relaxed max-w-2xl">
        SOLRAD records every signal and observation on an append-only ledger you can independently verify. No cherry-picking, no deletions -- full transparency.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {([
          { icon: Shield, label: "Alpha Ledger", desc: "Signal outcomes" },
          { icon: Timer, label: "Lead-Time", desc: "On-chain proofs" },
          { icon: Bell, label: "Alerts", desc: "Live notifications" },
          { icon: BookOpen, label: "Methodology", desc: "How we score" },
        ] as const).map(({ icon: Icon, label, desc }) => (
          <div key={label} className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/70 bg-muted/20 rounded-md px-2 py-1.5">
            <Icon className="h-3 w-3 text-primary/70 shrink-0" />
            <div className="min-w-0">
              <div className="font-semibold text-foreground/80 truncate">{label}</div>
              <div className="truncate">{desc}</div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={dismiss}
        className="mt-2.5 text-[10px] font-mono font-semibold text-primary hover:text-primary/80 transition-colors"
      >
        Got it, dismiss
      </button>
    </div>
  )
}
