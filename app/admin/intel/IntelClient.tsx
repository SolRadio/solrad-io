"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Send, Copy, CheckCircle2, Sparkles, Loader2, Download, ImageIcon, Clock, RefreshCw, AlertTriangle,
} from "lucide-react"


// ── Types ──

interface DailyPackage {
  date: string
  generatedAt: number
  status: "ready" | "posted"
  topTokens: Array<{
    symbol: string; mint: string; score: number
    priceChange24h: number; liquidity: number; volume24h: number; signalState?: string
  }>
  surges: Array<{ symbol: string; mint: string; oldScore: number; newScore: number; delta: number; ts: number }>
  alphaWins: Array<{ symbol: string; mint: string; detectedAt: string; outcome: string; resultPct?: number }>
  tweets: string[]
  telegramPacket: string
  proofPost: string
  imageGenerated: boolean
  twitterPosted: boolean
  twitterPostedAt?: number
  telegramPosted: boolean
  telegramPostedAt?: number
}

interface QueuedTweet {
  index: number
  scheduledTime: string
  text: string
}

// ── Constants ──

const SCHEDULE_SLOTS = [
  { hour: "8AM", estHour: 8, label: "MORNING OPEN", tag: "TOP SIGNAL" },
  { hour: "10AM", estHour: 10, label: "PEAK DEGEN HOURS", tag: "SURGE ALERT" },
  { hour: "12PM", estHour: 12, label: "LUNCH SCROLL", tag: "ALPHA PROOF" },
  { hour: "3PM", estHour: 15, label: "PRE-CLOSE SPIKE", tag: "MARKET CONTEXT" },
  { hour: "6PM", estHour: 18, label: "AFTER HOURS DEGEN", tag: "RISK NOTE" },
  { hour: "9PM", estHour: 21, label: "PRIME CRYPTO TWITTER", tag: "CTA" },
]

const TAG_STYLES: Record<string, string> = {
  "TOP SIGNAL": "text-green-400 border-green-500/30",
  "SURGE ALERT": "text-amber-400 border-amber-500/30",
  "ALPHA PROOF": "text-green-400 border-green-500/30",
  "MARKET CONTEXT": "text-blue-400 border-blue-500/30",
  "RISK NOTE": "text-red-400 border-red-500/30",
  "CTA": "text-zinc-400 border-zinc-600",
}

// ── Component ──

export default function IntelClient() {
  // Auth
  const [password, setPassword] = useState("")
  const [authenticated, setAuthenticated] = useState(false)
  const [authError, setAuthError] = useState("")
  const [authLoading, setAuthLoading] = useState(false)

  // Package
  const [pkg, setPkg] = useState<DailyPackage | null>(null)
  const [pkgGenerating, setPkgGenerating] = useState(false)

  // Posting state
  const [postingAll, setPostingAll] = useState(false)
  const [postingTwitter, setPostingTwitter] = useState(false)
  const [postingTelegram, setPostingTelegram] = useState(false)
  const [postResult, setPostResult] = useState<{ twitter?: string; telegram?: string; ts?: number } | null>(null)

  // Editable tweets
  const [tweetEdits, setTweetEdits] = useState<string[]>([])
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  // Queue system
  const [queuedTweets, setQueuedTweets] = useState<QueuedTweet[]>([])

  // Direct token data (fallback when package not ready)
  const [topTokens, setTopTokens] = useState<Array<Record<string, unknown>>>([])
  const [surges, setSurges] = useState<Array<Record<string, unknown>>>([])

  // Data freshness
  const [freshness, setFreshness] = useState<{ status: string; lastSnapshotAge: string; dataFresh: boolean } | null>(null)
  const [freshnessWarning, setFreshnessWarning] = useState<string | null>(null)
  const [refreshingData, setRefreshingData] = useState(false)

  // Image generation (client-side, per-tweet)
  const [generatedImages, setGeneratedImages] = useState<Record<number, string>>({})
  const [generatingImage, setGeneratingImage] = useState<Record<number, boolean>>({})

  // ── Auth ──
  const getStoredPw = () => sessionStorage.getItem("admin_alerts_pw") || ""

  useEffect(() => {
    const savedAuth = sessionStorage.getItem("admin_alerts_auth")
    const savedPw = sessionStorage.getItem("admin_alerts_pw")
    if (savedAuth === "true" && savedPw) setAuthenticated(true)
  }, [])

  useEffect(() => {
    if (authenticated) {
      loadPackage()
      // Fetch live token data directly (same endpoint as dashboard)
      fetch("/api/tokens")
        .then(r => r.json())
        .then(data => {
          const tokens = data.tokens ?? data ?? []
          const sorted = [...tokens].sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
            ((b.score as number) ?? 0) - ((a.score as number) ?? 0)
          )
          setTopTokens(sorted.slice(0, 10))
        })
        .catch(console.error)
      // Fetch score surges
      fetch("/api/score-velocity")
        .then(r => r.json())
        .then(data => setSurges(data.surges ?? data ?? []))
        .catch(console.error)
      // Fetch data freshness
      fetch("/api/health/data-freshness")
        .then(r => r.json())
        .then(d => setFreshness(d))
        .catch(() => {})
    }
  }, [authenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!authenticated) return
    const iv = setInterval(() => { loadPackage() }, 30000)
    return () => clearInterval(iv)
  }, [authenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAuth = async () => {
    setAuthLoading(true)
    setAuthError("")
    try {
      const pw = password.trim()
      const res = await fetch("/api/ops/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      })
      if (!res.ok) { setAuthError("Invalid password"); return }
      sessionStorage.setItem("admin_alerts_auth", "true")
      sessionStorage.setItem("admin_alerts_pw", pw)
      setAuthenticated(true)
      setPassword("")
    } catch { setAuthError("Auth failed") }
    finally { setAuthLoading(false) }
  }

  // ── Package Loading ──
  const loadPackage = useCallback(async () => {
    try {
      const date = new Date().toISOString().split("T")[0]
      const res = await fetch(`/api/admin/intel/package?date=${date}`, {
        headers: { "x-ops-password": getStoredPw() },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.package) {
          const p = data.package as DailyPackage
          setPkg(p)
          if (Array.isArray(p.tweets)) setTweetEdits(p.tweets)
        }
      }
    } catch { /* silent */ }
  }, [])

  // ── Actions ──
  const handleGeneratePackage = async () => {
    // Freshness gate: block on DEAD, warn on STALE
    if (freshness?.status === "DEAD") {
      setFreshnessWarning(`DATA IS STALE -- last update was ${freshness.lastSnapshotAge}. Tweets would contain outdated intel. Force refresh data first.`)
      return
    }
    if (freshness?.status === "STALE") {
      setFreshnessWarning(`Data is ${freshness.lastSnapshotAge} old. Consider refreshing before posting.`)
    }
    setPkgGenerating(true)
    setPostResult(null)
    try {
      const res = await fetch("/api/cron/daily-intel-package")
      if (res.ok) await loadPackage()
    } catch { /* silent */ }
    finally { setPkgGenerating(false) }
  }

  const handleForceRefresh = async () => {
    setRefreshingData(true)
    setFreshnessWarning(null)
    try {
      await Promise.all([
        fetch("/api/cron/ingest"),
        fetch("/api/cron/snapshot"),
      ])
      // Wait for processing
      await new Promise(r => setTimeout(r, 5000))
      // Re-fetch everything
      const [freshRes, tokensRes, surgesRes] = await Promise.all([
        fetch("/api/health/data-freshness"),
        fetch("/api/tokens"),
        fetch("/api/score-velocity"),
      ])
      const freshData = await freshRes.json()
      setFreshness(freshData)
      const tokensData = await tokensRes.json()
      const tokens = tokensData.tokens ?? tokensData ?? []
      const sorted = [...tokens].sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
        ((b.score as number) ?? 0) - ((a.score as number) ?? 0)
      )
      setTopTokens(sorted.slice(0, 10))
      const surgesData = await surgesRes.json()
      setSurges(surgesData.surges ?? surgesData ?? [])
    } catch { /* silent */ }
    finally { setRefreshingData(false) }
  }

  const handlePostTwitter = async () => {
    setPostingTwitter(true)
    try {
      const date = pkg?.date || new Date().toISOString().split("T")[0]
      const res = await fetch("/api/admin/intel/post-twitter", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-ops-password": getStoredPw() },
        body: JSON.stringify({ date }),
      })
      const data = await res.json()
      setPostResult(prev => ({ ...prev, twitter: data.success ? "Posted" : (data.error || "Failed"), ts: Date.now() }))
      if (data.success) await loadPackage()
    } catch { setPostResult(prev => ({ ...prev, twitter: "Error" })) }
    finally { setPostingTwitter(false) }
  }

  const handlePostTelegram = async () => {
    setPostingTelegram(true)
    try {
      const date = pkg?.date || new Date().toISOString().split("T")[0]
      const res = await fetch("/api/admin/intel/post-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-ops-password": getStoredPw() },
        body: JSON.stringify({ date }),
      })
      const data = await res.json()
      setPostResult(prev => ({ ...prev, telegram: data.success ? "Sent" : (data.error || "Failed"), ts: Date.now() }))
      if (data.success) await loadPackage()
    } catch { setPostResult(prev => ({ ...prev, telegram: "Error" })) }
    finally { setPostingTelegram(false) }
  }

  const handlePostAll = async () => {
    setPostingAll(true)
    setPostResult(null)
    await Promise.all([handlePostTwitter(), handlePostTelegram()])
    setPostingAll(false)
  }

  const copyTweet = (idx: number) => {
    navigator.clipboard.writeText(tweetEdits[idx] || "")
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 1500)
  }

  // ── Queue ──
  const queueTweet = (idx: number) => {
    if (queuedTweets.find(q => q.index === idx)) return
    setQueuedTweets(prev => [...prev, {
      index: idx,
      scheduledTime: `${SCHEDULE_SLOTS[idx]?.hour || "8AM"} EST`,
      text: tweetEdits[idx] || "",
    }])
  }

  const isQueued = (idx: number) => queuedTweets.some(q => q.index === idx)

  // ── Client-side Image Generation (per-tweet) ──
  const handleGenerateImage = async (tweetIndex: number) => {
    // Use pkg tokens if available, fall back to directly-fetched tokens
    const tokens = (pkg?.topTokens?.length ? pkg.topTokens : topTokens) as Array<Record<string, unknown>>
    if (tokens.length === 0) {
      alert("No token data loaded yet -- wait for data to load first")
      return
    }
    setGeneratingImage(prev => ({ ...prev, [tweetIndex]: true }))
    try {
      const canvas = document.createElement("canvas")
      canvas.width = 1080
      canvas.height = 1080
      const ctx = canvas.getContext("2d")!

      // Background
      ctx.fillStyle = "#0a0a0a"
      ctx.fillRect(0, 0, 1080, 1080)

      // Scanlines
      for (let y = 0; y < 1080; y += 4) {
        ctx.fillStyle = "rgba(255,255,255,0.015)"
        ctx.fillRect(0, y, 1080, 1)
      }

      // Debug: log actual field names so we can confirm extraction
      console.log("[v0] [Image Gen] First token fields:", JSON.stringify(tokens[0]))

      // Header
      ctx.fillStyle = "#22c55e"
      ctx.font = "bold 36px monospace"
      ctx.fillText("\u25C8 SOLRAD", 60, 80)

      const signalColors: Record<string, string> = {
        STRONG: "#22c55e", EARLY: "#eab308", PEAK: "#3b82f6",
        DETECTED: "#71717a", CAUTION: "#f97316",
      }

      if (tweetIndex === 2 && surges.length > 0) {
        // ── SURGE IMAGE (Tweet 3) ──
        ctx.fillStyle = "#ffffff"
        ctx.font = "bold 48px monospace"
        ctx.fillText("SCORE SURGE ALERT", 60, 140)

        ctx.fillStyle = "#52525b"
        ctx.font = "24px monospace"
        ctx.fillText(new Date().toDateString() + " \u00B7 " + surges.length + " surges detected", 60, 185)

        ctx.fillStyle = "#27272a"
        ctx.fillRect(60, 205, 960, 1)

        surges.slice(0, 3).forEach((surge, i) => {
          const y = 225 + i * 220
          const delta = Number(surge.delta ?? surge.scoreDelta ?? surge.change ?? 0)
          const before = Number(surge.scoreBefore ?? surge.oldScore ?? surge.from ?? 0)
          const after = Number(surge.scoreAfter ?? surge.newScore ?? surge.to ?? 0)

          ctx.fillStyle = "#111111"
          ctx.fillRect(60, y, 960, 195)
          ctx.fillStyle = "#eab308"
          ctx.fillRect(60, y, 4, 195)

          ctx.fillStyle = "#ffffff"
          ctx.font = "bold 44px monospace"
          ctx.fillText("$" + String(surge.symbol), 86, y + 55)

          ctx.fillStyle = "#eab308"
          ctx.font = "bold 44px monospace"
          ctx.fillText("+" + delta.toFixed(1) + " pts", 750, y + 55)

          ctx.fillStyle = "#52525b"
          ctx.font = "22px monospace"
          ctx.fillText("Score: " + before.toFixed(1) + " \u2192 " + after.toFixed(1), 86, y + 100)

          ctx.fillStyle = "#27272a"
          ctx.fillRect(86, y + 125, 700, 6)
          ctx.fillStyle = "#eab308"
          ctx.fillRect(86, y + 125, Math.min((delta / 50) * 700, 700), 6)

          ctx.fillStyle = "#71717a"
          ctx.font = "20px monospace"
          ctx.fillText("SCORE SURGE \u00B7 SOLRAD DETECTED", 86, y + 170)
        })
      } else {
        // ── TOP TOKENS IMAGE (Tweet 1 / default) ──
        ctx.fillStyle = "#ffffff"
        ctx.font = "bold 48px monospace"
        ctx.fillText("DAILY INTEL", 60, 140)

        ctx.fillStyle = "#52525b"
        ctx.font = "24px monospace"
        ctx.fillText(new Date().toDateString() + " \u00B7 " + tokens.length + " tokens tracked", 60, 185)

        ctx.fillStyle = "#27272a"
        ctx.fillRect(60, 205, 960, 1)

        tokens.slice(0, 4).forEach((token, i) => {
          const y = 225 + i * 185
          const sig = String(token.signalState ?? token.signal ?? token.state ?? "STRONG").toUpperCase()
          const color = signalColors[sig] ?? "#22c55e"
          const score = Number(token.score ?? token.solradScore ?? token.scoreValue ?? token.currentScore ?? 0)
          const vol = Number(token.volume24h ?? token.vol24h ?? token.volumeUsd24h ?? token.volume ?? 0)
          const liq = Number(token.liquidityUsd ?? token.liquidity ?? token.liquidityUsd24h ?? 0)
          const change = Number(token.priceChange24h ?? token.change24h ?? token.priceChangePercent24h ?? 0)

          // Card background
          ctx.fillStyle = "#111111"
          ctx.fillRect(60, y, 960, 168)

          // Left accent
          ctx.fillStyle = color
          ctx.fillRect(60, y, 4, 168)

          // Symbol
          ctx.fillStyle = "#ffffff"
          ctx.font = "bold 40px monospace"
          ctx.fillText("$" + String(token.symbol), 86, y + 52)

          // Score
          ctx.fillStyle = color
          ctx.font = "bold 40px monospace"
          ctx.fillText(score.toFixed(1), 880, y + 52)

          // Signal badge bg
          ctx.fillStyle = color + "22"
          ctx.fillRect(86, y + 65, 140, 28)
          ctx.fillStyle = color
          ctx.font = "16px monospace"
          ctx.fillText(sig, 96, y + 84)

          // Score bar bg
          ctx.fillStyle = "#27272a"
          ctx.fillRect(86, y + 105, 700, 6)
          ctx.fillStyle = color
          ctx.fillRect(86, y + 105, (score / 100) * 700, 6)

          // Stats
          ctx.fillStyle = "#71717a"
          ctx.font = "20px monospace"
          const volStr = vol >= 1000000 ? "$" + (vol / 1000000).toFixed(1) + "M" : "$" + (vol / 1000).toFixed(0) + "K"
          const liqStr = liq >= 1000000 ? "$" + (liq / 1000000).toFixed(1) + "M" : "$" + (liq / 1000).toFixed(0) + "K"
          const changeStr = change >= 0 ? "+" + change.toFixed(1) + "%" : change.toFixed(1) + "%"
          ctx.fillText("Vol " + volStr + " \u00B7 Liq " + liqStr + " \u00B7 24h " + changeStr, 86, y + 148)
        })
      }

      // Footer
      ctx.fillStyle = "#27272a"
      ctx.fillRect(60, 980, 960, 1)
      ctx.fillStyle = "#52525b"
      ctx.font = "20px monospace"
      ctx.fillText("solrad.io \u00B7 Solana Intelligence \u00B7 Not financial advice. DYOR.", 60, 1020)
      ctx.fillStyle = "#22c55e"
      ctx.font = "bold 22px monospace"
      ctx.fillText("\u25C8 SOLRAD", 888, 1020)

      const dataUrl = canvas.toDataURL("image/png")
      setGeneratedImages(prev => ({ ...prev, [tweetIndex]: dataUrl }))
    } catch (err) {
      console.error("Image generation failed:", err)
    } finally {
      setGeneratingImage(prev => ({ ...prev, [tweetIndex]: false }))
    }
  }

  const handleDownloadImage = (tweetIndex: number) => {
    const url = generatedImages[tweetIndex]
    if (!url) return
    const link = document.createElement("a")
    link.download = `solrad-intel-${new Date().toISOString().split("T")[0]}.png`
    link.href = url
    link.click()
  }

  // ── Derived ──
  const todayDate = new Date().toISOString().split("T")[0]
  const pkgReady = !!pkg && pkg.date === todayDate
  const allPosted = !!(pkg?.twitterPosted && pkg?.telegramPosted)

  // ── Status pills ──
  const twitterConnected = true // assume connected if env vars present
  const telegramConnected = true

  // ── Auth Screen ──
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="w-full max-w-sm border border-zinc-800 bg-[#111111] p-8">
          <div className="text-center mb-6">
            <div className="text-[10px] font-mono tracking-[0.3em] text-zinc-500 uppercase mb-2">{"\u25C8 SOLRAD INTEL"}</div>
            <div className="text-xs font-mono text-zinc-600">Authenticate to continue</div>
          </div>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAuth()}
            placeholder="OPS PASSWORD"
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 font-mono text-sm text-zinc-200 placeholder:text-zinc-600 rounded-none focus:border-zinc-600 focus:outline-none mb-3"
          />
          {authError && <div className="text-red-500 text-xs font-mono mb-3">{authError}</div>}
          <button
            onClick={handleAuth}
            disabled={authLoading}
            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono font-bold text-[10px] tracking-widest uppercase border border-zinc-700 rounded-none transition-colors disabled:opacity-50"
          >
            {authLoading ? "AUTHENTICATING..." : "ENTER"}
          </button>
        </div>
      </div>
    )
  }

  // ── Main Layout ──
  return (
    <div className="h-screen bg-[#0a0a0a] text-zinc-200 flex flex-col overflow-hidden">
      {/* ── HEADER ── h-14 */}
      <div className="flex-none h-14 border-b border-zinc-800 flex items-center justify-between px-6">
        {/* Left: logo + date */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-bold text-white">{"\u25C8 INTEL BROADCAST"}</span>
          <span className="text-xs font-mono text-zinc-500">{todayDate}</span>
        </div>

        {/* Center: status pills */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 border border-zinc-800">
            <div className={`h-1.5 w-1.5 rounded-full ${twitterConnected ? (pkg?.twitterPosted ? "bg-green-500" : "bg-green-500") : "bg-red-500"}`} />
            <span className="text-[9px] font-mono tracking-wider text-zinc-400">TWITTER</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 border border-zinc-800">
            <div className={`h-1.5 w-1.5 rounded-full ${telegramConnected ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-[9px] font-mono tracking-wider text-zinc-400">TELEGRAM</span>
          </div>
          {queuedTweets.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 border border-amber-800 bg-amber-900/10">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span className="text-[9px] font-mono tracking-wider text-amber-400">{queuedTweets.length} QUEUED</span>
            </div>
          )}
          {/* Data freshness pill */}
          {freshness && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 border ${
              freshness.status === "FRESH" ? "border-green-800 bg-green-900/10" :
              freshness.status === "STALE" ? "border-amber-800 bg-amber-900/10" :
              "border-red-800 bg-red-900/10"
            }`}>
              <div className={`h-1.5 w-1.5 rounded-full ${
                freshness.status === "FRESH" ? "bg-green-500" :
                freshness.status === "STALE" ? "bg-amber-500" : "bg-red-500"
              }`} />
              <span className={`text-[9px] font-mono tracking-wider ${
                freshness.status === "FRESH" ? "text-green-400" :
                freshness.status === "STALE" ? "text-amber-400" : "text-red-400"
              }`}>{freshness.status === "FRESH" ? "DATA FRESH" : `DATA ${freshness.status}`}</span>
              {freshness.status !== "FRESH" && (
                <span className="text-[8px] font-mono text-zinc-600">{freshness.lastSnapshotAge}</span>
              )}
            </div>
          )}
        </div>

        {/* Right: FORCE REFRESH + GENERATE buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleForceRefresh}
            disabled={refreshingData}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-amber-800 text-amber-400 font-mono font-bold text-[9px] tracking-widest uppercase rounded-none hover:bg-amber-900/20 hover:border-amber-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${refreshingData ? "animate-spin" : ""}`} />
            {refreshingData ? "REFRESHING..." : "FORCE REFRESH"}
          </button>
          <button
            onClick={handleGeneratePackage}
            disabled={pkgGenerating}
            className="bg-zinc-800 border border-zinc-700 font-mono text-xs tracking-widest text-white px-4 py-2 hover:border-green-500 hover:text-green-400 transition-colors rounded-none disabled:opacity-50 flex items-center gap-1.5"
          >
            {pkgGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            {pkgGenerating ? "GENERATING..." : "GENERATE TODAY'S INTEL"}
          </button>
        </div>
      </div>

      {/* Freshness warning banner */}
      {freshnessWarning && (
        <div className="flex-none bg-red-950/30 border-b border-red-900/50 px-6 py-2 flex items-center gap-3">
          <AlertTriangle className="h-3.5 w-3.5 text-red-400 flex-none" />
          <span className="text-[10px] font-mono text-red-400">{freshnessWarning}</span>
          <button
            onClick={() => setFreshnessWarning(null)}
            className="ml-auto text-[9px] font-mono text-zinc-600 hover:text-zinc-400"
          >DISMISS</button>
        </div>
      )}

      {/* ── SCHEDULE BANNER ── */}
      <div className="flex-none bg-zinc-900/60 border-b border-zinc-800 px-6 py-2 flex items-center gap-6">
        <span className="text-[9px] font-mono text-zinc-600 tracking-widest">{"\u25C8 TODAY'S BROADCAST SCHEDULE"}</span>
        <div className="flex items-center gap-2">
          {SCHEDULE_SLOTS.map((slot, i) => {
            const posted = allPosted
            const queued = isQueued(i)
            return (
              <div
                key={slot.hour}
                className={`px-2.5 py-1 text-[9px] font-mono tracking-wider border ${
                  posted
                    ? "border-green-800 bg-green-900/20 text-green-400"
                    : queued
                    ? "border-amber-800 bg-amber-900/20 text-amber-400"
                    : "border-zinc-800 bg-zinc-900/40 text-zinc-600"
                }`}
              >
                {slot.hour}
              </div>
            )
          })}
        </div>
        <span className="text-[9px] font-mono text-zinc-700 ml-auto">EST</span>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">
        {/* Tweet cards */}
        {(tweetEdits.length > 0 ? tweetEdits : Array(6).fill("")).map((tweet, idx) => {
          const len = (tweet || "").length
          const slot = SCHEDULE_SLOTS[idx] || SCHEDULE_SLOTS[5]
          const tag = slot.tag
          const tagCls = TAG_STYLES[tag] || TAG_STYLES["CTA"]
          const queued = isQueued(idx)
          const posted = allPosted
          const statusLabel = posted ? "POSTED" : queued ? "QUEUED" : "DRAFT"
          const statusCls = posted ? "text-green-400 border-green-500/30" : queued ? "text-amber-400 border-amber-500/30" : "text-zinc-500 border-zinc-700"
          const showImage = idx === 0 || idx === 2

          return (
            <div key={idx} className="bg-zinc-900 border border-zinc-800">
              <div className={`grid ${showImage ? "grid-cols-[1fr_320px]" : "grid-cols-1"}`}>
                {/* LEFT COLUMN: tweet content */}
                <div className="flex flex-col">
                  {/* Top bar */}
                  <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/60">
                    <span className="text-[9px] font-mono text-zinc-500 tracking-widest">
                      TWEET {idx + 1} {"\u00B7"} {slot.hour} EST {"\u00B7"} {slot.label}
                    </span>
                    <Badge variant="outline" className={`text-[8px] px-1.5 py-0 rounded-none ${statusCls}`}>
                      {posted && "\u2713 "}{statusLabel}
                    </Badge>
                  </div>

                  {/* Tweet text area */}
                  <textarea
                    value={tweet || ""}
                    onChange={e => {
                      const next = [...tweetEdits]
                      next[idx] = e.target.value
                      setTweetEdits(next)
                    }}
                    className="w-full bg-transparent border-none outline-none font-mono text-sm text-zinc-100 resize-none leading-relaxed p-4 min-h-[120px] placeholder:text-zinc-700"
                    placeholder={tweetEdits.length === 0 ? "Generate a package to populate tweets..." : ""}
                    rows={4}
                    style={{ fieldSizing: "content" } as React.CSSProperties}
                  />

                  {/* Bottom bar */}
                  <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-800/60">
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-mono tabular-nums ${
                        len > 270 ? "text-red-400" : len > 200 ? "text-amber-400" : "text-zinc-500"
                      }`}>{len}/280</span>
                      {/* Char bar */}
                      <div className="w-20 h-[3px] bg-zinc-800">
                        <div
                          className={`h-full transition-all ${len > 270 ? "bg-red-500" : len > 200 ? "bg-amber-500" : "bg-green-500/50"}`}
                          style={{ width: `${Math.min(100, (len / 280) * 100)}%` }}
                        />
                      </div>
                      <Badge variant="outline" className={`text-[8px] px-1.5 py-0 rounded-none ${tagCls}`}>
                        {tag}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => queueTweet(idx)}
                        disabled={queued || posted || !pkgReady}
                        className="bg-zinc-800 border border-zinc-700 text-[10px] font-mono px-3 py-1.5 hover:border-amber-500 hover:text-amber-400 rounded-none transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-zinc-400"
                      >
                        {queued ? "QUEUED" : "QUEUE"}
                      </button>
                      <button
                        onClick={() => copyTweet(idx)}
                        className="text-zinc-600 hover:text-zinc-300 transition-colors px-1"
                      >
                        {copiedIdx === idx ? <CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: image preview (tweets 1 + 3 only) */}
                {showImage && (
                  <div className="border-l border-zinc-800 p-3 flex flex-col gap-2">
                    {generatedImages[idx] ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={generatedImages[idx]}
                          alt={`SOLRAD Intel image for tweet ${idx + 1}`}
                          className="w-full aspect-square border border-zinc-800 object-cover"
                        />
                        <button
                          onClick={() => handleDownloadImage(idx)}
                          className="w-full py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-400 font-mono text-[9px] tracking-widest uppercase rounded-none hover:border-zinc-600 hover:text-zinc-200 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Download className="h-3 w-3" />
                          DOWNLOAD
                        </button>
                      </>
                    ) : (
                      <div className="bg-zinc-950 border border-dashed border-zinc-700 w-full aspect-square flex items-center justify-center">
                        <button
                          onClick={() => handleGenerateImage(idx)}
                          disabled={!!generatingImage[idx] || (topTokens.length === 0 && !pkg?.topTokens?.length)}
                          className="flex items-center gap-1.5 text-[10px] font-mono text-green-500 hover:text-green-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          {generatingImage[idx] ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                          {generatingImage[idx] ? "GENERATING..." : "+ GENERATE IMAGE"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* POST ALL — TWITTER + TELEGRAM */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handlePostAll}
            disabled={!pkgReady || allPosted || postingAll || postingTwitter || postingTelegram}
            className="flex-1 py-3 bg-green-500 text-black font-mono font-bold text-sm tracking-widest uppercase rounded-none hover:bg-green-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {postingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {allPosted ? `POSTED ${pkg?.twitterPostedAt ? new Date(pkg.twitterPostedAt).toLocaleTimeString() : ""}` : "POST ALL"}
          </button>
          <button
            onClick={handlePostTwitter}
            disabled={!pkgReady || pkg?.twitterPosted || postingTwitter}
            className="py-3 px-6 bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-[10px] tracking-widest uppercase rounded-none hover:border-zinc-600 hover:text-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {postingTwitter ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            {pkg?.twitterPosted ? "X POSTED" : "X ONLY"}
          </button>
          <button
            onClick={handlePostTelegram}
            disabled={!pkgReady || pkg?.telegramPosted || postingTelegram}
            className="py-3 px-6 bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-[10px] tracking-widest uppercase rounded-none hover:border-zinc-600 hover:text-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {postingTelegram ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            {pkg?.telegramPosted ? "TG SENT" : "TG ONLY"}
          </button>
        </div>

        {/* Post result feedback */}
        {postResult && (
          <div className="flex items-center gap-3 px-3 py-2 border border-zinc-800 bg-zinc-900/60">
            {postResult.twitter && (
              <span className={`text-[10px] font-mono ${postResult.twitter === "Posted" ? "text-green-400" : "text-red-400"}`}>
                X: {postResult.twitter}
              </span>
            )}
            {postResult.telegram && (
              <span className={`text-[10px] font-mono ${postResult.telegram === "Sent" ? "text-green-400" : "text-red-400"}`}>
                TG: {postResult.telegram}
              </span>
            )}
            {postResult.ts && (
              <span className="text-[9px] font-mono text-zinc-600 ml-auto">
                {new Date(postResult.ts).toLocaleTimeString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── BROADCAST QUEUE BAR (sticky bottom) ── */}
      {queuedTweets.length > 0 && !allPosted && (
        <div className="flex-none border-t border-zinc-800 bg-zinc-950 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400">
              {"\u25C8 "}{queuedTweets.length} TWEET{queuedTweets.length !== 1 ? "S" : ""} QUEUED
            </span>
            <span className="text-[9px] font-mono text-zinc-600">
              {queuedTweets.map(q => q.scheduledTime).join(" \u00B7 ")}
            </span>
          </div>
          <button
            onClick={handlePostAll}
            disabled={postingAll || !pkgReady}
            className="bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-mono font-bold tracking-widest px-4 py-1.5 hover:bg-green-500/20 rounded-none transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {postingAll ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            BROADCAST ALL
          </button>
        </div>
      )}
    </div>
  )
}
