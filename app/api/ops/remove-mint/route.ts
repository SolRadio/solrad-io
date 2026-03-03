import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { removeTrackedMint } from "@/lib/blob-storage"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const opsCookie = cookieStore.get("solrad_ops")
    if (opsCookie?.value !== "1") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { mint } = body

    if (!mint || typeof mint !== "string") {
      return NextResponse.json({ success: false, error: "Mint address required" }, { status: 400 })
    }

    await removeTrackedMint(mint.toLowerCase())

    console.log(`[v0] Admin removed token: ${mint}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Remove mint error:", error)
    return NextResponse.json({ success: false, error: "Failed to remove token" }, { status: 500 })
  }
}
