/**
 * Proof Engine System Status Report
 * GET /api/proof-engine-status
 *
 * Dev-only diagnostic endpoint that reads raw KV state and returns
 * a comprehensive report of the Alpha Ledger, Lead-Time Ledger,
 * Harvest pipeline, and Storage layer.
 *
 * Protected by x-ops-password header.
 */

import { NextResponse } from "next/server"
import { storage } from "@/lib/storage"
import { readLedger, readMeta, computeMetrics } from "@/lib/alpha-ledger"
import { getRecentLeadTimeProofs } from "@/lib/lead-time/storage"

const CONFIDENCE_MAP: Record<string, number> = { LOW: 30, MED: 60, MEDIUM: 60, HIGH: 90 }

// KV keys to check existence
const KV_KEYS = {
  ALPHA_LEDGER: "solrad:alpha:ledger",
  ALPHA_META: "solrad:alpha:ledger:meta",
  ALPHA_LOCK: "solrad:lock:alphaLedger",
  LEADTIME_RECENT: "solrad:leadtime:recent",
  TOKENS: "solrad:latest",
  LAST_UPDATED: "solrad:lastUpdated",
}

export async function GET(request: Request) {
  // Allow in dev without password, require it in production
  const isDev = process.env.NODE_ENV !== "production"
  if (!isDev) {
    const opsPassword = process.env.OPS_PASSWORD
    const headerPassword = request.headers.get("x-ops-password")
    if (!opsPassword || headerPassword !== opsPassword) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }
  }

  const report: Record<string, unknown> = {
    generatedAt: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? "unknown",
  }

  // ── PHASE 1A: Alpha Ledger ──
  try {
    const [allEntries, meta] = await Promise.all([readLedger(), readMeta()])
    const active = allEntries.filter((e) => !e.voided)
    const voided = allEntries.filter((e) => e.voided)
    const uniqueMints = new Set(allEntries.map((e) => e.mint).filter(Boolean))

    // Range breakdown
    const now = Date.now()
    const ranges = { "24h": 0, "7d": 0, "30d": 0 }
    for (const e of active) {
      const age = now - new Date(e.detectedAt).getTime()
      if (age <= 24 * 60 * 60 * 1000) ranges["24h"]++
      if (age <= 7 * 24 * 60 * 60 * 1000) ranges["7d"]++
      if (age <= 30 * 24 * 60 * 60 * 1000) ranges["30d"]++
    }

    // Outcome breakdown
    const outcomes = { win: 0, loss: 0, neutral: 0 }
    for (const e of active) {
      if (e.outcome === "win") outcomes.win++
      else if (e.outcome === "loss") outcomes.loss++
      else outcomes.neutral++
    }

    // Sample entries
    const sample = allEntries.slice(0, 3).map((e) => ({
      id: e.id,
      mint: e.mint,
      symbol: e.symbol,
      detectedAt: e.detectedAt,
      outcome: e.outcome,
      mintType: typeof e.mint,
      priceAtSignal: e.priceAtSignal,
      voided: e.voided ?? false,
    }))

    // Detect issues
    const invalidMints = allEntries.filter((e) => typeof e.mint !== "string" || !e.mint.trim()).length
    const invalidDates = allEntries.filter((e) => {
      const ts = new Date(e.detectedAt).getTime()
      return !Number.isFinite(ts) || ts <= 0
    }).length

    const metrics = computeMetrics(active, meta)

    const alphaStatus = allEntries.length === 0 ? "RED" : invalidMints > 0 || invalidDates > 0 ? "YELLOW" : "GREEN"

    report.alphaLedger = {
      status: alphaStatus,
      totalInStorage: allEntries.length,
      activeEntries: active.length,
      voidedEntries: voided.length,
      uniqueMints: uniqueMints.size,
      invalidMints,
      invalidDates,
      rangeBreakdown: ranges,
      outcomeBreakdown: outcomes,
      metrics,
      meta,
      sample,
    }
  } catch (err) {
    report.alphaLedger = { status: "RED", error: err instanceof Error ? err.message : "Unknown error" }
  }

  // ── PHASE 1B: Lead-Time Ledger ──
  try {
    const proofs = await getRecentLeadTimeProofs(250)
    const uniqueMints = new Set(proofs.map((p) => p.mint).filter(Boolean))

    // Confidence breakdown (raw values)
    const rawConfidences: Record<string, number> = {}
    for (const p of proofs) {
      const conf = String(p.confidence ?? "UNKNOWN")
      rawConfidences[conf] = (rawConfidences[conf] ?? 0) + 1
    }

    // Range breakdown
    const now = Date.now()
    const ranges = { "24h": 0, "7d": 0, "30d": 0 }
    for (const p of proofs) {
      const ts = p.observationEvent?.blockTimestamp
      if (!ts) continue
      const age = now - ts
      if (age <= 24 * 60 * 60 * 1000) ranges["24h"]++
      if (age <= 7 * 24 * 60 * 60 * 1000) ranges["7d"]++
      if (age <= 30 * 24 * 60 * 60 * 1000) ranges["30d"]++
    }

    // Normalized confidence breakdown
    const normalizedConf: Record<string, number> = { HIGH: 0, MEDIUM: 0, LOW: 0, UNKNOWN: 0 }
    for (const p of proofs) {
      const raw = String(p.confidence ?? "").toUpperCase()
      if (raw === "HIGH") normalizedConf.HIGH++
      else if (raw === "MEDIUM" || raw === "MED") normalizedConf.MEDIUM++
      else if (raw === "LOW") normalizedConf.LOW++
      else normalizedConf.UNKNOWN++
    }

    // Sample proofs
    const sample = proofs.slice(0, 3).map((p) => ({
      mint: p.mint,
      symbol: p.symbol,
      confidence: p.confidence,
      confidenceType: typeof p.confidence,
      confidenceNumeric: CONFIDENCE_MAP[String(p.confidence)] ?? "unmapped",
      observedAt: p.observationEvent?.blockTimestamp
        ? new Date(p.observationEvent.blockTimestamp).toISOString()
        : "N/A",
      leadSeconds: p.leadSeconds,
      leadBlocks: p.leadBlocks,
      proofCreatedAt: p.proofCreatedAt ? new Date(p.proofCreatedAt).toISOString() : "N/A",
    }))

    const ltStatus = proofs.length === 0 ? "RED" : normalizedConf.UNKNOWN > 0 ? "YELLOW" : "GREEN"

    report.leadTimeLedger = {
      status: ltStatus,
      totalProofs: proofs.length,
      uniqueMints: uniqueMints.size,
      rawConfidenceValues: rawConfidences,
      normalizedConfidenceBreakdown: normalizedConf,
      rangeBreakdown: ranges,
      sample,
    }
  } catch (err) {
    report.leadTimeLedger = { status: "RED", error: err instanceof Error ? err.message : "Unknown error" }
  }

  // ── PHASE 2: Storage Layer / KV Health ──
  try {
    const kvHealth: Record<string, { exists: boolean; type: string; sizeHint?: number }> = {}

    for (const [label, key] of Object.entries(KV_KEYS)) {
      try {
        const val = await storage.get(key)
        const exists = val !== null
        let sizeHint: number | undefined
        if (exists && Array.isArray(val)) sizeHint = val.length
        else if (exists && typeof val === "object" && val !== null) sizeHint = Object.keys(val).length
        kvHealth[label] = { exists, type: val === null ? "null" : Array.isArray(val) ? "array" : typeof val, sizeHint }
      } catch {
        kvHealth[label] = { exists: false, type: "error" }
      }
    }

    report.storageLayer = {
      status: kvHealth.ALPHA_LEDGER.exists || kvHealth.LEADTIME_RECENT.exists ? "GREEN" : "RED",
      kvHealth,
    }
  } catch (err) {
    report.storageLayer = { status: "RED", error: err instanceof Error ? err.message : "Unknown error" }
  }

  // ── PHASE 2B: Harvest Pipeline ──
  try {
    const meta = await readMeta()
    const lockVal = await storage.get(KV_KEYS.ALPHA_LOCK)

    report.harvestPipeline = {
      status: meta ? "GREEN" : "YELLOW",
      lastWriteAt: meta?.lastWriteAt ?? null,
      trackedSince: meta?.trackedSince ?? null,
      totalEntries: meta?.totalEntries ?? 0,
      totalVoided: meta?.totalVoided ?? 0,
      lockActive: lockVal !== null,
      lockValue: lockVal,
    }
  } catch (err) {
    report.harvestPipeline = { status: "RED", error: err instanceof Error ? err.message : "Unknown error" }
  }

  // ── PHASE 4: Cross-Link Validation ──
  try {
    const alphaReport = report.alphaLedger as Record<string, unknown> | undefined
    const ltReport = report.leadTimeLedger as Record<string, unknown> | undefined

    if (alphaReport && ltReport) {
      const [allEntries, proofs] = await Promise.all([
        readLedger(),
        getRecentLeadTimeProofs(250),
      ])

      const alphaMints = new Set(
        allEntries
          .filter((e) => !e.voided && typeof e.mint === "string" && e.mint.trim())
          .map((e) => e.mint.toLowerCase())
      )
      const leadMints = new Set(
        proofs
          .filter((p) => typeof p.mint === "string" && p.mint.trim())
          .map((p) => p.mint.toLowerCase())
      )

      const intersection = new Set([...alphaMints].filter((m) => leadMints.has(m)))

      report.crossLinks = {
        alphaMintSetSize: alphaMints.size,
        leadMintSetSize: leadMints.size,
        intersectionCount: intersection.size,
        intersectionMints: [...intersection].slice(0, 10),
        eligibleForLeadBadge: intersection.size,
        eligibleForSignalBadge: intersection.size,
      }
    } else {
      report.crossLinks = { note: "Skipped - one or both ledgers failed to load" }
    }
  } catch (err) {
    report.crossLinks = { error: err instanceof Error ? err.message : "Unknown error" }
  }

  // ── Overall Status ──
  const statuses = [
    (report.alphaLedger as Record<string, unknown>)?.status,
    (report.leadTimeLedger as Record<string, unknown>)?.status,
    (report.storageLayer as Record<string, unknown>)?.status,
    (report.harvestPipeline as Record<string, unknown>)?.status,
  ]
  const hasRed = statuses.includes("RED")
  const hasYellow = statuses.includes("YELLOW")
  report.overallStatus = hasRed ? "RED" : hasYellow ? "YELLOW" : "GREEN"

  return NextResponse.json(report, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  })
}
