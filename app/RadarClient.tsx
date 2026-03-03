"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import { TokenImage } from "@/components/token-image"
import { TokenDetailDrawer } from "@/components/token-detail-drawer"
import type { TokenScore } from "@/lib/types"

/* ─── Types ────────────────────────────────────────────────── */
interface RadarToken {
  address: string
  symbol: string
  name: string
  totalScore: number
  priceUsd: number
  priceChange1h?: number
  priceChange24h: number
  volume24h: number
  liquidity: number
  imageUrl?: string
  signalState?: string
  liquidityScore?: number
  volumeScore?: number
  activityScore?: number
  ageScore?: number
  healthScore?: number
  boostScore?: number
  entryHash?: string
}

/* ─── Helpers ──────────────────────────────────────────────── */
function scoreColor(s: number) {
  if (s >= 85) return "#00FF88"
  if (s >= 75) return "#00CC66"
  if (s >= 65) return "#FFAA00"
  if (s >= 50) return "#4488FF"
  return "#4488FF"
}

function mintToAngle(mint: string) {
  return parseInt(mint.slice(0, 8), 16) % 360
}

function fmtPct(v?: number) {
  if (v == null) return "--"
  const sign = v >= 0 ? "+" : ""
  return `${sign}${v.toFixed(1)}%`
}

const SIGNAL_SIZES: Record<string, number> = {
  STRONG: 52,
  PEAK:   48,
  EARLY:  40,
  CAUTION: 34,
  DETECTED: 28,
}

function getTokenSize(signalState?: string): number {
  return SIGNAL_SIZES[signalState ?? "DETECTED"] ?? 32
}

function fmtVol(v: number) {
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`
  return `$${v.toFixed(0)}`
}

/* ─── Stable collision-aware positioning ──────────────────── */
function mintToSeed(mint: string): number {
  let hash = 0
  for (let i = 0; i < mint.length; i++) {
    hash = ((hash << 5) - hash) + mint.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function getStablePositions(
  tokens: Array<{ address: string }>,
  containerSize: number,
  circleSize: number
): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = []
  const padding = circleSize * 1.4
  const margin = circleSize

  for (const token of tokens) {
    const rand = seededRandom(mintToSeed(token.address))
    let placed = false

    for (let attempt = 0; attempt < 150; attempt++) {
      const x = margin + rand() * (containerSize - margin * 2)
      const y = margin + rand() * (containerSize - margin * 2)

      const overlaps = positions.some((p) => {
        const dist = Math.sqrt(Math.pow(x - p.x, 2) + Math.pow(y - p.y, 2))
        return dist < padding
      })

      if (!overlaps) {
        positions.push({ x, y })
        placed = true
        break
      }
    }

    if (!placed) {
      const rand2 = seededRandom(mintToSeed(token.address) + 999)
      positions.push({
        x: margin + rand2() * (containerSize - margin * 2),
        y: margin + rand2() * (containerSize - margin * 2),
      })
    }
  }

  return positions
}

/* ─── Radar SVG ────────────────────────────────────────────── */
function RadarSVG({
  tokens,
  loading,
  onSelect,
  hoveredMint,
  setHoveredMint,
  pingedMints,
}: {
  tokens: RadarToken[]
  loading: boolean
  onSelect: (t: RadarToken) => void
  hoveredMint: string | null
  setHoveredMint: (m: string | null) => void
  pingedMints: Set<string>
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [bounds, setBounds] = useState({ width: 0, height: 0 })
  const [tooltip, setTooltip] = useState<{ x: number; y: number; token: RadarToken } | null>(null)

  const tokenPositions = useMemo(() => {
    return getStablePositions(tokens, 500, 40)
  }, [tokens])

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setBounds({ width: rect.width, height: rect.height })
      }
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [])

  const rings = [1, 0.75, 0.5, 0.25]
  const ringLabels = ["EARLY", "CAUTION", "STRONG", "PEAK"]

  const placeholders = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => ({
      angle: (i * 36 + 15) % 360,
      radius: 0.3 + Math.random() * 0.5,
    }))
  }, [])

  return (
    <div ref={containerRef} style={{ position: "relative", width: "min(90vw, calc(100vh - 120px))", height: "min(90vw, calc(100vh - 120px))" }}>
      <svg
        viewBox="0 0 500 500"
        className="w-full h-full"
        style={{ width: "100%", height: "100%" }}
      >
        <defs>
          <radialGradient id="sweepGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00FF88" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#00FF88" stopOpacity="0.12" />
          </radialGradient>
          <radialGradient id="sweepTrail" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00FF88" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#00FF88" stopOpacity="0.0" />
          </radialGradient>
        </defs>

        {/* Crosshair */}
        <line x1="250" y1="30" x2="250" y2="470" stroke="#151515" strokeWidth="0.5" />
        <line x1="30" y1="250" x2="470" y2="250" stroke="#151515" strokeWidth="0.5" />

        {/* Polar grid spokes */}
        {[22.5, 67.5, 112.5, 157.5].map((deg) => {
          const rad = (deg * Math.PI) / 180
          const x2 = 250 + Math.cos(rad) * 220
          const y2 = 250 + Math.sin(rad) * 220
          const x2b = 250 - Math.cos(rad) * 220
          const y2b = 250 - Math.sin(rad) * 220
          return (
            <line
              key={`spoke-${deg}`}
              x1={x2b} y1={y2b} x2={x2} y2={y2}
              stroke="#0F0F0F"
              strokeWidth="0.5"
              strokeOpacity="0.8"
            />
          )
        })}

        {/* Rings */}
        {rings.map((r, i) => (
          <circle
            key={i}
            cx="250"
            cy="250"
            r={r * 220}
            fill="none"
            stroke={["#1A1A1A", "#1A1A1A", "#222222", "#00FF88"][i]}
            strokeOpacity={[0.6, 0.6, 0.6, 0.2][i]}
            strokeWidth="1"
          />
        ))}

        {/* Ring labels at 12 o'clock */}
        {rings.map((r, i) => {
          const ringRadius = r * 220
          const labelY = 250 - ringRadius - 10
          const labelColors = ["#4488FF", "#FFAA00", "#00CC66", "#00FF88"]
          const labelOpacities = [0.6, 0.6, 0.8, 0.95]
          const labelWeights = ["normal", "normal", "normal", "bold"]
          return (
            <text
              key={`label-${i}`}
              x={250}
              y={labelY}
              fill={labelColors[i]}
              fillOpacity={labelOpacities[i]}
              fontFamily="monospace"
              fontSize="8"
              fontWeight={labelWeights[i]}
              textAnchor="middle"
              letterSpacing="2"
            >
              {ringLabels[i]}
            </text>
          )
        })}

        {/* Pure SVG sweep */}
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 250 250"
            to="360 250 250"
            dur="4s"
            repeatCount="indefinite"
          />
          <path
            d="M250,250 L250,30 A220,220 0 0,1 469,250 Z"
            fill="url(#sweepGrad)"
            fillOpacity="0.04"
          />
          <path d="M250,250 L250,30 A220,220 0 0,1 405,95 Z" fill="url(#sweepGrad)" fillOpacity="0.9" />
          <line x1="250" y1="250" x2="250" y2="30" stroke="#00FF88" strokeOpacity="0.7" strokeWidth="1.5" />
          <circle cx="250" cy="250" r="3" fill="#00FF88" fillOpacity="0.6" />
        </g>

        {/* Loading placeholders */}
        {loading &&
          placeholders.map((p, i) => {
            const rad = (p.angle * Math.PI) / 180
            const dist = p.radius * 220
            const x = 250 + Math.cos(rad) * dist
            const y = 250 + Math.sin(rad) * dist
            return (
              <circle key={`ph-${i}`} cx={x} cy={y} r={5} fill="#333333" fillOpacity="0.4">
                <animate attributeName="opacity" values="0.2;0.5;0.2" dur="2s" repeatCount="indefinite" />
              </circle>
            )
          })}

        {/* SVG pulse rings for high-score tokens */}
        {!loading &&
          tokens.map((t, idx) => {
            if (t.totalScore < 75) return null
            const pos = tokenPositions[idx]
            if (!pos) return null
            const color = scoreColor(t.totalScore)
            const pr = getTokenSize(t.signalState) / 2
            const isPeak = t.totalScore >= 85
            return (
              <g key={`pulse-${t.address}`}>
                <circle cx={pos.x} cy={pos.y} r={pr + 4} fill="none" stroke={color} strokeOpacity="0.3">
                  <animate attributeName="r" values={`${pr + 2};${pr + 10};${pr + 2}`} dur="2s" repeatCount="indefinite" />
                  <animate attributeName="stroke-opacity" values="0.3;0.05;0.3" dur="2s" repeatCount="indefinite" />
                </circle>
                {isPeak && (
                  <circle cx={pos.x} cy={pos.y} r={pr + 12} fill="none" stroke={color} strokeOpacity="0.15">
                    <animate attributeName="r" values={`${pr + 10};${pr + 20};${pr + 10}`} dur="2.5s" repeatCount="indefinite" />
                    <animate attributeName="stroke-opacity" values="0.15;0.02;0.15" dur="2.5s" repeatCount="indefinite" />
                  </circle>
                )}
              </g>
            )
          })}
      </svg>

      {/* Token image layer on top */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {!loading &&
          bounds.width > 0 &&
          tokens.map((t, idx) => {
            const pos = tokenPositions[idx]
            if (!pos) return null
            const scale = bounds.width / 500
            const cx = pos.x * scale
            const cy = pos.y * scale
            const size = getTokenSize(t.signalState) * scale
            const color = scoreColor(t.totalScore)
            const isHovered = hoveredMint === t.address
            const isPinged = pingedMints.has(t.address)

            return (
              <div
                key={t.address}
                style={{
                  position: "absolute",
                  left: cx - size / 2,
                  top: cy - size / 2,
                  width: size,
                  height: size,
                }}
              >
                {isPinged && (
                  <div
                    style={{
                      position: "absolute",
                      width: size + 20,
                      height: size + 20,
                      borderRadius: "50%",
                      border: `2px solid ${color}`,
                      top: -10,
                      left: -10,
                      animation: "ping-fade 0.8s ease-out forwards",
                      pointerEvents: "none",
                      zIndex: 25,
                    }}
                  />
                )}
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    overflow: "hidden",
                    cursor: "pointer",
                    pointerEvents: "all",
                    border: `2px solid ${color}`,
                    boxShadow: isPinged
                      ? `0 0 24px ${color}, 0 0 48px ${color}60, 0 0 2px ${color}`
                      : isHovered
                        ? `0 0 16px ${color}, 0 0 32px ${color}40`
                        : `0 0 8px ${color}60`,
                    transition: "box-shadow 0.15s",
                    zIndex: isHovered ? 20 : 2,
                    background: "#000000",
                  }}
                  onMouseEnter={() => {
                    setHoveredMint(t.address)
                    setTooltip({ x: cx, y: cy - size / 2 - 8, token: t })
                  }}
                  onMouseLeave={() => {
                    setHoveredMint(null)
                    setTooltip(null)
                  }}
                  onClick={() => onSelect(t)}
                >
                  <TokenImage
                    src={t.imageUrl}
                    symbol={t.symbol}
                    size={Math.round(size)}
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              </div>
            )
          })}
      </div>

      {/* HTML tooltip */}
      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
            background: "#050505",
            border: `1px solid ${scoreColor(tooltip.token.totalScore)}30`,
            padding: "8px 12px",
            pointerEvents: "none",
            zIndex: 30,
            whiteSpace: "nowrap",
            borderRadius: 4,
            boxShadow: `0 0 12px ${scoreColor(tooltip.token.totalScore)}20`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: "bold", color: scoreColor(tooltip.token.totalScore) }}>
              ${tooltip.token.symbol}
            </span>
            <span style={{ fontFamily: "monospace", fontSize: 11, color: scoreColor(tooltip.token.totalScore) }}>
              {tooltip.token.totalScore.toFixed(1)}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <span style={{ fontFamily: "monospace", fontSize: 9, color: "#555" }}>
              VOL {fmtVol(tooltip.token.volume24h)}
            </span>
            {tooltip.token.priceChange1h != null && (
              <span style={{
                fontFamily: "monospace",
                fontSize: 9,
                color: tooltip.token.priceChange1h >= 0 ? "#00CC66" : "#FF4444",
              }}>
                {fmtPct(tooltip.token.priceChange1h)} / 1h
              </span>
            )}
          </div>
          {tooltip.token.signalState && (
            <div style={{
              fontFamily: "monospace",
              fontSize: 8,
              letterSpacing: "0.1em",
              color: scoreColor(tooltip.token.totalScore),
              opacity: 0.6,
              marginTop: 4,
              textTransform: "uppercase",
            }}>
              {tooltip.token.signalState}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Main Radar Client ────────────────────────────────────── */
export function RadarClient() {
  const { isSignedIn, isLoaded } = useUser()
  const [tokens, setTokens] = useState<RadarToken[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedToken, setSelectedToken] = useState<TokenScore | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [hoveredMint, setHoveredMint] = useState<string | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState<number>(Date.now())
  const [secondsAgo, setSecondsAgo] = useState(0)
  const [pingedMints, setPingedMints] = useState<Set<string>>(new Set())
  const sweepAngleRef = useRef(0)

  const fetchTokens = useCallback(async () => {
    try {
      const res = await fetch("/api/tokens")
      if (!res.ok) throw new Error("fetch failed")
      const data = await res.json()
      const list = Array.isArray(data) ? data : data.tokens ?? []
      setTokens(list)
      setLastFetchTime(Date.now())
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTokens()
    const interval = setInterval(fetchTokens, 30_000)
    return () => clearInterval(interval)
  }, [fetchTokens])

  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastFetchTime) / 1000))
    }, 1000)
    return () => clearInterval(tick)
  }, [lastFetchTime])

  useEffect(() => {
    if (tokens.length === 0) return
    const interval = setInterval(() => {
      sweepAngleRef.current = (sweepAngleRef.current + 1.5) % 360
      const currentAngle = sweepAngleRef.current
      const hits = new Set<string>()
      tokens.forEach(t => {
        if (t.totalScore < 65) return
        const tokenAngle = mintToAngle(t.address)
        const diff = Math.abs((currentAngle - tokenAngle + 360) % 360)
        if (diff < 3) hits.add(t.address)
      })
      if (hits.size > 0) {
        setPingedMints(prev => new Set([...prev, ...hits]))
        setTimeout(() => {
          setPingedMints(prev => {
            const next = new Set(prev)
            hits.forEach(m => next.delete(m))
            return next
          })
        }, 800)
      }
    }, 16)
    return () => clearInterval(interval)
  }, [tokens])

  const activeCount = tokens.filter((t) => t.totalScore >= 50).length

  const topToken = tokens.length > 0
    ? tokens.reduce((best, t) => t.totalScore > best.totalScore ? t : best, tokens[0])
    : null

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{
        background: "#000000",
        backgroundImage: "radial-gradient(#111111 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    >
      {/* Glass navbar */}
      <nav
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-14 px-4 sm:px-6"
        style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid #111111" }}
      >
        <div className="flex items-center gap-2">
          <img src="/images/solradWB.png" alt="SOLRAD" className="h-7 w-auto" />
          <span className="flex items-center gap-1 ml-2">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="font-mono text-[10px] text-green-400 tracking-widest">LIVE</span>
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/dashboard"
            className="font-mono text-[11px] text-green-400 border border-green-500/30 px-3 sm:px-4 py-1.5 rounded hover:bg-green-500/10 transition-colors tracking-wide"
          >
            {"DASHBOARD ->"}
          </Link>
          <Link
            href="/whitepaper"
            className="hidden sm:inline-block font-mono text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors tracking-wide"
          >
            WHITEPAPER
          </Link>
          <Link
            href="/pro"
            className="font-mono text-[11px] font-bold bg-green-500 text-black px-3 sm:px-4 py-1.5 rounded hover:bg-green-400 transition-colors tracking-wide"
          >
            {"GO PRO ->"}
          </Link>
        </div>
      </nav>

      {/* Radar area */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ paddingTop: "56px", paddingBottom: "56px" }}
      >
        {/* Radial glow */}
        <div
          style={{
            position: "absolute",
            width: "30%",
            height: "30%",
            borderRadius: "50%",
            background: "radial-gradient(circle, #00FF8808 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
        />

        {error && !loading && tokens.length === 0 ? (
          <div className="flex flex-col items-center gap-4">
            <span className="font-mono text-xs tracking-wider" style={{ color: "#FF444460" }}>
              SIGNAL FEED OFFLINE
            </span>
            <button
              onClick={fetchTokens}
              className="font-mono text-[11px] text-green-400 border border-green-500/30 px-4 py-1.5 rounded hover:bg-green-500/10 transition-colors"
            >
              RETRY
            </button>
          </div>
        ) : (
          <RadarSVG
            tokens={tokens}
            loading={loading}
            onSelect={(t) => {
              setSelectedToken(t as unknown as TokenScore)
              setDrawerOpen(true)
            }}
            hoveredMint={hoveredMint}
            setHoveredMint={setHoveredMint}
            pingedMints={pingedMints}
          />
        )}
      </div>

      {/* Sign-in gate overlay — shown when Clerk has loaded and user is not signed in */}
      {isLoaded && !isSignedIn && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{
            background: "rgba(0,0,0,0.82)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div
            style={{
              border: "1px solid #1a1a1a",
              background: "#050505",
              padding: "36px 40px",
              textAlign: "center",
              maxWidth: 360,
            }}
          >
            <div className="font-mono text-[10px] tracking-[0.25em] text-zinc-500 uppercase mb-3">
              Access Required
            </div>
            <div className="font-mono text-xl font-bold text-foreground tracking-tight mb-2">
              SOLRAD Radar
            </div>
            <div className="font-mono text-[11px] text-zinc-500 leading-relaxed mb-6">
              Sign in to access the live token radar and signal feed.
            </div>
            <div className="flex flex-col gap-3">
              <Link
                href="/sign-in"
                className="font-mono text-[11px] font-bold text-black bg-green-400 px-6 py-2.5 tracking-widest uppercase hover:bg-green-300 transition-colors"
              >
                SIGN IN
              </Link>
              <Link
                href="/sign-up"
                className="font-mono text-[11px] text-green-400 border border-green-500/30 px-6 py-2.5 tracking-widest uppercase hover:bg-green-500/10 transition-colors"
              >
                CREATE ACCOUNT
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Signal Tier Legend */}
      {!loading && tokens.length > 0 && (
        <div
          style={{
            position: "fixed",
            left: 16,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 20,
            background: "rgba(0,0,0,0.75)",
            border: "1px solid #111",
            padding: 12,
            backdropFilter: "blur(8px)",
            borderRadius: 4,
            minWidth: 120,
          }}
        >
          <div style={{ fontFamily: "monospace", fontSize: 8, letterSpacing: "0.15em", color: "#52525b", marginBottom: 8, textTransform: "uppercase" }}>
            Signal Tier
          </div>
          {[
            { label: "PEAK",    color: "#00FF88", range: "85+" },
            { label: "STRONG",  color: "#00CC66", range: "75\u201384" },
            { label: "CAUTION", color: "#FFAA00", range: "65\u201374" },
            { label: "EARLY",   color: "#4488FF", range: "50\u201364" },
          ].map(({ label, color, range }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 4, paddingBottom: 4 }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: color,
                boxShadow: `0 0 6px ${color}`,
                flexShrink: 0,
              }} />
              <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: "bold", color, letterSpacing: "0.05em" }}>
                {label}
              </span>
              <span style={{ fontFamily: "monospace", fontSize: 9, color: "#52525b" }}>
                {range}
              </span>
            </div>
          ))}
          <div style={{ borderTop: "1px solid #1a1a1a", margin: "8px 0" }} />
          <div style={{ fontFamily: "monospace", fontSize: 8, letterSpacing: "0.15em", color: "#52525b", marginBottom: 6, textTransform: "uppercase" }}>
            Circle Size
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
            <span style={{ fontFamily: "monospace", fontSize: 9, color: "#71717a" }}>High volume</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.2)", flexShrink: 0, marginLeft: 2 }} />
            <span style={{ fontFamily: "monospace", fontSize: 9, color: "#71717a" }}>Low volume</span>
          </div>
        </div>
      )}

      {/* Top Signal badge */}
      {!loading && topToken && (
        <div
          style={{
            position: "fixed",
            right: 16,
            top: 72,
            zIndex: 20,
            background: "rgba(0,0,0,0.82)",
            border: "1px solid rgba(0,255,136,0.18)",
            padding: "10px 14px",
            backdropFilter: "blur(8px)",
            borderRadius: 4,
            minWidth: 140,
          }}
        >
          <div style={{ fontFamily: "monospace", fontSize: 8, letterSpacing: "0.15em", color: "#71717a", marginBottom: 6, textTransform: "uppercase" }}>
            Top Signal
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: "bold", color: "#00FF88" }}>
              ${topToken.symbol}
            </span>
            <span style={{ fontFamily: "monospace", fontSize: 13, color: "#00FF88" }}>
              {topToken.totalScore.toFixed(1)}
            </span>
          </div>
          {topToken.priceChange1h != null && (
            <div style={{
              fontFamily: "monospace",
              fontSize: 10,
              color: topToken.priceChange1h >= 0 ? "#00CC66" : "#FF4444",
              marginTop: 4,
            }}>
              {topToken.priceChange1h >= 0 ? "\u25B2" : "\u25BC"} {fmtPct(topToken.priceChange1h)} / 1h
            </div>
          )}
        </div>
      )}

      {/* ENTER DASHBOARD */}
      <Link
        href="/dashboard"
        className="fixed left-0 right-0 text-center font-mono text-[10px] tracking-wider transition-colors z-30"
        style={{ bottom: "64px", color: "rgba(161,161,170,0.4)" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(161,161,170,0.8)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(161,161,170,0.4)")}
      >
        {"ENTER DASHBOARD"}
      </Link>

      {/* Glass bottom HUD */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between h-14 px-4 sm:px-6"
        style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(12px)", borderTop: "1px solid #111111" }}
      >
        <div className="flex items-center gap-3 sm:gap-5 overflow-x-auto">
          <span className="flex items-center gap-1.5 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="font-mono text-[11px] text-green-400 tracking-wide">
              {loading ? "SCANNING..." : `${activeCount} SIGNALS ACTIVE`}
            </span>
          </span>
          <span className="hidden sm:inline-block text-zinc-700">|</span>
          <Link
            href="/proof-protocol"
            className="hidden sm:inline-block font-mono text-[11px] text-green-400 tracking-wide hover:text-green-300 transition-colors shrink-0"
          >
            PROOF ON SOLANA
          </Link>
          <span className="hidden sm:inline-block text-zinc-700">|</span>
          <span className="hidden sm:inline-block font-mono text-[11px] text-zinc-500 tracking-wide shrink-0">
            {tokens.length} TOKENS TRACKED
          </span>
        </div>
        <span className="font-mono text-[10px] text-zinc-600 shrink-0">
          Last scan: {secondsAgo}s ago
        </span>
      </div>

      {/* DETAIL DRAWER */}
      {selectedToken && (
        <TokenDetailDrawer
          token={selectedToken}
          open={drawerOpen}
          onOpenChange={(open) => {
            setDrawerOpen(open)
            if (!open) setSelectedToken(null)
          }}
        />
      )}
    </div>
  )
}
