import { NextResponse } from "next/server"
import { getBlobState, upsertArchiveTokens } from "@/lib/blob-storage"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/tokens/archive
 * Returns persistent token archive with filters and pagination
 * Auto-seeds from cached tokens if archive is empty
 * 
 * Query params:
 *  - minScore: default 50
 *  - sort: lastSeen | maxScore | lastScore (default: lastSeen)
 *  - page: default 1
 *  - pageSize: default 50, max 200
 *  - q: optional search query
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const minScore = parseInt(url.searchParams.get("minScore") || "50")
    const sortBy = (url.searchParams.get("sort") || "lastSeen") as "lastSeen" | "maxScore" | "lastScore"
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"))
    const pageSize = Math.min(200, Math.max(1, parseInt(url.searchParams.get("pageSize") || "50")))
    const searchQuery = url.searchParams.get("q")?.toLowerCase()

    let state = await getBlobState()
    
    // AUTO-SEED: If archive is empty, seed from cached tokens
    const archiveSize = Object.keys(state.archiveByMint || {}).length
    if (archiveSize === 0) {
      console.log("[v0] Archive empty, attempting auto-seed from cache...")
      try {
        const { getCachedTokens } = await import("@/lib/ingestion")
        const cachedData = await getCachedTokens()
        
        if (cachedData && cachedData.tokens.length > 0) {
          console.log(`[v0] Seeding archive with ${cachedData.tokens.length} cached tokens`)
          await upsertArchiveTokens(cachedData.tokens, 50)
          // Reload state after seeding
          state = await getBlobState()
          console.log(`[v0] Archive seeded: ${Object.keys(state.archiveByMint || {}).length} tokens`)
        } else {
          console.log("[v0] No cached tokens available for seeding")
        }
      } catch (seedError) {
        console.warn("[v0] Archive auto-seed failed:", seedError)
      }
    }
    
    let tokens = Object.values(state.archiveByMint || {})

    // Filter by minScore
    tokens = tokens.filter(t => t.maxScore >= minScore)

    // Search filter
    if (searchQuery) {
      tokens = tokens.filter(t =>
        t.symbol.toLowerCase().includes(searchQuery) ||
        t.name.toLowerCase().includes(searchQuery) ||
        t.address.toLowerCase().includes(searchQuery)
      )
    }

    // Sort
    if (sortBy === "lastSeen") {
      tokens.sort((a, b) => b.lastSeenAt - a.lastSeenAt)
    } else if (sortBy === "maxScore") {
      tokens.sort((a, b) => b.maxScore - a.maxScore)
    } else if (sortBy === "lastScore") {
      tokens.sort((a, b) => b.lastScore - a.lastScore)
    }

    // Pagination
    const total = tokens.length
    const start = (page - 1) * pageSize
    const paginatedTokens = tokens.slice(start, start + pageSize)

    const response = NextResponse.json({
      tokens: paginatedTokens,
      total,
      page,
      pageSize,
      updatedAt: state.meta?.updatedAt || new Date().toISOString(),
    })

    // Cache for 5 minutes
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600"
    )

    return response
  } catch (error) {
    console.error("[v0] Archive API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch archive", tokens: [], total: 0, page: 1, pageSize: 50 },
      { status: 500 }
    )
  }
}
