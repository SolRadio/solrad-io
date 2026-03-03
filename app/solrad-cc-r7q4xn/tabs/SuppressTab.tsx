"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ShieldAlert, Plus, Trash2, RefreshCw, AlertTriangle, Check } from "lucide-react"

interface TabProps {
  adminHeaders: Record<string, string>
  password: string
}

interface SuppressedEntry {
  mint: string
  reason: string
  addedAt: string
}

export function SuppressTab({ password }: TabProps) {
  const [entries, setEntries] = useState<SuppressedEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mintInput, setMintInput] = useState("")
  const [reasonInput, setReasonInput] = useState("")
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const headers = { "x-ops-password": password }

  const fetchList = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch("/api/admin/suppress", { headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json(); setEntries(data.entries ?? [])
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to load") }
    finally { setLoading(false) }
  }, [password]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchList() }, [fetchList])

  const handleAdd = async () => {
    const mint = mintInput.trim(); const reason = reasonInput.trim()
    if (!mint || !reason) return
    setAdding(true); setFeedback(null)
    try {
      const res = await fetch("/api/admin/suppress", { method: "POST", headers: { "Content-Type": "application/json", "x-ops-password": password }, body: JSON.stringify({ mint, reason }) })
      const data = await res.json(); if (!data.ok) throw new Error(data.error ?? "Failed")
      setFeedback(`Added: ${mint.slice(0, 12)}...`); setMintInput(""); setReasonInput(""); await fetchList()
    } catch (e: unknown) { setFeedback(`Error: ${e instanceof Error ? e.message : "Unknown"}`) }
    finally { setAdding(false) }
  }

  const handleRemove = async (mint: string) => {
    setRemoving(mint); setFeedback(null)
    try {
      const res = await fetch("/api/admin/suppress", { method: "DELETE", headers: { "Content-Type": "application/json", "x-ops-password": password }, body: JSON.stringify({ mint }) })
      const data = await res.json(); if (!data.ok) throw new Error(data.error ?? "Failed")
      setFeedback(`Removed: ${mint.slice(0, 12)}...`); await fetchList()
    } catch (e: unknown) { setFeedback(`Error: ${e instanceof Error ? e.message : "Unknown"}`) }
    finally { setRemoving(null) }
  }

  const fmtTime = (iso: string) => { try { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) } catch { return iso } }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-mono font-semibold flex items-center gap-2 text-zinc-200">
          <ShieldAlert className="h-5 w-5 text-red-400" /> {"◈"} Token Suppression
        </h2>
        <Button variant="outline" size="sm" onClick={fetchList} disabled={loading} className="gap-1.5 text-xs border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-mono text-zinc-500">Suppress Token</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Mint address (full Solana address)" value={mintInput} onChange={(e) => setMintInput(e.target.value)} className="bg-zinc-950 border-zinc-800 text-sm font-mono text-zinc-300 placeholder:text-zinc-700" />
          <Input placeholder="Reason (e.g. rugged, scam, unsafe)" value={reasonInput} onChange={(e) => setReasonInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} className="bg-zinc-950 border-zinc-800 text-sm font-mono text-zinc-300 placeholder:text-zinc-700" />
          <div className="flex items-center gap-3">
            <Button onClick={handleAdd} disabled={adding || !mintInput.trim() || !reasonInput.trim()} size="sm" className="gap-1.5 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20">
              <Plus className="h-3.5 w-3.5" /> {adding ? "Adding..." : "Suppress"}
            </Button>
            {feedback && <p className="text-xs text-zinc-500 font-mono">{feedback}</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-mono text-zinc-500">Suppressed Tokens</CardTitle>
            <Badge variant="outline" className="text-[10px] font-mono border-zinc-700 text-zinc-500">{entries.length} total</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-xs text-zinc-600 py-6 text-center font-mono">Loading...</p> :
           error ? <div className="flex items-center justify-center gap-2 py-6 text-red-400"><AlertTriangle className="h-4 w-4" /><p className="text-xs font-mono">{error}</p></div> :
           entries.length === 0 ? <p className="text-xs text-zinc-600 py-6 text-center font-mono">No suppressed tokens</p> :
           <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
             {entries.map((entry) => (
               <div key={entry.mint} className="flex items-center gap-3 p-2.5 border border-zinc-800 bg-zinc-950 group">
                 <div className="flex-1 min-w-0">
                   <p className="text-xs font-mono text-zinc-300 truncate">{entry.mint}</p>
                   <div className="flex items-center gap-2 mt-0.5">
                     <Badge className="text-[9px] px-1.5 py-0 bg-red-500/15 text-red-400 border-red-500/40">{entry.reason}</Badge>
                     <span className="text-[10px] text-zinc-600 font-mono">{fmtTime(entry.addedAt)}</span>
                   </div>
                 </div>
                 <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-50 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400" onClick={() => handleRemove(entry.mint)} disabled={removing === entry.mint}>
                   {removing === entry.mint ? <Check className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                 </Button>
               </div>
             ))}
           </div>}
        </CardContent>
      </Card>
    </div>
  )
}
