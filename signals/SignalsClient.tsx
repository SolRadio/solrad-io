"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { useUser } from "@clerk/nextjs"

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Signal {
  id: string
  symbol: string
  name: string
  score: number
  type: "FIRST_SEEN" | "SCORE_UPDATE"
  calledAt: string
  priceAtCall: number
  currentPrice: number
  pct24h: number
  change: number
  entryHash: string | null
  solanaTxSignature: string | null
  imageUrl: string
}

interface LedgerResponse {
  signals: Signal[]
  total: number
  published: number
}

type FilterType = "ALL" | "FIRST_SEEN" | "SCORE_UPDATE"

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function getScoreColor(score: number): string {
  if (score >= 85) return "#00FF88"
  if (score >= 70) return "#00CC66"
  if (score >= 55) return "#FFAA00"
  return "#4488FF"
}

function getScoreBg(score: number): string {
  if (score >= 85) return "rgba(0,255,136,0.15)"
  if (score >= 70) return "rgba(0,204,102,0.12)"
  if (score >= 55) return "rgba(255,170,0,0.12)"
  return "rgba(68,136,255,0.12)"
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str
  return str.slice(0, len) + "..."
}

/* ─── Auth Gate ──────────────────────────────────────────────────────────── */
function AuthGate() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="flex max-w-md flex-col items-center gap-8 text-center">
        {/* Lock icon */}
        <div
          className="flex h-16 w-16 items-center justify-center border"
          style={{ borderColor: "#262626" }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#737373"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h1 className="text-lg font-bold tracking-[0.25em] uppercase text-foreground sm:text-xl">
          Signals Require a Subscription
        </h1>

        <p className="text-sm leading-relaxed text-muted-foreground">
          Access live SOLRAD signals and on-chain verified token calls for
          $9.99/month
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/pro"
            className="flex items-center justify-center px-8 py-3 text-xs font-bold tracking-widest uppercase transition-colors"
            style={{
              border: "1px solid #00FF88",
              color: "#00FF88",
            }}
          >
            Subscribe Now
          </Link>
          <Link
            href="/sign-in"
            className="flex items-center justify-center px-8 py-3 text-xs font-bold tracking-widest uppercase border border-border text-muted-foreground transition-colors hover:text-foreground hover:border-muted-foreground"
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  )
}

/* ─── Telegram Banner ────────────────────────────────────────────────────── */
function TelegramBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      className="flex items-center justify-between gap-4 border-b px-4 py-2.5"
      style={{
        borderColor: "#1a1a1a",
        backgroundColor: "rgba(0,255,136,0.04)",
      }}
    >
      <p className="flex-1 text-xs tracking-widest uppercase text-muted-foreground">
        Get these as real-time alerts{" "}
        <span style={{ color: "#00FF88" }}>{"→"}</span>{" "}
        <a
          href="https://t.me/solrad_alerts"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 transition-colors"
          style={{ color: "#00FF88" }}
        >
          Join @solrad_alerts
        </a>
      </p>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 text-xs text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
        aria-label="Dismiss banner"
      >
        {"✕"}
      </button>
    </div>
  )
}

/* ─── Filter Tabs ────────────────────────────────────────────────────────── */
function FilterTabs({
  active,
  onChange,
}: {
  active: FilterType
  onChange: (f: FilterType) => void
}) {
  const tabs: { label: string; value: FilterType }[] = [
    { label: "ALL", value: "ALL" },
    { label: "FIRST SEEN", value: "FIRST_SEEN" },
    { label: "SCORE UPDATE", value: "SCORE_UPDATE" },
  ]

  return (
    <div className="flex gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className="px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase transition-colors cursor-pointer"
          style={{
            color: active === tab.value ? "#00FF88" : "#737373",
            backgroundColor:
              active === tab.value ? "rgba(0,255,136,0.08)" : "transparent",
            border:
              active === tab.value
                ? "1px solid rgba(0,255,136,0.2)"
                : "1px solid #262626",
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

/* ─── Desktop Table ──────────────────────────────────────────────────────── */
function SignalsTable({ signals }: { signals: Signal[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b" style={{ borderColor: "#1a1a1a" }}>
            {["TOKEN", "SCORE", "TYPE", "DETECTED", "PRICE CHANGE", "PROOF"].map(
              (col) => (
                <th
                  key={col}
                  className="pb-3 pr-4 text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground"
                >
                  {col}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {signals.map((sig) => (
            <tr
              key={sig.id}
              className="border-b transition-colors hover:bg-[#0a0a0a]"
              style={{ borderColor: "#1a1a1a" }}
            >
              {/* TOKEN */}
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2.5">
                  <Image
                    src={sig.imageUrl}
                    alt={sig.symbol}
                    width={24}
                    height={24}
                    className="flex-shrink-0 rounded-full"
                    style={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #262626",
                    }}
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold tracking-widest text-foreground">
                      {sig.symbol}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {truncate(sig.name, 16)}
                    </span>
                  </div>
                </div>
              </td>

              {/* SCORE */}
              <td className="py-3 pr-4">
                <span
                  className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold"
                  style={{
                    color: getScoreColor(sig.score),
                    backgroundColor: getScoreBg(sig.score),
                  }}
                >
                  {sig.score}
                </span>
              </td>

              {/* TYPE */}
              <td className="py-3 pr-4">
                <span
                  className="inline-flex px-2 py-0.5 text-[10px] font-bold tracking-wider"
                  style={{
                    color:
                      sig.type === "FIRST_SEEN" ? "#00FF88" : "#FFAA00",
                    backgroundColor:
                      sig.type === "FIRST_SEEN"
                        ? "rgba(0,255,136,0.1)"
                        : "rgba(255,170,0,0.1)",
                  }}
                >
                  {sig.type === "FIRST_SEEN" ? "FIRST SEEN" : "SCORE UPDATE"}
                </span>
              </td>

              {/* DETECTED */}
              <td className="py-3 pr-4 text-xs text-muted-foreground">
                {relativeTime(sig.calledAt)}
              </td>

              {/* PRICE CHANGE */}
              <td className="py-3 pr-4">
                <span
                  className="text-xs font-bold"
                  style={{
                    color: sig.pct24h >= 0 ? "#00FF88" : "#ff4444",
                  }}
                >
                  {sig.pct24h >= 0 ? "+" : ""}
                  {sig.pct24h.toFixed(1)}%
                </span>
              </td>

              {/* PROOF */}
              <td className="py-3">
                {sig.entryHash ? (
                  sig.solanaTxSignature ? (
                    <a
                      href={`https://solscan.io/tx/${sig.solanaTxSignature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold transition-opacity hover:opacity-80"
                      style={{ color: "#00FF88" }}
                    >
                      <span>{"✓"}</span>
                      VERIFIED
                    </a>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-bold"
                      style={{ color: "#00FF88" }}
                    >
                      <span>{"✓"}</span>
                      VERIFIED
                    </span>
                  )
                ) : (
                  <span className="text-xs text-muted-foreground">
                    PENDING
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ─── Mobile Card ────────────────────────────────────────────────────────── */
function MobileSignalCard({ signal: sig }: { signal: Signal }) {
  return (
    <div
      className="flex flex-col gap-3 border-b px-4 py-4"
      style={{ borderColor: "#1a1a1a" }}
    >
      {/* Top row: token + score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Image
            src={sig.imageUrl}
            alt={sig.symbol}
            width={28}
            height={28}
            className="flex-shrink-0 rounded-full"
            style={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #262626",
            }}
          />
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-widest text-foreground">
              {sig.symbol}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {truncate(sig.name, 20)}
            </span>
          </div>
        </div>
        <span
          className="inline-flex items-center justify-center px-2.5 py-1 text-sm font-bold"
          style={{
            color: getScoreColor(sig.score),
            backgroundColor: getScoreBg(sig.score),
          }}
        >
          {sig.score}
        </span>
      </div>

      {/* Detail row */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="inline-flex px-2 py-0.5 text-[10px] font-bold tracking-wider"
          style={{
            color: sig.type === "FIRST_SEEN" ? "#00FF88" : "#FFAA00",
            backgroundColor:
              sig.type === "FIRST_SEEN"
                ? "rgba(0,255,136,0.1)"
                : "rgba(255,170,0,0.1)",
          }}
        >
          {sig.type === "FIRST_SEEN" ? "FIRST SEEN" : "SCORE UPDATE"}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {relativeTime(sig.calledAt)}
        </span>
        <span
          className="ml-auto text-xs font-bold"
          style={{
            color: sig.pct24h >= 0 ? "#00FF88" : "#ff4444",
          }}
        >
          {sig.pct24h >= 0 ? "+" : ""}
          {sig.pct24h.toFixed(1)}%
        </span>
      </div>

      {/* Proof row */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] tracking-widest uppercase text-muted-foreground">
          PROOF
        </span>
        {sig.entryHash ? (
          sig.solanaTxSignature ? (
            <a
              href={`https://solscan.io/tx/${sig.solanaTxSignature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold transition-opacity hover:opacity-80"
              style={{ color: "#00FF88" }}
            >
              <span>{"✓"}</span>
              VERIFIED
            </a>
          ) : (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-bold"
              style={{ color: "#00FF88" }}
            >
              <span>{"✓"}</span>
              VERIFIED
            </span>
          )
        ) : (
          <span className="text-[11px] text-muted-foreground">PENDING</span>
        )}
      </div>
    </div>
  )
}

/* ─── Main Client ────────────────────────────────────────────────────────── */
export default function SignalsClient() {
  const { isSignedIn, isLoaded } = useUser()
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>("ALL")
  const [bannerDismissed, setBannerDismissed] = useState(false)

  // Check sessionStorage for banner dismissal
  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = sessionStorage.getItem("solrad-tg-banner-dismissed")
      if (dismissed === "true") setBannerDismissed(true)
    }
  }, [])

  // Fetch signals
  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      setLoading(false)
      return
    }

    async function fetchSignals() {
      try {
        const res = await fetch("/api/alpha-ledger?limit=100")
        if (!res.ok) return
        const data: LedgerResponse = await res.json()
        setSignals(data.signals)
      } catch {
        // fail silently
      } finally {
        setLoading(false)
      }
    }
    fetchSignals()
  }, [isLoaded, isSignedIn])

  const handleDismissBanner = () => {
    setBannerDismissed(true)
    sessionStorage.setItem("solrad-tg-banner-dismissed", "true")
  }

  const filtered = useMemo(() => {
    if (filter === "ALL") return signals
    return signals.filter((s) => s.type === filter)
  }, [signals, filter])

  // Wait for Clerk to load
  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-10 w-10 rounded-full border-2 border-transparent"
            style={{
              borderTopColor: "#00FF88",
              animation: "radar-sweep 1s linear infinite",
            }}
          />
          <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
            Loading...
          </p>
        </div>
      </main>
    )
  }

  // Auth gate
  if (!isSignedIn) return <AuthGate />

  // Loading state
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-10 w-10 rounded-full border-2 border-transparent"
            style={{
              borderTopColor: "#00FF88",
              animation: "radar-sweep 1s linear infinite",
            }}
          />
          <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
            Loading signals...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col">
      {/* Telegram banner */}
      {!bannerDismissed && <TelegramBanner onDismiss={handleDismissBanner} />}

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {/* Page heading */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor: "#00FF88",
                animation: "pulse-glow 2s ease-in-out infinite",
              }}
            />
            <h1 className="text-lg font-bold tracking-[0.25em] uppercase text-foreground">
              Signal Feed
            </h1>
            <span
              className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold tracking-[0.15em] uppercase"
              style={{
                color: "#00FF88",
                backgroundColor: "rgba(0,255,136,0.1)",
                border: "1px solid rgba(0,255,136,0.2)",
              }}
            >
              LIVE
            </span>
          </div>

          <FilterTabs active={filter} onChange={setFilter} />
        </div>

        {/* Signal count */}
        <p className="mb-4 text-[10px] tracking-widest uppercase text-muted-foreground">
          {filtered.length} signal{filtered.length !== 1 ? "s" : ""}
          {filter !== "ALL" && ` (${filter.replace("_", " ")})`}
        </p>

        {/* Desktop table */}
        <div className="hidden sm:block">
          <SignalsTable signals={filtered} />
        </div>

        {/* Mobile cards */}
        <div className="block sm:hidden">
          {filtered.map((sig) => (
            <MobileSignalCard key={sig.id} signal={sig} />
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <p className="text-xs tracking-widest uppercase text-muted-foreground">
              No signals match this filter
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
