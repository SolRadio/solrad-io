import { NextRequest, NextResponse } from "next/server"
import { storage } from "@/lib/storage"

export const dynamic = "force-dynamic"

function getDateStr(date: Date): string {
  return date.toISOString().split("T")[0]
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET ?? process.env.SOLRAD_CRON_SECRET

  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 })
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const today = getDateStr(now)
  const yesterday = getDateStr(new Date(now.getTime() - 86_400_000))

  // 1. Check solrad:proof:latest-root
  let latestRoot: unknown = null
  let latestRootError: string | undefined
  try {
    latestRoot = await storage.get("solrad:proof:latest-root")
  } catch (e) {
    latestRootError = String(e)
  }

  // 2. Check solrad:proof:daily:{today}
  let dailyToday: unknown = null
  let dailyTodayError: string | undefined
  try {
    dailyToday = await storage.get(`solrad:proof:daily:${today}`)
  } catch (e) {
    dailyTodayError = String(e)
  }

  // 3. Check solrad:proof:daily:{yesterday}
  let dailyYesterday: unknown = null
  let dailyYesterdayError: string | undefined
  try {
    dailyYesterday = await storage.get(`solrad:proof:daily:${yesterday}`)
  } catch (e) {
    dailyYesterdayError = String(e)
  }

  // 4. Check alpha ledger entry count
  let ledgerEntryCount: number | null = null
  let ledgerMeta: unknown = null
  let ledgerError: string | undefined
  try {
    const ledger = await storage.get("solrad:alpha:ledger")
    ledgerEntryCount = Array.isArray(ledger) ? ledger.length : 0
    ledgerMeta = await storage.get("solrad:alpha:ledger:meta")
  } catch (e) {
    ledgerError = String(e)
  }

  // 5. Check SOLRAD_PROOF_WALLET_PRIVATE_KEY exists (truthy check only)
  const hasWalletKey = Boolean(process.env.SOLRAD_PROOF_WALLET_PRIVATE_KEY)

  // 6. Check QUICKNODE_SOLANA_RPC_URL exists
  const hasRpcUrl = Boolean(process.env.QUICKNODE_SOLANA_RPC_URL)

  // Additional diagnostics
  let sequenceCounter: unknown = null
  try {
    sequenceCounter = await storage.get("solrad:proof:sequence-counter")
  } catch { /* silent */ }

  let publicationToday: unknown = null
  let publicationYesterday: unknown = null
  try {
    publicationToday = await storage.get(`solrad:proof:publication:${today}`)
    publicationYesterday = await storage.get(`solrad:proof:publication:${yesterday}`)
  } catch { /* silent */ }

  // CRITICAL FINDING: The cron runs at midnight UTC and reads today's key,
  // but at 00:00 UTC "today" has just rolled over, so yesterday's hashes
  // are the ones that need to be published.
  const cronTimingAnalysis = {
    cronSchedule: "0 0 * * * (midnight UTC)",
    cronReadsKey: `solrad:proof:daily:${today}`,
    note: "At midnight UTC, 'today' has just rolled over. The cron reads the NEW day's key (empty). Yesterday's accumulated hashes are at the previous day's key and go unprocessed.",
    likelyFix: "The cron should read YESTERDAY's key instead of today's, since it fires at 00:00 after the day has rolled.",
  }

  return NextResponse.json({
    ok: true,
    timestamp: now.toISOString(),
    today,
    yesterday,
    checks: {
      latestRoot: {
        key: "solrad:proof:latest-root",
        exists: latestRoot !== null,
        value: latestRoot,
        ...(latestRootError ? { error: latestRootError } : {}),
      },
      dailyHashesToday: {
        key: `solrad:proof:daily:${today}`,
        exists: dailyToday !== null,
        count: Array.isArray(dailyToday) ? dailyToday.length : 0,
        sample: Array.isArray(dailyToday) ? dailyToday.slice(0, 3) : null,
        ...(dailyTodayError ? { error: dailyTodayError } : {}),
      },
      dailyHashesYesterday: {
        key: `solrad:proof:daily:${yesterday}`,
        exists: dailyYesterday !== null,
        count: Array.isArray(dailyYesterday) ? dailyYesterday.length : 0,
        sample: Array.isArray(dailyYesterday) ? dailyYesterday.slice(0, 3) : null,
        ...(dailyYesterdayError ? { error: dailyYesterdayError } : {}),
      },
      alphaLedger: {
        key: "solrad:alpha:ledger",
        entryCount: ledgerEntryCount,
        meta: ledgerMeta,
        ...(ledgerError ? { error: ledgerError } : {}),
      },
      envVars: {
        SOLRAD_PROOF_WALLET_PRIVATE_KEY: hasWalletKey ? "SET" : "MISSING",
        QUICKNODE_SOLANA_RPC_URL: hasRpcUrl ? "SET" : "MISSING",
        CRON_SECRET: "SET",
      },
      sequenceCounter,
      publications: {
        today: publicationToday,
        yesterday: publicationYesterday,
      },
    },
    cronTimingAnalysis,
  })
}
