/**
 * Internal service-to-service authentication helper.
 * Used by cron/admin harvest routes to call protected APIs
 * without browser cookies or sessions.
 *
 * Env var: INTERNAL_JOB_TOKEN
 * Header:  x-internal-job-token
 *
 * Usage (caller side):
 *   fetch(url, { headers: internalJobHeaders() })
 *
 * Usage (receiver side):
 *   const auth = requireInternalJobOrOps(req)
 *   if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status })
 *
 * curl examples:
 *   curl -H "x-internal-job-token: $INTERNAL_JOB_TOKEN" https://www.solrad.io/api/signal-outcomes
 *   curl -H "x-internal-job-token: $INTERNAL_JOB_TOKEN" https://www.solrad.io/api/admin/internal-auth-check
 */

const HEADER_NAME = "x-internal-job-token"

/**
 * Check if a request carries a valid internal job token.
 * Returns false if INTERNAL_JOB_TOKEN env var is not set.
 */
export function isInternalJob(req: Request): boolean {
  const token = process.env.INTERNAL_JOB_TOKEN
  if (!token) return false
  const header = req.headers.get(HEADER_NAME)
  return typeof header === "string" && header.length > 0 && header === token
}

/**
 * Build headers for internal service-to-service calls.
 * Includes x-internal-job-token if INTERNAL_JOB_TOKEN is set.
 */
export function internalJobHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...extra }
  const token = process.env.INTERNAL_JOB_TOKEN
  if (token) {
    headers[HEADER_NAME] = token
  }
  return headers
}

// Keep old name as alias for backward compat during migration
export const internalHeaders = internalJobHeaders

type AuthResult =
  | { ok: true; mode: "internal" | "ops" }
  | { ok: false; status: number; body: Record<string, unknown> }

/**
 * Require either internal job token OR ops password.
 * Returns { ok: true, mode } on success, or { ok: false, status, body } on failure.
 */
export function requireInternalJobOrOps(req: Request): AuthResult {
  // 1) Check internal job token
  if (isInternalJob(req)) {
    return { ok: true, mode: "internal" }
  }

  // 2) Check ops password (x-ops-password header)
  const opsPassword = process.env.OPS_PASSWORD
  if (opsPassword) {
    const opsHeader = req.headers.get("x-ops-password")
    if (typeof opsHeader === "string" && opsHeader === opsPassword) {
      return { ok: true, mode: "ops" }
    }
  }

  // 3) Neither matched
  return {
    ok: false,
    status: 401,
    body: {
      ok: false,
      error: "Unauthorized",
      hint: "missing internal token or ops password",
      hasInternalHeader: !!req.headers.get(HEADER_NAME),
      hasOpsHeader: !!req.headers.get("x-ops-password"),
    },
  }
}
