"use client"

import { useState, useCallback } from "react"

interface TabProps {
  adminHeaders: Record<string, string>
  password: string
}

const CRON_JOBS = [
  { name: "publish-proof", label: "PUBLISH PROOF TO SOLANA", description: "Hash + publish daily proof batch to Solana" },
  { name: "snapshot", label: "RUN SNAPSHOT", description: "Capture current token score snapshot" },
  { name: "ingest", label: "RUN INGEST", description: "Ingest token data with discovery" },
  { name: "cron", label: "RUN MAIN CRON", description: "Main cron loop: ingest + index update" },
  { name: "alpha-ledger", label: "ALPHA LEDGER", description: "Append current top signals to alpha ledger" },
  { name: "score-velocity", label: "SCORE VELOCITY", description: "Calculate score velocity deltas" },
  { name: "background-alerts", label: "BACKGROUND ALERTS", description: "Check and send background alerts" },
  { name: "leadtime-harvest", label: "LEADTIME HARVEST", description: "Harvest lead-time performance data" },
  { name: "daily-intel-package", label: "DAILY INTEL PACKAGE", description: "Generate daily intel summary" },
  { name: "data-audit", label: "RUN DATA AUDIT", description: "Run data audit via /api/debug/data-audit" },
  { name: "push-alerts", label: "PUSH ALERTS", description: "Send Web Push notifications for score spikes and signal upgrades" },
  { name: "backfill-proofs", label: "BACKFILL PROOF LOOKUPS (ONE TIME)", description: "Backfill reverse hash lookups for Feb 26 signals" },
]

interface CronResult {
  cron?: string
  status?: number
  ok?: boolean
  result?: unknown
  error?: string
}

export function TriggersTab({ adminHeaders, password }: TabProps) {
  const [results, setResults] = useState<Record<string, CronResult>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [lookupHash, setLookupHash] = useState("")
  const [lookupResult, setLookupResult] = useState<unknown>(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [recoverLoading, setRecoverLoading] = useState(false)
  const [recoverResult, setRecoverResult] = useState<unknown>(null)
  const [outcomeLoading, setOutcomeLoading] = useState(false)
  const [outcomeResult, setOutcomeResult] = useState<unknown>(null)
  const [intelLoading, setIntelLoading] = useState(false)
  const [intelResult, setIntelResult] = useState<unknown>(null)
  const [telegramLoading, setTelegramLoading] = useState(false)
  const [telegramResult, setTelegramResult] = useState<unknown>(null)
  const [twitterDigestLoading, setTwitterDigestLoading] = useState(false)
  const [twitterDigestResult, setTwitterDigestResult] = useState<unknown>(null)

  const trigger = useCallback(async (name: string) => {
    setLoading((prev) => ({ ...prev, [name]: true }))
    setResults((prev) => { const next = { ...prev }; delete next[name]; return next })
    try {
      const res = await fetch("/api/admin/trigger-cron", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-ops-password": password },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      setResults((prev) => ({ ...prev, [name]: data }))
    } catch (err) {
      setResults((prev) => ({ ...prev, [name]: { error: String(err) } }))
    } finally {
      setLoading((prev) => ({ ...prev, [name]: false }))
    }
  }, [password])

  const handleTwitterDigest = useCallback(async () => {
    setTwitterDigestLoading(true)
    setTwitterDigestResult(null)
    try {
      const res = await fetch("/api/cron/twitter-digest", {
        headers: { "Content-Type": "application/json", "x-ops-password": password },
      })
      const data = await res.json()
      setTwitterDigestResult(data)
    } catch (err) {
      setTwitterDigestResult({ error: String(err) })
    } finally {
      setTwitterDigestLoading(false)
    }
  }, [password])

  const handleTestTelegram = useCallback(async () => {
    setTelegramLoading(true)
    setTelegramResult(null)
    try {
      const res = await fetch("/api/admin/test-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-ops-password": password },
      })
      const data = await res.json()
      setTelegramResult(data)
    } catch (err) {
      setTelegramResult({ error: String(err) })
    } finally {
      setTelegramLoading(false)
    }
  }, [password])

  const handleRunIntelligence = useCallback(async () => {
    setIntelLoading(true)
    setIntelResult(null)
    try {
      const res = await fetch("/api/cron/intelligence", {
        headers: { "Content-Type": "application/json", "x-ops-password": password },
      })
      const data = await res.json()
      setIntelResult(data)
    } catch (err) {
      setIntelResult({ error: String(err) })
    } finally {
      setIntelLoading(false)
    }
  }, [password])

  const handleOutcomeRefresh = useCallback(async () => {
    setOutcomeLoading(true)
    setOutcomeResult(null)
    try {
      const res = await fetch("/api/cron/outcome-refresh", {
        headers: { "Content-Type": "application/json", "x-ops-password": password },
      })
      const data = await res.json()
      setOutcomeResult(data)
    } catch (err) {
      setOutcomeResult({ error: String(err) })
    } finally {
      setOutcomeLoading(false)
    }
  }, [password])

  const handleRecoverNullScores = useCallback(async () => {
    setRecoverLoading(true)
    setRecoverResult(null)
    try {
      const res = await fetch("/api/admin/recover-null-scores", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-ops-password": password },
      })
      const data = await res.json()
      setRecoverResult(data)
    } catch (err) {
      setRecoverResult({ error: String(err) })
    } finally {
      setRecoverLoading(false)
    }
  }, [password])

  const handleLookup = useCallback(async () => {
    const trimmed = lookupHash.trim()
    if (!trimmed) return
    setLookupLoading(true)
    setLookupResult(null)
    try {
      const res = await fetch(`/api/debug/proof-lookup?hash=${encodeURIComponent(trimmed)}`, {
        headers: { "x-ops-password": password },
      })
      setLookupResult(await res.json())
    } catch (err) {
      setLookupResult({ error: String(err) })
    } finally {
      setLookupLoading(false)
    }
  }, [lookupHash, password])

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-2 h-2 bg-amber-500" />
        <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-[0.3em] font-mono">
          {"◈"} ADMIN TRIGGERS
        </h2>
      </div>

      <p className="text-[10px] text-zinc-600 tracking-widest mb-6 uppercase font-mono">
        Manually fire cron jobs. Results shown inline.
      </p>

      <div className="flex flex-col gap-3">
        {CRON_JOBS.map(({ name, label, description }) => {
          const result = results[name]
          const isOk = result && "ok" in result && result.ok
          const isErr = result && ("error" in result || ("status" in result && (result.status ?? 0) >= 400))

          return (
            <div key={name} className={`border bg-[#0a0a0a] p-4 ${isOk ? "border-green-900/50" : isErr ? "border-red-900/50" : "border-zinc-800"}`}>
              <div className="flex items-center justify-between gap-4 mb-1">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-zinc-200 tracking-wide font-mono">{label}</span>
                  <p className="text-[10px] text-zinc-600 mt-0.5 font-mono">{description}</p>
                </div>
                <button
                  onClick={() => trigger(name)}
                  disabled={loading[name]}
                  className="flex-none bg-zinc-800 text-zinc-300 px-4 py-1.5 text-[10px] font-bold tracking-widest hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-zinc-700 font-mono"
                >
                  {loading[name] ? "RUNNING..." : "TRIGGER"}
                </button>
              </div>

              {result !== undefined && (
                <div className="mt-3">
                  {result.status !== undefined && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-bold tracking-widest font-mono ${isOk ? "text-green-500" : "text-red-500"}`}>
                        {isOk ? "OK" : "FAIL"}
                      </span>
                      <span className="text-[9px] text-zinc-600 font-mono">HTTP {result.status}</span>
                    </div>
                  )}
                  <pre className="text-[9px] leading-relaxed text-zinc-500 bg-[#060606] border border-zinc-900 p-2 overflow-x-auto max-h-40 font-mono">
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
              <span className="text-xs font-bold text-zinc-200 tracking-wide font-mono">
                RUN INTELLIGENCE
              </span>
            </div>
            <p className="text-[10px] text-zinc-600 mt-0.5 font-mono">
              Scan background tokens for breakout signals. Publishes to Telegram if configured.
            </p>
          </div>
          <button
            onClick={handleRunIntelligence}
            disabled={intelLoading}
            className="flex-none bg-purple-900/30 text-purple-400 px-4 py-1.5 text-[10px] font-bold tracking-widest hover:bg-purple-900/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-purple-900/50 font-mono"
          >
            {intelLoading ? "SCANNING..." : "RUN"}
          </button>
        </div>
        {intelResult !== null && (
          <pre className="mt-3 text-[9px] leading-relaxed text-zinc-500 bg-[#060606] border border-zinc-900 p-2 overflow-x-auto max-h-40 font-mono">
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
              <span className="text-xs font-bold text-zinc-200 tracking-wide font-mono">
                TEST TWITTER DIGEST
              </span>
            </div>
            <p className="text-[10px] text-zinc-600 mt-0.5 font-mono">
              Post a signal digest tweet to @solaboratoryrad (uses live breakout data)
            </p>
          </div>
          <button
            onClick={handleTwitterDigest}
            disabled={twitterDigestLoading}
            className="flex-none bg-blue-900/30 text-blue-400 px-4 py-1.5 text-[10px] font-bold tracking-widest hover:bg-blue-900/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-blue-900/50 font-mono"
          >
            {twitterDigestLoading ? "POSTING..." : "POST"}
          </button>
        </div>
        {twitterDigestResult !== null && (
          <pre className="mt-3 text-[9px] leading-relaxed text-zinc-500 bg-[#060606] border border-zinc-900 p-2 overflow-x-auto max-h-40 font-mono">
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
              <span className="text-xs font-bold text-zinc-200 tracking-wide font-mono">
                TEST TELEGRAM
              </span>
            </div>
            <p className="text-[10px] text-zinc-600 mt-0.5 font-mono">
              Send a test message to the configured Telegram channel
            </p>
          </div>
          <button
            onClick={handleTestTelegram}
            disabled={telegramLoading}
            className="flex-none bg-green-900/30 text-green-400 px-4 py-1.5 text-[10px] font-bold tracking-widest hover:bg-green-900/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-green-900/50 font-mono"
          >
            {telegramLoading ? "SENDING..." : "TEST"}
          </button>
        </div>
        {telegramResult !== null && (
          <pre className="mt-3 text-[9px] leading-relaxed text-zinc-500 bg-[#060606] border border-zinc-900 p-2 overflow-x-auto max-h-40 font-mono">
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
              <span className="text-xs font-bold text-zinc-200 tracking-wide font-mono">
                OUTCOME REFRESH
              </span>
            </div>
            <p className="text-[10px] text-zinc-600 mt-0.5 font-mono">
              Re-evaluate neutral outcomes older than 48h with current prices
            </p>
          </div>
          <button
            onClick={handleOutcomeRefresh}
            disabled={outcomeLoading}
            className="flex-none bg-cyan-900/30 text-cyan-400 px-4 py-1.5 text-[10px] font-bold tracking-widest hover:bg-cyan-900/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-cyan-900/50 font-mono"
          >
            {outcomeLoading ? "REFRESHING..." : "REFRESH"}
          </button>
        </div>
        {outcomeResult !== null && (
          <pre className="mt-3 text-[9px] leading-relaxed text-zinc-500 bg-[#060606] border border-zinc-900 p-2 overflow-x-auto max-h-40 font-mono">
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
              <span className="text-xs font-bold text-zinc-200 tracking-wide font-mono">
                RECOVER NULL SCORES
              </span>
            </div>
            <p className="text-[10px] text-zinc-600 mt-0.5 font-mono">
              Re-fetch DexScreener data and compute scores for all tracked tokens with null/missing scores
            </p>
          </div>
          <button
            onClick={handleRecoverNullScores}
            disabled={recoverLoading}
            className="flex-none bg-orange-900/30 text-orange-400 px-4 py-1.5 text-[10px] font-bold tracking-widest hover:bg-orange-900/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-orange-900/50 font-mono"
          >
            {recoverLoading ? "RECOVERING..." : "RECOVER"}
          </button>
        </div>
        {recoverResult !== null && (
          <pre className="mt-3 text-[9px] leading-relaxed text-zinc-500 bg-[#060606] border border-zinc-900 p-2 overflow-x-auto max-h-40 font-mono">
            {JSON.stringify(recoverResult, null, 2)}
          </pre>
        )}
      </div>

      {/* Proof Lookup Debug */}
      <div className="mt-10 border border-zinc-800 bg-[#0a0a0a] p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-cyan-500" />
          <span className="text-[10px] font-bold text-zinc-400 tracking-[0.3em] uppercase font-mono">
            PROOF LOOKUP DEBUG
          </span>
        </div>
        <p className="text-[10px] text-zinc-600 mb-3 font-mono">
          Look up raw proof records by entryHash.
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
            className="flex-none bg-zinc-800 text-zinc-300 px-4 py-2 text-[10px] font-bold tracking-widest hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-zinc-700 font-mono"
          >
            {lookupLoading ? "..." : "LOOKUP →"}
          </button>
        </div>
        {lookupResult !== null && (
          <pre className="mt-3 text-[9px] leading-relaxed text-zinc-500 bg-[#060606] border border-zinc-900 p-2 overflow-x-auto max-h-60 font-mono">
            {JSON.stringify(lookupResult, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}
