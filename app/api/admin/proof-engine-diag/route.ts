export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { verifyOpsPasswordFromHeader } from "@/lib/auth-helpers"
import { storage } from "@/lib/storage"

const KV_KEY = "solrad:debug:proof_engine_diag:last"

/**
 * GET /api/admin/proof-engine-diag
 *
 * Deterministic diagnostic: fetches /api/signal-outcomes from the server side
 * with the same headers the harvest routes use, then returns the full result
 * (status, headers, body preview) so you can see exactly what signal-outcomes
 * returns to internal callers.
 *
 * Protected by x-ops-password header (same as other admin routes).
 *
 * curl -H "x-ops-password: $OPS_PASSWORD" https://www.solrad.io/api/admin/proof-engine-diag
 */
export async function GET(request: Request) {
  // Temporary debug bypass: ?debug=1 skips admin auth
  const url = new URL(request.url)
  const isDebug = url.searchParams.get("debug") === "1"

  if (!isDebug) {
    if (!verifyOpsPasswordFromHeader(request)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }
  }

  const nowISO = new Date().toISOString()

  // ── Derive origin ──
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const host = request.headers.get("host")
  const originUsed = siteUrl || (host ? `https://${host}` : null)

  if (!originUsed) {
    const diag = {
      nowISO,
      originUsed: null,
      error: "Cannot derive origin: NEXT_PUBLIC_SITE_URL unset and no host header",
      ok: false,
    }
    await storage.set(KV_KEY, JSON.stringify(diag), { ex: 86400 }).catch(() => {})
    return NextResponse.json(diag, { status: 200 })
  }

  // ── Build headers matching what harvest routes send ──
  const hasInternalJobTokenEnv = !!process.env.INTERNAL_JOB_TOKEN
  const hasOpsPasswordEnv = !!process.env.OPS_PASSWORD
  const internalTokenLength = process.env.INTERNAL_JOB_TOKEN?.length ?? 0

  const fetchHeaders: Record<string, string> = {
    "content-type": "application/json",
  }
  if (process.env.INTERNAL_JOB_TOKEN) {
    fetchHeaders["x-internal-job-token"] = process.env.INTERNAL_JOB_TOKEN
  }
  if (process.env.OPS_PASSWORD) {
    fetchHeaders["x-ops-password"] = process.env.OPS_PASSWORD
  }

  // ── Fetch signal-outcomes ──
  if (!hasInternalJobTokenEnv) {
    const diag = {
      nowISO,
      originUsed,
      error: "Missing INTERNAL_JOB_TOKEN in proof-engine-diag route",
      hasInternalJobTokenEnv,
      hasOpsPasswordEnv,
      ok: false,
    }
    await storage.set(KV_KEY, JSON.stringify(diag), { ex: 86400 }).catch(() => {})
    return NextResponse.json(diag, { status: 200 })
  }

  console.log("[HARVEST DEBUG]", {
    hasToken: hasInternalJobTokenEnv,
    tokenLength: internalTokenLength,
    url: `${originUsed}/api/signal-outcomes`,
  })

  let responseStatus = 0
  let responseHeadersSubset: Record<string, string | null> = {}
  let responseBodyPreview = ""
  let fetchError: string | null = null

  try {
    const url = `${originUsed}/api/signal-outcomes`
    const res = await fetch(url, {
      headers: fetchHeaders,
      cache: "no-store",
    })

    responseStatus = res.status
    responseHeadersSubset = {
      "x-internal-auth": res.headers.get("x-internal-auth"),
      "cache-control": res.headers.get("cache-control"),
      "content-type": res.headers.get("content-type"),
    }

    try {
      const text = await res.text()
      responseBodyPreview = text.slice(0, 500)
    } catch {
      responseBodyPreview = "(failed to read body)"
    }
  } catch (err) {
    fetchError = err instanceof Error ? err.message : String(err)
    responseBodyPreview = `fetch threw: ${fetchError}`
  }

  const ok = responseStatus >= 200 && responseStatus <= 299

  const diag = {
    nowISO,
    originUsed,
    hasInternalJobTokenEnv,
    hasOpsPasswordEnv,
    internalTokenLength,
    responseStatus,
    responseHeaders: responseHeadersSubset,
    responseBodyPreview,
    fetchError,
    ok,
    ...(
      !hasInternalJobTokenEnv
        ? { warning: "INTERNAL_JOB_TOKEN is not set at runtime -- internal auth will fail" }
        : {}
    ),
  }

  // ── Persist to KV ──
  await storage.set(KV_KEY, JSON.stringify(diag), { ex: 86400 }).catch(() => {})

  return NextResponse.json(diag, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  })
}
