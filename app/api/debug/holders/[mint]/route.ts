import { getHolderConcentration } from "@/lib/quicknode"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ mint: string }> }
) {
  const { mint } = await params
  console.log("[DEBUG-HOLDERS] Testing QuickNode for:", mint)

  try {
    const result = await getHolderConcentration(mint)
    console.log("[DEBUG-HOLDERS] Result:", JSON.stringify(result))
    return NextResponse.json({
      mint,
      result,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error("[DEBUG-HOLDERS] Error:", err)
    return NextResponse.json(
      {
        mint,
        error: String(err),
        result: null,
      },
      { status: 500 }
    )
  }
}
