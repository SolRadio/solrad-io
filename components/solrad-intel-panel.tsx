"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Copy, Check, ExternalLink, Share2, Zap } from "lucide-react"
import { normalizeMint } from "@/lib/lead-time/normalize-mint"
import { normalizeAddressCase } from "@/lib/explorers"
import type { TokenScore } from "@/lib/types"
import type { LeadTimeProof, LeadTimeStats } from "@/lib/lead-time/types"

// ─── Types ───────────────────────────────────────────────

interface AlphaEntry {
  mint: string
  symbol: string
  outcome?: string
  pct24h?: number
  pct7d?: number
  scoreAtSignal?: number
  detectedAt?: string
}

interface SolradIntelPanelProps {
  token: TokenScore
  snapshots: Array<{ ts: number; solradScore: number; price: number; liquidityUsd?: number; volume24hUsd?: number }>
  intel: { insight: string; generatedAt: string; metrics: { label: string; value: string }[] } | null
  intelLoading: boolean
  leadTimeProofs: LeadTimeProof[]
  leadTimeStats: LeadTimeStats | null
  leadTimeLoading: boolean
}

// ─── Helpers ─────────────────────────────────────────────

function getSignalColor(score: number): string {
  if (score >= 70) return "#22c55e"
  if (score >= 40) return "#f59e0b"
  return "#ef4444"
}

function getSignalColorClass(score: number): string {
  if (score >= 70) return "text-green-400"
  if (score >= 40) return "text-amber-400"
  return "text-red-400"
}

function getSignalBgClass(score: number): string {
  if (score >= 70) return "bg-green-500"
  if (score >= 40) return "bg-amber-500"
  return "bg-red-500"
}

function getSignalStage(state?: string, score?: number): number {
  // Maps to STAGE_LABELS: 0=DETECTED, 1=EARLY, 2=STRONG, 3=PEAK
  if (state === "PEAK" || (score && score >= 90)) return 3
  if (state === "STRONG" || (score && score >= 70)) return 2
  if (state === "EARLY" || state === "CAUTION" || (score && score >= 40)) return 1
  return 0
}

const STAGE_LABELS = ["DETECTED", "EARLY", "STRONG", "PEAK"]

function computeRiskIndex(token: TokenScore, liquidity: number, volume: number): { score: number; topFlag: string } {
  let risk = 0
  let topFlag = "CLEAN"

  if (liquidity < 30000) { risk += 30; topFlag = "THIN LIQUIDITY" }
  else if (liquidity < 60000) { risk += 15; if (topFlag === "CLEAN") topFlag = "LOW LIQUIDITY" }

  if (volume > 0 && liquidity > 0) {
    const ratio = volume / liquidity
    if (ratio > 10) { risk += 25; topFlag = "VOL/LIQ ANOMALY" }
    else if (ratio > 6) { risk += 12 }
  }

  const ageMs = token.pairCreatedAt ? Date.now() - token.pairCreatedAt : 0
  const ageHours = ageMs / (1000 * 60 * 60)
  if (ageHours < 24) { risk += 20; if (topFlag === "CLEAN") topFlag = "VERY NEW PAIR" }
  else if (ageHours < 72) { risk += 10; if (topFlag === "CLEAN") topFlag = "NEW PAIR" }

  if (token.riskLabel === "HIGH RISK") { risk += 15; if (topFlag === "CLEAN") topFlag = "HIGH RISK" }
  else if (token.riskLabel === "MEDIUM RISK") { risk += 8 }

  return { score: Math.min(100, risk), topFlag }
}

function computeConfidence(
  token: TokenScore,
  snapshots: Array<{ ts: number; solradScore: number }>,
  liquidity: number,
  volume: number
): number {
  let confidence = 100
  const THRESHOLD = 70
  const signalEvent = snapshots.find((s, i) =>
    i > 0 && s.solradScore >= THRESHOLD && snapshots[i - 1].solradScore < THRESHOLD
  )
  if (signalEvent) {
    const after = snapshots.filter((s) => s.ts > signalEvent.ts).length
    if (after < 4) confidence -= 25
    else if (after < 8) confidence -= 15
    else if (after < 12) confidence -= 5
  } else {
    confidence -= 30
  }
  if (liquidity < 25000) confidence -= 20
  else if (liquidity < 50000) confidence -= 10
  if (volume && liquidity && liquidity > 0) {
    const ratio = volume / liquidity
    if (ratio > 12) confidence -= 15
    else if (ratio > 8) confidence -= 8
  }
  if (token.riskLabel === "HIGH RISK") confidence -= 15
  else if (token.riskLabel === "MEDIUM RISK") confidence -= 8
  if (snapshots.length >= 3) {
    const diffs = snapshots.slice(1).map((s, i) => Math.abs(s.solradScore - snapshots[i].solradScore))
    const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length
    if (avg > 8) confidence -= 12
    else if (avg > 5) confidence -= 6
  }
  return Math.max(0, Math.min(100, Math.round(confidence)))
}

// ─── Signal Arc SVG ──────────────────────────────────────

function SignalArc({ score, color }: { score: number; color: string }) {
  const width = 320
  const height = 60
  const startX = 10
  const endX = width - 10
  const arcY = 50
  const controlY = -20
  const progress = Math.max(0, Math.min(score / 100, 1))
  const fullPath = `M ${startX} ${arcY} Q ${width / 2} ${controlY} ${endX} ${arcY}`

  return (
    <svg viewBox={`0 0 ${width} ${height + 5}`} className="w-full" style={{ maxWidth: 400 }}>
      <path d={fullPath} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
      <path
        d={fullPath}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="1000"
        strokeDashoffset={1000 - 1000 * progress}
        style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
      />
      {[0, 25, 50, 75, 100].map((tick) => {
        const t = tick / 100
        const x = startX + (endX - startX) * t
        const y = arcY + (controlY - arcY) * 4 * t * (1 - t)
        return (
          <line key={tick} x1={x} y1={y - 4} x2={x} y2={y + 4} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        )
      })}
    </svg>
  )
}

// ─── Signal Journey Timeline ─────────────────────────────

function SignalJourney({ activeStage, color }: { activeStage: number; color: string }) {
  return (
    <div className="flex items-center justify-between w-full px-2">
      {STAGE_LABELS.map((label, i) => {
        const isComplete = i <= activeStage
        const isActive = i === activeStage
        return (
          <React.Fragment key={label}>
            {i > 0 && (
              <div className="flex-1 h-px mx-1" style={{ background: i <= activeStage ? color : "rgb(63 63 70)" }} />
            )}
            <div className="flex flex-col items-center gap-1 relative">
              <div className="w-2 h-2 rotate-45" style={{ background: isComplete ? color : "rgb(63 63 70)" }} />
              {isActive && (
                <div className="absolute -top-0.5 w-3 h-3 rotate-45 animate-ping opacity-40" style={{ background: color }} />
              )}
              <span
                className="text-[8px] font-mono font-bold uppercase tracking-[0.15em]"
                style={{ color: isActive ? "#fff" : "rgb(113 113 122)" }}
              >
                {label}
              </span>
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─── Stat Cell ───────────────────────────────────────────

function StatCell({
  label,
  value,
  valueColor,
  sublabel,
  delay,
}: {
  label: string
  value: string
  valueColor: string
  sublabel: string
  delay: number
}) {
  return (
    <div
      className="flex flex-col gap-0.5 p-2.5 animate-in fade-in slide-in-from-bottom-1"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-600">{label}</span>
      <span className={`text-base font-mono font-bold ${valueColor}`}>{value}</span>
      <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-wider">{sublabel}</span>
    </div>
  )
}

// ─── Momentum Bar ────────────────────────────────────────

function MomentumBar({ score, color }: { score: number; color: string }) {
  // Score maps linearly across the bar: 0-33 accumulation (blue), 34-66 momentum (amber), 67-100 distribution (red)
  const position = Math.max(0, Math.min(100, score))
  const zone = score <= 33 ? "ACCUMULATION" : score <= 66 ? "MOMENTUM" : "DISTRIBUTION"
  const zoneColor = score <= 33 ? "rgb(59,130,246)" : score <= 66 ? "rgb(245,158,11)" : "rgb(239,68,68)"

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-600">PHASE INDICATOR</span>
        <span className="text-[9px] font-mono uppercase tracking-[0.15em]" style={{ color: zoneColor }}>{zone}</span>
      </div>
      <div className="relative h-3 rounded-sm overflow-hidden" style={{ background: "rgba(24,24,27,0.8)" }}>
        {/* Zone fills: 0-33%, 34-66%, 67-100% */}
        <div className="absolute inset-0 flex">
          <div className="h-full" style={{ width: "33.33%", background: "rgba(59,130,246,0.15)" }} />
          <div className="h-full" style={{ width: "33.34%", background: "rgba(245,158,11,0.15)" }} />
          <div className="h-full" style={{ width: "33.33%", background: "rgba(239,68,68,0.15)" }} />
        </div>
        {/* Zone separators at 33% and 67% */}
        <div className="absolute top-0 bottom-0 w-px bg-zinc-700" style={{ left: "33.33%" }} />
        <div className="absolute top-0 bottom-0 w-px bg-zinc-700" style={{ left: "66.67%" }} />
        {/* Cursor -- position = score/100 across full bar width */}
        <div
          className="absolute top-0 bottom-0 w-0.5 transition-all duration-700"
          style={{
            left: `${position}%`,
            background: zoneColor,
            boxShadow: `0 0 6px ${zoneColor}, 0 0 12px ${zoneColor}40`,
          }}
        />
      </div>
      <div className="flex mt-1">
        <span className="text-[8px] font-mono text-zinc-600 uppercase" style={{ width: "33.33%" }}>ACCUM</span>
        <span className="text-[8px] font-mono text-zinc-600 uppercase text-center" style={{ width: "33.34%" }}>MOMENTUM</span>
        <span className="text-[8px] font-mono text-zinc-600 uppercase text-right" style={{ width: "33.33%" }}>DISTRIB</span>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────

export function SolradIntelPanel({
  token,
  snapshots,
  intel,
  intelLoading,
  leadTimeProofs,
  leadTimeStats,
  leadTimeLoading,
}: SolradIntelPanelProps) {
  const [copied, setCopied] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [alphaEntries, setAlphaEntries] = useState<AlphaEntry[]>([])
  const [alphaLoaded, setAlphaLoaded] = useState(false)

  // Fetch alpha ledger and filter client-side by mint
  useEffect(() => {
    const normalizedMint = normalizeMint(token.address)
    if (!normalizedMint) return
    fetch(`/api/alpha-ledger?limit=500`)
      .then((r) => r.json())
      .then((data) => {
        const entries = (data.entries || []).filter(
          (e: AlphaEntry) => normalizeMint(e.mint) === normalizedMint
        )
        setAlphaEntries(entries)
        setAlphaLoaded(true)
      })
      .catch(() => setAlphaLoaded(true))
  }, [token.address])

  const score = token.totalScore
  const signalColor = getSignalColor(score)
  const signalColorClass = getSignalColorClass(score)
  const signalBgClass = getSignalBgClass(score)
  const stage = getSignalStage(token.signalState, score)
  const liquidity = token.liquidity ?? 0
  const volume = token.volume24h ?? 0
  const riskIndex = useMemo(() => computeRiskIndex(token, liquidity, volume), [token, liquidity, volume])
  const confidence = useMemo(
    () => computeConfidence(token, snapshots, liquidity, volume),
    [token, snapshots, liquidity, volume]
  )

  // Velocity from snapshots (1 decimal) — use wider window for more meaningful delta
  const velocity = useMemo(() => {
    console.log("[v0] SolradIntelPanel snapshots.length:", snapshots.length,
      "last2:", snapshots.length >= 2 ? [snapshots[snapshots.length - 2].solradScore, snapshots[snapshots.length - 1].solradScore] : "N/A")
    if (snapshots.length < 2) return null
    // Use a wider window: compare latest vs 5th-from-last (or oldest if fewer)
    const windowSize = Math.min(5, snapshots.length - 1)
    const latest = snapshots[snapshots.length - 1].solradScore
    const prev = snapshots[snapshots.length - 1 - windowSize].solradScore
    if (latest == null || prev == null || isNaN(latest) || isNaN(prev)) return null
    return parseFloat((latest - prev).toFixed(1))
  }, [snapshots])

  // FIX #2: Lead time from real LeadTimeStats fields
  const bestLeadTime = useMemo(() => {
    console.log("[v0] SolradIntelPanel leadTimeStats:", JSON.stringify(leadTimeStats))
    if (!leadTimeStats?.averageLeadBlocks || leadTimeStats.averageLeadBlocks <= 0) return null
    const blocks = leadTimeStats.averageLeadBlocks
    const minutes = Math.round((blocks * 0.4) / 60) // blocks * 0.4s / 60s
    return { blocks: Math.round(blocks), minutes: Math.max(1, minutes) }
  }, [leadTimeStats])

  // Alpha hits (already filtered to this token's mint in useEffect above)
  console.log("[v0] SolradIntelPanel alphaEntries for", token.symbol, ":", alphaEntries.length, "normalized mint:", normalizeMint(token.address))
  const alphaHits = alphaEntries.length
  const bestGain = useMemo(() => {
    if (alphaEntries.length === 0) return null
    const gains = alphaEntries
      .map((e) => e.pct24h ?? e.pct7d ?? null)
      .filter((v): v is number => v != null && Number.isFinite(v))
    return gains.length > 0 ? Math.max(...gains) : null
  }, [alphaEntries])

  // NEW: Vol/Liq ratio
  const volLiqRatio = useMemo(() => {
    if (!volume || !liquidity || liquidity <= 0) return null
    return volume / liquidity
  }, [volume, liquidity])

  // NEW: Signal age from pairCreatedAt or earliest snapshot
  const signalAgeDays = useMemo(() => {
    const firstTs = token.pairCreatedAt ?? (snapshots.length > 0 ? snapshots[0].ts : null)
    if (!firstTs) return null
    return Math.max(0, Math.round((Date.now() - firstTs) / (1000 * 60 * 60 * 24)))
  }, [token.pairCreatedAt, snapshots])

  // Signal state label
  const signalLabel = token.signalState || (score >= 70 ? "STRONG" : score >= 40 ? "EARLY" : "WEAK")

  const handleCopyMint = async () => {
    const addr = normalizeAddressCase(token.address)
    await navigator.clipboard.writeText(addr)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = () => {
    const shareText = `$${token.symbol} · Score: ${score} · Signal: ${signalLabel} · Vol: $${(volume / 1e6).toFixed(2)}M · solrad.io`
    navigator.clipboard.writeText(shareText).then(() => {
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 1500)
    }).catch(() => {
      prompt("Copy this signal:", shareText)
    })
  }

  return (
    <div className="relative rounded-lg overflow-hidden mb-4" style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.06)" }}>
      {/* Scanline overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)",
          backgroundSize: "100% 200%",
          animation: "scanline 8s linear infinite",
        }}
      />

      <div className="relative z-20 p-4">
        {/* SECTION 1 -- SIGNAL ARC */}
        <div className="flex flex-col items-center mb-4">
          <div className="flex items-center justify-between w-full mb-2 px-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">SOLRAD SCORE</span>
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">
              confidence {confidence}/100
            </span>
          </div>

          <SignalArc score={score} color={signalColor} />

          <div className="flex items-center gap-3 mt-1">
                <span className="font-mono font-bold leading-none" style={{ fontSize: "56px", color: signalColor }}>
              {score}
            </span>
            <div
              className="px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider rounded-sm"
              style={{
                color: signalColor,
                background: `${signalColor}20`,
                boxShadow: `0 0 12px ${signalColor}40`,
                animation: "glow-pulse 2s ease-in-out infinite",
              }}
            >
              {signalLabel}
            </div>
          </div>
        </div>

        {/* SECTION 2 -- SIGNAL JOURNEY */}
        <div className="mb-5 mt-2">
          <SignalJourney activeStage={stage} color={signalColor} />
        </div>

        {/* SECTION 3 -- LIVE INTEL READ */}
        <div
          className="mb-4 p-3"
          style={{
            background: "rgba(255,255,255,0.02)",
            borderLeft: `3px solid ${signalColor}`,
          }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <Zap className="h-2.5 w-2.5" style={{ color: signalColor }} />
            <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-zinc-500">SOLRAD READ</span>
          </div>
          {intelLoading ? (
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-zinc-800 animate-pulse" />
              <div className="h-3 w-3/4 rounded bg-zinc-800 animate-pulse" />
            </div>
          ) : intel?.insight ? (
            <p className="text-sm font-mono text-zinc-200 leading-relaxed">{intel.insight}</p>
          ) : (
            <p className="text-xs font-mono text-zinc-600 uppercase tracking-wider">INTEL GENERATING...</p>
          )}
        </div>

        {/* SECTION 4 -- STAT MATRIX (3x2) */}
        <div
          className="grid grid-cols-3 mb-4"
          style={{
            borderTop: "1px solid rgb(39 39 42)",
            borderBottom: "1px solid rgb(39 39 42)",
          }}
        >
          {/* Row 1 */}
          <div style={{ borderRight: "1px solid rgb(39 39 42)", borderBottom: "1px solid rgb(39 39 42)" }}>
            <StatCell
              label="LEAD TIME"
              value={bestLeadTime ? `~${bestLeadTime.minutes}m` : "\u2014"}
              valueColor={bestLeadTime ? "text-green-400" : "text-zinc-500"}
              sublabel="ahead of market"
              delay={0}
            />
          </div>
          <div style={{ borderRight: "1px solid rgb(39 39 42)", borderBottom: "1px solid rgb(39 39 42)" }}>
            <StatCell
              label="VELOCITY"
              value={velocity !== null ? `${velocity > 0 ? "+" : ""}${velocity.toFixed(1)} pts` : "\u2014"}
              valueColor={velocity !== null && velocity > 0 ? "text-green-400" : velocity !== null && velocity < 0 ? "text-red-400" : "text-zinc-500"}
              sublabel="1 cycle change"
              delay={50}
            />
          </div>
          <div style={{ borderBottom: "1px solid rgb(39 39 42)" }}>
            <StatCell
              label="ALPHA HITS"
              value={alphaLoaded ? String(alphaHits) : "\u2014"}
              valueColor={alphaHits > 0 ? "text-green-400" : "text-zinc-500"}
              sublabel="confirmed signals"
              delay={100}
            />
          </div>

          {/* Row 2 */}
          <div style={{ borderRight: "1px solid rgb(39 39 42)" }}>
            <StatCell
              label="RISK INDEX"
              value={riskIndex.topFlag === "CLEAN" ? "CLEAN" : String(riskIndex.score)}
              valueColor={riskIndex.score > 50 ? "text-red-400" : riskIndex.score > 25 ? "text-amber-400" : "text-green-400"}
              sublabel={riskIndex.topFlag === "CLEAN" ? "no flags" : riskIndex.topFlag}
              delay={150}
            />
          </div>
          <div style={{ borderRight: "1px solid rgb(39 39 42)" }}>
            <StatCell
              label="VOL/LIQ"
              value={volLiqRatio !== null ? `${volLiqRatio.toFixed(1)}x` : "\u2014"}
              valueColor={
                volLiqRatio !== null && volLiqRatio > 20
                  ? "text-red-400"
                  : volLiqRatio !== null && volLiqRatio >= 3 && volLiqRatio <= 15
                    ? "text-green-400"
                    : "text-zinc-400"
              }
              sublabel={volLiqRatio !== null && volLiqRatio > 20 ? "wash risk" : volLiqRatio !== null && volLiqRatio >= 3 && volLiqRatio <= 15 ? "healthy" : "ratio"}
              delay={200}
            />
          </div>
          <div>
            <StatCell
              label="SIGNAL AGE"
              value={signalAgeDays !== null ? `${signalAgeDays}d` : "\u2014"}
              valueColor={signalAgeDays !== null && signalAgeDays < 1 ? "text-amber-400" : "text-zinc-300"}
              sublabel={signalAgeDays !== null && signalAgeDays < 1 ? "very new" : "tracked"}
              delay={250}
            />
          </div>
        </div>

        {/* SECTION 5 -- MOMENTUM BAR */}
        <MomentumBar score={score} color={signalColor} />

        {/* SECTION 6 -- PROOF STRIP */}
        <div
          className="flex items-stretch mb-4 rounded-sm overflow-hidden"
          style={{ background: "rgba(24,24,27,0.5)" }}
        >
          <div className="flex-1 p-2.5 flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <span className="text-[8px] font-mono text-zinc-500">&#x25C8;</span>
              <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-zinc-500">LEAD-TIME PROOF</span>
            </div>
            {bestLeadTime ? (
              <>
                <span className="text-xs font-mono font-bold text-amber-400">~{bestLeadTime.blocks} blocks</span>
                <span className="text-[8px] font-mono text-zinc-600">est. {bestLeadTime.minutes}min before reaction</span>
              </>
            ) : (
              <span className="text-[8px] font-mono text-zinc-600">{leadTimeLoading ? "LOADING..." : "ACCUMULATING DATA"}</span>
            )}
          </div>
          <div className="w-px bg-zinc-800" />
          <div className="flex-1 p-2.5 flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <span className="text-[8px] font-mono text-zinc-500">&#x25C8;</span>
              <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-zinc-500">SIGNAL PROOFS</span>
            </div>
            {(() => {
              const proofCount = leadTimeStats?.totalProofs ?? leadTimeProofs.length
              if (proofCount === 0) {
                return <span className="text-[8px] font-mono text-zinc-600">NO PROOFS</span>
              }
              return (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-zinc-300">{proofCount}</span>
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-sm bg-green-500/20 text-green-400 border border-green-500/30">
                    {proofCount === 1 ? "PROOF" : "PROOFS"}
                  </span>
                </div>
              )
            })()}
          </div>
          <div className="w-px bg-zinc-800" />
          <div className="flex-1 p-2.5 flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <span className="text-[8px] font-mono text-zinc-500">&#x25C8;</span>
              <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-zinc-500">ALPHA LEDGER</span>
            </div>
            {bestGain != null ? (
              <span className="text-xs font-mono font-bold text-green-400">+{bestGain.toFixed(0)}% BEST</span>
            ) : (
              <span className="text-[8px] font-mono text-zinc-600">{alphaLoaded ? "NOT YET LOGGED" : "LOADING..."}</span>
            )}
          </div>
        </div>

        {/* SECTION 7 -- ACTION BAR */}
        <div className="flex gap-0">
          <button
            className="flex-1 py-2.5 font-mono text-[11px] font-bold uppercase tracking-wider transition-all hover:brightness-110 hover:-translate-y-px"
            style={{ background: signalColor, color: "#000" }}
            onClick={() => window.open(`https://jup.ag/?inputMint=So11111111111111111111111111111111111111112&outputMint=${token.address}&buy=${token.address}&sell=So11111111111111111111111111111111111111112`, "_blank", "noopener,noreferrer")}
          >
            TRADE
          </button>
          <button
            className="flex-1 py-2.5 font-mono text-[11px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-200 transition-all hover:brightness-110 hover:-translate-y-px flex items-center justify-center gap-1.5"
            onClick={handleCopyMint}
          >
            {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
            {copied ? "COPIED" : "COPY MINT"}
          </button>
  <button
  className="flex-1 py-2.5 font-mono text-[11px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-200 transition-all hover:brightness-110 hover:-translate-y-px flex items-center justify-center gap-1.5"
  onClick={handleShare}
  >
  {shareCopied ? <Check className="h-3 w-3 text-green-400" /> : <Share2 className="h-3 w-3" />}
  {shareCopied ? "COPIED!" : "SHARE"}
  </button>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes scanline {
          from { background-position: 0 0; }
          to { background-position: 0 100%; }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 8px currentColor; }
          50% { box-shadow: 0 0 16px currentColor; }
        }
      `}</style>
    </div>
  )
}
