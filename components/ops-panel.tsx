"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, LogOut, Shield, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface OpsPanelProps {
  onClose: () => void
  onLogout: () => void
  onTokenAdded?: () => void
}

export function OpsPanel({ onClose, onLogout, onTokenAdded }: OpsPanelProps) {
  const [mint, setMint] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [isFlushing, setIsFlushing] = useState(false)
  const [statusText, setStatusText] = useState<string | null>(null)
  const [statusType, setStatusType] = useState<"idle" | "loading" | "success" | "error">("idle")
  const { toast } = useToast()

  const handleFlushCache = async () => {
    setIsFlushing(true)
    
    try {
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || ""
      
      const response = await fetch("/api/ops/nuclear-clear", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-password": adminPassword
        },
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: "Nuclear clear failed",
          description: data.error || "Failed to clear all caches",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Nuclear clear complete",
        description: `Destroyed all cache + blob storage. Rebuilt with ${data.ingestion?.tokensProcessed || 0} fresh tokens.`,
      })
      
      // Trigger a refresh after a short delay to load completely fresh data
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      toast({
        title: "Nuclear clear failed",
        description: error instanceof Error ? error.message : "Network error",
        variant: "destructive",
      })
    } finally {
      setIsFlushing(false)
    }
  }

  const handleAddMint = async () => {
    if (!mint.trim()) {
      toast({
        title: "Error",
        description: "Please enter a mint address",
        variant: "destructive",
      })
      setStatusType("error")
      setStatusText("Please enter a valid mint address")
      return
    }

    setIsAdding(true)
    setStatusType("loading")
    setStatusText("Adding token… fetching DexScreener + scoring…")

    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 12000) // 12 second timeout

    try {
      const response = await fetch("/api/ops/add-mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mint: mint.trim() }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const data = await response.json()

      if (!response.ok || !data.ok) {
        // Show the server error message
        const errorMsg = data.error || "Failed to add token"
        toast({
          title: "Add failed",
          description: errorMsg,
          variant: "destructive",
        })
        setStatusType("error")
        setStatusText(errorMsg)
        return
      }

      // Success - clear input and show success message
      const tokenSymbol = data.token?.symbol || data.symbol || "Token"
      const tokenName = data.token?.name || data.name
      
      toast({
        title: "✅ Token added",
        description: tokenName ? `${tokenSymbol} (${tokenName})` : tokenSymbol,
      })
      
      setStatusType("success")
      setStatusText(`✅ Added successfully`)
      
      // Clear input on success
      setMint("")
      onTokenAdded?.()

      // Reset status after delay
      setTimeout(() => {
        setStatusType("idle")
        setStatusText(null)
      }, 3000)
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === "AbortError") {
        // Timeout error
        toast({
          title: "Add failed",
          description: "Request timed out after 12 seconds. Try again.",
          variant: "destructive",
        })
        setStatusType("error")
        setStatusText("Timed out. Try again.")
      } else {
        // Network or other error
        toast({
          title: "Add failed",
          description: error instanceof Error ? error.message : "Network error",
          variant: "destructive",
        })
        setStatusType("error")
        setStatusText("Failed to add token. Check mint address and try again.")
      }
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Card className="p-4 sm:p-6 space-y-4 sm:space-y-6 border-primary/30 bg-card/95 backdrop-blur w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wide">OPS PANEL</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Add tokens manually to SOLRAD</p>
          </div>
        </div>
        <Badge variant="outline" className="uppercase font-semibold text-xs shrink-0">
          ADMIN
        </Badge>
      </div>

      {/* Add Mint Form */}
      <div className="space-y-4 w-full min-w-0">
        <div className="space-y-2">
          <Label htmlFor="mint" className="uppercase font-semibold text-xs sm:text-sm">
            SOLANA MINT ADDRESS
          </Label>
          <Input
            id="mint"
            type="text"
            placeholder="Enter mint..."
            value={mint}
            onChange={(e) => setMint(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddMint()
              }
            }}
            disabled={isAdding}
            className="font-mono text-sm w-full"
          />
          <p className="text-xs text-muted-foreground">
            Token will be fetched from DexScreener and scored automatically
          </p>
        </div>

        <div className="space-y-2">
          <Button
            onClick={handleAddMint}
            disabled={isAdding || !mint.trim()}
            className="w-full uppercase font-bold"
          >
            {isAdding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ADDING...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                ADD TO RADAR
              </>
            )}
          </Button>

          {/* Status text for mobile visibility */}
          {statusText && (
            <p
              className={`text-xs text-center ${
                statusType === "loading"
                  ? "text-muted-foreground"
                  : statusType === "success"
                    ? "text-green-500"
                    : statusType === "error"
                      ? "text-red-500"
                      : "text-muted-foreground"
              }`}
            >
              {statusText}
            </p>
          )}
        </div>
      </div>

      {/* Admin Tools Section - PART 2: Added QA Panel */}
      <div className="pt-4 border-t space-y-3">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase text-muted-foreground">ADMIN TOOLS</h3>
          <Button
            variant="outline"
            onClick={() => window.open("/admin/qa", "_blank")}
            className="w-full uppercase font-bold bg-transparent"
          >
            OPEN QA PANEL
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open("/admin/alerts", "_blank")}
            className="w-full uppercase font-bold bg-transparent"
          >
            OPEN ALERTS CONSOLE
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open("/admin/intel", "_blank")}
            className="w-full uppercase font-bold bg-transparent"
          >
            OPEN INTEL HUB
          </Button>
          <Button
            variant="outline"
            onClick={handleFlushCache}
            disabled={isFlushing}
            className="w-full uppercase font-bold bg-transparent border-red-500/50 text-red-500 hover:bg-red-500/10"
          >
            {isFlushing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                CLEARING...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                NUCLEAR CLEAR & REBUILD
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 border-t space-y-2">
        <Button variant="outline" onClick={onLogout} className="w-full uppercase font-bold bg-transparent">
          <LogOut className="mr-2 h-4 w-4" />
          LOGOUT
        </Button>
      </div>
    </Card>
  )
}
