"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"
import type { LeadTimeProof } from "@/lib/lead-time/types"

interface RecentProofsResponse {
  proofs: LeadTimeProof[]
  isPro: boolean
  delayMinutes: number
  scannedAt: string
  source?: "live" | "fallback"
}

export function LeadTimeRecentPanel() {
  const [proofs, setProofs] = useState<LeadTimeProof[]>([])
  const [scannedAt, setScannedAt] = useState<string | null>(null)
  const [source, setSource] = useState<"live" | "fallback">("live")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchProofs = async () => {
      try {
        const response = await fetch("/api/lead-time/recent?limit=50", {
          cache: "no-store",
        })
        if (!response.ok) {
          setError(true)
          return
        }
        
        const data: RecentProofsResponse = await response.json()
        setProofs(data.proofs || [])
        setScannedAt(data.scannedAt || new Date().toISOString())
        setSource(data.source ?? "live")
        setError(false)
      } catch (err) {
        console.error("[v0] Failed to fetch recent proofs:", err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchProofs()
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchProofs, 60000)
    return () => clearInterval(interval)
  }, [])

  // Calculate metrics
  const now = Date.now()
  const oneDayAgo = now - 24 * 60 * 60 * 1000
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
  
  const proofsToday = proofs.filter(p => p.proofCreatedAt >= oneDayAgo).length
  const proofs7d = proofs.filter(p => p.proofCreatedAt >= sevenDaysAgo).length
  
  // Calculate last scan time
  const lastScanMinutes = scannedAt 
    ? Math.round((now - new Date(scannedAt).getTime()) / 60000)
    : null
  
  // Calculate latest and average lead times (7d)
  const recent7dProofs = proofs.filter(p => p.proofCreatedAt >= sevenDaysAgo)
  const latestProof = proofs[0]
  
  const latestProofTime = latestProof
    ? Math.round((now - latestProof.proofCreatedAt) / 60000)
    : null
  
  const avgLead = recent7dProofs.length > 0
    ? recent7dProofs[0]?.leadBlocks !== undefined
      ? `${Math.round(recent7dProofs.reduce((sum, p) => sum + (p.leadBlocks || 0), 0) / recent7dProofs.length)}b`
      : `${Math.round(recent7dProofs.reduce((sum, p) => sum + (p.leadSeconds || 0), 0) / recent7dProofs.length / 60)}m`
    : null

  return (
    <div className="w-full max-w-full rounded-lg border border-cyan-500/15 bg-card/95 box-border text-center overflow-hidden">
      <div className="px-3 pt-3 pb-2">
        <div className="mb-2">
          <h3 className="text-sm font-bold text-foreground flex items-center justify-center gap-1.5 leading-tight">
            <Clock className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">Lead-Time Engine</span>
          </h3>
          <p className="text-[10px] text-muted-foreground/70 mt-0.5 leading-tight truncate">
            On-chain behavior before market reaction
          </p>
        </div>

        {/* Stats Only - No List */}
        <div className="text-muted-foreground/70 text-center text-[11px] leading-tight min-w-0 leading-[0.5rem] space-y-0">
          {loading ? (
            <div className="text-xs text-muted-foreground/60 py-2 leading-tight">
              Loading...
            </div>
          ) : error ? (
            <>
              <div className="font-medium leading-tight truncate">Engine: Active</div>
              <div className="text-amber-500/70 text-[10px] leading-tight truncate">API: Status unavailable</div>
            </>
          ) : (
            <>
              <div className="font-medium text-green-400/80 leading-tight truncate">Engine: Active</div>
              <div className="font-medium leading-tight truncate">API: OK</div>
              {lastScanMinutes !== null && (
                <div className="leading-tight truncate text-lime-500">Last scan: {lastScanMinutes}m ago</div>
              )}
              <div className="leading-tight truncate">Proofs today: {proofsToday}</div>
              <div className="leading-tight truncate">Proofs (7d): {proofs7d}</div>
              {latestProofTime !== null ? (
                <div className="leading-tight truncate">Last proof: {latestProofTime}m ago</div>
              ) : (
                <div className="flex items-center justify-center gap-1 leading-tight">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500" />
                  </span>
                  <span className="truncate">Building proof...</span>
                </div>
              )}
              {avgLead ? (
                <div className="leading-tight truncate">Avg lead (7d): {avgLead}</div>
              ) : (
                <div className="leading-tight truncate text-cyan-400/60">Signals updating</div>
              )}
              {source === "fallback" && (
                <div className="leading-tight truncate text-amber-500/60">Cached snapshot</div>
              )}
            </>
          )}
        </div>

        {/* Footer Disclaimer - Always Visible */}
        <div className="pt-2 border-t border-border/20 mt-2">
          <div className="flex items-center justify-center gap-2 text-[9px] min-w-0">
            <p className="text-muted-foreground/50 text-center leading-tight truncate">
              Verifiable on-chain receipts only
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
