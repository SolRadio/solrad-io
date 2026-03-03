import { NextResponse } from "next/server"
import { storage } from "@/lib/storage"
import webpush from "web-push"

const SUBS_KEY = "solrad:push:subscriptions"

function isAdminAuthenticated(req: Request): boolean {
  const pw = req.headers.get("x-admin-password") || req.headers.get("x-ops-password")
  const secret = process.env.OPS_PASSWORD
  return Boolean(pw && secret && pw === secret)
}

export async function POST(req: Request) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY

  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 })
  }

  webpush.setVapidDetails("mailto:alerts@solrad.io", vapidPublic, vapidPrivate)

  try {
    const body = await req.json()
    const { title, body: msgBody, tag, url, filter } = body

    const allSubs = ((await storage.get(SUBS_KEY)) as Array<Record<string, unknown>>) ?? []

    if (allSubs.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, total: 0, note: "No subscribers" })
    }

    const payload = JSON.stringify({
      title: title || "SOLRAD ALERT",
      body: msgBody || "New activity detected",
      tag: tag || "solrad-alert",
      data: { url: url || "/" },
    })

    let sent = 0
    let failed = 0
    const deadEndpoints: string[] = []

    for (const entry of allSubs) {
      const sub = entry.subscription as Record<string, unknown>
      const prefs = entry.preferences as Record<string, unknown> | undefined

      // Filter by preferences if filter type specified
      if (filter === "scoreAlerts" && prefs?.scoreAlerts === false) continue
      if (filter === "signalUpgrades" && prefs?.signalUpgrades === false) continue
      if (filter === "leadTimeProofs" && prefs?.leadTimeProofs === false) continue

      try {
        await webpush.sendNotification(
          sub as unknown as webpush.PushSubscription,
          payload,
          { TTL: 3600 }
        )
        sent++
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode
        if (statusCode === 404 || statusCode === 410) {
          // Subscription expired or unsubscribed
          deadEndpoints.push(sub.endpoint as string)
        }
        failed++
      }
    }

    // Clean up dead subscriptions
    if (deadEndpoints.length > 0) {
      const cleaned = allSubs.filter(
        (s: Record<string, unknown>) =>
          !deadEndpoints.includes((s.subscription as Record<string, unknown>)?.endpoint as string)
      )
      await storage.set(SUBS_KEY, cleaned)
    }

    return NextResponse.json({
      ok: true,
      sent,
      failed,
      deadRemoved: deadEndpoints.length,
      totalAfter: allSubs.length - deadEndpoints.length,
    })
  } catch (err) {
    console.error("[PUSH] Send error:", err)
    return NextResponse.json({ error: "Failed to send" }, { status: 500 })
  }
}
