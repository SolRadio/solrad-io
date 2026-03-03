"use client"

import { useMemo } from "react"

import { useEffect } from "react"

import type React from "react"
import { useState, useRef } from "react"
import type { TokenScore } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Droplets,
  Copy,
  ExternalLink,
  Check,
  Share2,
  ChevronDown,
  ChevronUp,
  Globe,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
  ImageIcon,
  Zap,
} from "lucide-react"
import Image from "next/image"
import { TokenDetailDrawer } from "./token-detail-drawer"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { generateShareCardSVG, svgToPng, type ShareCardFormat } from "@/lib/share-card-generator"
import { SignalBadges } from "./signal-badges"
import { WhyFlagged } from "./why-flagged"
import { ActivityHealth } from "./activity-health"
import { TokenMicroBadge } from "./token-micro-badge"
import { computeSignalScoreV2, computeQualityScore, computeReadinessScore, computeGemScore, computeActivityRatio } from "@/lib/scoring-v2"
import { featureFlags } from "@/lib/featureFlags"
import { normalizeMint } from "@/lib/solana/normalizeMint"
import { normalizeAddressCase } from "@/lib/explorers"
import { WatchlistButton } from "@/components/watchlist-button"
import { useWatchlist } from "@/hooks/use-watchlist"

interface TokenCardGridProps {
  token: TokenScore
  rank: number
}

export function TokenCardGrid({ token, rank }: TokenCardGridProps) {
  const { isWatched } = useWatchlist()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [insightExpanded, setInsightExpanded] = useState(false)
  const [debugExpanded, setDebugExpanded] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState(false)
  const [summaryExpanded, setSummaryExpanded] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [copyingImage, setCopyingImage] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null)
  const [usedFallback, setUsedFallback] = useState(false)
  const [animatedScore, setAnimatedScore] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const { toast } = useToast()
  const isPositive = (token.priceChange24h ?? 0) >= 0
  const shareCardRef = useRef<HTMLDivElement>(null)
  const [shareFormat, setShareFormat] = useState<ShareCardFormat>("square")
  const ratio = token.activityRatio; // Declare the ratio variable

  // What Changed? - simple text-only diff
  const getChangeStatus = () => {
    const change = token.priceChange24h ?? 0
    const volumeToLiq = (token.volume24h ?? 0) / Math.max(token.liquidity ?? 1, 1)
    
    if (Math.abs(change) < 2) return "Score unchanged"
    if (volumeToLiq > 1.5) return "Volume cooling"
    if (change > 10) return "Liquidity improving"
    if (change < -10) return "Volume cooling"
    return null
  }

  const changeStatus = getChangeStatus()

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Normalize address to proper case before copying
    const normalizedAddress = normalizeAddressCase(token.address)
    await navigator.clipboard.writeText(normalizedAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShareModalOpen(true)
  }

  const handleShareModalClose = (open: boolean) => {
    if (!open && previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      setPreviewBlob(null)
    }
    setShareModalOpen(open)
    setPreviewLoading(false)
    setPreviewError(null)
  }

  const handleDownloadCard = async () => {
    setDownloading(true)
    try {
      let blob = previewBlob

      if (!blob) {
        blob = await generateShareCardBlob()
      }

      if (!blob) {
        throw new Error("Failed to generate share card")
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `SOLRAD_${token.symbol}_${token.address.slice(0, 4)}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast({
        title: "Downloaded",
        description: "Share card saved to your device",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download share card",
        variant: "destructive",
      })
    } finally {
      setDownloading(false)
    }
  }

  const handleCopyImage = async () => {
    setCopyingImage(true)
    try {
      let blob = previewBlob

      if (!blob) {
        blob = await generateShareCardBlob()
      }

      if (!blob) {
        throw new Error("Failed to generate share card")
      }

      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

      if (navigator.clipboard && ClipboardItem && !isIOS) {
        const item = new ClipboardItem({ "image/png": blob })
        await navigator.clipboard.write([item])
        toast({
          title: "Copied to clipboard",
          description: "Share card image ready to paste",
        })
      } else {
        toast({
          title: isIOS ? "Copy not supported on iOS" : "Clipboard not supported",
          description: "Use Download instead",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy image",
        variant: "destructive",
      })
    } finally {
      setCopyingImage(false)
    }
  }

  const handleExternalLink = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    window.open(`https://dexscreener.com/solana/${token.address}`, "_blank")
  }

  const toggleInsight = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setInsightExpanded(!insightExpanded)
  }

  const toggleDebug = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDebugExpanded(!debugExpanded)
  }

  const toggleMobileCard = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setMobileExpanded(!mobileExpanded)
  }

  const handleCopyShareLink = async () => {
    try {
      // Use canonical URL format: /token/{mint}?share=1
      const shareUrl = `${window.location.origin}/token/${token.address}?share=1`
      await navigator.clipboard.writeText(shareUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
      toast({
        title: "Link copied",
        description: "Share link copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      })
    }
  }

  const handleCopyForTwitter = async () => {
    setCopyingImage(true)
    try {
      let blob = previewBlob

      if (!blob) {
        blob = await generateShareCardBlob()
      }

      if (!blob) {
        throw new Error("Failed to generate share card")
      }

      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

      if (navigator.clipboard && ClipboardItem && !isIOS) {
        const item = new ClipboardItem({ "image/png": blob })
        await navigator.clipboard.write([item])

        // Copy prefilled caption
        const caption = `🚨 SOLRAD RADAR HIT\n$${token.symbol} — Score ${token.totalScore}\nLive Solana market intel\nsolrad.io`
        await navigator.clipboard.writeText(caption)

        toast({
          title: "Copied for X",
          description: "Image and caption copied to clipboard",
        })
      } else {
        toast({
          title: isIOS ? "Copy not supported on iOS" : "Clipboard not supported",
          description: "Use Download instead",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy for X",
        variant: "destructive",
      })
    } finally {
      setCopyingImage(false)
    }
  }

  const generateShareCardBlob = async (): Promise<Blob | null> => {
    try {
      setPreviewLoading(true)
      setPreviewError(null)
      setUsedFallback(false)

      console.info("[v0] Generating share card using SVG renderer", { format: shareFormat })
      const svgString = generateShareCardSVG(token, shareFormat)
      const blob = await svgToPng(svgString)

      setPreviewBlob(blob)
      setPreviewUrl(URL.createObjectURL(blob))
      setPreviewLoading(false)
      return blob
    } catch (error: any) {
      console.info("[v0] Share card generation failed", { reason: error?.message || "Unknown error" })
      setPreviewError(`Failed to generate share card: ${error.message}`)
      setPreviewLoading(false)
      return null
    }
  }

  const riskColors = {
    "LOW RISK": "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/50",
    "MEDIUM RISK": "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/50",
    "HIGH RISK": "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/50",
  }

  const riskTooltips = {
    "LOW RISK": "No major red flags detected from available liquidity/volume/age/holder signals.",
    "MEDIUM RISK": "Some caution signals detected (thin liquidity, very new, or imbalanced activity).",
    "HIGH RISK":
      "Multiple red flags detected (very thin liquidity, extreme FDV/liquidity, very new token, high holder concentration, or unsafe authorities when available).",
  }

  const tierLabel = token.totalScore >= 80 ? "TREASURE" : token.totalScore >= 55 ? "CAUTION" : "WARNING"
  const tierColor =
    token.totalScore >= 80
      ? "bg-green-500/20 text-green-400 border-green-500/50"
      : token.totalScore >= 55
        ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50"
        : "bg-red-500/20 text-red-400 border-red-500/50"

  const sourceBadges = token.sources?.map((s) => s.source) || []
  const hasMultipleSources = sourceBadges.length > 1

  const computeSignalScore = (token: TokenScore): number | null => {
    // Placeholder for computeSignalScore logic
    return token.scoreBreakdown.signalScore ?? null
  }

  const signalScore = computeSignalScoreV2(token)
  
  // Compute v2 scores for debug panel
  const qualityScore = computeQualityScore(token)
  const readinessScore = computeReadinessScore(token)
  const gemScore = computeGemScore(token)
  const activityRatio = computeActivityRatio(token)

  // V3: Compute conviction level (no KV required)
  const getConvictionLevel = (): "HIGH" | "MED" | "LOW" => {
    const activityLabel = ratio !== null && ratio >= 0.6 && ratio <= 2.2 ? "HEALTHY" : "OTHER"
    
    if ((signalScore ?? 0) >= 8 && activityLabel === "HEALTHY" && gemScore >= 80) {
      return "HIGH"
    }
    if ((signalScore ?? 0) >= 6 && gemScore >= 70) {
      return "MED"
    }
    return "LOW"
  }

  const convictionLevel = getConvictionLevel()
  
  // V3: Compute score velocity (in-memory only, no KV)
  // For now, return placeholder since we don't have time-series data in memory
  const scoreVelocity = null // Will be "—" in UI

  // Generate token summary based on score, risk, and activity metrics
  const generateTokenSummary = (): string => {
    const score = token.totalScore
    const risk = token.riskLabel
    const volume = token.volume24h ?? 0
    const liquidity = token.liquidity ?? 0
    const activityLabel = ratio !== null && ratio >= 0.6 && ratio <= 2.2 ? "HEALTHY" : ratio !== null && ratio > 2.2 ? "EXTREME" : "OTHER"

    // High score cases (80+)
    if (score >= 80) {
      if (risk === "LOW RISK" && activityLabel === "HEALTHY") {
        return "Strong momentum with solid liquidity and low risk signals."
      }
      if (risk === "LOW RISK") {
        return "Top tier token with strong fundamentals and minimal risk."
      }
      if (activityLabel === "EXTREME") {
        return "High volatility detected. Strong score but elevated short-term risk."
      }
      return "High score token with active trading. Monitor risk levels."
    }

    // Medium score cases (55-79)
    if (score >= 55) {
      if (risk === "LOW RISK" && activityLabel === "HEALTHY") {
        return "Solid fundamentals with balanced activity and low risk."
      }
      if (activityLabel === "EXTREME") {
        return "High volatility detected. Short-term momentum with elevated risk."
      }
      if (liquidity < 100000) {
        return "Moderate score but thin liquidity. Exercise caution on entry/exit."
      }
      return "Moderate momentum. Monitor volume and liquidity trends."
    }

    // Low score cases (<55)
    if (risk === "HIGH RISK") {
      return "Multiple red flags detected. High risk with weak fundamentals."
    }
    if (liquidity < 50000) {
      return "Very thin liquidity detected. Extreme caution advised."
    }
    if (activityLabel === "EXTREME") {
      return "Extreme volatility with low score. High risk speculation only."
    }
    return "Low score with weak signals. Suitable for high risk tolerance only."
  }

  // Sprint 1: Memoized generateInsights to prevent recalculation on unrelated state changes
  const insights = useMemo(() => {
    const insights: { type: "good" | "warn" | "bad"; text: string }[] = []
    const sb = token.scoreBreakdown
    
    // If scoreBreakdown is missing (watchlist placeholder tokens), return empty insights
    if (!sb) {
      return insights
    }
    
    if (sb.liquidityScore >= 20) {
      insights.push({ type: "good", text: `Strong liquidity: $${((token.liquidity ?? 0) / 1000000).toFixed(2)}M` })
    } else if (sb.liquidityScore >= 10) {
      insights.push({ type: "warn", text: "Moderate liquidity — watch for slippage" })
    } else {
      insights.push({ type: "bad", text: "Low liquidity — high risk" })
    }
    
    if (sb.volumeScore >= 20) {
      insights.push({ type: "good", text: `Active trading: $${((token.volume24h ?? 0) / 1000000).toFixed(2)}M/24h` })
    } else if (sb.volumeScore >= 10) {
      insights.push({ type: "warn", text: "Volume declining — momentum slowing" })
    }
    
    if (sb.priceTrendScore > 15) {
      insights.push({ type: "good", text: "Strong uptrend momentum" })
    }
    
    if (token.riskFlags?.mintAuthority) {
      insights.push({ type: "bad", text: "Mint authority active — rug risk" })
    }
    
    if (hasMultipleSources) {
      insights.push({ type: "good", text: "Multi-source confirmation" })
    }
    
    return insights
  }, [token.scoreBreakdown, token.liquidity, token.volume24h, token.riskFlags?.mintAuthority, hasMultipleSources])

  // Count-up animation for score on mount
  useEffect(() => {
    if (hasAnimated) return

    const duration = 800 // 800ms
    const steps = 40
    const increment = token.totalScore / steps
    let current = 0

    const timer = setInterval(() => {
      current += 1
      const newScore = Math.min(increment * current, token.totalScore)
      setAnimatedScore(Math.round(newScore))

      if (current >= steps) {
        clearInterval(timer)
        setAnimatedScore(token.totalScore)
        setHasAnimated(true)
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [token.totalScore, hasAnimated])

  return (
    <>
      <div
        style={{
          position: "fixed",
          left: "-10000px",
          top: "0",
          opacity: 1,
          pointerEvents: "none",
        }}
      >
        {/* Remove the hidden ShareCardPreview component - no longer needed */}
      </div>

      <Card className={`group p-3 sm:p-5 hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30 transition-all cursor-pointer rounded-xl sm:rounded-2xl w-full min-w-0 relative overflow-hidden bg-card/80 sm:bg-card border-border shadow-[0_0_0_1px_rgba(255,255,255,0.06)] sm:h-full sm:flex sm:flex-col ${isWatched(token.address) ? "ring-1 ring-yellow-500/30 shadow-yellow-500/10" : ""}`}>
        {/* Top-right badge stack - desktop only */}
        <div className="hidden sm:flex absolute top-3 right-3 flex-col gap-1.5 items-end z-10">
          <TokenMicroBadge token={token} context="dashboard" />
        </div>

        {/* Mobile: Compact horizontal row (GMGN-style) */}
        <div className="sm:hidden" onClick={() => setDrawerOpen(true)}>
          <div className="flex items-center gap-3">
            {/* Left: Token image with rank overlay */}
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/20">
                {token.imageUrl ? (
                  <Image
                    src={token.imageUrl || "/placeholder.svg"}
                    alt={token.symbol || "Token"}
                    width={44}
                    height={44}
                    sizes="44px"
                    quality={65}
                    className="rounded-lg"
                  />
                ) : (
                  <span className="text-lg font-bold uppercase">{token.symbol?.[0] || "?"}</span>
                )}
              </div>
              {/* Rank badge overlay */}
              <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center">
                <span className="text-[10px] font-mono font-bold">{rank}</span>
              </div>
            </div>

            {/* Middle: Symbol, name, badges */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold uppercase truncate">{token.symbol}</h3>
                {/* Mini risk indicator */}
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  token.riskLabel === "LOW RISK" ? "bg-green-500" :
                  token.riskLabel === "MEDIUM RISK" ? "bg-yellow-500" : "bg-red-500"
                }`} />
              </div>
              <p className="text-xs text-muted-foreground truncate">{token.name}</p>
              {/* Mini stat line */}
              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                <span className="font-mono">V: ${((token.volume24h ?? 0) / 1000000).toFixed(1)}M</span>
                <span className="font-mono">L: ${((token.liquidity ?? 0) / 1000000).toFixed(1)}M</span>
              </div>
            </div>

            {/* Right: Score + Price stack */}
            <div className="flex flex-col items-end gap-1 shrink-0">
              {/* Score pill */}
              <div className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30">
                <span className="text-sm font-bold font-mono bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {token.totalScore}
                </span>
              </div>
              {/* Price */}
              <div className="text-sm font-mono text-right">
                ${token.priceUsd?.toFixed(token.priceUsd < 0.01 ? 6 : 4) ?? "0.00"}
              </div>
              {/* 24h change */}
              <div className={`text-xs font-mono font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}>
                {isPositive ? "+" : ""}{token.priceChange24h?.toFixed(2) ?? "0.00"}%
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <WatchlistButton
                mint={token.address}
                tokenMeta={{
                  symbol: token.symbol,
                  name: token.name,
                  image: token.imageUrl,
                }}
                size="icon"
                className="h-8 w-8"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleExternalLink}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop/Tablet: Original full layout */}
        <div className="hidden sm:flex sm:flex-col sm:flex-1 sm:min-h-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                #{rank}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4 min-w-0" onClick={() => setDrawerOpen(true)}>
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border-2 border-primary/20">
                {token.imageUrl ? (
                  <Image
                    src={token.imageUrl || "/placeholder.svg"}
                    alt={token.symbol || "Token"}
                    width={80}
                    height={80}
                    sizes="80px"
                    quality={65}
                    className="rounded-2xl"
                  />
                ) : (
                  <span className="text-3xl font-bold uppercase">{token.symbol?.[0] || "?"}</span>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold uppercase truncate">{token.symbol}</h3>
              <p className="text-sm text-muted-foreground truncate">{token.name}</p>
              <div className="flex items-center gap-2 mt-1">
                {token.pairUrl && (
                  <a
                    href={token.pairUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="opacity-50 hover:opacity-100 transition-opacity"
                  >
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {sourceBadges.length > 0 && (
            <div className="flex gap-1.5 mb-4 flex-wrap">
              {sourceBadges.includes("dexscreener") && (
                <Badge variant="outline" className="text-xs bg-blue-500/10 border-blue-500/50 text-blue-400">
                  DS
                </Badge>
              )}
              {hasMultipleSources && (
                <Badge variant="outline" className="text-xs bg-green-500/10 border-green-500/50 text-green-400">
                  MULTI
                </Badge>
              )}
              <SignalBadges token={token} />
            </div>
          )}

          <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20" onClick={() => setDrawerOpen(true)}>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wide">SOLRAD SCORE</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent transition-all">
                {hasAnimated ? token.totalScore : animatedScore}
              </span>
            </div>
            {featureFlags.scoreVelocity && (
              <div className="mt-1 text-xs text-muted-foreground">
                {scoreVelocity !== null ? `▲ +${scoreVelocity.toFixed(1)} (1h)` : "— (flat)"}
              </div>
            )}
            
            {/* Token Summary - collapsible */}
            <div className="mt-2 pt-2 border-t border-primary/10">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSummaryExpanded(!summaryExpanded)
                }}
                className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="uppercase font-semibold">Why this matters</span>
                {summaryExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              
              {summaryExpanded && (
                <p className="mt-2 text-xs text-foreground/80 leading-relaxed">
                  {generateTokenSummary()}
                </p>
              )}
            </div>
          </div>

          <div
            className="mb-4 p-2.5 rounded-lg bg-primary/10 border border-primary/20"
            onClick={() => setDrawerOpen(true)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wide">SIGNAL</span>
              </div>
              <span className="text-lg font-bold font-mono text-foreground">{signalScore ?? "—"} / 10</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Activity:</span>
              <ActivityHealth token={token} />
            </div>
            {featureFlags.convictionBadge && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Conviction:</span>
                <Badge 
                  variant="outline" 
                  className={`text-xs uppercase font-semibold ${
                    convictionLevel === "HIGH" 
                      ? "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/50"
                      : convictionLevel === "MED"
                      ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/50"
                      : "bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/50"
                  }`}
                >
                  {convictionLevel}
                </Badge>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4" onClick={() => setDrawerOpen(true)}>
            <div>
              <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">PRICE</div>
              <div className="font-mono text-sm">${token.priceUsd?.toFixed(token.priceUsd < 0.01 ? 8 : 4) ?? "0.00"}</div>
              <div
                className={`flex items-center gap-1 text-xs font-medium ${
                  isPositive ? "text-success" : "text-destructive"
                }`}
              >
                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {isPositive ? "+" : ""}
                {token.priceChange24h?.toFixed(2) ?? "0.00"}%
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                <Activity className="h-3 w-3 inline mr-1" />
                VOLUME 24H
              </div>
              <div className="font-mono text-sm">${((token.volume24h ?? 0) / 1000000).toFixed(2)}M</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                <Droplets className="h-3 w-3 inline mr-1" />
                LIQUIDITY
              </div>
              <div className="font-mono text-sm">${((token.liquidity ?? 0) / 1000000).toFixed(2)}M</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">RISK</div>
              <Badge
                variant="outline"
                className={riskColors[token.riskLabel] + " text-xs"}
                title={riskTooltips[token.riskLabel]}
              >
                {token.riskLabel}
              </Badge>
            </div>
          </div>

          <WhyFlagged token={token} />

          <div className="mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDebug}
              className="w-full justify-between uppercase text-xs font-bold hover:bg-primary/5"
            >
              <span>Score Debug</span>
              {debugExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {debugExpanded && (
              <div className="mt-2 p-3 rounded-lg bg-muted/30 border border-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Quality (0-100):</span>
                  <span className="font-mono font-bold">{qualityScore}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Readiness (0-100):</span>
                  <span className="font-mono font-bold">{readinessScore}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Gem (0-100):</span>
                  <span className="font-mono font-bold">{gemScore}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Signal (0-10):</span>
                  <span className="font-mono font-bold">{signalScore ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Activity Ratio:</span>
                  <span className="font-mono font-bold">{activityRatio?.toFixed(2) ?? "—"}</span>
                </div>
                <div className="pt-2 border-t border-border">
                  <div className="text-xs text-muted-foreground">Weights: Q=0.60 / R=0.40</div>
                </div>
              </div>
            )}
          </div>

          <div className="mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleInsight}
              className="w-full justify-between uppercase text-xs font-bold hover:bg-primary/5"
            >
              <span>Token Insight</span>
              {insightExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {insightExpanded && (
              <div className="mt-2 p-3 rounded-lg bg-muted/30 border border-border space-y-2">
                {insights.map((insight, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    {insight.type === "good" && <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />}
                    {insight.type === "warn" && <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 shrink-0 mt-0.5" />}
                    {insight.type === "bad" && <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />}
                    <span className="text-muted-foreground">{insight.text}</span>
                  </div>
                ))}
                
                {/* Authority boost explanation */}
                <div className="pt-3 mt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {token.totalScore >= 80
                      ? "High score driven by sustained liquidity, consistent volume inflows, and stable holder behavior."
                      : token.totalScore >= 55
                        ? "Moderate score reflects balanced on-chain activity with some volatility or liquidity constraints."
                        : "Low score indicates weak fundamentals, thin liquidity, or elevated risk signals from on-chain data."}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t min-w-0 [@media(min-width:640px)]:mt-auto">
            <div className="text-xs text-muted-foreground uppercase font-semibold mb-2">MINT ADDRESS</div>
            <div className="flex items-center gap-2 min-w-0">
              <code className="flex-1 text-xs font-mono bg-muted/50 px-2 py-1 rounded truncate min-w-0">
                {token.address.slice(0, 6)}...{token.address.slice(-6)}
              </code>
              <WatchlistButton
                mint={token.address}
                tokenMeta={{
                  symbol: token.symbol,
                  name: token.name,
                  image: token.imageUrl,
                }}
                size="icon"
                className="h-8 w-8 shrink-0"
              />
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleExternalLink}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <TokenDetailDrawer token={token} open={drawerOpen} onOpenChange={setDrawerOpen} />

      <Dialog open={shareModalOpen} onOpenChange={handleShareModalClose}>
        <DialogContent className="max-w-[92vw] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Share {token.symbol}</DialogTitle>
            <DialogDescription>Share this token on X/Twitter</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={() => {
                const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
                const normalizedMint = normalizeMint(token.address)
                const shareLink = normalizedMint ? `${siteUrl}/token/${normalizedMint}?share=1` : siteUrl
                navigator.clipboard.writeText(shareLink)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              size="lg"
              className="w-full"
            >
              <Share2 className="h-4 w-4 mr-2" />
              {copied ? "Copied!" : "Copy Share Link"}
            </Button>

            <Button
              onClick={() => {
                const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
                const normalizedMint = normalizeMint(token.address)
                const shareLink = normalizedMint ? `${siteUrl}/token/${normalizedMint}?share=1` : siteUrl
                const tweetText = `Check out $${token.symbol} on SOLRAD\n\nScore: ${token.totalScore}\nPrice: $${token.priceUsd?.toFixed(token.priceUsd < 0.01 ? 6 : 4) ?? "0.00"}\n24h: ${(token.priceChange24h ?? 0) >= 0 ? "+" : ""}${token.priceChange24h?.toFixed(2) ?? "0"}%`
                const twitterUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareLink)}`
                window.open(twitterUrl, "_blank", "noopener,noreferrer")
              }}
              variant="outline"
              size="lg"
              className="w-full bg-transparent"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open X Compose
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
