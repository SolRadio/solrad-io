"use client"

import React, { useMemo, useEffect, useState, useCallback } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useRouter, useSearchParams } from "next/navigation"
import type { TokenScore } from "@/lib/types"
import { TokenCardGrid } from "@/components/token-card-grid"
import TokenRowMobile from "@/components/token-row-mobile"
import { DesktopTerminal } from "@/components/desktop-terminal"
import { MobileContainer } from "@/components/mobile-container"
import { TabletTerminal } from "@/components/tablet-terminal"
import { Footer } from "@/components/footer"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, Search, TrendingUp, Activity, Droplets, Coins, Sparkles, Flame, Info, X } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { featureFlags } from "@/lib/featureFlags"
import { computeSignalScoreV2, computeSignalScore } from "@/lib/scoring-v2"
import { HowToPanel } from "@/components/how-to-panel"
import { WinnerTicker } from "@/components/winner-ticker"
import { useSolPrice } from "@/hooks/use-sol-price"
import { AAdsRightRail } from "@/components/ads/AAdsRightRail"
import { ProofPreviewRail } from "@/components/proof-preview-rail"

import { LeftIntelStrip } from "@/components/left-intel-strip"
import { ContextBar } from "@/components/context-bar"
import { TokenIndex } from "@/components/token-index"
import { TokenDetailDrawer } from "@/components/token-detail-drawer"

import { GemFinderModal } from "@/components/gem-finder-modal"
import { Star } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Navbar } from "@/components/navbar" // Import Navbar
import { formatUsdPrice } from "@/lib/format"
import { DataFreshnessBar } from "@/components/data-freshness-bar"
import type { LeadTimeProof } from "@/lib/lead-time/types"
import { normalizeMint } from "@/lib/lead-time/normalize-mint"
import { LeadTimeRecentPanel } from "@/components/lead-time-recent-panel" // Import LeadTimeRecentPanel

import { HeroOverlay } from "@/components/hero-overlay"
import { WelcomePanel } from "@/components/welcome-panel"
import { ProWelcomeBanner } from "@/components/pro-welcome-banner"


// P0-03: Module-level in-flight promise guard for request deduplication
let inFlightFetch: Promise<void> | null = null

export default function HomeClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  // PART A.1: 5 separate states for Intelligence Engine arrays (added Fresh Signals)
  const [allTokens, setAllTokens] = useState<TokenScore[]>([])
  const [trendingTokens, setTrendingTokens] = useState<TokenScore[]>([])
  const [activeTokens, setActiveTokens] = useState<TokenScore[]>([])
  const [newEarlyTokens, setNewEarlyTokens] = useState<TokenScore[]>([])
  const [freshSignalsTokens, setFreshSignalsTokens] = useState<TokenScore[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState("score")
  const [sourceFilter, setSourceFilter] = useState<"all" | "jupiter" | "multi">("all")
  const [updatedAt, setUpdatedAt] = useState<number | null>(null)
  const [gemFinderMode, setGemFinderMode] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("solrad_filter_gemmode") === "true"
  })
  const [leadTimeOnly, setLeadTimeOnly] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("solrad_filter_leadtime") === "true"
  })
  const [topPerformersMode, setTopPerformersMode] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("solrad_filter_topperformers") === "true"
  })
  const [signalWinnersMode, setSignalWinnersMode] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("solrad_filter_signalwinners") === "true"
  })
  // PART C: Stale state tracking
  const [stale, setStale] = useState(false)
  const [staleSeverity, setStaleSeverity] = useState<"low" | "high" | null>(null)
  // Warming status tracking
  const [isWarming, setIsWarming] = useState(false)
  const [lastIngestAt, setLastIngestAt] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  // Track total tokens in index (before filters) to distinguish "no tokens" from "filtered out"
  const [totalTokenCount, setTotalTokenCount] = useState<number>(0)
  // P1-04: Rate limiting for Force Refresh button
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0)
  const [refreshCooldown, setRefreshCooldown] = useState<number>(0)
  // Live window filter fallback state
  const [liveWindowFallback, setLiveWindowFallback] = useState(false)
  // Data freshness indicator
  const [dataFreshness, setDataFreshness] = useState<{ status: string; lastSnapshotAge: string } | null>(null)
  const solPrice = useSolPrice()

  // Persist filter toggles to localStorage
  useEffect(() => { localStorage.setItem("solrad_filter_gemmode", String(gemFinderMode)) }, [gemFinderMode])
  useEffect(() => { localStorage.setItem("solrad_filter_leadtime", String(leadTimeOnly)) }, [leadTimeOnly])
  useEffect(() => { localStorage.setItem("solrad_filter_topperformers", String(topPerformersMode)) }, [topPerformersMode])
  useEffect(() => { localStorage.setItem("solrad_filter_signalwinners", String(signalWinnersMode)) }, [signalWinnersMode])
  
  // Lead-Time Proofs: Fetch once and pass down as Map
  const [leadTimeProofsMap, setLeadTimeProofsMap] = useState<Map<string, LeadTimeProof>>(new Map())

  // Fetch data freshness on mount + every 60s
  useEffect(() => {
    const fetchFreshness = () => {
      fetch("/api/health/data-freshness")
        .then(r => r.json())
        .then(d => setDataFreshness(d))
        .catch(() => {})
    }
    fetchFreshness()
    const iv = setInterval(fetchFreshness, 60000)
    return () => clearInterval(iv)
  }, [])

  // Hero overlay: show once per session, only on first load
  const [showHero, setShowHero] = useState(() => {
    if (typeof window === "undefined") return false
    return !sessionStorage.getItem("solrad_hero_seen")
  })
  const dismissHero = useCallback(() => {
    setShowHero(false)
    sessionStorage.setItem("solrad_hero_seen", "1")
  }, [])
  
  // PART 5: Token drawer state - use React state instead of URL params to avoid timing issues
  const [selectedToken, setSelectedToken] = React.useState<TokenScore | null>(null)
  
  // Handle opening drawer from TokenIndex click - directly set token
  const handleTokenSelect = (token: TokenScore) => {
    setSelectedToken(token)
  }
  
  // Handle closing drawer
  const handleDrawerClose = () => {
    setSelectedToken(null)
  }

  const fetchTokens = async () => {
    // P0-03: If fetch already in progress, wait for it instead of creating new request
    if (inFlightFetch) {
      console.log("[v0] Fetch already in progress, waiting for existing request")
      return inFlightFetch
    }
    
    setLoading(true)
    
    // Create promise and store in module-level variable
    inFlightFetch = (async () => {
      try {
        // PART A.2: Try Intelligence Engine first and read 4 arrays
        const response = await fetch("/api/index")
        const data = await response.json()
        
        // Check for warming status - ONLY if TokenIndex is truly empty
        // Do NOT show warming if tokens exist but are filtered out
        const hasTokensInIndex = data.totalTokenCount > 0 || (data.all && data.all.length > 0)
        
        if (data.status === "warming" && !hasTokensInIndex) {
          // True warming: No tokens in TokenIndex at all
          setIsWarming(true)
          setLastIngestAt(data.lastIngestAt || null)
          setTotalTokenCount(0)
          setAllTokens([])
          setTrendingTokens([])
          setActiveTokens([])
          setNewEarlyTokens([])
          setFreshSignalsTokens([])
          setStale(false)
          setStaleSeverity(null)
          return
        }
        
        // Normal data processing
        setIsWarming(false)
        setLastIngestAt(data.lastIngestAt || null)
        setTotalTokenCount(data.totalTokenCount || 0)
        
        if (data.all && Array.isArray(data.all)) {
          // Convert TokenIntel to TokenScore for compatibility
          const { convertIntelToScore } = await import("@/lib/intel/converter")
          const { enrichTokensWithRationale } = await import("@/lib/signals/deriveSignalRationale")
          const { filterLiveTokens } = await import("@/lib/filters/liveWindowFilter")
          
          // Convert and enrich all tokens
          const all = Array.isArray(data.all) ? enrichTokensWithRationale(data.all.map(convertIntelToScore)) : []
          const trendingRaw = Array.isArray(data.trending) ? enrichTokensWithRationale(data.trending.map(convertIntelToScore)) : []
          const activeRaw = Array.isArray(data.active) ? enrichTokensWithRationale(data.active.map(convertIntelToScore)) : []
          const newEarlyRaw = Array.isArray(data.newEarly) ? enrichTokensWithRationale(data.newEarly.map(convertIntelToScore)) : []
          const freshSignalsRaw = Array.isArray(data.freshSignals) ? enrichTokensWithRationale(data.freshSignals.map(convertIntelToScore)) : []
          
          // LIVE WINDOW FILTER: Apply to LIVE sections only (not Token Pool)
          // With fallback: if filtered result is empty but original had data, use original
          const trendingFiltered = filterLiveTokens(trendingRaw)
          const activeFiltered = filterLiveTokens(activeRaw)
          const newEarlyFiltered = filterLiveTokens(newEarlyRaw)
          const freshSignalsFiltered = filterLiveTokens(freshSignalsRaw)
          
          // Fallback logic: prevent empty sections when original had data
          const trendingUseFallback = (trendingFiltered.length === 0 && trendingRaw.length > 0)
          const activeUseFallback = (activeFiltered.length === 0 && activeRaw.length > 0)
          const newEarlyUseFallback = (newEarlyFiltered.length === 0 && newEarlyRaw.length > 0)
          const freshSignalsUseFallback = (freshSignalsFiltered.length === 0 && freshSignalsRaw.length > 0)
          
          const trending = trendingUseFallback ? trendingRaw : trendingFiltered
          const active = activeUseFallback ? activeRaw : activeFiltered
          const newEarly = newEarlyUseFallback ? newEarlyRaw : newEarlyFiltered
          const freshSignals = freshSignalsUseFallback ? freshSignalsRaw : freshSignalsFiltered
          
          // Track if any section is using fallback
          const anyFallback = trendingUseFallback || activeUseFallback || newEarlyUseFallback || freshSignalsUseFallback
          setLiveWindowFallback(anyFallback)
          
          console.log("[v0] Live window filter applied:", {
            trending: `${trendingRaw.length} → ${trendingFiltered.length}${trendingUseFallback ? " (fallback)" : ""}`,
            active: `${activeRaw.length} → ${activeFiltered.length}${activeUseFallback ? " (fallback)" : ""}`,
            newEarly: `${newEarlyRaw.length} → ${newEarlyFiltered.length}${newEarlyUseFallback ? " (fallback)" : ""}`,
            freshSignals: `${freshSignalsRaw.length} → ${freshSignalsFiltered.length}${freshSignalsUseFallback ? " (fallback)" : ""}`,
          })
          
          setAllTokens(all) // Token Pool - NO FILTER
          setTrendingTokens(trending)
          setActiveTokens(active)
          setNewEarlyTokens(newEarly)
          setFreshSignalsTokens(freshSignals)
          setUpdatedAt(new Date(data.updatedAt).getTime())
          // PART C: Track stale state from /api/index
          setStale(data.stale ?? false)
          setStaleSeverity(data.staleSeverity ?? null)
          
          // Fetch lead-time proofs once for all tokens
          try {
            const proofsResponse = await fetch("/api/lead-time/recent?limit=50", {
              cache: "no-store",
            })
            if (proofsResponse.ok) {
              const proofsData = await proofsResponse.json()
              const proofsMap = new Map<string, LeadTimeProof>()
              
              if (Array.isArray(proofsData.proofs)) {
                for (const proof of proofsData.proofs) {
                  const normalizedMint = normalizeMint(proof.mint)
                  if (normalizedMint) {
                    proofsMap.set(normalizedMint, proof)
                  }
                }
              }
              
              setLeadTimeProofsMap(proofsMap)
            }
          } catch (proofError) {
            console.error("[v0] Failed to fetch lead-time proofs:", proofError)
            setLeadTimeProofsMap(new Map())
          }
        } else {
          // Fallback to old API - only set allTokens
          const fallbackResponse = await fetch("/api/tokens")
          const fallbackData = await fallbackResponse.json()
          setAllTokens(Array.isArray(fallbackData.tokens) ? fallbackData.tokens : [])
          setTrendingTokens([])
          setActiveTokens([])
          setNewEarlyTokens([])
          setFreshSignalsTokens([])
          setUpdatedAt(fallbackData.updatedAt || Date.now())
          // PART C: Track stale state from /api/tokens
          setStale(fallbackData.stale ?? false)
          setStaleSeverity(fallbackData.staleSeverity ?? null)
        }
      } catch (error) {
        // Last resort fallback - only set allTokens
        try {
          const fallbackResponse = await fetch("/api/tokens")
          const fallbackData = await fallbackResponse.json()
          setAllTokens(Array.isArray(fallbackData.tokens) ? fallbackData.tokens : [])
          setTrendingTokens([])
          setActiveTokens([])
          setNewEarlyTokens([])
          setFreshSignalsTokens([])
          setUpdatedAt(fallbackData.updatedAt || Date.now())
          // PART C: Track stale state
          setStale(fallbackData.stale ?? false)
          setStaleSeverity(fallbackData.staleSeverity ?? null)
        } catch (fallbackError) {
          setAllTokens([])
          setTrendingTokens([])
          setActiveTokens([])
          setNewEarlyTokens([])
          setFreshSignalsTokens([])
          // Mark as warming on complete failure
          setIsWarming(true)
          setTotalTokenCount(0)
          setStale(false)
          setStaleSeverity(null)
        }
      } finally {
        setLoading(false)
        // Clear in-flight flag so next fetch can proceed
        inFlightFetch = null
      }
    })()
    
    return inFlightFetch
  }

  const handleForceRefresh = async () => {
    // P1-04: Check cooldown before allowing refresh
    const now = Date.now()
    const timeSinceLastRefresh = now - lastRefreshTime
    const COOLDOWN_MS = 60000 // 60 seconds
    
    if (timeSinceLastRefresh < COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((COOLDOWN_MS - timeSinceLastRefresh) / 1000)
      toast({
        title: "Refresh Cooldown Active",
        description: `Please wait ${remainingSeconds} seconds before refreshing again.`,
        variant: "destructive",
      })
      return
    }
    
    setRefreshing(true)
    setLastRefreshTime(now)
    setRefreshCooldown(60) // Start 60s countdown
    
    try {
      // Import and call server action (keeps secrets on server)
      const { triggerRefresh } = await import("@/app/actions/refresh")
      const result = await triggerRefresh()
      
      if (result.success) {
        // Wait a moment for ingestion to complete, then refetch
        setTimeout(() => {
          fetchTokens()
        }, 2000)
      } else {
        console.error("[v0] Force refresh failed:", result.error)
      }
      } catch (error) {
        console.error("[v0] Error fetching tokens:", error)
        // Mark as warming on complete failure
        setIsWarming(true)
        setTotalTokenCount(0)
        setStale(false)
        setStaleSeverity(null)
      }
  }

  useEffect(() => {
    // Sprint 2: Parallel initial fetch to eliminate waterfall
    const initialLoad = async () => {
      const { prefetchSolPrice } = await import("@/hooks/use-sol-price")
      // Fire both requests in parallel - don't wait for each other
      await Promise.all([
        fetchTokens(),
        prefetchSolPrice().catch(() => {
          // Sol price failure shouldn't block token load
        })
      ])
    }
    
    initialLoad()
    // Poll every 2 minutes to catch fresh data from cron quickly
    const interval = setInterval(fetchTokens, 120000) // 2 minutes
    return () => clearInterval(interval)
  }, [])
  
  // P1-04: Countdown timer for refresh cooldown
  useEffect(() => {
    if (refreshCooldown <= 0) return
    
    const timer = setInterval(() => {
      setRefreshCooldown((prev) => {
        if (prev <= 1) {
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [refreshCooldown])

  // Desktop UI: Clear all toggle filters + column filters
  const clearAllFilters = () => {
    setGemFinderMode(false)
    setLeadTimeOnly(false)
    setTopPerformersMode(false)
    setSignalWinnersMode(false)
    setSearch("")
    setSourceFilter("all")
  }

  // Track which toggles are currently active for contextual guidance
  const activeToggleNames = useMemo(() => {
    const names: string[] = []
    if (gemFinderMode) names.push("GEM Finder")
    if (leadTimeOnly) names.push("Lead-Time Only")
    if (topPerformersMode) names.push("Top Performers")
    if (signalWinnersMode) names.push("Signal Winners")
    return names
  }, [gemFinderMode, leadTimeOnly, topPerformersMode, signalWinnersMode])

  const hasAnyFilter = activeToggleNames.length > 0 || search.length > 0 || sourceFilter !== "all"

  // PART A.3: Replace filteredTokens with filteredAll (filter only, NO SORT on columns)
  // Sprint 1: Memoized to prevent expensive refiltering on every render
  const filteredAll = useMemo(() => {
    return allTokens.filter((token) => {
      const matchesSearch =
        token.symbol?.toLowerCase().includes(search.toLowerCase()) ||
        token.name?.toLowerCase().includes(search.toLowerCase()) ||
        token.address?.toLowerCase().includes(search.toLowerCase())

      const sources = token.sources?.map((s) => s.source) || []
      const matchesSource =
        sourceFilter === "all" ||
        (sourceFilter === "jupiter" && sources.includes("jupiter")) ||
        (sourceFilter === "multi" && sources.length > 1)

      // PART E: Gem Finder shows only tokens with GEM badge
      if (featureFlags.gemFinderMode && gemFinderMode) {
        const hasGemBadge = token.badges?.some(b => b.key === "GEM" || b.icon === "💎")
        if (!hasGemBadge) return false
      }
      if (leadTimeOnly) {
        if (!leadTimeProofsMap.has(token.address.toLowerCase())) return false
      }
      if (topPerformersMode) {
        if (token.totalScore < 70) return false
      }
      if (signalWinnersMode) {
        if (token.signalState !== "STRONG") return false
      }

      return matchesSearch && matchesSource
    })
  }, [allTokens, search, sourceFilter, gemFinderMode, leadTimeOnly, topPerformersMode, signalWinnersMode, leadTimeProofsMap])

  // sortedAll applies sort dropdown - ONLY affects mobile list + token index, NOT columns
  // Sprint 1: Memoized to prevent expensive re-sorting on every render
  const sortedAll = useMemo(() => {
    return [...filteredAll].sort((a, b) => {
      if (featureFlags.gemFinderMode && gemFinderMode) {
        const signalA = computeSignalScoreV2(a) ?? 0
        const signalB = computeSignalScoreV2(b) ?? 0

        if (signalA !== signalB) {
          return signalB - signalA
        }

        // Tie-break with SOLRAD score
        return b.totalScore - a.totalScore
      }

      switch (sortBy) {
        case "volume":
          return (b.volume24h ?? 0) - (a.volume24h ?? 0)
        case "liquidity":
          return (b.liquidity ?? 0) - (a.liquidity ?? 0)
        case "change":
          return (b.priceChange24h ?? 0) - (a.priceChange24h ?? 0)
        default:
          return b.totalScore - a.totalScore
      }
    })
  }, [filteredAll, sortBy, gemFinderMode])

  // PART A.4: Create per-column filtered views that preserve server order
  // Applies all desktop toggle filters: GEM Finder, Lead-Time Only, Top Performers, Signal Winners
  function applyLocalFilters(list: TokenScore[]) {
    return list.filter((token) => {
      // DO NOT sort - preserve server order
      if (featureFlags.gemFinderMode && gemFinderMode) {
        const hasGemBadge = token.badges?.some(b => b.key === "GEM" || b.icon === "💎")
        if (!hasGemBadge) return false
      }
      if (leadTimeOnly) {
        if (!leadTimeProofsMap.has(token.address.toLowerCase())) return false
      }
      if (topPerformersMode) {
        if (token.totalScore < 70) return false
      }
      if (signalWinnersMode) {
        if (token.signalState !== "STRONG") return false
      }
      return true
    })
  }

  // A1: Memoize column views to prevent expensive filtering on every render
  const filterDeps = [gemFinderMode, leadTimeOnly, topPerformersMode, signalWinnersMode, leadTimeProofsMap] as const
  const trendingView = useMemo(() => applyLocalFilters(trendingTokens), [trendingTokens, ...filterDeps])
  const activeView = useMemo(() => applyLocalFilters(activeTokens), [activeTokens, ...filterDeps])
  const newEarlyView = useMemo(() => applyLocalFilters(newEarlyTokens), [newEarlyTokens, ...filterDeps])
  const freshSignalsView = useMemo(() => applyLocalFilters(freshSignalsTokens), [freshSignalsTokens, ...filterDeps])

  // PART A.5: Update stats to use allTokens
  // Sprint 1: Memoized to prevent expensive recalculation on every render
  const stats = useMemo(() => {
    return {
      totalVolume: allTokens.reduce((sum, t) => sum + (t.volume24h ?? 0), 0),
      avgScore: allTokens.length > 0 ? allTokens.reduce((sum, t) => sum + t.totalScore, 0) / allTokens.length : 0,
      totalLiquidity: allTokens.reduce((sum, t) => sum + (t.liquidity ?? 0), 0),
      tokensTracked: allTokens.length,
    }
  }, [allTokens])

  return (
    <>
  {/* SEO: Semantic H1 - Hidden but crawlable for search engines */}
  <h1 className="sr-only">
  Solana Token Intelligence Dashboard - Real-Time Token Scanner & Gem Finder
  </h1>

  {/* Pro welcome banner - shows once after upgrade */}
  <ProWelcomeBanner />

      {/* Hero Overlay - shows once per session, fades out on scroll/timer */}
      {showHero && !loading && (
        <div className="fixed inset-0 z-50 pointer-events-none" style={{ isolation: "isolate" }}>
          <HeroOverlay
            stats={stats}
            leadTimeProofsMap={leadTimeProofsMap}
            onDismiss={dismissHero}
          />
        </div>
      )}
      
      {/* Mobile Experience (sm and below) - App-like Interface */}
      <div className="block md:hidden">
              <MobileContainer
                allTokens={sortedAll}
                trending={trendingView}
                active={activeView}
                newEarly={newEarlyView}
                freshSignals={freshSignalsView}
                lastUpdated={updatedAt ?? undefined}
                onRefresh={fetchTokens}
                isRefreshing={loading}
                leadTimeProofsMap={leadTimeProofsMap}
                stats={stats}
                solPrice={solPrice}
              />
      </div>

      {/* Tablet Experience (768px - 1023px) - 2-Column Dashboard */}
      <div className="hidden md:block lg:hidden">
        <TabletTerminal
          trendingTokens={trendingView}
          activeTokens={activeView}
          newTokens={newEarlyView}
          freshSignals={freshSignalsView}
          stats={stats}
          solPrice={solPrice}
          onRefresh={fetchTokens}
          isRefreshing={loading}
          lastUpdated={updatedAt ?? undefined}
          stale={stale}
          staleSeverity={staleSeverity}
          liveWindowFallback={liveWindowFallback}
        />
      </div>

      {/* Compact Desktop Experience (1024px - 1279px) - 2-Column Wrapped Layout */}
      <div className="hidden lg:block xl:hidden">
  <DesktopTerminal
  trending={trendingView}
  active={activeView}
  newEarly={newEarlyView}
  freshSignals={freshSignalsView}
  all={sortedAll}
  updatedAt={updatedAt ?? undefined}
  stale={stale}
  staleSeverity={staleSeverity}
  refreshing={refreshing}
  liveWindowFallback={liveWindowFallback}
  leadTimeProofsMap={leadTimeProofsMap}
  compact={true}
  />
      </div>

      {/* Full Desktop Experience (≥1280px) - 4-Column Layout */}
      <div className="hidden xl:flex h-screen flex-col bg-[#0a0a0a] overflow-x-hidden max-w-[100vw]">
        {/* Scanline overlay */}
        <div className="pointer-events-none fixed inset-0" style={{ zIndex: -1, background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)' }} />
        <Navbar onRefresh={fetchTokens} isRefreshing={loading} lastUpdated={updatedAt ?? undefined} stale={stale} staleSeverity={staleSeverity} tokenCount={allTokens.length} />
        <WinnerTicker onTokenClick={(token) => setSelectedToken(token)} />
      
        {/* Left Intel Strip - Desktop Only (xl+) */}
        <LeftIntelStrip />

        <div className="flex-1 w-full max-w-none pt-2 pb-2 flex flex-col min-h-0" style={{ height: 'calc(100vh - 140px)' }}>
          <div className="w-full xl:grid xl:grid-cols-[260px_minmax(0,1fr)_220px] gap-4 flex-1 min-h-0 px-6">
            {/* LEFT: Token Index + Lead-Time Engine - Full Desktop Only (xl+) */}
            <div className="hidden xl:flex xl:flex-col min-w-0 min-h-0 h-full gap-2">
              <div className="flex-1 min-h-0 overflow-hidden">
                <TokenIndex tokens={sortedAll} onTokenClick={handleTokenSelect} />
              </div>
              <div className="shrink-0 max-h-[220px] overflow-hidden">
                <LeadTimeRecentPanel />
              </div>
            </div>

            {/* CENTER: Main Content */}
            <div className="w-full min-w-0 flex flex-col min-h-0 h-full gap-0 mb-0">
              {/* Stats Cards - Desktop only (mobile uses MobileContainer) */}
              <div className="mb-3 shrink-0 hidden md:block">
                {/* Mobile stats removed - MobileContainer handles mobile view */}
                <div className="hidden gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                  <div className="flex-shrink-0 p-3 rounded-xl border border-border bg-secondary min-w-[120px]">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="h-4 w-4 text-primary" />
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">VOL 24H</span>
                    </div>
                    <div className="text-lg font-bold font-mono">${(stats.totalVolume / 1000000).toFixed(1)}M</div>
                  </div>

                  <div className="flex-shrink-0 p-3 rounded-xl border border-border bg-secondary min-w-[100px]">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-accent" />
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">AVG</span>
                    </div>
                    <div className="text-lg font-bold font-mono">{stats.avgScore.toFixed(0)}</div>
                  </div>

                  <div className="flex-shrink-0 p-3 rounded-xl border border-border bg-secondary min-w-[120px]">
                    <div className="flex items-center gap-2 mb-1">
                      <Droplets className="h-4 w-4 text-green-400" />
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">LIQ</span>
                    </div>
                    <div className="text-lg font-bold font-mono">${(stats.totalLiquidity / 1000000).toFixed(1)}M</div>
                  </div>

                  <div className="flex-shrink-0 p-3 rounded-xl border border-border bg-secondary min-w-[100px]">
                    <div className="flex items-center gap-2 mb-1">
                      <Coins className="h-4 w-4 text-purple-400" />
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">TOKENS</span>
                    </div>
                    <div className="text-lg font-bold font-mono">{stats.tokensTracked}</div>
                  </div>

                  <div className="flex-shrink-0 p-3 rounded-xl border border-border bg-secondary min-w-[110px]">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="h-4 w-4 text-cyan-400" />
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">SOL</span>
                    </div>
                    {solPrice.loading ? (
                      <div className="text-sm text-muted-foreground">...</div>
                    ) : solPrice.error ? (
                      <div className="text-sm text-muted-foreground">—</div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold font-mono">${solPrice.price.toFixed(0)}</span>
                        <span className={`text-xs font-semibold ${solPrice.change24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {solPrice.change24h >= 0 ? "+" : ""}{solPrice.change24h.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Desktop: Grid layout */}
                <div className="hidden md:grid md:grid-cols-5 gap-px bg-zinc-900 overflow-hidden border border-zinc-800 text-black">
                  <div className="p-4 bg-[#111111] flex flex-col items-center gap-1 text-center bg-card">
                    <div className="flex items-center justify-center gap-2">
                      <Activity className="h-3.5 w-3.5 text-zinc-600" />
                      <span className="text-[10px] font-mono tracking-[0.25em] text-zinc-500 uppercase">VOL 24H</span>
                    </div>
                    <div className="font-bold font-mono text-xl leading-none tabular-nums text-zinc-200">${(stats.totalVolume / 1000000).toFixed(2)}M</div>
                  </div>
                  
                  <div className="p-4 bg-[#111111] flex flex-col items-center gap-1 text-center bg-card">
                    <div className="flex items-center justify-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5 text-zinc-600" />
                      <span className="text-[10px] font-mono tracking-[0.25em] text-zinc-500 uppercase">AVG SCORE</span>
                    </div>
                    <div className="font-bold font-mono text-xl leading-none tabular-nums text-zinc-200">{stats.avgScore.toFixed(1)}<span className="text-zinc-600 text-sm">/100</span></div>
                  </div>
                  
                  <div className="p-4 bg-[#111111] flex flex-col items-center gap-1 text-center text-card bg-card">
                    <div className="flex items-center justify-center gap-2">
                      <Droplets className="h-3.5 w-3.5 text-zinc-600" />
                      <span className="text-[10px] font-mono tracking-[0.25em] text-zinc-500 uppercase">LIQUIDITY</span>
                    </div>
                    <div className="font-bold font-mono text-xl leading-none tabular-nums text-zinc-200">${(stats.totalLiquidity / 1000000).toFixed(2)}M</div>
                  </div>
                  
                  <div className="p-4 bg-[#111111] flex flex-col items-center gap-1 text-center bg-card">
                    <div className="flex items-center justify-center gap-2">
                      <Coins className="h-3.5 w-3.5 text-zinc-600" />
                      <span className="text-[10px] font-mono tracking-[0.25em] text-zinc-500 uppercase">TRACKED</span>
                    </div>
                    <div className="font-bold font-mono text-xl leading-none tabular-nums text-zinc-200">{stats.tokensTracked}</div>
                  </div>
                  
                  <div className="p-4 bg-[#111111] flex flex-col items-center gap-1 text-center bg-card">
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-zinc-600" />
                      <span className="text-[10px] font-mono tracking-[0.25em] text-zinc-500 uppercase">SOL</span>
                    </div>
                    {solPrice.loading ? (
                      <div className="text-sm text-zinc-600 font-mono">--</div>
                    ) : solPrice.error ? (
                      <div className="text-sm text-zinc-600 font-mono">--</div>
                    ) : (
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="font-bold font-mono text-xl leading-none tabular-nums text-zinc-200">${solPrice.price.toFixed(0)}</span>
                        <span className={`text-xs font-mono font-bold tabular-nums ${solPrice.change24h >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {solPrice.change24h >= 0 ? "+" : ""}{solPrice.change24h.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Terminal Status Bar - Desktop only */}
              <div className="hidden md:flex items-center justify-between mb-3 shrink-0 px-1">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className={`h-1.5 w-1.5 ${
                      dataFreshness?.status === "FRESH" ? "bg-green-500" :
                      dataFreshness?.status === "STALE" ? "bg-amber-500" :
                      dataFreshness?.status === "DEAD" ? "bg-red-500" : "bg-green-500"
                    }`} />
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-[0.3em] ${
                      dataFreshness?.status === "FRESH" ? "text-green-500/90" :
                      dataFreshness?.status === "STALE" ? "text-amber-500/90" :
                      dataFreshness?.status === "DEAD" ? "text-red-500/90" : "text-green-500/90"
                    }`}>{
                      dataFreshness?.status === "FRESH" ? "LIVE" :
                      dataFreshness?.status === "STALE" ? "STALE" :
                      dataFreshness?.status === "DEAD" ? "DATA PAUSED" : "LIVE"
                    }</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {allTokens.length} tokens tracked
                  </span>
                  {dataFreshness?.lastSnapshotAge && dataFreshness.status !== "FRESH" ? (
                    <span className={`text-[10px] font-mono ${
                      dataFreshness.status === "DEAD" ? "text-red-500/70" : "text-amber-500/70"
                    }`}>
                      {dataFreshness.lastSnapshotAge}
                    </span>
                  ) : updatedAt ? (
                    <span className="text-[10px] font-mono text-zinc-600">
                      {Math.round((Date.now() - updatedAt) / 60000)}m ago
                    </span>
                  ) : null}
                  <div className="h-3 w-px bg-zinc-800" />
                  <span className="text-[10px] font-mono tracking-[0.3em] text-zinc-600 uppercase">SOLANA ONLY</span>
                </div>
                <div className="flex items-center gap-2">

                  <Link href="/scoring">
                    <button className="text-[10px] font-mono font-bold tracking-widest uppercase px-2.5 py-1 border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-colors rounded-none bg-card">
                      SCORING
                    </button>
                  </Link>
                  <Link href="/pro">
                    <button className="text-[10px] font-mono font-bold tracking-widest uppercase px-2.5 py-1 border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-colors rounded-none bg-card">
                      PRO
                    </button>
                  </Link>
                  <div className="h-3 w-px bg-zinc-800" />
                  
                </div>
              </div>

              {/* Token List/Grid - FLEX GROW REGION */}
              <div className="flex-1 flex flex-col pb-4" style={{ minHeight: 0 }}>
                {isWarming ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="max-w-md w-full p-8 border border-zinc-800 bg-[#111111]">
                      <div className="flex items-center justify-center mb-6">
                        <div className="relative">
                          <div className="animate-spin h-16 w-16 border-2 border-zinc-800 border-t-green-500" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Activity className="h-6 w-6 text-green-500 animate-pulse" />
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-mono font-bold text-center mb-2 text-zinc-200 tracking-wider">
                        {'Scanning for Early Signals...'}
                      </h3>
                      
                      <p className="text-center text-zinc-500 font-mono text-sm mb-4">
                        SOLRAD only surfaces tokens showing verified on-chain momentum or structural change.
                      </p>
                      
                      <p className="text-center text-zinc-600 font-mono text-sm mb-6">
                        No qualified signals detected yet.
                      </p>
                      
                      <div className="text-center text-xs text-zinc-600 font-mono mb-4">
                        <p className="mb-1">{'Engine active \u00B7 Monitoring liquidity, volume, and score shifts in real time'}</p>
                        <p className="text-[10px] text-zinc-700">Lead-time proofs will appear here once detected.</p>
                      </div>
                      
                      <div className="space-y-3 mb-6">
                        {lastIngestAt && (
                          <div className="flex items-center justify-between text-sm font-mono">
                            <span className="text-zinc-500">Last Refresh:</span>
                            <span className="font-mono text-zinc-300">
                              {new Date(lastIngestAt).toLocaleTimeString()}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm font-mono">
                          <span className="text-zinc-500">Refresh Cadence:</span>
                          <span className="font-mono text-zinc-300">5 minutes</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={handleForceRefresh}
                        disabled={refreshing || refreshCooldown > 0}
                        className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono font-bold tracking-widest uppercase text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-zinc-700 rounded-none"
                      >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                        {refreshing 
                          ? "Refreshing..." 
                          : refreshCooldown > 0 
                            ? `Refresh available in ${refreshCooldown}s`
                            : "Force Refresh"}
                      </button>
                    </div>
                  </div>
                ) : loading && allTokens.length === 0 ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                  </div>
                ) : sortedAll.length === 0 ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="max-w-md w-full p-8 border border-zinc-800 bg-[#111111]">
                      <div className="flex items-center justify-center mb-4">
                        <Search className="h-12 w-12 text-zinc-700" />
                      </div>
                      <h3 className="text-lg font-mono font-bold text-center mb-2 text-zinc-300 tracking-wider">
                        No tokens match current criteria
                      </h3>
                      <p className="text-center text-sm font-mono text-zinc-500 mb-4">
                        {totalTokenCount > 0 
                          ? `Found ${totalTokenCount} token${totalTokenCount === 1 ? '' : 's'} in index, but none passed current filters.`
                          : "The token index is currently empty."}
                      </p>
                      {activeToggleNames.length > 0 && (
                        <p className="text-center text-xs font-mono text-zinc-600 mb-4">
                          Try disabling {activeToggleNames.length === 1
                            ? activeToggleNames[0]
                            : `${activeToggleNames.slice(0, -1).join(", ")} or ${activeToggleNames[activeToggleNames.length - 1]}`}.
                        </p>
                      )}
                      {hasAnyFilter && (
                        <div className="flex justify-center">
                          <button
                            onClick={clearAllFilters}
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-mono font-bold tracking-widest uppercase transition-colors border border-zinc-700 rounded-none"
                          >
                            Clear Filters
                          </button>
                        </div>
                      )}
                      {!hasAnyFilter && (
                        <p className="text-center text-xs font-mono text-zinc-600">
                          Check back soon for new tokens.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* INTELLIGENCE STATUS Strip - Consolidated */}
                    
                  
                    <div className="hidden md:flex items-center flex-wrap gap-2 mb-2">
                      <Link href="/watchlist">
                        <button className="flex items-center gap-1.5 px-2 py-1 border border-zinc-800 hover:border-zinc-600 transition-colors rounded-none bg-card">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-zinc-400">Watchlist</span>
                        </button>
                      </Link>
                      
                      {featureFlags.gemFinderMode && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-none">
                                <Coins className="h-3 w-3 text-cyan-400" />
                                <Label htmlFor="gem-finder" className="text-[10px] font-mono tracking-widest uppercase font-bold cursor-pointer text-zinc-400">
                                  GEM FINDER
                                </Label>
                                <Switch id="gem-finder" checked={gemFinderMode} onCheckedChange={setGemFinderMode} className="scale-75" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-[220px]">
                              <p className="text-xs font-mono">Show only tokens tagged GEM (diamond badge).</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}

                      {/* Lead-Time Only toggle */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-none">
                              <Activity className="h-3 w-3 text-emerald-400" />
                              <Label htmlFor="lead-time-only" className="text-[10px] font-mono tracking-widest uppercase font-bold cursor-pointer text-zinc-400">
                                LEAD-TIME
                              </Label>
                              <Switch id="lead-time-only" checked={leadTimeOnly} onCheckedChange={setLeadTimeOnly} className="scale-75" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-[220px]">
                            <p className="text-xs font-mono">Show tokens with lead-time proof available.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {/* Top Performers toggle */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-none">
                              <TrendingUp className="h-3 w-3 text-amber-400" />
                              <Label htmlFor="top-performers" className="text-[10px] font-mono tracking-widest uppercase font-bold cursor-pointer text-zinc-400">
                                TOP PERF
                              </Label>
                              <Switch id="top-performers" checked={topPerformersMode} onCheckedChange={setTopPerformersMode} className="scale-75" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-[220px]">
                            <p className="text-xs font-mono">Show highest scoring / strongest performers (score 70+).</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {/* Signal Winners toggle */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-none">
                              <Sparkles className="h-3 w-3 text-violet-400" />
                              <Label htmlFor="signal-winners" className="text-[10px] font-mono tracking-widest uppercase font-bold cursor-pointer text-zinc-400">
                                SIGNALS
                              </Label>
                              <Switch id="signal-winners" checked={signalWinnersMode} onCheckedChange={setSignalWinnersMode} className="scale-75" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-[220px]">
                            <p className="text-xs font-mono">Show tokens with strong signal outcomes (STRONG state).</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {/* Persistent Reset Filters control - always visible when any filter is active */}
                      {hasAnyFilter && (
                        <button
                          onClick={clearAllFilters}
                          className="flex items-center gap-1 px-2 py-1 border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors rounded-none"
                        >
                          <X className="h-3 w-3" />
                          <span className="text-[10px] font-mono tracking-widest uppercase font-bold">Reset filters</span>
                        </button>
                      )}
                    </div>



                    {/* Educational panel - collapsible */}
                    <div className="mb-2">
                      <HowToPanel />
                    </div>

                    {/* Desktop: 3-Column Terminal (hidden below md) - PART A.6 */}
  <DesktopTerminal
  trending={trendingView}
  active={activeView}
  newEarly={newEarlyView}
  freshSignals={freshSignalsView}
  all={sortedAll}
  updatedAt={updatedAt ?? undefined}
  stale={stale}
  staleSeverity={staleSeverity}
  refreshing={refreshing}
  liveWindowFallback={liveWindowFallback}
  leadTimeProofsMap={leadTimeProofsMap}
  />
                  </>
                )}
              </div>
            </div>

            {/* RIGHT: Proof Preview + Ad - xl+ (1280px+) */}
            <div className="hidden xl:flex xl:flex-col gap-2 min-w-0 w-full max-w-full h-full overflow-hidden">
              <ProofPreviewRail />
              <div className="flex-none mt-auto">
                <AAdsRightRail />
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer at bottom of fixed viewport */}
        <Footer />
      </div>
      
      {/* Welcome panel - slides up from bottom on first visit */}
      <WelcomePanel />

      {/* Token Detail Drawer - Controlled by ?token= query param */}
      {selectedToken && (
        <TokenDetailDrawer
          key={selectedToken.address}
          token={selectedToken}
          open={!!selectedToken}
          onOpenChange={(open) => {
            if (!open) handleDrawerClose()
          }}
        />
      )}
    </>
  )
}
