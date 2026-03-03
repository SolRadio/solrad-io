import { auth, currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { isProUser } from "@/lib/subscription"

export async function GET() {
  // DEV BYPASS: set NEXT_PUBLIC_BYPASS_PRO_AUTH=true to skip Pro check
  if (process.env.NEXT_PUBLIC_BYPASS_PRO_AUTH === "true") {
    return NextResponse.json({ plan: "pro", isPro: true, userId: "dev-bypass" })
  }

  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ plan: "anonymous", isPro: false })
    }
    // Check KV first (set by Stripe webhook), fall back to Clerk publicMetadata
    const kvPro = await isProUser()
    if (kvPro) {
      return NextResponse.json({ plan: "pro", isPro: true, userId })
    }
    const user = await currentUser()
    const plan = (user?.publicMetadata as { plan?: string })?.plan
    const isPro = plan === "pro"
    return NextResponse.json({ plan: isPro ? "pro" : "free", isPro, userId })
  } catch {
    return NextResponse.json({ plan: "anonymous", isPro: false })
  }
}
