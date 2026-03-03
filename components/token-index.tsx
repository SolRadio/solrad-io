"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { TokenScore } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ArrowUp } from "lucide-react"
import Image from "next/image"
import { getTokenOriginWithReason, getOriginAccent } from "@/lib/token-origin-accent"
import { getSolradScore } from "@/lib/token-score"

interface TokenIndexProps {
  tokens: TokenScore[]
  /** Optional callback when a token is clicked - use this for drawer open */
  onTokenClick?: (token: TokenScore) => void
}

export function TokenIndex({ tokens, onTokenClick }: TokenIndexProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  // PART C: Also match by address for direct mint search
  const filteredTokens = tokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.address.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Show all filtered tokens
  const displayTokens = filteredTokens

  // PART 5: Pass full token object to parent callback
  const handleTokenClick = (token: TokenScore) => {
    if (onTokenClick) {
      // Use callback if provided (preferred - opens drawer directly with full token data)
      onTokenClick(token)
    } else {
      // Fallback: navigate with mint in URL (requires parent to lookup token)
      router.push(`/?token=${token.address}`, { scroll: false })
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const getRiskColor = (risk: string) => {
    if (risk.includes("LOW")) return "text-success"
    if (risk.includes("MEDIUM")) return "text-warning"
    return "text-destructive"
  }

  const formatPrice = (price: number | undefined) => {
    if (typeof price !== 'number' || isNaN(price)) return "—"
    
    if (price >= 1) {
      return `$${price.toFixed(2)}`
    } else if (price >= 0.01) {
      return `$${price.toFixed(4)}`
    } else {
      // For very small prices, show 6-8 decimals and trim trailing zeros
      const formatted = price.toFixed(8).replace(/\.?0+$/, '')
      return `$${formatted}`
    }
  }

  return (
    <aside className="w-full min-w-0 min-h-0 h-full">
      <div className="border bg-card h-full flex flex-col min-h-0 rounded-none border-sidebar-ring">
        {/* Header */}
        <div className="px-3 py-2.5 shrink-0 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-widest">INDEX</h3>
            <span className="text-[10px] font-mono text-muted-foreground/60">{filteredTokens.length}</span>
          </div>
          
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <Input
              type="text"
              placeholder="Search symbol, name, mint..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-secondary border-border rounded focus:border-primary/50 transition-colors font-mono"
            />
          </div>
        </div>

        {/* Token List */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain thin-scrollbar">
          <div className="divide-y divide-border/50">
            {displayTokens.map((token, index) => {
              const { origin } = getTokenOriginWithReason(token)
              const accent = getOriginAccent(origin)
              const score = getSolradScore(token)
              
              return (
                <button
                  key={token.address}
                  type="button"
                  onClick={() => handleTokenClick(token)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary/80 transition-colors text-left cursor-pointer"
                >
                  {/* Token Avatar */}
                  <div className="relative h-8 w-8 shrink-0 rounded-full overflow-hidden bg-muted">
                    {token.imageUrl ? (
                      <Image
                        src={token.imageUrl || "/placeholder.svg"}
                        alt={token.symbol}
                        width={32}
                        height={32}
                        className="w-full h-full rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <span className="text-[10px] font-bold font-mono text-muted-foreground uppercase">
                          {token.symbol.slice(0, 2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Symbol + Rank */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-muted-foreground/50 tabular-nums w-4">{index + 1}</span>
                      <span className="text-xs font-semibold text-foreground truncate">{token.symbol}</span>
                    </div>
                    <div className="flex items-center gap-1 ml-5">
                      <span className="text-[9px] font-mono text-muted-foreground/40">{token.address.slice(0, 4)}...{token.address.slice(-3)}</span>
                    </div>
                  </div>
                    
                  {/* Price + Score right-aligned */}
                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                    <span className="text-xs font-mono font-semibold text-foreground tabular-nums">
                      {formatPrice(token.priceUsd)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-mono font-semibold ${getRiskColor(token.riskLabel)}`}>
                        {token.riskLabel ? token.riskLabel.replace(" RISK", "") : ""}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-accent tabular-nums">
                        {score !== null ? Math.round(score) : '--'}
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </aside>
  )
}
