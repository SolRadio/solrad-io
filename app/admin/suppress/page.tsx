"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  ShieldAlert,
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Check,
} from "lucide-react"

interface SuppressedEntry {
  mint: string
  reason: string
  addedAt: string
}

export default function AdminSuppressPage() {
  const [entries, setEntries] = useState<SuppressedEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [mintInput, setMintInput] = useState("")
  const [reasonInput, setReasonInput] = useState("")
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  // Password (same pattern as status page)
  const storedPw = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ops_pw") ?? ""
    }
    return ""
  }
  const [pw, setPw] = useState("")
  const [authenticated, setAuthenticated] = useState(false)

  const fetchList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/suppress", {
        headers: { "x-ops-password": storedPw() || pw },
      })
      if (!res.ok) {
        if (res.status === 401) {
          setAuthenticated(false)
          setError("Unauthorized")
          return
        }
        throw new Error(`HTTP ${res.status}`)
      }
      setAuthenticated(true)
      const data = await res.json()
      setEntries(data.entries ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [pw])

  useEffect(() => {
    if (storedPw()) {
      fetchList()
    } else {
      setLoading(false)
    }
  }, [fetchList])

  const handleLogin = () => {
    if (typeof window !== "undefined" && pw) {
      localStorage.setItem("ops_pw", pw)
    }
    fetchList()
  }

  const handleAdd = async () => {
    const mint = mintInput.trim()
    const reason = reasonInput.trim()
    if (!mint || !reason) return

    setAdding(true)
    setFeedback(null)
    try {
      const res = await fetch("/api/admin/suppress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ops-password": storedPw(),
        },
        body: JSON.stringify({ mint, reason }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error ?? "Failed")
      setFeedback(`Added: ${mint.slice(0, 12)}...`)
      setMintInput("")
      setReasonInput("")
      await fetchList()
    } catch (e: unknown) {
      setFeedback(`Error: ${e instanceof Error ? e.message : "Unknown"}`)
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (mint: string) => {
    setRemoving(mint)
    setFeedback(null)
    try {
      const res = await fetch("/api/admin/suppress", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-ops-password": storedPw(),
        },
        body: JSON.stringify({ mint }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error ?? "Failed")
      setFeedback(`Removed: ${mint.slice(0, 12)}...`)
      await fetchList()
    } catch (e: unknown) {
      setFeedback(`Error: ${e instanceof Error ? e.message : "Unknown"}`)
    } finally {
      setRemoving(null)
    }
  }

  const fmtTime = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return iso
    }
  }

  // ── Login screen ──
  if (!authenticated && !storedPw()) {
    return (
      <main className="min-h-screen bg-background text-foreground p-6 flex items-center justify-center">
        <Card className="w-full max-w-sm border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-mono">
              <ShieldAlert className="h-4 w-4 text-red-400" />
              Token Suppression
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="password"
              placeholder="Ops password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="bg-background border-border text-sm font-mono"
            />
            <Button onClick={handleLogin} className="w-full" size="sm">
              Authenticate
            </Button>
            {error && (
              <p className="text-xs text-red-400 text-center">{error}</p>
            )}
          </CardContent>
        </Card>
      </main>
    )
  }

  // ── Main UI ──
  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-mono font-semibold flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-400" />
            Token Suppression
          </h1>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchList}
            disabled={loading}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Add Form */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono text-muted-foreground">
              Suppress Token
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Mint address (full Solana address)"
              value={mintInput}
              onChange={(e) => setMintInput(e.target.value)}
              className="bg-background border-border text-sm font-mono"
            />
            <Input
              placeholder="Reason (e.g. rugged, scam, unsafe)"
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="bg-background border-border text-sm font-mono"
            />
            <div className="flex items-center gap-3">
              <Button
                onClick={handleAdd}
                disabled={adding || !mintInput.trim() || !reasonInput.trim()}
                size="sm"
                className="gap-1.5"
                variant="destructive"
              >
                <Plus className="h-3.5 w-3.5" />
                {adding ? "Adding..." : "Suppress"}
              </Button>
              {feedback && (
                <p className="text-xs text-muted-foreground font-mono">
                  {feedback}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* List */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-mono text-muted-foreground">
                Suppressed Tokens
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-mono">
                {entries.length} total
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-xs text-muted-foreground py-6 text-center font-mono">
                Loading...
              </p>
            ) : error ? (
              <div className="flex items-center justify-center gap-2 py-6 text-red-400">
                <AlertTriangle className="h-4 w-4" />
                <p className="text-xs font-mono">{error}</p>
              </div>
            ) : entries.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center font-mono">
                No suppressed tokens
              </p>
            ) : (
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                {entries.map((entry) => (
                  <div
                    key={entry.mint}
                    className="flex items-center gap-3 p-2.5 rounded-md border border-border bg-background group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-foreground truncate">
                        {entry.mint}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant="destructive"
                          className="text-[9px] px-1.5 py-0"
                        >
                          {entry.reason}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {fmtTime(entry.addedAt)}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 opacity-50 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400"
                      onClick={() => handleRemove(entry.mint)}
                      disabled={removing === entry.mint}
                    >
                      {removing === entry.mint ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
