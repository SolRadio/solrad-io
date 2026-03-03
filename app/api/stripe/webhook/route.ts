import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { setUserPlan, linkStripeCustomer, clerkIdFromStripeCustomer } from "@/lib/subscription"
import Stripe from "stripe"

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("[stripe/webhook] Signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const clerkUserId = session.metadata?.clerkUserId
        const stripeCustomerId = session.customer as string

        if (clerkUserId && stripeCustomerId) {
          await linkStripeCustomer(clerkUserId, stripeCustomerId)
          await setUserPlan(clerkUserId, "pro")
          console.log(`[stripe/webhook] User ${clerkUserId} upgraded to Pro`)
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const stripeCustomerId = subscription.customer as string
        const clerkUserId = await clerkIdFromStripeCustomer(stripeCustomerId)

        if (clerkUserId) {
          await setUserPlan(clerkUserId, "free")
          console.log(`[stripe/webhook] User ${clerkUserId} downgraded to free`)
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const stripeCustomerId = subscription.customer as string
        const clerkUserId = await clerkIdFromStripeCustomer(stripeCustomerId)

        if (clerkUserId) {
          const isActive = ["active", "trialing"].includes(subscription.status)
          await setUserPlan(clerkUserId, isActive ? "pro" : "free")
          console.log(`[stripe/webhook] User ${clerkUserId} subscription status: ${subscription.status}`)
        }
        break
      }

      default:
        break
    }
  } catch (error) {
    console.error("[stripe/webhook] Handler error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
