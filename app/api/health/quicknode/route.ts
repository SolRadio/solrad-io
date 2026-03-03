import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/health/quicknode
 * Health check endpoint for QuickNode RPC connection
 * 
 * - If QUICKNODE_MINT_DISCOVERY_ENABLED !== 'true', returns disabled status
 * - If enabled, attempts a cheap RPC call (getLatestBlockhash) to verify connection
 * - Returns connection status and logs verification attempt
 * 
 * This endpoint is intentionally cheap - uses only 1 compute unit
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  const internalToken = request.headers.get("x-internal-job-token")
  const expectedInternal = process.env.INTERNAL_JOB_TOKEN
  const isAuthed = (authHeader && cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (internalToken && expectedInternal && internalToken === expectedInternal)
  if (!isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const discoveryEnabled = process.env.QUICKNODE_MINT_DISCOVERY_ENABLED === 'true'
  const rpcUrl = process.env.QUICKNODE_SOLANA_RPC_URL
  
  console.log("[v0] QuickNode Health Check:", {
    discoveryEnabled,
    rpcUrlPresent: !!rpcUrl,
  })
  
  if (!discoveryEnabled) {
    return NextResponse.json({
      ok: false,
      disabled: true,
      message: "QuickNode mint discovery is disabled. Set QUICKNODE_MINT_DISCOVERY_ENABLED=true to enable.",
    })
  }
  
  if (!rpcUrl) {
    return NextResponse.json({
      ok: false,
      error: "QUICKNODE_SOLANA_RPC_URL not configured",
      message: "QuickNode RPC URL is missing. Please set QUICKNODE_SOLANA_RPC_URL environment variable.",
    })
  }
  
  try {
    // Attempt a very cheap RPC call (getLatestBlockhash uses only 1 compute unit)
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getLatestBlockhash",
        params: []
      })
    })
    
    if (!response.ok) {
      console.error("[v0] QuickNode Health Check: RPC fetch failed", response.status)
      return NextResponse.json({
        ok: false,
        error: "RPC fetch failed",
        status: response.status,
      })
    }
    
    const data = await response.json()
    
    if (data.error) {
      console.error("[v0] QuickNode Health Check: RPC error", data.error)
      return NextResponse.json({
        ok: false,
        error: "RPC returned error",
        details: data.error,
      })
    }
    
    console.log("[v0] QuickNode Health Check: SUCCESS - RPC connection verified")
    
    return NextResponse.json({
      ok: true,
      provider: "QuickNode",
      message: "QuickNode RPC connection verified successfully",
      blockhash: data.result?.blockhash?.slice(0, 8) + "...", // Return partial blockhash as proof
    })
  } catch (error) {
    console.error("[v0] QuickNode Health Check: Exception", error)
    return NextResponse.json({
      ok: false,
      error: "Health check failed",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
