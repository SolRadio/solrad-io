"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Coins, TrendingUp, Shield, Users, AlertCircle } from "lucide-react"

export function GemFinderModal() {
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
    <div className="space-y-4 text-sm">
      {/* Description */}
      <p className="text-muted-foreground leading-relaxed">
        Gem Finder Mode surfaces early-stage Solana tokens showing strong structural health before major market attention. It prioritizes:
      </p>

      {/* Priority List */}
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/30">
          <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-primary mb-1">Healthy liquidity structure</div>
            <p className="text-xs text-muted-foreground">Strong liquidity floor with sustainable depth</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/10 border border-accent/30">
          <TrendingUp className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-accent mb-1">Early momentum signals</div>
            <p className="text-xs text-muted-foreground">Identifying price movement and volume activity early</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-success/10 border border-success/30">
          <Users className="h-5 w-5 text-success shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-success mb-1">Holder quality heuristics</div>
            <p className="text-xs text-muted-foreground">Analyzing distribution patterns and holder behavior</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/30">
          <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-warning mb-1">Reduced wash trading probability</div>
            <p className="text-xs text-muted-foreground">Filtering for genuine activity and organic volume</p>
          </div>
        </div>
      </div>

      {/* Best Used For */}
      <div className="p-4 rounded-lg bg-muted/50 border border-border">
        <div className="font-semibold mb-2">Best Used For:</div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Discovering high-upside tokens before broad exposure.
        </p>
      </div>
    </div>
  )

  const footer = (
    <p className="text-xs text-muted-foreground leading-relaxed">
      SOLRAD Gem Finder is an intelligence filter — not financial advice. Always DYOR.
    </p>
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
        <Coins className="h-3.5 w-3.5 text-cyan-400" />
        <span className="hidden md:inline">Gem Finder</span>
      </Button>

      {/* Desktop: Dialog, Mobile: Sheet */}
      {isMobile ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-left uppercase font-bold flex items-center gap-2">
                <Coins className="h-5 w-5 text-cyan-400" />
                GEM FINDER MODE
              </SheetTitle>
              <SheetDescription className="sr-only">
                Learn about Gem Finder Mode and how it helps discover early-stage tokens
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4">{content}</div>
            <SheetFooter className="mt-4 pt-4 border-t border-border">
              {footer}
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="uppercase font-bold text-lg flex items-center gap-2">
                <Coins className="h-5 w-5 text-cyan-400" />
                GEM FINDER MODE
              </DialogTitle>
              <DialogDescription className="sr-only">
                Learn about Gem Finder Mode and how it helps discover early-stage tokens
              </DialogDescription>
            </DialogHeader>
            {content}
            <DialogFooter className="mt-4 pt-4 border-t border-border">
              {footer}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
