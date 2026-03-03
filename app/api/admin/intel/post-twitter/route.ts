import { NextResponse } from "next/server"
import { verifyOpsPasswordFromHeader } from "@/lib/auth-helpers"
import { storage } from "@/lib/storage"

/**
 * POST /api/admin/intel/post-twitter
 * Body: { date: string }
 *
 * Reads daily package from KV, posts tweet thread via Twitter API v2,
 * updates package with twitterPosted: true.
 */

const PKG_KEY = (d: string) => `solrad:daily-package:${d}`
const PKG_LATEST = "solrad:daily-package:latest"

export async function POST(request: Request) {
  if (!verifyOpsPasswordFromHeader(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  // Check Twitter keys
  const apiKey = process.env.TWITTER_API_KEY
  const apiSecret = process.env.TWITTER_API_SECRET
  const accessToken = process.env.TWITTER_ACCESS_TOKEN
  const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET

  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    return NextResponse.json({
      success: false,
      error: "TWITTER_NOT_CONFIGURED",
      details: "Set TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET",
    })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const date = body.date || new Date().toISOString().split("T")[0]

    // Read package from KV
    const pkg = (await storage.get(PKG_KEY(date))) as Record<string, unknown> | null
    if (!pkg || !Array.isArray(pkg.tweets) || pkg.tweets.length === 0) {
      return NextResponse.json({
        success: false,
        error: "NO_PACKAGE",
        details: `No package found for ${date} or tweets array is empty`,
      })
    }

    const tweets = pkg.tweets as string[]
    console.log("[v0] Twitter post: Posting thread with", tweets.length, "tweets")

    // Dynamically import twitter-api-v2
    const { TwitterApi } = await import("twitter-api-v2")
    const client = new TwitterApi({
      appKey: apiKey,
      appSecret: apiSecret,
      accessToken,
      accessSecret: accessTokenSecret,
    })

    // Post tweet 1
    const first = await client.v2.tweet(tweets[0])
    const tweetIds: string[] = [first.data.id]
    let lastId = first.data.id

    // Post tweets 2-6 as replies to form a thread
    for (let i = 1; i < tweets.length; i++) {
      const reply = await client.v2.reply(tweets[i], lastId)
      tweetIds.push(reply.data.id)
      lastId = reply.data.id
    }

    // Update package in KV
    const updated = {
      ...pkg,
      twitterPosted: true,
      twitterPostedAt: Date.now(),
      twitterTweetIds: tweetIds,
      status: (pkg.telegramPosted ? "posted" : pkg.status),
    }
    await storage.set(PKG_KEY(date), updated, { ex: 60 * 60 * 48 })
    await storage.set(PKG_LATEST, updated, { ex: 60 * 60 * 48 })

    console.log("[v0] Twitter post: Thread posted successfully", tweetIds)

    return NextResponse.json({ success: true, tweetIds })
  } catch (error) {
    console.error("[v0] Twitter post failed:", error)
    return NextResponse.json({
      success: false,
      error: "TWITTER_POST_FAILED",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
export const maxDuration = 30
