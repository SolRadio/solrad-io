"use client"

import type { TokenScore } from "@/lib/types"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatCompactUsd } from "@/lib/format"
import { normalizeMint } from "@/lib/lead-time/normalize-mint"
import { solscanToken, isValidMint, normalizeAddressCase } from "@/lib/explorers"
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Droplets,
  Copy,
  ExternalLink,
  Check,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Users,
  Shield,
  Clock,
  Layers,
  Info,
  Share2,
  Globe,
  Landmark,
  MessageCircle,
  Twitter,
  History,
} from "lucide-react"
import Image from "next/image"
import React, { useState, useEffect, useRef, useCallback } from "react"
import { useFreshQuote } from "@/hooks/use-fresh-quote"
import { WatchlistButton } from "@/components/watchlist-button"
import { useTokenHistory } from "@/hooks/use-token-history"
import { TokenSparkline } from "@/components/token-sparkline"
import { TokenChart } from "@/components/token-chart"
import { SourcesIndicator } from "@/components/sources-indicator"
import { ConvictionIcon } from "@/components/conviction-icon"
import { getScorePercentile, formatPercentile } from "@/lib/utils/score-percentile"
import { LeadTimeProofPanel } from "@/components/lead-time-proof-panel"
import { useLeadTime } from "@/hooks/use-lead-time"
import { SolradIntelPanel } from "@/components/solrad-intel-panel"

function TokenIntelContent({ address }: { address: string }) {
  const [intel, setIntel] = useState<{
    insight: string
    generatedAt: string
    metrics: { label: string; value: string }[]
  } | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    fetch(`/api/token/${address}/intel`)
      .then((r) => {
        if (!r.ok) throw new Error("fail")
        return r.json()
      })
      .then((data) => {
        if (!cancelled && data.insight) {
          setIntel(data)
          setLoading(false)
        } else if (!cancelled) {
          setError(true)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true)
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [address])

  if (loading) {
    return (
      <div className="space-y-2 py-1">
        <div className="h-3 w-full rounded bg-zinc-800 animate-pulse" />
        <div className="h-3 w-3/4 rounded bg-zinc-800 animate-pulse" />
      </div>
    )
  }

  if (error || !intel) {
    return <p className="text-xs text-zinc-600 font-mono py-1">Intel unavailable</p>
  }

  const cachedAgo = Math.floor((Date.now() - new Date(intel.generatedAt).getTime()) / 60000)

  return (
    <div className="space-y-2.5 py-0.5">
      <p className="text-[13px] text-zinc-300 leading-relaxed">{intel.insight}</p>
      <div className="flex flex-wrap gap-1.5">
        {intel.metrics.map((m) => (
          <span
            key={m.label}
            className="inline-flex items-center gap-1 text-[10px] font-mono bg-zinc-800 text-zinc-400 rounded-full px-2.5 py-1"
          >
            {m.label} {m.value}
          </span>
        ))}
      </div>
      <p className="text-[9px] font-mono text-zinc-600 text-right">
        {"AI \u00b7 cached "}{cachedAgo < 1 ? "just now" : `${cachedAgo}m ago`}
      </p>
    </div>
  )
}

interface TokenDetailDrawerProps {
  token: TokenScore
  open: boolean
  onOpenChange: (open: boolean) => void
  allScores?: number[]
  isStandalonePage?: boolean
}

export function TokenDetailDrawer({ token, open, onOpenChange, allScores = [], isStandalonePage = false }: TokenDetailDrawerProps) {
  const [copied, setCopied] = useState(false)
  const [copiedPair, setCopiedPair] = useState(false)
  
  // PART B: Fetch fresh quote while drawer is open (30-60s polling)
  const { quote, ageMinutes, rateLimited } = useFreshQuote(token.address, {
    enabled: open,
    pollInterval: 45000, // 45 seconds to reduce rate limit risk
  })
  
  // Proof Layer: Fetch token history for sparklines
  const { snapshots, loading: historyLoading } = useTokenHistory(token.address, {
    enabled: open,
    limit: 80,
    window: "24h",
  })
  
  // Lead-Time Proof: Fetch lead-time data (using normalized mint)
  const normalizedMint = normalizeMint(token.address)
  const { proofs, stats, pendingObservation, isPro, loading: leadTimeLoading } = useLeadTime(normalizedMint, {
    enabled: open && !!normalizedMint,
  })
  
  // Lifted intel fetch (shared between TokenIntelContent and SolradIntelPanel)
  const [panelIntel, setPanelIntel] = useState<{
    insight: string
    generatedAt: string
    metrics: { label: string; value: string }[]
  } | null>(null)
  const [panelIntelLoading, setPanelIntelLoading] = useState(true)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setPanelIntelLoading(true)
    fetch(`/api/token/${token.address}/intel`)
      .then((r) => {
        if (!r.ok) throw new Error("fail")
        return r.json()
      })
      .then((data) => {
        if (!cancelled && data.insight) {
          setPanelIntel(data)
          setPanelIntelLoading(false)
        } else if (!cancelled) {
          setPanelIntelLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setPanelIntelLoading(false)
      })
    return () => { cancelled = true }
  }, [open, token.address])

  // Use fresh quote values when available, fallback to cached token values
  const livePrice = quote?.priceUsd ?? token.priceUsd
  const liveChange24h = quote?.priceChange24h ?? token.priceChange24h
  const liveVolume24h = quote?.volume24h ?? token.volume24h
  const liveLiquidity = quote?.liquidityUsd ?? token.liquidity
  const liveFdv = quote?.fdv ?? token.fdv
  const liveMcap = quote?.mcap ?? token.marketCap
  const liveBuys = quote?.buys24h
  const liveSells = quote?.sells24h
  const liveTxns = quote?.txns24h
  // Holder concentration: fetched separately from /api/token/[mint] (quote endpoint doesn't include holders)
  const [liveHolders, setLiveHolders] = useState<{
    dataAvailable: boolean
    totalHolders: number
    top10Pct: number
    topWalletPct: number
    devWalletPct: number | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } | { dataAvailable: false; [key: string]: any } | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    fetch(`/api/token/${encodeURIComponent(token.address)}`)
      .then((r) => {
        if (!r.ok) throw new Error("fail")
        return r.json()
      })
      .then((data) => {
        if (!cancelled) {
          setLiveHolders(data.holders ?? null)
        }
      })
      .catch(() => {
        if (!cancelled) setLiveHolders(null)
      })
    return () => { cancelled = true }
  }, [open, token.address])
  // PART D: Use canonical dexUrl from token (passed through from Intel), then quote, then fallback
  const dexUrl = token.dexUrl ?? quote?.dexUrl ?? `https://dexscreener.com/solana/${token.address}`
  
  const isPositive = (liveChange24h ?? 0) >= 0

  // Sticky score header: IntersectionObserver on main header
  const headerRef = useRef<HTMLDivElement>(null)
  const [headerHidden, setHeaderHidden] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const headerObserverRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    ;(headerRef as React.MutableRefObject<HTMLDivElement | null>).current = node
    const observer = new IntersectionObserver(
      ([entry]) => setHeaderHidden(!entry.isIntersecting),
      { root: scrollRef.current, threshold: 0 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const handleCopy = async () => {
    // Normalize address to proper case before copying
    const normalizedAddress = normalizeAddressCase(token.address)
    await navigator.clipboard.writeText(normalizedAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyPair = async () => {
    if (token.pairAddress) {
      await navigator.clipboard.writeText(token.pairAddress)
      setCopiedPair(true)
      setTimeout(() => setCopiedPair(false), 2000)
    }
  }

  const handleShare = () => {
    const text = `$${token.symbol} on SOLRAD — score ${token.totalScore}/100`
    const normalizedMint = normalizeMint(token.address)
    const url = normalizedMint ? `https://www.solrad.io/token/${normalizedMint}` : "https://www.solrad.io/"
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    window.open(twitterUrl, "_blank", "noopener,noreferrer")
  }

  const tierLabel = token.totalScore >= 80 ? "TREASURE" : token.totalScore >= 55 ? "CAUTION" : "WARNING"

  const sources = token.sources?.map((s) => s.source) || []
  const hasMultipleSources = sources.length > 1

  // Build scoring factors - handle missing scoreBreakdown for watchlist placeholder tokens
  const sb = {
    liquidityScore: token.scoreBreakdown?.liquidityScore ?? 0,
    volumeScore: token.scoreBreakdown?.volumeScore ?? 0,
    activityScore: token.scoreBreakdown?.activityScore ?? 0,
    ageScore: token.scoreBreakdown?.ageScore ?? 0,
    healthScore: token.scoreBreakdown?.healthScore ?? 0,
  }

  const scoringFactors = [
    {
      label: "Liquidity Depth",
      value: sb.liquidityScore,
      description:
        token.liquidity > 100000
          ? "Strong liquidity pool"
          : token.liquidity > 10000
            ? "Moderate liquidity"
            : "Low liquidity",
      status:
        sb.liquidityScore >= 60
          ? "good"
          : sb.liquidityScore >= 40
            ? "neutral"
            : "warn",
    },
    {
      label: "Trading Volume",
      value: sb.volumeScore,
      description:
        token.volume24h > 500000
          ? "High trading activity"
          : token.volume24h > 10000
            ? "Moderate activity"
            : "Low activity",
      status:
        sb.volumeScore >= 60 ? "good" : sb.volumeScore >= 40 ? "neutral" : "warn",
    },
    {
      label: "Activity Ratio",
      value: sb.activityScore,
      description: "Volume-to-liquidity ratio indicates healthy trading",
      status:
        sb.activityScore >= 60
          ? "good"
          : sb.activityScore >= 40
            ? "neutral"
            : "warn",
    },
    {
      label: "Token Age",
      value: sb.ageScore,
      description:
        sb.ageScore >= 80
          ? "Established token (>1 week)"
          : sb.ageScore >= 60
            ? "Recent token (>1 day)"
            : "Very new token",
      status: sb.ageScore >= 60 ? "good" : sb.ageScore >= 30 ? "neutral" : "warn",
    },
    {
      label: "Health Score",
      value: sb.healthScore,
      description: "FDV/liquidity ratio and authority checks",
      status:
        sb.healthScore >= 60 ? "good" : sb.healthScore >= 40 ? "neutral" : "warn",
    },
  ]

  if (hasMultipleSources) {
    scoringFactors.push({
      label: "Multi-Source Bonus",
      value: 10,
      description: `Seen on ${sources.length} sources: ${sources.join(", ")}`,
      status: "good",
    })
  }

  if (token.heliusData) {
    scoringFactors.push({
      label: "Holder Distribution",
      value: token.heliusData.topHolderPercentage
        ? 100 - token.heliusData.topHolderPercentage
        : sb.healthScore,
      description: token.heliusData.topHolderPercentage
        ? `Top holder: ${token.heliusData.topHolderPercentage.toFixed(1)}%`
        : "Holder data not available",
      status:
        token.heliusData.topHolderPercentage && token.heliusData.topHolderPercentage > 50
          ? "warn"
          : token.heliusData.topHolderPercentage && token.heliusData.topHolderPercentage > 30
            ? "neutral"
            : "good",
    })

    if (token.heliusData.mintAuthority !== undefined || token.heliusData.freezeAuthority !== undefined) {
      scoringFactors.push({
        label: "Authority Status",
        value:
          token.heliusData.mintAuthority === null && token.heliusData.freezeAuthority === null
            ? 100
            : token.heliusData.mintAuthority === null || token.heliusData.freezeAuthority === null
              ? 50
              : 0,
        description:
          token.heliusData.mintAuthority === null && token.heliusData.freezeAuthority === null
            ? "Authorities renounced (safer)"
            : "Authorities present (risk)",
        status:
          token.heliusData.mintAuthority === null && token.heliusData.freezeAuthority === null
            ? "good"
            : token.heliusData.mintAuthority === null || token.heliusData.freezeAuthority === null
              ? "neutral"
              : "warn",
      })
    }
  }

  const riskTooltips = {
    "LOW RISK": "No major red flags detected from available liquidity/volume/age/holder signals.",
    "MEDIUM RISK": "Some caution signals detected (thin liquidity, very new, or imbalanced activity).",
    "HIGH RISK":
      "Multiple red flags detected (very thin liquidity, extreme FDV/liquidity, very new token, high holder concentration, or unsafe authorities when available).",
  }

  const content = (
    <>
        <div ref={scrollRef} className={`flex-1 overflow-y-auto pb-24 px-4 sm:px-6 thin-scrollbar ${isStandalonePage ? "max-w-2xl mx-auto w-full" : ""}`}>
          {/* Sticky score header — appears when main header scrolls out */}
          {headerHidden && (
            <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 h-10 bg-[#0a0a0a]/90 backdrop-blur border-b border-zinc-800 flex items-center gap-2 font-mono text-xs">
              <span className="font-bold text-foreground truncate">${token.symbol}</span>
              <span className="text-zinc-500">{"\u00B7"}</span>
              <span className="text-accent font-bold tabular-nums">{token.totalScore ?? "--"}/100</span>
              <span className="text-zinc-500">{"\u00B7"}</span>
              <span className={`font-semibold ${
                token.totalScore >= 80 ? "text-green-400" :
                token.totalScore >= 55 ? "text-yellow-400" : "text-red-400"
              }`}>{tierLabel}</span>
            </div>
          )}
          <SheetHeader ref={headerObserverRef} className="mb-5 min-w-0 pt-5">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted/50 flex items-center justify-center border border-border/60 shrink-0">
                {token.imageUrl ? (
                  <Image
                    src={token.imageUrl || "/placeholder.svg"}
                    alt={token.symbol || "Token"}
                    width={56}
                    height={56}
                    className="rounded-lg"
                  />
                ) : (
                  <span className="text-xl font-bold font-mono uppercase text-muted-foreground">{token.symbol?.[0] || "?"}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-2xl uppercase font-bold font-mono truncate tracking-tight">{token.symbol}</SheetTitle>
                <p className="text-sm text-muted-foreground truncate leading-tight">{token.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={handleCopy}
                    className="text-[11px] font-mono text-muted-foreground/50 hover:text-foreground transition-colors"
                    title="Click to copy full address"
                  >
                    {token.address.slice(0, 6)}...{token.address.slice(-4)}
                    {copied && <span className="ml-1 text-green-500">copied</span>}
                  </button>
                  {sources.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {sources.includes("dexscreener") && (
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-secondary/80 border border-border/50 text-muted-foreground">
                          DEX
                        </span>
                      )}
                      {hasMultipleSources && (
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-secondary/80 border border-border/50 text-muted-foreground">
                          MULTI
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </SheetHeader>

          {/* Key Metrics Strip */}
          <div className="mb-4 grid grid-cols-3 sm:grid-cols-5 gap-px bg-border/30 rounded-lg overflow-hidden border border-border/40">
            <div className="px-2 py-2.5 bg-card text-center">
              <div className="text-[9px] font-mono uppercase text-muted-foreground/50 tracking-wider mb-0.5">PRICE</div>
              <div className="text-sm font-mono font-semibold tabular-nums truncate">${livePrice?.toFixed(livePrice < 0.01 ? 6 : 2) ?? "--"}</div>
            </div>
            <div className="px-2 py-2.5 bg-card text-center">
              <div className="text-[9px] font-mono uppercase text-muted-foreground/50 tracking-wider mb-0.5">24H</div>
              <div className={`text-sm font-mono font-bold tabular-nums truncate ${isPositive ? "text-green-400" : "text-red-400"}`}>
                {isPositive ? "+" : ""}{liveChange24h?.toFixed(1) ?? "0"}%
              </div>
            </div>
            <div className="px-2 py-2.5 bg-card text-center">
              <div className="text-[9px] font-mono uppercase text-muted-foreground/50 tracking-wider mb-0.5">LIQ</div>
              <div className="text-sm font-mono font-semibold tabular-nums truncate">{formatCompactUsd(liveLiquidity)}</div>
            </div>
            <div className="px-2 py-2.5 bg-card text-center">
              <div className="text-[9px] font-mono uppercase text-muted-foreground/50 tracking-wider mb-0.5">VOL</div>
              <div className="text-sm font-mono font-semibold tabular-nums truncate">{formatCompactUsd(liveVolume24h)}</div>
            </div>
            <div className="px-2 py-2.5 bg-card text-center">
              <div className="text-[9px] font-mono uppercase text-muted-foreground/50 tracking-wider mb-0.5">SCORE</div>
              <div className="text-sm font-mono font-bold tabular-nums text-accent truncate">{token.totalScore ?? "--"}</div>
            </div>
          </div>

          {/* Official Links */}
          <div className="mb-4 p-3 rounded-lg bg-card border border-border/40">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-mono font-semibold uppercase text-muted-foreground/60 tracking-wider">LINKS</h3>
              <WatchlistButton
                mint={token.address}
                tokenMeta={{
                  symbol: token.symbol,
                  name: token.name,
                  image: token.imageUrl,
                }}
                size="sm"
                showLabel
                className="h-7"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Solscan Token Link - with safety guard */}
              {isValidMint(token.address) ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs bg-transparent"
                  onClick={() => window.open(solscanToken(token.address), "_blank", "noopener,noreferrer")}
                >
                  <Globe className="h-3 w-3 mr-1.5" />
                  Solscan
                </Button>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs bg-transparent opacity-50"
                        disabled
                      >
                        <Globe className="h-3 w-3 mr-1.5" />
                        Solscan
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Mint unavailable</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-xs bg-transparent"
                onClick={() => window.open(dexUrl, "_blank")}
              >
                <ExternalLink className="h-3 w-3 mr-1.5" />
                DexScreener
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs bg-transparent"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-3 w-3 mr-1.5 text-green-500" /> : <Copy className="h-3 w-3 mr-1.5" />}
                {copied ? "Copied" : "Copy Mint"}
              </Button>
              {token.pairAddress && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs bg-transparent"
                  onClick={handleCopyPair}
                >
                  {copiedPair ? <Check className="h-3 w-3 mr-1.5 text-green-500" /> : <Copy className="h-3 w-3 mr-1.5" />}
                  {copiedPair ? "Copied" : "Copy Pair"}
                </Button>
              )}
              {quote?.website && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs bg-transparent"
                  onClick={() => window.open(quote.website, "_blank")}
                >
                  <Globe className="h-3 w-3 mr-1.5" />
                  Website
                </Button>
              )}
              {quote?.twitter && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs bg-transparent"
                  onClick={() => window.open(quote.twitter, "_blank")}
                >
                  <Twitter className="h-3 w-3 mr-1.5" />
                  Twitter
                </Button>
              )}
              {quote?.telegram && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs bg-transparent"
                  onClick={() => window.open(quote.telegram, "_blank")}
                >
                  <MessageCircle className="h-3 w-3 mr-1.5" />
                  Telegram
                </Button>
              )}
              {quote?.discord && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs bg-transparent"
                  onClick={() => window.open(quote.discord, "_blank")}
                >
                  <MessageCircle className="h-3 w-3 mr-1.5" />
                  Discord
                </Button>
              )}
            </div>
            {/* Jupiter Trade Deep Link */}
            <div className="mt-3 pt-3 border-t border-border/30">
              <a
                href={`https://jup.ag/?inputMint=So11111111111111111111111111111111111111112&outputMint=${token.address}&buy=${token.address}&sell=So11111111111111111111111111111111111111112`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full text-sm font-mono font-semibold border border-green-500/40 text-green-500 hover:bg-green-500/10 rounded-md px-4 py-2.5 transition-colors"
              >
                TRADE ON JUPITER
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Price & Change - PART B: Uses fresh quote when available */}
          <div className="mb-4 p-3 rounded-lg bg-card border border-border/40">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider mb-1">PRICE</div>
                <div className="text-2xl font-bold font-mono tabular-nums">
                  ${livePrice?.toFixed(livePrice < 0.01 ? 8 : 4) ?? "0.00"}
                </div>
              </div>
              <div
                className={`flex items-center gap-2 text-lg font-mono font-bold tabular-nums ${
                  isPositive ? "text-green-400" : "text-red-400"
                }`}
              >
                {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                {isPositive ? "+" : ""}
                {liveChange24h?.toFixed(2) ?? "0.00"}%
              </div>
            </div>
            {/* PART B: LIVE/STALE indicator with rate limit awareness */}
            <div className="mt-2.5 pt-2 border-t border-border/30 text-xs flex items-center gap-2">
              {quote?.stale || rateLimited || (ageMinutes !== null && ageMinutes > 2) ? (
                <span className="inline-flex items-center gap-1.5 text-yellow-500 font-mono text-[10px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
                  {rateLimited ? "RATE LIMITED" : "STALE"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-green-500 font-mono text-[10px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  LIVE
                </span>
              )}
              {ageMinutes !== null && Number.isFinite(ageMinutes) && ageMinutes >= 0 ? (
                <span className="text-muted-foreground/50 text-[10px] font-mono">Updated {ageMinutes}m ago</span>
              ) : quote ? (
                <span className="text-muted-foreground/50 text-[10px] font-mono">Updated recently</span>
              ) : null}
            </div>
          </div>
          
          {/* Chart + Intel: flex column with mobile reorder */}
          <div className="flex flex-col">
            {/* Price Chart (Lightweight Charts) */}
            <div className="order-2 sm:order-1">
              <TokenChart
                symbol={token.symbol}
                mint={token.address}
                snapshots={snapshots}
                loading={historyLoading}
              />
            </div>

            {/* SOLRAD INTEL PANEL — Hero Centerpiece (first on mobile) */}
            <div className="order-first sm:order-2">
              <SolradIntelPanel
                token={token}
                snapshots={snapshots}
                intel={panelIntel}
                intelLoading={panelIntelLoading}
                leadTimeProofs={proofs}
                leadTimeStats={stats}
                leadTimeLoading={leadTimeLoading}
              />
            </div>
          </div>

          {/* Detail Layer -- collapsed accordions */}
          <Accordion type="multiple" defaultValue={[]} className="mb-4">
            {/* ON-CHAIN ACTIVITY */}
            <AccordionItem value="on-chain" className="border border-border/40 rounded-lg px-3 mb-2">
              <AccordionTrigger className="text-xs font-mono font-semibold uppercase hover:no-underline py-2.5 tracking-wide">
                <div className="flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5" />
                  ON-CHAIN ACTIVITY
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase">24h Volume</div>
                    <div className="font-mono text-sm">{formatCompactUsd(liveVolume24h)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase">Liquidity</div>
                    <div className="font-mono text-sm">{formatCompactUsd(liveLiquidity)}</div>
                  </div>
                  {liveBuys !== undefined && liveSells !== undefined && (
                    <>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase">24h Buys</div>
                        <div className="font-mono text-sm text-green-500">{liveBuys.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase">24h Sells</div>
                        <div className="font-mono text-sm text-red-500">{liveSells.toLocaleString()}</div>
                      </div>
                    </>
                  )}
                  {liveTxns !== undefined && (
                    <div>
                      <div className="text-xs text-muted-foreground uppercase">24h Transactions</div>
                      <div className="font-mono text-sm">{liveTxns.toLocaleString()}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs text-muted-foreground uppercase">FDV</div>
                    <div className="font-mono text-sm">{liveFdv ? formatCompactUsd(liveFdv) : "\u2014"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase">Mkt Cap</div>
                    <div className="font-mono text-sm">{liveMcap ? formatCompactUsd(liveMcap) : "\u2014"}</div>
                  </div>
                  {token.pairCreatedAt && (
                    <div>
                      <div className="text-xs text-muted-foreground uppercase">Pair Age</div>
                      <div className="font-mono text-sm">
                        {Math.round((Date.now() - token.pairCreatedAt) / (1000 * 60 * 60 * 24))}d
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* SAFETY SNAPSHOT */}
            <AccordionItem value="safety" className="border border-border/40 rounded-lg px-3 mb-2">
              <AccordionTrigger className="text-xs font-mono font-semibold uppercase hover:no-underline py-2.5 tracking-wide">
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5" />
                  SAFETY SNAPSHOT
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-xs text-muted-foreground">Risk Level</span>
                    <Badge
                      variant="outline"
                      className={
                        token.riskLabel === "LOW RISK"
                          ? "bg-green-500/20 text-green-400 border-green-500/50 text-xs"
                          : token.riskLabel === "MEDIUM RISK"
                            ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50 text-xs"
                            : "bg-red-500/20 text-red-400 border-red-500/50 text-xs"
                      }
                    >
                      {token.riskLabel ?? "UNKNOWN"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-xs text-muted-foreground">Liquidity Depth</span>
                    <Badge
                      variant="outline"
                      className={
                        (liveLiquidity ?? 0) > 500000
                          ? "bg-green-500/20 text-green-400 border-green-500/50 text-xs"
                          : (liveLiquidity ?? 0) >= 50000
                            ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50 text-xs"
                            : "bg-red-500/20 text-red-400 border-red-500/50 text-xs"
                      }
                    >
                      {(liveLiquidity ?? 0) > 500000 ? "DEEP" : (liveLiquidity ?? 0) >= 50000 ? "MODERATE" : "THIN"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-xs text-muted-foreground">Wash Trading Risk</span>
                    {(() => {
                      const volLiq = (liveVolume24h && liveLiquidity && liveLiquidity > 0) ? liveVolume24h / liveLiquidity : 0
                      const isHigh = token.washTrading?.risk === "HIGH" || token.washTrading?.suspected || volLiq > 20
                      return (
                        <Badge
                          variant="outline"
                          className={isHigh
                            ? "bg-red-500/20 text-red-400 border-red-500/50 text-xs"
                            : "bg-green-500/20 text-green-400 border-green-500/50 text-xs"
                          }
                        >
                          {isHigh ? "HIGH" : "LOW"}
                        </Badge>
                      )
                    })()}
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-xs text-muted-foreground">FDV / Liquidity</span>
                    <span className="text-xs font-mono">
                      {liveFdv && liveLiquidity ? `${(liveFdv / liveLiquidity).toFixed(1)}x` : "\u2014"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-xs text-muted-foreground">Token Age</span>
                    <span className="text-xs font-mono">
                      {token.pairCreatedAt ? `${Math.round((Date.now() - token.pairCreatedAt) / (1000 * 60 * 60 * 24))}d` : "Unknown"}
                    </span>
                  </div>
                  {token.heliusData && (
                    <>
                      {token.heliusData.topHolderPercentage !== undefined && (
                        <div className="flex items-center justify-between py-2 border-b border-border/50">
                          <span className="text-xs text-muted-foreground">Insider Risk</span>
                          <Badge
                            variant="outline"
                            className={
                              token.heliusData.topHolderPercentage > 50
                                ? "bg-red-500/20 text-red-400 border-red-500/50 text-xs"
                                : token.heliusData.topHolderPercentage > 30
                                  ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50 text-xs"
                                  : "bg-green-500/20 text-green-400 border-green-500/50 text-xs"
                            }
                          >
                            {token.heliusData.topHolderPercentage > 50 ? "High" : token.heliusData.topHolderPercentage > 30 ? "Medium" : "Low"}
                          </Badge>
                        </div>
                      )}
                      <div className="flex items-center justify-between py-2 border-b border-border/50">
                        <span className="text-xs text-muted-foreground">Mint Authority</span>
                        <Badge variant="outline" className={
                          token.heliusData.mintAuthority === null
                            ? "bg-green-500/20 text-green-400 border-green-500/50 text-xs"
                            : token.heliusData.mintAuthority === undefined
                              ? "bg-gray-500/20 text-gray-400 border-gray-500/50 text-xs"
                              : "bg-red-500/20 text-red-400 border-red-500/50 text-xs"
                        }>
                          {token.heliusData.mintAuthority === null ? "Renounced" : token.heliusData.mintAuthority === undefined ? "Unknown" : "Present"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-border/50">
                        <span className="text-xs text-muted-foreground">Freeze Authority</span>
                        <Badge variant="outline" className={
                          token.heliusData.freezeAuthority === null
                            ? "bg-green-500/20 text-green-400 border-green-500/50 text-xs"
                            : token.heliusData.freezeAuthority === undefined
                              ? "bg-gray-500/20 text-gray-400 border-gray-500/50 text-xs"
                              : "bg-red-500/20 text-red-400 border-red-500/50 text-xs"
                        }>
                          {token.heliusData.freezeAuthority === null ? "Renounced" : token.heliusData.freezeAuthority === undefined ? "Unknown" : "Present"}
                        </Badge>
                      </div>
                    </>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* HOLDER CONCENTRATION */}
            <AccordionItem value="holders" className="border border-border/40 rounded-lg px-3 mb-2">
              <AccordionTrigger className="text-xs font-mono font-semibold uppercase hover:no-underline py-2.5 tracking-wide">
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" />
                  HOLDER CONCENTRATION
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-2">
            {liveHolders?.dataAvailable === false ? (
              /* Token returned no holder data from RPC */
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">Total Holders</span>
                  <span className="text-xs font-mono text-muted-foreground">{"\u2014"}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">Top 10 Hold</span>
                  <span className="text-xs font-mono text-muted-foreground">{"\u2014"}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">Top Wallet</span>
                  <span className="text-xs font-mono text-muted-foreground">{"\u2014"}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">Dev Wallet</span>
                  <span className="text-xs font-mono text-muted-foreground">{"\u2014"}</span>
                </div>
                <p className="text-xs font-mono text-zinc-600 pt-1">Holder data unavailable for this token</p>
              </div>
            ) : liveHolders?.dataAvailable ? (
              /* Real data */
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">Total Holders</span>
                  <span className="text-xs font-mono font-semibold">{liveHolders.totalHolders.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">Top 10 Hold</span>
                  <Badge
                    variant="outline"
                    className={
                      liveHolders.top10Pct > 50
                        ? "bg-red-500/20 text-red-400 border-red-500/50 text-xs"
                        : liveHolders.top10Pct > 30
                          ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50 text-xs"
                          : "bg-green-500/20 text-green-400 border-green-500/50 text-xs"
                    }
                  >
                    {`${liveHolders.top10Pct.toFixed(1)}%`}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">Top Wallet</span>
                  <span className="text-xs font-mono">{`${liveHolders.topWalletPct.toFixed(1)}%`}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">Dev Wallet</span>
                  <Badge
                    variant="outline"
                    className={
                      liveHolders.devWalletPct != null && liveHolders.devWalletPct > 5
                        ? "bg-red-500/20 text-red-400 border-red-500/50 text-xs"
                        : liveHolders.devWalletPct != null && liveHolders.devWalletPct > 0
                          ? "bg-red-500/20 text-red-400 border-red-500/50 text-xs"
                          : "bg-green-500/20 text-green-400 border-green-500/50 text-xs"
                    }
                  >
                    {liveHolders.devWalletPct != null && liveHolders.devWalletPct > 0
                      ? `${liveHolders.devWalletPct.toFixed(1)}%`
                      : "CLEAN"}
                  </Badge>
                </div>
                {/* Top holders bar */}
                <div className="pt-1">
                  <div className="flex gap-px h-2 rounded-full overflow-hidden bg-zinc-800">
                    <div
                      className="bg-red-500/70 rounded-l-full"
                      style={{ width: `${Math.min(liveHolders.topWalletPct, 100)}%` }}
                      title={`Top wallet: ${liveHolders.topWalletPct.toFixed(1)}%`}
                    />
                    <div
                      className="bg-amber-500/70"
                      style={{ width: `${Math.min(Math.max(liveHolders.top10Pct - liveHolders.topWalletPct, 0), 100)}%` }}
                      title={`Top 2-10: ${(liveHolders.top10Pct - liveHolders.topWalletPct).toFixed(1)}%`}
                    />
                    <div
                      className="bg-green-500/70 rounded-r-full flex-1"
                      title={`Others: ${(100 - liveHolders.top10Pct).toFixed(1)}%`}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] font-mono text-muted-foreground/50">concentrated</span>
                    <span className="text-[9px] font-mono text-muted-foreground/50">distributed</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Still loading or fetch error (liveHolders is null) */
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">Total Holders</span>
                  <span className="text-xs font-mono text-muted-foreground">{"\u2014"}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">Top 10 Hold</span>
                  <span className="text-xs font-mono text-muted-foreground">{"\u2014"}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">Top Wallet</span>
                  <span className="text-xs font-mono text-muted-foreground">{"\u2014"}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">Dev Wallet</span>
                  <span className="text-xs font-mono text-muted-foreground">{"\u2014"}</span>
                </div>
                {quote && (
                  <p className="text-xs font-mono text-zinc-600 pt-1">On-chain data unavailable</p>
                )}
              </div>
            )}
              </AccordionContent>
            </AccordionItem>

            {/* HISTORY (24H) */}
            <AccordionItem value="history" className="border border-border/40 rounded-lg px-3 mb-2">
              <AccordionTrigger className="text-xs font-mono font-semibold uppercase hover:no-underline py-2.5 tracking-wide">
                <div className="flex items-center gap-2">
                  <History className="h-3.5 w-3.5" />
                  HISTORY (24H)
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-2">
                {historyLoading ? (
                  <div className="text-xs text-muted-foreground text-center py-4">Loading history...</div>
                ) : snapshots.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-4">No history yet</div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-2.5 rounded-lg bg-card border">
                      <TokenSparkline values={snapshots.map((s) => s.price)} height={24} width={120} color="#22c55e" showMomentum label="PRICE" />
                    </div>
                    <div className="p-2.5 rounded-lg bg-card border">
                      <TokenSparkline values={snapshots.map((s) => s.solradScore)} height={24} width={120} color="#a855f7" showMomentum label="SCORE" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t">
                      <div className="text-xs">
                        <div className="text-muted-foreground mb-0.5">{"Delta Price (24h)"}</div>
                        <div className="font-mono font-semibold">
                          {snapshots.length >= 2
                            ? `${(((snapshots[snapshots.length - 1].price - snapshots[0].price) / snapshots[0].price) * 100).toFixed(1)}%`
                            : "\u2014"}
                        </div>
                      </div>
                      <div className="text-xs">
                        <div className="text-muted-foreground mb-0.5">{"Delta Score (24h)"}</div>
                        <div className="font-mono font-semibold">
                          {snapshots.length >= 2
                            ? `${(snapshots[snapshots.length - 1].solradScore - snapshots[0].solradScore).toFixed(0)} pts`
                            : "\u2014"}
                        </div>
                      </div>
                      <div className="text-xs col-span-2">
                        <div className="text-muted-foreground mb-0.5">Last snapshot</div>
                        <div className="font-mono">
                          {snapshots.length > 0
                            ? `${Math.round((Date.now() - snapshots[snapshots.length - 1].ts) / 60000)}m ago`
                            : "\u2014"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* DATA SOURCES */}
            <AccordionItem value="data-sources" className="border border-border/40 rounded-lg px-3 mb-2">
              <AccordionTrigger className="text-xs font-mono font-semibold uppercase hover:no-underline py-2.5 tracking-wide">
                <div className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5" />
                  DATA SOURCES
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-2">
                {(() => {
                  const hasMarketData = Boolean(token.priceUsd || token.liquidity || token.volume24h || token.dexUrl)
                  const effectiveSources = token.sources && token.sources.length > 0
                    ? token.sources
                    : hasMarketData
                      ? [{ source: "dexscreener" as const, priceChange24h: 0, volume24h: 0, liquidity: 0, timestamp: Date.now() }]
                      : []
                  if (effectiveSources.length === 0) {
                    return <p className="text-xs text-muted-foreground">No source data available</p>
                  }
                  return (
                    <div className="flex items-center gap-2">
                      <SourcesIndicator sources={effectiveSources} />
                      <span className="text-xs text-muted-foreground">
                        Aggregated from {effectiveSources.length} source{effectiveSources.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  )
                })()}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="mb-6">
            <h3 className="text-[10px] font-mono font-semibold uppercase text-muted-foreground/60 tracking-wider mb-2">FULL MINT ADDRESS</h3>
            <div className="flex items-center gap-2 min-w-0">
              <code className="flex-1 text-[11px] font-mono bg-muted/30 px-3 py-2.5 rounded-lg break-all w-full max-w-full overflow-hidden border border-border/30 text-muted-foreground">
                {token.address}
              </code>
            </div>
          </div>
        </div>

        {/* Sticky trade bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-zinc-800 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] flex gap-2 z-50">
          <Button
            variant="outline"
            className="flex-1 uppercase text-xs font-mono font-bold bg-transparent border-zinc-700 hover:border-zinc-500"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-3.5 w-3.5 mr-1.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
            {copied ? "COPIED" : "COPY CA"}
          </Button>
          <Button
            className="flex-[2] uppercase text-xs font-mono font-bold bg-green-600 hover:bg-green-500 text-white border-0"
            onClick={() => window.open(
              `https://jup.ag/?inputMint=So11111111111111111111111111111111111111112&outputMint=${token.address}&buy=${token.address}&sell=So11111111111111111111111111111111111111112`,
              "_blank",
              "noopener,noreferrer"
            )}
          >
            TRADE ON JUPITER
            <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </div>
    </>
  )

  if (isStandalonePage) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {content}
      </div>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto pb-0 flex flex-col bg-background border-l border-border/60">
        {content}
      </SheetContent>
    </Sheet>
  )
}
