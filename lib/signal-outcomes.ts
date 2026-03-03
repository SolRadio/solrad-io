import { kv } from "@vercel/kv"
import { getTrackedMints, getSnapshotHistory, type TokenSnapshot } from "@/lib/snapshotLogger"
import { getTrackedTokens } from "@/lib/get-tracked-tokens"
import { toCanonicalToken, type CanonicalToken } from "@/lib/canonical/canonicalToken"
import { scanSnapshotRecency, getSnapshotRecencyMs, getSnapshotTsMs as sharedGetSnapshotTsMs } from "@/lib/snapshotRecency"
import { getCutoffMs24h, getKvIdentity } from "@/lib/getCutoffMs24h"

/**
 * Safe toLowerCase helper - handles non-string values
 */
const safeLower = (v: any) =>
  typeof v === "string" ? v.toLowerCase() : ""

/**
 * Real Solana pubkey validation via @solana/web3.js.
 */
import { PublicKey } from "@solana/web3.js"

function isValidSolanaMint(v: unknown): v is string {
  if (typeof v !== "string" || v.length === 0) return false
  if (v === "So11111111111111111111111111111111111111111" || v === "unknown" || v === "11111111111111111111111111111111") return false
  try {
    const pk = new PublicKey(v)
    return pk.toBytes().length === 32
  } catch {
    return false
  }
}

function isValidEpochMs(x: unknown): x is number {
  const n = typeof x === "string" ? Number(x) : x
  return typeof n === "number" && Number.isFinite(n) && n > 1_000_000_000_000
}

const isValidDetectedAt = isValidEpochMs

type ResolvedSource = "from_signal" | "from_token" | "from_snapshot" | "from_now"

function resolveDetectedAt({
  signalDetectedAt,
  token,
  newestSnapshotTs,
  oldestSnapshotTs,
}: {
  signalDetectedAt: unknown
  token: Record<string, unknown> | undefined
  newestSnapshotTs: unknown
  oldestSnapshotTs: unknown
}): { ts: number; source: ResolvedSource } {
  if (isValidEpochMs(signalDetectedAt)) return { ts: Number(signalDetectedAt), source: "from_signal" }
  if (token) {
    for (const field of ["detectedAt", "createdAt", "launchTimestamp", "firstSeen"] as const) {
      const v = token[field]
      if (isValidEpochMs(v)) return { ts: Number(v), source: "from_token" }
      if (typeof v === "string" && v.length > 0) {
        const parsed = new Date(v).getTime()
        if (isValidEpochMs(parsed)) return { ts: parsed, source: "from_token" }
      }
    }
  }
  if (isValidEpochMs(newestSnapshotTs)) return { ts: Number(newestSnapshotTs), source: "from_snapshot" }
  if (isValidEpochMs(oldestSnapshotTs)) return { ts: Number(oldestSnapshotTs), source: "from_snapshot" }
  return { ts: Date.now(), source: "from_now" }
}

function normalizeMint(raw: unknown): { normalized: string | null; stripped: boolean; reason?: string } {
  if (!raw || typeof raw !== "string") return { normalized: null, stripped: false, reason: "non_string" }
  let s = raw.trim()
  if (s.length === 0) return { normalized: null, stripped: false, reason: "empty" }

  let stripped = false
  let reason: string | undefined

  while (s.endsWith("/")) { s = s.slice(0, -1); stripped = true }
  const slashIdx = s.indexOf("/")
  if (slashIdx > 0) { s = s.slice(0, slashIdx); stripped = true; reason = "url_path" }
  const qIdx = s.indexOf("?")
  if (qIdx > 0) { s = s.slice(0, qIdx); stripped = true; reason = "url_query" }
  const hIdx = s.indexOf("#")
  if (hIdx > 0) { s = s.slice(0, hIdx); stripped = true; reason = "url_hash" }

  if (s.toLowerCase().endsWith(".pump")) {
    const candidate = s.slice(0, -5)
    if (candidate.length >= 32 && isValidSolanaMint(candidate)) {
      s = candidate; stripped = true; reason = "stripped_dot_pump_valid"
    } else {
      reason = "dot_pump_strip_rejected_invalid_pubkey"
    }
  } else if (s.toLowerCase().endsWith("pump") && s.length > 36) {
    const candidate = s.slice(0, -4)
    if (candidate.length >= 32 && isValidSolanaMint(candidate)) {
      s = candidate; stripped = true; reason = "stripped_bare_pump_valid"
    } else {
      reason = "bare_pump_strip_rejected_invalid_pubkey"
    }
  } else if (s.toLowerCase().endsWith("pump") && isValidSolanaMint(s)) {
    reason = "kept_valid_pubkey_ends_with_pump"
  }

  return { normalized: s.length > 0 ? s : null, stripped, reason }
}

type InvalidReason = "missing_mint" | "invalid_mint_format" | "missing_detectedAt" | "invalid_detectedAt"
interface InvalidSample { tokenSymbol?: string; mint?: string; rawMint?: string; detectedAt?: unknown; reason: InvalidReason }

export interface SignalOutcome {
  mint: string
  symbol: string
  name: string
  detectionType: "CROSS" | "FIRST_SEEN"
  detectedAt: number
  priceAtSignal: number
  priceNow: number
  priceChangePct24h: number
  scoreAtSignal: number
  scoreNow: number
  scoreDelta: number
  riskLabel: string
  liquidityAtSignal: number
  imageUrl?: string
  _rawMint?: string
  _canonical?: CanonicalToken & { hasSignal?: boolean }
}

interface DebugInfo {
  minScore: number
  tokensAnalyzed: number
  tokensWithAnyHistory: number
  tokensWithWindowHistory: number
  tokensWith2PlusSnapshots: number
  tokensCrossingThreshold: number
  tokensFirstSeenAboveThreshold: number
  tokensAnySnapshotAboveThreshold: number
  pushedSignalsCount: number
  pushedNearSignalsCount: number
  droppedInsufficientSnapshots: number
  droppedNoEvent: number
  exampleCross: { mint: string; prevScore: number; currScore: number; ts: number } | null
  exampleFirstSeen: { mint: string; score: number; ts: number } | null
  sampleSnapshotKeys: string[]
  newestSnapshotTs: number | null
  oldestSnapshotTs: number | null
  reasonIfEmpty: string
  deploymentId: string | null
  gitSha: string | null
  maxScoreInWindow: number
  exampleMaxScoreMint: string | null
  exampleMaxScoreValue: number | null
  exampleMaxScoreTs: number | null
  exampleMaxScoreRawKeys: string[]
}

function getScore(s: any): number {
  const v = s?.solradScore ?? s?.score ?? s?.signalScore ?? s?.qualityScore ?? s?.compositeScore
  return typeof v === "number" ? v : Number(v ?? 0)
}

function getPrice(s: any): number | null {
  const v = s?.price ?? s?.priceUsd ?? s?.usdPrice
  const n = typeof v === "number" ? v : Number(v ?? NaN)
  return Number.isFinite(n) ? n : null
}

function getTs(s: any): number {
  return getSnapshotRecencyMs(s) ?? 0
}

// ──────────────────────────────────────────────────────────────
// Public interface
// ──────────────────────────────────────────────────────────────

export interface SignalOutcomesParams {
  sort?: "priceChangePct24h" | "detectedAt" | "scoreAtSignal"
  limit?: number
  minScore?: number
  debug?: boolean
  debugMint?: string | null
}

export interface SignalOutcomesResult {
  ok: boolean
  now: number
  updatedAt: number
  minScore: number
  count: number
  signals: SignalOutcome[]
  tokensAnalyzed: number
  meta: Record<string, unknown>
  invalidReasonCounts: Record<string, number>
  invalidSamples: InvalidSample[]
  includedCount: number
  excludedCount: number
  debug: DebugInfo
  [key: string]: unknown
}

/**
 * Core signal-outcomes logic extracted for direct in-process use.
 * Identical business logic to the /api/signal-outcomes route handler.
 */
export async function getSignalOutcomes(params: SignalOutcomesParams = {}): Promise<SignalOutcomesResult> {
  const sortBy = params.sort || "priceChangePct24h"
  const limit = Math.min(params.limit ?? 50, 100)
  const rawMinScore = params.minScore ?? 75
  const minScore = Math.max(50, Math.min(95, rawMinScore))
  const debugMode = params.debug ?? false
  const debugMintParam = params.debugMint?.trim() || null

  const debugLookups: Array<{
    rawMint: string; normMint: string; effectiveMint: string; normReason?: string
    historyKeyUsed: string | null; historyLen: number
    totalUsable: number
    countLast24hComputed: number
    cutoffISO: string
    newestRecencyMs: number | null; newestRecencyISO: string | null
    oldestRecencyMs: number | null; oldestRecencyISO: string | null
    newestTsMs: number | null; newestWrittenAtMs: number | null
    tsFieldDetected: string | null; writtenFieldDetected: string | null
  }> = []
  const MAX_DEBUG_LOOKUPS = 20

  const trackedMints = await getTrackedMints()
  const currentTokens = await getTrackedTokens()
  const tokenMetaMap = new Map(
    currentTokens.map(t => [safeLower(t.address), t])
  )

  const nowMs = Date.now()
  const cutoffMs = getCutoffMs24h(nowMs)
  const signals: SignalOutcome[] = []
  const nearSignals: SignalOutcome[] = []

  let tokensWithAnyHistory = 0
  let tokensWithWindowHistory = 0
  let tokensWith2PlusSnapshots = 0
  let tokensFirstSeenAboveThreshold = 0
  let tokensAnySnapshotAboveThreshold = 0
  let pushedSignalsCount = 0
  let pushedNearSignalsCount = 0
  let droppedInsufficientSnapshots = 0
  let droppedNoEvent = 0
  let exampleFirstSeen: { mint: string; score: number; ts: number } | null = null
  let exampleCross: { mint: string; prevScore: number; currScore: number; ts: number } | null = null
  let sampleSnapshotKeys: string[] = []
  let newestSnapshotTs: number | null = null
  let oldestSnapshotTs: number | null = null

  let detectedAtOriginalCount = 0
  let detectedAtFallbackCount = 0
  const detectedAtFallbackSources: Record<string, number> = {}

  let strippedPumpSuffixCount = 0
  let strippedOtherCount = 0
  let mintNullAfterNormCount = 0

  let maxScoreInWindow = 0
  let exampleMaxScoreMint: string | null = null
  let exampleMaxScoreValue: number | null = null
  let exampleMaxScoreTs: number | null = null
  let exampleMaxScoreRawKeys: string[] = []

  for (const rawMint of trackedMints) {
    const { normalized: mint, stripped: mintWasStripped, reason: normReason } = normalizeMint(rawMint)
    if (!mint) { mintNullAfterNormCount++; continue }
    if (mintWasStripped) {
      if (normReason?.includes("pump")) strippedPumpSuffixCount++
      else strippedOtherCount++
    }

    const candidateMints: string[] = [rawMint]
    if (mint !== rawMint) candidateMints.push(mint)

    let historyKeyUsed: string | null = null
    let raw: TokenSnapshot[] = []
    for (const candidate of candidateMints) {
      const h = await getSnapshotHistory(candidate, 80)
      if (h && Array.isArray(h) && h.length > 0) {
        raw = h
        historyKeyUsed = candidate
        break
      }
    }

    const effectiveMint = historyKeyUsed ?? (isValidSolanaMint(rawMint) ? rawMint : mint)

    if (historyKeyUsed && raw.length > 0) {
      const keysToHeal = [historyKeyUsed]
      if (rawMint !== historyKeyUsed) keysToHeal.push(rawMint)
      kv.sadd("snap:index", keysToHeal).catch(() => {})
    }

    const snapshots = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as any)?.snapshots)
        ? (raw as any).snapshots
        : raw && typeof raw === "object"
          ? Object.values(raw)
          : []

    const scan = scanSnapshotRecency(snapshots, cutoffMs)

    const recent = snapshots
      .filter((s: any) => {
        const ms = getSnapshotRecencyMs(s)
        return ms !== null && ms >= cutoffMs
      })
      .sort((a: any, b: any) => (getSnapshotRecencyMs(a) ?? 0) - (getSnapshotRecencyMs(b) ?? 0))

    const mintMatchesDebug = debugMintParam
      ? (rawMint === debugMintParam || mint === debugMintParam || historyKeyUsed === debugMintParam || effectiveMint === debugMintParam)
      : true
    if (debugMode && (mintMatchesDebug || debugLookups.length < MAX_DEBUG_LOOKUPS) && (debugMintParam ? mintMatchesDebug : debugLookups.length < MAX_DEBUG_LOOKUPS)) {
      debugLookups.push({
        rawMint,
        normMint: mint,
        effectiveMint,
        normReason: mintWasStripped ? normReason : undefined,
        historyKeyUsed,
        historyLen: snapshots.length,
        totalUsable: scan.totalUsable,
        countLast24hComputed: scan.countLast24h,
        cutoffISO: new Date(cutoffMs).toISOString(),
        newestRecencyMs: scan.newestRecencyMs,
        newestRecencyISO: scan.newestRecencyMs ? new Date(scan.newestRecencyMs).toISOString() : null,
        oldestRecencyMs: scan.oldestRecencyMs,
        oldestRecencyISO: scan.oldestRecencyMs ? new Date(scan.oldestRecencyMs).toISOString() : null,
        newestTsMs: scan.newestTsMs,
        newestWrittenAtMs: scan.newestWrittenAtMs,
        tsFieldDetected: scan.tsFieldDetected,
        writtenFieldDetected: scan.writtenFieldDetected,
      })
    }

    if (snapshots.length > 0) {
      tokensWithAnyHistory++
      if (sampleSnapshotKeys.length === 0 && snapshots[0]) {
        sampleSnapshotKeys = Object.keys(snapshots[0]).slice(0, 40)
      }
      if (scan.countLast24h > 0) {
        tokensWithWindowHistory++
        if (scan.newestRecencyMs !== null && (newestSnapshotTs === null || scan.newestRecencyMs > newestSnapshotTs)) {
          newestSnapshotTs = scan.newestRecencyMs
        }
        if (scan.oldestRecencyMs !== null && (oldestSnapshotTs === null || scan.oldestRecencyMs < oldestSnapshotTs)) {
          oldestSnapshotTs = scan.oldestRecencyMs
        }
        const scoresInWindow = recent.map((s: any) => getScore(s))
        const maxScoreForMint = scoresInWindow.length > 0 ? Math.max(...scoresInWindow) : 0
        if (maxScoreForMint > maxScoreInWindow) {
          maxScoreInWindow = maxScoreForMint
          const maxScoreSnapshot = recent.find((s: any) => getScore(s) === maxScoreForMint)
          if (maxScoreSnapshot) {
            exampleMaxScoreMint = effectiveMint
            exampleMaxScoreValue = maxScoreForMint
            exampleMaxScoreTs = getTs(maxScoreSnapshot)
            exampleMaxScoreRawKeys = Object.keys(maxScoreSnapshot).slice(0, 30)
          }
        }
      }
      if (recent.length >= 2) {
        tokensWith2PlusSnapshots++
      } else {
        droppedInsufficientSnapshots++
      }
    }

    if (recent.length < 1) {
      droppedNoEvent++
      continue
    }

    const hasAnyAboveThreshold = recent.some((s: any) => getScore(s) >= minScore)
    if (hasAnyAboveThreshold) {
      tokensAnySnapshotAboveThreshold++
    }

    const firstSeenSnap = recent.find((s: any) => getScore(s) >= minScore)

    if (firstSeenSnap) {
      const latest = recent.reduce((best: any, curr: any) => {
        const bestMs = getSnapshotRecencyMs(best) ?? 0
        const currMs = getSnapshotRecencyMs(curr) ?? 0
        return currMs > bestMs ? curr : best
      }, recent[0])
      const meta = tokenMetaMap.get(safeLower(effectiveMint)) || tokenMetaMap.get(safeLower(mint)) || tokenMetaMap.get(safeLower(rawMint))

      const priceAtSignal = getPrice(firstSeenSnap)
      const priceNow = getPrice(latest)

      let priceChangePct24h = 0
      if (priceAtSignal !== null && priceAtSignal > 0 && priceNow !== null && priceNow > 0) {
        priceChangePct24h = ((priceNow - priceAtSignal) / priceAtSignal) * 100
        if (!Number.isFinite(priceChangePct24h)) priceChangePct24h = 0
      }

      const scoreAtSignal = getScore(firstSeenSnap)
      const scoreNow = getScore(latest)

      const canonical = toCanonicalToken({
        mint: effectiveMint,
        symbol: (latest as any).symbol || (meta as any)?.symbol || "???",
        name: (latest as any).name || (meta as any)?.name || "Unknown",
        scoreNow,
        scoreAtSignal,
        lastUpdatedAt: getTs(latest),
      })

      const rawDetectedAt = getTs(firstSeenSnap)
      const resolved = resolveDetectedAt({
        signalDetectedAt: rawDetectedAt,
        token: meta as Record<string, unknown> | undefined,
        newestSnapshotTs,
        oldestSnapshotTs,
      })
      if (resolved.source === "from_signal") {
        detectedAtOriginalCount++
      } else {
        detectedAtFallbackCount++
        detectedAtFallbackSources[resolved.source] = (detectedAtFallbackSources[resolved.source] || 0) + 1
      }

      const outcome: SignalOutcome = {
        mint: effectiveMint,
        symbol: (latest as any).symbol || (meta as any)?.symbol || "???",
        name: (latest as any).name || (meta as any)?.name || "Unknown",
        detectionType: "FIRST_SEEN",
        detectedAt: resolved.ts,
        priceAtSignal: priceAtSignal !== null && priceAtSignal > 0 ? priceAtSignal : 0,
        priceNow: priceNow !== null && priceNow > 0 ? priceNow : 0,
        priceChangePct24h,
        scoreAtSignal,
        scoreNow,
        scoreDelta: scoreNow - scoreAtSignal,
        riskLabel: (latest as any).riskLabel || "UNKNOWN",
        liquidityAtSignal: (latest as any).liquidityUsd || 0,
        imageUrl: (meta as any)?.imageUrl,
        _rawMint: effectiveMint !== rawMint ? String(rawMint) : undefined,
        _canonical: { ...canonical, hasSignal: true },
      }

      signals.push(outcome)
      pushedSignalsCount++
      tokensFirstSeenAboveThreshold++

      if (exampleFirstSeen === null) {
        exampleFirstSeen = { mint: effectiveMint, score: scoreAtSignal, ts: getTs(firstSeenSnap) }
      }
    } else {
      droppedNoEvent++
    }
  }

  // Sanity checks
  if (tokensFirstSeenAboveThreshold > 0 && signals.length === 0) {
    console.error("[signal-outcomes] BUG: tokensFirstSeenAboveThreshold =", tokensFirstSeenAboveThreshold, "but signals.length = 0")
  }
  if (signals.length !== pushedSignalsCount) {
    console.error("[signal-outcomes] BUG: signals.length =", signals.length, "but pushedSignalsCount =", pushedSignalsCount)
  }

  const sortFn = (a: SignalOutcome, b: SignalOutcome) => {
    if (sortBy === "priceChangePct24h") return b.priceChangePct24h - a.priceChangePct24h
    if (sortBy === "scoreAtSignal") return b.scoreAtSignal - a.scoreAtSignal
    return b.detectedAt - a.detectedAt
  }
  signals.sort(sortFn)

  const invalidReasonCounts: Record<InvalidReason, number> = {
    missing_mint: 0, invalid_mint_format: 0, missing_detectedAt: 0, invalid_detectedAt: 0,
  }
  const invalidSamples: InvalidSample[] = []
  const MAX_INVALID_SAMPLES = 5

  function trackInvalid(sig: SignalOutcome, reason: InvalidReason) {
    invalidReasonCounts[reason]++
    if (invalidSamples.length < MAX_INVALID_SAMPLES) {
      invalidSamples.push({
        tokenSymbol: sig.symbol, mint: sig.mint, rawMint: sig._rawMint ?? sig.mint, detectedAt: sig.detectedAt, reason,
      })
    }
  }

  const validatedSignals = signals.filter((sig) => {
    if (!sig.mint) { trackInvalid(sig, "missing_mint"); return false }
    if (!isValidSolanaMint(sig.mint)) { trackInvalid(sig, "invalid_mint_format"); return false }
    if (!isValidDetectedAt(sig.detectedAt)) {
      if (sig.detectedAt == null || sig.detectedAt === 0) {
        trackInvalid(sig, "missing_detectedAt")
      } else {
        trackInvalid(sig, "invalid_detectedAt")
      }
      return false
    }
    return true
  })

  const includedCount = validatedSignals.length
  const excludedCount = signals.length - validatedSignals.length
  const limitedSignals = validatedSignals.slice(0, limit)

  let reasonIfEmpty = ""
  if (limitedSignals.length === 0) {
    if (trackedMints.length === 0) {
      reasonIfEmpty = "No tracked mints in KV index"
    } else if (tokensWithAnyHistory === 0) {
      reasonIfEmpty = "No tokens have snapshot history"
    } else if (tokensWithWindowHistory === 0) {
      reasonIfEmpty = "No snapshots in 24h window"
    } else if (tokensAnySnapshotAboveThreshold === 0) {
      reasonIfEmpty = `No snapshots >= minScore (${minScore}) in last 24h`
    } else if (tokensAnySnapshotAboveThreshold > 0 && signals.length === 0) {
      reasonIfEmpty = `BUG: ${tokensAnySnapshotAboveThreshold} tokens have snapshots above threshold but none pushed`
    } else {
      reasonIfEmpty = "Unknown - signals array empty despite meeting criteria"
    }
  }

  // Debug mint direct scan
  let debugMintDirect: Record<string, unknown> | null = null
  if (debugMode && debugMintParam) {
    const triedKeys: string[] = []
    let usedKey: string | null = null
    let directHistory: TokenSnapshot[] = []

    triedKeys.push(`snap:list:${debugMintParam}`)
    directHistory = await getSnapshotHistory(debugMintParam, 200)
    if (directHistory.length > 0) usedKey = `snap:list:${debugMintParam}`

    if (directHistory.length === 0) {
      const { normalized: normDebugMint } = normalizeMint(debugMintParam)
      if (normDebugMint && normDebugMint !== debugMintParam) {
        triedKeys.push(`snap:list:${normDebugMint}`)
        directHistory = await getSnapshotHistory(normDebugMint, 200)
        if (directHistory.length > 0) usedKey = `snap:list:${normDebugMint}`
      }
    }

    if (directHistory.length === 0 && !debugMintParam.toLowerCase().endsWith("pump")) {
      const withPump = debugMintParam + "pump"
      triedKeys.push(`snap:list:${withPump}`)
      directHistory = await getSnapshotHistory(withPump, 200)
      if (directHistory.length > 0) usedKey = `snap:list:${withPump}`
    }

    const directScan = scanSnapshotRecency(directHistory, cutoffMs)
    const isInIndexRaw = trackedMints.includes(debugMintParam)
    const { normalized: normDebugCheck } = normalizeMint(debugMintParam)
    const isInIndexNorm = normDebugCheck ? trackedMints.includes(normDebugCheck) : false
    const isInTrackedMints = isInIndexRaw || isInIndexNorm || trackedMints.some(m =>
      normalizeMint(m).normalized === normDebugCheck
    )

    let indexHeal: { attempted: boolean; addedKey: string | null; wasInIndexBefore: boolean } = {
      attempted: false, addedKey: null, wasInIndexBefore: isInTrackedMints,
    }
    if (directHistory.length > 0 && usedKey) {
      const mintToAdd = usedKey.replace("snap:list:", "")
      try {
        await kv.sadd("snap:index", mintToAdd)
        indexHeal = { attempted: true, addedKey: mintToAdd, wasInIndexBefore: isInTrackedMints }
      } catch {
        indexHeal = { attempted: true, addedKey: mintToAdd, wasInIndexBefore: isInTrackedMints }
      }
    }

    const triedMints = triedKeys.map(k => k.replace("snap:list:", ""))
    debugMintDirect = {
      debugMint: debugMintParam, triedMints,
      historyKeyUsed: usedKey ? usedKey.replace("snap:list:", "") : null,
      historyLen: directHistory.length,
      totalUsable: directScan.totalUsable,
      countLast24hComputed: directScan.countLast24h,
      cutoffISO: new Date(cutoffMs).toISOString(),
      newestRecencyMs: directScan.newestRecencyMs,
      newestRecencyISO: directScan.newestRecencyMs ? new Date(directScan.newestRecencyMs).toISOString() : null,
      oldestRecencyMs: directScan.oldestRecencyMs,
      newestTsMs: directScan.newestTsMs,
      newestWrittenAtMs: directScan.newestWrittenAtMs,
      tsFieldDetected: directScan.tsFieldDetected,
      writtenFieldDetected: directScan.writtenFieldDetected,
      isInIndexRaw, isInIndexNorm, isInTrackedMints, indexHeal,
    }

    const { normalized: normDebug } = normalizeMint(debugMintParam)
    const historyKeyUsedMint = usedKey ? usedKey.replace("snap:list:", "") : null
    const effectiveDebug = historyKeyUsedMint ?? (isValidSolanaMint(debugMintParam) ? debugMintParam : (normDebug ?? debugMintParam))
    debugLookups.unshift({
      rawMint: debugMintParam, normMint: normDebug ?? debugMintParam, effectiveMint: effectiveDebug,
      normReason: normalizeMint(debugMintParam).reason,
      historyKeyUsed: historyKeyUsedMint,
      historyLen: directHistory.length,
      totalUsable: directScan.totalUsable,
      countLast24hComputed: directScan.countLast24h,
      cutoffISO: new Date(cutoffMs).toISOString(),
      newestRecencyMs: directScan.newestRecencyMs,
      newestRecencyISO: directScan.newestRecencyMs ? new Date(directScan.newestRecencyMs).toISOString() : null,
      oldestRecencyMs: directScan.oldestRecencyMs,
      oldestRecencyISO: directScan.oldestRecencyMs ? new Date(directScan.oldestRecencyMs).toISOString() : null,
      newestTsMs: directScan.newestTsMs,
      newestWrittenAtMs: directScan.newestWrittenAtMs,
      tsFieldDetected: directScan.tsFieldDetected,
      writtenFieldDetected: directScan.writtenFieldDetected,
    })
  }

  let kvKeyProbe: Record<string, unknown> | null = null
  if (debugMode) {
    const indexExists = trackedMints.length > 0
    const exampleTrackedMint = trackedMints[0] ?? null
    let exampleHistoryLen = 0
    if (exampleTrackedMint) {
      const exampleHistory = await getSnapshotHistory(exampleTrackedMint, 10)
      exampleHistoryLen = exampleHistory.length
    }
    kvKeyProbe = {
      indexExists, trackedMintsCount: trackedMints.length, exampleTrackedMint,
      exampleKey: exampleTrackedMint ? `snap:list:${exampleTrackedMint}` : null,
      exampleHistoryLen,
      debugMintInIndex: debugMintParam ? trackedMints.includes(debugMintParam) : null,
      debugMintNormInIndex: debugMintParam ? trackedMints.some(m => normalizeMint(m).normalized === normalizeMint(debugMintParam).normalized) : null,
    }
  }

  const debug: DebugInfo = {
    minScore, tokensAnalyzed: trackedMints.length, tokensWithAnyHistory, tokensWithWindowHistory,
    tokensWith2PlusSnapshots, tokensCrossingThreshold: 0, tokensFirstSeenAboveThreshold,
    tokensAnySnapshotAboveThreshold, pushedSignalsCount, pushedNearSignalsCount: 0,
    droppedInsufficientSnapshots, droppedNoEvent, exampleCross: null, exampleFirstSeen,
    sampleSnapshotKeys, newestSnapshotTs, oldestSnapshotTs, reasonIfEmpty,
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? null, gitSha: null,
    maxScoreInWindow, exampleMaxScoreMint, exampleMaxScoreValue, exampleMaxScoreTs, exampleMaxScoreRawKeys,
  }

  const finalCount = validatedSignals.length
  const sampleMintEntry = debugLookups.find(d => d.historyLen > 0)
  const kvIdent = getKvIdentity()

  const result: SignalOutcomesResult = {
    ok: true,
    now: nowMs,
    updatedAt: nowMs,
    minScore,
    count: finalCount,
    signals: limitedSignals,
    tokensAnalyzed: trackedMints.length,
    ...(debugMode ? {
      forensic: {
        cutoffMs, cutoffISO: new Date(cutoffMs).toISOString(), nowMs, nowISO: new Date(nowMs).toISOString(),
        kvIdentity: kvIdent,
        sampleMint: sampleMintEntry?.rawMint ?? trackedMints[0] ?? null,
        sampleMintHistoryLen: sampleMintEntry?.historyLen ?? 0,
        sampleMintNewestRecencyMs: sampleMintEntry?.newestRecencyMs ?? null,
        sampleMintNewestRecencyISO: sampleMintEntry?.newestRecencyISO ?? null,
        sampleMintCountLast24h: sampleMintEntry?.countLast24hComputed ?? 0,
        assertions: {
          sameKvInstanceLikely: kvIdent !== "KV_NOT_SET",
          newestRecencyBeatsCutoff: sampleMintEntry?.newestRecencyMs != null && sampleMintEntry.newestRecencyMs >= cutoffMs,
          trackedMintsNonEmpty: trackedMints.length > 0,
          anyHistoryFound: tokensWithAnyHistory > 0,
          anyIn24hWindow: tokensWithWindowHistory > 0,
        },
      },
    } : {}),
    meta: {
      asOf: new Date(nowMs).toISOString(), cutoffMs, cutoffISO: new Date(cutoffMs).toISOString(),
      kvIdentity: kvIdent, signalCount: finalCount, minScore, dataSource: "kv:snap:list",
      probeStrategy: "raw-first",
      validation: "signal-outcomes: scanSnapshotRecency (lib/snapshotRecency.ts) + normalizeMint + resolveDetectedAt",
      includedCount, excludedCount, detectedAtOriginalCount, detectedAtFallbackCount, detectedAtFallbackSources,
      mintNormalization: { strippedPumpSuffixCount, strippedOtherCount, mintNullAfterNormCount },
      snapshotHealthUrl: "/api/snapshot-health",
      snapshotGate: "Signals require at least 1 snapshot within the 24h window (cutoffMs = now - 86400000). Mints with 0 snapshots in that window are dropped as droppedNoEvent.",
      snapshotAdminTriggerUrl: "POST /api/admin/snapshot/run (x-ops-password)",
      snapshotReindexUrl: "POST /api/admin/snapshot/reindex (x-ops-password)",
      ...(debugMode && debugMintDirect ? { indexHeal: (debugMintDirect as any).indexHeal } : {}),
      ...(debugMode && debugMintParam ? { debugLinks: { kvSnapshots: `/api/debug/kv-snapshots?mint=${debugMintParam}` } } : {}),
    },
    invalidReasonCounts,
    invalidSamples,
    includedCount,
    excludedCount,
    debug,
    ...(debugMode ? {
      debugMint: debugMintParam ?? undefined,
      debugMintDirect: debugMintDirect ?? undefined,
      kvKeyProbe: kvKeyProbe ?? undefined,
      debugLookups: debugMintParam
        ? debugLookups.filter(d =>
            d.rawMint === debugMintParam || d.normMint === debugMintParam || d.historyKeyUsed === debugMintParam || d.effectiveMint === debugMintParam
          )
        : debugLookups,
    } : {}),
  }

  return result
}
