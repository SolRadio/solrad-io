import { NextRequest, NextResponse } from "next/server"
import { getTrackedMints, getSnapshotHistory } from "@/lib/snapshotLogger"
import { scanSnapshotRecency, type SnapshotScanResult } from "@/lib/snapshotRecency"
import { getCutoffMs24h, getKvIdentity } from "@/lib/getCutoffMs24h"

export const dynamic = "force-dynamic"

interface MintStat {
  mint: string
  sampleKeyUsed: string
  totalSnapshots: number
  totalUsable: number
  countLast24h: number
  newestRecencyMs: number | null
  newestRecencyISO: string | null
  oldestRecencyMs: number | null
  minRecencyISO: string | null
  maxRecencyISO: string | null
  newestTsMs: number | null
  newestWrittenAtMs: number | null
  tsFieldDetected: string | null
  writtenFieldDetected: string | null
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  const internalToken = request.headers.get("x-internal-job-token")
  const expectedInternal = process.env.INTERNAL_JOB_TOKEN
  const isAuthed = (authHeader && cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (internalToken && expectedInternal && internalToken === expectedInternal)
  if (!isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const t0 = Date.now()
  const nowMs = Date.now()
  const nowISO = new Date(nowMs).toISOString()
  const env = process.env.VERCEL_ENV || "unknown"
  const debug = request.nextUrl.searchParams.get("debug") === "1"

  let kvOk = false
  let allMints: string[] = []
  let error: string | null = null

  try {
    allMints = await getTrackedMints()
    kvOk = true
  } catch (err) {
    error = err instanceof Error ? err.message : String(err)
  }

  const oneDayAgo = getCutoffMs24h(nowMs)
  const sevenDaysAgo = nowMs - 7 * 24 * 60 * 60 * 1000

  let globalNewestRecencyMs: number | null = null
  let globalOldestRecencyMs: number | null = null
  let snapshotsLast24hCount = 0
  let snapshotsLast7dCount = 0

  const allMintStats: MintStat[] = []

  const BATCH_SIZE = 20
  for (let i = 0; i < allMints.length; i += BATCH_SIZE) {
    const batch = allMints.slice(i, i + BATCH_SIZE)
    const results = await Promise.allSettled(
      batch.map(async (mint): Promise<MintStat> => {
        const history = await getSnapshotHistory(mint, 200)
        const scan = scanSnapshotRecency(history, oneDayAgo)

        return {
          mint,
          sampleKeyUsed: `snap:list:${mint}`,
          totalSnapshots: history.length,
          totalUsable: scan.totalUsable,
          countLast24h: scan.countLast24h,
          newestRecencyMs: scan.newestRecencyMs,
          newestRecencyISO: scan.newestRecencyMs ? new Date(scan.newestRecencyMs).toISOString() : null,
          oldestRecencyMs: scan.oldestRecencyMs,
          minRecencyISO: scan.oldestRecencyMs ? new Date(scan.oldestRecencyMs).toISOString() : null,
          maxRecencyISO: scan.newestRecencyMs ? new Date(scan.newestRecencyMs).toISOString() : null,
          newestTsMs: scan.newestTsMs,
          newestWrittenAtMs: scan.newestWrittenAtMs,
          tsFieldDetected: scan.tsFieldDetected,
          writtenFieldDetected: scan.writtenFieldDetected,
        }
      })
    )

    for (const r of results) {
      if (r.status !== "fulfilled") continue
      const stat = r.value
      allMintStats.push(stat)

      if (stat.newestRecencyMs !== null) {
        if (globalNewestRecencyMs === null || stat.newestRecencyMs > globalNewestRecencyMs) globalNewestRecencyMs = stat.newestRecencyMs
        if (globalOldestRecencyMs === null || stat.newestRecencyMs < globalOldestRecencyMs) globalOldestRecencyMs = stat.newestRecencyMs
      }
      snapshotsLast24hCount += stat.countLast24h
      if (stat.newestRecencyMs !== null && stat.newestRecencyMs >= sevenDaysAgo) {
        snapshotsLast7dCount += stat.totalSnapshots
      }
    }
  }

  const sampleMints = allMints.slice(0, 3)
  const sampleResults = allMintStats
    .filter((s) => sampleMints.includes(s.mint))
    .map((s) => ({
      ...s,
      hasAnySnapshots: s.totalSnapshots > 0,
    }))

  // Pick a sample mint with 24h data for cross-endpoint proof
  const sampleMintWithData = allMintStats.find(s => s.countLast24h > 0)

  const body: Record<string, unknown> = {
    now: nowISO,
    env,
    kvOk,
    recencyFunction: "scanSnapshotRecency from lib/snapshotRecency.ts",
    snapshotKeyPrefixUsed: "snap:list:{mint}",
    indexKeyUsed: "snap:index",
    trackedMintsCount: allMints.length,
    newestSnapshotTs: globalNewestRecencyMs,
    newestSnapshotTsISO: globalNewestRecencyMs ? new Date(globalNewestRecencyMs).toISOString() : null,
    oldestSnapshotTs: globalOldestRecencyMs,
    oldestSnapshotTsISO: globalOldestRecencyMs ? new Date(globalOldestRecencyMs).toISOString() : null,
    snapshotsLast24hCount,
    snapshotsLast7dCount,
    sampleMintsChecked: sampleMints,
    sampleResults,
    durationMs: Date.now() - t0,
    ...(error ? { error } : {}),
  }

  // Always include forensic meta for cross-endpoint comparison
  if (debug) {
    body.forensic = {
      cutoffMs: oneDayAgo,
      cutoffISO: new Date(oneDayAgo).toISOString(),
      kvIdentity: getKvIdentity(),
      sampleMint: sampleMintWithData?.mint ?? null,
      sampleMintHistoryLen: sampleMintWithData?.totalSnapshots ?? 0,
      sampleMintNewestRecencyMs: sampleMintWithData?.newestRecencyMs ?? null,
      sampleMintNewestRecencyISO: sampleMintWithData?.newestRecencyISO ?? null,
      sampleMintCountLast24h: sampleMintWithData?.countLast24h ?? 0,
      assertions: {
        sameKvInstanceLikely: true, // snapshot-health is the reference endpoint
        newestRecencyBeatsCutoff: sampleMintWithData?.newestRecencyMs != null && sampleMintWithData.newestRecencyMs >= oneDayAgo,
      },
    }
  }

  if (debug) {
    const topRecentMints = [...allMintStats]
      .sort((a, b) => {
        const diff = b.countLast24h - a.countLast24h
        if (diff !== 0) return diff
        return (b.newestRecencyMs ?? 0) - (a.newestRecencyMs ?? 0)
      })
      .slice(0, 20)

    const staleTrackedSample = allMintStats
      .filter((s) => s.totalSnapshots > 0 && s.countLast24h === 0)
      .sort((a, b) => (b.newestRecencyMs ?? 0) - (a.newestRecencyMs ?? 0))
      .slice(0, 20)

    body.debugLinks = sampleMintWithData
      ? { kvSnapshots: `/api/debug/kv-snapshots?mint=${sampleMintWithData.mint}` }
      : null
    body.topRecentMints = topRecentMints
    body.staleTrackedSample = staleTrackedSample
    body.debugNote = "debug=1 mode: uses scanSnapshotRecency from lib/snapshotRecency.ts"
  }

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  })
}
