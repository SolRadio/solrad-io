import { NextRequest, NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import {
  getSnapshotTsMs,
  getSnapshotWrittenAtMs,
  getSnapshotRecencyMs,
  scanSnapshotRecency,
} from "@/lib/snapshotRecency"
import { getCutoffMs24h, getKvIdentity } from "@/lib/getCutoffMs24h"

export const dynamic = "force-dynamic"

interface ProbeResult {
  key: string
  len: number | null
  lenError?: string
  newestRecencyMs: number | null
  newestRecencyISO: string | null
  oldestRecencyMs: number | null
  oldestRecencyISO: string | null
  countLast24h: number
  sampleCount: number
  samplePreview: Array<{
    recencyMs: number | null
    recencyISO: string | null
    ts: unknown
    writtenAtMs: unknown
    rawKeysPresent: string[]
  }>
  sampleError?: string
}

async function probeKey(key: string, limit: number, cutoffMs: number): Promise<ProbeResult> {
  let len: number | null = null
  let lenError: string | undefined

  try {
    len = await kv.llen(key)
  } catch (e: any) {
    lenError = String(e?.message ?? e)
  }

  let samples: any[] = []
  let sampleError: string | undefined

  try {
    const cap = Math.min(limit, 20)
    samples = await kv.lrange(key, 0, cap - 1)
    if (!Array.isArray(samples)) samples = []
  } catch (e: any) {
    sampleError = String(e?.message ?? e)
  }

  const scan = scanSnapshotRecency(samples, cutoffMs)

  const samplePreview = samples.map((snap: any) => {
    const recencyMs = getSnapshotRecencyMs(snap)
    const rawKeysPresent = Object.keys(snap ?? {})
    return {
      recencyMs,
      recencyISO: recencyMs ? new Date(recencyMs).toISOString() : null,
      ts: snap?.ts ?? snap?.t ?? snap?.timestamp ?? snap?.time ?? snap?.createdAt ?? null,
      writtenAtMs: snap?.writtenAtMs ?? snap?.writtenAt ?? snap?.written_at ?? null,
      rawKeysPresent,
    }
  })

  return {
    key,
    len,
    ...(lenError ? { lenError } : {}),
    newestRecencyMs: scan.newestRecencyMs,
    newestRecencyISO: scan.newestRecencyMs ? new Date(scan.newestRecencyMs).toISOString() : null,
    oldestRecencyMs: scan.oldestRecencyMs,
    oldestRecencyISO: scan.oldestRecencyMs ? new Date(scan.oldestRecencyMs).toISOString() : null,
    countLast24h: scan.countLast24h,
    sampleCount: samples.length,
    samplePreview,
    ...(sampleError ? { sampleError } : {}),
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  const internalToken = req.headers.get("x-internal-job-token")
  const expectedInternal = process.env.INTERNAL_JOB_TOKEN
  const isAuthed = (authHeader && cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (internalToken && expectedInternal && internalToken === expectedInternal)
  if (!isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const mint = searchParams.get("mint")?.trim()
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 1), 50)

  if (!mint) {
    return NextResponse.json({ ok: false, error: "Missing required query param: mint" }, { status: 400 })
  }

  const nowMs = Date.now()
  const cutoffMs = getCutoffMs24h(nowMs)

  // Determine which keys to probe
  const keysToProbe: string[] = [`snap:list:${mint}`]
  let strippedMint: string | null = null

  if (mint.toLowerCase().endsWith("pump") && !mint.toLowerCase().endsWith(".pump")) {
    strippedMint = mint.slice(0, -4)
    keysToProbe.push(`snap:list:${strippedMint}`)
  }
  if (mint.toLowerCase().endsWith(".pump")) {
    strippedMint = mint.slice(0, -5)
    keysToProbe.push(`snap:list:${strippedMint}`)
  }

  // Probe all keys in parallel
  const probes = await Promise.all(keysToProbe.map(key => probeKey(key, limit, cutoffMs)))

  // Check index membership
  let hasMint: boolean | null = null
  let hasStripped: boolean | null = null
  let trackedMintsCount: number | null = null
  let indexError: string | undefined

  try {
    const results = await Promise.all([
      kv.sismember("snap:index", mint),
      strippedMint ? kv.sismember("snap:index", strippedMint) : Promise.resolve(null),
      kv.scard("snap:index"),
    ])
    hasMint = results[0] === 1
    hasStripped = strippedMint ? results[1] === 1 : null
    trackedMintsCount = results[2] as number
  } catch (e: any) {
    indexError = String(e?.message ?? e)
  }

  return NextResponse.json({
    ok: true,
    mint,
    strippedMint,
    nowISO: new Date(nowMs).toISOString(),
    cutoffMs,
    cutoffISO: new Date(cutoffMs).toISOString(),
    kvIdentity: {
      host: getKvIdentity(),
      vercelEnv: process.env.VERCEL_ENV ?? "unknown",
      nodeEnv: process.env.NODE_ENV ?? "unknown",
    },
    index: {
      hasMint,
      hasStripped,
      trackedMintsCount,
      ...(indexError ? { error: indexError } : {}),
    },
    probes,
    testInstructions: [
      "1) Pick a mint with countLast24h > 0 from /api/snapshot-health",
      "2) Open /api/debug/kv-snapshots?mint=<that_mint>",
      "3) Confirm which key has data and countLast24h > 0",
      "4) If this route shows data but signal-outcomes says 0, the bug is in signal-outcomes key lookup or recency math (check the samplePreview timestamps vs cutoffISO)",
    ],
  })
}
