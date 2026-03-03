import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("solrad_ops")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] OPS logout error:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
