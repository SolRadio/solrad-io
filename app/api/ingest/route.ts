import { type NextRequest, NextResponse } from "next/server"
import { ingestTokenData } from "@/lib/ingestion"
import { storage, CACHE_KEYS, CACHE_TTL } from "@/lib/storage"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const opsPassword = process.env.OPS_PASSWORD
    const opsToken = request.headers.get("x-ops-token")

    const isBypass = (opsPassword && authHeader === `Bearer ${opsPassword}`) || (opsToken && opsToken === opsPassword)

    if (!isBypass) {
      const lastIngestTime = await storage.get(CACHE_KEYS.LAST_INGEST_TIME)
      if (lastIngestTime) {
        const timeSinceLastIngest = Date.now() - (lastIngestTime as number)
        const rateLimitMs = CACHE_TTL.RATE_LIMIT * 1000

        if (timeSinceLastIngest < rateLimitMs) {
          const retryAfterSeconds = Math.ceil((rateLimitMs - timeSinceLastIngest) / 1000)

          return NextResponse.json(
            {
              success: false,
              message: `Rate limit exceeded. Please wait ${retryAfterSeconds} seconds before refreshing again.`,
              retryAfterSeconds,
            },
            { status: 429 },
          )
        }
      }
    }

    const result = await ingestTokenData(isBypass)

    if (!result.success && result.error?.includes("Rate limited")) {
      const match = result.error.match(/Retry after (\d+) seconds/)
      const retryAfterSeconds = match ? Number.parseInt(match[1]) : CACHE_TTL.RATE_LIMIT

      return NextResponse.json(
        {
          success: false,
          message: result.error,
          retryAfterSeconds,
        },
        { status: 429 },
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Ingest API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST to trigger ingestion",
  })
}
