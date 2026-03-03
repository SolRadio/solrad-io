import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { stripe } from "@/lib/stripe"
import { getSubscriptionStatus } from "@/lib/subscription"
import { rateLimit } from "@/lib/rate-limit"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.solrad.io"

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limit: 5 requests per minute per user
    const { allowed } = await rateLimit(`checkout:${userId}`, 5, 60)
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": "60" } }
      )
    }

    const { stripeCustomerId } = await getSubscriptionStatus(userId)

    const priceId = process.env.STRIPE_PRICE_ID
    if (!priceId) {
      return NextResponse.json({ error: "STRIPE_PRICE_ID not configured" }, { status: 500 })
    }

    const sessionParams: Record<string, unknown> = {
      mode: "subscription" as const,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${SITE_URL}/score-lab?welcome=pro`,
      cancel_url: `${SITE_URL}/pro?canceled=true`,
      metadata: { clerkUserId: userId },
    }

    if (stripeCustomerId) {
      (sessionParams as Record<string, unknown>).customer = stripeCustomerId
    }

    const session = await stripe.checkout.sessions.create(sessionParams as Parameters<typeof stripe.checkout.sessions.create>[0])

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("[stripe/checkout] Error:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
