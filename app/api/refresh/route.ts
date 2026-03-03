import { type NextRequest, NextResponse } from "next/server"
import { ingestTokenData } from "@/lib/ingestion"
import { storage } from "@/lib/storage"
import { verifyInternalSecret, getClientIP, checkIPRateLimit } from "@/lib/auth-helpers"
import { kv } from "@vercel/kv"

const REFRESH_LOCK_KEY = "refresh:lock"
const REFRESH_COOLDOWN_SECONDS = 60
const IP_RATE_LIMIT_SECONDS = 60

/**
 * POST /api/refresh
 * 
 * Server-side ingestion trigger with internal auth and dual rate limiting:
 * 1. Global cooldown (60s) - prevents any refresh for 60s
 * 2. Per-IP rate limit (60s) - prevents same IP from spamming
 * 
 * Requires x-solrad-internal header matching SOLRAD_INTERNAL_SECRET env var.
 * Client never sees secrets - handled via Server Action.
 */
export async function POST(request: NextRequest) {
  // Internal auth check - use helper to keep secrets server-side
  if (!verifyInternalSecret(request)) {
    console.warn("[v0] /api/refresh: Unauthorized attempt")
    return NextResponse.json(
      { success: false, error: "Access denied" },
      { status: 401 }
    )
  }
  
  // Per-IP rate limit check
  const clientIP = getClientIP(request)
  const isIPRateLimited = await checkIPRateLimit(
    clientIP,
    "refresh:ip",
    IP_RATE_LIMIT_SECONDS
  )
  
  if (isIPRateLimited) {
    console.log(`[v0] /api/refresh: IP rate limit hit for ${clientIP}`)
    return NextResponse.json(
      { success: false, error: "Too many requests. Please wait 60 seconds." },
      { status: 429 }
    )
  }
  
  // Global rate limit check: Check if lock exists
  try {
    const lockExists = await storage.get(REFRESH_LOCK_KEY)
    
    if (lockExists) {
      console.log("[v0] /api/refresh: Global rate limit hit - refresh in cooldown")
      return NextResponse.json(
        { success: false, error: "Refresh cooldown - please wait 60 seconds" },
        { status: 429 }
      )
    }
    
    // Set global lock with 60 second TTL
    await storage.set(REFRESH_LOCK_KEY, Date.now(), { ex: REFRESH_COOLDOWN_SECONDS })
  } catch (error) {
    console.error("[v0] /api/refresh: Error checking/setting rate limit lock:", error)
    // Continue anyway - don't block on storage errors
  }
  
  console.log("[v0] /api/refresh: Starting manual ingestion...")
  
  // STEP 1: Try QuickNode mint discovery BEFORE normal ingestion (if enabled)
  let quicknodeAttempted = false
  let quicknodeOk = false
  
  const quicknodeEnabled = process.env.QUICKNODE_MINT_DISCOVERY_ENABLED === 'true'
  
  if (quicknodeEnabled) {
    quicknodeAttempted = true
    console.log("[v0] /api/refresh: Calling QuickNode mint discovery...")
    
    try {
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://solrad.io"
      
      // Get internal secret for auth
      const internalSecret = process.env.SOLRAD_INTERNAL_SECRET
      
      const qnResponse = await fetch(
        `${baseUrl}/api/ingest/new-mints-qn?limit=40&minutesBack=30`,
        {
          method: 'POST',
          headers: {
            'x-solrad-internal': internalSecret || '',
          },
        }
      )
      
      const qnData = await qnResponse.json()
      quicknodeOk = qnResponse.ok && qnData.ok !== false
      
      if (quicknodeOk) {
        console.log("[v0] /api/refresh: QuickNode mint discovery succeeded", {
          signaturesFetched: qnData.signaturesFetched,
          transactionsFetched: qnData.transactionsFetched,
          mintsDiscovered: qnData.discovered,
          new: qnData.new,
        })
      } else {
        console.warn("[v0] /api/refresh: QuickNode mint discovery failed, continuing anyway", {
          error: qnData.error,
          disabled: qnData.disabled,
        })
      }
    } catch (qnError) {
      console.error("[v0] /api/refresh: QuickNode fetch error, continuing anyway", qnError)
      quicknodeOk = false
    }
  } else {
    console.log("[v0] /api/refresh: QuickNode mint discovery disabled, skipping")
  }
  
  try {
    // STEP 2: Call normal ingestion with force=true to bypass rate limits
    const result = await ingestTokenData(true)
    
    // Read QuickNode receipt after attempt to include in response
    let quicknodeReceipt = null
    if (quicknodeAttempted) {
      try {
        quicknodeReceipt = await kv.get("solrad:quicknode:lastRun")
      } catch {
        // Ignore KV read errors
      }
    }
    
    if (result.success) {
      console.log("[v0] /api/refresh: Ingestion completed successfully")
      return NextResponse.json({
        success: true,
        tokensProcessed: result.tokensProcessed,
        duration: result.duration,
        message: "Ingestion completed successfully",
        quicknode: {
          attempted: quicknodeAttempted,
          ok: quicknodeOk,
          receipt: quicknodeReceipt,
        }
      })
    } else {
      console.error("[v0] /api/refresh: Ingestion failed:", result.error)
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || "Ingestion failed",
          tokensProcessed: result.tokensProcessed,
          duration: result.duration,
          quicknode: {
            attempted: quicknodeAttempted,
            ok: quicknodeOk,
            receipt: quicknodeReceipt,
          }
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("[v0] /api/refresh: Exception during ingestion:", error)
    // Safe error response - no stack traces to client
    return NextResponse.json(
      { 
        success: false, 
        error: "Ingestion failed. Please try again later." 
      },
      { status: 500 }
    )
  }
}

// Only allow POST
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST." },
    { status: 405 }
  )
}
