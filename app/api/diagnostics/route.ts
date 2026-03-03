import { type NextRequest, NextResponse } from "next/server"
import { verifyOpsPasswordFromHeader } from "@/lib/auth-helpers"
import { storage, CACHE_KEYS } from "@/lib/storage"

/**
 * GET /api/diagnostics
 * 
 * Protected diagnostics endpoint - requires OPS_PASSWORD via x-ops-password header
 * Returns detailed system information for debugging
 * 
 * Security: Same admin password flow as /admin pages
 */
export async function GET(request: NextRequest) {
  // Verify OPS password
  if (!verifyOpsPasswordFromHeader(request)) {
    console.warn("[v0] /api/diagnostics: Unauthorized attempt")
    return NextResponse.json(
      { error: "Access denied" },
      { status: 401 }
    )
  }

  try {
    // Gather diagnostics data
    const diagnostics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      
      // Environment checks (no secrets exposed)
      env: {
        nodeEnv: process.env.NODE_ENV,
        heliusConfigured: !!process.env.HELIUS_API_KEY,
        openaiConfigured: !!process.env.OPENAI_API_KEY,
        opsPasswordConfigured: !!process.env.OPS_PASSWORD,
        internalSecretConfigured: !!process.env.SOLRAD_INTERNAL_SECRET,
        storageConfigured: !!(
          (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
          (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
        ),
      },
      
      // Storage diagnostics
      storage: {
        type: detectStorageBackend(),
        pingOk: false,
        lastIngestAt: null as string | null,
      },
      
      // Memory usage
      memory: process.memoryUsage(),
    }

    // Test storage ping
    try {
      const pingKey = "diagnostics:ping"
      const pingValue = { t: Date.now() }
      await storage.set(pingKey, pingValue, { ex: 60 })
      const retrieved = await storage.get(pingKey)
      diagnostics.storage.pingOk = retrieved !== null && typeof retrieved === "object" && "t" in retrieved
    } catch (error) {
      console.error("[v0] Storage ping failed:", error)
    }

    // Get last ingest time
    try {
      const lastIngest = await storage.get(CACHE_KEYS.LAST_INGEST_TIME)
      if (typeof lastIngest === "number") {
        diagnostics.storage.lastIngestAt = new Date(lastIngest).toISOString()
      } else if (typeof lastIngest === "string") {
        diagnostics.storage.lastIngestAt = lastIngest
      }
    } catch (error) {
      console.error("[v0] Failed to read last ingest time:", error)
    }

    return NextResponse.json(diagnostics)
  } catch (error) {
    console.error("[v0] /api/diagnostics error:", error)
    // Safe error response - no stack traces
    return NextResponse.json(
      { error: "Diagnostics failed. Please try again." },
      { status: 500 }
    )
  }
}

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

// Only allow GET
export async function POST() {
  return NextResponse.json(
    { error: "Method not allowed. Use GET." },
    { status: 405 }
  )
}
