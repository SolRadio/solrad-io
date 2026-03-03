import { NextResponse } from "next/server"
import { storage } from "@/lib/storage"

export async function GET() {
  try {
    const publications = []
    const today = new Date()

    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      const pub = await storage.get(
        `solrad:proof:publication:${dateStr}`
      )

      if (pub) {
        publications.push(pub)
      }
    }

    return NextResponse.json({
      publications,
      count: publications.length,
      latestRoot: await storage.get("solrad:proof:latest-root"),
    })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
