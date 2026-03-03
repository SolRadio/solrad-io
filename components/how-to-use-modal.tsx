"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { HelpCircle, TrendingUp, Trophy, Clock, AlertTriangle } from "lucide-react"

export function HowToUseModal() {
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const content = (
    <div className="space-y-5 text-sm max-h-[70vh] overflow-y-auto">
      {/* How SOLRAD Works */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-bold uppercase text-base">How SOLRAD Works</h3>
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed">
          SOLRAD analyzes real-time on-chain activity, liquidity behavior, volume patterns, wallet heuristics, and momentum to surface high-signal Solana intelligence.
        </p>
      </div>

      {/* How to Read SOLRAD */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          <h3 className="font-bold uppercase text-base">How to Read SOLRAD</h3>
        </div>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <p><span className="font-semibold text-foreground">Fresh Signals</span> → Early momentum and unusual market behavior</p>
          <p><span className="font-semibold text-foreground">Trending</span> → Tokens sustaining strong performance</p>
          <p><span className="font-semibold text-foreground">Active Trading</span> → High volume and liquidity flow</p>
          <p><span className="font-semibold text-foreground">New / Early</span> → Recently launched tokens gaining traction</p>
        </div>
      </div>

      {/* How to Use SOLRAD Intelligence */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="h-5 w-5 text-cyan-400" />
          <h3 className="font-bold uppercase text-base">How to Use SOLRAD Intelligence</h3>
        </div>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <p>Use 🤘 <span className="font-semibold text-foreground">RAD</span> to identify strong positive signals</p>
          <p>Use 💎 <span className="font-semibold text-foreground">GEM</span> to find early opportunities with healthy structure</p>
          <p>Avoid ⚠️ <span className="font-semibold text-foreground">WARNING</span> when elevated risk signals are present</p>
          <p>Use 🧪 <span className="font-semibold text-foreground">Score Debug</span> and 🧠 <span className="font-semibold text-foreground">Token Insight</span> to understand why tokens score the way they do</p>
        </div>
      </div>

      {/* Update Frequency */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-5 w-5 text-green-400" />
          <h3 className="font-bold uppercase text-base">Update Frequency</h3>
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Market intelligence updates continuously with snapshots approximately every 5–10 minutes.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="space-y-2 pt-3 border-t border-border">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-5 w-5 text-orange-400" />
          <h3 className="font-bold uppercase text-base">Disclaimer</h3>
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed">
          SOLRAD provides market intelligence only. Not financial advice. Always conduct your own research (DYOR).
        </p>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop: full button, Mobile: icon only */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs uppercase font-bold hover:bg-primary/10"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        <span className="hidden md:inline">How to Use</span>
      </Button>

      {/* Desktop: Dialog, Mobile: Sheet */}
      {isMobile ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-left uppercase font-bold">How to Use SOLRAD</SheetTitle>
            </SheetHeader>
            <div className="mt-4">{content}</div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="uppercase font-bold text-lg">How to Use SOLRAD</DialogTitle>
            </DialogHeader>
            {content}
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
