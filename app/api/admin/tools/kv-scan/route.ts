export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { verifyOpsPasswordFromHeader } from "@/lib/auth-helpers"
import { storage } from "@/lib/storage"

// Known harvest/proof engine KV keys to scan
const KNOWN_KEYS = [
  "solrad:alpha:harvest",
  "solrad:alpha:harvest:lock",
  "solrad:alpha:harvest:last_run_at",
  "solrad:alpha:harvest:last_run_status",
  "solrad:alpha:harvest:last_error_at",
  "solrad:alpha:harvest:last_stage",
  "solrad:alpha:ledger:meta",
  "solrad:debug:proof_engine_diag:last",
  "solrad:blob:cooldown",
] as const

interface KeyResult {
  key: string
  exists: boolean
  value: string | null
  type: string
}

function truncate(val: unknown, max = 600): string {
  if (val === null || val === undefined) return "null"
  const s = typeof val === "string" ? val : JSON.stringify(val)
  return s.length > max ? s.slice(0, max) + `... (${s.length} chars)` : s
}

export async function GET(request: Request) {
  if (!verifyOpsPasswordFromHeader(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const t0 = Date.now()
  const results: KeyResult[] = []

  // Read all known keys in parallel
  const kvPromises = KNOWN_KEYS.map(async (key) => {
    try {
      const raw = await storage.get(key)
      const exists = raw !== null && raw !== undefined
      let parsed: unknown = raw
      // Try to parse stringified JSON
      if (typeof raw === "string") {
        try {
          parsed = JSON.parse(raw)
        } catch {
          parsed = raw
        }
      }
      return {
        key,
        exists,
        value: exists ? truncate(parsed) : null,
        type: exists ? typeof raw : "missing",
      }
    } catch (err) {
      return {
        key,
        exists: false,
        value: null,
        type: `error: ${err instanceof Error ? err.message : String(err)}`,
      }
    }
  })

  const settled = await Promise.all(kvPromises)
  results.push(...settled)

  return NextResponse.json(
    {
      ok: true,
      nowISO: new Date().toISOString(),
      durationMs: Date.now() - t0,
      keyCount: results.length,
      existingCount: results.filter((r) => r.exists).length,
      results,
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  )
}
