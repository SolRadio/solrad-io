import { auth } from "@clerk/nextjs/server"
import { createClient } from "@vercel/kv"

const redis = createClient({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

/**
 * Check if the current user is a Pro subscriber.
 * Reads from KV, set by the Stripe webhook on checkout.session.completed.
 */
export async function isProUser(): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false
  const plan = await redis.get<string>(`user:${userId}:plan`)
  return plan === "pro"
}

/**
 * Get full subscription status for a user.
 */
export async function getSubscriptionStatus(userId: string) {
  const plan = await redis.get<string>(`user:${userId}:plan`)
  const stripeCustomerId = await redis.get<string>(`user:${userId}:stripe_id`)
  return { plan: plan ?? "free", stripeCustomerId }
}

/**
 * Set a user's plan in KV. Called by the Stripe webhook.
 */
export async function setUserPlan(userId: string, plan: "pro" | "free") {
  await redis.set(`user:${userId}:plan`, plan)
}

/**
 * Link a Stripe customer ID to a Clerk user ID.
 */
export async function linkStripeCustomer(userId: string, stripeCustomerId: string) {
  await redis.set(`user:${userId}:stripe_id`, stripeCustomerId)
  await redis.set(`stripe_customer:${stripeCustomerId}:clerk_id`, userId)
}

/**
 * Resolve a Clerk user ID from a Stripe customer ID.
 */
export async function clerkIdFromStripeCustomer(stripeCustomerId: string): Promise<string | null> {
  return redis.get<string>(`stripe_customer:${stripeCustomerId}:clerk_id`)
}
