import { NextRequest, NextResponse } from "next/server"
import { storage } from "@/lib/storage"
import { buildMerkleTree } from "@/lib/proof/merkle-tree"
import { publishProofToSolana } from "@/lib/proof/publish-to-solana"

export const maxDuration = 300

/**
 * KV key for the daily hash batch. Each day's signal hashes are stored
 * as a single array under this key (since storage adapter has no keys() scan).
 */
const DAILY_HASHES_KEY = (date: string) => `solrad:proof:daily:${date}`

export async function GET(req: NextRequest) {
  const ua = req.headers.get("user-agent") ?? ""
  const isVercelCron = ua.includes("vercel-cron")
  const cronSecret = process.env.CRON_SECRET ?? process.env.SOLRAD_CRON_SECRET

  if (!isVercelCron) {
    const authHeader = req.headers.get("authorization")
    if (!cronSecret) {
      return NextResponse.json(
        { ok: false, error: "CRON_SECRET not configured" },
        { status: 500 }
      )
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      )
    }
  }

  try {
    // Publish yesterday's signals at midnight UTC
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setUTCDate(yesterday.getUTCDate() - 1)
    const today = yesterday.toISOString().split("T")[0]

    // Guard: don't double-publish
    const existingPublication = await storage.get(`solrad:proof:publication:${today}`)
    if (existingPublication) {
      return NextResponse.json({
        ok: true,
        alreadyPublished: true,
        date: today,
        message: "Publication already exists for this date",
      })
    }

    // Read all signal hashes accumulated yesterday
    const dailyHashes = (await storage.get(DAILY_HASHES_KEY(today))) as string[] | null

    if (!dailyHashes || dailyHashes.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "No signals to prove today",
        date: today,
        signalCount: 0,
      })
    }

    // Deduplicate hashes (safety measure)
    const hashes = [...new Set(dailyHashes)]

    // Get previous root for chain continuity
    const prevRootKey = "solrad:proof:latest-root"
    const prevRoot = ((await storage.get(prevRootKey)) as string) || "0".repeat(64)

    // Build Merkle tree
    const tree = buildMerkleTree(hashes)

    // Publish to Solana
    const publication = await publishProofToSolana(
      tree.root,
      today,
      hashes.length,
      prevRoot
    )

    // Store the publication record (1 year TTL)
    await storage.set(
      `solrad:proof:publication:${today}`,
      publication,
      { ex: 60 * 60 * 24 * 365 }
    )

    // Update latest root pointer
    await storage.set(prevRootKey, tree.root)

    // Store full proof tree index for this date (1 year TTL)
    await storage.set(
      `solrad:proof:tree:${today}`,
      {
        date: today,
        root: tree.root,
        leaves: tree.leaves,
        depth: tree.depth,
        signalCount: hashes.length,
        solanaTx: publication.solanaTxSignature,
        explorerUrl: publication.explorerUrl,
        publishedAt: publication.publishedAt,
      },
      { ex: 60 * 60 * 24 * 365 }
    )

    console.log(
      `[SOLRAD-PROOF] Published ${hashes.length} signals | root: ${tree.root.slice(0, 16)}... | tx: ${publication.solanaTxSignature}`
    )

    return NextResponse.json({
      ok: true,
      date: today,
      signalCount: hashes.length,
      merkleRoot: tree.root,
      solanaTx: publication.solanaTxSignature,
      explorerUrl: publication.explorerUrl,
    })
  } catch (error) {
    console.error("[SOLRAD-PROOF] Publish failed:", error)
    return NextResponse.json(
      {
        ok: false,
        error: "Proof publication failed",
        details: String(error),
      },
      { status: 500 }
    )
  }
}
