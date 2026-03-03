import { NextResponse } from "next/server"
import { storage, CACHE_KEYS } from "@/lib/storage"

const startTime = Date.now()

/**
 * Detect active storage backend using same env checks as lib/storage.ts
 */
function detectStorageBackend(): "vercel-kv" | "upstash-rest" | "memory" {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return "vercel-kv"
  }
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return "upstash-rest"
  }
  return "memory"
}

export async function GET() {
  const heliusConfigured = !!process.env.HELIUS_API_KEY
  const openaiConfigured = !!process.env.OPENAI_API_KEY
  const storageType = detectStorageBackend()
  const uptimeMs = Date.now() - startTime

  // Storage ping test: attempt set/get without throwing
  let storagePingOk = false
  try {
    const pingKey = "health:ping"
    const pingValue = { t: Date.now() }
    await storage.set(pingKey, pingValue, { ex: 60 })
    const retrieved = await storage.get(pingKey)
    storagePingOk = retrieved !== null && typeof retrieved === "object" && "t" in retrieved
  } catch {
    storagePingOk = false
  }

  // Read last ingest time if available
  let lastIngestAt: string | null = null
  try {
    const lastIngest = await storage.get(CACHE_KEYS.LAST_INGEST_TIME)
    if (typeof lastIngest === "number") {
      lastIngestAt = new Date(lastIngest).toISOString()
    } else if (typeof lastIngest === "string") {
      lastIngestAt = lastIngest
    }
  } catch {
    // Ignore errors reading lastIngestAt
  }

  const response = NextResponse.json({
    status: "healthy",
    heliusConfigured,
    openaiConfigured,
    storageType,
    storagePingOk,
    lastIngestAt,
    uptimeMs,
  })
  
  // Cache health checks for 30s to reduce server load while keeping monitoring responsive
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=30, stale-while-revalidate=60"
  )
  
  return response
}
