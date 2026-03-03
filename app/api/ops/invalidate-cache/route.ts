import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

const CACHE_KEYS_TO_CLEAR = [
  "solrad:latest",
  "solrad:lastUpdated",
  "solrad:sourceMeta",
  "solrad:lock:ingestion",
  "solrad:lastIngestTime",
  "solrad:ingestionStatus",
  "solrad:source:dexscreener",
  "solrad:tokenIndex",
]

/**
 * POST /api/ops/invalidate-cache
 * Clears all token-related caches to force fresh ingestion
 * Requires admin password
 */
export async function POST(request: Request) {
  const adminPassword = process.env.ADMIN_PASSWORD || process.env.OPS_PASSWORD
  const providedPassword = request.headers.get("x-admin-password")

  if (!adminPassword || providedPassword !== adminPassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const deleted: string[] = []
  const notFound: string[] = []
  const errors: string[] = []

  // Clear main cache keys
  for (const key of CACHE_KEYS_TO_CLEAR) {
    try {
      const result = await kv.del(key)
      if (result) {
        deleted.push(key)
      } else {
        notFound.push(key)
      }
    } catch (error) {
      errors.push(`${key}: ${error instanceof Error ? error.message : "unknown error"}`)
    }
  }

  // Clear mint:* keys from fallback discovery
  try {
    const mintKeys = await kv.keys("mint:*")
    for (const key of mintKeys) {
      try {
        await kv.del(key)
        deleted.push(key)
      } catch {
        // Ignore individual mint key errors
      }
    }
  } catch (error) {
    errors.push(`mint:* scan: ${error instanceof Error ? error.message : "unknown error"}`)
  }

  return NextResponse.json({
    success: true,
    deleted: deleted.length,
    notFound: notFound.length,
    errors: errors.length > 0 ? errors : undefined,
    message: "Cache invalidated. Run ingestion to populate fresh data.",
    deletedKeys: deleted,
  })
}
