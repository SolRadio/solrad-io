import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { getBackgroundCount } from "@/lib/background-tracker"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const [
      lastSnapshotTime,
      lastIngestTime,
      lastVelocityRun,
      cronSnapshotStarted,
      cronSnapshotError,
      lastIngestTokenCount,
      lastIngestErrors,
      autoTrackingCount,
    ] = await Promise.all([
      kv.get<number>("solrad:last-snapshot-time").catch(() => null),
      kv.get<number>("solrad:last-ingest-time").catch(() => null),
      kv.get<number>("solrad:last-velocity-run").catch(() => null),
      kv.get<number>("solrad:cron-snapshot-started").catch(() => null),
      kv.get<{ error: string; time: number } | null>("solrad:cron-snapshot-error").catch(() => null),
      kv.get<number>("solrad:last-ingest-token-count").catch(() => null),
      kv.get<unknown[]>("solrad:last-ingest-errors").catch(() => null),
      kv.get<number>("solrad:auto-tracking-count").catch(() => null),
    ])

    const now = Date.now()

    const snapshotAgeMin = lastSnapshotTime ? Math.floor((now - lastSnapshotTime) / 60000) : 999
    const ingestAgeMin = lastIngestTime ? Math.floor((now - lastIngestTime) / 60000) : 999
    const velocityAgeMin = lastVelocityRun ? Math.floor((now - lastVelocityRun) / 60000) : 999

    // Determine overall status from snapshot freshness (primary data source)
    let status: "FRESH" | "STALE" | "DEAD"
    if (snapshotAgeMin < 10) status = "FRESH"
    else if (snapshotAgeMin < 30) status = "STALE"
    else status = "DEAD"

    // Check if cron started but never completed (possible hang)
    const cronHanging = cronSnapshotStarted && lastSnapshotTime
      ? cronSnapshotStarted > lastSnapshotTime && (now - cronSnapshotStarted) > 5 * 60 * 1000
      : false

    // Check if last error is recent (within 30 min)
    const recentError = cronSnapshotError && cronSnapshotError.time
      ? (now - cronSnapshotError.time) < 30 * 60 * 1000
      : false

    const formatAge = (mins: number) => {
      if (mins >= 999) return "never"
      if (mins < 1) return "just now"
      if (mins < 60) return `${mins}m ago`
      const hours = Math.floor(mins / 60)
      if (hours < 24) return `${hours}h ${mins % 60}m ago`
      return `${Math.floor(hours / 24)}d ago`
    }

    return NextResponse.json({
      status,
      dataFresh: snapshotAgeMin < 10,
      lastSnapshotAge: formatAge(snapshotAgeMin),
      lastSnapshotAgeMin: snapshotAgeMin,
      lastSnapshotTime,
      lastIngestAge: formatAge(ingestAgeMin),
      lastIngestAgeMin: ingestAgeMin,
      lastIngestTime,
      lastVelocityAge: formatAge(velocityAgeMin),
      lastVelocityAgeMin: velocityAgeMin,
      cronHanging,
      recentError: recentError ? cronSnapshotError?.error : null,
      tokenCount: autoTrackingCount ?? lastIngestTokenCount ?? 0,
      lastIngestProcessed: lastIngestTokenCount ?? 0,
      ingestErrors: lastIngestErrors ?? [],
      autoTrackingCount: autoTrackingCount ?? 0,
      backgroundTrackingCount: await getBackgroundCount(),
    })
  } catch (error) {
    return NextResponse.json({
      status: "DEAD" as const,
      dataFresh: false,
      error: error instanceof Error ? error.message : "Unknown error",
      lastSnapshotAge: "unknown",
      lastSnapshotAgeMin: 999,
      lastIngestAge: "unknown",
      lastIngestAgeMin: 999,
    })
  }
}
