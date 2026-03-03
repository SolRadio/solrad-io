"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, Lock, CheckCircle, XCircle } from "lucide-react"

export default function OpsPage() {
  const [password, setPassword] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: { tokensProcessed?: number; duration?: number }
  } | null>(null)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()

    const res = await fetch("/api/ops/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      setIsAuthenticated(true)
      setPassword("")
    } else {
      alert("Invalid password")
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setResult(null)

    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      })

      const data = await res.json()

      if (data.success) {
        setResult({
          success: true,
          message: `Refreshed ${data.tokensProcessed} tokens in ${data.duration}ms`,
          details: {
            tokensProcessed: data.tokensProcessed,
            duration: data.duration,
          },
        })
      } else {
        setResult({
          success: false,
          message: data.error || "Refresh failed",
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="h-5 w-5" />
            <h1 className="text-2xl font-bold">Ops Dashboard</h1>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter ops password"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Authenticate
            </Button>
          </form>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">SOLRAD Ops</h1>
          <p className="text-muted-foreground">Force refresh token data and view system status</p>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Force Refresh</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Manually trigger a full token ingestion and write fresh data to Vercel KV
          </p>

          <Button onClick={handleRefresh} disabled={isRefreshing} className="w-full">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh Now"}
          </Button>

          {result && (
            <Alert className={`mt-4 ${result.success ? "border-green-500" : "border-red-500"}`}>
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription>
                  {result.message}
                  {result.details && (
                    <div className="mt-2 text-xs font-mono">
                      <div>Tokens: {result.details.tokensProcessed}</div>
                      <div>Duration: {result.details.duration}ms</div>
                    </div>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Storage</span>
              <span className="font-mono">Vercel KV</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cache TTL</span>
              <span className="font-mono">300s (5 min)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Network</span>
              <span className="font-mono">Solana</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">QuickNode RPC</span>
              <span className="font-mono">{process.env.QUICKNODE_ENDPOINT ? "Configured" : "Not configured"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">AI Explanations</span>
              <span className="font-mono">{process.env.OPENAI_API_KEY ? "Enabled" : "Disabled"}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
