import { NextResponse } from "next/server"
import { getHeldDurationLabel } from "@/lib/heldDuration"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const mint = searchParams.get("mint")

    if (!mint) {
      return NextResponse.json({ error: "Missing mint parameter" }, { status: 400 })
    }

    const label = await getHeldDurationLabel(mint)

    return NextResponse.json({ label })
  } catch (error) {
    console.error("[v0] Held duration API error:", error)
    return NextResponse.json({ label: null })
  }
}
