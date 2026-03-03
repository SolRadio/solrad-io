"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ChevronDown, X, Gem, BarChart3, Droplets, Star, PanelRight, Clock, Zap, SlidersHorizontal } from "lucide-react"

const LS_KEY = "solrad_howto_open"

const STEPS = [
  {
    icon: Gem,
    color: "text-cyan-400",
    title: "Start with GEM Finder",
    desc: "Toggle GEM Finder to filter tokens tagged with the diamond badge -- highest signal quality.",
  },
  {
    icon: BarChart3,
    color: "text-accent",
    title: "Read Score + Signal State",
    desc: "SOLRAD Score (0-100) combines volume, liquidity, holder, and momentum signals. Higher = stronger.",
  },
  {
    icon: Droplets,
    color: "text-green-400",
    title: "Use VOL/LIQ to avoid traps",
    desc: "Low liquidity with high volume often signals wash trading. Look for V:L ratios under 10:1.",
  },
  {
    icon: Star,
    color: "text-yellow-500",
    title: "Build your Watchlist",
    desc: "Star tokens to track them. Watchlist persists across sessions for monitoring over time.",
  },
  {
    icon: PanelRight,
    color: "text-primary",
    title: "Open drawer for proof",
    desc: "Click any token row to see full breakdown: score debug, history, safety snapshot, and lead-time proofs.",
  },
  {
    icon: Clock,
    color: "text-cyan-500",
    title: "Lead-Time Engine",
    desc: "Shows how many blocks/seconds SOLRAD detected a token before broader market attention.",
  },
  {
    icon: Zap,
    color: "text-orange-400",
    title: "Early token tips",
    desc: "New tokens under 2h old with rising liquidity and low holder concentration are worth watching.",
  },
  {
    icon: SlidersHorizontal,
    color: "text-violet-400",
    title: "Use Filters + Toggles",
    desc: "Stack toggles like GEM Finder + Lead-Time to narrow to high-quality setups fast. If results go empty, hit Reset Filters and widen back out.",
  },
]

export function HowToPanel() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Restore state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY)
      if (stored === "true") setOpen(true)
    } catch {}
  }, [])

  // Persist state changes
  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev
      try { localStorage.setItem(LS_KEY, String(next)) } catch {}
      return next
    })
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    try { localStorage.setItem(LS_KEY, "false") } catch {}
  }, [])

  // Close on click outside
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        close()
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open, close])

  return (
    <div ref={panelRef} className="overflow-hidden rounded-lg">
      {/* Trigger */}
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left cursor-pointer rounded-lg hover:bg-white/5 transition-colors group bg-card"
      >
        <ChevronDown
          className={`h-3 w-3 text-muted-foreground/50 shrink-0 transition-transform duration-200 ${
            open ? "rotate-0" : "-rotate-90"
          }`}
        />
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest group-hover:text-foreground transition-colors">
          How To Use SOLRAD
        </span>
        {!open && (
          <span className="text-[9px] font-mono text-muted-foreground/40 ml-auto">
            click to expand
          </span>
        )}
      </button>

      {/* Expanded panel */}
      {open && (
        <div className="bg-muted/30 border-b border-border px-3 pb-4 pt-2 relative">
          {/* Close button */}
          <button
            type="button"
            onClick={close}
            className="absolute top-2 right-3 p-1 rounded hover:bg-white/10 transition-colors"
            aria-label="Close panel"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-foreground" />
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 pr-6">
            {STEPS.map((step) => {
              const Icon = step.icon
              return (
                <div
                  key={step.title}
                  className="flex items-start gap-2.5 bg-card/50 rounded-lg p-3"
                >
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 text-primary`} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase text-foreground leading-tight">
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                      {step.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
