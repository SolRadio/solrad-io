import { clerkClient } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (!ADMIN_SECRET || authHeader !== `Bearer ${ADMIN_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { userId, plan } = await req.json()

  if (!userId || !["pro", "free"].includes(plan)) {
    return NextResponse.json({ error: "Invalid request. Provide userId and plan ('pro' or 'free')." }, { status: 400 })
  }

  const client = await clerkClient()
  await client.users.updateUser(userId, {
    publicMetadata: { plan },
  })

  return NextResponse.json({ success: true, userId, plan })
}
