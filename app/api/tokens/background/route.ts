import { NextRequest, NextResponse } from "next/server"
import { getBackgroundTokens, getBackgroundCount } from "@/lib/background-tracker"

export async function GET(req: NextRequest) {
  // Require auth -- internal use only
  const authHeader = req.headers.get("authorization")
  if (authHeader !== "Bearer " + process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const tokens = await getBackgroundTokens()
    const count = await getBackgroundCount()

    return NextResponse.json({
      tokens,
      count,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
