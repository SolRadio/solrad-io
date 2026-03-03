import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@vercel/kv"

const redis = createClient({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, topic, message } = body

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    if (!message || typeof message !== "string" || message.trim().length < 5) {
      return NextResponse.json({ error: "Message must be at least 5 characters" }, { status: 400 })
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    await redis.hset(`solrad:contact:${id}`, {
      email: email.toLowerCase(),
      topic: topic || "other",
      message: message.trim(),
      createdAt: Date.now(),
    })

    // Add to contact messages list for easy retrieval
    await redis.lpush("solrad:contact:messages", id)

    return NextResponse.json({ success: true, message: "Message sent successfully" })
  } catch (error) {
    console.error("[contact] API error:", error)
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    )
  }
}
