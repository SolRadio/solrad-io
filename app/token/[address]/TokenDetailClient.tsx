"use client"

import type { TokenScore } from "@/lib/types"
import type { LeadTimeProof } from "@/lib/lead-time/types"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ExternalLink, Zap, Copy, Check } from "lucide-react"
import { useFreshQuote } from "@/hooks/use-fresh-quote"
import { useTokenHistory } from "@/hooks/use-token-history"
import { useLeadTime } from "@/hooks/use-lead-time"
import { normalizeMint } from "@/lib/lead-time/normalize-mint"
import { formatCompactUsd } from "@/lib/format"

// ── Signal color map ────────────────────────────────────────
const signalColors: Record<string, string> = {
  STRONG: "text-green-400 border-green-500/40 bg-green-500/10",
  EARLY: "text-purple-400 border-purple-500/40 bg-purple-500/10",
  CAUTION: "text-amber-400 border-amber-500/40 bg-amber-500/10",
  PEAK: "text-blue-400 border-blue-500/40 bg-blue-500/10",
  DETECTED: "text-zinc-400 border-zinc-600 bg-zinc-800/40",
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-green-400"
  if (score >= 60) return "text-blue-400"
  if (score >= 40) return "text-amber-400"
  return "text-red-400"
}

function getScoreBarColor(score: number) {
  if (score >= 80) return "bg-green-400"
  if (score >= 60) return "bg-blue-400"
  if (score >= 40) return "bg-amber-400"
  return "bg-red-400"
}

function formatPrice(p: number) {
  if (p < 0.001) return `$${p.toFixed(8)}`
  if (p < 1) return `$${p.toFixed(4)}`
  return `$${p.toFixed(2)}`
}

function timeAgo(ts: number) {
  const mins = Math.floor((Date.now() - ts) / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ── Stat Card ───────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  subColor = "text-zinc-500",
}: {
  label: string
  value: string
  sub: string
  subColor?: string
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-4">
      <div className="font-mono text-[9px] text-zinc-600 tracking-widest mb-1">{label}</div>
      <div className="font-mono text-sm text-zinc-100 font-semibold tabular-nums">{value}</div>
      <div className={`font-mono text-[10px] mt-1 ${subColor}`}>{sub}</div>
    </div>
  )
}

// ── Score Sparkline (pure SVG) ──────────────────────────────
function ScoreSparkline({ snapshots }: { snapshots: { ts: number; solradScore: number }[] }) {
  if (snapshots.length < 2) return null

  const scores = snapshots.map((s) => s.solradScore)
  const minScore = Math.min(...scores)
  const maxScore = Math.max(...scores)
  const range = maxScore - minScore || 1
  const W = 100
  const H = 80
  const pad = 2

  const points = snapshots
    .map((s, i) => {
      const x = pad + (i / (snapshots.length - 1)) * (W - pad * 2)
      const y = H - pad - ((s.solradScore - minScore) / range) * (H - pad * 2)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          className="text-green-500"
          points={points}
        />
      </svg>
      <div className="flex justify-between font-mono text-[9px] text-zinc-600 mt-1">
        <span>{minScore.toFixed(0)}</span>
        <span>{maxScore.toFixed(0)}</span>
      </div>
    </div>
  )
}

// ── Holder Row ──────────────────────────────────────────────
function HolderRow({
  label,
  value,
  warn = false,
}: {
  label: string
  value: string | number
  warn?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-mono text-[10px] text-zinc-500">{label}</span>
      <span className={`font-mono text-xs font-semibold tabular-nums ${warn ? "text-amber-400" : "text-zinc-300"}`}>
        {value}
      </span>
    </div>
  )
}

// ── Main Client Component ───────────────────────────────────
export function TokenDetailClient({
  token,
  mint,
}: {
  token: TokenScore
  mint: string
}) {
  const [copied, setCopied] = useState(false)

  // Live price polling (45s)
  const { quote, ageMinutes } = useFreshQuote(mint, {
    enabled: true,
    pollInterval: 45000,
  })

  // Score history
  const { snapshots } = useTokenHistory(mint, {
    enabled: true,
    limit: 80,
    window: "24h",
  })

  // Lead-time proofs
  const normalizedMint = normalizeMint(mint)
  const { proofs } = useLeadTime(normalizedMint, {
    enabled: !!normalizedMint,
  })

  // Holder data from initial token fetch (if available from the API)
  const [holders, setHolders] = useState<{
    totalHolders: number
    topWalletPct: number
    top10Pct: number
    devWalletPct: number
  } | null>(null)

  // Fetch holder data once
  useState(() => {
    fetch(`/api/token/${encodeURIComponent(mint)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.holders?.totalHolders) {
          setHolders(data.holders)
        }
      })
      .catch(() => {})
  })

  // Live values with fresh quote fallback
  const price = quote?.priceUsd ?? token.priceUsd
  const change24h = quote?.priceChange24h ?? token.priceChange24h
  const volume = quote?.volume24h ?? token.volume24h
  const liquidity = quote?.liquidityUsd ?? token.liquidity
  const score = token.totalScore ?? 0
  const signalState = token.signalState ?? "DETECTED"
  const signalColor = signalColors[signalState] ?? signalColors.DETECTED
  const dataAge = ageMinutes != null ? `${ageMinutes}m` : "live"

  // Scoring factors from breakdown
  const sb = token.scoreBreakdown ?? {
    liquidityScore: 0,
    volumeScore: 0,
    activityScore: 0,
    ageScore: 0,
    healthScore: 0,
    boostScore: 0,
  }
  const scoringFactors = [
    { label: "LIQUIDITY", value: sb.liquidityScore },
    { label: "VOLUME", value: sb.volumeScore },
    { label: "ACTIVITY", value: sb.activityScore },
    { label: "TOKEN AGE", value: sb.ageScore },
    { label: "HEALTH", value: sb.healthScore },
  ]

  const handleCopy = () => {
    navigator.clipboard.writeText(mint)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-[800px] mx-auto px-4 py-8">
        {/* SECTION 1 — Back + Header */}
        <Link
          href="/"
          className="flex items-center gap-2 text-zinc-600 hover:text-zinc-400 font-mono text-xs tracking-widest mb-6 transition-colors"
        >
          {'<-'} BACK TO RADAR
        </Link>

        <div className="flex items-start gap-4 mb-8">
          <div className="w-16 h-16 rounded-full border border-zinc-800 overflow-hidden flex-none bg-zinc-900 flex items-center justify-center">
            {token.imageUrl ? (
              <Image
                src={token.imageUrl}
                alt={token.symbol || "Token"}
                width={64}
                height={64}
                className="rounded-full"
              />
            ) : (
              <span className="text-xl font-bold font-mono uppercase text-zinc-600">
                {token.symbol?.[0] || "?"}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-mono font-bold text-white text-2xl text-balance">
                {"$"}{token.symbol}
              </h1>
              <span className={`font-mono text-xs px-2 py-1 border ${signalColor}`}>
                {signalState}
              </span>
            </div>
            <p className="font-mono text-zinc-500 text-sm mt-1">{token.name}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="font-mono text-[10px] text-zinc-700">
                {mint.slice(0, 8)}...{mint.slice(-6)}
              </span>
              <button
                onClick={handleCopy}
                className="font-mono text-[9px] text-zinc-600 hover:text-green-400 border border-zinc-800 px-2 py-0.5 transition-colors inline-flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <Check className="w-2.5 h-2.5" /> COPIED
                  </>
                ) : (
                  <>
                    <Copy className="w-2.5 h-2.5" /> COPY MINT
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="text-right flex-none">
            <div className={`font-mono font-bold text-4xl tabular-nums ${getScoreColor(score)}`}>
              {score.toFixed(1)}
            </div>
            <div className="font-mono text-[9px] text-zinc-600 tracking-widest">SOLRAD SCORE</div>
            <div className="w-24 h-1.5 bg-zinc-800 mt-2 ml-auto">
              <div
                className={`h-full ${getScoreBarColor(score)}`}
                style={{ width: `${Math.min(score, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2 — Live Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard
            label="PRICE"
            value={formatPrice(price)}
            sub={`${change24h >= 0 ? "+" : ""}${change24h.toFixed(1)}% 24H`}
            subColor={change24h >= 0 ? "text-green-400" : "text-red-400"}
          />
          <StatCard label="VOLUME 24H" value={formatCompactUsd(volume)} sub="trading activity" />
          <StatCard label="LIQUIDITY" value={formatCompactUsd(liquidity)} sub="depth" />
          <StatCard label="DATA AGE" value={dataAge} sub="last updated" subColor="text-zinc-600" />
        </div>

        {/* SECTION 3 — Action Bar */}
        <div className="flex flex-wrap gap-2 mb-8">
          <a
            href={`https://dexscreener.com/solana/${mint}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 font-mono text-xs text-zinc-400 hover:border-zinc-600 hover:text-white transition-colors"
          >
            <ExternalLink className="w-3 h-3" /> DEXSCREENER
          </a>
          <a
            href={`https://jup.ag/swap/SOL-${mint}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 px-4 py-2 font-mono text-xs text-green-400 hover:bg-green-500/20 transition-colors"
          >
            <Zap className="w-3 h-3" /> TRADE ON JUPITER
          </a>
          <a
            href={`https://birdeye.so/token/${mint}?chain=solana`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 font-mono text-xs text-zinc-400 hover:border-zinc-600 hover:text-white transition-colors"
          >
            <ExternalLink className="w-3 h-3" /> BIRDEYE
          </a>
        </div>

        {/* SECTION 4 — Two Column: Score History + Holders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 p-4">
            <div className="font-mono text-[10px] text-zinc-500 tracking-widest mb-3">
              {"◈"} SCORE HISTORY
            </div>
            {snapshots.length > 1 ? (
              <ScoreSparkline snapshots={snapshots} />
            ) : (
              <div className="h-24 flex items-center justify-center font-mono text-xs text-zinc-700">
                INSUFFICIENT HISTORY
              </div>
            )}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-4">
            <div className="font-mono text-[10px] text-zinc-500 tracking-widest mb-3">
              {"◈"} HOLDER DATA
            </div>
            {holders ? (
              <div className="space-y-3">
                <HolderRow label="TOTAL HOLDERS" value={holders.totalHolders.toLocaleString()} />
                <HolderRow
                  label="TOP WALLET"
                  value={`${holders.topWalletPct?.toFixed(1)}%`}
                  warn={holders.topWalletPct > 10}
                />
                <HolderRow
                  label="TOP 10 HOLD"
                  value={`${holders.top10Pct?.toFixed(1)}%`}
                  warn={holders.top10Pct > 50}
                />
                <HolderRow
                  label="DEV WALLET"
                  value={holders.devWalletPct > 0 ? `${holders.devWalletPct.toFixed(1)}%` : "CLEAN"}
                  warn={holders.devWalletPct > 0}
                />
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center font-mono text-xs text-zinc-700">
                HOLDER DATA UNAVAILABLE
              </div>
            )}
          </div>
        </div>

        {/* SECTION 5 — Lead-Time Proof History */}
        {proofs.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 p-4 mb-6">
            <div className="font-mono text-[10px] text-zinc-500 tracking-widest mb-3">
              {"◈"} LEAD-TIME PROOF HISTORY {"·"} {proofs.length} DETECTION{proofs.length > 1 ? "S" : ""}
            </div>
            <div className="space-y-3">
              {proofs.map((proof: LeadTimeProof, i: number) => {
                const confColor =
                  proof.confidence === "HIGH"
                    ? "text-green-400 border-green-500/30 bg-green-500/10"
                    : proof.confidence === "MEDIUM"
                      ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                      : "text-zinc-400 border-zinc-600 bg-zinc-800/40"
                const leadMins = Math.round(proof.leadSeconds / 60)
                const scoreDelta = proof.reactionEvent?.magnitude ?? 0

                return (
                  <div key={i} className="border-b border-zinc-800/60 pb-3 last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-mono text-[9px] px-2 py-0.5 border ${confColor}`}>
                        {proof.confidence}
                      </span>
                      <span className="font-mono text-xs text-green-400 font-bold">
                        +{scoreDelta.toFixed(0)} pts
                      </span>
                    </div>
                    <div className="flex gap-4 font-mono text-[10px] text-zinc-500">
                      <span>{"⏱"} {leadMins}m lead time</span>
                      <span>{"·"} {timeAgo(proof.proofCreatedAt)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* SECTION 6 — Scoring Factors */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 mb-6">
          <div className="font-mono text-[10px] text-zinc-500 tracking-widest mb-3">
            {"◈"} SCORING FACTORS
          </div>
          <div className="space-y-2">
            {scoringFactors.map((factor) => (
              <div key={factor.label} className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-zinc-500 w-32 flex-none">{factor.label}</span>
                <div className="flex-1 h-1.5 bg-zinc-800">
                  <div
                    className="h-full bg-green-500/60"
                    style={{ width: `${Math.min(factor.value, 100)}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] text-zinc-400 w-8 text-right">{factor.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 7 — Footer disclaimer */}
        <p className="font-mono text-[9px] text-zinc-700 text-center py-6 border-t border-zinc-800">
          SOLRAD data is observational only {"·"} Not financial advice {"·"} DYOR {"·"} solrad.io
        </p>
      </div>
    </div>
  )
}
