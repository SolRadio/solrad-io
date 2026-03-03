/**
 * Lead-Time Debug Endpoint (Admin-Only)
 * 
 * Safe diagnostic endpoint that never throws 500 and always returns valid JSON.
 * 
 * Usage:
 * curl -H "x-solrad-admin: YOUR_KEY" https://www.solrad.io/api/lead-time/debug
 * 
 * Returns:
 * - ok: true (always when authorized)
 * - ts: ISO timestamp
 * - env: { nodeEnv, proMode, qaSeed }
 * - kvOk: boolean (true if KV connectivity test passed)
 * - kvError: string (error message if KV test failed)
 */

import { NextResponse } from "next/server"
import { storage } from "@/lib/storage"

export const runtime = "edge"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  // Authorization: require x-solrad-admin header
  const adminKey = req.headers.get("x-solrad-admin")
  const expectedKey = process.env.SOLRAD_ADMIN_KEY
  
  if (!adminKey || !expectedKey || adminKey !== expectedKey) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { 
        status: 401,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    )
  }

  // Build response - never throw
  const response: {
    ok: boolean
    ts: string
    env: {
      nodeEnv: string | null
      proMode: boolean
      qaSeed: boolean
    }
    kvOk: boolean
    kvError?: string
  } = {
    ok: true,
    ts: new Date().toISOString(),
    env: {
      nodeEnv: process.env.NODE_ENV || null,
      proMode: process.env.SOLRAD_PRO_MODE === "1",
      qaSeed: process.env.LEAD_TIME_QA_SEED === "1",
    },
    kvOk: false,
  }

  // Safe KV connectivity test
  try {
    await storage.get("solrad:leadtime:ping")
    response.kvOk = true
  } catch (error) {
    response.kvOk = false
    response.kvError = error instanceof Error ? error.message : String(error)
  }

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "no-store",
    },
  })
}
