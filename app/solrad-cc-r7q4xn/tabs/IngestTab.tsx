"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Database, Clock, AlertCircle, PlayCircle } from "lucide-react"

interface TabProps {
  adminHeaders: Record<string, string>
  password: string
}

interface IngestStats {
  totalMints: number
  resolved: number
  unresolved: number
  lastRunTime?: number
  lastError?: string
}

export function IngestTab({ password }: TabProps) {
  const [stats, setStats] = useState<IngestStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const headers = { "x-admin-password": password, "x-ops-password": password }

  useEffect(() => { loadStats() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadStats = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/ingest/stats", { headers })
      if (res.ok) setStats(await res.json())
      else setMessage("Failed to load stats")
    } catch { setMessage("Error loading stats") }
    finally { setLoading(false) }
  }

  const handleRunIngest = async () => {
    setLoading(true)
    setMessage("Running ingestion...")
    try {
      const res = await fetch("/api/ingest/new-mints?limit=100&minutesBack=60", { method: "POST", headers })
      const data = await res.json()
      if (res.ok) {
        setMessage(`Ingestion complete: ${data.discovered} discovered, ${data.resolved} resolved${data.rateLimited ? " (rate limited)" : ""}`)
        loadStats()
      } else setMessage(`Ingestion failed: ${data.error || "Unknown error"}`)
    } catch { setMessage("Error running ingestion") }
    finally { setLoading(false) }
  }

  const handleRetryResolution = async () => {
    setLoading(true)
    setMessage("Retrying pair resolution...")
    try {
      const res = await fetch("/api/admin/ingest/retry-resolution", { method: "POST", headers })
      const data = await res.json()
      if (res.ok) { setMessage(`Resolution retry complete: ${data.resolved} newly resolved${data.rateLimited ? " (rate limited)" : ""}`); loadStats() }
      else setMessage(`Resolution failed: ${data.error || "Unknown error"}`)
    } catch { setMessage("Error retrying resolution") }
    finally { setLoading(false) }
  }

  const handleRebuildIndex = async () => {
    setLoading(true)
    setMessage("Rebuilding token index...")
    try {
      const res = await fetch("/api/intel/rebuild", { method: "POST", headers })
      if (res.ok) setMessage("Token index rebuilt successfully")
      else setMessage("Index rebuild failed")
    } catch { setMessage("Error rebuilding index") }
    finally { setLoading(false) }
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-mono font-bold text-zinc-200">{"◈"} Ingestion Dashboard</h2>
        <p className="text-xs font-mono text-zinc-600">Monitor and control SOLRAD token discovery</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-mono text-zinc-400">Total Discovered</CardTitle>
            <Database className="h-4 w-4 text-zinc-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-zinc-200">{stats?.totalMints ?? "-"}</div>
            <p className="text-xs text-zinc-600 font-mono">Unique mints in KV</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-mono text-zinc-400">Resolved Pairs</CardTitle>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30 font-mono">
              {stats ? Math.round((stats.resolved / stats.totalMints) * 100) : 0}%
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-zinc-200">{stats?.resolved ?? "-"}</div>
            <p className="text-xs text-zinc-600 font-mono">Have DEX pair data</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-mono text-zinc-400">Unresolved</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-zinc-200">{stats?.unresolved ?? "-"}</div>
            <p className="text-xs text-zinc-600 font-mono">Need pair resolution</p>
          </CardContent>
        </Card>
      </div>

      {stats?.lastRunTime && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-sm font-mono text-zinc-400">Last Ingestion Run</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-zinc-600" />
            <span className="text-sm font-mono text-zinc-300">{new Date(stats.lastRunTime).toLocaleString()}</span>
            <span className="text-xs text-zinc-600 font-mono">({Math.round((Date.now() - stats.lastRunTime) / 60000)} minutes ago)</span>
          </CardContent>
        </Card>
      )}

      {stats?.lastError && (
        <Card className="border-red-500/30 bg-zinc-900">
          <CardHeader><CardTitle className="text-sm text-red-400 font-mono">Last Error</CardTitle></CardHeader>
          <CardContent><p className="text-sm font-mono text-red-400">{stats.lastError}</p></CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="font-mono text-zinc-300">{"◈"} Manual Controls</CardTitle>
          <CardDescription className="font-mono text-zinc-600">Trigger operations manually</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button onClick={handleRunIngest} disabled={loading} className="w-full justify-start bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700">
            <PlayCircle className="mr-2 h-4 w-4" /> Run Ingest Now (last 60 min, limit 100)
          </Button>
          <Button onClick={handleRetryResolution} disabled={loading} variant="outline" className="w-full justify-start bg-transparent border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200">
            <RefreshCw className="mr-2 h-4 w-4" /> Retry Pair Resolution (unresolved mints)
          </Button>
          <Button onClick={handleRebuildIndex} disabled={loading} variant="outline" className="w-full justify-start bg-transparent border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200">
            <Database className="mr-2 h-4 w-4" /> Rebuild TokenIndex Now
          </Button>
          <Button onClick={loadStats} disabled={loading} variant="ghost" className="w-full justify-start text-zinc-500 hover:text-zinc-300">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh Stats
          </Button>
        </CardContent>
      </Card>

      {message && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6"><p className="text-sm font-mono text-zinc-400">{message}</p></CardContent>
        </Card>
      )}
    </div>
  )
}
