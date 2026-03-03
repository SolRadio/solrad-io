"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import type { TokenScore } from "@/lib/types"
import { normalizeToken } from "@/lib/normalize-token"
import { normalizeMint } from "@/lib/solana/normalizeMint"
import { useWatchlist } from "@/hooks/use-watchlist"
import TokenRowMobile from "@/components/token-row-mobile"
import { TokenCardGrid } from "@/components/token-card-grid"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Search, Star, Trash2, ExternalLink, Copy, Check } from "lucide-react"
import { solscanToken } from "@/lib/explorers"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useSolPrice } from "@/hooks/use-sol-price"
import { AAdsRightRail } from "@/components/ads/AAdsRightRail"
import { ProofPreviewRail } from "@/components/proof-preview-rail"
import { LeftIntelStrip } from "@/components/left-intel-strip"
import { ResearchInsights } from "@/components/research-insights"
import { ContextBar } from "@/components/context-bar"
import { TokenDetailDrawer } from "@/components/token-detail-drawer"
import { MobileTerminal } from "@/components/mobile-terminal"
import { MobileContainer } from "@/components/mobile-container"

export function WatchlistClient() {
  const router = useRouter()
  const { watchlist, clearWatchlist, mounted } = useWatchlist()
  const [allTokens, setAllTokens] = useState<TokenScore[]>([])
  const [archiveMap, setArchiveMap] = useState<Map<string, any>>(new Map())
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState("score")
  const [updatedAt, setUpdatedAt] = useState<number | null>(null)
  const { toast } = useToast()
  const solPrice = useSolPrice()
  const [selectedMint, setSelectedMint] = useState<string | null>(null)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const hydratedMintsRef = useRef<Set<string>>(new Set())

  const selectedToken = selectedMint
    ? allTokens.find((t) => t.address && t.address.toLowerCase() === selectedMint.toLowerCase())
    : null

  // Fetch archive map for fallback
  useEffect(() => {
    const fetchArchive = async () => {
      try {
        const response = await fetch("/api/tokens/archive?pageSize=5000")
        const data = await response.json()
        
        if (data.tokens && Array.isArray(data.tokens)) {
          const map = new Map()
          data.tokens.forEach((token: any) => {
            map.set(normalizeMint(token.address).toLowerCase(), token)
          })
          setArchiveMap(map)
          console.log("[v0] Archive map loaded:", map.size, "tokens")
        }
      } catch (error) {
        console.error("[v0] Failed to fetch archive:", error)
      }
    }

    fetchArchive()
  }, [])

  // Fetch current token data
  useEffect(() => {
    const fetchTokens = async () => {
      setLoading(true)
      try {
        const response = await fetch("/api/index")
        const data = await response.json()

        if (data.warming) {
          console.log("[v0] Watchlist: TokenIndex is warming")
        }

        const tokens = data.all || []
        setAllTokens(tokens)
        setUpdatedAt(data.updatedAt || Date.now())
        setInitialLoadComplete(true)
      } catch (error) {
        console.error("[v0] Failed to fetch tokens:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTokens()
  }, [])

  // Hydrate missing watchlist tokens using batch endpoint
  useEffect(() => {
    if (!mounted || !initialLoadComplete || watchlist.length === 0) {
      return
    }

    const hydrateTokens = async () => {
      // Build set of normalized addresses we already have
      const existingMints = new Set(
        allTokens.map((t) => normalizeMint(t.address).toLowerCase())
      )

      // Find watchlist mints missing from current index that haven't been hydrated yet
      const missingMints = watchlist
        .filter((item) => {
          const normalizedMint = normalizeMint(item.mint).toLowerCase()
          return !existingMints.has(normalizedMint) && !hydratedMintsRef.current.has(normalizedMint)
        })
        .map((item) => item.mint)

      if (missingMints.length === 0) {
        return
      }

      // Mark all as being hydrated to prevent duplicates
      missingMints.forEach((mint) => {
        hydratedMintsRef.current.add(normalizeMint(mint).toLowerCase())
      })

      try {
        // Use batch endpoint to fetch and score all missing tokens at once
        const response = await fetch("/api/tokens/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mints: missingMints }),
        })

        if (!response.ok) {
          console.error("[v0] Batch endpoint failed:", response.status)
          return
        }

        const data = await response.json()
        const hydratedTokens = data.tokens || []

        if (hydratedTokens.length > 0) {
          setAllTokens((prev) => [...prev, ...hydratedTokens])
        }

        if (data.missing && data.missing.length > 0) {
          console.log("[v0] Could not hydrate:", data.missing)
        }
      } catch (error) {
        console.error("[v0] Batch hydration error:", error)
      }
    }

    hydrateTokens()
  }, [mounted, initialLoadComplete, watchlist, allTokens])

  // Build token map for quick lookup using normalized addresses
  const tokenMap = useMemo(() => {
    const map = new Map<string, TokenScore>()
    allTokens.forEach((token) => {
      if (token.address) {
        const normalizedAddress = normalizeMint(token.address).toLowerCase()
        map.set(normalizedAddress, token)
      }
    })
    return map
  }, [allTokens])

  // Merge watchlist with live token data + archive fallback
  const watchedTokens = useMemo(() => {
    return watchlist
      .filter((item) => item.mint) // Filter out invalid watchlist entries
      .map((item) => {
        // Normalize the watchlist mint for lookup
        const normalizedMint = normalizeMint(item.mint).toLowerCase()
        const liveToken = tokenMap.get(normalizedMint)
        
        if (liveToken) {
          // Prefer live token data
          return normalizeToken(liveToken)
        }
        
        // Try archive fallback if not in live dataset
        const archivedToken = archiveMap.get(normalizedMint)
        if (archivedToken) {
          // Convert archived token to TokenScore format
          const fallbackToken: TokenScore = {
            address: archivedToken.address,
            symbol: archivedToken.symbol || "",
            name: archivedToken.name || "",
            chain: "solana",
            trendingRank: 0,
            totalScore: archivedToken.lastScore || 0,
            riskLabel: archivedToken.riskLabel || "MEDIUM RISK",
            priceUsd: archivedToken.priceUsd || 0,
            priceChange24h: archivedToken.priceChange24h || 0,
            volume24h: archivedToken.volume24h || 0,
            liquidity: archivedToken.liquidity || 0,
            imageUrl: archivedToken.imageUrl,
            dexUrl: archivedToken.dexUrl,
            scoreBreakdown: {
              liquidityScore: 0,
              volumeScore: 0,
              activityScore: 0,
              ageScore: 0,
              healthScore: 0,
              boostScore: 0,
            },
            lastUpdated: archivedToken.lastSeenAt || Date.now(),
            badges: [{ key: "HELD", icon: "⏸️", label: "Not Currently Indexed" }],
          }
          return normalizeToken(fallbackToken)
        }
        
        // Last resort: create placeholder token
        const placeholderToken: TokenScore = {
          address: item.mint,
          symbol: "",
          name: "Unknown Token",
          chain: "solana",
          trendingRank: 0,
          totalScore: 0,
          riskLabel: "MEDIUM RISK",
          priceUsd: 0,
          priceChange24h: 0,
          volume24h: 0,
          liquidity: 0,
          scoreBreakdown: {
            liquidityScore: 0,
            volumeScore: 0,
            activityScore: 0,
            ageScore: 0,
            healthScore: 0,
            boostScore: 0,
          },
          lastUpdated: Date.now(),
          badges: [{ key: "HELD", icon: "⏸️", label: "Not Currently Indexed" }],
        }
        return normalizeToken(placeholderToken)
      })
      .filter((t): t is TokenScore => !!t.address) // Keep all tokens with valid addresses
  }, [watchlist, tokenMap, archiveMap])

  // Filter and sort
  const filteredTokens = useMemo(() => {
    let filtered = watchedTokens

    // Search filter
    if (search) {
      const query = search.toLowerCase()
      filtered = filtered.filter(
        (t) =>
          (t.symbol && t.symbol.toLowerCase().includes(query)) ||
          (t.name && t.name.toLowerCase().includes(query)) ||
          (t.address && t.address.toLowerCase().includes(query))
      )
    }

    // Sort
    const sorted = [...filtered]
    if (sortBy === "score") {
      sorted.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
    } else if (sortBy === "recent") {
      const watchlistMap = new Map(
        watchlist.filter((item) => item.mint).map((item) => [normalizeMint(item.mint).toLowerCase(), item.addedAt])
      )
      sorted.sort((a, b) => {
        const aTime = a.address ? watchlistMap.get(normalizeMint(a.address).toLowerCase()) || 0 : 0
        const bTime = b.address ? watchlistMap.get(normalizeMint(b.address).toLowerCase()) || 0 : 0
        return bTime - aTime
      })
    } else if (sortBy === "change") {
      sorted.sort((a, b) => (b.priceChange24h || 0) - (a.priceChange24h || 0))
    } else if (sortBy === "liquidity") {
      sorted.sort((a, b) => (b.liquidity || 0) - (a.liquidity || 0))
    }

    return sorted
  }, [watchedTokens, search, sortBy, watchlist])

  const handleClearWatchlist = () => {
    clearWatchlist()
    toast({
      title: "Watchlist cleared",
      description: "All tokens removed from your watchlist",
    })
  }

  const handleTokenSelect = (mint: string) => {
    setSelectedMint(mint)
  }

  const handleDrawerClose = () => {
    setSelectedMint(null)
  }

  if (!mounted) {
    return null // Avoid hydration mismatch
  }

return (
  <div className="w-full">
  <ContextBar />

      <div className="flex-1 flex relative overflow-hidden">
        {/* Left Intel Strip - Desktop */}
        <div className="hidden xl:block">
          <LeftIntelStrip />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold uppercase flex items-center gap-2">
                  <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
                  Watchlist
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  {watchlist.length} token{watchlist.length !== 1 ? "s" : ""} watched
                </p>
              </div>
              
              {watchlist.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                      <Trash2 className="h-4 w-4" />
                      Clear Watchlist
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear watchlist?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove all {watchlist.length} token{watchlist.length !== 1 ? "s" : ""} from your
                        watchlist. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearWatchlist}>Clear All</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {watchlist.length === 0 ? (
              <Card className="p-12 text-center">
                <Star className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-xl font-bold mb-2">No tokens in watchlist</h2>
                <p className="text-muted-foreground mb-6">
                  Star tokens to track them here. Your watchlist is saved locally.
                </p>
                <Button onClick={() => router.push("/")} className="gap-2">
                  Browse Tokens
                </Button>
              </Card>
            ) : (
              <>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by symbol, name, or mint..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 bg-transparent"
                    />
                  </div>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-[200px] bg-transparent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="score">Score (High → Low)</SelectItem>
                      <SelectItem value="recent">Recently Added</SelectItem>
                      <SelectItem value="change">24h Change</SelectItem>
                      <SelectItem value="liquidity">Liquidity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Token List */}
                {loading ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Loading token data...</p>
                  </div>
                ) : filteredTokens.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">No tokens match your search</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTokens.map((token, idx) => (
                      <div key={token.address} onClick={() => handleTokenSelect(token.address)}>
                        <TokenCardGrid token={token} rank={idx + 1} />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* Right Ad Rail - Desktop */}
        <div className="hidden xl:flex xl:flex-col gap-3">
          <AAdsRightRail />
          <ProofPreviewRail />
          {/* Research Insights for internal link density */}
          <div className="mt-1 px-4">
            <ResearchInsights />
          </div>
        </div>
      </div>

      {selectedToken && (
        <TokenDetailDrawer token={selectedToken} open={!!selectedToken} onOpenChange={handleDrawerClose} />
      )}
  </div>
  )
}
