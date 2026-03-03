"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Database, Clock, AlertCircle, PlayCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface IngestStats {
  totalMints: number
  resolved: number
  unresolved: number
  lastRunTime?: number
  lastError?: string
}

/**
 * PART A: Admin Ingestion Dashboard
 * Password-protected page showing ingestion stats and manual controls
 */
export default function AdminIngestPage() {
  const [password, setPassword] = useState("")
  const [authenticated, setAuthenticated] = useState(false)
  const [stats, setStats] = useState<IngestStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  // Check auth on mount
  useEffect(() => {
    const savedAuth = sessionStorage.getItem("admin_ingest_auth")
    if (savedAuth === "true") {
      setAuthenticated(true)
      loadStats()
    }
  }, [])

  const handleAuth = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/ops/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
      })

      if (res.ok) {
        setAuthenticated(true)
        sessionStorage.setItem("admin_ingest_auth", "true")
        setMessage("Authenticated successfully")
        loadStats()
      } else {
        setMessage("Invalid password")
      }
    } catch (error) {
      setMessage("Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/ingest/stats", {
        headers: {
          "x-admin-password": password || sessionStorage.getItem("admin_password") || "",
        },
      })

      if (res.ok) {
        const data = await res.json()
        setStats(data)
      } else {
        setMessage("Failed to load stats")
      }
    } catch (error) {
      setMessage("Error loading stats")
    } finally {
      setLoading(false)
    }
  }

  const handleRunIngest = async () => {
    setLoading(true)
    setMessage("Running ingestion...")
    try {
      const res = await fetch("/api/ingest/new-mints?limit=100&minutesBack=60", {
        method: "POST",
        headers: {
          "x-admin-password": password || sessionStorage.getItem("admin_password") || "",
        },
      })

      const data = await res.json()
      
      if (res.ok) {
        setMessage(`Ingestion complete: ${data.discovered} discovered, ${data.resolved} resolved${data.rateLimited ? " (rate limited)" : ""}`)
        loadStats()
      } else {
        setMessage(`Ingestion failed: ${data.error || "Unknown error"}`)
      }
    } catch (error) {
      setMessage("Error running ingestion")
    } finally {
      setLoading(false)
    }
  }

  const handleRetryResolution = async () => {
    setLoading(true)
    setMessage("Retrying pair resolution...")
    try {
      const res = await fetch("/api/admin/ingest/retry-resolution", {
        method: "POST",
        headers: {
          "x-admin-password": password || sessionStorage.getItem("admin_password") || "",
        },
      })

      const data = await res.json()
      
      if (res.ok) {
        setMessage(`Resolution retry complete: ${data.resolved} newly resolved${data.rateLimited ? " (rate limited)" : ""}`)
        loadStats()
      } else {
        setMessage(`Resolution failed: ${data.error || "Unknown error"}`)
      }
    } catch (error) {
      setMessage("Error retrying resolution")
    } finally {
      setLoading(false)
    }
  }

  const handleRebuildIndex = async () => {
    setLoading(true)
    setMessage("Rebuilding token index...")
    try {
      const res = await fetch("/api/intel/rebuild", {
        method: "POST",
        headers: {
          "x-admin-password": password || sessionStorage.getItem("admin_password") || "",
        },
      })

      if (res.ok) {
        setMessage("Token index rebuilt successfully")
      } else {
        setMessage("Index rebuild failed")
      }
    } catch (error) {
      setMessage("Error rebuilding index")
    } finally {
      setLoading(false)
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Ingestion Dashboard</CardTitle>
            <CardDescription>Enter admin password to continue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAuth()}
              />
            </div>
            <Button onClick={handleAuth} disabled={loading} className="w-full">
              {loading ? "Authenticating..." : "Continue"}
            </Button>
            {message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Ingestion Dashboard</h1>
          <p className="text-muted-foreground">Monitor and control SOLRAD token discovery</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Discovered</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalMints ?? "-"}</div>
              <p className="text-xs text-muted-foreground">Unique mints in KV</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved Pairs</CardTitle>
              <Badge variant="outline" className="bg-green-500/10 text-green-500">
                {stats ? Math.round((stats.resolved / stats.totalMints) * 100) : 0}%
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.resolved ?? "-"}</div>
              <p className="text-xs text-muted-foreground">Have DEX pair data</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unresolved</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.unresolved ?? "-"}</div>
              <p className="text-xs text-muted-foreground">Need pair resolution</p>
            </CardContent>
          </Card>
        </div>

        {/* Last Run Info */}
        {stats?.lastRunTime && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Last Ingestion Run</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {new Date(stats.lastRunTime).toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">
                ({Math.round((Date.now() - stats.lastRunTime) / 60000)} minutes ago)
              </span>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {stats?.lastError && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-sm text-destructive">Last Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-mono">{stats.lastError}</p>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Manual Controls</CardTitle>
            <CardDescription>Trigger operations manually</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button 
              onClick={handleRunIngest} 
              disabled={loading}
              className="w-full justify-start"
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Run Ingest Now (last 60 min, limit 100)
            </Button>
            
            <Button 
              onClick={handleRetryResolution}
              disabled={loading}
              variant="outline"
              className="w-full justify-start bg-transparent"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Pair Resolution (unresolved mints)
            </Button>
            
            <Button 
              onClick={handleRebuildIndex}
              disabled={loading}
              variant="outline"
              className="w-full justify-start bg-transparent"
            >
              <Database className="mr-2 h-4 w-4" />
              Rebuild TokenIndex Now
            </Button>

            <Button 
              onClick={loadStats}
              disabled={loading}
              variant="ghost"
              className="w-full justify-start"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Stats
            </Button>
          </CardContent>
        </Card>

        {/* Status Message */}
        {message && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm">{message}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
