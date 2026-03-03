import { NextResponse } from "next/server"
import { verifyOpsPasswordFromHeader } from "@/lib/auth-helpers"
import { storage } from "@/lib/storage"

/**
 * POST /api/admin/flush-index-cache
 * Clears TokenIndex and related caches only
 * Protected by x-ops-password header
 * 
 * DOES NOT delete:
 * - Archive pool data
 * - Snapshot history
 * - firstSeen tracking
 * - Last-good fallback caches (kept for recovery)
 */
export async function POST(request: Request) {
  // Auth check
  if (!verifyOpsPasswordFromHeader(request)) {
    console.error("[v0] Flush index cache: Auth failed")
    return NextResponse.json(
      { 
        ok: false, 
        error: "Unauthorized",
        details: "Invalid or missing x-ops-password header"
      }, 
      { status: 401 }
    )
  }

  try {
    console.log("[v0] Admin flush index cache: Starting...")

    const keysToDelete = [
      "solrad:tokenIndex:v1",
      "solrad:tokenIndex:meta",
      "solrad:ingestionStatus",
      // Note: We keep solrad:last_good_index for recovery
      // Note: We keep archive/snapshot keys
    ]

    const cleared: string[] = []
    
    for (const key of keysToDelete) {
      try {
        await storage.del(key)
        cleared.push(key)
        console.log("[v0] Deleted cache key:", key)
      } catch (error) {
        console.warn(`[v0] Failed to delete ${key}:`, error)
      }
    }

    const ts = new Date().toISOString()

    console.log("[v0] Admin flush index cache: Complete", {
      cleared: cleared.length,
      keys: cleared,
    })

    return NextResponse.json({
      ok: true,
      cleared,
      ts,
    })
  } catch (error) {
    console.error("[v0] Failed to flush index cache:", error)
    return NextResponse.json(
      { 
        ok: false, 
        error: "Failed to flush cache",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

export const dynamic = "force-dynamic"
