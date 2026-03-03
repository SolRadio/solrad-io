import crypto from "crypto"

function hashPair(a: string, b: string): string {
  const sorted = [a, b].sort()
  return crypto
    .createHash("sha256")
    .update(sorted[0] + sorted[1])
    .digest("hex")
}

export interface MerkleTree {
  leaves: string[]
  root: string
  depth: number
}

export function buildMerkleTree(signalHashes: string[]): MerkleTree {
  if (signalHashes.length === 0) {
    return {
      leaves: [],
      root: "0".repeat(64),
      depth: 0,
    }
  }

  let leaves = [...signalHashes]

  // Pad to even number
  if (leaves.length % 2 !== 0) {
    leaves.push(leaves[leaves.length - 1])
  }

  let currentLevel = leaves
  let depth = 0

  while (currentLevel.length > 1) {
    const nextLevel: string[] = []
    for (let i = 0; i < currentLevel.length; i += 2) {
      nextLevel.push(hashPair(currentLevel[i], currentLevel[i + 1]))
    }
    currentLevel = nextLevel
    depth++
  }

  return {
    leaves: signalHashes,
    root: currentLevel[0],
    depth,
  }
}

export function getMerkleProof(
  signalHashes: string[],
  targetHash: string
): string[] {
  let leaves = [...signalHashes]
  if (leaves.length % 2 !== 0) {
    leaves.push(leaves[leaves.length - 1])
  }

  const proof: string[] = []
  let index = leaves.indexOf(targetHash)
  if (index === -1) return []

  let currentLevel = leaves
  while (currentLevel.length > 1) {
    const siblingIndex = index % 2 === 0 ? index + 1 : index - 1
    proof.push(currentLevel[siblingIndex])

    const nextLevel: string[] = []
    for (let i = 0; i < currentLevel.length; i += 2) {
      nextLevel.push(hashPair(currentLevel[i], currentLevel[i + 1]))
    }
    currentLevel = nextLevel
    index = Math.floor(index / 2)
  }

  return proof
}
