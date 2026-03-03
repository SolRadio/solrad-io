"use client"

import { useEffect, useState } from "react"
import { Flame, RefreshCw, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface ActiveTradingToken {
  address: string
  symbol: string
  name: string
  priceUsd: number
  priceChange24h: number
  volume24h: number
  liquidity: number
  txns24h: number
  imageUrl?: string
  pairUrl?: string
}

interface ActiveTradingData {
  tokens: ActiveTradingToken[]
  updatedAt: string
  error?: string
  warning?: string
  source?: string
}

export function ActiveTrading() {
  const [data, setData] = useState<ActiveTradingData | null>(null)
  const [loading, setLoading] = useState(true)
  const isEnabled = process.env.NEXT_PUBLIC_ACTIVE_TRADING_ENABLED === "true"

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/active-trading")
      const json = await response.json()
      setData(json)
    } catch (error) {
      console.error("[v0] Error fetching active trading:", error)
      setData({
        tokens: [],
        updatedAt: new Date().toISOString(),
        error: "Failed to load data",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Feature disabled state
  if (!isEnabled || data?.source === "disabled") {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Flame className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-bold mb-2">Active Trading</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Real-time trending tokens will appear here soon. Stay tuned for updates!
        </p>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="h-8 w-8 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Loading active trading data...</p>
      </div>
    )
  }

  // Error or empty state
  if (!data || data.tokens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Active Trading Data</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
          {data?.error || "Unable to load trending tokens at this time."}
        </p>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <h2 className="text-lg font-bold">Trending Now</h2>
          <span className="text-xs text-muted-foreground">
            {data.tokens.length} tokens
          </span>
        </div>
        <Button onClick={fetchData} variant="ghost" size="sm">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {data.warning && (
        <div className="px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 text-xs">
          {data.warning}
        </div>
      )}

      {/* Token Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data.tokens.map((token) => (
          <Card
            key={token.address}
            className="p-4 hover:border-primary/30 transition-all cursor-pointer"
            onClick={() => token.pairUrl && window.open(token.pairUrl, "_blank")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                {token.imageUrl ? (
                  <Image
                    src={token.imageUrl || "/placeholder.svg"}
                    alt={token.symbol}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <span className="text-lg font-bold">{token.symbol[0]}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold uppercase truncate">{token.symbol}</h3>
                <p className="text-xs text-muted-foreground truncate">{token.name}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="font-mono">${token.priceUsd.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">24h</span>
                <span
                  className={`font-bold ${
                    token.priceChange24h >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {token.priceChange24h >= 0 ? "+" : ""}
                  {token.priceChange24h.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Volume</span>
                <span className="font-mono text-xs">
                  ${token.volume24h >= 1000000
                    ? `${(token.volume24h / 1000000).toFixed(2)}M`
                    : `${(token.volume24h / 1000).toFixed(0)}K`}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="text-center text-xs text-muted-foreground">
        Last updated: {new Date(data.updatedAt).toLocaleTimeString()}
      </div>
    </div>
  )
}
