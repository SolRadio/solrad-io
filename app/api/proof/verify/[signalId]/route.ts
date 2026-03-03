import { NextRequest, NextResponse } from "next/server"
import { storage } from "@/lib/storage"
import { verifySignalProof } from "@/lib/proof/hash-signal"
import { getMerkleProof } from "@/lib/proof/merkle-tree"
import type { SignalProofInput } from "@/lib/proof/hash-signal"

interface StoredSignalProof {
  input: SignalProofInput
  sha256: string
  proofId: string
  date: string
}

interface StoredTreeData {
  date: string
  root: string
  leaves: string[]
  depth: number
  signalCount: number
  solanaTx: string
  explorerUrl: string
  publishedAt: number
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ signalId: string }> }
) {
  const { signalId } = await params

  try {
    // Look up signal proof data
    const proofData = (await storage.get(
      `solrad:proof:signal:${signalId}`
    )) as StoredSignalProof | null

    if (!proofData) {
      // Try lookup by entryHash
      const byHashKey = `solrad:proof:signal:byHash:${signalId}`
      const proofByHash = (await storage.get(byHashKey)) as StoredSignalProof | null

      if (proofByHash) {
        // Cast to include backfilled fields
        const record = proofByHash as StoredSignalProof & {
          solanaTx?: string
          solanaTxSignature?: string
          explorerUrl?: string
          merkleRoot?: string
          verified?: boolean
        }

        const treeData = (await storage.get(
          `solrad:proof:tree:${proofByHash.date}`
        )) as StoredTreeData | null

        // Also check publication record for Solana TX
        const publication = !treeData?.solanaTx && !record.solanaTx && !record.solanaTxSignature
          ? ((await storage.get(
              `solrad:proof:publication:${proofByHash.date}`
            )) as { solanaTxSignature?: string; explorerUrl?: string; merkleRoot?: string } | null)
          : null

        const merkleProof = treeData
          ? getMerkleProof(treeData.leaves, proofByHash.sha256)
          : []

        let verified = record.verified ?? false
        try {
          verified = verifySignalProof(proofByHash.input, proofByHash.sha256)
        } catch {
          // Backfilled records may not have proper input for hash verification
        }

        return NextResponse.json({
          verified: verified || !!record.verified,
          signalId,
          mint: proofByHash.input?.mint,
          detectedAt: proofByHash.input?.detectedAtUnix
            ? new Date(proofByHash.input.detectedAtUnix * 1000).toISOString()
            : null,
          entryPriceUsd: proofByHash.input?.entryPriceUsd,
          solradScore: proofByHash.input?.solradScore,
          signalType: proofByHash.input?.signalType,
          sha256: proofByHash.sha256,
          merkleRoot: treeData?.root || record.merkleRoot || publication?.merkleRoot || null,
          merkleProof,
          solanaTxSignature:
            treeData?.solanaTx ||
            record.solanaTx ||
            record.solanaTxSignature ||
            publication?.solanaTxSignature ||
            null,
          explorerUrl:
            treeData?.explorerUrl ||
            record.explorerUrl ||
            publication?.explorerUrl ||
            null,
          proofId: proofByHash.proofId,
        })
      }

      // Fallback: find entry in alpha ledger by entryHash, then find publication by date
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ledger = (await storage.get("solrad:alpha:ledger")) as any[] | null
      const ledgerEntry = Array.isArray(ledger)
        ? ledger.find((e) => e.entryHash === signalId)
        : null

      if (ledgerEntry) {
        const entryDate = (ledgerEntry.detectedAt ?? "").split("T")[0]
        const pubDate = new Date(
          new Date(entryDate + "T00:00:00Z").getTime() + 86400000
        )
          .toISOString()
          .split("T")[0]

        const publication = (await storage.get(
          `solrad:proof:publication:${pubDate}`
        )) as { solanaTxSignature?: string; explorerUrl?: string; merkleRoot?: string } | null

        if (publication) {
          return NextResponse.json({
            verified: true,
            signalId,
            mint: ledgerEntry.mint,
            detectedAt: ledgerEntry.detectedAt,
            entryPriceUsd: ledgerEntry.priceAtSignal,
            solradScore: ledgerEntry.scoreAtSignal,
            signalType: ledgerEntry.detectionType,
            sha256: ledgerEntry.entryHash,
            solanaTxSignature: publication.solanaTxSignature || null,
            explorerUrl: publication.explorerUrl || null,
            merkleRoot: publication.merkleRoot || null,
          })
        }
      }

      // Check if hash exists in daily arrays (today or yesterday)
      const todayStr = new Date().toISOString().split("T")[0]
      const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0]

      const [todayHashes, yesterdayHashes] = (await Promise.all([
        storage.get(`solrad:proof:daily:${todayStr}`),
        storage.get(`solrad:proof:daily:${yesterdayStr}`),
      ])) as [string[] | null, string[] | null]

      const allHashes = [...(todayHashes || []), ...(yesterdayHashes || [])]

      if (allHashes.includes(signalId)) {
        return NextResponse.json(
          {
            verified: false,
            pending: true,
            message: "Signal hashed and queued -- publishing to Solana at midnight UTC",
          },
          { status: 202 }
        )
      }

      return NextResponse.json(
        { error: "Signal proof not found" },
        { status: 404 }
      )
    }

    // Get the Merkle tree for that day
    const treeData = (await storage.get(
      `solrad:proof:tree:${proofData.date}`
    )) as StoredTreeData | null

    // Fallback: check publication record if tree has no solanaTx
    const pub = !treeData?.solanaTx
      ? ((await storage.get(
          `solrad:proof:publication:${proofData.date}`
        )) as { solanaTxSignature?: string; explorerUrl?: string; merkleRoot?: string } | null)
      : null

    // Also check if proof record itself has solanaTx (backfilled records)
    const proofRecord = proofData as StoredSignalProof & {
      solanaTx?: string
      explorerUrl?: string
      merkleRoot?: string
    }

    const merkleProof = treeData
      ? getMerkleProof(treeData.leaves, proofData.sha256)
      : []

    // Verify the hash
    const verified = verifySignalProof(proofData.input, proofData.sha256)

    return NextResponse.json({
      signalId,
      mint: proofData.input.mint,
      detectedAt: new Date(
        proofData.input.detectedAtUnix * 1000
      ).toISOString(),
      entryPriceUsd: proofData.input.entryPriceUsd,
      solradScore: proofData.input.solradScore,
      signalType: proofData.input.signalType,
      sha256: proofData.sha256,
      merkleRoot: treeData?.root || proofRecord.merkleRoot || pub?.merkleRoot || null,
      merkleProof,
      solanaTxSignature: treeData?.solanaTx || proofRecord.solanaTx || pub?.solanaTxSignature || null,
      explorerUrl: treeData?.explorerUrl || proofRecord.explorerUrl || pub?.explorerUrl || null,
      verified,
      proofId: proofData.proofId,
    })
  } catch (error) {
    console.error("[SOLRAD-PROOF] Verification failed:", error)
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    )
  }
}
