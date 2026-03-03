import "server-only"
import { createHash } from "node:crypto"
import { storage } from "@/lib/storage"
import { hashSignal, type SignalProofInput } from "@/lib/proof/hash-signal"

// ────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────

export interface AlphaLedgerEntry {
  id: string
  mint: string
  symbol: string
  name?: string
  detectedAt: string        // ISO
  detectionType: string     // e.g. "FIRST_SEEN", "CROSS"
  scoreAtSignal?: number
  scoreNow?: number
  priceAtSignal: number
  priceNow: number
  pct24h?: number
  pct7d?: number
  pct30d?: number
  /**
   * Outcome thresholds (documented):
   *   win:     pct7d >= +20%   OR   (pct7d unavailable AND pct24h >= +15%)
   *   loss:    pct7d <= -20%   OR   (pct7d unavailable AND pct24h <= -15%)
   *   neutral: everything else
   */
  outcome: "win" | "loss" | "neutral"
  source: "signal-outcomes" | "manual" | "intel-promote"
  notes?: string
  voided?: boolean
  voidReason?: string
  createdAt: string         // ISO
  entryHash?: string        // sha256 of canonical fields
}

export interface AlphaLedgerMeta {
  trackedSince: string      // ISO
  lastWriteAt: string       // ISO
  totalEntries: number
  totalVoided: number
  ledgerHash?: string       // sha256 rolling hash over all entryHash values
  hashUpdatedAt?: number    // epoch ms
  hashEntryCount?: number   // total entries included in hash
}

export interface HashHistoryRecord {
  ledgerHash: string
  hashUpdatedAt: string     // ISO
  entryCount: number
  reason: "append" | "void" | "recompute"
}

export interface LedgerMetrics {
  totalTracked: number
  winRate: number
  lossRate: number
  neutralRate: number
  avg7d: number
  avg24h: number
  trackedSince: string | null
  lastUpdated: string | null
}

// ────────────────────────────────────────────
// KV KEYS
// ────────────────────────────────────────────

const KEYS = {
  LEDGER: "solrad:alpha:ledger",
  META: "solrad:alpha:ledger:meta",
  HASH_HISTORY: "solrad:alpha:ledger:hashHistory",
  LOCK: "solrad:lock:alphaLedger",
}

const MAX_HASH_HISTORY = 100

// ────────────────────────────────────────────
// SAFE MINT NORMALIZATION
// ────────────────────────────────────────────

/**
 * Safely normalize a mint value that may be a string, object, or anything else.
 * Never throws. Returns a trimmed string or "".
 */
export function normalizeMint(input: unknown): string {
  if (typeof input === "string") return input.trim()
  if (input && typeof input === "object") {
    const obj = input as Record<string, unknown>
    if (typeof obj.mint === "string") return obj.mint.trim()
    if (typeof obj.address === "string") return obj.address.trim()
    if (
      obj.baseToken &&
      typeof obj.baseToken === "object" &&
      typeof (obj.baseToken as Record<string, unknown>).address === "string"
    ) {
      return ((obj.baseToken as Record<string, unknown>).address as string).trim()
    }
  }
  return ""
}

/**
 * Simple length sanity check for Solana mint addresses.
 * Base58-encoded public keys are 32-44 chars; we allow up to 60 for safety.
 */
export function isValidMintStr(m: string): boolean {
  return m.length >= 32 && m.length <= 60
}

// ────────────────────────────────────────────
// OUTCOME DERIVATION (documented thresholds)
// ────────────────────────────────────────────

/**
 * Outcome thresholds:
 *   win:     pct7d >= +20%   OR  (no pct7d AND pct24h >= +15%)
 *   loss:    pct7d <= -20%   OR  (no pct7d AND pct24h <= -15%)
 *   neutral: everything else
 */
export function deriveOutcome(pct24h?: number, pct7d?: number): "win" | "loss" | "neutral" {
  if (typeof pct7d === "number" && Number.isFinite(pct7d)) {
    if (pct7d >= 20) return "win"
    if (pct7d <= -20) return "loss"
    return "neutral"
  }
  if (typeof pct24h === "number" && Number.isFinite(pct24h)) {
    if (pct24h >= 15) return "win"
    if (pct24h <= -15) return "loss"
  }
  return "neutral"
}

// ────────────────────────────────────────────
// STABLE ID (deterministic hash for dedup)
// ────────────────────────────────────────────

export function entryId(mint: string | unknown, detectedAt: string, detectionType: string): string {
  const safeMint = typeof mint === "string" ? mint : normalizeMint(mint)
  const raw = `${safeMint}:${detectedAt}:${detectionType}`
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    const c = raw.charCodeAt(i)
    hash = (hash << 5) - hash + c
    hash = hash & hash
  }
  return `al_${Math.abs(hash).toString(36)}`
}

// ────────────────────────────────────────────
// CRYPTOGRAPHIC HASHING (append-only integrity)
// ────────────────────────────────────────────

/**
 * Compute a sha256 hash for a single entry using canonical fields.
 * Missing fields use safe defaults so hashing never crashes.
 */
export function computeEntryHash(e: AlphaLedgerEntry): string {
  const canonical = [
    normalizeMint(e.mint),
    e.detectedAt || "",
    e.detectionType || "",
    String(e.priceAtSignal ?? 0),
    e.outcome || "",
  ].join("|")
  return createHash("sha256").update(canonical).digest("hex")
}

/**
 * Compute a rolling ledger hash over all entries.
 * Sorts deterministically by detectedAt then mint, joins all entryHash values,
 * and produces a single sha256.
 */
export function computeLedgerHash(entries: AlphaLedgerEntry[]): string {
  // Sort deterministically: detectedAt ascending, then mint ascending
  const sorted = [...entries].sort((a, b) => {
    const ta = new Date(a.detectedAt).getTime() || 0
    const tb = new Date(b.detectedAt).getTime() || 0
    if (ta !== tb) return ta - tb
    return normalizeMint(a.mint).localeCompare(normalizeMint(b.mint))
  })

  const combined = sorted
    .map((e) => e.entryHash || computeEntryHash(e))
    .join("|")

  return createHash("sha256").update(combined).digest("hex")
}

// ────────────────────────────────────────────
// READ
// ────────────────────────────────────────────

export async function readLedger(): Promise<AlphaLedgerEntry[]> {
  const data = await storage.get(KEYS.LEDGER)
  return (data as AlphaLedgerEntry[] | null) ?? []
}

export async function readMeta(): Promise<AlphaLedgerMeta | null> {
  const data = await storage.get(KEYS.META)
  return data as AlphaLedgerMeta | null
}

// ────────────────────────────────────────────
// HASH HISTORY (append-only, capped at 100)
// ────────────────────────────────────────────

export async function readHashHistory(): Promise<HashHistoryRecord[]> {
  const data = await storage.get(KEYS.HASH_HISTORY)
  return (data as HashHistoryRecord[] | null) ?? []
}

/**
 * Appends a hash history record ONLY if the hash has changed.
 * Called internally by appendEntries and voidEntry. Never call externally.
 */
async function appendHashHistory(
  newHash: string,
  prevHash: string | undefined,
  entryCount: number,
  reason: HashHistoryRecord["reason"]
): Promise<void> {
  // Only record when hash actually changes
  if (newHash === prevHash) return

  try {
    const history = await readHashHistory()
    history.push({
      ledgerHash: newHash,
      hashUpdatedAt: new Date().toISOString(),
      entryCount,
      reason,
    })
    // Cap at MAX_HASH_HISTORY (drop oldest)
    const capped = history.length > MAX_HASH_HISTORY
      ? history.slice(history.length - MAX_HASH_HISTORY)
      : history
    await storage.set(KEYS.HASH_HISTORY, capped)
  } catch (err) {
    // Non-fatal: hash history is supplementary, don't break write paths
    console.error("[alpha-ledger] hash history write failed:", err)
  }
}

// ────────────────────────────────────────────
// WRITE (append-only)
// ────────────────────────────────────────────

/**
 * Acquires a short-lived lock (10s TTL) to prevent concurrent writes.
 * Returns true if lock acquired, false if already locked.
 */
async function acquireLock(): Promise<boolean> {
  const existing = await storage.get(KEYS.LOCK)
  if (existing) return false
  await storage.set(KEYS.LOCK, Date.now(), { ex: 10 })
  return true
}

async function releaseLock(): Promise<void> {
  await storage.del(KEYS.LOCK)
}

/**
 * Append new entries to the ledger. Skips duplicates by id.
 * Returns { added, skipped } counts.
 */
export async function appendEntries(
  newEntries: AlphaLedgerEntry[]
): Promise<{ added: number; skipped: number }> {
  const locked = await acquireLock()
  if (!locked) {
    throw new Error("Ledger write lock held by another process")
  }

  try {
    const existing = await readLedger()
    const existingIds = new Set(existing.map((e) => e.id))

    let added = 0
    let skipped = 0
    const addedEntries: AlphaLedgerEntry[] = []

    // Build a set of mints that already have FIRST_SEEN entries for dedup
    const firstSeenMints = new Set(
      existing
        .filter((e) => e.detectionType === "FIRST_SEEN" && !e.voided)
        .map((e) => normalizeMint(e.mint))
    )

    for (const entry of newEntries) {
      if (existingIds.has(entry.id)) {
        skipped++
        continue
      }
      // Normalize mint before storing (guards against object mints)
      entry.mint = normalizeMint(entry.mint)

      // DEDUP: If a FIRST_SEEN already exists for this mint, downgrade to SCORE_UPDATE
      if (entry.detectionType === "FIRST_SEEN" && firstSeenMints.has(entry.mint)) {
        entry.detectionType = "SCORE_UPDATE"
        // Recompute id with the new detectionType to avoid future dedup collisions
        entry.id = entryId(entry.mint, entry.detectedAt, entry.detectionType)
        if (existingIds.has(entry.id)) {
          skipped++
          continue
        }
      }

      // Compute per-entry hash if not already present
      if (!entry.entryHash) {
        entry.entryHash = computeEntryHash(entry)
      }
      existing.push(entry)
      existingIds.add(entry.id)
      if (entry.detectionType === "FIRST_SEEN") {
        firstSeenMints.add(entry.mint)
      }
      addedEntries.push(entry)
      added++
    }

    // Sort by detectedAt descending (newest first)
    existing.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())

    // Cap at 2000 entries
    const capped = existing.slice(0, 2000)

    await storage.set(KEYS.LEDGER, capped)

    // Update meta (including rolling ledger hash)
    const now = new Date().toISOString()
    const prevMeta = await readMeta()
    const prevHash = prevMeta?.ledgerHash

    // Always compute hash when entries exist, even if nothing new was added.
    // This backfills hash fields if a previous harvest ran before hashing existed.
    const needsHashCompute = added > 0 || !prevMeta?.ledgerHash
    const ledgerHash = needsHashCompute && capped.length > 0
      ? computeLedgerHash(capped)
      : prevMeta?.ledgerHash ?? undefined

    const meta: AlphaLedgerMeta = {
      trackedSince: prevMeta?.trackedSince ?? now,
      lastWriteAt: now,  // always update: harvest ran, even if 0 new entries added
      totalEntries: capped.filter((e) => !e.voided).length,
      totalVoided: capped.filter((e) => e.voided).length,
      ledgerHash,
      hashUpdatedAt: needsHashCompute ? Date.now() : (prevMeta?.hashUpdatedAt ?? Date.now()),
      hashEntryCount: capped.length,
    }
    await storage.set(KEYS.META, meta)

    // Record hash change (only if hash actually changed)
    if (ledgerHash) {
      await appendHashHistory(ledgerHash, prevHash, capped.length, added > 0 ? "append" : "recompute")
    }

    // ── SOLRAD Proof Protocol: hash new entries for daily Merkle batching ──
    if (addedEntries.length > 0) {
      try {
        await hashEntriesForProof(addedEntries)
      } catch (proofErr) {
        // Non-fatal: proof hashing must never break the ledger write path
        console.error("[SOLRAD-PROOF] Proof hashing failed (non-fatal):", proofErr)
      }
    }

    return { added, skipped }
  } finally {
    await releaseLock()
  }
}

// ────────────────────────────────────────────
// VOID (tombstone, no delete)
// ────────────────────────────────────────────

export async function voidEntry(
  entryIdVal: string,
  reason: string
): Promise<{ ok: boolean; error?: string }> {
  const locked = await acquireLock()
  if (!locked) return { ok: false, error: "Lock held" }

  try {
    const entries = await readLedger()
    const idx = entries.findIndex((e) => e.id === entryIdVal)
    if (idx === -1) return { ok: false, error: "Entry not found" }
    if (entries[idx].voided) return { ok: false, error: "Already voided" }

    entries[idx].voided = true
    entries[idx].voidReason = reason

    await storage.set(KEYS.LEDGER, entries)

    // Update meta (recompute ledger hash since voided state changed)
    const prevMeta = await readMeta()
    if (prevMeta) {
      const prevHash = prevMeta.ledgerHash
      prevMeta.totalVoided = entries.filter((e) => e.voided).length
      prevMeta.totalEntries = entries.filter((e) => !e.voided).length
      prevMeta.lastWriteAt = new Date().toISOString()
      prevMeta.ledgerHash = computeLedgerHash(entries)
      prevMeta.hashUpdatedAt = Date.now()
      prevMeta.hashEntryCount = entries.length
      await storage.set(KEYS.META, prevMeta)

      // Record hash change (only if hash actually changed)
      await appendHashHistory(prevMeta.ledgerHash, prevHash, entries.length, "void")
    }

    return { ok: true }
  } finally {
    await releaseLock()
  }
}

// ────────────────────────────────────────────
// METRICS (computed from ledger)
// ────────────────────────────────────────────

export function computeMetrics(
  entries: AlphaLedgerEntry[],
  meta: AlphaLedgerMeta | null
): LedgerMetrics {
  const active = entries.filter((e) => !e.voided)
  const total = active.length

  const wins = active.filter((e) => e.outcome === "win").length
  const losses = active.filter((e) => e.outcome === "loss").length
  const neutrals = active.filter((e) => e.outcome === "neutral").length

  const pct7dValues = active
    .map((e) => e.pct7d)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v))
  const pct24hValues = active
    .map((e) => e.pct24h)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v))

  const avg7d = pct7dValues.length > 0
    ? pct7dValues.reduce((s, v) => s + v, 0) / pct7dValues.length
    : 0
  const avg24h = pct24hValues.length > 0
    ? pct24hValues.reduce((s, v) => s + v, 0) / pct24hValues.length
    : 0

  return {
    totalTracked: total,
    winRate: total > 0 ? (wins / total) * 100 : 0,
    lossRate: total > 0 ? (losses / total) * 100 : 0,
    neutralRate: total > 0 ? (neutrals / total) * 100 : 0,
    avg7d: Math.round(avg7d * 100) / 100,
    avg24h: Math.round(avg24h * 100) / 100,
    trackedSince: meta?.trackedSince ?? null,
    lastUpdated: meta?.lastWriteAt ?? null,
  }
}

// ────────────────────────────────────────────
// HARVEST (convert signal-outcomes -> ledger entries)
// ────────────────────────────────────────────

export interface SignalOutcomeRow {
  mint: string
  symbol: string
  name: string
  detectionType: string
  detectedAt: number       // unix ms
  priceAtSignal: number
  priceNow: number
  priceChangePct24h: number
  scoreAtSignal: number
  scoreNow: number
  riskLabel: string
}

export function signalOutcomeToEntry(row: SignalOutcomeRow): AlphaLedgerEntry {
  const safeMint = normalizeMint(row.mint)
  const detectedAtISO = new Date(row.detectedAt).toISOString()
  const pct24h = row.priceChangePct24h
  const outcome = deriveOutcome(pct24h, undefined) // 7d not available from signal-outcomes directly

  return {
    id: entryId(safeMint, detectedAtISO, row.detectionType),
    mint: safeMint,
    symbol: row.symbol,
    name: row.name,
    detectedAt: detectedAtISO,
    detectionType: row.detectionType,
    scoreAtSignal: row.scoreAtSignal,
    scoreNow: row.scoreNow,
    priceAtSignal: row.priceAtSignal,
    priceNow: row.priceNow,
    pct24h,
    outcome,
    source: "signal-outcomes",
    createdAt: new Date().toISOString(),
  }
}

// ────────────────────────────────────────────
// SOLRAD PROOF PROTOCOL (signal attestation)
// ────────────────────────────────────────────

const PROOF_SEQ_KEY = "solrad:proof:sequence-counter"
const DAILY_HASHES_KEY = (date: string) => `solrad:proof:daily:${date}`

/**
 * Hash newly-added ledger entries for the SOLRAD Proof Protocol.
 * Stores individual signal proofs and appends hashes to the daily batch
 * for nightly Merkle tree construction and on-chain publication.
 *
 * Non-fatal: errors are caught at call site and never break ledger writes.
 */
async function hashEntriesForProof(entries: AlphaLedgerEntry[]): Promise<void> {
  console.log("[PROOF] hashEntriesForProof called, entries:", entries.length)
  if (entries.length === 0) return

  const today = new Date().toISOString().split("T")[0]

  // Get and increment global sequence counter
  let sequenceBase = ((await storage.get(PROOF_SEQ_KEY)) as number) || 0

  // Load existing daily hash batch
  const existingHashes = ((await storage.get(DAILY_HASHES_KEY(today))) as string[]) || []
  const newHashes: string[] = []

  for (const entry of entries) {
    const seqNum = ++sequenceBase

    const proofInput: SignalProofInput = {
      mint: normalizeMint(entry.mint),
      detectedAtUnix: Math.floor(new Date(entry.detectedAt).getTime() / 1000),
      entryPriceUsd: entry.priceAtSignal ?? 0,
      solradScore: entry.scoreAtSignal ?? 0,
      signalType: (entry.detectionType || "UNKNOWN").toUpperCase(),
      sequenceNumber: seqNum,
      volume24h: (entry as Record<string, unknown>).volume24h as number | undefined,
      liquidityUsd: (entry as Record<string, unknown>).liquidityUsd as number | undefined,
      detectionType: entry.detectionType,
    }

    const proof = hashSignal(proofInput)

    // Store individual signal proof (1 year TTL)
    const proofRecord = { ...proof, date: today }
    await storage.set(
      `solrad:proof:signal:${proof.proofId}`,
      proofRecord,
      { ex: 60 * 60 * 24 * 365 }
    )

    // Store reverse lookup by entryHash so verify API can find proof by entryHash
    if (entry.entryHash) {
      await storage.set(
        `solrad:proof:signal:byHash:${entry.entryHash}`,
        proofRecord,
        { ex: 60 * 60 * 24 * 365 }
      )
    }

    newHashes.push(proof.sha256)

    console.log(`[PROOF] Signal hashed: ${proof.proofId} ${proof.sha256.slice(0, 16)}`)
  }

  // Update sequence counter
  await storage.set(PROOF_SEQ_KEY, sequenceBase)

  // Append to daily hash batch (48-hour TTL for safety)
  const updatedHashes = [...existingHashes, ...newHashes]
  await storage.set(DAILY_HASHES_KEY(today), updatedHashes, { ex: 60 * 60 * 48 })
}
