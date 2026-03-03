"use client"

import { useState, useEffect, useRef } from "react"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import {
  FlaskConical, Activity, FileText, Trophy, Eye, Bell,
  ArrowRight, CreditCard, Wallet, BellRing, BarChart3, Mail,
  ChevronLeft, ChevronRight, Zap, ExternalLink, Copy, Check,
} from "lucide-react"

/* ---- Types ---- */
interface PulseData {
  signalsToday: number
  hitRate7d: number
  bestToday: number
  engineActive: boolean
}

interface Mover {
  symbol: string
  change: number
  hoursAgo: number
}

interface ScoreSurge {
  mint: string
  symbol: string
  scoreDelta: number
  currentScore: number
  pairAgeDays: number
  detectedAt: number
}

interface CardStats {
  scoreLab: string
  alphaLedger: string
  signalOutcomes: string
}

/* ---- Quick Access items ---- */
const QUICK_ACCESS = [
  { title: "Score Lab", href: "/score-lab", icon: FlaskConical, statKey: "scoreLab" as const },
  { title: "Signal Outcomes", href: "/signals", icon: Activity, statKey: "signalOutcomes" as const },
  { title: "Alpha Ledger", href: "/research", icon: FileText, statKey: "alphaLedger" as const },
  { title: "Top Performers", href: "/top-performers", icon: Trophy, statKey: null },
  { title: "Saw It First", href: "/saw-it-first", icon: Eye, statKey: null },
  { title: "Alerts", href: "/alerts", icon: Bell, statKey: null },
]

/* ---- Roadmap ---- */
const ROADMAP = [
  { title: "Wallet Intelligence", icon: Wallet },
  { title: "Custom Score Alerts", icon: BellRing },
  { title: "Portfolio Tracker", icon: BarChart3 },
  { title: "Weekly Pro Report", icon: Mail },
]

export function ProHubClient() {
  const { user } = useUser()
  const [pulse, setPulse] = useState<PulseData | null>(null)
  const [movers, setMovers] = useState<Mover[]>([])
  const [surges, setSurges] = useState<ScoreSurge[]>([])
  const [cardStats, setCardStats] = useState<CardStats | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const surgeScrollRef = useRef<HTMLDivElement>(null)
  const [copiedMint, setCopiedMint] = useState<string | null>(null)
  const [clock, setClock] = useState("")
  const [lastSnapshotAgo, setLastSnapshotAgo] = useState("--:--")

  /* -- Live clock -- */
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setClock(now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  /* -- Data fetching (unchanged) -- */
  useEffect(() => {
    fetch("/api/score-lab")
      .then((r) => r.json())
      .then((d) => {
        if (!d) return
        const overallWins = (d.winRates?.high?.wins ?? 0) + (d.winRates?.medium?.wins ?? 0) + (d.winRates?.low?.wins ?? 0)
        const overallTotal = (d.winRates?.high?.total ?? 0) + (d.winRates?.medium?.total ?? 0) + (d.winRates?.low?.total ?? 0)
        const winRate = overallTotal > 0 ? (overallWins / overallTotal) * 100 : 0
        const bestGain = d.topWinners?.[0]?.return24h ?? 0
        setPulse({ signalsToday: d.totalSnapshots ?? 0, hitRate7d: winRate, bestToday: bestGain, engineActive: true })
        setCardStats({ scoreLab: `${d.totalSnapshots ?? 0} snapshots`, alphaLedger: "---", signalOutcomes: `${winRate.toFixed(0)}% win rate` })

        // Estimate last snapshot time
        if (d.latestTimestamp) {
          const mins = Math.round((Date.now() - d.latestTimestamp) / 60000)
          setLastSnapshotAgo(mins <= 0 ? "just now" : `${mins}m ago`)
        }
      })
      .catch(() => {})

    fetch("/api/score-velocity")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setSurges(d.slice(0, 20)) })
      .catch(() => {})

    fetch("/api/alpha-ledger?range=24h&limit=100")
      .then((r) => r.json())
      .then((d) => {
        const entries = d?.entries ?? []
        setCardStats((prev) => prev ? { ...prev, alphaLedger: `${entries.length} signals` } : prev)
        const now = Date.now()
        const m: Mover[] = entries
          .filter((e: { change24h?: number; result?: string }) => (e.change24h && e.change24h > 5) || e.result === "WIN")
          .map((e: { symbol?: string; change24h?: number; ts?: number }) => ({
            symbol: e.symbol ?? "???",
            change: e.change24h ?? 0,
            hoursAgo: e.ts ? Math.max(1, Math.round((now - e.ts) / 3600000)) : 0,
          }))
          .sort((a: Mover, b: Mover) => b.change - a.change)
          .slice(0, 20)
        setMovers(m)
      })
      .catch(() => {})
  }, [])

  const scrollSurge = (dir: "left" | "right") => {
    surgeScrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" })
  }
  const scrollMovers = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" })
  }

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "---"

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] font-mono">
      {/* Scanline overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)",
        }}
      />

      <div className="relative z-10 max-w-[900px] mx-auto px-4 py-8 space-y-8">

        {/* ================================================================
            SECTION 1 -- COMMAND HEADER
            ================================================================ */}
        <header
          className="opacity-0 animate-[fadeSlideIn_0.4s_ease_forwards]"
          style={{ animationDelay: "0s" }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] tracking-[0.4em] text-zinc-600 uppercase">SOLRAD</p>
              <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">
                PRO COMMAND CENTER
              </h1>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-300">{user?.fullName ?? "Operator"}</span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-amber-400 text-zinc-950">
                  PRO
                </span>
              </div>
              <span className="text-xs text-zinc-500 tabular-nums">{clock}</span>
            </div>
          </div>
          <div className="h-px bg-zinc-800 mt-4" />
        </header>

        {/* ================================================================
            SECTION 2 -- SIGNAL PULSE BAR
            ================================================================ */}
        <div
          className="opacity-0 animate-[fadeSlideIn_0.4s_ease_forwards] bg-zinc-900/40 border border-zinc-800"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="flex items-stretch divide-x divide-zinc-800">
            {/* Signals Today */}
            <PulseCell
              label="SIGNALS TODAY"
              value={pulse ? String(pulse.signalsToday) : "---"}
              valueClass="text-green-400"
            />

            {/* Hit Rate */}
            <div className="flex-1 px-4 py-3">
              <p className="text-[9px] tracking-[0.25em] text-zinc-600 uppercase mb-1">HIT RATE</p>
              <p className={`text-lg font-bold tabular-nums ${
                pulse
                  ? pulse.hitRate7d >= 40 ? "text-green-400" : pulse.hitRate7d >= 20 ? "text-amber-400" : "text-red-400"
                  : "text-zinc-400"
              }`}>
                {pulse ? `${pulse.hitRate7d.toFixed(0)}%` : "---"}
              </p>
              {pulse && (
                <div className="mt-1.5 h-1 w-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      pulse.hitRate7d >= 40 ? "bg-green-500" : pulse.hitRate7d >= 20 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(100, pulse.hitRate7d)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Best Today */}
            <PulseCell
              label="BEST TODAY"
              value={pulse ? `+${pulse.bestToday.toFixed(0)}%` : "---"}
              valueClass="text-green-400"
            />

            {/* Surges Detected */}
            <PulseCell
              label="SURGES DETECTED"
              value={surges.length > 0 ? String(surges.length) : "0"}
              valueClass={surges.length > 0 ? "text-amber-400" : "text-zinc-400"}
            />

            {/* Early Detect indicator */}
            <div className="flex-1 flex items-center justify-center gap-2 px-4 py-3">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-green-400 whitespace-nowrap">
                EARLY DETECT: ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* ================================================================
            SECTION 3 -- SCORE SURGE
            ================================================================ */}
        <section
          className="opacity-0 animate-[fadeSlideIn_0.4s_ease_forwards]"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-zinc-600">&#x25C8;</span>
              <h2 className="text-[10px] tracking-[0.3em] text-zinc-500 uppercase">
                SCORE SURGE
              </h2>
            </div>
            {surges.length > 3 && (
              <div className="flex gap-1">
                <button onClick={() => scrollSurge("left")} className="p-1 bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"><ChevronLeft className="h-3.5 w-3.5" /></button>
                <button onClick={() => scrollSurge("right")} className="p-1 bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"><ChevronRight className="h-3.5 w-3.5" /></button>
              </div>
            )}
          </div>
          <p className="text-[10px] text-zinc-600 mb-3">
            {"Score jumped rapidly \u00b7 green = strongest surges \u00b7 Detected before price moves"}
          </p>

          <div
            ref={surgeScrollRef}
            className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide"
          >
            {pulse === null ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={`surge-skel-${i}`} className="min-w-[160px] shrink-0 border border-zinc-800 bg-zinc-900 p-3 space-y-2.5 animate-pulse">
                  <div className="h-4 w-12 bg-zinc-800" />
                  <div className="h-7 w-16 bg-zinc-800" />
                  <div className="h-3 w-20 bg-zinc-800" />
                  <div className="h-3 w-full bg-zinc-800" />
                </div>
              ))
            ) : surges.length === 0 ? (
              <div className="min-w-[160px] shrink-0 border border-zinc-800/40 bg-zinc-900/20 p-4 flex items-center justify-center">
                <span className="text-xs text-zinc-600">No score surges detected recently</span>
              </div>
            ) : (
              surges.map((s, i) => {
                const hoursAgo = Math.max(1, Math.round((Date.now() - s.detectedAt) / 3600000))
                const delta = Number(s.scoreDelta.toFixed(1))
                const deltaColor = delta >= 25 ? "text-green-400" : delta >= 15 ? "text-amber-400" : "text-zinc-300"
                const isCopied = copiedMint === s.mint
                return (
                  <div
                    key={`${s.mint}-${i}`}
                    className="min-w-[160px] shrink-0 border border-zinc-800 bg-zinc-900 p-3 hover:border-zinc-600 hover:bg-zinc-800/80 transition-all duration-150 cursor-pointer relative"
                    title={`Score jumped +${delta} pts. Current: ${s.currentScore}/100. Age: ${s.pairAgeDays}d.`}
                    onClick={() => window.open(`https://dexscreener.com/solana/${s.mint}`, "_blank", "noopener")}
                  >
                    {s.currentScore >= 70 && (
                      <span className="absolute top-2 right-2 h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                      </span>
                    )}
                    <p className="text-xs text-zinc-400 tracking-widest uppercase mb-1 truncate">{s.symbol}</p>
                    <p className={`text-xl font-bold tabular-nums leading-none mb-1.5 truncate ${deltaColor}`}>
                      +{delta} pts
                    </p>
                    <p className="text-[10px] text-zinc-500 mb-1 truncate">SCORE: {s.currentScore}</p>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[8px] font-bold uppercase tracking-widest bg-zinc-800 text-zinc-400 px-1.5 py-0.5 border border-zinc-700">
                        SCORE SURGE
                      </span>
                      <span className="text-[10px] text-zinc-600 truncate ml-1">
                        {s.pairAgeDays}d{" \u00b7 "}{hoursAgo}h
                      </span>
                    </div>
                    {/* Action row */}
                    <div className="flex items-center gap-1 border-t border-zinc-800/60 pt-2">
                      <button
                        title="View on DexScreener"
                        className="w-6 h-6 flex items-center justify-center bg-zinc-800 border border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 transition-colors"
                        onClick={(e) => { e.stopPropagation(); window.open(`https://dexscreener.com/solana/${s.mint}`, "_blank", "noopener") }}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </button>
                      <button
                        title="Trade on Jupiter"
                        className="w-6 h-6 flex items-center justify-center bg-zinc-800 border border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-amber-400 transition-colors"
                        onClick={(e) => { e.stopPropagation(); window.open(`https://jup.ag/?inputMint=So11111111111111111111111111111111111111112&outputMint=${s.mint}&buy=${s.mint}&sell=So11111111111111111111111111111111111111112`, "_blank", "noopener,noreferrer") }}
                      >
                        <Zap className="h-3 w-3" />
                      </button>
                      <button
                        title="Copy mint address"
                        className="w-6 h-6 flex items-center justify-center bg-zinc-800 border border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigator.clipboard.writeText(s.mint)
                          setCopiedMint(s.mint)
                          setTimeout(() => setCopiedMint((prev) => prev === s.mint ? null : prev), 2000)
                        }}
                      >
                        {isCopied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        <div className="h-px bg-zinc-800/60" />

        {/* ================================================================
            SECTION 4 -- TWO COLUMN: EARLY MOVERS + SYSTEM PULSE
            ================================================================ */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-0 animate-[fadeSlideIn_0.4s_ease_forwards]"
          style={{ animationDelay: "0.3s" }}
        >
          {/* -- EARLY MOVERS -- */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-zinc-600">&#x25C8;</span>
                <h2 className="text-[10px] tracking-[0.3em] text-zinc-500 uppercase">EARLY MOVERS</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-bold uppercase tracking-widest bg-zinc-800 text-zinc-500 px-1.5 py-0.5 border border-zinc-700">LAST 24H</span>
                {movers.length > 3 && (
                  <div className="flex gap-1">
                    <button onClick={() => scrollMovers("left")} className="p-1 bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"><ChevronLeft className="h-3 w-3" /></button>
                    <button onClick={() => scrollMovers("right")} className="p-1 bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"><ChevronRight className="h-3 w-3" /></button>
                  </div>
                )}
              </div>
            </div>
            {movers.length === 0 ? (
              <div className="border border-zinc-800 bg-zinc-900/40 p-4 space-y-1">
                <p className="text-[10px] text-zinc-500">{">"} NO MOVERS DETECTED</p>
                <p className="text-[10px] text-zinc-600">{">"} MONITORING 40 TOKENS</p>
                <p className="text-[10px] text-zinc-600">{">"} NEXT SCAN: --:--</p>
              </div>
            ) : (
              <div ref={scrollRef} className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
                {movers.map((m, i) => (
                  <div
                    key={`${m.symbol}-${i}`}
                    className="min-w-[140px] shrink-0 border border-zinc-800 bg-zinc-900/40 p-3 hover:border-zinc-600 transition-colors"
                  >
                    <p className="text-xs text-zinc-300 tracking-wider uppercase mb-0.5">{m.symbol}</p>
                    <p className="text-xl font-bold text-green-400 tabular-nums leading-none mb-2">
                      +{m.change.toFixed(0)}%
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-bold uppercase tracking-widest bg-zinc-800 text-zinc-400 px-1.5 py-0.5 border border-zinc-700">
                        EARLY DETECT
                      </span>
                      <span className="text-[10px] text-zinc-600">{m.hoursAgo}h ago</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* -- SYSTEM PULSE -- */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-zinc-600">&#x25C8;</span>
              <h2 className="text-[10px] tracking-[0.3em] text-zinc-500 uppercase">SYSTEM PULSE</h2>
            </div>
            <div className="border border-zinc-800 bg-zinc-900/40 divide-y divide-zinc-800">
              <SystemRow label="TOKENS TRACKED" value="40 / 500" progress={40 / 500 * 100} />
              <SystemRow label="SNAPSHOT FREQ" value="EVERY 5 MIN" dotColor="green" />
              <SystemRow label="SIGNAL ENGINE" value={pulse?.engineActive ? "ACTIVE" : "OFFLINE"} dotColor={pulse?.engineActive ? "green" : "amber"} pulse={pulse?.engineActive} />
              <SystemRow label="QUICKNODE RPC" value="CONNECTED" dotColor="green" />
              <SystemRow label="LAST SNAPSHOT" value={lastSnapshotAgo} />
            </div>
          </section>
        </div>

        <div className="h-px bg-zinc-800/60" />

        {/* ================================================================
            SECTION 5 -- QUICK ACCESS GRID
            ================================================================ */}
        <section
          className="opacity-0 animate-[fadeSlideIn_0.4s_ease_forwards]"
          style={{ animationDelay: "0.4s" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-zinc-600">&#x25C8;</span>
            <h2 className="text-[10px] tracking-[0.3em] text-zinc-500 uppercase">QUICK ACCESS</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {QUICK_ACCESS.map((item) => {
              const stat = item.statKey && cardStats ? cardStats[item.statKey] : null
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-600 transition-colors relative"
                >
                  <item.icon className="h-4 w-4 text-zinc-500 mb-2" />
                  <h3 className="text-xs font-bold text-white tracking-wider uppercase mb-0.5">
                    {item.title}
                  </h3>
                  {stat && <p className="text-[10px] text-zinc-500">{stat}</p>}
                  <ArrowRight className="absolute bottom-3 right-3 h-3 w-3 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                </Link>
              )
            })}
          </div>
        </section>

        <div className="h-px bg-zinc-800/60" />

        {/* ================================================================
            SECTION 6 -- USER INTEL STRIP
            ================================================================ */}
        <div
          className="flex items-center justify-between bg-zinc-900/40 border border-zinc-800 px-4 py-3 opacity-0 animate-[fadeSlideIn_0.4s_ease_forwards]"
          style={{ animationDelay: "0.5s" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs text-zinc-300">
              {user?.firstName?.[0]?.toUpperCase() ?? "P"}
            </div>
            <div>
              <p className="text-xs text-zinc-300">{user?.fullName ?? "Pro Member"}</p>
              <p className="text-[10px] text-zinc-500">PRO MEMBER SINCE {memberSince.toUpperCase()}</p>
            </div>
          </div>
          <button
            className="bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400 px-3 py-1.5 hover:border-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5"
            onClick={async () => {
              try {
                const res = await fetch("/api/stripe/portal", { method: "POST" })
                const data = await res.json()
                if (data?.url) window.location.href = data.url
              } catch { /* */ }
            }}
          >
            <CreditCard className="h-3 w-3" />
            {"BILLING \u2192"}
          </button>
        </div>

        <div className="h-px bg-zinc-800/60" />

        {/* ================================================================
            SECTION 7 -- COMING ONLINE
            ================================================================ */}
        <section
          className="opacity-0 animate-[fadeSlideIn_0.4s_ease_forwards]"
          style={{ animationDelay: "0.6s" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-zinc-600">&#x25C8;</span>
            <h2 className="text-[10px] tracking-[0.3em] text-zinc-500 uppercase">COMING ONLINE</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ROADMAP.map((item) => (
              <div
                key={item.title}
                className="border border-zinc-800/50 bg-zinc-900/20 p-4 text-center opacity-50"
              >
                <item.icon className="h-4 w-4 text-zinc-600 mx-auto mb-2" />
                <span className="text-[11px] text-zinc-500 leading-tight block mb-2">{item.title}</span>
                <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-700 bg-zinc-800/40 px-1.5 py-0.5 border border-zinc-700/40">
                  SOON
                </span>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Global animation keyframes */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}

/* ---- Pulse Cell sub-component ---- */
function PulseCell({ label, value, valueClass = "text-zinc-100" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex-1 px-4 py-3">
      <p className="text-[9px] tracking-[0.25em] text-zinc-600 uppercase mb-1">{label}</p>
      <p className={`text-lg font-bold tabular-nums ${valueClass}`}>{value}</p>
    </div>
  )
}

/* ---- System Row sub-component ---- */
function SystemRow({
  label,
  value,
  dotColor,
  pulse: pulseDot,
  progress,
}: {
  label: string
  value: string
  dotColor?: "green" | "amber"
  pulse?: boolean
  progress?: number
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-[10px] text-zinc-500 uppercase tracking-wide">{label}</span>
      <div className="flex items-center gap-2">
        {progress !== undefined && (
          <div className="w-16 h-1 bg-zinc-800 overflow-hidden">
            <div className="h-full bg-zinc-500" style={{ width: `${progress}%` }} />
          </div>
        )}
        {dotColor && (
          <span className="relative flex h-2 w-2 shrink-0">
            {pulseDot && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor === "green" ? "bg-green-400" : "bg-amber-400"}`} />
          </span>
        )}
        <span className="text-xs text-white">{value}</span>
      </div>
    </div>
  )
}
