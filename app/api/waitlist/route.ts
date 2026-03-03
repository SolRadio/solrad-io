import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@vercel/kv"

// Initialize Redis client
const redis = createClient({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Check if email already exists
    const exists = await redis.sismember("solrad:waitlist:emails", email.toLowerCase())
    if (exists) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    // Store email in Redis Set
    await redis.sadd("solrad:waitlist:emails", email.toLowerCase())

    // Store timestamp metadata
    await redis.hset(`solrad:waitlist:meta:${email.toLowerCase()}`, {
      addedAt: Date.now(),
      source: "pro-page",
    })

    console.log("[v0] Waitlist signup:", email)

    return NextResponse.json({ success: true, message: "Successfully joined waitlist" })
  } catch (error) {
    console.error("[v0] Waitlist API error:", error)
    return NextResponse.json(
      { error: "Failed to join waitlist" },
      { status: 500 }
    )
  }
}
