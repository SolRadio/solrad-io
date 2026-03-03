"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AlertCircle, RefreshCw, Trash2 } from "lucide-react"

export default function AdminCacheControlPage() {
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>("")

  const handleFlushAndReingest = async () => {
    if (!password) {
      setResult("❌ Password required")
      return
    }

    setLoading(true)
    setResult("🔄 Flushing cache and triggering re-ingestion...")

    try {
      const res = await fetch("/api/ops/fix-addresses", {
        method: "POST",
        headers: {
          "x-admin-password": password,
          "Content-Type": "application/json",
        },
      })

      const data = await res.json()

      if (res.ok) {
        setResult(`✅ Success! ${JSON.stringify(data, null, 2)}`)
      } else {
        setResult(`❌ Error: ${data.error || "Unknown error"}`)
      }
    } catch (error) {
      setResult(`❌ Failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Admin Cache Control
            </CardTitle>
            <CardDescription>
              Flush cache and trigger re-ingestion to fix lowercase address bug
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Admin Password</label>
              <Input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mb-4"
              />
            </div>

            <Button
              onClick={handleFlushAndReingest}
              disabled={loading || !password}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Flush Cache & Re-Ingest
                </>
              )}
            </Button>

            {result && (
              <pre className="mt-4 p-4 rounded-lg bg-muted text-xs overflow-auto max-h-96">
                {result}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">What This Does</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>1. Deletes all cached token data from Redis/KV</p>
            <p>2. Triggers fresh ingestion from DexScreener</p>
            <p>3. New ingestion preserves case-sensitive Solana addresses</p>
            <p>4. Solscan links will now open /token/ pages instead of /account/</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
