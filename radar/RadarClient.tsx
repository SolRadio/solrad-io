"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Signal {
  id: string
  symbol: string
  score: number
  calledAt: string
  priceAtCall: number
  currentPrice: number
  change: number
  entryHash: string | null
}

interface LedgerResponse {
  signals: Signal[]
  total: number
  published: number
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const FREE_LIMIT = 5

function getScoreColor(score: number): string {
  if (score >= 85) return "#00FF88"
  if (score >= 70) return "#00CC66"
  if (score >= 55) return "#FFAA00"
  return "#4488FF"
}

function getTierLabel(score: number): string {
  if (score >= 85) return "ALPHA"
  if (score >= 70) return "HIGH"
  if (score >= 55) return "MID"
  return "LOW"
}

function getTierBgColor(score: number): string {
  if (score >= 85) return "rgba(0,255,136,0.15)"
  if (score >= 70) return "rgba(0,204,102,0.12)"
  if (score >= 55) return "rgba(255,170,0,0.12)"
  return "rgba(68,136,255,0.12)"
}

function formatChange(change: number): string {
  const sign = change >= 0 ? "+" : ""
  return `${sign}${change.toFixed(1)}%`
}

/* ─── Generate mock radar data ───────────────────────────────────────────── */
function generateMockTokens(): Signal[] {
  const tokens = [
    { symbol: "BONK", score: 94 },
    { symbol: "WIF", score: 88 },
    { symbol: "POPCAT", score: 82 },
    { symbol: "MYRO", score: 76 },
    { symbol: "BOME", score: 73 },
    { symbol: "SLERF", score: 69 },
    { symbol: "MEW", score: 67 },
    { symbol: "SILLY", score: 64 },
    { symbol: "PENG", score: 61 },
    { symbol: "WEN", score: 58 },
    { symbol: "SAMO", score: 55 },
    { symbol: "FIDA", score: 52 },
    { symbol: "MANGO", score: 48 },
    { symbol: "ORCA", score: 45 },
    { symbol: "RAY", score: 42 },
    { symbol: "STEP", score: 38 },
    { symbol: "COPE", score: 35 },
    { symbol: "TULIP", score: 30 },
    { symbol: "ATLAS", score: 26 },
    { symbol: "DUST", score: 22 },
  ]

  return tokens.map((t, i) => ({
    id: `radar-${i}`,
    symbol: t.symbol,
    score: t.score,
    calledAt: new Date(Date.now() - i * 3600000).toISOString(),
    priceAtCall: +(Math.random() * 5).toFixed(4),
    currentPrice: +(Math.random() * 6).toFixed(4),
    change: +(Math.random() * 60 - 10).toFixed(1),
    entryHash: t.score >= 55 ? `hash${i}abc...` : null,
  }))
}

/* ─── SVG Radar Visualization ────────────────────────────────────────────── */
function RadarCanvas({
  tokens,
  selectedToken,
  onSelect,
}: {
  tokens: Signal[]
  selectedToken: Signal | null
  onSelect: (t: Signal) => void
}) {
  const cx = 300
  const cy = 300
  const maxR = 260

  // Place tokens: score determines distance from center (higher = closer)
  // Angle distributed evenly
  const plotted = useMemo(() => {
    return tokens.map((t, i) => {
      const angle = (i / tokens.length) * 2 * Math.PI - Math.PI / 2
      // Higher score = closer to center
      const normalizedDist = 1 - t.score / 100
      const r = 40 + normalizedDist * (maxR - 40)
      const x = cx + r * Math.cos(angle)
      const y = cy + r * Math.sin(angle)
      const dotSize = t.score >= 85 ? 6 : t.score >= 70 ? 5 : t.score >= 55 ? 4 : 3
      return { ...t, x, y, dotSize }
    })
  }, [tokens])

  return (
    <svg
      viewBox="0 0 600 600"
      className="w-full h-full"
      style={{ maxWidth: 600, maxHeight: 600 }}
    >
      {/* Background */}
      <rect width="600" height="600" fill="#000000" />

      {/* Concentric rings */}
      {[0.25, 0.5, 0.75, 1].map((pct) => (
        <circle
          key={pct}
          cx={cx}
          cy={cy}
          r={maxR * pct}
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="1"
        />
      ))}

      {/* Cross lines */}
      <line x1={cx} y1={cy - maxR} x2={cx} y2={cy + maxR} stroke="#1a1a1a" strokeWidth="0.5" />
      <line x1={cx - maxR} y1={cy} x2={cx + maxR} y2={cy} stroke="#1a1a1a" strokeWidth="0.5" />
      <line
        x1={cx - maxR * 0.707}
        y1={cy - maxR * 0.707}
        x2={cx + maxR * 0.707}
        y2={cy + maxR * 0.707}
        stroke="#1a1a1a"
        strokeWidth="0.3"
      />
      <line
        x1={cx + maxR * 0.707}
        y1={cy - maxR * 0.707}
        x2={cx - maxR * 0.707}
        y2={cy + maxR * 0.707}
        stroke="#1a1a1a"
        strokeWidth="0.3"
      />

      {/* Radar sweep */}
      <g style={{ transformOrigin: `${cx}px ${cy}px`, animation: "radar-sweep 6s linear infinite" }}>
        <defs>
          <linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(0,255,136,0.2)" />
            <stop offset="100%" stopColor="rgba(0,255,136,0)" />
          </linearGradient>
        </defs>
        <line x1={cx} y1={cy} x2={cx} y2={cy - maxR} stroke="#00FF88" strokeWidth="1.5" opacity="0.6" />
        <path
          d={`M ${cx} ${cy} L ${cx} ${cy - maxR} A ${maxR} ${maxR} 0 0 1 ${cx + maxR * Math.sin(Math.PI / 6)} ${cy - maxR * Math.cos(Math.PI / 6)} Z`}
          fill="url(#sweepGrad)"
          opacity="0.4"
        />
      </g>

      {/* Zone labels */}
      <text x={cx + 8} y={cy - maxR * 0.25 + 4} fill="#333" fontSize="8" fontFamily="monospace">
        ALPHA
      </text>
      <text x={cx + 8} y={cy - maxR * 0.5 + 4} fill="#333" fontSize="8" fontFamily="monospace">
        HIGH
      </text>
      <text x={cx + 8} y={cy - maxR * 0.75 + 4} fill="#333" fontSize="8" fontFamily="monospace">
        MID
      </text>
      <text x={cx + 8} y={cy - maxR * 0.95 + 4} fill="#333" fontSize="8" fontFamily="monospace">
        LOW
      </text>

      {/* Token dots */}
      {plotted.map((t) => {
        const isSelected = selectedToken?.id === t.id
        const color = getScoreColor(t.score)
        return (
          <g
            key={t.id}
            onClick={() => onSelect(t)}
            className="cursor-pointer"
            role="button"
            tabIndex={0}
            aria-label={`${t.symbol} score ${t.score}`}
          >
            {/* Glow */}
            <circle cx={t.x} cy={t.y} r={t.dotSize + 6} fill={color} opacity={isSelected ? 0.2 : 0.08} />
            {/* Dot */}
            <circle cx={t.x} cy={t.y} r={t.dotSize} fill={color} opacity={0.9}>
              {t.score >= 85 && (
                <animate
                  attributeName="opacity"
                  values="0.9;0.5;0.9"
                  dur="2s"
                  repeatCount="indefinite"
                />
              )}
            </circle>
            {/* Label */}
            <text
              x={t.x}
              y={t.y - t.dotSize - 5}
              fill={isSelected ? "#ffffff" : color}
              fontSize={isSelected ? "10" : "8"}
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
              style={{ letterSpacing: "0.1em" }}
            >
              {t.symbol}
            </text>
          </g>
        )
      })}

      {/* Center dot */}
      <circle cx={cx} cy={cy} r="3" fill="#00FF88" opacity="0.6" />
    </svg>
  )
}

/* ─── Token Detail Panel ─────────────────────────────────────────────────── */
function TokenDetail({ token }: { token: Signal }) {
  return (
    <div className="flex flex-col gap-3 border border-[#1a1a1a] bg-[#0a0a0a] p-4">
      <div className="flex items-center justify-between">
        <span className="text-base font-bold tracking-widest text-foreground">{token.symbol}</span>
        <span
          className="text-xs font-bold tracking-widest px-2 py-0.5"
          style={{
            color: getScoreColor(token.score),
            backgroundColor: getTierBgColor(token.score),
          }}
        >
          {getTierLabel(token.score)}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold" style={{ color: getScoreColor(token.score) }}>
          {token.score}
        </span>
        <span className="text-xs tracking-widest uppercase text-muted-foreground">/100</span>
      </div>
      <div className="flex flex-col gap-1 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground tracking-widest">24H CHANGE</span>
          <span
            className="font-bold"
            style={{ color: token.change >= 0 ? "#00FF88" : "#ff4444" }}
          >
            {formatChange(token.change)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground tracking-widest">PROOF</span>
          <span style={{ color: token.entryHash ? "#00FF88" : "#737373" }}>
            {token.entryHash ? "VERIFIED" : "PENDING"}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ─── Mobile Token List ──────────────────────────────────────────────────── */
function MobileTokenList({
  tokens,
  onSelect,
  selectedToken,
}: {
  tokens: Signal[]
  onSelect: (t: Signal) => void
  selectedToken: Signal | null
}) {
  const sorted = useMemo(
    () => [...tokens].sort((a, b) => b.score - a.score).slice(0, 20),
    [tokens]
  )

  return (
    <div className="flex flex-col">
      <h2
        className="flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-[0.25em] uppercase border-b border-[#1a1a1a]"
        style={{ color: "#00FF88" }}
      >
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{
            backgroundColor: "#00FF88",
            animation: "pulse-glow 2s ease-in-out infinite",
          }}
        />
        LIVE RADAR
      </h2>
      <div className="flex flex-col divide-y divide-[#1a1a1a] max-h-[calc(100vh-200px)] overflow-y-auto">
        {sorted.map((t) => {
          const isSelected = selectedToken?.id === t.id
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              className="flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer"
              style={{
                backgroundColor: isSelected ? "#0a0a0a" : "transparent",
              }}
            >
              {/* Token circle */}
              <div
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
                style={{
                  backgroundColor: getTierBgColor(t.score),
                  color: getScoreColor(t.score),
                  border: `1px solid ${getScoreColor(t.score)}33`,
                }}
              >
                {t.symbol.slice(0, 2)}
              </div>

              {/* Symbol */}
              <span className="flex-1 text-xs font-bold tracking-widest uppercase text-foreground">
                {t.symbol}
              </span>

              {/* Score */}
              <span className="text-sm font-bold" style={{ color: getScoreColor(t.score) }}>
                {t.score}
              </span>

              {/* Tier badge */}
              <span
                className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider"
                style={{
                  color: getScoreColor(t.score),
                  backgroundColor: getTierBgColor(t.score),
                }}
              >
                {getTierLabel(t.score)}
              </span>

              {/* Change */}
              <span
                className="min-w-[52px] text-right text-[11px] font-bold"
                style={{ color: t.change >= 0 ? "#00FF88" : "#ff4444" }}
              >
                {formatChange(t.change)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Auth Gate Banner ───────────────────────────────────────────────────── */
function AuthGateBanner({ totalCount }: { totalCount: number }) {
  return (
    <div
      className="flex flex-col items-center justify-between gap-3 border-b border-[#1a1a1a] px-4 py-3 sm:flex-row"
      style={{ backgroundColor: "rgba(255,170,0,0.06)" }}
    >
      <p className="text-xs tracking-widest uppercase text-[#ffaa00]">
        Full radar requires subscription — viewing {FREE_LIMIT} of {totalCount} tokens
      </p>
      <Link
        href="/pro"
        className="flex-shrink-0 px-4 py-1.5 text-[11px] font-bold tracking-[0.15em] uppercase transition-colors"
        style={{
          border: "1px solid #00FF88",
          color: "#00FF88",
        }}
      >
        SUBSCRIBE
      </Link>
    </div>
  )
}

/* ─── Main RadarClient ───────────────────────────────────────────────────── */
export default function RadarClient() {
  const { isSignedIn } = useUser()
  const [allTokens, setAllTokens] = useState<Signal[]>([])
  const [selectedToken, setSelectedToken] = useState<Signal | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const tokens = generateMockTokens()
    setAllTokens(tokens)
    setSelectedToken(tokens[0])
    setLoading(false)
  }, [])

  // Auth gate: limit to 5 tokens if not signed in
  const visibleTokens = useMemo(() => {
    if (!isSignedIn) return allTokens.slice(0, FREE_LIMIT)
    return allTokens
  }, [isSignedIn, allTokens])

  const isGated = !isSignedIn && allTokens.length > FREE_LIMIT

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-12 w-12 rounded-full border-2 border-transparent"
            style={{
              borderTopColor: "#00FF88",
              animation: "radar-sweep 1s linear infinite",
            }}
          />
          <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground">
            Loading radar...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col">
      {/* Auth gate banner */}
      {isGated && <AuthGateBanner totalCount={allTokens.length} />}

      {/* Desktop layout */}
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Radar SVG - desktop only */}
        <div className="relative hidden flex-1 items-center justify-center p-6 md:flex">
          <RadarCanvas
            tokens={visibleTokens}
            selectedToken={selectedToken}
            onSelect={setSelectedToken}
          />

          {/* Blur overlay for gated extra space */}
          {isGated && (
            <div
              className="pointer-events-none absolute inset-0 flex items-end justify-center pb-12"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 40%)",
              }}
            >
              <p className="text-xs tracking-widest uppercase text-muted-foreground">
                {allTokens.length - FREE_LIMIT} more tokens hidden
              </p>
            </div>
          )}
        </div>

        {/* Mobile token list */}
        <div className="block md:hidden">
          <MobileTokenList
            tokens={visibleTokens}
            onSelect={setSelectedToken}
            selectedToken={selectedToken}
          />
        </div>

        {/* Right sidebar - token detail + legend */}
        <div className="flex w-full flex-col gap-4 border-t border-[#1a1a1a] p-4 md:w-72 md:border-l md:border-t-0 lg:w-80">
          {/* Selected token */}
          {selectedToken && <TokenDetail token={selectedToken} />}

          {/* Scoreboard - top 5 */}
          <div className="flex flex-col border border-[#1a1a1a] bg-[#0a0a0a]">
            <div className="border-b border-[#1a1a1a] px-4 py-2.5">
              <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground">
                TOP SIGNALS
              </h3>
            </div>
            {visibleTokens
              .slice(0, 5)
              .sort((a, b) => b.score - a.score)
              .map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedToken(t)}
                  className="flex items-center gap-3 border-b border-[#1a1a1a]/50 px-4 py-2.5 text-left transition-colors hover:bg-[#111] cursor-pointer last:border-b-0"
                >
                  <span className="w-4 text-[10px] font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-xs font-bold tracking-widest uppercase text-foreground">
                    {t.symbol}
                  </span>
                  <span
                    className="text-xs font-bold"
                    style={{ color: getScoreColor(t.score) }}
                  >
                    {t.score}
                  </span>
                </button>
              ))}
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-2 border border-[#1a1a1a] bg-[#0a0a0a] p-4">
            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-1">
              SIGNAL TIERS
            </h3>
            {[
              { label: "ALPHA", range: "85-100", color: "#00FF88" },
              { label: "HIGH", range: "70-84", color: "#00CC66" },
              { label: "MID", range: "55-69", color: "#FFAA00" },
              { label: "LOW", range: "0-54", color: "#4488FF" },
            ].map((tier) => (
              <div key={tier.label} className="flex items-center gap-2 text-[10px]">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: tier.color }}
                />
                <span className="font-bold tracking-widest" style={{ color: tier.color }}>
                  {tier.label}
                </span>
                <span className="text-muted-foreground">{tier.range}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
