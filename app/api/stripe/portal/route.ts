import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { stripe } from "@/lib/stripe"
import { getSubscriptionStatus } from "@/lib/subscription"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.solrad.io"

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { stripeCustomerId } = await getSubscriptionStatus(userId)
    if (!stripeCustomerId) {
      return NextResponse.json({ error: "No subscription found" }, { status: 404 })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${SITE_URL}/pro`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("[stripe/portal] Error:", error)
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    )
  }
}
