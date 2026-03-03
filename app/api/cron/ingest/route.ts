import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

/**
 * GET /api/cron/ingest
 * PART C: Cron-triggered ingestion endpoint
 * Protected by CRON_SECRET header
 * 
 * Supports both Helius and QuickNode mint discovery:
 * - If QUICKNODE_MINT_DISCOVERY_ENABLED=true, uses QuickNode
 * - Otherwise falls back to Helius (if HELIUS_MINT_DISCOVERY_ENABLED=true)
 * - Both are disabled by default to prevent accidental API usage
 * 
 * Env vars required:
 * - CRON_SECRET: Secret header value for cron auth
 * - QUICKNODE_SOLANA_RPC_URL + QUICKNODE_MINT_DISCOVERY_ENABLED: For QuickNode
 * - HELIUS_API_KEY + HELIUS_MINT_DISCOVERY_ENABLED: For Helius (fallback)
 */
export async function GET(request: Request) {
  console.log("[CRON-INGEST] Handler triggered at", new Date().toISOString())
  try {
    // Auth: Vercel crons send x-vercel-cron header, fallback to CRON_SECRET
    const isVercelCron = request.headers.get("x-vercel-cron") === "1"
    const cronSecret = process.env.CRON_SECRET ?? process.env.SOLRAD_CRON_SECRET
    const authHeader = request.headers.get("authorization")
    const isAuthorized = isVercelCron ||
      (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
      process.env.NODE_ENV === "development"

    if (!isAuthorized) {
      console.error("[CRON-INGEST] Unauthorized request")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    console.log("[CRON-INGEST] Auth passed, starting ingestion")
    const startTime = Date.now()
    
    // Discovery Lane 1: DexScreener trending tokens (free, no credits)
    let dexDiscoveryEnrichment = null
    try {
      const { fetchDexLatestPairs } = await import("@/lib/ingest/sources")
      const { enrichNewMints } = await import("@/lib/ingest/enrichNewMints")
      const dexTokens = await fetchDexLatestPairs()
      if (dexTokens.length > 0) {
        const existing = (await kv.get<string[]>("solrad:auto-tracked-mints")) ?? []
        const existingSet = new Set(existing.map((m) => m.toLowerCase()))
        const trulyNew = dexTokens.filter((t) => !existingSet.has(t.mint.toLowerCase()))
        console.log(`[CRON-INGEST] DexScreener: ${dexTokens.length} fetched, ${trulyNew.length} new`)
        if (trulyNew.length > 0) {
          dexDiscoveryEnrichment = await enrichNewMints(trulyNew.map((t) => t.mint))

          // Only add to tracked list if enrichment actually scored some tokens
          if (dexDiscoveryEnrichment && dexDiscoveryEnrichment.enriched > 0) {
            const merged = [...existing, ...trulyNew.map((t) => t.mint)].slice(0, 1000)
            await kv.set("solrad:auto-tracked-mints", merged, { ex: 86400 })
          }
        }
      }
    } catch (dexErr) {
      console.warn("[CRON-INGEST] DexScreener discovery failed (non-fatal):", dexErr)
    }

    // Discovery Lane 2: QuickNode RPC — new Pump.fun launches (uses credits)
    let rpcDiscoveryCount = 0
    try {
      const { getNewMintsFromRPC, prefetchHolderDataBatch } = await import("@/lib/quicknode")
      const { enrichNewMints: enrichRpc } = await import("@/lib/ingest/enrichNewMints")
      const rpcMints = await getNewMintsFromRPC(10)
      if (rpcMints.length > 0) {
        const existing = (await kv.get<string[]>("solrad:auto-tracked-mints")) ?? []
        const existingSet = new Set(existing.map((m) => m.toLowerCase()))
        const trulyNew = rpcMints.filter((m) => !existingSet.has(m.toLowerCase()))
        if (trulyNew.length > 0) {
          const rpcEnrichment = await enrichRpc(trulyNew)
          if (rpcEnrichment && rpcEnrichment.enriched > 0) {
            const existing2 = (await kv.get<string[]>("solrad:auto-tracked-mints")) ?? []
            const merged = [...existing2, ...trulyNew].slice(0, 1000)
            await kv.set("solrad:auto-tracked-mints", merged, { ex: 86400 })
            rpcDiscoveryCount = trulyNew.length
            // Pre-warm holder data cache for new mints (non-blocking)
            prefetchHolderDataBatch(trulyNew).catch(() => {})
          }
        }
      }
    } catch (rpcErr) {
      console.warn("[CRON-INGEST] RPC discovery failed (non-fatal):", rpcErr)
    }
    
    // Determine which mint discovery endpoint to use
    const useQuickNode = process.env.QUICKNODE_MINT_DISCOVERY_ENABLED === 'true'
    const useHelius = process.env.HELIUS_MINT_DISCOVERY_ENABLED === 'true'
    
    let endpoint = ""
    let provider = ""
    
    if (useQuickNode) {
      endpoint = "/api/ingest/new-mints-qn"
      provider = "QuickNode"
    } else if (useHelius) {
      endpoint = "/api/ingest/new-mints"
      provider = "Helius"
    } else {
      // No external mint discovery — skip to snapshot of existing tracked tokens
      console.log("[CRON-INGEST] No mint discovery enabled — running snapshot of existing tracked tokens only")
      const duration = Date.now() - startTime
      await Promise.all([
        kv.set("solrad:last-ingest-time", Date.now()),
        kv.set("solrad:last-ingest-token-count", 0),
        kv.set("solrad:last-ingest-errors", []),
        kv.set("solrad:last-ingest-duration-ms", duration),
      ])
      console.log("[CRON-INGEST] Completed at", new Date().toISOString())
      return NextResponse.json({
        ok: true,
        disabled: true,
        message: "No mint discovery enabled — existing tokens tracked via snapshot cron",
        dexEnrichment: dexDiscoveryEnrichment,
        rpcDiscovered: rpcDiscoveryCount,
        durationMs: duration,
      })
    }
    
    console.log(`[v0] CRON ingest: Using ${provider} endpoint`)
    
    // Conservative parameters for QuickNode to minimize credit usage
    const limit = useQuickNode ? 40 : 50
    const minutesBack = useQuickNode ? 30 : 60
    
    // Call the selected ingestion endpoint
    let ingestData: any
    let ingestOk = false
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
        || process.env.NEXT_PUBLIC_SITE_URL
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
        || request.url.split("/api/")[0]
      const ingestUrl = baseUrl + endpoint + "?limit=" + limit + "&minutesBack=" + minutesBack
      console.log("[CRON-INGEST] Calling internal endpoint:", endpoint)
      const adminPw = process.env.ADMIN_PASSWORD || process.env.OPS_PASSWORD || ""
      const ingestRes = await fetch(ingestUrl, {
          method: "POST",
          headers: {
            authorization: `Bearer ${cronSecret ?? ""}`,
            "x-admin-password": adminPw,
            "x-vercel-cron": "1",
          },
        }
      )
      
      const rawText = await ingestRes.text()
      if (!rawText || rawText.trim().startsWith('<')) {
        console.error('[CRON-INGEST] Endpoint returned HTML — wrong URL or endpoint down')
        ingestData = { ok: false, error: 'HTML response from ingest endpoint' }
        ingestOk = false
      } else {
        ingestData = JSON.parse(rawText)
        ingestOk = ingestRes.ok && ingestData.ok !== false
      }
      
      if (!ingestOk) {
        // Log warning but DON'T abort - we'll continue with whatever data we have
        console.warn(`[v0] CRON ingest: ${provider} mint discovery failed or returned ok:false`, {
          error: ingestData.error,
          disabled: ingestData.disabled,
          message: ingestData.message,
        })
      }
    } catch (error) {
      console.error(`[v0] CRON ingest: ${provider} fetch error`, error)
      ingestData = { ok: false, error: error instanceof Error ? error.message : "Fetch failed" }
    }
    
    if (!ingestOk) {
      // Store error -- do NOT set last-ingest-time on failure
      await kv.set("ingest:lastError", ingestData?.error || "Mint discovery failed", { ex: 60 * 60 * 24 })
      console.error("[CRON-INGEST] Mint discovery failed:", ingestData?.error)
      
      return NextResponse.json({
        ok: false,
        mintDiscoveryFailed: true,
        provider,
        error: ingestData?.error,
        message: "Cron ran but mint discovery failed",
      })
    }
    
    // PART C: Safe logs with counts
    const duration = Date.now() - startTime
    const processedCount = ingestData.resolved || 0
    console.log("[CRON-INGEST] Completed. Tokens processed:", processedCount, {
      provider,
      discovered: ingestData.discovered || 0,
      resolved: processedCount,
      unresolved: (ingestData.discovered || 0) - processedCount,
      rateLimited: ingestData.rateLimited || false,
      rpcDiscovered: rpcDiscoveryCount,
      durationMs: duration,
    })
    
    if (!ingestData) {
      console.error("[CRON-INGEST] ingestData is null")
      await kv.set("solrad:last-ingest-time", Date.now())
      await kv.set("solrad:last-ingest-errors", ["ingestData was null"])
      return NextResponse.json({ ok: false, error: "ingestData null" }, { status: 500 })
    }

    // KV diagnostics + timestamp (ONLY on success)
    await Promise.all([
      kv.set("solrad:last-ingest-time", Date.now()),
      kv.set("ingest:lastRunTime", Date.now(), { ex: 60 * 60 * 24 * 30 }),
      kv.set("solrad:last-ingest-token-count", processedCount),
      kv.set("solrad:last-ingest-errors", ingestData.errors ?? []),
      kv.set("solrad:last-ingest-duration-ms", duration),
    ])
    
    console.log("[CRON-INGEST] Completed at", new Date().toISOString())
    
    return NextResponse.json({
      ok: true,
      provider,
      discovered: ingestData.discovered,
      resolved: processedCount,
      rateLimited: ingestData.rateLimited,
      dexEnrichment: dexDiscoveryEnrichment,
      rpcDiscovered: rpcDiscoveryCount,
      durationMs: duration,
    })
  } catch (error) {
    console.error("[CRON-INGEST] Fatal error:", (error as Error).message, (error as Error).stack)
    
    // Stamp timestamp even on failure so we know the handler ran
    await kv.set("solrad:last-ingest-time", Date.now())
    await kv.set("solrad:last-ingest-errors", [(error as Error).message])
    await kv.set(
      "ingest:lastError",
      error instanceof Error ? error.message : "Unknown error",
      { ex: 60 * 60 * 24 }
    )
    
    return NextResponse.json(
      { ok: false, error: "Ingestion failed", message: (error as Error).message },
      { status: 500 }
    )
  }
}

export const dynamic = "force-dynamic"
export const maxDuration = 300 // 5 minutes
