"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Shield, Gem, Info, Activity } from "lucide-react"

export function BadgeLegendModal() {
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
    <div className="space-y-3 text-sm max-h-[70vh] overflow-y-auto">
      {/* RAD Badge */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/30">
        <div className="shrink-0 mt-0.5">
          <span className="text-base">🤘</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold uppercase text-primary mb-1">RAD — High Signal Detection</div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Strong positive momentum driven by elevated volume, liquidity inflows, and quality holder behavior. Often indicates early smart-money activity.
          </p>
        </div>
      </div>

      {/* GEM Badge */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-success/10 border border-success/30">
        <div className="shrink-0 mt-0.5">
          <span className="text-base">💎</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold uppercase text-success mb-1">GEM — Early Opportunity</div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            New or early-stage token that passes SOLRAD safety checks, liquidity health filters, and structural integrity heuristics.
          </p>
        </div>
      </div>

      {/* WARNING Badge */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
        <div className="shrink-0 mt-0.5">
          <span className="text-base">⚠️</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold uppercase text-destructive mb-1">WARNING — Elevated Risk Signals</div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Multiple on-chain and market risk indicators detected, including liquidity instability, wallet clustering, or anomalous volume behavior. Indicates heightened risk conditions — caution advised.
          </p>
        </div>
      </div>

      {/* HELD Badges */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
        <div className="shrink-0 mt-0.5">
          <span className="text-base">🕛</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold uppercase mb-1">HELD 1H / 6H / 24H — Sustained Momentum</div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Token maintained a qualifying SOLRAD score across consecutive snapshots, signaling persistent market strength.
          </p>
        </div>
      </div>

      <div className="pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Badges are generated using real-time on-chain heuristics and SOLRAD intelligence scoring — never paid promotions.
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
        <Info className="h-3.5 w-3.5" />
        <span className="hidden md:inline">Badges</span>
      </Button>

      {/* Desktop: Dialog, Mobile: Sheet */}
      {isMobile ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-left uppercase font-bold">Badge Legend</SheetTitle>
            </SheetHeader>
            <div className="mt-4">{content}</div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="uppercase font-bold text-lg">Badge Legend</DialogTitle>
            </DialogHeader>
            {content}
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
