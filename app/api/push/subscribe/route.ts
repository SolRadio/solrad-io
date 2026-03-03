import { NextResponse } from "next/server"
import { storage } from "@/lib/storage"

const SUBS_KEY = "solrad:push:subscriptions"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { subscription, preferences } = body

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
    }

    // Load existing subscriptions
    const existing = ((await storage.get(SUBS_KEY)) as Array<Record<string, unknown>>) ?? []

    // Dedupe by endpoint
    const filtered = existing.filter(
      (s: Record<string, unknown>) => (s.subscription as Record<string, unknown>)?.endpoint !== subscription.endpoint
    )

    filtered.push({
      subscription,
      preferences: {
        scoreAlerts: preferences?.scoreAlerts ?? true,
        signalUpgrades: preferences?.signalUpgrades ?? true,
        leadTimeProofs: preferences?.leadTimeProofs ?? false,
        minScore: preferences?.minScore ?? 60,
      },
      subscribedAt: Date.now(),
    })

    await storage.set(SUBS_KEY, filtered)

    return NextResponse.json({ ok: true, totalSubs: filtered.length })
  } catch (err) {
    console.error("[PUSH] Subscribe error:", err)
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json()
    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400 })
    }

    const existing = ((await storage.get(SUBS_KEY)) as Array<Record<string, unknown>>) ?? []
    const filtered = existing.filter(
      (s: Record<string, unknown>) => (s.subscription as Record<string, unknown>)?.endpoint !== endpoint
    )

    await storage.set(SUBS_KEY, filtered)

    return NextResponse.json({ ok: true, removed: existing.length - filtered.length })
  } catch (err) {
    console.error("[PUSH] Unsubscribe error:", err)
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 })
  }
}
