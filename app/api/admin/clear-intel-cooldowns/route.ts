import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

export async function POST(request: Request) {
  const opsPassword = process.env.OPS_PASSWORD ?? process.env.ADMIN_PASSWORD
  const headerPassword = request.headers.get("x-ops-password")
  if (!opsPassword || headerPassword !== opsPassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Scan and delete all intel cooldown keys
    let cursor = 0
    let deleted = 0
    do {
      const [nextCursor, keys] = await kv.scan(cursor, {
        match: "solrad:intel:published:*",
        count: 100,
      })
      cursor = typeof nextCursor === "number" ? nextCursor : parseInt(nextCursor as string)
      if (keys.length > 0) {
        await Promise.all(keys.map((k) => kv.del(k as string)))
        deleted += keys.length
      }
    } while (cursor !== 0)

    return NextResponse.json({
      ok: true,
      deleted,
      message: `Cleared ${deleted} cooldown keys`,
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    )
  }
}
