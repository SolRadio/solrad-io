import { NextRequest, NextResponse } from "next/server"
import { storage, CACHE_KEYS } from "@/lib/storage"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET ?? process.env.SOLRAD_CRON_SECRET

  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 })
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const today = new Date().toISOString().split("T")[0]

  // ─── 1. ALPHA LEDGER SAMPLE ───────────────────────────────
  let alphaLedgerSample: unknown[] = []
  let alphaLedgerTotal = 0
  let alphaLedgerMeta: unknown = null
  try {
    const ledger = (await storage.get("solrad:alpha:ledger")) as unknown[]
    if (Array.isArray(ledger)) {
      alphaLedgerTotal = ledger.length
      // Last 5 entries (newest first since sorted desc by detectedAt)
      alphaLedgerSample = ledger.slice(0, 5)
    }
    alphaLedgerMeta = await storage.get("solrad:alpha:ledger:meta")
  } catch { /* silent */ }

  // ─── 2. PROOF HASHES SAMPLE ───────────────────────────────
  let proofHashesToday: { count: number; samples: string[] } = { count: 0, samples: [] }
  let proofHashesYesterday: { count: number; samples: string[] } = { count: 0, samples: [] }
  try {
    const todayHashes = (await storage.get(`solrad:proof:daily:${today}`)) as string[]
    if (Array.isArray(todayHashes)) {
      proofHashesToday = { count: todayHashes.length, samples: todayHashes.slice(0, 3) }
    }
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0]
    const yesterdayHashes = (await storage.get(`solrad:proof:daily:${yesterday}`)) as string[]
    if (Array.isArray(yesterdayHashes)) {
      proofHashesYesterday = { count: yesterdayHashes.length, samples: yesterdayHashes.slice(0, 3) }
    }
  } catch { /* silent */ }

  // ─── 3. TRACKED TOKENS SAMPLE (populated after section 4) ──
  // Deferred: we populate samples after tokenList and allTokenScores are built

  // ─── 4. SIGNAL STATES (from ALL tracked tokens, not just latest cache) ──
  // Read all tracked mint addresses, then fetch per-token signal state from KV
  const allTrackedMints = (await storage.get("solrad:auto-tracked-mints") as string[] | null) ?? []

  // Also read the latest cache for score data
  let tokenList: Record<string, unknown>[] = []
  try {
    const raw = (await storage.get(CACHE_KEYS.TOKENS)) as Record<string, unknown> | null
    if (raw && Array.isArray(raw)) {
      tokenList = raw
    } else if (raw && Array.isArray((raw as { tokens?: unknown }).tokens)) {
      tokenList = (raw as { tokens: Record<string, unknown>[] }).tokens
    }
  } catch { /* silent */ }

  // Build a score lookup from the latest cache
  const cacheScoreMap = new Map<string, Record<string, unknown>>()
  for (const t of tokenList) {
    if (t.address) cacheScoreMap.set(t.address as string, t)
  }

  // Fetch signal state for every tracked mint from per-token KV keys
  const signalStateCounts: Record<string, number> = {
    DETECTED: 0,
    EARLY: 0,
    CAUTION: 0,
    STRONG: 0,
    PEAK: 0,
    unknown: 0,
  }
  const allTokenScores: { mint: string; totalScore: number | null; signalState: string }[] = []

  for (const mint of allTrackedMints) {
    let state = "unknown"
    let score: number | null = null

    // Try per-token signal state key
    try {
      const stateData = await storage.get(`solrad:signalState:${mint}`) as { state?: string; confidence?: number } | null
      if (stateData?.state) {
        state = stateData.state
      }
    } catch { /* silent */ }

    // Try to get score from cache first, then per-token score key, then background tracking
    const cached = cacheScoreMap.get(mint)
    if (cached && typeof cached.totalScore === "number") {
      score = cached.totalScore as number
      if (state === "unknown" && cached.signalState) {
        state = cached.signalState as string
      }
    } else {
      // Try per-token score key (written by cron/snapshot)
      try {
        const perTokenScore = await storage.get(`solrad:token:score:${mint}`) as { totalScore?: number; signalState?: string } | null
        if (perTokenScore && typeof perTokenScore.totalScore === "number") {
          score = perTokenScore.totalScore
          if (state === "unknown" && perTokenScore.signalState) {
            state = perTokenScore.signalState
          }
        }
      } catch { /* silent */ }

      // Final fallback: background tracker per-token key
      if (score === null) {
        try {
          const bgToken = await storage.get(`solrad:background:token:${mint}`) as Record<string, unknown> | null
          if (bgToken && typeof bgToken.totalScore === "number") {
            score = bgToken.totalScore as number
          }
        } catch { /* silent */ }
      }
    }

    if (state in signalStateCounts) {
      signalStateCounts[state]++
    } else {
      signalStateCounts.unknown++
    }

    allTokenScores.push({ mint, totalScore: score, signalState: state })
  }

  // ─── 5. SCORE DISTRIBUTION (across ALL tracked tokens) ────
  const scoreDistribution = {
    "80+": 0,
    "60-79": 0,
    "40-59": 0,
    "below_40": 0,
    "no_score": 0,
    total: allTrackedMints.length,
    fromCache: cacheScoreMap.size,
  }
  for (const entry of allTokenScores) {
    const score = entry.totalScore
    if (typeof score !== "number") { scoreDistribution.no_score++; continue }
    if (score >= 80) scoreDistribution["80+"]++
    else if (score >= 60) scoreDistribution["60-79"]++
    else if (score >= 40) scoreDistribution["40-59"]++
    else scoreDistribution.below_40++
  }

  // ─── 6. TRACKED TOKENS SAMPLE (deferred from section 3) ──
  const trackedTokensSample: unknown[] = []
  const shuffledMints = [...allTrackedMints].sort(() => Math.random() - 0.5).slice(0, 3)
  for (const mint of shuffledMints) {
    const cached = cacheScoreMap.get(mint)
    if (cached) {
      trackedTokensSample.push(cached)
    } else {
      const entry = allTokenScores.find(e => e.mint === mint)
      if (entry) trackedTokensSample.push(entry)
    }
  }

  // ─── 7. BACKGROUND TRACKING ───────────────────────────────
  let backgroundCount = 0
  let backgroundSamples: unknown[] = []
  try {
    const bgMints = (await storage.get("solrad:background:mints")) as string[]
    if (Array.isArray(bgMints)) {
      backgroundCount = bgMints.length
      // Get 3 samples
      const sampleMints = [...bgMints].sort(() => Math.random() - 0.5).slice(0, 3)
      for (const mint of sampleMints) {
        const tokenData = await storage.get(`solrad:background:token:${mint}`)
        if (tokenData) {
          backgroundSamples.push(tokenData)
        }
      }
    }
  } catch { /* silent */ }

  return NextResponse.json({
    ok: true,
    auditedAt: new Date().toISOString(),

    alphaLedger: {
      totalEntries: alphaLedgerTotal,
      meta: alphaLedgerMeta,
      last5Entries: alphaLedgerSample,
    },

    proofHashes: {
      today: { date: today, ...proofHashesToday },
      yesterday: {
        date: new Date(Date.now() - 86_400_000).toISOString().split("T")[0],
        ...proofHashesYesterday,
      },
    },

    trackedTokens: {
      totalAutoTracked: allTrackedMints.length,
      samples: trackedTokensSample,
    },

    signalStates: signalStateCounts,

    scoreDistribution,

    backgroundTracking: {
      count: backgroundCount,
      samples: backgroundSamples,
    },
  })
}
