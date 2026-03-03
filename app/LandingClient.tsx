"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

/* ── Types ────────────────────────────────────────────────────────────── */

interface Signal {
  id: string
  symbol: string
  name: string
  score: number
  calledAt: string
  pct24h: number
  change: number
  entryHash: string | null
}

interface LedgerResponse {
  signals: Signal[]
  total: number
  published: number
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

function getScoreColor(score: number): string {
  if (score >= 85) return "#00FF88"
  if (score >= 75) return "#00CC66"
  if (score >= 65) return "#FFAA00"
  return "#4488FF"
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function isToday(iso: string): boolean {
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCDate() === now.getUTCDate()
  )
}

/* ── Radar SVG (shared between hero & final CTA) ─────────────────────── */

function RadarSVG({ size, opacity }: { size: number; opacity: number }) {
  const r = size / 2
  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      aria-hidden="true"
      style={{ opacity }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute"
      >
        {/* Concentric circles */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <circle
            key={f}
            cx={r}
            cy={r}
            r={r * f}
            fill="none"
            stroke="#00FF88"
            strokeWidth="0.5"
          />
        ))}
      </svg>
      {/* Rotating sweep line + conic trail */}
      <div
        className="absolute"
        style={{
          width: size,
          height: size,
          animation: "radar-sweep 4s linear infinite",
        }}
      >
        {/* Line */}
        <div
          className="absolute left-1/2 top-0 -translate-x-px"
          style={{
            width: 1,
            height: r,
            background: "#00FF88",
            transformOrigin: `0.5px ${r}px`,
          }}
        />
        {/* Conic trail */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 300deg, rgba(0,255,136,0.15) 360deg)",
          }}
        />
      </div>
    </div>
  )
}

/* ── SECTION 1: HERO ─────────────────────────────────────────────────── */

function HeroSection({
  totalSignals,
  firstSeenToday,
  loading,
}: {
  totalSignals: number
  firstSeenToday: number
  loading: boolean
}) {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(circle, #1a1a1a 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.4,
        }}
      />

      {/* Radar */}
      <RadarSVG size={900} opacity={0.07} />

      {/* Foreground */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Status bar */}
        <div className="mb-10 flex items-center gap-3 font-mono text-xs tracking-widest" style={{ color: "#666666" }}>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor: "#00FF88",
                animation: "pulse-glow 2s ease-in-out infinite",
              }}
            />
            LIVE
          </span>
          <span style={{ color: "#1a1a1a" }}>|</span>
          <span>SOLANA MAINNET</span>
          <span style={{ color: "#1a1a1a" }}>|</span>
          <span>PROOF CHAIN: ACTIVE</span>
        </div>

        {/* Main heading */}
        <h1
          className="font-mono font-bold text-white"
          style={{
            fontSize: "clamp(64px, 12vw, 140px)",
            letterSpacing: "0.15em",
          }}
        >
          SOLRAD
        </h1>
        <div className="mx-auto mt-1 w-full max-w-md" style={{ height: 2, backgroundColor: "#00FF88" }} />

        {/* Subheadings */}
        <p
          className="mt-4 font-mono text-sm uppercase"
          style={{ letterSpacing: "0.4em", color: "#00FF88" }}
        >
          SOLANA SIGNAL INTELLIGENCE
        </p>
        <p
          className="mt-2 font-mono text-base"
          style={{ letterSpacing: "0.15em", color: "#888888" }}
        >
          We detect tokens early. We prove it on Solana.
        </p>

        {/* Stats */}
        <div className="mt-8 flex items-stretch justify-center gap-0">
          {/* Stat 1 */}
          <div className="flex flex-col items-center px-6 sm:px-8">
            <span className="font-mono text-2xl text-white">
              {loading ? "---" : (totalSignals ?? 0).toLocaleString()}
            </span>
            <span
              className="mt-1 font-mono uppercase"
              style={{ fontSize: 10, letterSpacing: "0.3em", color: "#71717a" }}
            >
              SIGNALS
            </span>
            <span
              className="font-mono uppercase"
              style={{ fontSize: 10, letterSpacing: "0.3em", color: "#71717a" }}
            >
              RECORDED
            </span>
          </div>
          <div className="w-px self-stretch" style={{ backgroundColor: "#1a1a1a" }} />
          {/* Stat 2 */}
          <div className="flex flex-col items-center px-6 sm:px-8">
            <span className="font-mono text-2xl text-white">
              {loading ? "---" : firstSeenToday}
            </span>
            <span
              className="mt-1 font-mono uppercase"
              style={{ fontSize: 10, letterSpacing: "0.3em", color: "#71717a" }}
            >
              FIRST SEEN
            </span>
            <span
              className="font-mono uppercase"
              style={{ fontSize: 10, letterSpacing: "0.3em", color: "#71717a" }}
            >
              TODAY
            </span>
          </div>
          <div className="w-px self-stretch" style={{ backgroundColor: "#1a1a1a" }} />
          {/* Stat 3 */}
          <div className="flex flex-col items-center px-6 sm:px-8">
            <span className="font-mono text-2xl text-white">3</span>
            <span
              className="mt-1 font-mono uppercase"
              style={{ fontSize: 10, letterSpacing: "0.3em", color: "#71717a" }}
            >
              PUBLICATIONS
            </span>
            <span
              className="font-mono uppercase"
              style={{ fontSize: 10, letterSpacing: "0.3em", color: "#71717a" }}
            >
              ON-CHAIN
            </span>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/pro"
            className="font-mono text-sm uppercase transition-colors"
            style={{
              letterSpacing: "0.2em",
              border: "1px solid #00FF88",
              color: "#00FF88",
              padding: "14px 32px",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "rgba(0,255,136,0.08)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            {"JOIN SOLRAD \u2014 $9.99/MO"}
          </Link>
          <Link
            href="/proof-protocol"
            className="font-mono text-sm uppercase transition-colors"
            style={{
              letterSpacing: "0.2em",
              border: "1px solid #333333",
              color: "#888888",
              padding: "14px 32px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#666666"
              e.currentTarget.style.color = "#ffffff"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#333333"
              e.currentTarget.style.color = "#888888"
            }}
          >
            {"VIEW PROOF \u2192"}
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono uppercase"
        style={{
          fontSize: 10,
          letterSpacing: "0.15em",
          color: "#52525b",
          animation: "scrollDown 2s ease infinite",
        }}
      >
        {"▼ SCROLL"}
      </div>
    </section>
  )
}

/* ── SECTION 2: SYSTEM STATUS BAR ────────────────────────────────────── */

function SystemStatusBar({ signalsToday }: { signalsToday: number }) {
  const items = [
    "PROOF SYSTEM: ACTIVE",
    "CHAIN: SOLANA MAINNET",
    `SIGNALS TODAY: ${signalsToday}`,
    "LAST PROOF: MAR 01 2026",
    "TRACKING: LIVE",
  ]

  return (
    <section
      className="w-full overflow-hidden py-3"
      style={{
        borderTop: "1px solid #1a1a1a",
        borderBottom: "1px solid #1a1a1a",
      }}
    >
      {/* Desktop: static row */}
      <div className="hidden items-center justify-center gap-0 font-mono text-xs uppercase tracking-widest md:flex" style={{ color: "#52525b" }}>
        {items.map((item, i) => (
          <span key={i} className="flex items-center">
            {i > 0 && (
              <span className="mx-4" style={{ color: "#3f3f46" }}>
                {"·"}
              </span>
            )}
            <span>
              {item.split(":").map((part, pi) =>
                pi === 0 ? (
                  <span key={pi}>{part}:</span>
                ) : (
                  <span key={pi} style={{ color: "#a1a1aa" }}>
                    {part}
                  </span>
                )
              )}
            </span>
          </span>
        ))}
      </div>
      {/* Mobile: scrolling ticker */}
      <div className="flex animate-marquee whitespace-nowrap font-mono text-xs uppercase tracking-widest md:hidden" style={{ color: "#52525b" }}>
        <div className="flex shrink-0 items-center">
          {[...items, ...items].map((item, i) => (
            <span key={i} className="flex items-center">
              <span className="mx-4" style={{ color: "#3f3f46" }}>
                {"·"}
              </span>
              <span>{item}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── SECTION 3: HOW IT WORKS ─────────────────────────────────────────── */

function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      title: "DETECT",
      desc: "Every active Solana token scored 0\u2013100 using on-chain data. Volume, liquidity, holder distribution, age, price velocity.",
      accent: "#00FF88",
    },
    {
      num: "02",
      title: "PROVE",
      desc: "Each detection SHA256-hashed at exact timestamp. Daily Merkle tree built and root published to Solana mainnet as a memo transaction.",
      accent: "#FFAA00",
    },
    {
      num: "03",
      title: "ALERT",
      desc: "High-score tokens pushed to Telegram in real time. Price, score, and a Solscan link to the on-chain proof.",
      accent: "#4488FF",
    },
  ]

  return (
    <section className="mx-auto max-w-5xl px-6 py-24">
      {/* Heading row */}
      <div className="mb-16 flex items-center gap-6">
        <span
          className="shrink-0 font-mono text-sm uppercase text-white"
          style={{ letterSpacing: "0.3em" }}
        >
          HOW IT WORKS
        </span>
        <div className="h-px flex-1" style={{ backgroundColor: "#1a1a1a" }} />
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 gap-0 md:grid-cols-3">
        {steps.map((s, i) => (
          <div
            key={s.num}
            className="relative px-8 py-10 md:px-12"
            style={{
              borderRight:
                i < steps.length - 1 ? "1px solid #1a1a1a" : "none",
            }}
          >
            {/* Ghost outline number */}
            <span
              className="block font-mono text-[80px] font-bold leading-none"
              style={{
                color: "transparent",
                WebkitTextStroke: "1px #1a1a1a",
              }}
            >
              {s.num}
            </span>
            <h3
              className="mt-4 font-mono text-sm uppercase text-white"
              style={{ letterSpacing: "0.3em" }}
            >
              {s.title}
            </h3>
            <p
              className="mt-3 font-mono text-sm leading-relaxed"
              style={{ color: "#71717a" }}
            >
              {s.desc}
            </p>
            {/* Accent bar */}
            <div
              className="absolute bottom-0 left-8 md:left-12"
              style={{
                width: 4,
                height: 40,
                backgroundColor: s.accent,
              }}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

/* ── SECTION 4: LIVE SIGNAL PREVIEW ──────────────────────────────────── */

function SignalPreviewSection({
  signals,
  total,
  loading,
}: {
  signals: Signal[]
  total: number
  loading: boolean
}) {
  return (
    <section className="mx-auto max-w-5xl px-6 py-24">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="font-mono text-sm uppercase text-white"
            style={{ letterSpacing: "0.3em" }}
          >
            RECENT SIGNALS
          </span>
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{
              backgroundColor: "#00FF88",
              animation: "pulse-glow 2s ease-in-out infinite",
            }}
          />
        </div>
        <Link
          href="/pro"
          className="font-mono text-xs uppercase transition-colors"
          style={{ color: "#52525b", letterSpacing: "0.1em" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#a1a1aa")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#52525b")}
        >
          {"SUBSCRIBE TO UNLOCK ALL \u2192"}
        </Link>
      </div>

      {/* Table */}
      <div className="relative">
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
              {["TOKEN", "SCORE", "CALLED", "CHANGE", "PROOF"].map((col) => (
                <th
                  key={col}
                  className="pb-3 pr-6 text-left font-mono uppercase last:pr-0"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.3em",
                    color: "#52525b",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #0a0a0a" }}>
                    <td className="py-4 pr-6 font-mono text-sm text-white">
                      ---
                    </td>
                    <td className="py-4 pr-6">---</td>
                    <td className="py-4 pr-6">---</td>
                    <td className="py-4 pr-6">---</td>
                    <td className="py-4">---</td>
                  </tr>
                ))
              : signals.map((sig, i) => {
                  let rowStyle: React.CSSProperties = {
                    borderBottom: "1px solid #0a0a0a",
                  }
                  if (i === 2) {
                    rowStyle = {
                      ...rowStyle,
                      opacity: 0.3,
                      filter: "blur(2px)",
                      pointerEvents: "none",
                    }
                  } else if (i >= 3) {
                    rowStyle = {
                      ...rowStyle,
                      opacity: 0,
                      filter: "blur(4px)",
                      pointerEvents: "none",
                    }
                  }
                  const scoreColor = getScoreColor(sig.score)
                  return (
                    <tr key={sig.id} style={rowStyle}>
                      <td className="py-4 pr-6">
                        <span className="font-mono text-sm text-white">
                          {sig.symbol}
                        </span>
                        <span
                          className="ml-2 font-mono text-xs"
                          style={{ color: "#52525b" }}
                        >
                          {sig.name && sig.name.length > 12
                            ? sig.name.slice(0, 12) + "..."
                            : sig.name}
                        </span>
                      </td>
                      <td className="py-4 pr-6">
                        <span
                          className="inline-block rounded-none px-2 py-0.5 font-mono text-xs"
                          style={{
                            border: `1px solid ${scoreColor}`,
                            color: scoreColor,
                          }}
                        >
                          {sig.score}
                        </span>
                      </td>
                      <td
                        className="py-4 pr-6 font-mono text-xs"
                        style={{ color: "#71717a" }}
                      >
                        {relativeTime(sig.calledAt)}
                      </td>
                      <td className="py-4 pr-6 font-mono text-sm">
                        <span
                          style={{
                            color: sig.pct24h >= 0 ? "#00FF88" : "#FF4444",
                          }}
                        >
                          {sig.pct24h >= 0 ? "+" : ""}
                          {sig.pct24h}%
                        </span>
                      </td>
                      <td className="py-4">
                        {sig.entryHash ? (
                          <span
                            className="font-mono text-xs"
                            style={{ color: "#00FF88" }}
                          >
                            {"✓ VERIFIED"}
                          </span>
                        ) : (
                          <span
                            className="font-mono text-xs"
                            style={{ color: "#333333" }}
                          >
                            PENDING
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
          </tbody>
        </table>

        {/* Paywall gradient overlay */}
        <div
          className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-center"
          style={{
            height: 200,
            background:
              "linear-gradient(to top, #000000 40%, transparent)",
          }}
        >
          <p
            className="font-mono text-xs uppercase"
            style={{ letterSpacing: "0.25em", color: "#a1a1aa" }}
          >
            SUBSCRIBE TO SEE ALL LIVE SIGNALS
          </p>
          <Link
            href="/pro"
            className="mt-4 font-mono text-sm uppercase transition-colors"
            style={{
              letterSpacing: "0.2em",
              border: "1px solid #00FF88",
              color: "#00FF88",
              padding: "14px 32px",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "rgba(0,255,136,0.08)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            {"JOIN $9.99/MO"}
          </Link>
          <p
            className="mt-3 font-mono"
            style={{ fontSize: 10, color: "#52525b" }}
          >
            {loading
              ? "---"
              : `${(total ?? 0).toLocaleString()}+ signals recorded · 3 publications on Solana`}
          </p>
        </div>
      </div>
    </section>
  )
}

/* ── SECTION 5: PROOF PUBLICATIONS ───────────────────────────────────── */

function ProofPublicationsSection() {
  const publications = [
    {
      date: "FEB 26 2026",
      signals: 34,
      txHash: "rWLy44b...xxijxg",
      txUrl:
        "https://solscan.io/tx/rWLy44btd9JQfWPDjZoMvjsGLZGYoKAnrUkAcxxijxg",
    },
    {
      date: "FEB 27 2026",
      signals: 33,
      txHash: null,
      txUrl: null,
    },
    {
      date: "MAR 01 2026",
      signals: 34,
      txHash: null,
      txUrl: null,
    },
  ]

  return (
    <section
      className="mx-auto max-w-5xl px-6 py-24"
      style={{ borderTop: "1px solid #1a1a1a" }}
    >
      <h2
        className="font-mono text-sm uppercase text-white"
        style={{ letterSpacing: "0.3em" }}
      >
        ON-CHAIN PROOF
      </h2>
      <p className="mt-2 font-mono text-sm" style={{ color: "#52525b" }}>
        Every detection timestamped and published to Solana mainnet. Immutable.
        Verifiable by anyone.
      </p>

      <div
        className="mt-10 flex flex-col"
        style={{ border: "1px solid #1a1a1a" }}
      >
        {publications.map((p, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
            style={{
              borderBottom:
                i < publications.length - 1 ? "1px solid #1a1a1a" : "none",
            }}
          >
            {/* Left cluster */}
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="font-mono uppercase"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.15em",
                  color: "#00FF88",
                }}
              >
                {"◉ VERIFIED"}
              </span>
              <span className="font-mono text-sm text-white">{p.date}</span>
              <span className="font-mono text-xs" style={{ color: "#71717a" }}>
                {p.signals} SIGNALS
              </span>
            </div>
            {/* Right cluster */}
            <div className="flex items-center gap-4">
              {p.txHash && (
                <span className="font-mono text-xs" style={{ color: "#52525b" }}>
                  {p.txHash}
                </span>
              )}
              {p.txUrl ? (
                <a
                  href={p.txUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs transition-colors"
                  style={{ color: "#52525b" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#00FF88")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#52525b")
                  }
                >
                  {"SOLSCAN \u2192"}
                </a>
              ) : (
                <span className="font-mono text-xs" style={{ color: "#00FF88" }}>
                  VERIFIED
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <p
        className="mt-4 font-mono text-xs"
        style={{ letterSpacing: "0.08em", color: "#52525b" }}
      >
        Growing by 1 publication every midnight UTC. The proof chain compounds
        daily.
      </p>
    </section>
  )
}

/* ── SECTION 6: FINAL CTA ────────────────────────────────────────────── */

function FinalCTASection() {
  return (
    <section
      className="relative overflow-hidden py-32 text-center"
      style={{ borderTop: "1px solid #1a1a1a" }}
    >
      <RadarSVG size={1200} opacity={0.04} />

      <div className="relative z-10 px-6">
        <h2
          className="font-mono text-4xl font-bold text-white md:text-6xl"
          style={{ letterSpacing: "0.1em" }}
        >
          GET SIGNALS BEFORE
        </h2>
        <h2
          className="mt-2 font-mono text-4xl font-bold md:text-6xl"
          style={{ letterSpacing: "0.1em", color: "#00FF88" }}
        >
          THE MARKET DOES.
        </h2>
        <p
          className="mt-6 font-mono text-sm uppercase"
          style={{ letterSpacing: "0.15em", color: "#71717a" }}
        >
          {"Real-time Telegram alerts · On-chain proof · $9.99/month"}
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="https://t.me/solrad_alerts"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sm uppercase transition-colors"
            style={{
              letterSpacing: "0.2em",
              border: "1px solid #333333",
              color: "#888888",
              padding: "14px 32px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#666666"
              e.currentTarget.style.color = "#ffffff"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#333333"
              e.currentTarget.style.color = "#888888"
            }}
          >
            {"JOIN @SOLRAD_ALERTS"}
          </a>
          <Link
            href="/pro"
            className="font-mono text-sm uppercase transition-colors"
            style={{
              letterSpacing: "0.2em",
              border: "1px solid #00FF88",
              color: "#00FF88",
              padding: "14px 32px",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "rgba(0,255,136,0.08)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            {"SUBSCRIBE $9.99/MO"}
          </Link>
        </div>
      </div>
    </section>
  )
}



/* ── MAIN ─────────────────────────────────────────────────────────────── */

export default function LandingClient() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [totalSignals, setTotalSignals] = useState(0)
  const [firstSeenToday, setFirstSeenToday] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/alpha-ledger?limit=5")
        if (!res.ok) return
        const data: LedgerResponse = await res.json()
        setSignals(data.entries)
        setTotalSignals(data.totalFiltered)
        // Count first-seen-today from returned signals
        const todayCount = data.entries.filter((s) => isToday(s.calledAt)).length
        setFirstSeenToday(todayCount)
      } catch {
        // fail silently
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <main className="min-h-screen">
      <HeroSection
        totalSignals={totalSignals}
        firstSeenToday={firstSeenToday}
        loading={loading}
      />
      <SystemStatusBar signalsToday={firstSeenToday} />
      <HowItWorksSection />
      <SignalPreviewSection signals={signals} total={totalSignals} loading={loading} />
      <ProofPublicationsSection />
      <FinalCTASection />
    </main>
  )
}
