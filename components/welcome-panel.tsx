"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { X, Check } from "lucide-react"
import Link from "next/link"

const DISMISS_KEY = "solrad_welcomed"
const AUTO_DISMISS_MS = 12000

export function WelcomePanel() {
  const [visible, setVisible] = useState(false)
  const [slideOut, setSlideOut] = useState(false)
  const [dismissed, setDismissed] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Check localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return
    const alreadyWelcomed = localStorage.getItem(DISMISS_KEY)
    if (!alreadyWelcomed) {
      setDismissed(false)
      // Small delay to allow mount, then slide up
      requestAnimationFrame(() => {
        setVisible(true)
      })
    }
  }, [])

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setSlideOut(true)
    // Wait for slide-down animation to finish before removing from DOM
    setTimeout(() => {
      setDismissed(true)
      localStorage.setItem(DISMISS_KEY, "true")
    }, 400)
  }, [])

  // Auto-dismiss after 12 seconds
  useEffect(() => {
    if (dismissed) return
    timerRef.current = setTimeout(dismiss, AUTO_DISMISS_MS)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [dismissed, dismiss])

  if (dismissed) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        transform: visible && !slideOut ? "translateY(0)" : "translateY(100%)",
        transition: "transform 400ms ease-out",
      }}
    >
      <div
        className="border-t-2 border-primary/60 shadow-2xl relative"
        style={{
          background: "linear-gradient(to right, oklch(0.10 0 0), oklch(0.12 0.04 310), oklch(0.10 0 0))",
          boxShadow: "0 -4px 24px rgba(139, 92, 246, 0.15)",
        }}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-4 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-full p-1 transition-colors cursor-pointer"
          aria-label="Dismiss welcome panel"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center px-8 py-5 gap-4 sm:gap-8 max-w-7xl mx-auto">
          {/* Left side: welcome message */}
          <div className="flex-1 min-w-0 pr-6">
            <p className="flex items-center gap-2 text-xs text-primary uppercase tracking-widest font-mono mb-1.5">
              <span className="breathe-dot inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
              WELCOME TO SOLRAD
            </p>
            <p className="text-[13px] text-foreground leading-relaxed max-w-lg">
              {"Every token has a "}
              <span className="text-primary font-mono">SOLRAD Score (0-100)</span>
              {" based on liquidity, volume, age, and risk. Higher = stronger fundamentals. Click any token for the full breakdown."}
            </p>
            <div className="flex flex-row flex-wrap gap-2 mt-2.5">
              <span className="inline-flex items-center gap-1 bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5 text-[10px] text-primary font-mono">
                <Check className="h-2.5 w-2.5" />
                No wallet required
              </span>
              <span className="inline-flex items-center gap-1 bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5 text-[10px] text-primary font-mono">
                <Check className="h-2.5 w-2.5" />
                Read-only
              </span>
              <span className="inline-flex items-center gap-1 bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5 text-[10px] text-primary font-mono">
                <Check className="h-2.5 w-2.5" />
                Published methodology
              </span>
            </div>
          </div>

          {/* Right side: action buttons */}
          <div className="flex-shrink-0 flex flex-col gap-2 items-start sm:items-end">
            <Link
              href="/scoring"
              onClick={dismiss}
              className="text-xs text-primary underline-offset-2 hover:underline transition-colors font-mono uppercase tracking-wide"
            >
              {"HOW SCORING WORKS \u2192"}
            </Link>
            <button
              onClick={dismiss}
              className="text-primary-foreground text-xs px-4 py-2 rounded font-mono font-bold uppercase tracking-wide hover:opacity-90 transition-opacity cursor-pointer"
              style={{
                background: "oklch(0.65 0.25 310)",
                boxShadow: "0 0 12px rgba(139, 92, 246, 0.4)",
              }}
            >
              {"GOT IT \u2192"}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary/20">
          <div
            className="h-full bg-primary"
            style={{
              animation: `welcome-countdown ${AUTO_DISMISS_MS}ms linear forwards`,
              boxShadow: "0 0 6px rgba(139, 92, 246, 0.8)",
            }}
          />
        </div>

        <style>{`
          @keyframes welcome-countdown {
            from {
              width: 100%;
            }
            to {
              width: 0%;
            }
          }
        `}</style>
      </div>
    </div>
  )
}
