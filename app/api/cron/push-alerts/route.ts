import { NextResponse } from "next/server"
import { storage } from "@/lib/storage"
import webpush from "web-push"

const SUBS_KEY = "solrad:push:subscriptions"
const LAST_PUSH_KEY = "solrad:push:lastRun"

interface SubEntry {
  subscription: webpush.PushSubscription
  preferences: {
    scoreAlerts: boolean
    signalUpgrades: boolean
    leadTimeProofs: boolean
    minScore: number
  }
}

export async function GET() {
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY

  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json({ ok: false, error: "VAPID not configured" })
  }

  webpush.setVapidDetails("mailto:alerts@solrad.io", vapidPublic, vapidPrivate)

  const now = Date.now()
  const lastRun = ((await storage.get(LAST_PUSH_KEY)) as number) ?? 0
  const sinceLastRun = now - lastRun

  // Skip if ran less than 8 minutes ago (debounce)
  if (sinceLastRun < 8 * 60 * 1000) {
    return NextResponse.json({ ok: true, skipped: true, reason: "too_recent", sinceLastRunMs: sinceLastRun })
  }

  const allSubs = ((await storage.get(SUBS_KEY)) as SubEntry[]) ?? []
  if (allSubs.length === 0) {
    await storage.set(LAST_PUSH_KEY, now)
    return NextResponse.json({ ok: true, sent: 0, reason: "no_subscribers" })
  }

  // Gather current signal data
  const signalStates = ((await storage.get("solrad:signal-states")) as Record<string, { state: string; confidence: number; prevState?: string }>) ?? {}
  const trackedMints = ((await storage.get("solrad:auto-tracked-mints")) as string[]) ?? []

  // Find tokens that recently upgraded or hit high scores
  const alerts: { type: "score" | "upgrade" | "proof"; title: string; body: string; mint: string; score?: number }[] = []

  for (const mint of trackedMints) {
    const stateData = signalStates[mint]
    if (!stateData) continue

    // Check per-token score
    const tokenScore = (await storage.get(`solrad:token:score:${mint}`)) as {
      totalScore?: number
      signalState?: string
      lastUpdated?: number
    } | null

    if (!tokenScore) continue

    const score = tokenScore.totalScore ?? 0
    const updatedAt = tokenScore.lastUpdated ?? 0

    // Only consider scores written since last run
    if (updatedAt < lastRun) continue

    // Score alert: token just crossed a threshold
    if (score >= 70 && stateData.state === "STRONG") {
      alerts.push({
        type: "score",
        title: `STRONG SIGNAL: ${mint.slice(0, 6)}...`,
        body: `Score ${score}/100 | State: STRONG | Confidence: ${stateData.confidence}`,
        mint,
        score,
      })
    }

    // Signal upgrade alert
    if (stateData.prevState && stateData.prevState !== stateData.state) {
      const upgrades = ["EARLY->CAUTION", "CAUTION->STRONG", "EARLY->STRONG"]
      const transition = `${stateData.prevState}->${stateData.state}`
      if (upgrades.includes(transition)) {
        alerts.push({
          type: "upgrade",
          title: `UPGRADE: ${stateData.prevState} -> ${stateData.state}`,
          body: `Token ${mint.slice(0, 8)}... upgraded to ${stateData.state} (score: ${score})`,
          mint,
          score,
        })
      }
    }
  }

  // Check for new lead-time proofs
  const recentProofs = ((await storage.get("solrad:leadtime:recent")) as Array<{ mint: string; confirmedAt: number }>) ?? []
  const newProofs = recentProofs.filter((p) => p.confirmedAt > lastRun)
  for (const proof of newProofs.slice(0, 3)) {
    alerts.push({
      type: "proof",
      title: "LEAD-TIME CONFIRMED",
      body: `Token ${proof.mint.slice(0, 8)}... reaction detected after SOLRAD flagged it`,
      mint: proof.mint,
    })
  }

  // Send alerts to matching subscribers
  let totalSent = 0
  let totalFailed = 0
  const deadEndpoints: string[] = []

  for (const alert of alerts.slice(0, 5)) {
    const payload = JSON.stringify({
      title: alert.title,
      body: alert.body,
      tag: `solrad-${alert.type}-${alert.mint.slice(0, 8)}`,
      data: { url: `/token/${alert.mint}` },
    })

    for (const entry of allSubs) {
      // Filter by preferences
      if (alert.type === "score" && !entry.preferences.scoreAlerts) continue
      if (alert.type === "score" && alert.score && alert.score < entry.preferences.minScore) continue
      if (alert.type === "upgrade" && !entry.preferences.signalUpgrades) continue
      if (alert.type === "proof" && !entry.preferences.leadTimeProofs) continue

      try {
        await webpush.sendNotification(entry.subscription, payload, { TTL: 3600 })
        totalSent++
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode
        if (statusCode === 404 || statusCode === 410) {
          deadEndpoints.push(entry.subscription.endpoint)
        }
        totalFailed++
      }
    }
  }

  // Clean dead subscriptions
  if (deadEndpoints.length > 0) {
    const cleaned = allSubs.filter((s) => !deadEndpoints.includes(s.subscription.endpoint))
    await storage.set(SUBS_KEY, cleaned)
  }

  await storage.set(LAST_PUSH_KEY, now)

  return NextResponse.json({
    ok: true,
    alertsFound: alerts.length,
    sent: totalSent,
    failed: totalFailed,
    deadRemoved: deadEndpoints.length,
    subscribers: allSubs.length,
  })
}
