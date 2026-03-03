import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { password } = await request.json()
    
    // Get all possible admin passwords
    const opsPassword = process.env.OPS_PASSWORD
    const adminPassword = process.env.ADMIN_PASSWORD
    const adminAlertsPassword = process.env.ADMIN_ALERTS_PASSWORD
    
    // Trim provided password to avoid whitespace issues
    const trimmedPassword = password?.trim() || ""
    
    // Check if any password is configured
    if (!opsPassword && !adminPassword && !adminAlertsPassword) {
      return NextResponse.json({ error: "No admin passwords configured" }, { status: 500 })
    }

    // Check if provided password matches any configured password
    const isValid = 
      (opsPassword && trimmedPassword === opsPassword) ||
      (adminPassword && trimmedPassword === adminPassword) ||
      (adminAlertsPassword && trimmedPassword === adminAlertsPassword)

    if (isValid) {
      return NextResponse.json({ success: true })
    }

    // SAFE debug logs on failed auth (no secret values)
    console.log("[v0] Admin auth failed:", {
      hasOpsPassword: !!opsPassword,
      hasAdminPassword: !!adminPassword,
      hasAdminAlertsPassword: !!adminAlertsPassword,
      providedLength: password?.length || 0,
      providedTrimmedLength: trimmedPassword.length,
    })

    return NextResponse.json({ error: "Invalid password" }, { status: 401 })
  } catch (error) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
