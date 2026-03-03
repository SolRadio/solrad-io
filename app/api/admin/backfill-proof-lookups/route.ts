import { NextRequest, NextResponse } from "next/server"
import { requireInternalJobOrOps } from "@/lib/internal-auth"
import { storage } from "@/lib/storage"
import { computeEntryHash } from "@/lib/alpha-ledger"

interface LedgerEntry {
  id: string
  mint: string
  symbol: string
  detectedAt: string
  priceAtSignal: number
  scoreAtSignal: number
  detectionType: string
  entryHash?: string
}

interface Publication {
  solanaTxSignature?: string
  explorerUrl?: string
  merkleRoot?: string
}

export async function GET(request: NextRequest) {
  const authResult = requireInternalJobOrOps(request)
  if (!authResult.ok) {
    return NextResponse.json(authResult.body, { status: authResult.status })
  }

  try {
    // 1. Read the full alpha ledger
    const ledger = (await storage.get("solrad:alpha:ledger")) as LedgerEntry[] | null

    if (!Array.isArray(ledger) || ledger.length === 0) {
      return NextResponse.json({
        ok: false,
        error: "Alpha ledger is empty or not found",
      })
    }

    // 2. Scan the last 30 days for publication records
    const now = new Date()
    const publicationsByDate = new Map<string, Publication>()

    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() - i * 86400000)
        .toISOString()
        .split("T")[0]
      const pub = (await storage.get(
        `solrad:proof:publication:${date}`
      )) as Publication | null
      if (pub) {
        publicationsByDate.set(date, pub)
      }
    }

    if (publicationsByDate.size === 0) {
      return NextResponse.json({
        ok: false,
        error: "No publications found in last 30 days",
        totalLedgerEntries: ledger.length,
      })
    }

    console.log(
      "[BACKFILL] Found publications for dates:",
      Array.from(publicationsByDate.keys()).join(", ")
    )

    // 3. Build a map of signal date -> publication (pub date = signal date + 1 day)
    const signalDateToPub = new Map<string, { pubDate: string; pub: Publication }>()
    for (const [pubDate, pub] of publicationsByDate) {
      const signalDate = new Date(
        new Date(pubDate + "T00:00:00Z").getTime() - 86400000
      )
        .toISOString()
        .split("T")[0]
      signalDateToPub.set(signalDate, { pubDate, pub })
    }

    console.log(
      "[BACKFILL] Signal dates covered:",
      Array.from(signalDateToPub.keys()).join(", ")
    )

    // 4. Loop through all ledger entries and backfill
    let backfilled = 0
    let skipped = 0
    let noPublication = 0
    const TTL = 60 * 60 * 24 * 365
    const perDate: Record<string, { matched: number; backfilled: number; skipped: number }> = {}

    for (const entry of ledger) {
      const entryDate = (entry.detectedAt ?? "").split("T")[0]
      const match = signalDateToPub.get(entryDate)

      if (!match) {
        noPublication++
        continue
      }

      // Ensure entryHash exists (compute if missing)
      if (!entry.entryHash) {
        entry.entryHash = computeEntryHash(entry)
      }
      if (!entry.entryHash) continue

      const { pubDate, pub } = match

      if (!perDate[pubDate]) {
        perDate[pubDate] = { matched: 0, backfilled: 0, skipped: 0 }
      }
      perDate[pubDate].matched++

      // Check if reverse lookup already exists
      const existing = await storage.get(
        `solrad:proof:signal:byHash:${entry.entryHash}`
      )
      if (existing) {
        skipped++
        perDate[pubDate].skipped++
        continue
      }

      const proofRecord = {
        sha256: entry.entryHash,
        date: pubDate,
        proofId: "backfilled",
        solanaTx: pub.solanaTxSignature || null,
        solanaTxSignature: pub.solanaTxSignature || null,
        explorerUrl: pub.explorerUrl || null,
        merkleRoot: pub.merkleRoot || null,
        verified: true,
        input: {
          mint: entry.mint,
          detectedAtUnix: Math.floor(
            new Date(entry.detectedAt).getTime() / 1000
          ),
          entryPriceUsd: entry.priceAtSignal ?? 0,
          solradScore: entry.scoreAtSignal ?? 0,
          signalType: (entry.detectionType || "UNKNOWN").toUpperCase(),
          sequenceNumber: 0,
        },
      }

      // Store reverse lookup by entryHash
      await storage.set(
        `solrad:proof:signal:byHash:${entry.entryHash}`,
        proofRecord,
        { ex: TTL }
      )

      // Store signal-level proof record
      await storage.set(
        `solrad:proof:signal:${entry.entryHash}`,
        proofRecord,
        { ex: TTL }
      )

      backfilled++
      perDate[pubDate].backfilled++
    }

    return NextResponse.json({
      ok: true,
      publicationsFound: publicationsByDate.size,
      publicationDates: Array.from(publicationsByDate.keys()),
      totalLedgerEntries: ledger.length,
      totalBackfilled: backfilled,
      totalSkipped: skipped,
      noPublicationForDate: noPublication,
      perDate,
    })
  } catch (error) {
    console.error("[BACKFILL] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
