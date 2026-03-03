export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { verifyOpsPasswordFromHeader } from "@/lib/auth-helpers"
import { internalJobHeaders } from "@/lib/internal-auth"

interface SubcallResult {
  id: string
  url: string
  status: number
  ok: boolean
  durationMs: number
  internalAuthHeader: string | null
  bodyPreview: string
  error: string | null
}

async function runSubcall(id: string, url: string, headers: Record<string, string>): Promise<SubcallResult> {
  const t0 = Date.now()
  try {
    const res = await fetch(url, { headers, cache: "no-store" })
    const durationMs = Date.now() - t0
    let bodyPreview = ""
    try {
      const text = await res.text()
      bodyPreview = text.slice(0, 800)
    } catch {
      bodyPreview = "(failed to read body)"
    }

    return {
      id,
      url,
      status: res.status,
      ok: res.ok,
      durationMs,
      internalAuthHeader: res.headers.get("x-internal-auth"),
      bodyPreview,
      error: null,
    }
  } catch (err) {
    return {
      id,
      url,
      status: 0,
      ok: false,
      durationMs: Date.now() - t0,
      internalAuthHeader: null,
      bodyPreview: "",
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export async function GET(request: Request) {
  if (!verifyOpsPasswordFromHeader(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const origin = new URL(request.url).origin
  const headers = internalJobHeaders({
    "x-ops-password": process.env.OPS_PASSWORD || "",
  })

  const t0 = Date.now()

  // Run all four subcalls in parallel
  const [authCheck, signalOutcomes, proofDiag, harvestPreflight] = await Promise.all([
    runSubcall("internal-auth-check", `${origin}/api/admin/internal-auth-check?debug=1`, headers),
    runSubcall("signal-outcomes", `${origin}/api/signal-outcomes?debug=1&limit=1`, headers),
    runSubcall("proof-engine-diag", `${origin}/api/admin/proof-engine-diag?debug=1`, headers),
    // GET on harvest is a safe preflight (validates auth + returns diagnostic, does not run harvest)
    runSubcall("harvest-preflight", `${origin}/api/admin/alpha-ledger/harvest?debug=1`, headers),
  ])

  const results = [authCheck, signalOutcomes, proofDiag, harvestPreflight]
  const allOk = results.every((r) => r.ok)

  return NextResponse.json(
    {
      ok: allOk,
      nowISO: new Date().toISOString(),
      totalDurationMs: Date.now() - t0,
      envPresence: {
        INTERNAL_JOB_TOKEN: !!process.env.INTERNAL_JOB_TOKEN,
        OPS_PASSWORD: !!process.env.OPS_PASSWORD,
        VERCEL_URL: process.env.VERCEL_URL ?? null,
        VERCEL_ENV: process.env.VERCEL_ENV ?? null,
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? null,
      },
      results,
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  )
}
