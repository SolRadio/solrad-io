import { auth } from "@clerk/nextjs/server"
import { createClient } from "@vercel/kv"
import { NextResponse } from "next/server"

const redis = createClient({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export async function GET() {
  // DEV BYPASS: set NEXT_PUBLIC_BYPASS_PRO_AUTH=true to skip Pro check
  if (process.env.NEXT_PUBLIC_BYPASS_PRO_AUTH === "true") {
    return NextResponse.json({ isPro: true }, { headers: { "Cache-Control": "private, max-age=60" } })
  }

  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { isPro: false },
        { headers: { "Cache-Control": "private, max-age=60" } },
      )
    }

    const plan = await redis.get<string>(`user:${userId}:plan`)
    const isPro = plan === "pro"

    return NextResponse.json(
      { isPro },
      { headers: { "Cache-Control": "private, max-age=60" } },
    )
  } catch {
    return NextResponse.json(
      { isPro: false },
      { headers: { "Cache-Control": "private, max-age=60" } },
    )
  }
}
