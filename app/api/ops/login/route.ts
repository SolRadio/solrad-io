import { type NextRequest, NextResponse } from "next/server"
import { verifyOpsPassword } from "@/lib/auth"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ success: false, error: "Password required" }, { status: 400 })
    }

    if (!verifyOpsPassword(password)) {
      return NextResponse.json({ success: false, error: "Invalid password" }, { status: 401 })
    }

    // Set httpOnly cookie for 7 days
    const cookieStore = await cookies()
    cookieStore.set("solrad_ops", "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] OPS login error:", error)
    return NextResponse.json({ success: false, error: "Login failed" }, { status: 500 })
  }
}
