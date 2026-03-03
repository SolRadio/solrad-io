export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { requireInternalJobOrOps } from "@/lib/internal-auth"

/**
 * Debug endpoint: verify internal auth is configured and working.
 *
 * curl examples:
 *   curl -H "x-internal-job-token: $INTERNAL_JOB_TOKEN" https://www.solrad.io/api/admin/internal-auth-check
 *   curl -H "x-ops-password: $OPS_PASSWORD" https://www.solrad.io/api/admin/internal-auth-check
 */
export async function GET(request: Request) {
  const auth = requireInternalJobOrOps(request)

  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status })
  }

  const origin = new URL(request.url).origin

  return NextResponse.json({
    ok: true,
    mode: auth.mode,
    internalJob: auth.mode === "internal",
    hasTokenEnv: !!process.env.INTERNAL_JOB_TOKEN,
    hasOpsEnv: !!process.env.OPS_PASSWORD,
    origin,
    vercelUrl: process.env.VERCEL_URL ?? null,
    vercelEnv: process.env.VERCEL_ENV ?? null,
  })
}
