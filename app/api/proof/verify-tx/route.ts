import { NextRequest, NextResponse } from "next/server"
import { Connection } from "@solana/web3.js"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const signature = searchParams.get("sig")

  if (!signature) {
    return NextResponse.json(
      { error: "Missing sig parameter" },
      { status: 400 }
    )
  }

  try {
    const connection = new Connection(
      process.env.QUICKNODE_SOLANA_RPC_URL!,
      "confirmed"
    )

    const status = await connection.getSignatureStatus(signature)

    return NextResponse.json({
      signature,
      confirmed:
        status.value?.confirmationStatus === "confirmed" ||
        status.value?.confirmationStatus === "finalized",
      status: status.value?.confirmationStatus ?? null,
      err: status.value?.err ?? null,
      explorerUrl: "https://solscan.io/tx/" + signature,
    })
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    )
  }
}
