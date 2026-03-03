"use client"

import { useState, useCallback } from "react"

const LS_KEY = "solrad:ops_password"

function getStoredPassword(): string {
  if (typeof window === "undefined") return ""
  return localStorage.getItem(LS_KEY) || ""
}

const CRON_JOBS = [
  {
    name: "publish-proof",
    label: "PUBLISH PROOF TO SOLANA",
    description: "Hash + publish daily proof batch to Solana",
  },
  {
    name: "snapshot",
    label: "RUN SNAPSHOT",
    description: "Capture current token score snapshot",
  },
  {
    name: "ingest",
    label: "RUN INGEST",
    description: "Ingest token data with discovery",
  },
  {
    name: "cron",
    label: "RUN MAIN CRON",
    description: "Main cron loop: ingest + index update",
  },
  {
    name: "alpha-ledger",
    label: "ALPHA LEDGER",
    description: "Append current top signals to alpha ledger",
  },
  {
    name: "score-velocity",
    label: "SCORE VELOCITY",
    description: "Calculate score velocity deltas",
  },
  {
    name: "background-alerts",
    label: "BACKGROUND ALERTS",
    description: "Check and send background alerts",
  },
  {
    name: "leadtime-harvest",
    label: "LEADTIME HARVEST",
    description: "Harvest lead-time performance data",
  },
  {
    name: "daily-intel-package",
    label: "DAILY INTEL PACKAGE",
    description: "Generate daily intel summary",
  },
  {
    name: "data-audit",
    label: "RUN DATA AUDIT",
    description: "Run data audit via /api/debug/data-audit",
  },
  {
    name: "push-alerts",
    label: "PUSH ALERTS",
    description: "Send Web Push notifications for score spikes and signal upgrades",
  },
  {
    name: "backfill-proofs",
    label: "BACKFILL PROOF LOOKUPS (ONE TIME)",
    description: "Backfill reverse hash lookups for Feb 26 signals",
  },
]

interface CronResult {
  cron?: string
  status?: number
  ok?: boolean
  result?: unknown
  error?: string
}

export default function AdminTriggers() {
  const [password, setPassword] = useState(getStoredPassword)
  const [isAuthed, setIsAuthed] = useState(!!getStoredPassword())
  const [results, setResults] = useState<Record<string, CronResult>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  // Proof lookup state
  const [lookupHash, setLookupHash] = useState("")
  const [lookupResult, setLookupResult] = useState<unknown>(null)
  const [lookupLoading, setLookupLoading] = useState(false)

  // Recover null scores state
  const [recoverLoading, setRecoverLoading] = useState(false)
  const [recoverResult, setRecoverResult] = useState<unknown>(null)

  // Outcome refresh state
  const [outcomeLoading, setOutcomeLoading] = useState(false)
  const [outcomeResult, setOutcomeResult] = useState<unknown>(null)

  // Intelligence engine state
  const [intelLoading, setIntelLoading] = useState(false)
  const [intelResult, setIntelResult] = useState<unknown>(null)

  // Clear cooldowns state
  const [clearCdLoading, setClearCdLoading] = useState(false)
  const [clearCdResult, setClearCdResult] = useState<unknown>(null)

  // Telegram test state
  const [telegramLoading, setTelegramLoading] = useState(false)
  const [telegramResult, setTelegramResult] = useState<unknown>(null)

  // Twitter digest state
  const [twitterDigestLoading, setTwitterDigestLoading] = useState(false)
  const [twitterDigestResult, setTwitterDigestResult] = useState<unknown>(null)

  const handleLogin = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!password.trim()) return
      localStorage.setItem(LS_KEY, password)
      setIsAuthed(true)
    },
    [password]
  )

  const makeHeaders = useCallback((): Record<string, string> => {
    const pw = localStorage.getItem(LS_KEY)
    const h: Record<string, string> = { "Content-Type": "application/json" }
    if (pw) h["x-ops-password"] = pw
    return h
  }, [])

  const trigger = useCallback(
    async (name: string) => {
      setLoading((prev) => ({ ...prev, [name]: true }))
      setResults((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
      try {
        const res = await fetch("/api/admin/trigger-cron", {
          method: "POST",
          headers: makeHeaders(),
          body: JSON.stringify({ name }),
        })
        const data = await res.json()
        if (res.status === 401) {
          setIsAuthed(false)
          localStorage.removeItem(LS_KEY)
        }
        setResults((prev) => ({ ...prev, [name]: data }))
      } catch (err) {
        setResults((prev) => ({
          ...prev,
          [name]: { error: String(err) },
        }))
      } finally {
        setLoading((prev) => ({ ...prev, [name]: false }))
      }
    },
    [makeHeaders]
  )

  const handleLogout = useCallback(() => {
    localStorage.removeItem(LS_KEY)
    setPassword("")
    setIsAuthed(false)
    setResults({})
  }, [])

  const handleClearCooldowns = useCallback(async () => {
    setClearCdLoading(true)
    setClearCdResult(null)
    try {
      const res = await fetch("/api/admin/clear-intel-cooldowns", {
        method: "POST",
        headers: makeHeaders(),
      })
      const data = await res.json()
      if (res.status === 401) {
        setIsAuthed(false)
        localStorage.removeItem(LS_KEY)
      }
      setClearCdResult(data)
    } catch (err) {
      setClearCdResult({ error: String(err) })
    } finally {
      setClearCdLoading(false)
    }
  }, [makeHeaders])

  const handleTwitterDigest = useCallback(async () => {
    setTwitterDigestLoading(true)
    setTwitterDigestResult(null)
    try {
      const res = await fetch("/api/cron/twitter-digest", {
        headers: makeHeaders(),
      })
      const data = await res.json()
      if (res.status === 401) {
        setIsAuthed(false)
        localStorage.removeItem(LS_KEY)
      }
      setTwitterDigestResult(data)
    } catch (err) {
      setTwitterDigestResult({ error: String(err) })
    } finally {
      setTwitterDigestLoading(false)
    }
  }, [makeHeaders])

  const handleTestTelegram = useCallback(async () => {
    setTelegramLoading(true)
    setTelegramResult(null)
    try {
      const res = await fetch("/api/admin/test-telegram", {
        method: "POST",
        headers: makeHeaders(),
      })
      const data = await res.json()
      if (res.status === 401) {
        setIsAuthed(false)
        localStorage.removeItem(LS_KEY)
      }
      setTelegramResult(data)
    } catch (err) {
      setTelegramResult({ error: String(err) })
    } finally {
      setTelegramLoading(false)
    }
  }, [makeHeaders])

  const handleRunIntelligence = useCallback(async () => {
    setIntelLoading(true)
    setIntelResult(null)
    try {
      const res = await fetch("/api/cron/intelligence", {
        headers: makeHeaders(),
      })
      const data = await res.json()
      if (res.status === 401) {
        setIsAuthed(false)
        localStorage.removeItem(LS_KEY)
      }
      setIntelResult(data)
    } catch (err) {
      setIntelResult({ error: String(err) })
    } finally {
      setIntelLoading(false)
    }
  }, [makeHeaders])

  const handleOutcomeRefresh = useCallback(async () => {
    setOutcomeLoading(true)
    setOutcomeResult(null)
    try {
      const res = await fetch("/api/cron/outcome-refresh", {
        headers: makeHeaders(),
      })
      const data = await res.json()
      if (res.status === 401) {
        setIsAuthed(false)
        localStorage.removeItem(LS_KEY)
      }
      setOutcomeResult(data)
    } catch (err) {
      setOutcomeResult({ error: String(err) })
    } finally {
      setOutcomeLoading(false)
    }
  }, [makeHeaders])

  const handleRecoverNullScores = useCallback(async () => {
    setRecoverLoading(true)
    setRecoverResult(null)
    try {
      const res = await fetch("/api/admin/recover-null-scores", {
        method: "POST",
        headers: makeHeaders(),
      })
      const data = await res.json()
      if (res.status === 401) {
        setIsAuthed(false)
        localStorage.removeItem(LS_KEY)
      }
      setRecoverResult(data)
    } catch (err) {
      setRecoverResult({ error: String(err) })
    } finally {
      setRecoverLoading(false)
    }
  }, [makeHeaders])

  const handleLookup = useCallback(async () => {
    const trimmed = lookupHash.trim()
    if (!trimmed) return
    setLookupLoading(true)
    setLookupResult(null)
    try {
      const res = await fetch(
        `/api/debug/proof-lookup?hash=${encodeURIComponent(trimmed)}`,
        { headers: makeHeaders() }
      )
      setLookupResult(await res.json())
    } catch (err) {
      setLookupResult({ error: String(err) })
    } finally {
      setLookupLoading(false)
    }
  }, [lookupHash, makeHeaders])

  // Login gate
  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-[#060606] flex items-center justify-center p-6 font-mono">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm border border-zinc-800 bg-[#0a0a0a] p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 bg-amber-500" />
            <span className="text-[10px] font-bold text-zinc-400 tracking-[0.3em] uppercase">
              ADMIN AUTH
            </span>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="OPS_PASSWORD"
            className="w-full bg-[#060606] border border-zinc-800 text-zinc-300 text-xs px-3 py-2 font-mono placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600 mb-4"
          />
          <button
            type="submit"
            className="w-full bg-zinc-800 text-zinc-300 px-4 py-2 text-[10px] font-bold tracking-widest hover:bg-zinc-700 transition-colors border border-zinc-700"
          >
            AUTHENTICATE
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#060606] p-6 md:p-10 font-mono">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-amber-500" />
            <h1 className="text-sm font-bold text-zinc-300 uppercase tracking-[0.3em]">
              SOLRAD ADMIN TRIGGERS
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-[9px] text-zinc-600 tracking-widest hover:text-zinc-400 transition-colors uppercase"
          >
            LOGOUT
          </button>
        </div>

        <p className="text-[10px] text-zinc-600 tracking-widest mb-6 uppercase">
          Manually fire cron jobs. Results shown inline.
        </p>

        {/* Cron job cards */}
        <div className="flex flex-col gap-3">
          {CRON_JOBS.map(({ name, label, description }) => {
            const result = results[name]
            const isOk = result && "ok" in result && result.ok
            const isErr =
              result && ("error" in result || ("status" in result && (result.status ?? 0) >= 400))

            return (
              <div
                key={name}
                className={`border bg-[#0a0a0a] p-4 ${
                  isOk
                    ? "border-green-900/50"
                    : isErr
                      ? "border-red-900/50"
                      : "border-zinc-800"
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-zinc-200 tracking-wide">
                      {label}
                    </span>
                    <p className="text-[10px] text-zinc-600 mt-0.5">
                      {description}
                    </p>
                  </div>
                  <button
                    onClick={() => trigger(name)}
                    disabled={loading[name]}
                    className="flex-none bg-zinc-800 text-zinc-300 px-4 py-1.5 text-[10px] font-bold tracking-widest hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-zinc-700"
                  >
                    {loading[name] ? "RUNNING..." : "TRIGGER"}
                  </button>
                </div>

                {result !== undefined && (
                  <div className="mt-3">
                    {/* Status line */}
                    {result.status !== undefined && (
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[9px] font-bold tracking-widest ${
                            isOk ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {isOk ? "OK" : "FAIL"}
                        </span>
                        <span className="text-[9px] text-zinc-600 font-mono">
                          HTTP {result.status}
                        </span>
                      </div>
                    )}
                    <pre className="text-[9px] leading-relaxed text-zinc-500 bg-[#060606] border border-zinc-900 p-2 overflow-x-auto max-h-40 scrollbar-hide">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Intelligence Engine */}
        <div className="mt-6 border border-zinc-800 bg-[#0a0a0a] p-4">
          <div className="flex items-center justify-between gap-4 mb-1">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-purple-500" />
                <span className="text-xs font-bold text-zinc-200 tracking-wide">
                  RUN INTELLIGENCE
                </span>
              </div>
              <p className="text-[10px] text-zinc-600 mt-0.5">
                Scan background tokens for breakout signals. Publishes to Telegram if configured.
              </p>
            </div>
            <button
              onClick={handleRunIntelligence}
              disabled={intelLoading}
              className="flex-none bg-purple-900/30 text-purple-400 px-4 py-1.5 text-[10px] font-bold tracking-widest hover:bg-purple-900/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-purple-900/50"
            >
              {intelLoading ? "SCANNING..." : "RUN"}
            </button>
          </div>
          {intelResult !== null && (
            <pre className="mt-3 text-[9px] leading-relaxed text-zinc-500 bg-[#060606] border border-zinc-900 p-2 overflow-x-auto max-h-40 scrollbar-hide">
              {JSON.stringify(intelResult, null, 2)}
            </pre>
          )}
        </div>

        {/* Test Twitter Digest */}
        <div className="mt-6 border border-zinc-800 bg-[#0a0a0a] p-4">
          <div className="flex items-center justify-between gap-4 mb-1">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-blue-500" />
                <span className="text-xs font-bold text-zinc-200 tracking-wide">
                  TEST TWITTER DIGEST
                </span>
              </div>
              <p className="text-[10px] text-zinc-600 mt-0.5">
                Post a signal digest tweet to @solaboratoryrad (uses live breakout data)
              </p>
            </div>
            <button
              onClick={handleTwitterDigest}
              disabled={twitterDigestLoading}
              className="flex-none bg-blue-900/30 text-blue-400 px-4 py-1.5 text-[10px] font-bold tracking-widest hover:bg-blue-900/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-blue-900/50"
            >
              {twitterDigestLoading ? "POSTING..." : "POST"}
            </button>
          </div>
          {twitterDigestResult !== null && (
            <pre className="mt-3 text-[9px] leading-relaxed text-zinc-500 bg-[#060606] border border-zinc-900 p-2 overflow-x-auto max-h-40 scrollbar-hide">
              {JSON.stringify(twitterDigestResult, null, 2)}
            </pre>
          )}
        </div>

        {/* Test Telegram */}
        <div className="mt-6 border border-zinc-800 bg-[#0a0a0a] p-4">
          <div className="flex items-center justify-between gap-4 mb-1">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-500" />
                <span className="text-xs font-bold text-zinc-200 tracking-wide">
                  TEST TELEGRAM
                </span>
              </div>
              <p className="text-[10px] text-zinc-600 mt-0.5">
                Send a test message to the configured Telegram channel
              </p>
            </div>
            <button
              onClick={handleTestTelegram}
              disabled={telegramLoading}
              className="flex-none bg-green-900/30 text-green-400 px-4 py-1.5 text-[10px] font-bold tracking-widest hover:bg-green-900/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-green-900/50"
            >
              {telegramLoading ? "SENDING..." : "TEST"}
            </button>
          </div>
          {telegramResult !== null && (
            <pre className="mt-3 text-[9px] leading-relaxed text-zinc-500 bg-[#060606] border border-zinc-900 p-2 overflow-x-auto max-h-40 scrollbar-hide">
              {JSON.stringify(telegramResult, null, 2)}
            </pre>
          )}
        </div>

        {/* Outcome Refresh */}
        <div className="mt-6 border border-zinc-800 bg-[#0a0a0a] p-4">
          <div className="flex items-center justify-between gap-4 mb-1">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-cyan-500" />
                <span className="text-xs font-bold text-zinc-200 tracking-wide">
                  OUTCOME REFRESH
                </span>
              </div>
              <p className="text-[10px] text-zinc-600 mt-0.5">
                Re-evaluate neutral outcomes older than 48h with current prices
              </p>
            </div>
            <button
              onClick={handleOutcomeRefresh}
              disabled={outcomeLoading}
              className="flex-none bg-cyan-900/30 text-cyan-400 px-4 py-1.5 text-[10px] font-bold tracking-widest hover:bg-cyan-900/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-cyan-900/50"
            >
              {outcomeLoading ? "REFRESHING..." : "REFRESH"}
            </button>
          </div>
          {outcomeResult !== null && (
            <pre className="mt-3 text-[9px] leading-relaxed text-zinc-500 bg-[#060606] border border-zinc-900 p-2 overflow-x-auto max-h-40 scrollbar-hide">
              {JSON.stringify(outcomeResult, null, 2)}
            </pre>
          )}
        </div>

        {/* Recover Null Scores */}
        <div className="mt-6 border border-zinc-800 bg-[#0a0a0a] p-4">
          <div className="flex items-center justify-between gap-4 mb-1">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-orange-500" />
                <span className="text-xs font-bold text-zinc-200 tracking-wide">
                  RECOVER NULL SCORES
                </span>
              </div>
              <p className="text-[10px] text-zinc-600 mt-0.5">
                Re-fetch DexScreener data and compute scores for all tracked tokens with null/missing scores
              </p>
            </div>
            <button
              onClick={handleRecoverNullScores}
              disabled={recoverLoading}
              className="flex-none bg-orange-900/30 text-orange-400 px-4 py-1.5 text-[10px] font-bold tracking-widest hover:bg-orange-900/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-orange-900/50"
            >
              {recoverLoading ? "RECOVERING..." : "RECOVER"}
            </button>
          </div>
          {recoverResult !== null && (
            <pre className="mt-3 text-[9px] leading-relaxed text-zinc-500 bg-[#060606] border border-zinc-900 p-2 overflow-x-auto max-h-40 scrollbar-hide">
              {JSON.stringify(recoverResult, null, 2)}
            </pre>
          )}
        </div>

        {/* Proof Lookup Debug */}
        <div className="mt-10 border border-zinc-800 bg-[#0a0a0a] p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-cyan-500" />
            <span className="text-[10px] font-bold text-zinc-400 tracking-[0.3em] uppercase">
              PROOF LOOKUP DEBUG
            </span>
          </div>
          <p className="text-[10px] text-zinc-600 mb-3">
            Look up raw proof records by entryHash. Shows both byHash and bySignal keys.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={lookupHash}
              onChange={(e) => setLookupHash(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              placeholder="ec9973f1d0bfe242abff29b35f624c3e..."
              className="flex-1 bg-[#060606] border border-zinc-800 text-zinc-300 text-xs px-3 py-2 font-mono placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600"
            />
            <button
              onClick={handleLookup}
              disabled={lookupLoading || !lookupHash.trim()}
              className="flex-none bg-zinc-800 text-zinc-300 px-4 py-2 text-[10px] font-bold tracking-widest hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-zinc-700"
            >
              {lookupLoading ? "..." : "LOOKUP \u2192"}
            </button>
          </div>
          {lookupResult !== null && (
            <pre className="mt-3 text-[9px] leading-relaxed text-zinc-500 bg-[#060606] border border-zinc-900 p-2 overflow-x-auto max-h-60 scrollbar-hide">
              {JSON.stringify(lookupResult, null, 2)}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 border-t border-zinc-900 pt-4 flex items-center justify-between">
          <span className="text-[9px] text-zinc-700 tracking-widest">
            AUTH: OPS PASSWORD
          </span>
          <span className="text-[9px] text-zinc-700 tracking-widest">
            PROXY: /api/admin/trigger-cron
          </span>
        </div>
      </div>
    </div>
  )
}
